'use strict'

import RegExp from './regexp' // RegExp.escape
import UrlUtils from './url-utils'

/**
 * Provides information about a path, including the patterns it contains.
 */
export default class PathPattern {
	/**
	 * The patterns that can be used in a path segment.
	 */
	static PatternType = {
		NONE:     0,
		GLOB:     1,
		GLOBSTAR: 2,
		REGEXP:   3
	}

	constructor(pathSegment, nextPathPattern) {
		/**
		 * The type of pattern used in the path segment.
		 * @type {PathPattern.PatternType}
		 */
		this.pathSegmentPatternType = PathPattern._getPathSegmentPatternType(pathSegment)

		/**
		 * True if the path segment is a pattern.
		 * @type {Boolean}
		 */
		this.isPathSegmentPattern = this.pathSegmentPatternType !== PathPattern.PatternType.NONE

		/**
		 * True if the path is a pattern.
		 * @type {Boolean}
		 */
		this.isPathPattern = this.isPathSegmentPattern ||
			nextPathPattern !== undefined && nextPathPattern.isPathPattern

		/**
		 * The path pattern starting at the next path-segment.
		 * @type {PathPattern}
		 */
		this.nextPathPattern = nextPathPattern

		/**
		 * The path pattern starting at the last path-segment.
		 * @type {PathPattern}
		 */
		this.lastPathPattern = nextPathPattern !== undefined ? nextPathPattern.lastPathPattern : this

		// compile path segment
		let rawPathSegment = PathPattern._compilePathSegment(pathSegment, this.pathSegmentPatternType)

		/**
		 * The first path segment of the path.
		 * @type {RegExp|String}
		 */
		this.pathSegment = this.isPathSegmentPattern ?
			new RegExp('^' + rawPathSegment + '$') :
			rawPathSegment

		/**
		 * A string representation of the path pattern.
		 * @type {String}
		 */
		this._rawPath = rawPathSegment
		if (nextPathPattern !== undefined)
			this._rawPath += '/' + nextPathPattern._rawPath

		/**
		 * The path pattern.
		 * @type {RegExp|String}
		 */
		this.path = this.isPathPattern ?
			new RegExp('^' + this._rawPath + '$') :
			this._rawPath
	}

	/**
	 * Returns true if the path contains a pattern.
	 */
	static isPattern(path) {
		return path.indexOf('*') !== -1 || (path.indexOf('(') !== -1 && path.indexOf(')'))
	}

	/**
	 * Creates a PathPattern from a path.
	 */
	static parsePath(path) {
		return PathPattern.parsePathSegments(UrlUtils.splitPath(path))
	}

	/**
	 * Creates a PathPattern from an array of path segments.
	 */
	static parsePathSegments(pathSegments) {
		let result
		for (let i = pathSegments.length - 1; i >= 0; --i)
			result = new PathPattern(pathSegments[i], result)
		return result
	}

	/**
	 * Returns the type of pattern used in a path segment.
	 */
	static _getPathSegmentPatternType(pathSegment) {
		return (
			pathSegment.startsWith('(') && pathSegment.endsWith(')') ? PathPattern.PatternType.REGEXP   :
			pathSegment === '**'                                     ? PathPattern.PatternType.GLOBSTAR :
			pathSegment.indexOf('*') !== -1                          ? PathPattern.PatternType.GLOB     :
			/**/                                                       PathPattern.PatternType.NONE
		)
	}

	/**
	 * Converts a path-segment pattern into a regular-expression string. If the path segment is not a pattern, it will
	 * be returned unchanged.
	 */
	static _compilePathSegment(pathSegment, patternType) {
		if (patternType === undefined)
			patternType = PathPattern._getPathSegmentPatternType(pathSegment)

		switch (patternType) {
			case PathPattern.PatternType.NONE:
				return pathSegment

			case PathPattern.PatternType.GLOB:
				return RegExp.escape(pathSegment).replace('\\*', '[^\/]*')

			case PathPattern.PatternType.GLOBSTAR:
				return '.*'

			case PathPattern.PatternType.REGEXP:
				return pathSegment.slice(1, -1)

			default:
				throw new Error('Invalid pattern type')
		}
	}
}
