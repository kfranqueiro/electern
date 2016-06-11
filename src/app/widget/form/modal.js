'use strict';
define([
	'dojo/Deferred',
	'dojo/dom-construct',
	'dojo/on',
	'./_Confirm'
], function (Deferred, domConstruct, on, Confirm) {
	const ipc = require('electron').ipcRenderer;
	const slice = Array.prototype.slice;

	function findTabbableElements(parentNode) {
		var matches = slice.call(parentNode.querySelectorAll('button,input,select,textarea,a[href],[tabindex]'));
		return matches.filter(function (node) {
			return node.tabIndex !== -1;
		});
	}

	const underlayNode = domConstruct.create('div', {
		className: 'modal-underlay'
	});

	const stack = [];
	const Z_INCREMENT = 1000;

	let focusListener;
	let z = 0;

	function hide() {
		var modal = stack.pop();
		modal.listeners.forEach(function (listener) {
			listener.remove();
		});
		modal.node.remove();
		z -= Z_INCREMENT;
		underlayNode.style.zIndex = z;

		if (!z) {
			ipc.send('menu-enable', true);
			underlayNode.remove();
			focusListener.remove();
		}
	}

	function handleKeys(event) {
		if (event.keyCode === 9) {
			var info = stack[stack.length - 1];
			if (event.shiftKey && event.target === info.first) {
				info.last.focus();
				event.preventDefault();
			}
			else if (document.activeElement === document.body || (!event.shiftKey && event.target === info.last)) {
				info.first.focus();
				event.preventDefault();
			}
		}
		else if (event.keyCode === 27) {
			stack[stack.length - 1].widget._onCancelClick();
		}
	}

	const confirmWidget = new Confirm();

	var modal = {
		/**
		 * Shows a modal dialog containing a form widget.
		 * Does not destroy the form widget when the dialog is dismissed.
		 *
		 * @param formWidget A widget extending app/widget/form/_Base
		 * @return Promise resolving if the user submits the form, or rejecting if the user cancels
		 */
		show(formWidget) {
			z += Z_INCREMENT;
			if (!stack.length) {
				ipc.send('menu-enable', false);
				document.body.appendChild(underlayNode);
				focusListener = on.pausable(document.body, 'keydown', handleKeys);
			}
			underlayNode.style.zIndex = z;

			const containerNode = domConstruct.create('div', {
				className: 'modal-container'
			}, document.body);
			const modalNode = domConstruct.create('div', {
				class: 'modal',
				style: { zIndex: z }
			}, containerNode);
			modalNode.appendChild(formWidget.domNode);

			if (!formWidget._started) {
				formWidget.startup();
			}
			else if (formWidget.resize) {
				formWidget.resize();
			}

			const tabbableElements = findTabbableElements(modalNode);
			const firstTabbableElement = tabbableElements[0];
			const lastTabbableElement = tabbableElements[tabbableElements.length - 1];

			// This triggers focusin before we've added to the stack, so avoid handling this event
			focusListener.pause();
			firstTabbableElement.focus();
			focusListener.resume();

			const dfd = new Deferred();

			const listeners = [
				on(formWidget, 'submit', function () {
					if (!formWidget.validate || formWidget.validate()) {
						dfd.resolve(formWidget.get('value'));
					}
				}),
				on(formWidget, 'cancel', function () {
					dfd.reject();
				})
			];

			stack.push({
				first: firstTabbableElement,
				last: lastTabbableElement,
				listeners: listeners,
				node: containerNode,
				widget: formWidget
			});

			dfd.promise.always(hide);
			return dfd.promise;
		},

		confirm(title, message) {
			confirmWidget.set('title', title);
			confirmWidget.set('message', message);
			return modal.show(confirmWidget);
		}
	};
	return modal;
});
