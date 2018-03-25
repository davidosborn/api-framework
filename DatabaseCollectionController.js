'use strict'

import CollectionController from './CollectionController'
import DatabaseConnectionFactory from './DatabaseConnectionFactory'
import DatabaseUtils from './DatabaseUtils'

/**
 * Provides routes to access a collection.
 */
export default class DatabaseCollectionController extends CollectionController {
	/**
	 * @param {DatabaseConnectionFactory} databaseConnectionFactory
	 * @param {String}                    table
	 * @param {Object}                    [options]
	 * @param {Array.<String>}            [options.columns]        - The columns that should be exposed.
	 * @param {Array.<String>}            [options.excludeColumns] - The columns that should be hidden.
	 */
	constructor(databaseConnectionFactory, table, options) {
		super(table)

		/**
		 * The database that the controller provides access to.
		 *
		 * @type {Database}
		 *
		 * @private
		 */
		this._databaseConnectionFactory = databaseConnectionFactory

		/**
		 * The database table that the controller provides access to.
		 *
		 * @type {String}
		 *
		 * @private
		 */
		this._table = table

		if (options === undefined)
			options = {}

		// parse "columns" option
		if (options.columns !== undefined) {
			/**
			 * The columns that the controller provides access to.
			 *
			 * @type {Array.<String>}
			 *
			 * @private
			 */
			this._columns = options.columns.map(column => column.toLowerCase())

			// include "id" column, even if not specified
			if (this._columns.indexOf('id') === -1)
				this._columns.unshift('id')
		}

		// parse "excludeColumns" option
		if (options.excludeColumns !== undefined) {
			let excludeColumns = options.excludeColumns.map(column => column.toLowerCase())

			// ensure "id" column is not excluded
			if (excludeColumns.indexOf('id') !== -1)
				throw new Error('The id column cannot be excluded')

			// get available columns from schema if not known
			if (this._columns === undefined)
				this._columns = this._databaseConnectionFactory.connect(DatabaseConnectionFactory.ROLE_APP, db =>
					db.query('SELECT column_name FROM information_schema.columns WHERE table_schema=(SELECT DATABASE()) AND table_name=' + db.escape(this._table))
						.then(result => result.map(row => row.column_name.toLowerCase())))

			// remove excluded columns
			this._columns = Promise.resolve(this._columns).then(columns => {
				return columns.filter(column => excludeColumns.indexOf(column) === -1)
			})
		}

		if (this._columns === undefined)
			this._columns = Promise.resolve(undefined)

		// parse "notifier" option
		if (options.notificationCallback !== undefined)
			/**
			 *
			 */
			this._notifier = options.notifier
	}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	async _onDelete(ctx, next) {
		// execute database query
		// TODO: Babel does not currently support lexical this in arrow functions during async/await
		await this._databaseConnectionFactory.connect(ctx, (function(db) {
			return db.query('TRUNCATE TABLE ' + db.escapeId(this._table))
		}).bind(this))

		// send change notification
		socket.notify('db_change', 'delete', this._table)

		ctx.status = 204
		return next()
	}

	async _onDeleteItem(ctx, next, id) {
		// execute database query
		// TODO: Babel does not currently support lexical this in arrow functions during async/await
		let result = await this._databaseConnectionFactory.connect(ctx, (function(db) {
			return db.query('DELETE FROM ' + db.escapeId(this._table) + ' WHERE id=' + db.escape(id))
		}).bind(this))

		// validate result
		if (!result.affectedRows)
			ctx.throw(404, 'Item with id "' + id + '" not found')

		// build response
		ctx.status = 204
		return next()
	}

	async _onGet(ctx, next) {
		// execute database query
		// TODO: Babel does not currently support lexical this in arrow functions during async/await
		let result = await this._databaseConnectionFactory.connect(ctx, (async function(db) {
			// select columns
			let columns = await this._getColumns(ctx)
			columns = columns ? db.escapeId(columns) : '*'

			// build query
			let sql = 'SELECT ' + columns + ' FROM ' + db.escapeId(this._table)

			// select ranges
			let ranges = DatabaseCollectionController._getRanges(ctx)
			if (ranges.length) {
				sql = ranges.map(range => sql + ' LIMIT ' + (range[0] ? range[0] + ',' + range[1] : range[1]))
				sql = sql.length > 1 ? sql.map(sql => '(' + sql + ')').join(' UNION ') : sql[0]
			}

			return db.query(sql)
		}).bind(this))

		// build response
		ctx.body = JSON.stringify(result)
		ctx.type = 'json'
		return next()
	}

	async _onGetCount(ctx, next) {
		// execute database query
		// TODO: Babel does not currently support lexical this in arrow functions during async/await
		let result = await this._databaseConnectionFactory.connect(ctx, (function(db) {
			return db.query('SELECT COUNT(*) FROM ' + db.escapeId(this._table))
		}).bind(this))

		// build response
		ctx.body = JSON.stringify(result[0]['COUNT(*)'])
		ctx.type = 'json'
		return next()
	}

	async _onGetItem(ctx, next, id) {
		// execute database query
		// TODO: Babel does not currently support lexical this in arrow functions during async/await
		let result = await this._databaseConnectionFactory.connect(ctx, (async function(db) {
			// select columns
			let columns = await this._getColumns(ctx)
			columns = columns ? db.escapeId(columns) : '*'

			return db.query('SELECT ' + columns + ' FROM ' + db.escapeId(this._table) + ' WHERE id=' + db.escape(id))
		}).bind(this))

		// validate result
		if (!result.length)
			ctx.throw(404, 'Item with id "' + id + '" not found')

		// build response
		ctx.body = JSON.stringify(result[0])
		ctx.type = 'json'
		return next()
	}

