'use strict'

class UrlUtils {
	/**
	 * Concatenates multiple paths.
	 */
	static joinPath(...paths) {
		return paths
			.map(path => UrlUtils.normalizePath(path))
			.filter(path => path !== '/')
			.join('') || '/'
	}

	/**
	 * Normalizes a path.
	 */
	static normalizePath(path) {
		return '/' + (path || '').replace(/^\/+|\/+$/g, '')
	}

	/**
	 * Returns a path relative to another path, or false.
	 */
	static relativePath(path, basePath) {
		if (basePath === undefined || basePath === '/')
			return path

		return path.startsWith(basePath) ?
			path.slice(basePath.length) || '/' :
			false // path is not relative to basePath
	}

	/**
	 * Splits a path into segments.
	 */
	static splitPath(path) {
		return path.slice(1).split('/')
	}
}

module.exports = UrlUtils
