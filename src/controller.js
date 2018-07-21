'use strict'

/**
 * Provides routes for a specific set of functionality.
 */
export default class controller {
	/**
	 * @param {Array.<Route>} routes - The routes defined by this controller.
	 */
	constructor(routes) {
		/**
		 * The defined routes.
		 *
		 * @type {Array.<Route>}
		 */
		this._routes = routes || []
	}

	/**
	 * Returns the routes defined by this controller.
	 *
	 * @return {Array.<Route>} The defined routes.
	 */
	get routes() {
		return this._routes
	}
}
