'use strict';
define([
	'dstore/Memory',
	'../util'
], function (Memory, util) {
	const fs = require('fs');
	const writeFile = util.promisify(fs.writeFile);

	/**
	 * Memory store which persists to / restores from a file in the filesystem.
	 */
	return Memory.createSubclass({
		/**
		 * Filename to read/write
		 */
		filename: '',

		constructor() {
			// This uses synchronous methods in order to populate data immediately before postscript runs,
			// rather than needing to notify of adds afterwards.
			if (this.filename && fs.existsSync(this.filename)) {
				this.data = JSON.parse(fs.readFileSync(this.filename, { encoding: 'utf8' }), function (key, value) {
					if (key.slice(-4).toLowerCase() === 'date') {
						return new Date(value);
					}
					return value;
				});
			}
		},

		_persist(sync) {
			if (this.filename) {
				const args = [ this.filename, JSON.stringify(this, null, '\t') ];
				return (sync ? fs.writeFileSync : writeFile).apply(fs, args);
			}
			throw new Error('Cannot persist without a filename defined');
		},

		persist() {
			this._persist();
		},

		persistSync() {
			this._persist(true);
		},

		toJSON() {
			return this.storage.fullData;
		}
	});
});
