'use strict'

let Controller = require('./Controller')
let Route      = require('./Route')

/**
 * Provides routes for a collection.
 */
class CollectionController extends Controller {
	constructor(name) {
		super()

		this._routes.push(
			new Route('delete', name,                 this._onDelete    .bind(this), 'Deletes an item from the <i>' + name + '</i> collection.'),
			new Route('delete', name + '/:id',        this._onDeleteItem.bind(this), 'Deletes an item from the <i>' + name + '</i> collection.'),
			new Route('get',    name,                 this._onGet       .bind(this), 'Returns all of the items in the <i>' + name + '</i> collection.'),
			new Route('get',    name + '/:id',        this._onGetItem   .bind(this), 'Returns an item in the <i>' + name + '</i> collection.'),
			new Route('get',    name + '/count',      this._onGetCount  .bind(this), 'Returns the number of items in the <i>' + name + '</i> collection.'),
			new Route('get',    name + '/schema',     this._onGetSchema .bind(this), 'Returns the schema for the <i>' + name + '</i> collection.'),
			new Route('post',   name,                 this._onPost      .bind(this), 'Adds an item to the <i>' + name + '</i> collection.'),
			new Route('post',   name + '/:id',        this._onPostItem  .bind(this), 'Replaces an item in the <i>' + name + '</i> collection.'),
			new Route('post',   name + '/delete/:id', this._onDeleteItem.bind(this), 'Deletes an item from the <i>' + name + '</i> collection.'),
			new Route('put',    name + '/:id',        this._onPutItem   .bind(this), 'Adds an item with a specific id to the <i>' + name + '</i> collection.')
		)
	}

	_onDelete(ctx, next) {
		ctx.throw(500, 'Not implemented')
	}

	_onDeleteItem(ctx, next, id) {
		ctx.throw(500, 'Not implemented')
	}

	_onGet(ctx, next) {
		ctx.throw(500, 'Not implemented')
	}

	_onGetCount(ctx, next, id) {
		ctx.throw(500, 'Not implemented')
	}

	_onGetItem(ctx, next, id) {
		ctx.throw(500, 'Not implemented')
	}

	_onGetSchema(ctx, next) {
		ctx.throw(500, 'Not implemented')
	}

	_onPost(ctx, next) {
		ctx.throw(500, 'Not implemented')
	}

	_onPostItem(ctx, next, id) {
		ctx.throw(500, 'Not implemented')
	}

	_onPutItem(ctx, next, id) {
		ctx.throw(500, 'Not implemented')
	}
}

module.exports = CollectionController
