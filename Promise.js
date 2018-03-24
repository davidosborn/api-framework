'use strict'

if (Promise.promisify === undefined) {
	/**
	 * Converts a function to a promise.
	 *
	 * @param {Function} fn - The function to convert.
	 */
	Promise.promisify = function(fn) {
		return function() {
			return new Promise((resolve, reject) => {
				fn.call(this, ...arguments, (error, ...results) => {
					if (error)
						reject(error)
					else
						resolve(...results)
				})
			})
		}
	}
}

module.exports = Promise
