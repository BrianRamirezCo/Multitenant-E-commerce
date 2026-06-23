import { api } from '../../app/api/api';

/**
 * Analytics endpoints (admin). Real MongoDB aggregations, scoped to the tenant.
 * The dashboard endpoint returns all dashboard data in one call.
 */
export const analyticsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query({
      query: () => '/analytics/dashboard',
      providesTags: ['Order', 'Product'],
    }),
  }),
});

export const { useGetDashboardQuery } = analyticsApi;
