import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { useRefreshMutation } from "../authApi";

/**
 * Route guard for the admin panel.
 *
 * On mount it tries to restore a session via POST /auth/refresh (using the
 * httpOnly refresh cookie). While that's in flight we show a loader. After it
 * resolves: if there's a user in memory, render the children; otherwise
 * redirect to /admin/login.
 *
 * This means a page refresh keeps the user logged in (the access token lives in
 * memory and is re-minted from the refresh cookie), without storing tokens in
 * localStorage.
 */
export default function RequireAuth({ children }) {
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
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
