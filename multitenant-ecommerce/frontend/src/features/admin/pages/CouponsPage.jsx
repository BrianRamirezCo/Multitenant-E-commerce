import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Ticket } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../../../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  useGetCouponsQuery, useCreateCouponMutation,
  useUpdateCouponMutation, useDeleteCouponMutation,
} from '../../coupons/couponsApi';
import { formatPrice } from '../../../lib/format';

/**
 * Admin Coupons page. FULLY CONNECTED to the real backend. The per-plan creation
 * limit is enforced server-side; if exceeded, we show the limit message.
 * Translated via i18n.
 */
const EMPTY = { code: '', type: 'percentage', value: '', minPurchase: '', usageLimit: '', expiresAt: '' };

function CouponForm({ open, onOpenChange, coupon }) {
  const { t } = useTranslation();
  const isEdit = Boolean(coupon);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [createCoupon, { isLoading: creating }] = useCreateCouponMutation();
  const [updateCoupon, { isLoading: updating }] = useUpdateCouponMutation();

  useEffect(() => {
    if (coupon) {
      setForm({
        code: coupon.code || '',
        type: coupon.type || 'percentage',
        value: coupon.type === 'fixed' ? (coupon.value / 100).toString() : (coupon.value?.toString() || ''),
        minPurchase: coupon.minPurchase ? (coupon.minPurchase / 100).toString() : '',
        usageLimit: coupon.usageLimit?.toString() || '',
        expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
      });
    } else setForm(EMPTY);
    setError(null);
  }, [coupon, open]);

  const update = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handleSubmit = async () => {
    setError(null);
    if (!form.code.trim() || form.value === '') { setError(t('coupons.requiredError')); return; }
    // percentage: value as-is; fixed: pesos -> cents.
    const value = form.type === 'fixed' ? Math.round(parseFloat(form.value) * 100) : parseFloat(form.value);
    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value,
      minPurchase: form.minPurchase ? Math.round(parseFloat(form.minPurchase) * 100) : 0,
      usageLimit: form.usageLimit ? parseInt(form.usageLimit, 10) : null,
      expiresAt: form.expiresAt || null,
    };
    try {
      if (isEdit) await updateCoupon({ id: coupon._id, ...payload }).unwrap();
      else await createCoupon(payload).unwrap();
      onOpenChange(false);
    } catch (err) {
      // 403 from the plan limit middleware -> friendly message.
      if (err?.status === 403) setError(t('coupons.limitError'));
      else setError(err?.data?.message || t('coupons.saveError'));
    }
  };

  const busy = creating || updating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('coupons.formEditTitle') : t('coupons.formNewTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="code">{t('coupons.fieldCode')}</Label>
            <Input id="code" value={form.code} onChange={update('code')} placeholder="BIENVENIDA10" className="font-mono uppercase" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">{t('coupons.fieldType')}</Label>
              <select
                id="type"
                value={form.type}
                onChange={update('type')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="percentage">{t('coupons.percentage')}</option>
                <option value="fixed">{t('coupons.fixed')}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">{t('coupons.fieldValue')}</Label>
              <Input id="value" type="number" value={form.value} onChange={update('value')}
                placeholder={form.type === 'percentage' ? '10' : '5000'} />
              <p className="text-xs text-muted-foreground">
                {form.type === 'percentage' ? t('coupons.fieldValueHintPct') : t('coupons.fieldValueHintFixed')}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minPurchase">{t('coupons.fieldMinPurchase')}</Label>
              <Input id="minPurchase" type="number" value={form.minPurchase} onChange={update('minPurchase')} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usageLimit">{t('coupons.fieldUsageLimit')}</Label>
              <Input id="usageLimit" type="number" value={form.usageLimit} onChange={update('usageLimit')} placeholder="∞" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiresAt">{t('coupons.fieldExpiry')}</Label>
            <Input id="expiresAt" type="date" value={form.expiresAt} onChange={update('expiresAt')} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={busy}>
            {busy ? t('common.saving') : isEdit ? t('coupons.saveBtn') : t('coupons.createBtn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CouponsPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetCouponsQuery();
  const [deleteCoupon] = useDeleteCouponMutation();
  const coupons = data?.coupons || [];

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (c) => { setEditing(c); setFormOpen(true); };
  const confirmDelete = async () => {
    if (!toDelete) return;
    try { await deleteCoupon(toDelete._id).unwrap(); } finally { setToDelete(null); }
  };

  const fmtDiscount = (c) => c.type === 'percentage' ? `${c.value}%` : formatPrice(c.value);
  const fmtExpiry = (iso) => iso ? new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : t('coupons.noExpiry');
  const isExpired = (c) => c.expiresAt && new Date(c.expiresAt) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{t('coupons.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('coupons.subtitle')}</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> {t('coupons.new')}</Button>
      </div>

      <Card>
        <CardContent className="px-0 py-0">
          {isLoading && (
            <div className="space-y-2 p-6">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded bg-muted" />)}</div>
          )}
          {isError && (
            <div className="p-12 text-center">
              <p className="font-medium text-destructive">{t('coupons.loadError')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('common.backendError')}</p>
            </div>
          )}
          {!isLoading && !isError && coupons.length === 0 && (
            <div className="p-12 text-center">
              <Ticket className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">{t('coupons.empty')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('coupons.emptySub')}</p>
              <Button className="mt-4" onClick={openCreate}><Plus className="h-4 w-4" /> {t('coupons.new')}</Button>
            </div>
          )}
          {!isLoading && !isError && coupons.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">{t('coupons.colCode')}</TableHead>
                  <TableHead>{t('coupons.colDiscount')}</TableHead>
                  <TableHead>{t('coupons.colUses')}</TableHead>
                  <TableHead>{t('coupons.colExpiry')}</TableHead>
                  <TableHead>{t('coupons.colStatus')}</TableHead>
                  <TableHead className="pr-6 text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="pl-6 font-mono font-medium">{c.code}</TableCell>
                    <TableCell>{fmtDiscount(c)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.usedCount}{c.usageLimit != null ? ` / ${c.usageLimit}` : ` / ${t('coupons.unlimited')}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{fmtExpiry(c.expiresAt)}</TableCell>
                    <TableCell>
                      {isExpired(c)
                        ? <Badge variant="secondary">{t('coupons.expired')}</Badge>
                        : c.isActive
                          ? <Badge variant="success">{t('coupons.active')}</Badge>
                          : <Badge variant="secondary">{t('coupons.inactive')}</Badge>}
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)} aria-label={t('common.edit')}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setToDelete(c)} aria-label={t('common.delete')}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CouponForm open={formOpen} onOpenChange={setFormOpen} coupon={editing} />

      <Dialog open={Boolean(toDelete)} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('coupons.deleteTitle')}</DialogTitle>
            <DialogDescription>{t('coupons.deleteConfirm', { code: toDelete?.code })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={confirmDelete}>{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
