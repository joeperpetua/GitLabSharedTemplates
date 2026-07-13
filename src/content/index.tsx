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
			// Find the form-group div that contains the editor wrapper and label to prepend our dropdown under the label
			const formDiv = formGroup?.querySelector(":scope > div");
			logDebug(`[Ext] Form group wrapper exists: ${!!formGroup}, Inputs container div exists: ${!!formDiv}`);

			if (container) {
				// If container exists, check if it's placed under the Description label wrapper
				if (formDiv && formDiv.firstChild !== container) {
					logDebug(
						"[Ext] Relocating existing fallback dropdown directly under Description title.",
					);
					formDiv.insertBefore(container, formDiv.firstChild);
					container.style.marginLeft = "0px"; // Align with left edge
				} else {
					logDebug(`[Ext] Fallback dropdown is already positioned correctly under Description title. Waiting for original dropdown...`);
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

			if (formDiv || textarea.parentNode) {
				logDebug(
					"[Ext] Prepending fallback shared templates dropdown directly under Description title.",
				);
				container = document.createElement("div");
				container.className = "gl-shared-templates-container";
				container.setAttribute("data-textarea-id", containerId);
				container.style.marginLeft = "0px"; // Align with left edge

				if (formDiv) {
					// Prepend at the beginning of the form inputs container (above the editor wrapper)
					formDiv.insertBefore(container, formDiv.firstChild);
				} else {
					// Fallback to inserting directly before the textarea
					textarea.parentNode?.insertBefore(container, textarea);
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
