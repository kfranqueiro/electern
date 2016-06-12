define([
	'dojo/Deferred'
], function (Deferred) {
	var ipc = require('electron').ipcRenderer;
	var deferreds = {};

	ipc.on('archive-downloaded', function (event, url, filename) {
		deferreds[url].resolve(filename);
		delete deferreds[url];
	});

	ipc.on('archive-failed', function (event, url, error) {
		deferreds[url].reject(error);
		delete deferreds[url];
	});

	return {
		download(url, filename) {
			var dfd = deferreds[url] = new Deferred();
			ipc.send('download-archive', url, filename);
			return dfd.promise;
		},

		view(filename) {
			ipc.send('view-archive', filename);
		}
	};
});
