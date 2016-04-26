'use strict';
define([
	'dojo/request',
	'./util'
], function (request, util) {
	const slice = Array.prototype.slice;

	function getElementHtml(parent, selector) {
		const element = parent.querySelector(selector);
		return element ? element.innerHTML : '';
	}

	function getElementText(parent, selector) {
		const element = parent.querySelector(selector);
		return element ? element.textContent : '';
	}

	function getElementAttribute(parent, selector, attribute) {
		const element = parent.querySelector(selector);
		return element ? element.getAttribute(attribute) : '';
	}

	var feedHandlers = [
		{
			name: 'atom',
			selector: 'feed entry',
			parseArticle: function (element) {
				return {
					id: getElementText(element, 'id'),
					url: getElementAttribute(element, 'link', 'href'),
					title: getElementText(element, 'title'),
					author: getElementText(element, 'name'),
					date: getElementText(element, 'published') || getElementText(element, 'updated'),
					content: getElementHtml(element, 'content') || getElementHtml(element, 'summary')
				};
			},
			parseMetadata: function (doc) {
				const updated = getElementText(doc, 'feed > updated');
				return {
					title: getElementText(doc, 'feed > title'),
					updatedDate: updated ? new Date(updated) : undefined
				};
			}
		},
		{
			name: 'rss',
			selector: 'rss item, rdf\\:RDF item',
			parseArticle: function (element) {
				return {
					id: getElementText(element, 'guid') ||
						getElementText(element, 'identifier') || getElementText(element, 'link'), // RSSv1
					url: getElementText(element, 'link'),
					title: getElementText(element, 'title'),
					author: getElementText(element, 'author') || getElementText(element, 'creator'),
					date: getElementText(element, 'pubDate') || getElementText(element, 'date'),
					content: getElementHtml(element, 'description')
				};
			},
			parseMetadata: function (doc) {
				const updated = getElementText(doc, 'channel > pubDate') ||
					getElementText(doc, 'channel > lastBuildDate') ||
					getElementText(doc, 'channel > syn\\:updateBase'); // RSSv1

				return {
					title: getElementText(doc, 'channel > title'),
					description: getElementText(doc, 'channel > description'),
					updatedDate: updated ? new Date(updated) : undefined,
					url: getElementText(doc, 'channel > link')
				};
			}
		}
	];

	function handleFeed(doc, url) {
		let elements;
		const match = feedHandlers.find(function (obj) {
			elements = doc.querySelectorAll(obj.selector);
			return elements.length > 0;
		});
		if (!match) {
			throw new Error('Unrecognized feed format');
		}

		const articles = slice.call(elements).map(function (element) {
			const article = match.parseArticle(element);
			if (article.date) {
				article.date = new Date(article.date);
			}
			return article;
		});

		const metadata = match.parseMetadata(doc);
		metadata.downloadedDate = new Date();
		metadata.url = url;

		return {
			articles: articles,
			metadata: metadata
		};
	}

	/**
	 * Retrieves articles from a feed.
	 *
	 * @param {string} url Feed URL to fetch and process
	 * @return dojo/promise/Promise resolving to an array of items with normalized properties
	 */
	return function (url) {
		return request(url).then(function (xml) {
			return handleFeed(util.parseXml(xml), url);
		});
	};
});
