'use strict'

import isGeneratorFunction from 'is-generator-function'
import PathPattern from './PathPattern'
import UrlUtils from './UrlUtils'

/**
 * A route.
 */
export default class Route {
	/**
	 * @param {Array|String} [methods]     - The HTTP method(s) supported by the route.
	 * @param {String}       [path]        - The path.
	 * @param {Function}     middleware    - Koa middleware.
	 * @param {String}       [description] - A description of the route.
	 */
	constructor(methods, path, middleware, description) {
		// allow non-trailing optional-arguments
		switch (arguments.length) {
			case 1:
				methods    = undefined
				path       = undefined
				middleware = arguments[0]
				break

			case 2:
				if (_.isString(arguments[0])) {
					methods    = undefined
					path       = arguments[0]
					middleware = arguments[1]
				}
				else {
					methods     = undefined
					path        = undefined
					middleware  = arguments[0]
					description = arguments[1]
				}
				break
		}

		// normalize methods
		if (methods == null)
			methods = []
		else if (_.isString(methods))
			methods = methods.split(',')
		else if (!_.isArray(methods))
			methods = [...methods]
		methods.sort()
		methods = new Set(methods.map(x => x.toUpperCase()))

		// normalize path
		if (path == null)
			path = '**'
		path = UrlUtils.normalizePath(path)

		// allow passing middleware and description in alternate order
		if (_.isString(middleware) && (_.isFunction(description) || isGeneratorFunction(description))) {
			let tmp = middleware
			middleware = description
			description = tmp
		}

		// extract parameters from path
		let params
		let paramlessPath
		if (path.indexOf(':') !== -1) {
			let pathSegments = UrlUtils.splitPath(path)
			params = new Array(pathSegments.length)
			for (let i = 0; i < pathSegments.length; ++i) {
				let pathSegment = pathSegments[i]
				let paramIndex = pathSegment.lastIndexOf(':')
				let param
				if (paramIndex !== -1) {
					param = pathSegment.slice(paramIndex + 1)
					// parameters are positive integers by default
					pathSegment = paramIndex !== 0 ? pathSegment.slice(0, paramInsdex) : '(\\d+)'
				}
				params[i] = param
				pathSegments[i] = pathSegment
			}
			paramlessPath = '/' + pathSegments.join('/')
		}
		else paramlessPath = path

		/**
		 * A description of the route.
		 * @type {String}
		 */
		this.description = description

		/**
		 * The unique id of the route, which is greater than that of the previous route.
		 * @type {Number}
		 */
		this.id = (Route._nextId !== undefined ? Route._nextId++ : Route._nextId = 0)

		/**
		 * True if the path contains a pattern.
		 * @type {Boolean}
		 */
		this.isPathPattern = PathPattern.isPattern(path)

		/**
		 * The HTTP methods supported by the route. If empty, all HTTP methods are supported.
		 * @type {Set}
		 */
		this.methods = methods

		/**
		 * Koa middleware to process HTTP requests for the route.
		 * @type {Function}
		 */
		this.middleware = middleware

		/**
		 * The URL path of the route, without parameters.
		 */
		this.paramlessPath = paramlessPath

		/**
		 * The parameter that has been defined for each segment of the path. If a path segment has no parameter, its
		 * entry will be undefined. If no parameters have been defined, this property will be undefined.
		 *
		 * @type {Array.<String>}
		 */
		this.params = params

		/**
		 * The URL path of the route.
		 * @type {String}
		 */
		this.path = path
	}
}
