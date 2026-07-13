/**
 * Utility function to extract the project path or ID from a GitLab repository URL.
 * Handles self-hosted instances, subgroups, trailing slashes, .git extensions,
 * and URLs that point to subfolders/branches.
 * 
 * Examples:
 * - https://gitlab.com/username/project -> username/project
 * - https://gitlab.my-company.com/group/subgroup/project.git -> group/subgroup/project
 * - https://gitlab.com/username/project/-/tree/main -> username/project
 */
export function extractProjectPath(repoUrl: string): string {
  if (!repoUrl) return '';
  
  try {
    // Standardize URL by adding protocol if missing
    let urlString = repoUrl.trim();
    if (!/^https?:\/\//i.test(urlString)) {
      urlString = 'https://' + urlString;
    }
    
    const url = new URL(urlString);
    let pathname = url.pathname;
    
    // Split by repository structure indicator if present (e.g. /-/tree/...)
    if (pathname.includes('/-/')) {
      pathname = pathname.split('/-/')[0];
    }
    
    // Clean leading and trailing slashes
    pathname = pathname.replace(/^\/+|\/+$/g, '');
    
    // Remove .git suffix if present
    if (pathname.endsWith('.git')) {
      pathname = pathname.slice(0, -4);
    }
    
    return pathname;
  } catch (error) {
    console.error('Failed to parse GitLab URL:', error);
    return '';
  }
}

/**
 * Normalizes a GitLab instance base URL (e.g., https://gitlab.com).
 * Defaults to https://gitlab.com if empty.
 */
export function normalizeGitLabDomain(domain: string): string {
  if (!domain || !domain.trim()) {
    return 'https://gitlab.com';
  }
  
  let cleanDomain = domain.trim();
  if (!/^https?:\/\//i.test(cleanDomain)) {
    cleanDomain = 'https://' + cleanDomain;
  }
  
  // Remove trailing slashes
  return cleanDomain.replace(/\/+$/, '');
}
