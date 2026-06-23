import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useUploadImageMutation } from "../features/uploads/uploadsApi";

/**
 * Reusable image uploader. Shows a preview of the current image (if any), lets
 * the user pick a file, uploads it to the backend (-> Cloudinary), and calls
 * onChange(url) with the resulting URL.
 *
 * Props:
 *   value     - current image URL (string | null)
 *   onChange  - (url: string | null) => void   called after a successful upload or removal
 *   kind      - 'logo' | 'product'             organizes the upload folder
 *   label     - optional label text
 *   rounded   - if true, preview is a circle (good for logos)
 */
export default function ImageUpload({
  value,
  onChange,
  kind = "misc",
  label,
  rounded = false,
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [uploadImage, { isLoading }] = useUploadImageMutation();
  const [error, setError] = useState(null);

  const pick = () => inputRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    // Client-side guard: size + type (the backend also enforces this).
    if (!file.type.startsWith("image/")) {
      setError(t("upload.invalidType"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t("upload.tooLarge"));
      return;
    }

    try {
      const res = await uploadImage({ file, kind }).unwrap();
      onChange(res.url);
    } catch (err) {
      const msg =
        err?.status === 503 ? t("upload.notConfigured") : t("upload.failed");
      setError(msg);
    } finally {
      // Reset the input so picking the same file again still fires onChange.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = () => {
    onChange(null);
    setError(null);
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}

      <div className="flex items-center gap-4">
        {/* Preview */}
        <div
          className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-border bg-muted ${
            rounded ? "rounded-full" : "rounded-md"
          }`}
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground/40" />
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={pick}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />{" "}
                  {t("upload.uploading")}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />{" "}
                  {value ? t("upload.change") : t("upload.select")}
                </>
              )}
            </Button>
            {value && !isLoading && (
              <Button type="button" variant="ghost" size="sm" onClick={remove}>
                <X className="h-4 w-4" /> {t("upload.remove")}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{t("upload.hint")}</p>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />
    </div>
  );
}
