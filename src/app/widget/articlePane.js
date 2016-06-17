'use strict';
define([
	'dojo/on',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'../archive',
	'common/userConfig',
	'../store/article',
	'../store/feed',
	'dojo/i18n!../nls/main',
	'dojo/text!./templates/ArticlePane.html',
	'dojo/query' // Event delegation
], function (on, _WidgetBase, _TemplatedMixin, archive, userConfig, articleStore, feedStore, i18n, template) {
	const sanitizeHtml = require('sanitize-html');

	const activeDownloads = {};

	var ArticlePane = _WidgetBase.createSubclass([ _TemplatedMixin ], {
		baseClass: 'article',
		i18n: i18n,
		templateString: template,

		postCreate() {
			on(this.downloadNode, 'click', this._onDownloadClick.bind(this));
			on(this.domNode, 'a:click', (event) => {
				event.preventDefault();
				require('electron').shell.openExternal(event.target.href);
			});

			this.set('article', null);
		},

		_onDownloadClick(event) {
			event.preventDefault();
			event.stopPropagation();

			const article = this.article;
			if (this.article.archive) {
				archive.view(this.article.archive);
			}
			else if (!activeDownloads[article.id]) {
				var isoDate = article.date.toISOString();
				var filename = isoDate.slice(0, isoDate.lastIndexOf('.')).replace(/:/g, '-') + '-' +
					article.title.replace(/\W/g, '-').slice(0, 20) + '.mhtml';

				activeDownloads[article.id] = archive.download(article.url, filename).then((filename) => {
					article.archive = filename;
					articleStore.putSync(article);
					if (article === this.article) {
						this._updateDownloadNode();
					}
				}).always(function () {
					delete activeDownloads[article.id];
				});

				this._updateDownloadNode();
			}
		},

		_processHtml(html, sanitizeOptions) {
			if (html.startsWith('<![CDATA[') && html.endsWith(']]>')) {
				html = html.slice(9, -3);
			}
			else {
				html = html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
			}
			return sanitizeHtml(html, sanitizeOptions);
		},

		_setArticleAttr(article) {
			this._set('article', article);
			this.domNode.classList.toggle('hidden', !article);

			if (!article) {
				return;
			}

			this.domNode.scrollTop = 0;
			this.titleNode.innerHTML = '<a href="' + article.url + '">' + this._processHtml(article.title) + '</a>';
			this.metaNode.innerHTML = this._processHtml(article.author) + ' - ' +
				this._processHtml(feedStore.getSync(article.feedId).title);
			this._updateDownloadNode();

			const options = userConfig.getOptions(article.feedId).allowImages ? {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img' ]),
				exclusiveFilter: function (frame) {
					// Strip duplicated content caused by old TinyMCE bug
					// Reference: http://www.electrictoolbox.com/tinymce-mcepaste-divs-webkit-browsers/
					return frame.tag === 'div' && frame.attribs['class'] === 'mcePaste';
				}
			} : {};
			this.containerNode.innerHTML = this._processHtml(article.content, options);

			const links = this.domNode.getElementsByTagName('a');
			const numLinks = links.length;
			// Iterate from 1 to skip download-to-PDF link
			for (let i = 1; i < numLinks; i++) {
				if (!links[i].innerHTML) {
					// Remove empty links (such as those around images, if images are set to be filtered out)
					links[i].remove();
				}
				else {
					links[i].title = links[i].href;
				}
			}
		},

		_updateDownloadNode() {
			const article = this.article;
			const downloadNode = this.downloadNode;
			downloadNode.className = 'fa fa-' + (article.archive ? 'book' :
				activeDownloads[article.id] ? 'hourglass' : 'download');
			downloadNode.title = article.archive ? i18n.openArchivedPage :
				activeDownloads[article.id] ? '' : i18n.downloadCompletePage;
		}
	});

	return new ArticlePane({}, 'article');
});
