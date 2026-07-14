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

// Check for target textareas and inject dropdowns next to original selector
function injectDropdowns() {
	logDebug('[Ext] Running injectDropdowns check...');
	const selectors = [
		"textarea#issue-description",
		"textarea#merge-request-description",
		"textarea#work-item-description",
		'textarea[name="issue[description]"]',
		'textarea[name="merge_request[description]"]',
		'textarea[name="work_item[description]"]',
		'textarea[placeholder*="Describe the"]',
	];

	const textareas = document.querySelectorAll<HTMLTextAreaElement>(
		selectors.join(","),
	);

	logDebug(`[Ext] Found ${textareas.length} matching textareas on page.`);

	textareas.forEach((textarea, index) => {
		const containerId = textarea.id || textarea.name || `desc-${index}`;
		logDebug(`[Ext] Analyzing textarea [ID: ${textarea.id}, Name: ${textarea.name}, Injected Status: ${textarea.dataset.templateDropdownInjected}]`);

		// Skip if already fully injected next to original dropdown
		if (textarea.dataset.templateDropdownInjected === 'true') {
			logDebug(`[Ext] Textarea "${containerId}" is already fully injected next to original dropdown. Skipping.`);
			return;
		}

		// Find the form group wrapping this textarea
		const formGroup = textarea.closest(
			".form-group, .gl-form-group, .common-note-form",
		);

		// Check if we find the original template dropdown selector WITHIN this form group parent
		const originalDropdown = (formGroup || textarea.parentNode)?.querySelector(
			'[data-testid="template-dropdown"]',
		);
		logDebug(`[Ext] Original template dropdown exists in DOM: ${!!originalDropdown}`);

		// Search for an existing container ONLY within the scope of this textarea's form group parent
		let container = (formGroup || textarea.parentNode)?.querySelector(
			`.gl-shared-templates-container[data-textarea-id="${containerId}"]`,
		) as HTMLDivElement;
		logDebug(`[Ext] Scoped custom container exists in DOM: ${!!container}`);

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

				// Double-render check: ensure React is mounted
				if (!(container as any).__reactRoot) {
					logDebug("[Ext] Container exists but React root missing inside row wrapper. Rendering root.");
					const root = createRoot(container);
					(container as any).__reactRoot = root;
					root.render(<TemplateDropdown textarea={textarea} />);
				}
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

				const root = createRoot(container);
				(container as any).__reactRoot = root;
				root.render(<TemplateDropdown textarea={textarea} />);
			}
			
			// Mark as fully/finally injected so we skip checking this textarea on future mutations
			textarea.dataset.templateDropdownInjected = "true";
			logDebug(`[Ext] Textarea "${containerId}" injection finalized.`);
		} else {
			// Original dropdown not found in DOM yet.
			// Try to find the Description label within the form group to insert our dropdown below the header
			const label = formGroup?.querySelector("label");
			const formDiv = formGroup?.querySelector(":scope > div");
			logDebug(`[Ext] Form group wrapper exists: ${!!formGroup}, Label exists: ${!!label}, Inputs container div exists: ${!!formDiv}`);

			// Find top-level child in formGroup wrapping the label (e.g. the flex header wrapper or label itself)
			let insertTarget: Element | null = null;
			if (label) {
				const parentLimit = formGroup || textarea.parentNode;
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
					isPositionedCorrectly = textarea.previousSibling === container;
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
						textarea.parentNode?.insertBefore(container, textarea);
						container.style.marginLeft = "0px";
						container.style.marginBottom = "0px";
					}
				} else {
					logDebug(`[Ext] Fallback dropdown is already positioned correctly. Waiting for original dropdown...`);
				}

				// Double-render check: ensure React is mounted
				if (!(container as any).__reactRoot) {
					logDebug("[Ext] Container exists but React root missing on fallback. Rendering root.");
					const root = createRoot(container);
					(container as any).__reactRoot = root;
					root.render(<TemplateDropdown textarea={textarea} />);
				}
				return;
			}

			if (insertTarget || formDiv || textarea.parentNode) {
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
					textarea.parentNode?.insertBefore(container, textarea);
					container.style.marginLeft = "0px";
					container.style.marginBottom = "0px";
				}

				const root = createRoot(container);
				(container as any).__reactRoot = root;
				root.render(<TemplateDropdown textarea={textarea} />);
			}
		}
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
