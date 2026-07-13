import { extractProjectPath, normalizeGitLabDomain } from '../utils/gitlab';
// @ts-ignore
import contentScriptPath from '../content/index.tsx?script';

interface GitLabSettings {
  repoUrl: string;
  pat: string;
  customDomain: string;
}

// Helper to get settings from storage
async function getSettings(): Promise<GitLabSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        repoUrl: '',
        pat: '',
        customDomain: '',
      },
      (items) => {
        resolve(items as unknown as GitLabSettings);
      }
    );
  });
}

// Helper to make GitLab API request
async function makeGitLabRequest(
  endpoint: string,
  settings: GitLabSettings,
  queryParams: Record<string, string> = {},
  isRawResponse = false
) {
  const domain = normalizeGitLabDomain(settings.customDomain);
  const projectPath = extractProjectPath(settings.repoUrl);
  
  if (!projectPath) {
    throw new Error('Invalid GitLab repository URL. Please check extension settings.');
  }

  // URL-encode the project path as required by GitLab API
  const encodedProjectPath = encodeURIComponent(projectPath);
  
  // Construct search params
  const searchParams = new URLSearchParams(queryParams);
  const url = `${domain}/api/v4/projects/${encodedProjectPath}${endpoint}?${searchParams.toString()}`;
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  
  if (settings.pat && settings.pat.trim() !== '') {
    headers['PRIVATE-TOKEN'] = settings.pat.trim();
  }
  
  console.log(`GitLab API Request: ${url}`);
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    let errorMsg = `GitLab API error: ${response.status} ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.message) {
        errorMsg = errorJson.message;
      }
    } catch {
      // ignore JSON parse error for error response
    }
    throw new Error(errorMsg);
  }
  
  if (isRawResponse) {
    return response.text();
  }
  return response.json();
}

// Fetch default branch of the project
async function fetchDefaultBranch(settings: GitLabSettings): Promise<string> {
  try {
    const projectInfo = await makeGitLabRequest('', settings);
    return projectInfo.default_branch || 'main';
  } catch (error) {
    console.warn('Failed to fetch project info, defaulting to main branch:', error);
    return 'main';
  }
}

// Handle fetch templates request
async function handleFetchTemplates() {
  const settings = await getSettings();
  if (!settings.repoUrl) {
    throw new Error('Repository URL not configured in extension settings.');
  }

  const defaultBranch = await fetchDefaultBranch(settings);
  
  // Fetch files in the repository
  const files = await makeGitLabRequest(
    '/repository/tree',
    settings,
    {
      ref: defaultBranch,
      recursive: 'true',
      per_page: '100',
    }
  );
  
  if (!Array.isArray(files)) {
    throw new Error('Unexpected GitLab API response format.');
  }
  
  // Filter for .md files and map to a simpler format
  return files
    .filter((file: any) => file.type === 'blob' && file.name.endsWith('.md'))
    .map((file: any) => ({
      name: file.name,
      path: file.path,
      id: file.id,
    }));
}

// Handle fetch file content request
async function handleFetchTemplateContent(filePath: string) {
  const settings = await getSettings();
  if (!settings.repoUrl) {
    throw new Error('Repository URL not configured.');
  }
  
  const defaultBranch = await fetchDefaultBranch(settings);
  
  // Fetch raw file content
  const encodedFilePath = encodeURIComponent(filePath);
  const content = await makeGitLabRequest(
    `/repository/files/${encodedFilePath}/raw`,
    settings,
    { ref: defaultBranch },
    true
  );
  
  return content;
}

// Listen for messages from content scripts or settings page
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Received background message:', message);
  
  if (message.type === 'FETCH_TEMPLATES_LIST') {
    handleFetchTemplates()
      .then((templates) => {
        sendResponse({ success: true, data: templates });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
  
  if (message.type === 'FETCH_TEMPLATE_CONTENT') {
    handleFetchTemplateContent(message.filePath)
      .then((content) => {
        sendResponse({ success: true, data: content });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
  
  // Support dynamic registration of content scripts when custom domain is saved/loaded
  if (message.type === 'REGISTER_DYNAMIC_SCRIPTS') {
    registerDynamicScripts()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // Open the options page of the extension
  if (message.type === 'OPEN_OPTIONS_PAGE') {
    chrome.runtime.openOptionsPage();
    sendResponse({ success: true });
    return true;
  }
});

// Open options page when clicking the extension icon
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

// Setup dynamic content scripts on extension startup/install
chrome.runtime.onInstalled.addListener(() => {
  registerDynamicScripts();
});

chrome.runtime.onStartup.addListener(() => {
  registerDynamicScripts();
});

// Helper to register dynamic content scripts for custom domains
async function registerDynamicScripts() {
  const settings = await getSettings();
  if (!settings.customDomain) return;

  const domain = normalizeGitLabDomain(settings.customDomain);
  const matchPattern = `${domain}/*`;
  
  // Do not register if it's the default gitlab.com since that is handled statically
  if (domain.includes('gitlab.com')) {
    return;
  }

  try {
    // Check if we have permission for the custom domain before registering
    const hasPermission = await chrome.permissions.contains({
      origins: [matchPattern],
    });

    if (!hasPermission) {
      console.log(`No host permission for custom domain ${matchPattern}. Skipping content script registration.`);
      return;
    }

    const scriptId = 'gitlab-custom-domain';
    
    // Unregister existing first to prevent duplicate registrations
    try {
      await chrome.scripting.unregisterContentScripts({ ids: [scriptId] });
    } catch {
      // Ignore if not already registered
    }

    console.log(`Registering dynamic content script for: ${matchPattern}`);
    await chrome.scripting.registerContentScripts([
      {
        id: scriptId,
        matches: [matchPattern],
        js: [contentScriptPath], // CRXJS resolves this to the compiled loader filename
        runAt: 'document_idle',
      },
    ]);
  } catch (error) {
    console.error('Failed to register dynamic content script:', error);
  }
}
