'use strict';
define([
	'dojo/_base/lang'
], function (lang) {
	const fs = require('fs');
	const pathUtil = require('path');
	const filename = pathUtil.resolve(require('electron').remote.app.getPath('userData'), 'userConfig.json');

	const defaultOptions = {
		allowImages: false, // Whether to allow images through sanitizeHtml's filter
		maxTotal: 50, // Maximum number of articles to keep for a single feed
		updateInterval: 60 // Update interval for feeds, in minutes
	};

	const Config = function () {
		this.load();
	};

	lang.mixin(Config.prototype, {
		/**
		 * Returns an options object for the given feed ID normalized on top of the defaults,
		 * or returns just the defaults if no id is passed.
		 */
		getOptions(id) {
			return lang.mixin({}, this.defaultOptions,
				typeof id === 'undefined' ? null : this.feedOptions[id]);
		},

		setOptions(id, options) {
			this.feedOptions[id] = options;
		},

		load() {
			if (!fs.existsSync(filename)) {
				this.defaultOptions = defaultOptions;
				this.feedOptions = {};
				this.save();
			}
			else {
				var config = JSON.parse(fs.readFileSync(filename, 'utf8'));
				// Underlay built-in defaultOptions to facilitate new options in upgrades w/ existing config
				config.defaultOptions = lang.mixin({}, defaultOptions, config.defaultOptions);
				lang.mixin(this, config);
				this.save();
			}
		},

		save() {
			fs.writeFileSync(filename, JSON.stringify(this));
		}
	});
	return new Config();
});
