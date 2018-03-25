'use strict'

import Controller from './Controller'
import Route from './Route'

/**
 * Provides routes for user registration.
 */
export default class RegistrationController extends Controller {
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
			new Route('post', '/register', this._onPost.bind(this), 'Registers a new account.')
		)
	}

	async _onPost(ctx, next) {
	}
}
