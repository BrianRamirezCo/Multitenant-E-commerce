import { createSlice } from '@reduxjs/toolkit';

/**
 * Auth slice. Access token kept IN MEMORY only (Lumina pattern), never in
 * localStorage. The refresh token lives in an httpOnly cookie set by the backend.
 */
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: null,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
