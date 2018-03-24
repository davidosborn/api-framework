'use strict'

let Controller = require('./Controller')
let Route      = require('./Route')

/**
 * Provides a route for registering to receive notifications.
 */
class NotificationController extends Controller {
	constructor() {
		super()

		this._routes.push(
			new Route('post', '/notify', this._onPost.bind(this), 'Registers to receive notifications.')
		)
	}

	async _onPost(ctx, next) {
	}
}

module.exports = NotificationController
