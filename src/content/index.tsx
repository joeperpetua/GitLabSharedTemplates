import { createRoot } from "react-dom/client";
import { TemplateDropdown } from "./TemplateDropdown";
import { injectStyles } from "./styles";

// Inject custom styles immediately on execution
injectStyles();

// Developer logging setting state loaded from storage
let developerLoggingEnabled = false;

// Load initial setting
chrome.storage.sync.get({ enableLogging: false }, (items) => {
	developerLoggingEnabled = items.enableLogging as boolean ?? false;
});

// Listen for updates to the logging setting
chrome.storage.onChanged.addListener((changes, areaName) => {
	if (areaName === 'sync' && changes.enableLogging) {
		developerLoggingEnabled = changes.enableLogging.newValue as boolean;
	}
});

// Scoped logging utility
function logDebug(...args: any[]) {
	if (developerLoggingEnabled) {
		console.log(...args);
	}
}

// Resolve a stable bookkeeping id for a description field, keyed off the form group
// wrapper so it stays consistent even if GitLab swaps the field between plain text
// (textarea) and rich text (content editor) mode.
function resolveContainerId(
	formGroup: Element | null,
	anchor: Element,
	fallbackSeed: string,
): string {
	const stableHost = (formGroup || anchor) as HTMLElement;
	if (stableHost.dataset.glTemplatesFieldId) {
		return stableHost.dataset.glTemplatesFieldId;
	}
	stableHost.dataset.glTemplatesFieldId = fallbackSeed;
	return fallbackSeed;
}

interface FieldTarget {
	// The element used as the anchor for `.closest()`/positioning lookups, and the
	// element marked with the "already injected" flag: the textarea in plain text
	// mode, or the markdown editor field wrapper in rich text mode.
	anchor: HTMLElement;
	containerId: string;
	textarea: HTMLTextAreaElement | null;
	richTextFieldId: string | null;
}

