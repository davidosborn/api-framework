'use strict'

import co from 'co'
import send from 'koa-send'
import UrlUtils from '../UrlUtils'

/**
 * Koa middleware for serving static content.
 */
export default function(root) {
	root = require('path').resolve(root)

	return async function(ctx, next) {
		// factor out mount path
		let path = UrlUtils.relativePath(UrlUtils.normalizePath(ctx.path), ctx.state.mountPath)

		/*let UrlUtils = require('./UrlUtils')
		let babel = require('babel-core')
		let fs = require('fs')
		let path = UrlUtils.urlToPath(ctx.url)
		babel.transform(fs.readFile(__dirname + '../client/include/*/

		if (await send(ctx, path, {root}) === undefined)
			return next()
	}
}
