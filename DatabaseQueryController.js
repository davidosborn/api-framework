'use strict'

let Controller = require('./Controller')
let Route      = require('./Route')

/**
 * Provides a route for executing arbitrary SQL queries.
 */
class DatabaseQueryController extends Controller {
	constructor(databaseConnectionFactory) {
		super()

		/**
		 * The database that the controller provides access to.
		 *
		 * @type {Database}
		 *
		 * @private
		 */
		this._databaseConnectionFactory = databaseConnectionFactory

		this._routes.push(
			new Route('post', '/query', this._onPost.bind(this), 'Executes an arbitrary SQL query.')
		)
	}

	async _onPost(ctx, next) {
		// query database
		let result = await this._databaseConnectionFactory.query(ctx, ctx.request.body.sql)

		// build response
		ctx.body = JSON.stringify(result)
		ctx.status = 200
		return next()
	}
}

module.exports = DatabaseQueryController
