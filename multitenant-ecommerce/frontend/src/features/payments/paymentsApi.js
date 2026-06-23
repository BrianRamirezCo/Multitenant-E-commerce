import { api } from '../../app/api/api';

/**
 * Payment endpoints (tenant-scoped). Creates a MercadoPago Checkout Pro
 * preference for an order; the response includes the init_point URL to redirect
 * the buyer to MercadoPago.
 */
export const paymentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createPreference: builder.mutation({
      query: (orderId) => ({ url: '/payments/checkout', method: 'POST', body: { orderId } }),
    }),
  }),
});

export const { useCreatePreferenceMutation } = paymentsApi;
