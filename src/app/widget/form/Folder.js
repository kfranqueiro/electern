define([
	'./_FeedBase',
	'dojo/i18n!../../nls/main',
	'dojo/text!./templates/Folder.html'
], function (_FeedBase, i18n, template) {
	return _FeedBase.createSubclass({
		templateString: template,
		deletePrompt: i18n.deleteFolderPrompt
	});
});
