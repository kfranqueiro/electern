'use strict';
define([
	'dojo/_base/lang'
], function (lang) {
	const parser = new DOMParser();
	const slice = Array.prototype.slice;

	return {
		/**
		 * Sets the disabled state of any applicable direct children.
		 */
		disableChildren(parentNode, disabled) {
			disabled = disabled !== false;
			for (let i = parentNode.children.length; i--;) {
				const child = parentNode.children[i];
				if ('disabled' in child) {
					child.disabled = disabled;
				}
			}
		},

		/**
		 * Parses XML into a document object. Throws on parse error.
		 */
		parseXml: function (xml) {
			xml = xml.slice(xml.indexOf('<?xml')); // Trim any invalid leading comments/etc.
			const doc = parser.parseFromString(xml, 'application/xml');
			const error = doc.querySelector('parsererror');
			if (error) {
				throw new Error(error.innerText);
			}
			return doc;
		},

		/**
		 * Given a node-callback-style function,
		 * returns a new function which returns a promise instead.
		 */
		promisify(func) {
			return function () {
				let args = slice.call(arguments);
				return new Promise((resolve, reject) => {
					args = args.concat(function (error, result) {
						if (error) {
							reject(error);
						}
						else {
							resolve(result);
						}
					});

					func.apply(this, args);
				});
			};
		},

		/**
		 * Flattens any nested objects into top-level keys with dot notation.
		 */
		flatten(obj) {
			const toString = Object.prototype.toString;
			let found = true;
			while (found) {
				found = false;
				for (let key in obj) {
					const nestedObj = obj[key];
					if (toString.call(nestedObj) !== '[object Object]') {
						continue;
					}
					found = true;
					for (let nestedKey in nestedObj) {
						obj[key + '.' + nestedKey] = nestedObj[nestedKey];
					}
					delete obj[key];
				}
			}
			return obj;
		},

		/**
		 * Scans an object for dot-delimited property names, and rearranges them into a nested structure.
		 */
		unflatten(obj) {
			for (let key in obj) {
				if (key.includes('.')) {
					lang.setObject(key, obj[key], obj);
					delete obj[key];
				}
			}
			return obj;
		}
	};
});
