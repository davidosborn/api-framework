'use strict'

let PathPattern = require('./PathPattern')
let UrlUtils    = require('./UrlUtils')

/**
 * A route tree, or a node in a route tree.
 */
class RouteTree {
	/**
	 * @constructor
	 * @param {Array.<Route>} [routes] - An array of routes.
	 */
	constructor(routes) {
		/**
		 * The pattern routes that start at this node, indexed by their HTTP method.
		 * @type {Map.<String, Array.<RouteTree.PatternRoute>>}
		 */
		this.patternRoutesByMethod = new Map

		/**
		 * The routes that terminate at this node, indexed by their HTTP method.
		 * @type {Map.<String, Array.<Route>>}
		 */
		this.routesByMethod = new Map

		/**
		 * The child nodes that represent static path-segments.
		 * @type {Map.<String, RouteTree>}
		 */
		this.staticNodes = new Map

		// add routes
		if (routes !== undefined)
			for (let route of routes)
				this.add(route)
	}

	/**
	 * Adds a route to the tree.
	 * @param {Route} route - The route.
	 */
	add(route) {
		this._addRoute(route, PathPattern.parsePath(route.paramlessPath))
	}

	_addRoute(route, pathPattern) {
		// if this is the end of a static path, add the route
		if (pathPattern === undefined) {
			for (let method of route.methods.size ? route.methods : [undefined]) {
				let routes = this.routesByMethod.get(method)
				if (routes === undefined) {
					this.routesByMethod.set(method, routes = [])

					// include existing routes that support any method
					let anyMethodRoutes = this.routesByMethod.get()
					if (anyMethodRoutes !== undefined)
						routes.push(...anyMethodRoutes)
				}
				routes.push(route)
			}
			return
		}

		if (pathPattern.isPathSegmentPattern) {
			// add pattern route
			for (let method of route.methods.size ? route.methods : [undefined]) {
				let patternRoutes = this.patternRoutesByMethod.get(method)
				if (patternRoutes === undefined) {
					this.patternRoutesByMethod.set(method, patternRoutes = [])

					// include existing routes that support any method
					let anyMethodRoutes = this.patternRoutesByMethod.get()
					if (anyMethodRoutes !== undefined)
						patternRoutes.push(...anyMethodRoutes)
				}
				patternRoutes.push(new RouteTree.PatternRoute(pathPattern, route))
			}

			if (pathPattern.pathSegmentPatternType === PathPattern.PatternType.GLOBSTAR) {
				// add route to all static nodes, since globstar can match anything
				for (let node of this.staticNodes.values())
					node._addRoute(route, pathPattern)

				// match next path segment with static nodes
				if (pathPattern.nextPathPattern !== undefined) {
					if (pathPattern.nextPathPattern.isPathSegmentPattern) {
						for (let [pathSegment, node] of this.staticNodes)
							if (pathPattern.nextPathPattern.pathSegment.test(pathSegment))
								node._addRoute(route, pathPattern.nextPathPattern.nextPathPattern)
					}
					else {
						let node = this.staticNodes.get(pathPattern.nextPathPattern.pathSegment)
						if (node !== undefined)
							node._addRoute(route, pathPattern.nextPathPattern.nextPathPattern)
					}
				}
				else
					// add route to this node, since globstar can match nothing
					this._addRoute(route)
			}
			else {
				// match pattern with static nodes
				for (let [pathSegment, node] of this.staticNodes)
					if (pathPattern.pathSegment.test(pathSegment))
						node._addRoute(route, pathPattern.nextPathPattern)
			}
		}
		else {
			// add static node
			let node = this.staticNodes.get(pathPattern.pathSegment)
			if (node === undefined) {
				this.staticNodes.set(pathPattern.pathSegment, node = new RouteTree)

				// expand existing patterns into new node
				// TODO: use destructuring
				for (let [method, patternRoutes] of this.patternRoutesByMethod)
					for (let patternRoute of patternRoutes)
						if (patternRoute.pathPattern.pathSegmentPatternType === PathPattern.PatternType.GLOBSTAR) {
							// add globstar pattern to static node
							node._addRoute(patternRoute.route, patternRoute.pathPattern)

							// match next path segment with static node
							// TODO: implement
						}
						else
							// match pattern with static node
							if (patternRoute.pathPattern.pathSegment.test(pathPattern.pathSegment))
								node._addRoute(patternRoute.route, patternRoute.pathPattern.nextPathPattern)
			}

			// continue to path segment
			node._addRoute(route, pathPattern.nextPathPattern)
		}
	}

