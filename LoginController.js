'use strict'

let bcrypt = require('bcrypt')

let Controller = require('./Controller')
let Route      = require('./Route')

/**
 * Provides routes for authentication.
 */
class LoginController extends Controller {
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
			new Route('get,post', '/login',  this._onLogin .bind(this), 'Attempts to authenticate with the provided credentials.'),
			new Route('get,post', '/logout', this._onLogout.bind(this), 'Clears the existing session.')
		)
	}

	async _onLogin(ctx, next) {
		console.log(ctx)
		await this._authenticate(ctx,
			ctx.method === 'POST' ? ctx.request.body.email    : ctx.request.query.email,
			ctx.method === 'POST' ? ctx.request.body.password : ctx.request.query.password)
		return next()
	}

	async _onLogout(ctx, next) {
		if (ctx.session == null)
			ctx.throw(401)
		ctx.session = null
		ctx.status = 201
		return next()
	}

	/**
	 * Attempts to authenticate with the provided credentials.
	 */
	async _authenticate(ctx, email, password) {
		if (email === undefined || password === undefined)
			ctx.throw(400)

		// query database
		let users = await this._databaseConnectionFactory.query(this._databaseConnectionFactory.constructor.ROLE_APP, db =>
			db.query('SELECT id, email, name, password_hash, role FROM users WHERE email=' + db.escape(email)))

		// validate email
		if (!users.length)
			ctx.throw(404, 'User with email "' + email + '" not found')

		// validate password
		for (let user of users)
			// TODO: use async bcrypt
			if (bcrypt.compareSync(password, user.password_hash)) {
				// authenticated; update session
				ctx.session = Object.assign(user, {
					time: new Date
				})

				// redirect to authenticated user
				ctx.response.set('Location', ctx.state.baseUrl + '/' + this._table + '/' + user.id)
				ctx.status = 204
				return
			}

		// invalid password; clear session
		ctx.session = null
		ctx.throw(401, 'Incorrect password')
	}
}

module.exports = LoginController
