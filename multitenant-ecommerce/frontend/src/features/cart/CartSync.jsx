import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useSaveCartMutation } from "./cartApi";

/**
 * Invisible component that persists the cart to the backend whenever it changes,
 * so the abandoned-cart cron can email a reminder.
 *
 * Debounced: we wait until the shopper stops changing the cart for a moment
 * before saving, to avoid a request on every single click.
 *
 * Identity: if the shopper is logged in, the backend uses their account. If not,
 * we can only persist once we know their email (captured at checkout) — until
 * then there's nothing to recover to, so we skip saving for anonymous guests.
 */
export default function CartSync() {
  const items = useSelector((s) => s.cart.items);
  const user = useSelector((s) => s.auth.user);
  const [saveCart] = useSaveCartMutation();
  const timer = useRef(null);
  const firstRun = useRef(true);

  useEffect(() => {
    // Skip the very first render (initial load) to avoid an empty save on boot.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    // Only persist if we can identify the shopper (logged in). Anonymous guests
    // get persisted later, from the checkout, once they type their email.
    if (!user) return;

    // Debounce: save 1.2s after the last change.
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveCart({
        items: items.map((i) => ({
          product: i.product,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image || null,
        })),
      }).catch(() => {});
    }, 1200);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [items, user, saveCart]);

  return null; // renders nothing
}
