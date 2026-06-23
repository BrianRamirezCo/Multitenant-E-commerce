import { configureStore } from '@reduxjs/toolkit';
import { api } from '../api/api';
import authReducer from '../../features/auth/authSlice';
import cartReducer from '../../features/cart/cartSlice';
import tenantReducer from '../../features/tenant/tenantSlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    cart: cartReducer,
    tenant: tenantReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});
