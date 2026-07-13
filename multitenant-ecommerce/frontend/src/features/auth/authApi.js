import { api } from "../../app/api/api";
import { setCredentials, logout as logoutAction } from "./authSlice";

/**
 * Auth endpoints. The access token returned by login/register/refresh is stored
 * in memory (Redux) via setCredentials; the refresh token is an httpOnly cookie
 * handled by the browser automatically (credentials: 'include' in the base api).
 */
export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({ user: data.user, accessToken: data.accessToken }),
          );
        } catch {
          /* handled by the caller */
        }
      },
    }),
    register: builder.mutation({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({ user: data.user, accessToken: data.accessToken }),
          );
        } catch {
          /* ignore */
        }
      },
    }),
    // Called on app load to restore a session from the refresh cookie.
    refresh: builder.mutation({
      query: () => ({ url: "/auth/refresh", method: "POST" }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({ user: data.user, accessToken: data.accessToken }),
          );
        } catch {
          /* no valid session */
        }
      },
    }),
    logout: builder.mutation({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(logoutAction());
        }
      },
    }),
    // Update the current user's profile (name, phone, address). Refreshes the
    // user in the auth slice so the prefilled data stays in sync.
    updateProfile: builder.mutation({
      query: (body) => ({ url: "/auth/profile", method: "PATCH", body }),
      async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const token = getState()?.auth?.accessToken;
          dispatch(setCredentials({ user: data.user, accessToken: token }));
        } catch {
          /* ignore */
        }
      },
    }),

    // ---- Password reset ----
    // Change the logged-in user's password. Body: { currentPassword, newPassword }.
    // No Redux update needed — the session/token stays valid.
    changePassword: builder.mutation({
      query: (body) => ({ url: "/auth/password", method: "PATCH", body }),
    }),
    // Request a password reset link (sends an email). Body: { email, context }.
    forgotPassword: builder.mutation({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),
    // Set a new password using the token from the email link.
    // Body: { token, password }.
    resetPassword: builder.mutation({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
    }),

    // ---- Wishlist ----
    // Full product docs of the customer's saved items (for the wishlist page).
    getWishlist: builder.query({
      query: () => "/auth/wishlist",
      providesTags: ["Wishlist"],
    }),
    // Add a product. Updates the user's wishlist array in Redux so the heart
    // flips instantly everywhere it's shown.
    addToWishlist: builder.mutation({
      query: (productId) => ({
        url: `/auth/wishlist/${productId}`,
        method: "POST",
      }),
      invalidatesTags: ["Wishlist"],
      async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const state = getState();
          const token = state?.auth?.accessToken;
          const user = state?.auth?.user;
          if (user) {
            dispatch(
              setCredentials({
                user: { ...user, wishlist: data.wishlist },
                accessToken: token,
              }),
            );
          }
        } catch {
          /* ignore */
        }
      },
    }),
    // Remove a product. Same Redux sync as add.
    removeFromWishlist: builder.mutation({
      query: (productId) => ({
        url: `/auth/wishlist/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Wishlist"],
      async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const state = getState();
          const token = state?.auth?.accessToken;
          const user = state?.auth?.user;
          if (user) {
            dispatch(
              setCredentials({
                user: { ...user, wishlist: data.wishlist },
                accessToken: token,
              }),
            );
          }
        } catch {
          /* ignore */
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshMutation,
  useLogoutMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
} = authApi;
