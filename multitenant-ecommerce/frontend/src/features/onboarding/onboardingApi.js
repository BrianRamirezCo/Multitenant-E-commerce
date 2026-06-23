import { api } from "../../app/api/api";

/**
 * Onboarding endpoints (platform level — no tenant scope).
 * Drives the SaaS landing pricing table and the store signup flow.
 */
export const onboardingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPlans: builder.query({
      query: () => "/onboarding/plans",
    }),
    checkSlug: builder.query({
      query: (slug) =>
        `/onboarding/check-slug?slug=${encodeURIComponent(slug)}`,
    }),
    signup: builder.mutation({
      query: (body) => ({ url: "/onboarding/signup", method: "POST", body }),
    }),
    // Post-payment: poll whether the tenant has been provisioned yet.
    signupStatus: builder.query({
      query: (ref) => `/onboarding/status?ref=${encodeURIComponent(ref)}`,
    }),
  }),
});

export const {
  useGetPlansQuery,
  useLazyCheckSlugQuery,
  useSignupMutation,
  useSignupStatusQuery,
} = onboardingApi;
