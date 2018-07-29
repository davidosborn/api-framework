'use strict'

import EventEmitter from 'events'
import _ from 'lodash'
import mysql from 'mysql'
import DatabaseUtils from './database-utils'
import Promise from './promise' // Promise.promisify

/**
 * Provides access to the database.
 */
export default class DatabaseConnectionFactory extends EventEmitter {
	/**
	 * A role representing an anonymous user.
	 *
	 * @constant
	 */
	static ROLE_ANONYMOUS = 'anon'

	/**
	 * A role representing the application.
	 *
	 * @constant
	 */
	static ROLE_APP = 'app'

	/**
	 * Creates an instance of the factory.
	 *
	 * @param {String} database - The name of the database.
	 * @param {Object} [options] - The additional options.
	 * @param {Boolean} [options.logSql=false] - A value indicating whether to log the SQL queries.
	 */
	constructor(database, options = {}) {
		super()

		/**
		 * The name of the database.
		 *
		 * @type {String}
		 */
		this.database = database

		/**
		 * A value indicating whether to log the SQL queries.
		 *
		 * @type {Boolean}
		 */
		this.logSql = !!options.logSql
	}

	/**
	 * Opens a database connection.
	 *
	 * @param {Context|String} [role] - The role under which to open the database connection. If a Koa context is
	 *                                  provided, the role will be that of the authenticated user. Defaults to the role
	 *                                  of an anonymous user.
	 *
	 * @return {Promise.<DatabaseConnection>} A promise for the database connection.
	 */
	connect(role, callback) {
		let connection = mysql.createConnection({
			database: this.database,
			host:     'localhost',
			password: 'password',
			user:     this._getUser(role)
		})

		// promisify connection
		connection.connect = Promise.promisify(connection.connect)
		connection.query   = Promise.promisify(connection.query)

		// modify query behaviour
		let factory = this
		connection.query = (function(impl) {
			return async function(sql) {
				// log query
				if (factory.logSql)
					console.log(sql)

				// execute query
				let result = await impl.apply(this, arguments)

				// emit change notifications
				if (result.affectedRows) {
					let matches = /^\s*((DELETE)\s+FROM\s+(\S+)|(INSERT)\s+INTO\s+(\S+)|(UPDATE)\s+(\S+))/i.exec(sql)
					if (matches != null) {
						let [type, table] = matches.slice(2).filter(x => x)
						if (table) {
							type = type.toLowerCase()
							if (type !== 'update' || result.changedRows) // ignore updates that don't change anything
								factory.emit('change', {
									affectedRows: result.affectedRows,
									changedRows:  result.changedRows,
									database:     factory.database,
									insertId:     result.insertId,
									table:        table.replace(/[`"]/g, ''),
									type:         type
								})
						}
					}
				}

				return result
			}
		})(connection.query)

		// return promise for connection
		return connection.connect().then(() => connection)
	}

	/*getPrivileges(role = NULL) {
		pdo = this.getConnection(cfg.APP, 'app')
		switch (pdo.getAttribute(PDO::ATTR_DRIVER_NAME)) {
			case 'mysql':
				user = cfg.APP + '_' + role
				stmt = pdo.prepare('SELECT user FROM user WHERE user LIKE :user')
				stmt.execute([':user' => user])
				foreach (stmt.fetchAll(PDO::FETCH_ASSOC) as row) {

				}
				break

			default:
				throw new BadMethodCallException('Roles have not been implemented for this driver')
		}
	}*/

	/**
	 * Opens a temporary database connection.
	 *
	 * The callback will receive the connection and be able execute queries. The connection will be closed when the
	 * callback returns, unless it returns a promise, in which case the connection will be closed when the promise
	 * resolves. Errors that occur in the callback will be transferred to the context using
	 * {@link DatabaseUtils.throwError}.
	 *
	 * @param {Context} ctx - A Koa context.
	 *
	 * @param {Function|String} callback - A callback for the database connection. Alternatively, a SQL query can be
	 *                                     provided, which will be executed in place of the callback.
	 *
	 * @param {String} [role] - The role under which to open the database connection. Defaults to the role of the
	 *                          authenticated user.
	 *
	 * @return {Promise} A promise for the result of the callback.
	 */
	query(ctx, callback, role) {
		// allow passing SQL query in place of callback
		if (_.isString(callback)) {
			let sql = callback
			callback = connection => connection.query(sql)
		}

		// open connection
		let promise = this.connect(role || ctx)
			.then(connection => {
				try {
					return callback(connection)
				}
				finally {
					connection.end()
				}
			})

		// handle errors in callback
		if (!_.isString(ctx))
			promise.catch(error => DatabaseUtils.throwError(error, ctx))

		return promise
	}

	/**
	 * Returns the database user for a role.
	 *
	 * @param {Context|String} [role] - A role. If a Koa context is provided, the role will be that of the authenticated
	 *                                  user. Defaults to the role of an anonymous user.
	 *
	 * @return {String} A database user.
	 *
	 * @private
	 */
	_getUser(role) {
		// normalize role
		role = (
			role === undefined ? DatabaseConnectionFactory.ROLE_ANONYMOUS :
			_.isString(role) ? role :
			role.session !== undefined && role.session.role != null ? role.session.role :
			DatabaseConnectionFactory.ROLE_ANONYMOUS
		)

		return this.database + '_' + role
	}
}
