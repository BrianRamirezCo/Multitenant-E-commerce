import { createSlice } from '@reduxjs/toolkit';

/**
 * Cart slice. Kept in memory (Redux). The cart is per browser session;
 * on checkout, items are sent to the backend which recomputes totals
 * server-side (never trust client prices).
 */
const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    addItem: (state, action) => {
      const { product, quantity = 1 } = action.payload;
      const existing = state.items.find((i) => i.product === product._id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({
          product: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || null,
          quantity,
        });
      }
    },
    removeItem: (state, action) => {
      state.items = state.items.filter((i) => i.product !== action.payload);
    },
    updateQuantity: (state, action) => {
      const item = state.items.find((i) => i.product === action.payload.product);
      if (item) item.quantity = action.payload.quantity;
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
