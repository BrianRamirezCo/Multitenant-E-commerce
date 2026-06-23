import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../components/ui/card';
import { cn } from '../../../lib/utils';

/**
 * KPI metric card for the dashboard top row. Translated via i18n.
 */
export default function KpiCard({ label, value, change, icon: Icon, iconClass }) {
  const { t } = useTranslation();
  const isPositive = change >= 0;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', iconClass || 'bg-primary/10 text-primary')}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {typeof change === 'number' && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={cn('flex items-center gap-0.5 font-medium', isPositive ? 'text-green-600' : 'text-red-600')}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(change)}%
          </span>
          <span className="text-muted-foreground">{t('dashboard.vsLastWeek')}</span>
        </div>
      )}
    </Card>
  );
}