// Locate (or create) the container for a description field and mount/update the
// dropdown. Shared between the plain text (textarea) and rich text (content editor)
// discovery passes below.
function processField({ anchor, containerId, textarea, richTextFieldId }: FieldTarget) {
	logDebug(`[Ext] Analyzing field [ID: ${containerId}, Injected Status: ${anchor.dataset.templateDropdownInjected}]`);

	// Skip if already fully injected next to original dropdown
	if (anchor.dataset.templateDropdownInjected === "true") {
		logDebug(`[Ext] Field "${containerId}" is already fully injected next to original dropdown. Skipping.`);
		return;
	}

	// Find the form group wrapping this field
	const formGroup = anchor.closest(
		".form-group, .gl-form-group, .common-note-form",
	);

	// Check if we find the original template dropdown selector WITHIN this form group parent
	const originalDropdown = (formGroup || anchor.parentNode)?.querySelector(
		'[data-testid="template-dropdown"]',
	);
	logDebug(`[Ext] Original template dropdown exists in DOM: ${!!originalDropdown}`);

	// Search for an existing container ONLY within the scope of this field's form group parent
	let container = (formGroup || anchor.parentNode)?.querySelector(
		`.gl-shared-templates-container[data-textarea-id="${containerId}"]`,
	) as HTMLDivElement;
	logDebug(`[Ext] Scoped custom container exists in DOM: ${!!container}`);

	// Mount (or re-render with fresh props, e.g. after a plain/rich text mode switch)
	const renderDropdown = (mountContainer: HTMLDivElement) => {
		let root = (mountContainer as any).__reactRoot;
		if (!root) {
			root = createRoot(mountContainer);
			(mountContainer as any).__reactRoot = root;
		}
		root.render(
			<TemplateDropdown textarea={textarea} richTextFieldId={richTextFieldId} />,
		);
	};

	if (originalDropdown) {
		// Find or dynamically create the flexbox row wrapper to house both buttons in a single row
		let rowWrapper = originalDropdown.parentNode as HTMLElement;
		if (
			!rowWrapper ||
			!rowWrapper.classList.contains("gl-shared-templates-row-wrapper")
		) {
			logDebug('[Ext] Original templates dropdown found. Wrapping it inside row wrapper.');
			rowWrapper = document.createElement("div");
			rowWrapper.className =
				"gl-flex gl-flex-row gl-items-center gl-shared-templates-row-wrapper gl-mb-3";
			rowWrapper.style.display = "flex";
			rowWrapper.style.flexDirection = "row";
			rowWrapper.style.alignItems = "center";
			rowWrapper.style.gap = "8px";
			rowWrapper.style.marginBottom = "12px";

			originalDropdown.parentNode?.insertBefore(rowWrapper, originalDropdown);
			rowWrapper.appendChild(originalDropdown);
		}

		if (container) {
			// If container already exists but is not next to the original dropdown, move it inside the wrapper
			if (container.parentNode !== rowWrapper) {
				logDebug(
					"[Ext] Relocating existing fallback selector inside row wrapper next to original dropdown.",
				);
				rowWrapper.appendChild(container);
				container.style.marginLeft = "0px"; // Flex gap handles margins now
			}

			renderDropdown(container);
		} else {
			// Create, position, and mount the dropdown inside the row wrapper next to the original selector
			logDebug(
				"[Ext] Injecting new shared templates selector inside row wrapper.",
			);
			container = document.createElement("div");
			container.className = "gl-shared-templates-container";
			container.setAttribute("data-textarea-id", containerId);
			container.style.marginLeft = "0px"; // Flex gap handles margins now

			rowWrapper.appendChild(container);
			renderDropdown(container);
		}

		// Mark as fully/finally injected so we skip checking this field on future mutations
		anchor.dataset.templateDropdownInjected = "true";
		logDebug(`[Ext] Field "${containerId}" injection finalized.`);
	} else {
		// Original dropdown not found in DOM yet.
		// Try to find the Description label within the form group to insert our dropdown below the header
		const label = formGroup?.querySelector("label");
		const formDiv = formGroup?.querySelector(":scope > div");
		logDebug(`[Ext] Form group wrapper exists: ${!!formGroup}, Label exists: ${!!label}, Inputs container div exists: ${!!formDiv}`);

		// Find top-level child in formGroup wrapping the label (e.g. the flex header wrapper or label itself)
		let insertTarget: Element | null = null;
		if (label) {
			const parentLimit = formGroup || anchor.parentNode;
			insertTarget = label;
			while (insertTarget.parentElement && insertTarget.parentElement !== parentLimit) {
				insertTarget = insertTarget.parentElement;
			}
		}

		if (container) {
			// If container exists, check if it's positioned correctly
			let isPositionedCorrectly = false;
			if (insertTarget) {
				isPositionedCorrectly = insertTarget.nextSibling === container;
			} else if (formDiv) {
				isPositionedCorrectly = formDiv.firstChild === container;
			} else {
				isPositionedCorrectly = anchor.previousSibling === container;
			}

			if (!isPositionedCorrectly) {
				logDebug(
					"[Ext] Relocating existing fallback dropdown to correct position.",
				);
				if (insertTarget) {
					insertTarget.parentNode?.insertBefore(container, insertTarget.nextSibling);
					container.style.marginLeft = "0px";
					container.style.marginBottom = "12px";
				} else if (formDiv) {
					formDiv.insertBefore(container, formDiv.firstChild);
					container.style.marginLeft = "0px";
					container.style.marginBottom = "0px";
				} else {
					anchor.parentNode?.insertBefore(container, anchor);
					container.style.marginLeft = "0px";
					container.style.marginBottom = "0px";
				}
			} else {
				logDebug(`[Ext] Fallback dropdown is already positioned correctly. Waiting for original dropdown...`);
			}

			renderDropdown(container);
			return;
		}

		if (insertTarget || formDiv || anchor.parentNode) {
			logDebug(
				"[Ext] Injecting fallback shared templates dropdown.",
			);
			container = document.createElement("div");
			container.className = "gl-shared-templates-container";
			container.setAttribute("data-textarea-id", containerId);

			if (insertTarget) {
				insertTarget.parentNode?.insertBefore(container, insertTarget.nextSibling);
				container.style.marginLeft = "0px";
				container.style.marginBottom = "12px";
			} else if (formDiv) {
				formDiv.insertBefore(container, formDiv.firstChild);
				container.style.marginLeft = "0px";
				container.style.marginBottom = "0px";
			} else {
				anchor.parentNode?.insertBefore(container, anchor);
				container.style.marginLeft = "0px";
				container.style.marginBottom = "0px";
			}

			renderDropdown(container);
		}
	}
}

