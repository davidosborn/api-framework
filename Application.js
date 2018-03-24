'use strict'

let http    = require('http')
let Koa     = require('koa')
let Body    = require('koa-body')
let convert = require('koa-convert')
let Session = require('koa-session')
let ipc     = require('node-ipc')
let Socket  = require('socket.io')

let UrlUtils = require('./UrlUtils')

class Application extends Koa {
	/**
	 * @param {String} [app] - The short name of the application.
	 */
	constructor(app) {
		super()

		this.experimental = true

		// add body-parsing middleware
		this.use(convert(new Body))

		// add session middleware
		this.keys = ['P444hqW4MN', '8jb9t9qe1D', 'U8SdqBTM3B', '341Va58mHQ']
		this.use(convert(new Session(this, {
			httpOnly: false,
			key: 'session'
		})))

		// add middleware to detect base URL
		this.use((ctx, next) => {
			if (this._baseUrl === undefined) {
				let originalUrl = ctx.header['x-original-url'] || ctx.header['x-rewrite-url'] || ''
				this._baseUrl = originalUrl.endsWith(ctx.path) ? originalUrl.slice(0, -ctx.path.length) : ''
			}
			ctx.state.baseUrl = this._baseUrl
			return next()
		})

		// start WebSocket server
		this.io = new Socket

		// start IPC server
		ipc.serve(app)
		this.ipc = ipc.server
	}

	listen(...args) {
		let server = http.createServer(this.callback())
		this.io.attach(server)
		return server.listen(...args)
	}

	use(path, middleware) {
		// allow non-trailing optional-arguments
		if (arguments.length === 1) {
			path       = undefined
			middleware = arguments[0]
		}

		// allow passing an array of middlewares
		if (_.isArray(middleware)) {
			for (let fn of middleware)
				this.use(path, fn)
			return
		}

		// limit middleware to path
		if (path !== undefined) {
			path = UrlUtils.normalizePath(path)
			middleware = (function(middleware) {
				return function(ctx, next) {
					if (ctx.path.startsWith(path)) {
						// provide mount path to middleware
						// TODO: this might be slow
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
					else return next()
				}
			})(middleware)
		}

		Koa.prototype.use.call(this, middleware)
	}
}

module.exports = Application
