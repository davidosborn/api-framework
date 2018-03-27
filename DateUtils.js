'use strict'

/**
 * Utilities for working with time and date.
 */
export default class DateUtils {
	/**
	 * Converts a date to a SQL string.
	 * @param {Date} date The date.
	 * @returns {String} The SQL string.
	 */
	static toSqlString(date) {
		return date.toISOString().slice(0, 19).replace('T', ' ')
	}
}