// Check for target textareas and rich text (content editor) fields, and inject
// dropdowns next to the original selector.
function injectDropdowns() {
	logDebug('[Ext] Running injectDropdowns check...');
	const textareaSelectors = [
		"textarea#issue-description",
		"textarea#merge-request-description",
		"textarea#work-item-description",
		'textarea[name="issue[description]"]',
		'textarea[name="merge_request[description]"]',
		'textarea[name="work_item[description]"]',
		'textarea[placeholder*="Describe the"]',
	];

	const textareas = document.querySelectorAll<HTMLTextAreaElement>(
		textareaSelectors.join(","),
	);

	logDebug(`[Ext] Found ${textareas.length} matching textareas on page.`);

	textareas.forEach((textarea, index) => {
		// A textarea can appear transiently inside a markdown editor field we already
		// own via the rich text path below, while we programmatically toggle to plain
		// text mode to insert content. Skip it so we don't inject a duplicate dropdown.
		const ownerField = textarea.closest(
			'[data-testid="markdown-editor-form-field"]',
		) as HTMLElement | null;
		if (ownerField?.dataset.templateDropdownInjected === "true") {
			return;
		}

		const formGroup = textarea.closest(
			".form-group, .gl-form-group, .common-note-form",
		);
		const containerId = resolveContainerId(
			formGroup,
			textarea,
			textarea.id || textarea.name || `desc-${index}`,
		);

		processField({
			anchor: textarea,
			containerId,
			textarea,
			richTextFieldId: null,
		});
	});

	// Rich text mode: GitLab replaces the textarea entirely with a ProseMirror-based
	// content editor, so there's no textarea to anchor on. The `<label for="...">`
	// pointing at these same description field ids stays in the DOM regardless of
	// mode, so use it to relocate the field without also matching unrelated
	// comment/reply boxes, which use the same rich text component.
	const descriptionFieldIds = [
		"issue-description",
		"merge-request-description",
		"work-item-description",
	];

	descriptionFieldIds.forEach((fieldId) => {
		const label = document.querySelector(`label[for="${fieldId}"]`);
		if (!label) return;

		const formGroup = label.closest(
			".form-group, .gl-form-group, .common-note-form",
		);
		const scope = formGroup || label.parentElement;
		if (!scope) return;

		// Currently in plain text mode; already handled by the textarea pass above.
		if (scope.querySelector("textarea")) {
			return;
		}

		const field = scope.querySelector<HTMLElement>(
			'[data-testid="markdown-editor-form-field"]',
		);
		if (!field) return;

		// Not actually showing the rich text content editor (e.g. still loading).
		if (!field.querySelector('[data-testid="content-editor"]')) {
			return;
		}

		const containerId = resolveContainerId(formGroup, field, `richtext-${fieldId}`);

		processField({
			anchor: field,
			containerId,
			textarea: null,
			richTextFieldId: fieldId,
		});
	});
}

// Observe DOM mutations to handle SPAs / Turbo navigation with debouncing and feedback loop prevention
let debounceTimer: any = null;
const observer = new MutationObserver((mutations) => {
	let shouldProcess = false;
	let ignoredCount = 0;
	let structureChangeCount = 0;

	for (const mutation of mutations) {
		// Only look at structure changes (added/removed nodes)
		if (mutation.type !== 'childList') continue;

		const target = mutation.target as HTMLElement;
		
		// IGNORE any mutations originating from within our own widgets to prevent rendering loops
		if (
			target &&
			typeof target.closest === 'function' &&
			(target.closest('.gl-shared-templates-container') ||
				target.closest('.gl-shared-templates-row-wrapper'))
		) {
			ignoredCount++;
			continue;
		}

		if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
			structureChangeCount++;
			shouldProcess = true;
		}
	}

	if (ignoredCount > 0 || structureChangeCount > 0) {
		logDebug(`[Ext] MutationObserver: Evaluated ${mutations.length} mutations. Ignored internal: ${ignoredCount}, Qualified structural: ${structureChangeCount}`);
	}

	if (shouldProcess) {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}
		logDebug('[Ext] Qualified structural changes found. Scheduling injectDropdowns in 150ms...');
		debounceTimer = setTimeout(() => {
			injectDropdowns();
		}, 150);
	}
});

// Start observing the page body
observer.observe(document.body, {
	childList: true,
	subtree: true,
});

// Run once on load
injectDropdowns();
