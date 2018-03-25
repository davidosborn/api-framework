'use strict'

import Controller from './Controller'
import Route from './Route'

export default class ClientController extends Controller {
	constructor(root, title) {
		super()

		let babelConfig = require('./package.json').babel

		this._routes.push(
			new Route('include/**/*.js', require('./middleware/babel').default(babelConfig)),
			new Route(require('./middleware/static').default(root)),
			new Route(require('./middleware/index').default(root, title))
		)
	}
}
