'use strict'

import FastPriorityQueue from 'fastpriorityqueue'

/**
 * A task scheduler.
 */
export default class Scheduler {
	/**
	 * Creates a new instance.
	 * @param {Array.<Task>} [tasks=[]] The tasks.
	 * @param {Object} [options={}] The additional options.
	 * @param {Boolean} [options.log=false] A value indicating whether to log the scheduling.
	 */
	constructor(tasks = [], options = {}) {
		/**
		 * The tasks.
		 * @type {Array.<Task>}
		 */
		this.tasks = tasks

		/**
		 * A value indicating whether to log the scheduling.
		 * @type {Boolean}
		 * @private
		 */
		this._log = Boolean(options.log)

		/**
		 * A priority queue of the tasks, ordered by their scheduled time.
		 * @type {FastPriorityQueue}
		 * @private
		 */
		this._queue = new FastPriorityQueue(function(a, b) {
			return a[0] < b[0] || a[1] < b[1]
		})

		/**
		 * A value indicating whether the scheduler is running.
		 * @type {Boolean}
		 * @private
		 */
		this._isRunning = false

		/**
		 * A timer to perform the next task.
		 * @private
		 */
		this._timer = null
	}

	/**
	 * Starts scheduling and performing the tasks.
	 */
	start() {
		if (this._isRunning)
			return

		this._isRunning = true

		if (this._log)
			console.log('Starting task scheduler.')

		// Schedule the tasks.
		let now = Date.now()
		for (let [index, task] of this.tasks.entries())
			this._schedule(task, index, task.schedule(now))

		// Set the timer to perform the first task.
		this._setTimer()
	}

	/**
	 * Stops performing the tasks, and clears the schedule.
	 */
	stop() {
		if (!this._isRunning)
			return

		if (this._log)
			console.log('Stopping task scheduler.')

		// Stop the timer.
		clearTimeout(this._timer)

		// Clear the queue.
		while (!this._queue.isEmpty())
			this._queue.poll()

		this._isRunning = false
	}

	/**
	 * Schedules a task.
	 * @param {Task} task The task.
	 * @param {Number} index The index of the task.
	 * @param {Number} time The scheduled time.
	 * @private
	 */
	_schedule(task, index, time) {
		this._queue.add([time, index, task])

		if (this._log)
			console.log('Task \'' + task.constructor.name + '\' scheduled for ' + new Date(time).toLocaleTimeString() + '.')
	}

	/**
	 * Performs the tasks that are scheduled to run.
	 * @param {Number} now The current time.
	 * @private
	 */
	async _perform(now) {
		// Perform the tasks that are scheduled at this time.
		let [time, index, task] = this._queue.peek()
		do {
			if (this._log)
				console.log('Performing task \'' + task.constructor.name + '\'.')

			// Perform the task.
			await task.perform(now, time)

			// Reschedule the task.
			time = task.schedule(time)
			this._queue.replaceTop([time, index, task])

			if (this._log)
				console.log('Task \'' + task.constructor.name + '\' completed and rescheduled for ' + new Date(time).toLocaleTimeString() + '.');

			[time, index, task] = this._queue.peek()
		}
		while (time <= now)

		// Set the timer to perform the next task.
		this._setTimer()
	}

	/**
	 * Set a timer to perform the next task.
	 * @private
	 */
	_setTimer() {
		let time = this._queue.peek()[0]
		this._timer = setTimeout(this._perform.bind(this, time), time - Date.now())
	}
}
