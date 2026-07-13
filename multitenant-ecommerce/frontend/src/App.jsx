import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import {
  useGetCurrentTenantQuery,
  setTenant,
} from "./features/tenant/tenantSlice";
import { useTenantTheme } from "./hooks/useTenantTheme";

// ---- Auth guards ----
import RequireAuth from "./features/auth/components/RequireAuth";
import RequireCustomer from "./features/auth/components/RequireCustomer";
import LoginPage from "./features/auth/pages/LoginPage";
import ForgotPasswordPage from "./features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/pages/ResetPasswordPage";

// ---- Platform (landing + signup + legal) ----
import LandingPagePremium from "./features/landing/premium/LandingPagePremium";
import SignupPage from "./features/landing/pages/SignupPage";
import SignupSuccessPage from "./features/landing/pages/SignupSuccessPage";
import TermsPage from "./features/legal/pages/TermsPage";
import PrivacyPage from "./features/legal/pages/PrivacyPage";
import CookiesPage from "./features/legal/pages/CookiesPage";
import ContactPage from "./features/legal/pages/ContactPage";

// ---- Storefront ----
import StorefrontLayout from "./features/storefront/components/StorefrontLayout";
import HomePage from "./features/storefront/pages/HomePage";
import ProductPage from "./features/storefront/pages/ProductPage";
import CategoriesIndexPage from "./features/storefront/pages/CategoriesIndexPage";
import CategoryProductsPage from "./features/storefront/pages/CategoryProductsPage";
import DealsPage from "./features/storefront/pages/DealsPage";
import NewArrivalsPage from "./features/storefront/pages/NewArrivalsPage";
import CatalogPage from "./features/storefront/pages/CatalogPage";
import SearchPage from "./features/storefront/pages/SearchPage";
import CartPage from "./features/storefront/pages/CartPage";
import CheckoutPage from "./features/storefront/pages/CheckoutPage";
import AccountAuthPage from "./features/storefront/pages/AccountAuthPage";
import AccountPage from "./features/storefront/pages/AccountPage";
import ShippingInfoPage from "./features/storefront/pages/ShippingInfoPage";
import ReturnsInfoPage from "./features/storefront/pages/ReturnsInfoPage";
import StoreContactPage from "./features/storefront/pages/StoreContactPage";
import AboutPage from "./features/storefront/pages/AboutPage";
import StoreTermsPage from "./features/storefront/pages/StoreTermsPage";
import StorePrivacyPage from "./features/storefront/pages/StorePrivacyPage";
import StoreCookiesPage from "./features/storefront/pages/StoreCookiesPage";
import WishlistPage from "./features/storefront/pages/WishlistPage";

// ---- Admin ----
import AdminLayout from "./features/admin/components/AdminLayout";
import DashboardPage from "./features/admin/pages/DashboardPage";
import OrdersPage from "./features/admin/pages/OrdersPage";
import ProductsPage from "./features/admin/pages/ProductsPage";
import CustomersPage from "./features/admin/pages/CustomersPage";
import CategoriesPage from "./features/admin/pages/CategoriesPage";
import CouponsPage from "./features/admin/pages/CouponsPage";
import InventoryPage from "./features/admin/pages/InventoryPage";
import AppearancePage from "./features/admin/pages/AppearancePage";
import ReviewsPage from "./features/admin/pages/ReviewsPage";
import PaymentsPage from "./features/admin/pages/PaymentsPage";
import ShippingPage from "./features/admin/pages/ShippingPage";
import BannerPage from "./features/admin/pages/BannerPage";
import UsersPage from "./features/admin/pages/UsersPage";
import ReturnsPage from "./features/admin/pages/ReturnsPage";
import StoreSettingsPage from "./features/admin/pages/StoreSettingsPage";
import PremiumFeaturePage from "./features/admin/pages/PremiumFeaturePage";
import SubscribersPage from "./features/admin/pages/SubscribersPage";
import AccountSettingsPage from "./features/admin/pages/AccountSettingsPage";

/**
 * Root app with TWO route groups:
 *
 *  1. PLATFORM routes (no tenant needed): the SaaS marketing landing and the
 *     store signup flow. These render regardless of subdomain.
 *
 *  2. TENANT routes (require a resolved tenant): the storefront and the admin
 *     panel. These are wrapped in TenantBootstrap, which resolves the tenant
 *     from the subdomain and applies its theme.
 *
 * Routing model in production:
 *   - app apex (yourapp.com)          -> landing + signup (platform)
 *   - store subdomain (store.app.com) -> storefront + admin (tenant)
 *
 * In local dev (no subdomains) all routes are reachable; the tenant routes use
 * the dev tenant resolved via the x-tenant-slug header.
 */
