'use strict'

import bluebird from 'bluebird'
import fs from 'fs'
import UrlUtils from '../UrlUtils'

//fs = bluebird.promisifyAll(fs)

/**
 * Koa middleware to serve a directory index.
 */
export default function(root, title) {
	root = require('path').resolve(root)

	return async function(ctx, next) {
		// factor out mount path
		let path = UrlUtils.relativePath(UrlUtils.normalizePath(ctx.path), ctx.state.mountPath)

		let rootPath = root + path

		// check if path points to a directory
		let stat
		try {
			stat = await fs.statAsync(rootPath)
		}
		catch (err) {
			return next()
		}
		if (!stat.isDirectory())
			return next()

		// find files in directory
		let files = await fs.readdirAsync(rootPath)

		// create HTML template
		let html = `<!DOCTYPE html>
<html>
	<head>
		<title>@TITLE</title>
		<style>
			table {
				margin-left: 1rem;
			}
			td:not(:first-of-type),
			th:not(:first-of-type) {
				padding-left: 1rem;
			}
			th {
				text-align: left;
			}
		</style>
	</head>
	<body>
		<h1>Index of @DIR</h1>
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Last modified</th>
					<th>Size</th>
				</tr>
			</thead>
			<tbody>
				@CONTENT
			</tbody>
		</table>
	</body>
</html>`

		// include up directory
		if (path !== '/')
			files.unshift('..')

		// create table content
		let content = ''
		for (let file of files) {
			// get file information
			let stat = await fs.statAsync(rootPath + '/' + file)

			// convert path to link
			let url = UrlUtils.joinPath(ctx.state.baseUrl, ctx.path, file)
			let link = `<a href="${url}">${file}</a>`

			content += `<tr>
				<td>${link}</td>
				<td>${stat.mtime}</td>
				<td>${stat.size}</td>
			</tr>`
		}

		// replace tokens in HTML template
		let tokens = [
			['CONTENT', content],
			['DIR', ctx.path],
			['TITLE', title]
		]
		for (let token of tokens)
			html = html.replace('@' + token[0], token[1])

		// build response
		ctx.body = html
	}
}
