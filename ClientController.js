'use strict'

let Controller = require('./Controller')
let Route      = require('./Route')

class ClientController extends Controller {
	constructor(root, title) {
		super()

		let babelConfig = require('./package.json').babel

		this._routes.push(
			new Route('include/**/*.js', require('./middleware/babel')(babelConfig)),
			new Route(require('./middleware/static')(root)),
			new Route(require('./middleware/index')(root, title))
		)
	}
}

module.exports = ClientController
