import { api } from "../../app/api/api";

/**
 * Review endpoints (storefront + admin). Backend scopes everything to the tenant.
 */
export const reviewsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Public: approved reviews + average for a product.
    getProductReviews: builder.query({
      query: (productId) => `/reviews/product/${productId}`,
      providesTags: ["Review"],
    }),
    // Customer: own review for a product (any status).
    getMyReview: builder.query({
      query: (productId) => `/reviews/mine/${productId}`,
      providesTags: ["Review"],
    }),
    // Customer: create or update own review.
    createReview: builder.mutation({
      query: (body) => ({ url: "/reviews", method: "POST", body }),
      invalidatesTags: ["Review"],
    }),
    // Admin: list all reviews (optional status filter).
    getReviews: builder.query({
      query: (params = {}) => ({ url: "/reviews", params }),
      providesTags: ["Review"],
    }),
    // Admin: approve / reject.
    updateReviewStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/reviews/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Review"],
    }),
    // Admin: delete.
    deleteReview: builder.mutation({
      query: (id) => ({ url: `/reviews/${id}`, method: "DELETE" }),
      invalidatesTags: ["Review"],
    }),
  }),
});

export const {
  useGetProductReviewsQuery,
  useGetMyReviewQuery,
  useCreateReviewMutation,
  useGetReviewsQuery,
  useUpdateReviewStatusMutation,
  useDeleteReviewMutation,
} = reviewsApi;
