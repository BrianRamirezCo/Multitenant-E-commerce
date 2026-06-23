import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Boxes, PackageCheck, AlertTriangle, PackageX, Check } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../../../components/ui/table';
import { useGetInventoryQuery, useUpdateStockMutation } from '../../inventory/inventoryApi';

/**
 * Admin Inventory page. CONNECTED to the real backend (GET /inventory).
 * Summary cards + table with inline stock/threshold editing (save per row).
 * Translated via i18n.
 */
function InventoryRow({ item }) {
  const { t } = useTranslation();
  const [stock, setStock] = useState(item.stock);
  const [threshold, setThreshold] = useState(item.lowStockThreshold ?? 10);
  const [updateStock, { isLoading }] = useUpdateStockMutation();
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setStock(item.stock);
    setThreshold(item.lowStockThreshold ?? 10);
  }, [item.stock, item.lowStockThreshold]);

  const dirty = stock !== item.stock || threshold !== (item.lowStockThreshold ?? 10);

  const save = async () => {
    try {
      await updateStock({ id: item._id, stock: Number(stock), lowStockThreshold: Number(threshold) }).unwrap();
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch { /* ignore; could surface a toast */ }
  };

  const stateBadge = {
    ok: <Badge variant="success">{t('inventory.stateOk')}</Badge>,
    low: <Badge variant="warning">{t('inventory.stateLow')}</Badge>,
    out: <Badge variant="destructive">{t('inventory.stateOut')}</Badge>,
  }[item.state];

  return (
    <TableRow>
      <TableCell className="pl-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
            {item.images?.[0] && <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover" />}
          </div>
          <span className="font-medium">{item.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{item.category || '—'}</TableCell>
      <TableCell>
        <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="h-9 w-20" />
      </TableCell>
      <TableCell>
        <Input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="h-9 w-20" />
      </TableCell>
      <TableCell>{stateBadge}</TableCell>
      <TableCell className="pr-6 text-right">
        {savedFlash ? (
          <span className="inline-flex items-center gap-1 text-sm text-green-600"><Check className="h-4 w-4" />{t('inventory.saved')}</span>
        ) : (
          <Button size="sm" variant={dirty ? 'default' : 'outline'} onClick={save} disabled={!dirty || isLoading}>
            {t('inventory.save')}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function InventoryPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetInventoryQuery();
  const items = data?.items || [];
  const summary = data?.summary || { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 };

  const cards = [
    { label: t('inventory.total'), value: summary.total, icon: Boxes, c: 'bg-secondary text-foreground' },
    { label: t('inventory.inStock'), value: summary.inStock, icon: PackageCheck, c: 'bg-green-100 text-green-700' },
    { label: t('inventory.lowStock'), value: summary.lowStock, icon: AlertTriangle, c: 'bg-amber-100 text-amber-700' },
    { label: t('inventory.outOfStock'), value: summary.outOfStock, icon: PackageX, c: 'bg-rose-100 text-rose-700' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{t('inventory.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('inventory.subtitle')}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="mt-1 text-2xl font-bold">{c.value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.c}`}>
                <c.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="px-0 py-0">
          {isLoading && (
            <div className="space-y-2 p-6">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded bg-muted" />)}</div>
          )}
          {isError && (
            <div className="p-12 text-center">
              <p className="font-medium text-destructive">{t('inventory.loadError')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('common.backendError')}</p>
            </div>
          )}
          {!isLoading && !isError && items.length === 0 && (
            <div className="p-12 text-center">
              <Boxes className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">{t('inventory.empty')}</p>
            </div>
          )}
          {!isLoading && !isError && items.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">{t('inventory.colProduct')}</TableHead>
                  <TableHead>{t('inventory.colCategory')}</TableHead>
                  <TableHead>{t('inventory.colStock')}</TableHead>
                  <TableHead>{t('inventory.colThreshold')}</TableHead>
                  <TableHead>{t('inventory.colState')}</TableHead>
                  <TableHead className="pr-6 text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => <InventoryRow key={item._id} item={item} />)}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
