'use strict'

export default class DatabaseChangeNotifier {
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

	registerDatabase(db) {
		// ignore duplicate registrations
		if (this.listenerByDatabase.has(db))
			return

		// register listener
		let listener = e => this.io.to(`notify_db_${e.table}`).emit('change', e)
		db.on('change', listener)
		this.listenerByDatabase.set(db, listener)
	}

	unregisterDatabase(db) {
		let listener = this.listenerByDatabase.get(db)
		if (listener !== undefined) {
			db.removeListener('change', listener)
			this.listenerByDatabase.delete(db)
		}
	}
}