	/**
	 * Searches for a matching node in the tree.
	 *
	 * @param {String} method - The HTTP method.
	 * @param {String} path   - The path.
	 *
	 * @return {Array|Number} An array of matching routes, or an HTTP error status code. If a matching route has
	 * parameters, it will be returned as an array containing the route and its parameters.
	 */
	match(method, path) {
		let pathSegments = UrlUtils.splitPath(path)
		let routes = this._match(method, pathSegments)
		if (typeof routes !== 'number') {
			// log matches
			console.log('matched routes:')
			for (let route of routes)
				console.log('  ' + route.path)

			// include parameters with routes
			for (let i = 0; i < routes.length; ++i) {
				let route = routes[i]
				if (route.params !== undefined) {
					let params = new Map
					// TODO: handle globstar
					for (let j = 0; j < pathSegments.length; ++j) {
						let pathSegment = pathSegments[j]
						let paramName = route.params[j]
						if (paramName !== undefined) {
							// convert parameter to number when possible
							let paramValue = Number(pathSegment)
							if (isNaN(paramValue))
								paramValue = pathSegment

							params.set(paramName, paramValue)
						}
					}
					routes[i] = [route, params]
				}
			}
		}
		return routes
	}

	/**
	 * Performs recursive matching to support parameterized path-segments where there may be more than one match.
	 *
	 * @param {String}         method           - The HTTP method.
	 * @param {Array.<String>} pathSegments     - The path segments.
	 * @param {Number}         pathSegmentIndex - The index of the current path-segment.
	 *
	 * @return {Number|Object} An object containing the result, or an HTTP error status code.
	 *
	 * @private
	 */
	_match(method, pathSegments, pathSegmentIndex) {
		// TODO: use default argument
		if (pathSegmentIndex === undefined)
			pathSegmentIndex = 0

		// if there are no more path segments, look for a matching method
		if (pathSegmentIndex === pathSegments.length) {
			let routes = this.routesByMethod.get(method) || this.routesByMethod.get()
			return routes !== undefined ? routes : 405
		}

		let error = 404
		let pathSegment = pathSegments[pathSegmentIndex]

		// look for matching static path-segment
		let node = this.staticNodes.get(pathSegment)
		if (node !== undefined) {
			let result = node._match(method, pathSegments, pathSegmentIndex + 1)
			if (typeof result !== 'number')
				return result
			error = Math.max(result, error)
		}

		let path = pathSegments.slice(pathSegmentIndex).join('/')

		// look for matching pattern route
		let patternRoutes = this.patternRoutesByMethod.get(method) || this.patternRoutesByMethod.get()
		if (patternRoutes !== undefined) {
			let routes = []
			for (let patternRoute of patternRoutes)
				if (patternRoute.pathPattern.path.test(path))
					routes.push(patternRoute.route)
			if (routes.length > 0)
				return routes
		}

		// look for matching pattern route with different method
		if (error !== 405)
			for (let [patternRouteMethod, patternRoute] of this.patternRoutesByMethod)
				if (patternRouteMethod !== method && patternRouteMethod !== undefined)
					for (let patternRoute of patternRoutes)
						if (patternRoute.pathPattern.path.test(path)) {
							error = 405
							break
						}

		return error
	}
}

/**
 * A pattern and its associated route.
 */
RouteTree.PatternRoute = class {
	constructor(pathPattern, route) {
		/**
		 * A path pattern.
		 * @type {PathPattern}
		 */
		this.pathPattern = pathPattern

		/**
		 * A route.
		 * @type {Route}
		 */
		this.route = route
	}
}

module.exports = RouteTree
