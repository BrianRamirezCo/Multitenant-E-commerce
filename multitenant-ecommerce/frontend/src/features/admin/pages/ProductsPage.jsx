import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../../../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '../../../components/ui/dialog';
import ProductFormDialog from '../components/ProductFormDialog';
import {
  useGetProductsQuery, useDeleteProductMutation,
} from '../../products/productsApi';
import { formatPrice } from '../../../lib/format';

/**
 * Admin Products page. FULLY CONNECTED to the real backend. Translated via i18n.
 */
export default function ProductsPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetProductsQuery({ limit: 100 });
  const [deleteProduct] = useDeleteProductMutation();
  const products = data?.products || [];

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (product) => { setEditing(product); setFormOpen(true); };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteProduct(toDelete._id).unwrap();
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{t('products.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? t('products.countOne') : t('products.countMany')}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> {t('products.new')}
        </Button>
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
              <p className="font-medium text-destructive">{t('products.loadError')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('common.backendError')}</p>
            </div>
          )}

          {!isLoading && !isError && products.length === 0 && (
            <div className="p-12 text-center">
              <Package className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">{t('products.empty')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('products.emptySub')}</p>
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4" /> {t('products.new')}
              </Button>
            </div>
          )}

          {!isLoading && !isError && products.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">{t('products.colProduct')}</TableHead>
                  <TableHead>{t('products.colCategory')}</TableHead>
                  <TableHead>{t('products.colPrice')}</TableHead>
                  <TableHead>{t('products.colStock')}</TableHead>
                  <TableHead className="pr-6 text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                          {p.images?.[0] && (
                            <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.category || '—'}</TableCell>
                    <TableCell>{formatPrice(p.price, p.currency)}</TableCell>
                    <TableCell>
                      {p.stock === 0 ? (
                        <Badge variant="destructive">{t('products.outOfStock')}</Badge>
                      ) : p.stock < 10 ? (
                        <Badge variant="warning">{p.stock}</Badge>
                      ) : (
                        <span>{p.stock}</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)} aria-label={t('common.edit')}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setToDelete(p)} aria-label={t('common.delete')}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} />

      <Dialog open={Boolean(toDelete)} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('products.deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('products.deleteConfirm', { name: toDelete?.name })}
            </DialogDescription>
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
