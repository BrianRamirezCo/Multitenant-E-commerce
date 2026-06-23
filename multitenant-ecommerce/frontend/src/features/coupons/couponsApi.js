import { api } from '../../app/api/api';

/**
 * Coupon endpoints. Backend scopes everything to the current tenant.
 * validateCoupon is used by the storefront checkout to apply a code.
 */
export const couponsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCoupons: builder.query({
      query: () => '/coupons',
      providesTags: ['Coupon'],
    }),
    createCoupon: builder.mutation({
      query: (body) => ({ url: '/coupons', method: 'POST', body }),
      invalidatesTags: ['Coupon'],
    }),
    updateCoupon: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/coupons/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Coupon'],
    }),
    deleteCoupon: builder.mutation({
      query: (id) => ({ url: `/coupons/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Coupon'],
    }),
    validateCoupon: builder.mutation({
      query: (body) => ({ url: '/coupons/validate', method: 'POST', body }),
    }),
  }),
});

export const {
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useValidateCouponMutation,
} = couponsApi;
