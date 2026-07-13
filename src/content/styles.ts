// Scoped CSS styles injection for custom dropdown UI matching GitLab design guidelines
export const injectStyles = () => {
	const STYLE_ID = "gl-shared-templates-styles";
	if (document.getElementById(STYLE_ID)) return;

	const styleEl = document.createElement("style");
	styleEl.id = STYLE_ID;
	styleEl.textContent = `
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
      background-color: #1e1e24;
      border: 1px solid #2d2e36;
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
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
      border-color: transparent transparent #1e1e24 transparent;
      pointer-events: none;
    }
    .gl-template-menu::after {
      content: '';
      position: absolute;
      bottom: 100%;
      left: 20px;
      border-width: 7px;
      border-style: solid;
      border-color: transparent transparent #2d2e36 transparent;
      z-index: -1;
      pointer-events: none;
    }
    
    /* Header inside popover */
    .gl-template-menu-header {
      font-size: 13px;
      font-weight: 600;
      color: #ffffff;
      padding: 10px 12px;
      border-bottom: 1px solid #2d2e36;
      text-align: left;
    }
    
    /* Search box wrapper */
    .gl-template-menu-search-wrapper {
      padding: 8px;
      position: relative;
      border-bottom: 1px solid #2d2e36;
    }
    
    .gl-template-search-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      width: 12px;
      height: 12px;
      color: #89929b;
      pointer-events: none;
    }
    
    .gl-template-search-input {
      width: 100%;
      background-color: #16171d;
      border: 1px solid #3c3e47;
      border-radius: 4px;
      padding: 6px 12px 6px 28px;
      font-size: 13px;
      color: #ffffff;
      box-sizing: border-box;
    }
    
    .gl-template-search-input:focus {
      outline: none;
      border-color: #3894ff;
    }
    
    /* Category label */
    .gl-template-menu-category {
      font-size: 12px;
      font-weight: 600;
      color: #ffffff;
      padding: 10px 12px 6px;
      text-align: left;
    }
    
    /* Options list wrapper (scrollable) */
    .gl-template-menu-options-list {
      max-height: 180px;
      overflow-y: auto;
      padding: 4px;
    }
    
    /* Option item */
    .gl-template-option {
      display: flex;
      align-items: center;
      padding: 8px 10px;
      font-size: 13px;
      color: var(--gl-dropdown-option-text-color-default);
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
      background-color: #2b2d35;
      color: #ffffff;
    }
    .gl-template-option.selected {
      border-color: #3894ff;
      background-color: rgba(56, 148, 255, 0.12);
      color: #ffffff;
    }
    .gl-template-option-check {
      position: absolute;
      left: 8px;
      top: 50%;
      transform: translateY(-50%);
      color: #3894ff;
      width: 12px;
      height: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Divider and Footer buttons */
    .gl-template-menu-divider {
      height: 1px;
      background-color: #2d2e36;
      margin: 4px 0;
    }
    
    .gl-template-footer-btn {
      padding: 8px 12px;
      font-size: 13px;
      color: #c9d1d9;
      cursor: pointer;
      text-align: left;
      transition: background-color 0.15s ease, color 0.15s ease;
      user-select: none;
      border-radius: 6px;
      margin: 0 4px 2px;
    }
    
    .gl-template-footer-btn:hover {
      background-color: #2b2d35;
      color: #ffffff;
    }
    
    .gl-template-menu-no-results {
      font-size: 13px;
      color: #89929b;
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
      color: #89929b;
      background-color: #1e1e24;
      border: 1px solid #2d2e36;
      border-radius: 6px;
      font-family: "GitLab Sans", "Gitlab Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .gl-template-status-error {
      color: #ff6b6b;
      background-color: rgba(255, 107, 107, 0.08);
      border-color: rgba(255, 107, 107, 0.2);
    }
    .gl-template-status-retry-btn {
      background: none;
      border: none;
      color: #3894ff;
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
      color: #58a6ff;
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
