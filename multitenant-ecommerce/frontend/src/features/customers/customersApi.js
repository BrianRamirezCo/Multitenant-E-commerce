import { api } from '../../app/api/api';

/**
 * Customer endpoints (admin). Backend scopes everything to the tenant and
 * returns aggregated order stats per customer.
 */
export const customersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query({
      query: () => '/customers',
      providesTags: ['User'],
    }),
    getCustomer: builder.query({
      query: (id) => `/customers/${id}`,
      providesTags: ['User'],
    }),
  }),
});

export const { useGetCustomersQuery, useGetCustomerQuery } = customersApi;
