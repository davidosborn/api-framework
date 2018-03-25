'use strict'

import ipc from 'node-ipc'

/**
 * Supports communication over IPC.
 */
export default new class CallIpc {
	/**
	 * @param {String} [app] - The short name of the application.
	 */
	constructor(app) {
		ipc.connectTo(app)
		ipc.server.emit(process.argv[2], JSON.stringify(process.argv.slice(3)))
	}
}
