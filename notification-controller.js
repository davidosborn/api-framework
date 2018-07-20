'use strict'

import Controller from './controller'
import Route from './route'

/**
 * Provides a route for registering to receive notifications.
 */
export default class NotificationController extends Controller {
	constructor() {
		super()

		this._routes.push(
			new Route('post', '/notify', this._onPost.bind(this), 'Registers to receive notifications.')
		)
	}

	async _onPost(ctx, next) {
	}
}
