import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../../../components/ui/table';
import { useGetCustomersQuery } from '../../customers/customersApi';
import { formatPrice } from '../../../lib/format';

/**
 * Admin Customers page. CONNECTED to the real backend (GET /customers), which
 * returns each customer enriched with order stats (total spent, order count,
 * last order). Translated via i18n.
 */
export default function CustomersPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetCustomersQuery();
  const customers = data?.customers || [];

  const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : t('customers.never');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{t('customers.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {customers.length} · {t('customers.subtitle')}
        </p>
      </div>

      <Card>
        <CardContent className="px-0 py-0">
          {isLoading && (
            <div className="space-y-2 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          )}

          {isError && (
            <div className="p-12 text-center">
              <p className="font-medium text-destructive">{t('customers.loadError')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('common.backendError')}</p>
            </div>
          )}

          {!isLoading && !isError && customers.length === 0 && (
            <div className="p-12 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">{t('customers.empty')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('customers.emptySub')}</p>
            </div>
          )}

          {!isLoading && !isError && customers.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">{t('customers.colCustomer')}</TableHead>
                  <TableHead>{t('customers.colEmail')}</TableHead>
                  <TableHead>{t('customers.colOrders')}</TableHead>
                  <TableHead>{t('customers.colSpent')}</TableHead>
                  <TableHead>{t('customers.colLastOrder')}</TableHead>
                  <TableHead className="pr-6">{t('customers.colSince')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                          {(c.name || '?')[0].toUpperCase()}
                        </div>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.email}</TableCell>
                    <TableCell>{c.orderCount}</TableCell>
                    <TableCell className="font-medium">{formatPrice(c.totalSpent)}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(c.lastOrder)}</TableCell>
                    <TableCell className="pr-6 text-muted-foreground">{fmtDate(c.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
