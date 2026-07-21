export interface TemplateFile {
	name: string;
	path: string;
	id: string;
}

export interface DropdownProps {
	// Present when the description field is in plain text (textarea) mode.
	textarea: HTMLTextAreaElement | null;
	// Present when the description field is in rich text mode: the real element id
	// GitLab gives the field (e.g. "issue-description"). GitLab can replace the whole
	// rich text editor wrapper when toggling modes, so we re-resolve everything from
	// this stable id at insertion time rather than holding a direct element reference.
	richTextFieldId?: string | null;
}
