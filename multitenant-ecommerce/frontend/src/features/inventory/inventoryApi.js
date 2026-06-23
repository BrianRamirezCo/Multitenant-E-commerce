import { api } from '../../app/api/api';

/**
 * Inventory endpoints (admin). Stock-focused view over products, scoped to the
 * tenant. Updating stock invalidates Product so other views stay in sync.
 */
export const inventoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getInventory: builder.query({
      query: () => '/inventory',
      providesTags: ['Product'],
    }),
    updateStock: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/inventory/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Product'],
    }),
  }),
});

export const { useGetInventoryQuery, useUpdateStockMutation } = inventoryApi;
