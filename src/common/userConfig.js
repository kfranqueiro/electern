'use strict';

const isAMD = typeof define === 'function' && define.amd;

function factory() {
	const fs = require('fs');
	const pathUtil = require('path');
	const app = isAMD ? require('electron').remote.app : require('electron').app;
	const filename = pathUtil.resolve(app.getPath('userData'), 'userConfig.json');

	const defaultOptions = {
		allowImages: false, // Whether to allow images through sanitizeHtml's filter
		maxTotal: 50, // Maximum number of articles to keep for a single feed
		updateInterval: 60 // Update interval for feeds, in minutes
	};

	const defaultUiOptions = {
		regionSizes: {
			feeds: 25,
			articles: 35
		},
		size: [ 1000, 600 ]
	};

	const Config = function () {
		this.load();
	};

	Object.assign(Config.prototype, {
		/**
		 * Returns an options object for the given feed ID normalized on top of the defaults,
		 * or returns just the defaults if no id is passed.
		 */
		getOptions(id) {
			return Object.assign({}, this.defaultOptions,
				typeof id === 'undefined' ? null : this.feedOptions[id]);
		},

		setOptions(id, options) {
			this.feedOptions[id] = options;
		},

		load() {
			if (!fs.existsSync(filename)) {
				this.defaultOptions = defaultOptions;
				this.feedOptions = {};
				this.uiOptions = Object.assign({}, defaultUiOptions);
				this.save();
			}
			else {
				var config = JSON.parse(fs.readFileSync(filename, 'utf8'));
				if (!config.uiOptions) {
					// Upgrade path from versions before uiOptions was added
					config.uiOptions = Object.assign({}, defaultUiOptions);
				}
				// Underlay built-in defaultOptions to facilitate new options in upgrades w/ existing config
				config.defaultOptions = Object.assign({}, defaultOptions, config.defaultOptions);
				Object.assign(this, config);
				this.save();
			}
		},

		save() {
			fs.writeFileSync(filename, JSON.stringify(this));
		}
	});
	return new Config();
}

if (isAMD) {
	define([], factory);
}
else {
	module.exports = factory();
}
