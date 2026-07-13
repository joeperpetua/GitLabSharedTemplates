import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  KeyRound, 
  FolderGit2, 
  Globe, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  HelpCircle,
  Play,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { normalizeGitLabDomain, extractProjectPath } from '../utils/gitlab';

export default function OptionsApp() {
  const [repoUrl, setRepoUrl] = useState('');
  const [pat, setPat] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [shouldOverwrite, setShouldOverwrite] = useState(true);
  const [enableLogging, setEnableLogging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);

  // Load settings on mount
  useEffect(() => {
    chrome.storage.sync.get(
      {
        repoUrl: '',
        pat: '',
        customDomain: '',
        shouldOverwrite: true,
        enableLogging: false,
      },
      (items) => {
        const typedItems = items as { repoUrl?: string; pat?: string; customDomain?: string; shouldOverwrite?: boolean; enableLogging?: boolean };
        setRepoUrl(typedItems.repoUrl || '');
        setPat(typedItems.pat || '');
        setCustomDomain(typedItems.customDomain || '');
        setShouldOverwrite(typedItems.shouldOverwrite ?? true);
        setEnableLogging(typedItems.enableLogging ?? false);
        setLoading(false);
      }
    );
  }, []);

  // Request permissions for custom domain if needed
  const handlePermissions = async (domain: string): Promise<boolean> => {
    if (!domain || domain.includes('gitlab.com')) {
      return true;
    }

    const normalized = normalizeGitLabDomain(domain);
    const origin = `${normalized}/*`;

    try {
      setSuccessMsg('Requesting browser permission for custom domain...');
      const granted = await chrome.permissions.request({
        origins: [origin],
      });
      
      if (!granted) {
        throw new Error(`Permission for ${origin} was denied by the user.`);
      }
      return true;
    } catch (err: any) {
      setErrorMsg(`Permission request failed: ${err.message}`);
      return false;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    setTestStatus(null);

    const projectPath = extractProjectPath(repoUrl);
    if (repoUrl.trim() && !projectPath) {
      setErrorMsg('Could not parse a valid project path from the Repository URL.');
      setSaving(false);
      return;
    }

    let normalizedDomain = '';
    if (customDomain.trim()) {
      normalizedDomain = normalizeGitLabDomain(customDomain);
      // Request host permissions first
      const permissionGranted = await handlePermissions(normalizedDomain);
      if (!permissionGranted) {
        setSaving(false);
        return;
      }
    }

    // Save to storage
    chrome.storage.sync.set(
      {
        repoUrl: repoUrl.trim(),
        pat: pat.trim(),
        customDomain: normalizedDomain,
        shouldOverwrite,
        enableLogging,
      },
      () => {
        setSaving(false);
        setSuccessMsg('Settings saved successfully!');
        
        // Notify background to re-register dynamic content scripts
        chrome.runtime.sendMessage({ type: 'REGISTER_DYNAMIC_SCRIPTS' }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Could not notify background worker:', chrome.runtime.lastError);
          } else if (response && !response.success) {
            console.warn('Background failed to register dynamic script:', response.error);
          }
        });

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    );
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestStatus(null);
    setErrorMsg('');
    setSuccessMsg('');

    // First save the current inputs so the background script can read them
    const projectPath = extractProjectPath(repoUrl);
    if (!repoUrl.trim() || !projectPath) {
      setTestStatus({
        success: false,
        message: 'Please provide a valid Repository URL before testing.'
      });
      setTesting(false);
      return;
    }

    const normalizedDomain = customDomain.trim() ? normalizeGitLabDomain(customDomain) : '';
    
    // Request permission if there's a custom domain
    if (normalizedDomain) {
      const permitted = await handlePermissions(normalizedDomain);
      if (!permitted) {
        setTesting(false);
        return;
      }
    }

    chrome.storage.sync.set(
      {
        repoUrl: repoUrl.trim(),
        pat: pat.trim(),
        customDomain: normalizedDomain,
        shouldOverwrite,
        enableLogging,
      },
      () => {
        // Trigger REGISTER_DYNAMIC_SCRIPTS so background is configured
        chrome.runtime.sendMessage({ type: 'REGISTER_DYNAMIC_SCRIPTS' });

        // Request template tree list from background script
        chrome.runtime.sendMessage({ type: 'FETCH_TEMPLATES_LIST' }, (response) => {
          setTesting(false);
          if (chrome.runtime.lastError) {
            setTestStatus({
              success: false,
              message: `Background service connection failed: ${chrome.runtime.lastError.message}`
            });
            return;
          }

          if (response.success) {
            setTestStatus({
              success: true,
              message: `Connection successful! Fetched ${response.data.length} Markdown templates.`,
              count: response.data.length
            });
          } else {
            setTestStatus({
              success: false,
              message: `Connection failed: ${response.error || 'Unknown GitLab API error'}`
            });
          }
        });
      }
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
          <p className="text-sm text-slate-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header Banner */}
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-8 relative">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-700 p-2 rounded-lg">
              <Settings className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white m-0">GitLab Shared Templates</h1>
              <p className="text-xs text-slate-400 mt-1">Configure your templates repository and credentials</p>
            </div>
          </div>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          
          {/* Custom GitLab Domain */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-slate-300">
              <Globe className="h-4 w-4 mr-2 text-indigo-400" />
              Custom GitLab Domain
            </label>
            <input
              type="url"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="https://gitlab.example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
            />
            <p className="text-xs text-slate-500">
              Leave blank if using the official <strong>gitlab.com</strong> instance. Include the scheme (https://).
            </p>
          </div>

          {/* Repo URL */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-slate-300">
              <FolderGit2 className="h-4 w-4 mr-2 text-indigo-400" />
              Templates Repository URL <span className="text-pink-500">*</span>
            </label>
            <input
              type="url"
              required
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://gitlab.com/username/templates-repository"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
            />
            <p className="text-xs text-slate-500">
              The full GitLab URL of the project containing your template markdown files (e.g. <code>.md</code>).
            </p>
          </div>

          {/* PAT Token */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-slate-300">
              <KeyRound className="h-4 w-4 mr-2 text-indigo-400" />
              Personal Access Token (PAT)
            </label>
            <input
              type="password"
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
            />
            <p className="text-xs text-slate-500">
              Required if the repository is private. Token needs <strong>api</strong> or <strong>read_api</strong> scope.
            </p>
          </div>

          {/* Advanced Options Toggle */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors duration-200 cursor-pointer"
            >
              <span>Advanced Options</span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              )}
            </button>
            
            {showAdvanced && (
              <div className="space-y-4 pt-3 mt-1 animate-fade-in">
                {/* Template Insertion Behavior */}
                <div className="space-y-3 bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
                  <label className="flex items-center text-sm font-semibold text-slate-300">
                    Template Insertion Behavior
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4 pt-1">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="shouldOverwrite"
                        checked={shouldOverwrite === true}
                        onChange={() => setShouldOverwrite(true)}
                        className="h-4 w-4 text-orange-500 border-slate-700 bg-slate-900 focus:ring-orange-500 focus:ring-offset-slate-900 focus:ring-2"
                      />
                      <span className="text-sm text-slate-300">Overwrite (Replace entire description)</span>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="shouldOverwrite"
                        checked={shouldOverwrite === false}
                        onChange={() => setShouldOverwrite(false)}
                        className="h-4 w-4 text-orange-500 border-slate-700 bg-slate-900 focus:ring-orange-500 focus:ring-offset-slate-900 focus:ring-2"
                      />
                      <span className="text-sm text-slate-300">Append (Insert at cursor position)</span>
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Define whether selecting a template replaces the entire editor text or appends it at the cursor position.
                  </p>
                </div>

                {/* Developer Settings */}
                <div className="space-y-3 bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
                  <label className="flex items-center text-sm font-semibold text-slate-300">
                    Developer Settings
                  </label>
                  <div className="flex items-center space-x-3 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      id="enableLogging"
                      checked={enableLogging}
                      onChange={(e) => setEnableLogging(e.target.checked)}
                      className="h-4 w-4 text-orange-500 rounded border-slate-700 bg-slate-900 focus:ring-orange-500 focus:ring-offset-slate-900 focus:ring-2"
                    />
                    <label htmlFor="enableLogging" className="text-sm text-slate-300 cursor-pointer select-none">
                      Enable Developer Logging (Outputs logs to DevTools Console)
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Check this box to enable verbose debugging logs in the browser console for DOM injection tracing.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Alert messages */}
          {successMsg && (
            <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4 text-emerald-400 text-sm animate-fade-in">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-3 bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 text-rose-400 text-sm animate-fade-in">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {testStatus && (
            <div className={`flex items-start gap-3 border rounded-xl p-4 text-sm animate-fade-in ${
              testStatus.success 
                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400' 
                : 'bg-rose-950/30 border-rose-800/40 text-rose-400'
            }`}>
              {testStatus.success ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{testStatus.success ? 'Success' : 'Connection Error'}</p>
                <p className="text-xs mt-1 opacity-90">{testStatus.message}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={saving || testing}
              className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-medium rounded-xl py-3 px-4 flex items-center justify-center cursor-pointer shadow-lg shadow-orange-600/10 hover:shadow-orange-600/20 transition-all duration-200"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={saving || testing}
              className="sm:w-auto bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-medium rounded-xl py-3 px-5 flex items-center justify-center cursor-pointer border border-slate-700 transition-all duration-200"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2 text-orange-400" />
                  Test Connection
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Info */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-900/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center">
            <HelpCircle className="h-3.5 w-3.5 mr-1 text-slate-600" />
            <span>Need help? Check your GitLab repository permissions.</span>
          </div>
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
}
