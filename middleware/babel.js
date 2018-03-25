'use strict'

import babel from 'babel-core'
import fs from 'fs'
import UrlUtils from '../UrlUtils'

/**
 * Koa middleware for transpiling JavaScript code with Babel.
 */
export default function(options) {
	return async function(ctx, next) {
		await next()

		if (ctx.body !== undefined) {
			// convert stream into string
			if (ctx.body instanceof fs.ReadStream)
				ctx.body = await new Promise(function(resolve, reject) {
					let chunks = []
					ctx.body.on('data', function(data) {
						chunks.push(data)
					})
					ctx.body.on('end', function() {
						resolve(Buffer.concat(chunks).toString())
					})
					ctx.body.on('error', reject)
				})

			// transpile code with Babel
			ctx.body = babel.transform(ctx.body, options).code
		}
	}
}
