'use strict'

import Controller from './controller'
import Route from './route'

/**
 * A controller that provides a route for executing arbitrary SQL queries.
 */
export default class DatabaseQueryController extends Controller {
	/**
	 * Creates a new instance.
	 * @param {DatabaseConnectionFactory} db The database.
	 */
	constructor(db) {
		super()

		/**
		 * The database that the controller provides access to.
		 * @type {Database}
		 * @private
		 */
		this._db = db

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
