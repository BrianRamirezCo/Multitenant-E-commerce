import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import ImageUpload from "../../../components/ImageUpload";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
} from "../../products/productsApi";
import { useGetCategoriesQuery } from "../../categories/categoriesApi";

/**
 * Create/Edit product dialog. Connected to the REAL backend.
 *
 * UX-friendly pricing:
 *   - "Precio"           = the normal price (what they usually charge).
 *   - "Precio de oferta" = the discounted price (optional, must be LOWER).
 *
 * Internally the model stores:
 *   - price          = what's actually charged (sale price if on sale, else normal)
 *   - compareAtPrice = the normal/struck-through price (only when on sale)
 * So we map the friendly fields to that on submit.
 */

const EMPTY = {
  name: "",
  slug: "",
  description: "",
  price: "", // normal price (friendly)
  salePrice: "", // discounted price (friendly, optional)
  stock: "",
  category: "",
};

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function ProductFormDialog({ open, onOpenChange, product }) {
  const { t } = useTranslation();
  const isEdit = Boolean(product);
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState([]);
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [error, setError] = useState(null);

  const { data: catData } = useGetCategoriesQuery();
  const categories = catData?.categories || [];

  // Populate the form when editing. Map model fields -> friendly fields:
  // if the product is on sale (has compareAtPrice), the normal price is
  // compareAtPrice and the sale price is price; otherwise normal = price.
  useEffect(() => {
    if (product) {
      const onSale =
        product.compareAtPrice != null &&
        product.compareAtPrice > product.price;
      const normalCents = onSale ? product.compareAtPrice : product.price;
      const saleCents = onSale ? product.price : null;
      setForm({
        name: product.name || "",
        slug: product.slug || "",
        description: product.description || "",
        price: normalCents != null ? (normalCents / 100).toString() : "",
        salePrice: saleCents != null ? (saleCents / 100).toString() : "",
        stock: product.stock?.toString() || "",
        category: product.category || "",
      });
      setImages(product.images || []);
    } else {
      setForm(EMPTY);
      setImages([]);
    }
    setError(null);
  }, [product, open]);

  const update = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === "name" && (!f.slug || f.slug === slugify(f.name))) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const addImage = (url) => {
    if (url) setImages((arr) => [...arr, url]);
  };

  const removeImage = (idx) => {
    setImages((arr) => arr.filter((_, i) => i !== idx));
  };

  // Discount preview: sale price must be LOWER than normal price.
  const normalNum = parseFloat(form.price || "0");
  const saleNum = parseFloat(form.salePrice || "0");
  const onSale = saleNum > 0 && saleNum < normalNum && normalNum > 0;
  const discountPct = onSale ? Math.round((1 - saleNum / normalNum) * 100) : 0;

  const handleSubmit = async () => {
    setError(null);

    // If a sale price is provided, it must be lower than the normal price.
    if (saleNum > 0 && saleNum >= normalNum) {
      setError(t("products.saleError"));
      return;
    }

    // Map friendly fields -> model fields.
    const normalCents = Math.round(normalNum * 100);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim(),
      // price = what's actually charged; compareAtPrice = normal price (if on sale)
      price: onSale ? Math.round(saleNum * 100) : normalCents,
      compareAtPrice: onSale ? normalCents : null,
      stock: parseInt(form.stock || "0", 10),
      category: form.category || null,
      images,
    };

    if (!payload.name || !payload.price) {
      setError(t("products.requiredError"));
      return;
    }

    try {
      if (isEdit) {
        await updateProduct({ id: product._id, ...payload }).unwrap();
      } else {
        await createProduct(payload).unwrap();
      }
      onOpenChange(false);
    } catch (err) {
      setError(err?.data?.message || t("products.saveError"));
    }
  };

  const busy = creating || updating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("products.formEditTitle") : t("products.formNewTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">{t("products.fieldName")}</Label>
            <Input
              id="name"
              value={form.name}
              onChange={update("name")}
              placeholder="Auriculares inalámbricos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">{t("products.fieldSlug")}</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={update("slug")}
              placeholder="auriculares-inalambricos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {t("products.fieldDescription")}
            </Label>
            <textarea
              id="description"
              value={form.description}
              onChange={update("description")}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Descripción del producto..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">{t("products.fieldPrice")}</Label>
              <Input
                id="price"
                type="number"
                value={form.price}
                onChange={update("price")}
                placeholder="12999.99"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">{t("products.fieldStock")}</Label>
              <Input
                id="stock"
                type="number"
                value={form.stock}
                onChange={update("stock")}
                placeholder="50"
              />
            </div>
          </div>

          {/* Sale price (optional). Must be LOWER than the normal price. */}
          <div className="space-y-2">
            <Label htmlFor="salePrice">{t("products.fieldSalePrice")}</Label>
            <Input
              id="salePrice"
              type="number"
              value={form.salePrice}
              onChange={update("salePrice")}
              placeholder={t("products.salePlaceholder")}
            />
            {onSale ? (
              <p className="text-xs font-medium text-green-600">
                {t("products.saleActive", { pct: discountPct })}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("products.saleHint")}
              </p>
            )}
          </div>

          {/* Category dropdown */}
          <div className="space-y-2">
            <Label htmlFor="category">{t("products.fieldCategory")}</Label>
            <select
              id="category"
              value={form.category}
              onChange={update("category")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{t("products.noCategory")}</option>
              {categories.map((c) => (
                <option key={c._id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {t("products.noCategoriesHint")}
              </p>
            )}
          </div>

          {/* Product images */}
          <div className="space-y-2">
            <Label>{t("products.fieldImages")}</Label>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {images.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative h-20 w-20 overflow-hidden rounded-md border border-border"
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      aria-label={t("common.delete")}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <ImageUpload value={null} onChange={addImage} kind="product" />
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
                ? t("products.saveBtn")
                : t("products.createBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
