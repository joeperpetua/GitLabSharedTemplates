import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';
import { normalizeGitLabDomain, extractProjectPath } from '../utils/gitlab';
import { useI18n, languageNames } from '../utils/i18n';
import type { LanguageCode } from '../utils/i18n';

export default function OptionsApp() {
  const { t, loading: i18nLoading } = useI18n();
  const [repoUrl, setRepoUrl] = useState('');
  const [pat, setPat] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [shouldOverwrite, setShouldOverwrite] = useState(true);
  const [enableLogging, setEnableLogging] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
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
        language: 'en',
        theme: null,
      },
      (items) => {
        const typedItems = items as { 
          repoUrl?: string; 
          pat?: string; 
          customDomain?: string; 
          shouldOverwrite?: boolean; 
          enableLogging?: boolean;
          language?: string;
          theme?: 'light' | 'dark' | null;
        };
        setRepoUrl(typedItems.repoUrl || '');
        setPat(typedItems.pat || '');
        setCustomDomain(typedItems.customDomain || '');
        setShouldOverwrite(typedItems.shouldOverwrite ?? true);
        setEnableLogging(typedItems.enableLogging ?? false);
        setLanguage((typedItems.language as LanguageCode) || 'en');
        
        let initialTheme = typedItems.theme;
        if (!initialTheme) {
          initialTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        }
        setTheme(initialTheme);
        setLoading(false);
      }
    );
  }, []);

  // Sync body theme class
  useEffect(() => {
    const body = document.body;
    if (theme === 'dark') {
      body.classList.remove('bg-white', 'text-slate-900');
      body.classList.add('bg-[#181818]', 'text-slate-100');
    } else {
      body.classList.remove('bg-slate-900', 'bg-[#181818]', 'text-slate-100');
      body.classList.add('bg-white', 'text-slate-900');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    chrome.storage.sync.set({ theme: newTheme });
  };

  // Request permissions for custom domain if needed
  const handlePermissions = async (domain: string): Promise<boolean> => {
    if (!domain || domain.includes('gitlab.com')) {
      return true;
    }

    const normalized = normalizeGitLabDomain(domain);
    const origin = `${normalized}/*`;

    try {
      setSuccessMsg(t('options.messages.requestingPermission'));
      const granted = await chrome.permissions.request({
        origins: [origin],
      });
      
      if (!granted) {
        throw new Error(t('options.messages.permissionDenied', { origin }));
      }
      return true;
    } catch (err: any) {
      setErrorMsg(t('options.messages.permissionFailed', { message: err.message }));
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
      setErrorMsg(t('options.messages.invalidRepoUrl'));
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
        language,
      },
      () => {
        setSaving(false);
        setSuccessMsg(t('options.messages.saveSuccess'));
        
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
        message: t('options.messages.provideValidRepoUrl')
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
        language,
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
              message: t('options.messages.backgroundServiceFailed', { message: chrome.runtime.lastError.message || "" })
            });
            return;
          }

          if (response.success) {
            setTestStatus({
              success: true,
              message: t('options.messages.testSuccess', { count: response.data.length }),
              count: response.data.length
            });
          } else {
            setTestStatus({
              success: false,
              message: t('options.messages.testFailed', { message: response.error || 'Unknown GitLab API error' })
            });
          }
        });
      }
    );
  };

  const renderHelpText = () => {
    const fullText = t('options.needHelp');
    const linkTextEn = "Check your GitLab repository permissions";
    const linkTextDe = "Überprüfen Sie Ihre GitLab-Repository-Berechtigungen";
    
    if (fullText.includes(linkTextEn)) {
      const parts = fullText.split(linkTextEn);
      return (
        <>
          {parts[0]}
          <a href="https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html" target="_blank" rel="noopener noreferrer" className="gl-footer-link">
            {linkTextEn}
          </a>
          {parts[1]}
        </>
      );
    } else if (fullText.includes(linkTextDe)) {
      const parts = fullText.split(linkTextDe);
      return (
        <>
          {parts[0]}
          <a href="https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html" target="_blank" rel="noopener noreferrer" className="gl-footer-link">
            {linkTextDe}
          </a>
          {parts[1]}
        </>
      );
    }
    return fullText;
  };

  if (loading || i18nLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-[#181818] text-slate-900 dark:text-[#e4e4e4]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#1f75cb]" />
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('options.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`settings-page-wrapper ${theme}`}>
      {/* Redesigned Header Row */}
      <div className="w-full max-w-[960px] flex justify-between items-center mb-6">
        <h1 className="gl-heading mb-0">
          {t('options.integrationSettings') || 'GitLab Integration Settings'}
        </h1>
        <button
          type="button"
          onClick={handleToggleTheme}
          className="theme-toggle-btn"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <form onSubmit={handleSave} className="gl-card">
        {/* Card Header */}
        <div className="gl-card-header">
          <h2 className="gl-card-title">{t('options.title')}</h2>
          <p className="gl-card-subtitle">{t('options.subtitle')}</p>
        </div>

        {/* Card Body */}
        <div className="gl-card-body">
          {/* Custom GitLab Domain */}
          <div className="gl-form-group">
            <label className="gl-label" htmlFor="customDomain">
              {t('options.customDomain')}
            </label>
            <input
              type="url"
              id="customDomain"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder={t('options.customDomainPlaceholder')}
              className="gl-input"
            />
            <p className="gl-help-text">
              {t('options.customDomainHelp')}
            </p>
          </div>

          {/* Repo URL */}
          <div className="gl-form-group">
            <label className="gl-label" htmlFor="repoUrl">
              {t('options.repoUrl')} <span className="gl-label-required">*</span>
            </label>
            <input
              type="url"
              id="repoUrl"
              required
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder={t('options.repoUrlPlaceholder')}
              className="gl-input"
            />
            <p className="gl-help-text">
              {t('options.repoUrlHelp')}
            </p>
          </div>

          {/* PAT Token */}
          <div className="gl-form-group">
            <label className="gl-label" htmlFor="pat">
              {t('options.pat')}
            </label>
            <input
              type="password"
              id="pat"
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              placeholder={t('options.patPlaceholder')}
              className="gl-input"
            />
            <p className="gl-help-text">
              {t('options.patHelp')}
            </p>
          </div>

          {/* Language Selector */}
          <div className="gl-form-group">
            <label className="gl-label" htmlFor="language">
              {t('options.language')}
            </label>
            <div className="relative">
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="gl-input pr-10 appearance-none cursor-pointer"
              >
                {Object.entries(languageNames).map(([code, name]) => (
                  <option key={code} value={code} className="bg-[var(--gl-input-bg)] text-[var(--gl-text-primary)]">
                    {name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--gl-text-secondary)]">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
            <p className="gl-help-text">
              {t('options.languageHelp')}
            </p>
          </div>

          {/* Advanced Options collapsible details */}
          <div className="gl-details">
            <div 
              onClick={() => setShowAdvanced(!showAdvanced)} 
              className="gl-summary"
            >
              <ChevronDown 
                className="h-4 w-4 gl-summary-icon" 
                style={{ transform: showAdvanced ? 'none' : 'rotate(-90deg)' }} 
              />
              {t('options.advancedOptions')}
            </div>
            
            {showAdvanced && (
              <div className="mt-4 space-y-5">
                {/* Template Insertion Behavior */}
                <div>
                  <label className="gl-label">
                    {t('options.insertionBehavior')}
                  </label>
                  <div className="gl-radio-group">
                    <label className="gl-radio-container" htmlFor="overwrite">
                      <input
                        type="radio"
                        id="overwrite"
                        name="shouldOverwrite"
                        checked={shouldOverwrite === true}
                        onChange={() => setShouldOverwrite(true)}
                        className="gl-radio-input"
                      />
                      <span className="gl-radio-label">{t('options.overwriteOption')}</span>
                    </label>
                    
                    <label className="gl-radio-container" htmlFor="append">
                      <input
                        type="radio"
                        id="append"
                        name="shouldOverwrite"
                        checked={shouldOverwrite === false}
                        onChange={() => setShouldOverwrite(false)}
                        className="gl-radio-input"
                      />
                      <span className="gl-radio-label">{t('options.appendOption')}</span>
                    </label>
                  </div>
                  <p className="gl-help-text">
                    {t('options.insertionBehaviorHelp')}
                  </p>
                </div>

                {/* Developer Settings */}
                <div className="pt-4 border-t border-[var(--gl-border-color)]">
                  <label className="gl-label">
                    {t('options.developerSettings')}
                  </label>
                  <label className="gl-checkbox-container" htmlFor="enableLogging">
                    <input
                      type="checkbox"
                      id="enableLogging"
                      checked={enableLogging}
                      onChange={(e) => setEnableLogging(e.target.checked)}
                      className="gl-checkbox-input"
                    />
                    <span className="gl-checkbox-label">
                      {t('options.enableLogging')}
                    </span>
                  </label>
                  <p className="gl-help-text">
                    {t('options.enableLoggingHelp')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Success / Error Alerts */}
          <div className="mt-5 space-y-3">
            {successMsg && (
              <div className="gl-alert gl-alert-success animate-fade-in">
                <CheckCircle2 className="h-5 w-5 gl-alert-icon" />
                <div>
                  <p className="gl-alert-title">{t('options.messages.successTitle')}</p>
                  <p>{successMsg}</p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="gl-alert gl-alert-error animate-fade-in">
                <AlertCircle className="h-5 w-5 gl-alert-icon" />
                <div>
                  <p className="gl-alert-title">{t('options.messages.errorTitle')}</p>
                  <p>{errorMsg}</p>
                </div>
              </div>
            )}

            {testStatus && (
              <div className={`gl-alert ${testStatus.success ? 'gl-alert-success' : 'gl-alert-error'} animate-fade-in`}>
                {testStatus.success ? (
                  <CheckCircle2 className="h-5 w-5 gl-alert-icon" />
                ) : (
                  <AlertCircle className="h-5 w-5 gl-alert-icon" />
                )}
                <div>
                  <p className="gl-alert-title">
                    {testStatus.success ? t('options.messages.successTitle') : t('options.messages.errorTitle')}
                  </p>
                  <p>{testStatus.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card Footer */}
        <div className="gl-card-footer justify-end">
          <button
            type="submit"
            disabled={saving || testing}
            className="gl-btn gl-btn-primary"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('options.saving')}
              </>
            ) : (
              t('options.saveChanges')
            )}
          </button>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={saving || testing}
            className="gl-btn gl-btn-secondary"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('options.testing')}
              </>
            ) : (
              t('options.testConnection')
            )}
          </button>
        </div>
      </form>

      {/* Footer Info / Help */}
      <div className="gl-footer-info">
        {renderHelpText()}
        {" · "}
        <a 
          href="https://github.com/joeperpetua/GitLabSharedTemplates" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="gl-footer-link"
        >
          {t('options.issuesAndDocs') || 'Issues & Docs'}
        </a>
        {` · v${chrome?.runtime?.getManifest?.()?.version || '1.0.0'}`}
      </div>
    </div>
  );
}
