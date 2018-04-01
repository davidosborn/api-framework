'use strict'

/**
 * Utilities for working with strings.
 */
export default class StringUtils {
	/**
	 * Joins a sequence of items into a string, with proper English grammar.
	 * @param {Iterable} iterable The sequence of items.
	 * @returns {String} The string.
	 */
	static joinEnglish(iterable) {
		let array = Array.from(iterable)
		switch (array.length) {
			case 0:
				return ''
			case 1:
				return '' + array[0]
			case 2:
				return array[0] + ' and ' + array[1]
			default:
				array[array.length - 1] = 'and ' + array[array.length - 1]
				return array.join(', ')
		}
	}
}
