import { NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tags,
  Users,
  Boxes,
  Ticket,
  RotateCcw,
  Star,
  Megaphone,
  Mail,
  MousePointerClick,
  BarChart3,
  TrendingUp,
  Trophy,
  Palette,
  UserCog,
  CreditCard,
  Truck,
  LogOut,
  Lock,
  Store,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { hasFeatureClient } from "../../../lib/planClient";
import { useLogoutMutation } from "../../auth/authApi";

/**
 * Admin sidebar. Grouped navigation, fully translated via i18n (labelKey).
 * Items requiring a higher plan render LOCKED (lock icon) instead of hidden,
 * exposing upsell opportunities.
 */
const SECTIONS = [
  {
    titleKey: null,
    items: [
      {
        to: "/admin",
        labelKey: "sidebar.dashboard",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    titleKey: "sidebar.storeGroup",
    items: [
      { to: "/admin/orders", labelKey: "sidebar.orders", icon: ShoppingBag },
      { to: "/admin/products", labelKey: "sidebar.products", icon: Package },
      { to: "/admin/categories", labelKey: "sidebar.categories", icon: Tags },
      { to: "/admin/customers", labelKey: "sidebar.customers", icon: Users },
      { to: "/admin/inventory", labelKey: "sidebar.inventory", icon: Boxes },
      { to: "/admin/coupons", labelKey: "sidebar.coupons", icon: Ticket },
      { to: "/admin/returns", labelKey: "sidebar.returns", icon: RotateCcw },
      { to: "/admin/reviews", labelKey: "sidebar.reviews", icon: Star },
    ],
  },
  {
    titleKey: "sidebar.marketingGroup",
    items: [
      {
        to: "/admin/promotions",
        labelKey: "sidebar.promotions",
        icon: Megaphone,
        feature: "promotions",
      },
      {
        to: "/admin/newsletter",
        labelKey: "sidebar.newsletter",
        icon: Mail,
        feature: "newsletter",
      },
      {
        to: "/admin/popups",
        labelKey: "sidebar.popups",
        icon: MousePointerClick,
        feature: "popups",
      },
    ],
  },
  {
    titleKey: "sidebar.analyticsGroup",
    items: [
      {
        to: "/admin/reports",
        labelKey: "sidebar.reports",
        icon: BarChart3,
        feature: "advancedAnalytics",
      },
      {
        to: "/admin/sales",
        labelKey: "sidebar.sales",
        icon: TrendingUp,
        feature: "advancedAnalytics",
      },
      {
        to: "/admin/top-products",
        labelKey: "sidebar.topProducts",
        icon: Trophy,
        feature: "advancedAnalytics",
      },
    ],
  },
  {
    titleKey: "sidebar.settingsGroup",
    items: [
      {
        to: "/admin/appearance",
        labelKey: "sidebar.appearance",
        icon: Palette,
      },
      { to: "/admin/banner", labelKey: "sidebar.banner", icon: ImageIcon },
      {
        to: "/admin/store-settings",
        labelKey: "sidebar.storeSettings",
        icon: Store,
      },
      {
        to: "/admin/subscribers",
        labelKey: "sidebar.subscribers",
        icon: Mail,
        feature: "newsletter",
      },
      {
        to: "/admin/store-settings",
        labelKey: "sidebar.storeSettings",
        icon: Store,
      },
      { to: "/admin/users", labelKey: "sidebar.users", icon: UserCog },
      { to: "/admin/payments", labelKey: "sidebar.payments", icon: CreditCard },
      { to: "/admin/shipping", labelKey: "sidebar.shipping", icon: Truck },
    ],
  },
];

function SidebarItem({ item, plan, t }) {
  const locked = item.feature && !hasFeatureClient(plan, item.feature);
  const Icon = item.icon;
  const label = t(item.labelKey);

  if (locked) {
    return (
      <div
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/50 cursor-not-allowed"
        title={t("common.locked")}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{label}</span>
        <Lock className="h-3.5 w-3.5" />
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary/10 font-medium text-primary"
            : "text-foreground/70 hover:bg-secondary hover:text-foreground",
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </NavLink>
  );
}

export default function AdminSidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tenant = useSelector((s) => s.tenant.info);
  const user = useSelector((s) => s.auth.user);
  const plan = tenant?.plan || "starter";
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      navigate("/admin/login");
    }
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-background">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <span className="font-display text-lg font-bold tracking-tight">
          {tenant?.name || t("sidebar.myStore")}
        </span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {SECTIONS.map((section, i) => (
          <div key={i}>
            {section.titleKey && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t(section.titleKey)}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <SidebarItem key={item.to} item={item} plan={plan} t={t} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {(user?.name || "A")[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {user?.name || t("sidebar.admin")}
            </p>
            <p className="truncate text-xs text-muted-foreground capitalize">
              {plan}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-secondary"
        >
          <LogOut className="h-4 w-4" />
          {t("sidebar.logout")}
        </button>
      </div>
    </aside>
  );
}
