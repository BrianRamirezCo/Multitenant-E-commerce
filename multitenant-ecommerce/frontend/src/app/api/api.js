import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { resolveTenantSlug } from "../../lib/tenant";

/**
 * Base RTK Query API.
 *
 * Two multitenant-specific things happen here:
 *  1. Every request automatically carries the resolved tenant slug in the
 *     x-tenant-slug header (used in dev; in prod the subdomain already tells
 *     the backend which tenant it is, but sending it is harmless).
 *  2. credentials: 'include' so the httpOnly refresh cookie (Lumina-style) flows.
 *
 * Access token handling (in-memory Redux, Lumina-style) is wired in
 * prepareHeaders by reading from the auth slice.
 */
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      // Tenant resolution (dev convenience; prod uses subdomain).
      headers.set("x-tenant-slug", resolveTenantSlug());

      // In-memory access token from the auth slice.
      const token = getState()?.auth?.accessToken;
      if (token) headers.set("Authorization", `Bearer ${token}`);

      return headers;
    },
  }),
  tagTypes: [
    "Product",
    "Order",
    "Tenant",
    "User",
    "Category",
    "Coupon",
    "Review",
    "PaymentSettings",
    "ShippingSettings",
    "AdminUser",
    "Return",
    "BannerSettings",
    "StoreSettings",
    "Wishlist",
  ],
  endpoints: () => ({}),
});
