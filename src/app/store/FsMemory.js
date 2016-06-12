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
			if (this.filename) {
				this.setFilename(this.filename);
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

		setFilename(filename) {
			// This uses synchronous methods to enable flowing directly into setData,
			// rather than needing to notify of adds afterwards.
			// Note that this accepts nonexistent filenames as well, to allow persisting on first run.

			if (fs.existsSync(filename)) {
				this.setData(JSON.parse(fs.readFileSync(filename, { encoding: 'utf8' }), function (key, value) {
					if (key.slice(-4).toLowerCase() === 'date') {
						return new Date(value);
					}
					return value;
				}));
			}
			else {
				this.setData([]);
			}

			this.filename = filename;
		},

		toJSON() {
			return this.storage.fullData;
		}
	});
});
