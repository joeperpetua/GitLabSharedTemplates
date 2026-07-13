import { Settings, HelpCircle, ArrowRight } from 'lucide-react';
import { useI18n } from './utils/i18n';

function App() {
  const { t, loading } = useI18n();

  const handleOpenSettings = () => {
    if (chrome?.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('options.html', '_blank');
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-8 space-y-6 text-center">
        <div className="mx-auto bg-orange-600/10 p-4 rounded-full w-16 h-16 flex items-center justify-center border border-orange-500/20">
          <Settings className="h-8 w-8 text-orange-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {t('landing.title')}
          </h1>
          <p className="text-sm text-slate-400">
            {t('landing.description')}
          </p>
        </div>

        <div className="pt-4">
          <button
            type="button"
            onClick={handleOpenSettings}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl py-3 px-4 flex items-center justify-center cursor-pointer shadow-lg shadow-orange-600/10 hover:shadow-orange-600/20 transition-all duration-200"
          >
            <span>{t('landing.configureButton')}</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>

        <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center mx-auto gap-1">
            <HelpCircle className="h-3.5 w-3.5 text-slate-600" />
            <span>{t('landing.helpText')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
