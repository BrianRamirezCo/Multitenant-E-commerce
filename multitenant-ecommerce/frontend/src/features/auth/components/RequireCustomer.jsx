import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { useRefreshMutation } from "../authApi";

/**
 * Route guard for the customer account area in the storefront.
 *
 * On mount it tries to restore a session via POST /auth/refresh (httpOnly
 * cookie). While that's in flight we show a loader. After it resolves: if
 * there's a session, render the children; otherwise redirect to the storefront
 * auth page (/store/login).
 *
 * Same mechanism as the admin's RequireAuth, but redirects to the storefront
 * login instead of the admin login.
 */
export default function RequireCustomer({ children }) {
  const accessToken = useSelector((s) => s.auth.accessToken);
  const [refresh] = useRefreshMutation();
  const [checked, setChecked] = useState(Boolean(accessToken));

  useEffect(() => {
    let active = true;
    if (!accessToken) {
      refresh()
        .unwrap()
        .catch(() => {})
        .finally(() => active && setChecked(true));
    } else {
      setChecked(true);
    }
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/store/login" replace />;
  }

  return children;
}
