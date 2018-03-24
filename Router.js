'use strict'

let compose     = require('koa-compose')
let SortedArray = require('sorted-array')

let Controller = require('./Controller')
let Route      = require('./Route')
let RouteTree  = require('./RouteTree')
let UrlUtils   = require('./UrlUtils')

/**
 * A router.
 */
class Router extends Controller {
	constructor() {
		super()

		/**
		 * Koa middleware for processing HTTP requests.
		 *
		 * @type {Function}
		 * @private
		 */
		this._middleware = undefined

		/**
		 * An index of the defined routes.
		 *
		 * @type {RouteTree}
		 * @private
		 */
		this._routeTree = undefined

		/**
		 * The defined routes, ordered alphabetically by path.
		 *
		 * @type {SortedArray.<Route>}
		 * @private
		 */
		this._sortedRoutes = undefined
	}

	/**
	 * @function
	 * Defines one or more routes.
	 *
	 * @param {String}                 [path]     - The mount path.
	 * @param {Array|Controller|Route} middleware - Koa middleware.
	 *
	 * @function
	 * Defines a route.
	 *
	 * @param {Array|String} [methods]     - The HTTP method(s) supported by the route.
	 * @param {String}       [path]        - The path.
	 * @param {Function}     middleware    - Koa middleware.
	 * @param {String}       [description] - A description of the route.
	 */
	use(path, middleware) {
		// allow non-trailing optional-arguments
		switch (arguments.length) {
			case 1:
				path       = undefined
				middleware = arguments[0]
				break

			case 2:
				break

			default:
				return this.use(new Route(...arguments))
		}

		// add routes
		if (middleware instanceof Route) {
			let route = middleware
			if (path !== undefined) {
				path = UrlUtils.normalizePath(path)
				route = new Route(route.methods, UrlUtils.joinPath(path, route.path), route.middleware, route.description)

				// provide mount path to middleware
				// TODO: this might be slow
				route.middleware = (function(middleware) {
					return function(ctx, next) {
						ctx.state.mountPath = path
						try {
							return middleware(ctx, function() {
								delete ctx.state.mountPath
								try {
									return next()
								}
								catch (err) {
									ctx.state.mountPath = path
									throw err
								}
							})
						}
						finally {
							delete ctx.state.mountPath
						}
					}
				})(route.middleware)
			}
			this._routes.push(route)

			// update compiled data
			if (this._routeTree !== undefined)
				this._routeTree.add(route)
			if (this._sortedRoutes !== undefined)
				this._sortedRoutes.insert(route)
		}
		else if (middleware instanceof Controller) {
			let controller = middleware
			for (let route of controller.routes)
				this.use(path, route)
		}
		else if (_.isArray(middleware)) {
			let routes = middleware
			for (let route of routes)
				this.use(path, route)
		}
		else this.use(path, new Route(...arguments))
	}

	/**
	 * Returns Koa middleware for processing HTTP requests.
	 *
	 * @return {Function} Koa middleware.
	 */
	get middleware() {
		if (this._middleware === undefined)
			this._middleware = (ctx, next) => {
				// log HTTP request
				console.log(ctx.method + ' ' + ctx.path)

				// interpret HEAD as GET for routing
				let method = ctx.method
				if (method === 'HEAD')
					method = 'GET'

				// normalize path and factor out mount path
				let path = UrlUtils.relativePath(UrlUtils.normalizePath(ctx.path), ctx.state.mountPath)

				// match request with route tree
				if (this._routeTree === undefined) {
					this._routeTree = new RouteTree(this._routes)
					console.log(require('util').inspect(this._routeTree, {depth: null}))
				}
				let result = this._routeTree.match(method, path)
				if (typeof result === 'number')
					ctx.throw(result)
				let routes = result

				// call routes
				// TODO: this might be slow
				return compose(routes.map(function(route) {
					if (_.isArray(route)) {
						let [route, params] = route
						return function(ctx, next) {
							ctx.state.params = params
							try {
								return route.middleware(ctx, function() {
									delete ctx.state.params
									try {
										return next()
									}
									catch (err) {
										ctx.state.params = params
										throw err
									}
								}, ...params.values())
							}
							finally {
								delete ctx.state.params
							}
						}
					}
					else return route.middleware
				}))(ctx, next)
			}
		return this._middleware
	}

	/**
	 * Returns the defined routes, ordered alphabetically by path.
	 *
	 * @return {Array.<Route>} The defined routes.
	 */
	get sortedRoutes() {
		if (this._sortedRoutes === undefined)
			this._sortedRoutes = new SortedArray(this._routes, (a, b) =>
				a.path.localeCompare(b.path) ||
				[...a.methods].join(',').localeCompare([...b.methods].join(',')))
		return this._sortedRoutes.array
	}
}

module.exports = Router
