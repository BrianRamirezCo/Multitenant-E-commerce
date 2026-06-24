import { api } from "../../app/api/api";

/**
 * Newsletter subscribers.
 *  - subscribe      : public (storefront) — adds an email.
 *  - getSubscribers : admin — lists subscribers for the store.
 */
export const subscribersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    subscribe: builder.mutation({
      query: (email) => ({
        url: "/subscribers",
        method: "POST",
        body: { email },
      }),
      invalidatesTags: ["Subscriber"],
    }),
    getSubscribers: builder.query({
      query: () => "/subscribers",
      providesTags: ["Subscriber"],
    }),
  }),
});

export const { useSubscribeMutation, useGetSubscribersQuery } = subscribersApi;
