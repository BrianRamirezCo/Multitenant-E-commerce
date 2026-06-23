import { createSlice } from "@reduxjs/toolkit";
import { api } from "../../app/api/api";

/**
 * Holds the CURRENT tenant's public info (name, theme, plan) for the storefront
 * and admin. Populated by /tenant/me on load. Used for per-tenant theming, SEO
 * and plan-based UI gating.
 */
const tenantApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentTenant: builder.query({
      query: () => "/tenant/me",
      providesTags: ["Tenant"],
    }),
    // Store owner updates their own appearance (theme / color / logo).
    updateAppearance: builder.mutation({
      query: (body) => ({ url: "/tenant/appearance", method: "PATCH", body }),
      invalidatesTags: ["Tenant"],
    }),
    // Store owner reads their MercadoPago config (masked, never the full token).
    getPaymentSettings: builder.query({
      query: () => "/tenant/payment-settings",
      providesTags: ["PaymentSettings"],
    }),
    // Store owner saves their MercadoPago credentials.
    updatePaymentSettings: builder.mutation({
      query: (body) => ({
        url: "/tenant/payment-settings",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["PaymentSettings"],
    }),
    // Store owner reads their shipping config.
    getShippingSettings: builder.query({
      query: () => "/tenant/shipping-settings",
      providesTags: ["ShippingSettings"],
    }),
    // Store owner saves their shipping config.
    updateShippingSettings: builder.mutation({
      query: (body) => ({
        url: "/tenant/shipping-settings",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ShippingSettings", "Tenant"],
    }),
    // Store owner reads their banner config.
    getBannerSettings: builder.query({
      query: () => "/tenant/banner-settings",
      providesTags: ["BannerSettings"],
    }),
    // Store owner saves their banner config.
    updateBannerSettings: builder.mutation({
      query: (body) => ({
        url: "/tenant/banner-settings",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["BannerSettings", "Tenant"],
    }),
    // Store owner reads their social links + "About us" content.
    getStoreSettings: builder.query({
      query: () => "/tenant/store-settings",
      providesTags: ["StoreSettings"],
    }),
    // Store owner saves their social links + "About us" content.
    updateStoreSettings: builder.mutation({
      query: (body) => ({
        url: "/tenant/store-settings",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["StoreSettings", "Tenant"],
    }),
  }),
});

export const {
  useGetCurrentTenantQuery,
  useUpdateAppearanceMutation,
  useGetPaymentSettingsQuery,
  useUpdatePaymentSettingsMutation,
  useGetShippingSettingsQuery,
  useUpdateShippingSettingsMutation,
  useGetBannerSettingsQuery,
  useUpdateBannerSettingsMutation,
  useGetStoreSettingsQuery,
  useUpdateStoreSettingsMutation,
} = tenantApi;

const tenantSlice = createSlice({
  name: "tenant",
  initialState: { info: null },
  reducers: {
    setTenant: (state, action) => {
      state.info = action.payload;
    },
    // Optimistic local update so the live preview reflects changes instantly.
    updateTenantTheme: (state, action) => {
      if (state.info) {
        state.info = {
          ...state.info,
          theme: { ...state.info.theme, ...action.payload },
        };
      }
    },
  },
});

export const { setTenant, updateTenantTheme } = tenantSlice.actions;
export default tenantSlice.reducer;
