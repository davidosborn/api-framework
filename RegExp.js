'use strict'

if (RegExp.escape === undefined)
	/**
	 * Escapes a string to prevent it from being interpreted as a regular expression.
	 *
	 * @see Based on public domain code from MDN.
	 *      {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions}
	 */
	RegExp.escape = function(s) {
		return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	}

module.exports = RegExp
