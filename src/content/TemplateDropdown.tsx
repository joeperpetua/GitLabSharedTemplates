import React, { useState, useEffect, useRef } from "react";
import {
	AlertCircle,
	RefreshCw,
	ChevronDown,
	ChevronUp,
	Search,
} from "lucide-react";
import type { TemplateFile, DropdownProps } from "./types";
import { useI18n } from "../utils/i18n";

// Developer logging setting state loaded from storage
let developerLoggingEnabled = false;

// Load initial setting
chrome.storage.sync.get({ enableLogging: false }, (items) => {
	developerLoggingEnabled = (items.enableLogging as boolean) ?? false;
});

// Listen for updates to the logging setting
chrome.storage.onChanged.addListener((changes, areaName) => {
	if (areaName === "sync" && changes.enableLogging) {
		developerLoggingEnabled = changes.enableLogging.newValue as boolean;
	}
});

// Scoped logging utility
function logDebug(...args: any[]) {
	if (developerLoggingEnabled) {
		console.log(...args);
	}
}

export const TemplateDropdown: React.FC<DropdownProps> = ({ textarea }) => {
	const { t } = useI18n();
	const [templates, setTemplates] = useState<TemplateFile[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [inserting, setInserting] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [selectedPath, setSelectedPath] = useState("");
	const [searchQuery, setSearchQuery] = useState("");

	const dropdownRef = useRef<HTMLDivElement>(null);
	const initialTextRef = useRef<string>("");
	const hasSavedInitialRef = useRef(false);

	const fetchTemplates = () => {
		setLoading(true);
		setError("");

		chrome.runtime.sendMessage({ type: "FETCH_TEMPLATES_LIST" }, (response) => {
			if (chrome.runtime.lastError) {
				console.warn("Extension connection error:", chrome.runtime.lastError);
				setError(t("dropdown.extensionInactive"));
				setLoading(false);
				return;
			}

			if (response && response.success) {
				setTemplates(response.data || []);
			} else {
				setError(
					response?.error ||
						t("dropdown.failedLoadTemplates"),
				);
			}
			setLoading(false);
		});
	};

	useEffect(() => {
		fetchTemplates();

		// Save initial description content if it's already populated on mount
		if (textarea && textarea.value) {
			initialTextRef.current = textarea.value;
			hasSavedInitialRef.current = true;
		}

		const handleStorageChange = (
			changes: { [key: string]: chrome.storage.StorageChange },
			areaName: string,
		) => {
			if (
				areaName === "sync" &&
				(changes.repoUrl || changes.pat || changes.customDomain)
			) {
				logDebug("[Ext] Settings changed, reloading templates...");
				fetchTemplates();
			}
		};

		chrome.storage.onChanged.addListener(handleStorageChange);
		return () => {
			chrome.storage.onChanged.removeListener(handleStorageChange);
		};
	}, []);

	useEffect(() => {
		if (!isOpen) return;

		const handleOutsideClick = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleOutsideClick);
		return () => {
			document.removeEventListener("mousedown", handleOutsideClick);
		};
	}, [isOpen]);

	// Reset search query when dropdown closes or opens
	useEffect(() => {
		if (!isOpen) {
			setSearchQuery("");
		}
	}, [isOpen]);

	const handleSelectTemplate = async (templatePath: string) => {
		setInserting(true);
		setSelectedPath(templatePath);
		setIsOpen(false);
		setError("");

		chrome.runtime.sendMessage(
			{ type: "FETCH_TEMPLATE_CONTENT", filePath: templatePath },
			(response) => {
				setInserting(false);

				if (chrome.runtime.lastError) {
					setError(t("dropdown.failedFetchContent"));
					return;
				}

				if (response && response.success) {
					insertContent(response.data);
				} else {
					setError(response?.error || t("dropdown.failedFetchContent"));
				}
			},
		);
	};

	const handleNoTemplate = () => {
		if (!textarea) return;
		textarea.focus();
		textarea.value = "";
		setSelectedPath("");
		setIsOpen(false);
		hasSavedInitialRef.current = false;
		textarea.dispatchEvent(new Event("input", { bubbles: true }));
		textarea.dispatchEvent(new Event("change", { bubbles: true }));
	};

	const handleResetTemplate = () => {
		if (!textarea) return;
		if (selectedPath) {
			handleSelectTemplate(selectedPath);
		} else {
			textarea.focus();
			textarea.value = initialTextRef.current;
			setSelectedPath("");
			setIsOpen(false);
			hasSavedInitialRef.current = false;
			textarea.dispatchEvent(new Event("input", { bubbles: true }));
			textarea.dispatchEvent(new Event("change", { bubbles: true }));
		}
	};

	const handleOpenSettings = () => {
		chrome.runtime.sendMessage({ type: "OPEN_OPTIONS_PAGE" });
		setIsOpen(false);
	};

	const insertContent = (content: string) => {
		if (!textarea) return;

		// Save the initial content before the first template insertion
		if (!hasSavedInitialRef.current) {
			initialTextRef.current = textarea.value;
			hasSavedInitialRef.current = true;
		}

		chrome.storage.sync.get({ shouldOverwrite: true }, (items) => {
			const overwrite = items.shouldOverwrite ?? true;

			textarea.focus();

			if (overwrite) {
				textarea.value = content;
				const endPos = content.length;
				textarea.selectionStart = endPos;
				textarea.selectionEnd = endPos;
			} else {
				const startPos = textarea.selectionStart;
				const endPos = textarea.selectionEnd;
				const value = textarea.value;

				let textToInsert = content;
				if (startPos > 0 && value.charAt(startPos - 1) !== "\n") {
					textToInsert = "\n" + textToInsert;
				}
				if (endPos < value.length && value.charAt(endPos) !== "\n") {
					textToInsert = textToInsert + "\n";
				}

				textarea.value =
					value.substring(0, startPos) + textToInsert + value.substring(endPos);

				const newCursorPos = startPos + textToInsert.length;
				textarea.selectionStart = newCursorPos;
				textarea.selectionEnd = newCursorPos;
			}

			textarea.dispatchEvent(new Event("input", { bubbles: true }));
			textarea.dispatchEvent(new Event("change", { bubbles: true }));
		});
	};

	const formatTemplateName = (name: string) => {
		return name.replace(/\.md$/i, "").trim();
	};

	const getActiveTemplateName = () => {
		if (inserting) return t("dropdown.inserting");
		const active = templates.find((t) => t.path === selectedPath);
		return active
			? formatTemplateName(active.name)
			: t("dropdown.chooseTemplate");
	};

	if (loading) {
		return null;
	}

	if (error) {
		return (
			<div className="gl-template-injector-status gl-template-status-error">
				<AlertCircle
					style={{
						width: "14px",
						height: "14px",
						stroke: "#ff6b6b",
						fill: "none",
						flexShrink: 0,
					}}
				/>
				<span
					style={{
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
						maxWidth: "200px",
					}}
					title={error}
				>
					{error}
				</span>
				<button
					onClick={fetchTemplates}
					className="gl-template-status-retry-btn"
				>
					<RefreshCw
						style={{
							width: "12px",
							height: "12px",
							stroke: "currentColor",
							fill: "none",
						}}
					/>{" "}
					{t("dropdown.retry")}
				</button>
			</div>
		);
	}

	const filteredTemplates = templates.filter((template) =>
		formatTemplateName(template.name)
			.toLowerCase()
			.includes(searchQuery.toLowerCase()),
	);

	const getCurrentViewType = (): "issue" | "merge_request" | "other" => {
		const href = window.location.href.toLowerCase();
		if (href.includes("/merge_requests") || href.includes("/merge-requests")) {
			return "merge_request";
		}
		if (href.includes("/issues")) {
			return "issue";
		}

		if (textarea) {
			const id = (textarea.id || "").toLowerCase();
			const name = (textarea.name || "").toLowerCase();
			if (
				id.includes("merge-request") ||
				id.includes("mergerequest") ||
				name.includes("merge_request")
			) {
				return "merge_request";
			}
			if (id.includes("issue") || name.includes("issue")) {
				return "issue";
			}
		}

		return "other";
	};

	const getGroupedTemplates = () => {
		const groups: {
			issueTemplates: TemplateFile[];
			mergeRequestTemplates: TemplateFile[];
			otherTemplates: TemplateFile[];
		} = {
			issueTemplates: [],
			mergeRequestTemplates: [],
			otherTemplates: [],
		};

		for (const template of filteredTemplates) {
			const parts = template.path.split("/");
			let groupKey: "issueTemplates" | "mergeRequestTemplates" | "otherTemplates" = "otherTemplates";
			if (parts.length > 1) {
				const parentFolder = parts[parts.length - 2].toLowerCase();
				if (parentFolder === "issue_templates") {
					groupKey = "issueTemplates";
				} else if (parentFolder === "merge_request_templates") {
					groupKey = "mergeRequestTemplates";
				}
			}
			groups[groupKey].push(template);
		}

		return groups;
	};

	const renderTemplateGroup = (
		title: string,
		groupTemplates: TemplateFile[],
		showSeparator: boolean,
	) => {
		if (groupTemplates.length === 0) return null;

		return (
			<React.Fragment key={title}>
				{showSeparator && <div className="gl-template-category-separator" />}
				<div className="gl-template-category-header">{title}</div>
				{groupTemplates.map((template) => {
					const isSelected = template.path === selectedPath;
					return (
						<div
							key={template.id}
							onClick={() => handleSelectTemplate(template.path)}
							className={`gl-template-option gl-new-dropdown-item-content ${isSelected ? "selected" : ""}`}
						>
							{isSelected && (
								<span className="gl-template-option-check">
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="3.5"
										strokeLinecap="round"
										strokeLinejoin="round"
										style={{
											width: "100%",
											height: "100%",
											fill: "none",
											stroke: "#3894ff",
										}}
									>
										<polyline points="20 6 9 17 4 12"></polyline>
									</svg>
								</span>
							)}
							{formatTemplateName(template.name)}
						</div>
					);
				})}
			</React.Fragment>
		);
	};

	return (
		<div
			className="gl-w-30 gl-new-dropdown gl-new-dropdown-panel !gl-block gl-template-dropdown-container"
			ref={dropdownRef}
			style={{ position: "relative" }}
		>
			<button
				type="button"
				disabled={inserting}
				onClick={() => setIsOpen(!isOpen)}
				className="btn gl-button btn-default btn-md btn-block !gl-text-subtle gl-new-dropdown-toggle"
			>
				<span
					className="gl-button-text gl-w-full"
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						width: "100%",
					}}
				>
					<span
						className="gl-new-dropdown-button-text"
						style={{
							overflow: "hidden",
							whiteSpace: "nowrap",
						}}
					>
						{getActiveTemplateName()}
					</span>
					{isOpen ? (
						<ChevronUp
							style={{
								width: "14px",
								height: "14px",
								fill: "none",
								stroke: "currentColor",
							}}
						/>
					) : (
						<ChevronDown
							style={{
								width: "14px",
								height: "14px",
								fill: "none",
								stroke: "currentColor",
							}}
						/>
					)}
				</span>
			</button>

			{isOpen && (
				<div className="gl-template-menu">
					<div className="gl-template-menu-header">{t("dropdown.selectTemplate")}</div>

					<div className="gl-template-menu-search-wrapper">
						<Search
							className="gl-template-search-icon"
							style={{
								width: "12px",
								height: "12px",
								fill: "none",
								stroke: "#89929b",
							}}
						/>
						<input
							type="search"
							placeholder={t("dropdown.search")}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="gl-template-search-input"
							autoFocus
						/>
					</div>

					<div className="gl-template-menu-category">{t("dropdown.sharedTemplates")}</div>

					<div className="gl-template-menu-options-list">
						{filteredTemplates.length === 0 ? (
							<div className="gl-template-menu-no-results">
								{t("dropdown.noResults")}
							</div>
						) : (
							(() => {
								const groups = getGroupedTemplates();
								const viewType = getCurrentViewType();

								// Determine render order based on current view
								const renderOrder: Array<{
									title: string;
									templates: TemplateFile[];
								}> = [];

								if (viewType === "merge_request") {
									renderOrder.push(
										{ title: t("dropdown.mergeRequestTemplates"), templates: groups.mergeRequestTemplates },
										{ title: t("dropdown.issueTemplates"), templates: groups.issueTemplates },
										{ title: t("dropdown.otherTemplates"), templates: groups.otherTemplates },
									);
								} else {
									// Default: issue templates first
									renderOrder.push(
										{ title: t("dropdown.issueTemplates"), templates: groups.issueTemplates },
										{ title: t("dropdown.mergeRequestTemplates"), templates: groups.mergeRequestTemplates },
										{ title: t("dropdown.otherTemplates"), templates: groups.otherTemplates },
									);
								}

								const renderedGroups: React.ReactNode[] = [];
								let hasAnyContentBefore = false;

								for (const group of renderOrder) {
									if (group.templates.length > 0) {
										renderedGroups.push(
											renderTemplateGroup(
												group.title,
												group.templates,
												hasAnyContentBefore,
											),
										);
										hasAnyContentBefore = true;
									}
								}

								return renderedGroups;
							})()
						)}
					</div>

					<div className="gl-template-menu-divider"></div>
					<div className="gl-p-2 gl-pt-0">
						<button
							className="gl-mt-2 !gl-justify-start btn gl-button btn-default btn-md btn-block btn-default-tertiary"
							onClick={handleNoTemplate}
						>
							{t("dropdown.noTemplate")}
						</button>
						<button
							className="gl-mt-2 !gl-justify-start btn gl-button btn-default btn-md btn-block btn-default-tertiary"
							onClick={handleResetTemplate}
						>
							{t("dropdown.resetTemplate")}
						</button>
						<div className="gl-template-menu-divider"></div>
						<button
							className="gl-mt-2 !gl-justify-start btn gl-button btn-default btn-md btn-block btn-default-tertiary"
							style={{ color: "#3894ff" }}
							onClick={handleOpenSettings}
						>
							{t("dropdown.openSettings")}
						</button>
					</div>
				</div>
			)}
		</div>
	);
};
