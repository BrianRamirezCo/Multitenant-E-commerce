import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Star,
  MessageSquare,
  Check,
  X,
  Trash2,
  BadgeCheck,
} from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  useGetReviewsQuery,
  useUpdateReviewStatusMutation,
  useDeleteReviewMutation,
} from "../../reviews/reviewsApi";

/**
 * Admin reviews moderation page. Lists reviews (filterable by status) and lets
 * the admin approve / reject / delete them. Defaults to 'pending' (what needs
 * action first). CONNECTED to the backend.
 */
const STATUS_VARIANT = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};
const FILTERS = ["pending", "approved", "rejected", "all"];

function Stars({ value = 0 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= value ? "fill-current text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("pending");

  // Pass status as a query param unless "all".
  const params = filter === "all" ? {} : { status: filter };
  const { data, isLoading, isError } = useGetReviewsQuery(params);
  const [updateStatus] = useUpdateReviewStatusMutation();
  const [deleteReview] = useDeleteReviewMutation();

  const reviews = data?.reviews || [];

  const statusLabel = (s) =>
    t(`adminReviews.status${s.charAt(0).toUpperCase() + s.slice(1)}`);
  const fmtDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const approve = (id) => updateStatus({ id, status: "approved" });
  const reject = (id) => updateStatus({ id, status: "rejected" });
  const remove = (id) => {
    if (window.confirm(t("adminReviews.deleteConfirm"))) deleteReview(id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {t("adminReviews.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("adminReviews.subtitle")}
        </p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {t(`adminReviews.${f}`)}
          </Button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="p-12 text-center text-destructive">
            {t("adminReviews.loadError")}
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && reviews.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium">{t("adminReviews.empty")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("adminReviews.emptySub")}
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r._id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.authorName}</span>
                      {r.verifiedPurchase && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <BadgeCheck className="h-3.5 w-3.5" />{" "}
                          {t("adminReviews.verified")}
                        </span>
                      )}
                      <Badge variant={STATUS_VARIANT[r.status]}>
                        {statusLabel(r.status)}
                      </Badge>
                    </div>
                    <div className="mt-1">
                      <Stars value={r.rating} />
                    </div>
                    {r.comment && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {r.comment}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {fmtDate(r.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {r.status !== "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approve(r._id)}
                      >
                        <Check className="h-4 w-4" />{" "}
                        {t("adminReviews.approve")}
                      </Button>
                    )}
                    {r.status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reject(r._id)}
                      >
                        <X className="h-4 w-4" /> {t("adminReviews.reject")}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => remove(r._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
