'use strict'

class DatabaseChangeNotifier {
	constructor(io) {
		/**
		 * The registered listeners, indexed by DatabaseConnectionFactory.
		 */
		this.listenerByDatabase = new Map

		/**
		 * The WebSocket server.
		 */
		this.io = io

		// handle WebSocket connections
		io.on('connection', socket => {
			console.log('WebSocket connected:', socket.id)

			// handle subscription
			socket.on('subscribe_db', table => {
				console.log('subscribe')
				socket.join(`notify_db_${table}`)
			})

			// handle unsubscription
			socket.on('unsubscribe_db', table => {
				console.log('unsubscribe')
				socket.leave(`notify_db_${table}`)
			})
		})
	}

	registerDatabase(databaseConnectionFactory) {
		// ignore duplicate registrations
		if (this.listenerByDatabase.has(databaseConnectionFactory))
			return

		// register listener
		let listener = e => this.io.to(`notify_db_${e.table}`).emit('change', e)
		databaseConnectionFactory.on('change', listener)
		this.listenerByDatabase.set(databaseConnectionFactory, listener)
	}

	unregisterDatabase(databaseConnectionFactory) {
		let listener = this.listenerByDatabase.get(databaseConnectionFactory)
		if (listener !== undefined) {
			databaseConnectionFactory.removeListener('change', listener)
			this.listenerByDatabase.delete(databaseConnectionFactory)
		}
	}
}

module.exports = DatabaseChangeNotifier
