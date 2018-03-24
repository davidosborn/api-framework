'use strict'

let Controller = require('./Controller')
let Route      = require('./Route')

/**
 * Provides routes for user registration.
 */
class RegistrationController extends Controller {
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

module.exports = RegistrationController
