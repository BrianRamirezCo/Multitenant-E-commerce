import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import ImageUpload from "../../../components/ImageUpload";
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "../../categories/categoriesApi";

/**
 * Admin Categories page. FULLY CONNECTED to the real backend.
 * Table + create/edit dialog + delete confirmation. Translated via i18n.
 */
const EMPTY = { name: "", slug: "", description: "", image: "", order: 0 };

function CategoryForm({ open, onOpenChange, category }) {
  const { t } = useTranslation();
  const isEdit = Boolean(category);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation();

  useEffect(() => {
    setForm(
      category
        ? {
            name: category.name || "",
            slug: category.slug || "",
            description: category.description || "",
            image: category.image || "",
            order: category.order || 0,
          }
        : EMPTY,
    );
    setError(null);
  }, [category, open]);

  const update = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handleSubmit = async () => {
    setError(null);
    if (!form.name.trim()) {
      setError(t("categories.requiredError"));
      return;
    }
    const payload = { ...form, order: parseInt(form.order || "0", 10) };
    try {
      if (isEdit)
        await updateCategory({ id: category._id, ...payload }).unwrap();
      else await createCategory(payload).unwrap();
      onOpenChange(false);
    } catch (err) {
      setError(err?.data?.message || t("categories.saveError"));
    }
  };

  const busy = creating || updating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("categories.formEditTitle")
              : t("categories.formNewTitle")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">{t("categories.fieldName")}</Label>
            <Input
              id="name"
              value={form.name}
              onChange={update("name")}
              placeholder="Skincare"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">{t("categories.fieldSlug")}</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={update("slug")}
              placeholder="skincare"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">
              {t("categories.fieldDescription")}
            </Label>
            <Input
              id="description"
              value={form.description}
              onChange={update("description")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("categories.fieldImage")}</Label>
            <ImageUpload
              value={form.image || null}
              onChange={(url) => setForm((s) => ({ ...s, image: url || "" }))}
              kind="product"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order">{t("categories.fieldOrder")}</Label>
            <Input
              id="order"
              type="number"
              value={form.order}
              onChange={update("order")}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={busy}>
            {busy
              ? t("common.saving")
              : isEdit
                ? t("categories.saveBtn")
                : t("categories.createBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CategoriesPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetCategoriesQuery();
  const [deleteCategory] = useDeleteCategoryMutation();
  const categories = data?.categories || [];

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (c) => {
    setEditing(c);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteCategory(toDelete._id).unwrap();
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {t("categories.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("categories.subtitle")}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> {t("categories.new")}
        </Button>
      </div>

      <Card>
        <CardContent className="px-0 py-0">
          {isLoading && (
            <div className="space-y-2 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          )}
          {isError && (
            <div className="p-12 text-center">
              <p className="font-medium text-destructive">
                {t("categories.loadError")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("common.backendError")}
              </p>
            </div>
          )}
          {!isLoading && !isError && categories.length === 0 && (
            <div className="p-12 text-center">
              <Tags className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">{t("categories.empty")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("categories.emptySub")}
              </p>
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4" /> {t("categories.new")}
              </Button>
            </div>
          )}
          {!isLoading && !isError && categories.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">
                    {t("categories.colName")}
                  </TableHead>
                  <TableHead>{t("categories.colSlug")}</TableHead>
                  <TableHead>{t("categories.colProducts")}</TableHead>
                  <TableHead>{t("categories.colStatus")}</TableHead>
                  <TableHead className="pr-6 text-right">
                    {t("common.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="pl-6 font-medium">{c.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {c.slug}
                    </TableCell>
                    <TableCell>
                      {t("categories.productsCount", { count: c.productCount })}
                    </TableCell>
                    <TableCell>
                      {c.isActive ? (
                        <Badge variant="success">
                          {t("categories.active")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {t("categories.inactive")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(c)}
                          aria-label={t("common.edit")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setToDelete(c)}
                          aria-label={t("common.delete")}
                        >
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

      <CategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
      />

      <Dialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("categories.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("categories.deleteConfirm", { name: toDelete?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