function TenantBootstrap({ children }) {
  const dispatch = useDispatch();
  const { data, isLoading, isError } = useGetCurrentTenantQuery();
  useTenantTheme();

  useEffect(() => {
    if (data?.tenant) dispatch(setTenant(data.tenant));
  }, [data, dispatch]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading...
      </div>
    );
  }
  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="font-display text-2xl font-bold">Store not found</p>
          <p className="mt-2 text-muted-foreground">
            Check the subdomain or that the backend is running.
          </p>
        </div>
      </div>
    );
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ---- PLATFORM routes (no tenant) ---- */}
        <Route path="/" element={<LandingPagePremium />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup/success" element={<SignupSuccessPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* ---- TENANT routes (storefront) ---- */}
        <Route
          path="/store/*"
          element={
            <TenantBootstrap>
              <Routes>
                <Route element={<StorefrontLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="product/:slug" element={<ProductPage />} />
                  <Route path="categories" element={<CategoriesIndexPage />} />
                  <Route
                    path="categories/:slug"
                    element={<CategoryProductsPage />}
                  />
                  <Route path="deals" element={<DealsPage />} />
                  <Route path="new" element={<NewArrivalsPage />} />
                  <Route path="products" element={<CatalogPage />} />
                  <Route
                    path="wishlist"
                    element={
                      <RequireCustomer>
                        <WishlistPage />
                      </RequireCustomer>
                    }
                  />
                  <Route path="search" element={<SearchPage />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="login" element={<AccountAuthPage />} />
                  <Route
                    path="forgot-password"
                    element={<ForgotPasswordPage context="store" />}
                  />
                  <Route
                    path="reset-password"
                    element={<ResetPasswordPage context="store" />}
                  />
                  <Route
                    path="account"
                    element={
                      <RequireCustomer>
                        <AccountPage />
                      </RequireCustomer>
                    }
                  />
                  {/* Info / legal content pages */}
                  <Route path="shipping-info" element={<ShippingInfoPage />} />
                  <Route path="returns-info" element={<ReturnsInfoPage />} />
                  <Route path="contact" element={<StoreContactPage />} />
                  <Route path="about" element={<AboutPage />} />
                  <Route path="terms" element={<StoreTermsPage />} />
                  <Route path="privacy" element={<StorePrivacyPage />} />
                  <Route path="cookies" element={<StoreCookiesPage />} />
                </Route>
              </Routes>
            </TenantBootstrap>
          }
        />

        {/* ---- TENANT routes (admin login + password reset) ---- */}
        <Route
          path="/admin/login"
          element={
            <TenantBootstrap>
              <LoginPage />
            </TenantBootstrap>
          }
        />
        <Route
          path="/admin/forgot-password"
          element={
            <TenantBootstrap>
              <ForgotPasswordPage context="admin" />
            </TenantBootstrap>
          }
        />
        <Route
          path="/admin/reset-password"
          element={
            <TenantBootstrap>
              <ResetPasswordPage context="admin" />
            </TenantBootstrap>
          }
        />

        {/* ---- TENANT routes (admin panel) ---- */}
        <Route
          path="/admin/*"
          element={
            <TenantBootstrap>
              <RequireAuth>
                <Routes>
                  <Route element={<AdminLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="orders" element={<OrdersPage />} />
                    <Route path="products" element={<ProductsPage />} />
                    <Route path="categories" element={<CategoriesPage />} />
                    <Route path="coupons" element={<CouponsPage />} />
                    <Route path="inventory" element={<InventoryPage />} />
                    <Route path="customers" element={<CustomersPage />} />
                    <Route path="subscribers" element={<SubscribersPage />} />
                    <Route path="reviews" element={<ReviewsPage />} />
                    <Route path="payments" element={<PaymentsPage />} />
                    <Route path="shipping" element={<ShippingPage />} />
                    <Route path="banner" element={<BannerPage />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="returns" element={<ReturnsPage />} />
                    <Route path="appearance" element={<AppearancePage />} />
                    <Route path="account" element={<AccountSettingsPage />} />
                    <Route
                      path="store-settings"
                      element={<StoreSettingsPage />}
                    />
                    <Route
                      path="promotions"
                      element={
                        <PremiumFeaturePage
                          feature="promotions"
                          titleKey="sidebar.promotions"
                          descKey="premiumFeature.promotionsDesc"
                          requiredPlan="Growth"
                        />
                      }
                    />
                    <Route
                      path="newsletter"
                      element={
                        <PremiumFeaturePage
                          feature="newsletter"
                          titleKey="sidebar.newsletter"
                          descKey="premiumFeature.newsletterDesc"
                          requiredPlan="Growth"
                        />
                      }
                    />
                    <Route
                      path="popups"
                      element={
                        <PremiumFeaturePage
                          feature="popups"
                          titleKey="sidebar.popups"
                          descKey="premiumFeature.popupsDesc"
                          requiredPlan="Growth"
                        />
                      }
                    />
                    <Route
                      path="reports"
                      element={
                        <PremiumFeaturePage
                          feature="advancedAnalytics"
                          titleKey="sidebar.reports"
                          descKey="premiumFeature.reportsDesc"
                          requiredPlan="Growth"
                        />
                      }
                    />
                    <Route
                      path="sales"
                      element={
                        <PremiumFeaturePage
                          feature="advancedAnalytics"
                          titleKey="sidebar.sales"
                          descKey="premiumFeature.salesDesc"
                          requiredPlan="Growth"
                        />
                      }
                    />
                    <Route
                      path="top-products"
                      element={
                        <PremiumFeaturePage
                          feature="advancedAnalytics"
                          titleKey="sidebar.topProducts"
                          descKey="premiumFeature.topProductsDesc"
                          requiredPlan="Growth"
                        />
                      }
                    />
                  </Route>
                </Routes>
              </RequireAuth>
            </TenantBootstrap>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
