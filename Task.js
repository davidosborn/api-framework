'use strict'

/**
 * A task that can be scheduled.
 */
export default class Task {
	/**
	 * Creates a new instance.
	 * @param {Object} [options={}] The options.
	 * @param {Number} [options.interval=3600000] The number of milliseconds between which to schedule this task.
	 * @param {Number} [options.offset=0] The number of milliseconds by which to offset the scheduling of this task.
	 */
	constructor(options = {}) {
		/**
		 * The number of milliseconds between which to schedule this task.
		 * @type {Number}
		 * @protected
		 */
		this._interval = options.interval || 3600000

		/**
		 * The number of milliseconds by which to offset the scheduling of this task.
		 * @type {Number}
		 * @protected
		 */
		this._offset = options.offset || 0
	}

	/**
	 * Schedules the task.
	 * @param {Number} now The current time.
	 * @returns {Number} The scheduled time.
	 */
	schedule(now) {
		return now + (this._interval - (now - this._offset) % this._interval)
	}

	/**
	 * Calculates the index of a scheduled time.
	 * @param {Number} time The scheduled time.
	 * @returns {Number} The index.
	 */
	scheduleIndex(time) {
		return (time - this._offset) / this._interval
	}

	/**
	 * Performs the task.
	 * @param {Number} now The current time.
	 * @param {Number} time The scheduled time.
	 */
	async perform(now, time) {
	}
}
