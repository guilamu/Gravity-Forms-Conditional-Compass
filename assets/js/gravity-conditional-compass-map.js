/**
 * Conditional Logic Map JavaScript
 *
 * @package Gravity_Conditional_Compass
 * @since 0.9.4
 */

(function($) {
	'use strict';

	// Store original content
	var originalContent = '';

	/**
	 * Initialize when document is ready
	 */
	$(document).ready(function() {
		initCopyButton();
		initTextareaInteractions();
		initFilterToggles();
	});

	/**
	 * Initialize copy to clipboard functionality
	 */
	function initCopyButton() {
		var copyButton = $('#gfcl-copy-map');
		var textarea   = $('#gfcl-map-textarea');
		var notice     = $('#gfcl-copy-notice');
		var noticeText = notice.find('.gfcl-copy-notice-text');

		if (!copyButton.length || !textarea.length) {
			return;
		}

		copyButton.on('click', function(e) {
			e.preventDefault();

			// Select the textarea content
			textarea.focus();
			textarea.select();
			textarea[0].setSelectionRange(0, textarea.val().length);

			// Try to copy using the Clipboard API (modern browsers)
			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(textarea.val())
					.then(function() {
						showNotice('success', gfCondLogicMapL10n.copiedToClipboard);
					})
					.catch(function() {
						// Fallback to execCommand
						fallbackCopy();
					});
			} else {
				// Fallback to execCommand for older browsers
				fallbackCopy();
			}

			/**
			 * Fallback copy method using execCommand
			 */
			function fallbackCopy() {
				try {
					var successful = document.execCommand('copy');
					if (successful) {
						showNotice('success', gfCondLogicMapL10n.copiedToClipboard);
					} else {
						showNotice('error', gfCondLogicMapL10n.copyFailed);
					}
				} catch (err) {
					showNotice('error', gfCondLogicMapL10n.copyFailed);
				}
			}

			/**
			 * Show copy notice
			 *
			 * @param {string} type - Notice type (success/error)
			 * @param {string} message - Notice message
			 */
			function showNotice(type, message) {
				// Update notice content
				noticeText.text(message);

				// Remove previous type classes
				notice.removeClass('success error');

				// Add current type class
				notice.addClass(type);

				// Update dashicon
				var icon = notice.find('.dashicons');
				icon.removeClass('dashicons-yes-alt dashicons-warning');
				if (type === 'success') {
					icon.addClass('dashicons-yes-alt');
				} else {
					icon.addClass('dashicons-warning');
				}

				// Show notice
				notice.fadeIn(300);

				// Hide notice after 3 seconds
				setTimeout(function() {
					notice.fadeOut(300);
				}, 3000);
			}
		});
	}

	/**
	 * Initialize textarea interactions
	 */
	function initTextareaInteractions() {
		var textarea = $('#gfcl-map-textarea');

		if (!textarea.length) {
			return;
		}

		// Store original content
		originalContent = textarea.val();

		// Clean markers from initial display
		cleanAndDisplayContent(originalContent);

		// No click / mouseup handlers here so user can freely scroll and select.
	}

	/**
	 * Clean markers from content and display
	 *
	 * @param {string} content - Content to clean
	 */
	function cleanAndDisplayContent(content) {
		var textarea = $('#gfcl-map-textarea');

		// Remove field/type/unused marker tags but keep their visible text
		var cleaned = content
			.replace(/\[FIELD-ID-START\]/g, '')
			.replace(/\[FIELD-ID-END\]/g, '')
			.replace(/\[FIELD-TYPE-START\]/g, '')
			.replace(/\[FIELD-TYPE-END\]/g, '')
			.replace(/\[UNUSED-START\]/g, '')
			.replace(/\[UNUSED-END\]/g, '');

		textarea.val(cleaned);
	}

	/**
	 * Initialize filter toggles
	 */
	function initFilterToggles() {
		var hideFieldNumber = $('#gfcl-hide-field-number');
		var hideFieldType   = $('#gfcl-hide-field-type');
		var hideUnused      = $('#gfcl-hide-unused');
		var hideUsedBy      = $('#gfcl-hide-used-by');
		var hideDependsOn   = $('#gfcl-hide-depends-on');
		var textarea        = $('#gfcl-map-textarea');

		if (!hideFieldNumber.length || !hideFieldType.length || !textarea.length) {
			return;
		}

		// Add change event listeners to toggles
		hideFieldNumber.on('change', applyFilters);
		hideFieldType.on('change', applyFilters);
		if (hideUnused.length) {
			hideUnused.on('change', applyFilters);
		}
		if (hideUsedBy.length) {
			hideUsedBy.on('change', applyFilters);
		}
		if (hideDependsOn.length) {
			hideDependsOn.on('change', applyFilters);
		}

		/**
		 * Apply filters to the textarea content
		 */
		function applyFilters() {
			var content = originalContent;

			var hideFieldNumberChecked = hideFieldNumber.is(':checked');
			var hideFieldTypeChecked   = hideFieldType.is(':checked');
			var hideUnusedChecked      = hideUnused.length ? hideUnused.is(':checked') : false;
			var hideUsedByChecked      = hideUsedBy.length ? hideUsedBy.is(':checked') : false;
			var hideDependsOnChecked   = hideDependsOn.length ? hideDependsOn.is(':checked') : false;

			// Hide entire blocks for unused fields
			if (hideUnusedChecked) {
				// Remove everything between [UNUSED-START] and [UNUSED-END], plus trailing blank line
				content = content.replace(/\[UNUSED-START\][\s\S]*?\[UNUSED-END\]\s*\n?/g, '');
			}

			// Hide "DEPENDS ON" (SHOW/HIDE IF) dependencies
			if (hideDependsOnChecked) {
			    // Remove the whole line including its trailing newline
    			content = content.replace(/^[ \t]*╚═\[[^\]]*]═> .*$(?:\r?\n)?/gm, '');
			}

			// Hide "IS USED BY" dependencies
			if (hideUsedByChecked) {
			    // Remove the whole line including its trailing newline
    			content = content.replace(/^[ \t]*└─> IS USED BY .*$(?:\r?\n)?/gm, '');
			}

			// Field number handling
			if (hideFieldNumberChecked) {
				// Remove the full "Field N" token everywhere
				content = content.replace(/\[FIELD-ID-START\]Field \d+\[FIELD-ID-END\]\s*/g, '');
			} else {
				// Keep "Field N" but remove the marker tags
				content = content
					.replace(/\[FIELD-ID-START\]/g, '')
					.replace(/\[FIELD-ID-END\]/g, '');
			}

			// Field type handling
			if (hideFieldTypeChecked) {
				// Remove the full "[Type]" token everywhere
				content = content.replace(/\[FIELD-TYPE-START\]\[.*?\]\[FIELD-TYPE-END\]\s*/g, '');
			} else {
				// Keep type label but remove the marker tags
				content = content
					.replace(/\[FIELD-TYPE-START\]/g, '')
					.replace(/\[FIELD-TYPE-END\]/g, '');
			}

			// Always strip any remaining unused markers from display
			content = content
				.replace(/\[UNUSED-START\]/g, '')
				.replace(/\[UNUSED-END\]/g, '');

			textarea.val(content);
		}
	}

})(jQuery);