	async _onGetSchema(ctx, next) {
		// execute database query
		// TODO: Babel does not currently support lexical this in arrow functions during async/await
		let result = await this._databaseConnectionFactory.connect(ctx, (async function(db) {
			let sql =
				'SELECT column_name,column_type,column_key,extra' +
				' FROM information_schema.columns' +
				' WHERE table_schema=(SELECT DATABASE()) AND table_name=' + db.escape(this._table)

			// select columns
			let columns = await this._getColumns(ctx)
			if (columns)
				sql += ' AND column_name IN (' + db.escape(columns) + ')'

			return db.query(sql)
		}).bind(this))

		// build response
		ctx.body = JSON.stringify(result)
		ctx.type = 'json'
		return next()
	}

	async _onPost(ctx, next) {
		// execute database query
		// TODO: Babel does not currently support lexical this in arrow functions during async/await
		let result = await this._databaseConnectionFactory.connect(ctx, (function(db) {
			return db.query(
				'INSERT INTO ' + db.escapeId(this._table) +
				' (' + db.escapeId(Object.keys(ctx.request.body)) + ')' +
				' VALUES (' + db.escape(_.values(ctx.request.body)) + ')')
		}).bind(this))

		// build response
		ctx.response.set('Location', ctx.state.baseUrl + '/' + this._table + '/' + result.insertId)
		ctx.status = 201
		return next()
	}

	async _onPostItem(ctx, next, id) {
		// if no POST parameters are provided, simply validate the item's existence
		if (_.isEmpty(ctx.request.body)) {
			// execute database query
			// TODO: Babel does not currently support lexical this in arrow functions during async/await
			let result = await this._databaseConnectionFactory.connect(ctx, (function(db) {
				return db.query('SELECT COUNT(1) FROM ' + db.escapeId(this._table) + ' WHERE id=' + db.escape(id))
			}).bind(this))

			// validate result
			if (!result[0]['COUNT(1)'])
				ctx.throw(404, 'Item with id "' + id + '" not found')
		}
		// otherwise, update the item's fields
		else {
			// execute database query
		// TODO: Babel does not currently support lexical this in arrow functions during async/await
			let result = await this._databaseConnectionFactory.connect(ctx, (function(db) {
				return db.query(
					'UPDATE ' + db.escapeId(this._table) +
					' SET ' + db.escape(ctx.request.body) +
					' WHERE id=' + db.escape(id))
			}).bind(this))

			// validate result
			if (!result.affectedRows)
				ctx.throw(404, 'Item with id "' + id + '" not found')
		}

		// build response
		ctx.status = 204
		return next()
	}

	async _onPutItem(ctx, next, id) {
		// prepare item
		let item = ctx.request.body
		if (!('id' in item))
			(item = Object.assign({}, item)).id = id

		// execute database query
		// TODO: Babel does not currently support lexical this in arrow functions during async/await
		let result = await this._databaseConnectionFactory.connect(ctx, (function(db) {
			return db.query(
				'INSERT INTO ' + db.escapeId(this._table) + ' (' + db.escapeId(Object.keys(item)) + ')' +
				' VALUES (' + db.escape(_.values(item)) + ')' +
				' ON DUPLICATE KEY UPDATE ' + Object.keys(item).map(column => db.escapeId(column) + '=' + db.escapeId(column)))
		}).bind(this))

		// build response
		if (result.affectedRows === 1) {
			ctx.response.set('Location', ctx.state.baseUrl + '/' + this._table + '/' + id)
			ctx.status = 201
		}
		else ctx.status = 204
		return next()
	}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Returns the columns specified in the HTTP request and exposed by the controller.
	 *
	 * @return {Array.<String>} An array of columns.
	 */
	async _getColumns(ctx) {
		let columns = await this._columns
		if (ctx.query.columns) {
			let requestColumns = ctx.query.columns.map(column => column.toLowerCase())
			columns = columns ? requestColumns.filter(column => columns.indexOf(column) !== -1) : requestColumns
		}
		return columns
	}

	/**
	 * Returns the ranges specified in the HTTP request.
	 *
	 * @return {Array.<Array>} An array of arrays, each containing the index and count of a range.
	 */
	static _getRanges(ctx) {
		// get range from query string or Range header
		let rangeString
		if (ctx.query.range !== undefined)
			rangeString = ctx.query.range
		else if (ctx.header.range !== undefined) {
			let [key, value] = ctx.header.range.split('=')
			if (key !== 'items' || !value)
				ctx.throw(400, 'Invalid Range header')
			rangeString = value
		}

		// parse range string
		let ranges = []
		if (rangeString)
			for (let range of rangeString.split(',')) {
				if (!range.length || range[0] === '-')
					ctx.throw(400, 'Invalid range')
				let [first, last] = range.split('-')
				if (isNaN(first = parseInt(first)))
					ctx.throw(400, 'Not a number')
				if (last) {
					if (isNaN(last = parseInt(last)))
						ctx.throw(400, 'Not a number')
					if (last < first)
						ctx.throw(400, 'Invalid range')
				}
				else last = first
				ranges.push([first, last - first + 1])
			}
		return ranges
	}
}
