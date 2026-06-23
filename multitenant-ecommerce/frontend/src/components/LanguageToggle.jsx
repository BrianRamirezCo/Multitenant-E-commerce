import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * Compact ES/EN language toggle. Switches the UI language instantly and
 * persists the choice (handled in i18n/index.js).
 */
export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('en') ? 'en' : 'es';

  const setLang = (lng) => i18n.changeLanguage(lng);

  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
      <Languages className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" />
      {['es', 'en'].map((lng) => (
        <button
          key={lng}
          onClick={() => setLang(lng)}
          className={cn(
            'rounded px-2 py-1 text-xs font-medium uppercase transition-colors',
            current === lng
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {lng}
        </button>
      ))}
    </div>
  );
}
