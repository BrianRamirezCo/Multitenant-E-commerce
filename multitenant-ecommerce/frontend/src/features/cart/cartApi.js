import { api } from "../../app/api/api";

/**
 * Cart endpoint. Persists the shopper's cart server-side to power the
 * abandoned-cart reminder. Backend scopes to the tenant + resolves identity
 * (logged-in customer or provided email) via optionalAuth.
 */
export const cartApi = api.injectEndpoints({
  endpoints: (builder) => ({
    saveCart: builder.mutation({
      query: (body) => ({ url: "/cart", method: "PUT", body }),
    }),
  }),
});

export const { useSaveCartMutation } = cartApi;
