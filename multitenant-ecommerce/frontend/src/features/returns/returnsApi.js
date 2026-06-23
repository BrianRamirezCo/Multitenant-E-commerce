import { api } from "../../app/api/api";

/**
 * Return (refund request) endpoints. Customers request returns for their paid
 * orders; admins list and resolve them. Backend scopes to the tenant.
 */
export const returnsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Customer: request a return.
    createReturn: builder.mutation({
      query: (body) => ({ url: "/returns", method: "POST", body }),
      invalidatesTags: ["Return"],
    }),
    // Customer: their own returns.
    getMyReturns: builder.query({
      query: () => "/returns/mine",
      providesTags: ["Return"],
    }),
    // Admin: all returns (optional status filter).
    getReturns: builder.query({
      query: (status) => (status ? `/returns?status=${status}` : "/returns"),
      providesTags: ["Return"],
    }),
    // Admin: approve or reject.
    resolveReturn: builder.mutation({
      query: ({ id, action, adminNote }) => ({
        url: `/returns/${id}`,
        method: "PATCH",
        body: { action, adminNote },
      }),
      invalidatesTags: ["Return", "Order", "Product"],
    }),
  }),
});

export const {
  useCreateReturnMutation,
  useGetMyReturnsQuery,
  useGetReturnsQuery,
  useResolveReturnMutation,
} = returnsApi;
