'use strict';
define([
	'dojo/on',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'../userConfig',
	'dojo/text!./templates/ArticlePane.html',
	'dojo/query' // Event delegation
], function (on, _WidgetBase, _TemplatedMixin, userConfig, template) {
	const sanitizeHtml = require('sanitize-html');

	return _WidgetBase.createSubclass([ _TemplatedMixin ], {
		baseClass: 'article',
		templateString: template,

		postCreate() {
			on(this.domNode, 'a:click', function (event) {
				event.preventDefault();
				require('shell').openExternal(this.href);
			});

			this.set('article', null);
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
			this.metaNode.innerHTML = this._processHtml(article.author) + ' - ' + this._processHtml(article.feedTitle);

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
			for (let i = links.length; i--;) {
				if (!links[i].innerHTML) {
					// Remove empty links (such as those around images, if images are set to be filtered out)
					links[i].remove();
				}
				else {
					links[i].title = links[i].href;
				}
			}
		}
	});
});
