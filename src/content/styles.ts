// Scoped CSS styles injection for custom dropdown UI matching GitLab design guidelines
export const injectStyles = () => {
	const STYLE_ID = "gl-shared-templates-styles";
	if (document.getElementById(STYLE_ID)) return;

	const styleEl = document.createElement("style");
	styleEl.id = STYLE_ID;
	styleEl.textContent = `
    /* Light Mode (default GitLab colors) */
    :root {
      --gl-template-bg: #ffffff;
      --gl-template-border: #dbdbdb;
      --gl-template-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
      --gl-template-text-primary: #1f1f1f;
      --gl-template-text-secondary: #5e646e;
      --gl-template-search-bg: #ffffff;
      --gl-template-search-border: #89929b;
      --gl-template-search-focus-border: #3894ff;
      --gl-template-option-hover-bg: #f2f2f2;
      --gl-template-option-hover-text: #1f1f1f;
      --gl-template-option-selected-bg: #e9f2ff;
      --gl-template-option-selected-border: #3894ff;
      --gl-template-option-selected-text: #1f1f1f;
      --gl-template-badge-bg: #f2f2f2;
      --gl-template-badge-border: #dbdbdb;
      --gl-template-badge-text: #5e646e;
      --gl-template-error-bg: #fff5f5;
      --gl-template-error-border: #ffc9c9;
      --gl-template-error-text: #fa5252;
    }

    /* Dark Mode (when html or body has .gl-dark or .dark, or dark mode preferred) */
    @media (prefers-color-scheme: dark) {
      :root {
        --gl-template-bg: #28272d;
        --gl-template-border: #2d2e36;
        --gl-template-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
        --gl-template-text-primary: #ffffff;
        --gl-template-text-secondary: #89929b;
        --gl-template-search-bg: #16171d;
        --gl-template-search-border: #3c3e47;
        --gl-template-search-focus-border: #3894ff;
        --gl-template-option-hover-bg: #2b2d35;
        --gl-template-option-hover-text: #ffffff;
        --gl-template-option-selected-bg: rgba(56, 148, 255, 0.12);
        --gl-template-option-selected-border: #3894ff;
        --gl-template-option-selected-text: #ffffff;
        --gl-template-badge-bg: #28272d;
        --gl-template-badge-border: #2d2e36;
        --gl-template-badge-text: #89929b;
        --gl-template-error-bg: rgba(255, 107, 107, 0.08);
        --gl-template-error-border: rgba(255, 107, 107, 0.2);
        --gl-template-error-text: #ff6b6b;
      }
    }

    html.gl-dark, body.gl-dark, html.dark, body.dark, [data-theme="dark"] {
      --gl-template-bg: #28272d;
      --gl-template-border: #2d2e36;
      --gl-template-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
      --gl-template-text-primary: #ffffff;
      --gl-template-text-secondary: #89929b;
      --gl-template-search-bg: #16171d;
      --gl-template-search-border: #3c3e47;
      --gl-template-search-focus-border: #3894ff;
      --gl-template-option-hover-bg: #2b2d35;
      --gl-template-option-hover-text: #ffffff;
      --gl-template-option-selected-bg: rgba(56, 148, 255, 0.12);
      --gl-template-option-selected-border: #3894ff;
      --gl-template-option-selected-text: #ffffff;
      --gl-template-badge-bg: #28272d;
      --gl-template-badge-border: #2d2e36;
      --gl-template-badge-text: #89929b;
      --gl-template-error-bg: rgba(255, 107, 107, 0.08);
      --gl-template-error-border: rgba(255, 107, 107, 0.2);
      --gl-template-error-text: #ff6b6b;
    }

    html.gl-light, body.gl-light, html.light, body.light, [data-theme="light"] {
      --gl-template-bg: #ffffff;
      --gl-template-border: #dbdbdb;
      --gl-template-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
      --gl-template-text-primary: #1f1f1f;
      --gl-template-text-secondary: #5e646e;
      --gl-template-search-bg: #ffffff;
      --gl-template-search-border: #89929b;
      --gl-template-search-focus-border: #3894ff;
      --gl-template-option-hover-bg: #f2f2f2;
      --gl-template-option-hover-text: #1f1f1f;
      --gl-template-option-selected-bg: #e9f2ff;
      --gl-template-option-selected-border: #3894ff;
      --gl-template-option-selected-text: #1f1f1f;
      --gl-template-badge-bg: #f2f2f2;
      --gl-template-badge-border: #dbdbdb;
      --gl-template-badge-text: #5e646e;
      --gl-template-error-bg: #fff5f5;
      --gl-template-error-border: #ffc9c9;
      --gl-template-error-text: #fa5252;
    }

    .gl-shared-templates-container {
      display: inline-flex;
      align-items: center;
      margin-left: 0px;
      vertical-align: middle;
    }
    .gl-template-dropdown-container {
      position: relative;
      font-family: "GitLab Sans", "Gitlab Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: inline-block;
    }
    
    /* Menu Popover Container */
    .gl-template-menu {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 8px;
      background-color: var(--gl-template-bg);
      border: 1px solid var(--gl-template-border);
      border-radius: 8px;
      box-shadow: var(--gl-template-shadow);
      z-index: 99999;
      min-width: 230px;
      max-width: 280px;
      overflow: hidden;
      box-sizing: border-box;
    }
    .gl-template-menu::before {
      content: '';
      position: absolute;
      bottom: 100%;
      left: 20px;
      border-width: 6px;
      border-style: solid;
      border-color: transparent transparent var(--gl-template-bg) transparent;
      pointer-events: none;
    }
    .gl-template-menu::after {
      content: '';
      position: absolute;
      bottom: 100%;
      left: 20px;
      border-width: 7px;
      border-style: solid;
      border-color: transparent transparent var(--gl-template-border) transparent;
      z-index: -1;
      pointer-events: none;
    }
    
    /* Header inside popover */
    .gl-template-menu-header {
      font-size: 13px;
      font-weight: 600;
      color: var(--gl-template-text-primary);
      padding: 10px 12px;
      border-bottom: 1px solid var(--gl-template-border);
      text-align: left;
    }
    
    /* Search box wrapper */
    .gl-template-menu-search-wrapper {
      padding: 8px;
      position: relative;
      border-bottom: 1px solid var(--gl-template-border);
    }
    
    .gl-template-search-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      width: 12px;
      height: 12px;
      color: var(--gl-template-text-secondary);
      pointer-events: none;
    }
    
    .gl-template-search-input {
      width: 100%;
      background-color: var(--gl-template-search-bg);
      border: 1px solid var(--gl-template-search-border);
      border-radius: 4px;
      padding: 6px 12px 6px 28px;
      font-size: 13px;
      color: var(--gl-template-text-primary);
      box-sizing: border-box;
    }
    
    .gl-template-search-input:focus {
      outline: none;
      border-color: var(--gl-template-search-focus-border);
    }
    
    /* Category label */
    .gl-template-menu-category {
      font-size: 12px;
      font-weight: 600;
      color: var(--gl-template-text-primary);
      padding: 10px 12px 6px;
      text-align: left;
    }
    
    /* Options list wrapper (scrollable) */
    .gl-template-menu-options-list {
      max-height: 180px;
      overflow-y: auto;
      padding: 4px;
      scrollbar-width: thin;
      scrollbar-color: var(--gl-template-border) transparent;
    }
    .gl-template-menu-options-list::-webkit-scrollbar {
      width: 4px;
    }
    .gl-template-menu-options-list::-webkit-scrollbar-track {
      background: transparent;
    }
    .gl-template-menu-options-list::-webkit-scrollbar-thumb {
      background-color: var(--gl-template-border);
      border-radius: 4px;
    }
    
    /* Option item */
    .gl-template-option {
      display: flex;
      align-items: center;
      padding: 8px 10px;
      font-size: 13px;
      color: var(--gl-template-text-primary);
      border-radius: 6px;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.15s ease, color 0.15s ease;
      margin-bottom: 2px;
      position: relative;
      padding-left: 28px;
      border: 1px solid transparent;
      box-sizing: border-box;
      text-align: left;
    }
    .gl-template-option:last-child {
      margin-bottom: 0;
    }
    .gl-template-option:hover {
      background-color: var(--gl-template-option-hover-bg);
      color: var(--gl-template-option-hover-text);
    }
    .gl-template-option.selected {
      border-color: var(--gl-template-option-selected-border);
      background-color: var(--gl-template-option-selected-bg);
      color: var(--gl-template-option-selected-text);
    }
    .gl-template-option-check {
      position: absolute;
      left: 8px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--gl-template-option-selected-border);
      width: 12px;
      height: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Divider and Footer buttons */
    .gl-template-menu-divider {
      height: 1px;
      background-color: var(--gl-template-border);
      margin: 4px 0;
    }
    
    .gl-template-category-header {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--gl-template-text-secondary);
      padding: 8px 10px 4px;
      text-align: left;
      letter-spacing: 0.04em;
    }
    
    .gl-template-category-separator {
      height: 1px;
      background-color: var(--gl-template-border);
      margin: 6px 10px;
    }
    
    .gl-template-footer-btn {
      padding: 8px 12px;
      font-size: 13px;
      color: var(--gl-template-text-primary);
      cursor: pointer;
      text-align: left;
      transition: background-color 0.15s ease, color 0.15s ease;
      user-select: none;
      border-radius: 6px;
      margin: 0 4px 2px;
    }
    
    .gl-template-footer-btn:hover {
      background-color: var(--gl-template-option-hover-bg);
      color: var(--gl-template-option-hover-text);
    }
    
    .gl-template-menu-no-results {
      font-size: 13px;
      color: var(--gl-template-text-secondary);
      padding: 12px;
      text-align: center;
    }
    
    /* Scoped SVG override to prevent GitLab SVG fill styling */
    .gl-template-dropdown-container svg,
    .gl-template-dropdown-container svg *,
    .gl-template-injector-status svg,
    .gl-template-injector-status svg * {
      fill: none !important;
    }
    
    /* Loading & Error Status Badges */
    .gl-template-injector-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      font-size: 12px;
      color: var(--gl-template-badge-text);
      background-color: var(--gl-template-badge-bg);
      border: 1px solid var(--gl-template-badge-border);
      border-radius: 6px;
      font-family: "GitLab Sans", "Gitlab Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .gl-template-status-error {
      color: var(--gl-template-error-text);
      background-color: var(--gl-template-error-bg);
      border-color: var(--gl-template-error-border);
    }
    .gl-template-status-retry-btn {
      background: none;
      border: none;
      color: var(--gl-template-option-selected-border);
      cursor: pointer;
      text-decoration: underline;
      padding: 0;
      font-size: 12px;
      margin-left: 4px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .gl-template-status-retry-btn:hover {
      color: #3894ff;
    }
    .gl-template-spin {
      animation: gl-spin 1.2s linear infinite;
    }
    @keyframes gl-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
	document.head.appendChild(styleEl);
};
