'use strict'

/**
 * Callback to get the key of an item.
 * @callback CollectionUtils~GetKeyCallback
 * @param {Object} item The item.
 * @returns {String} The key.
 */

/**
 * Callback to merge an item into the result.
 * @callback CollectionUtils~MergeCallback
 * @param {Object} result The result.
 * @param {Object} item The item.
 */

/**
 *Utilities for working with collections.
 */
export default class CollectionUtils {
	/**
	 * Flattens a sequence of iterables, merging the items by their key.
	 * @param {Iterable.<Iterable.<Object>>} iterables The sequence of iterables.
	 * @param {GetKeyCallback} getKey A callback to get the key of an item.
	 * @param {MergeCallback} merge A callback to merge an item into the result.
	 * @returns {Array.<Object>} The merged items.
	 */
	static mergeByKey(iterables, getKey, merge = Object.assign) {
		let results = new Map
		for (let iterable of iterables)
			for (let item of iterable) {
				let key = getKey(item)
				let result = results.get(key)
				if (result === undefined)
					results.set(key, result = {})
				merge(result, item)
			}
		return [...results.values()]
	}
}
