'use strict'

import Controller from './Controller'
import Route from './Route'
import UrlUtils from './UrlUtils'

/**
 * Provides API documentation.
 */
export default class ApiDocController extends Controller {
	constructor(router, title) {
		super()

		/**
		 * The router whose API will be documented.
		 *
		 * @type {Router}
		 *
		 * @private
		 */
		this._router = router

		this._routes.push(
			new Route('get', '/', 'Returns this documentation of the REST API.', async function(ctx, next) {
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
		<h1>@TITLE</h1>
		<table>
			<thead>
				<tr>
					<th>Method</th>
					<th>Path</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>
				@CONTENT
			</tbody>
		</table>
	</body>
</html>`

				// create table content
				let content = ''
				for (let route of router.sortedRoutes) {
					let methods = [...route.methods].join(',')
					let path = route.path

					// prepend base URL and mount path
					path = UrlUtils.joinPath(ctx.state.baseUrl, path)

					// convert path to link
					if ((route.methods.has('GET') || !route.methods.size) && !route.params && !route.isPathPattern)
						path = `<a href="${path}">${path}</a>`

					content += `<tr>
					<td>${methods}</td>
					<td>${path}</td>
					<td>${route.description || ''}</td>
				</tr>`
				}

				// replace tokens in HTML template
				let tokens = [
					['TITLE', title],
					['CONTENT', content]
				]
				for (let token of tokens)
					html = html.replace('@' + token[0], token[1])

				// build response
				ctx.body = html
				return next()
			})
		)
	}
}
