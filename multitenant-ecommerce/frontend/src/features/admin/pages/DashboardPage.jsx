import { useTranslation } from "react-i18next";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Receipt,
  PackageCheck,
  Rocket,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/table";
import { Button } from "../../../components/ui/button";
import KpiCard from "../components/KpiCard";
import { formatPrice } from "../../../lib/format";
import { useGetDashboardQuery } from "../../analytics/analyticsApi";

/**
 * Admin Dashboard.
 *
 * Connects to the REAL analytics endpoint (GET /analytics/dashboard). If the
 * store has no sales yet, it shows a clean EMPTY state (zeros + a welcome note)
 * instead of fake demo numbers, so new store owners never see invented data.
 *
 * Translated via i18n.
 */
const STATUS_VARIANT = {
  fulfilled: "success",
  paid: "default",
  pending: "warning",
  cancelled: "destructive",
};

// A real, all-zero dashboard used when the store has no data yet.
const EMPTY_DASHBOARD = {
  kpis: {
    totalSales: 0,
    orders: 0,
    newCustomers: 0,
    avgTicket: 0,
    productsSold: 0,
    deltas: {
      totalSales: 0,
      orders: 0,
      newCustomers: 0,
      avgTicket: 0,
      productsSold: 0,
    },
  },
  salesSeries: [],
  byChannel: [],
  recentOrders: [],
  lowStock: [],
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const { data } = useGetDashboardQuery();

  // Use real data when available and meaningful; otherwise a real empty state.
  const real = data?.dashboard;
  const hasRealData =
    real && (real.kpis?.orders > 0 || real.recentOrders?.length > 0);
  const d = hasRealData ? real : EMPTY_DASHBOARD;
  const isEmpty = !hasRealData;

  // Normalize channel colors (only relevant when there's data).
  const byChannel = (d.byChannel || []).map((c, i) => ({
    ...c,
    color: c.color || ["#7c3aed", "#ec4899", "#f59e0b", "#94a3b8"][i % 4],
  }));

  const statusLabel = {
    fulfilled: t("dashboard.statusFulfilled"),
    paid: t("dashboard.statusPaid"),
    pending: t("dashboard.statusPending"),
    cancelled: t("dashboard.statusCancelled"),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {t("dashboard.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.subtitle")}
        </p>
      </div>

      {/* Friendly welcome/empty notice for brand-new stores */}
      {isEmpty && (
        <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">{t("dashboard.emptyTitle")}</p>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.emptySubtitle")}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard
          label={t("dashboard.totalSales")}
          value={formatPrice(d.kpis.totalSales)}
          change={d.kpis.deltas.totalSales}
          icon={DollarSign}
          iconClass="bg-green-100 text-green-700"
        />
        <KpiCard
          label={t("dashboard.orders")}
          value={d.kpis.orders.toLocaleString()}
          change={d.kpis.deltas.orders}
          icon={ShoppingBag}
          iconClass="bg-blue-100 text-blue-700"
        />
        <KpiCard
          label={t("dashboard.newCustomers")}
          value={d.kpis.newCustomers}
          change={d.kpis.deltas.newCustomers}
          icon={Users}
          iconClass="bg-amber-100 text-amber-700"
        />
        <KpiCard
          label={t("dashboard.avgTicket")}
          value={formatPrice(d.kpis.avgTicket)}
          change={d.kpis.deltas.avgTicket}
          icon={Receipt}
          iconClass="bg-purple-100 text-purple-700"
        />
        <KpiCard
          label={t("dashboard.productsSold")}
          value={d.kpis.productsSold.toLocaleString()}
          change={d.kpis.deltas.productsSold}
          icon={PackageCheck}
          iconClass="bg-rose-100 text-rose-700"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.sales")}</CardTitle>
          </CardHeader>
          <CardContent>
            {d.salesSeries.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                {t("dashboard.noSalesYet")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={d.salesSeries}
                  margin={{ left: -10, right: 10 }}
                >
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      fontSize: 12,
                    }}
                    formatter={(v) => [
                      `$${v.toLocaleString()}`,
                      t("dashboard.sales"),
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#salesFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("dashboard.salesByChannel")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {byChannel.length === 0 ? (
              <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
                {t("dashboard.noDataYet")}
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={byChannel}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={2}
                    >
                      {byChannel.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => `${v}%`}
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {byChannel.map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: c.color }}
                        />
                        <span className="text-muted-foreground">{c.name}</span>
                      </div>
                      <span className="font-medium">{c.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              {t("dashboard.recentOrders")}
            </CardTitle>
            <Button variant="ghost" size="sm">
              {t("common.viewAll")}
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            {d.recentOrders.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                {t("dashboard.noOrdersYet")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">
                      {t("dashboard.order")}
                    </TableHead>
                    <TableHead>{t("dashboard.customer")}</TableHead>
                    <TableHead>{t("dashboard.total")}</TableHead>
                    <TableHead className="pr-6">
                      {t("dashboard.status")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.recentOrders.map((o) => (
                    <TableRow key={o.id || o._id}>
                      <TableCell className="pl-6 font-medium">
                        {o.id || `#${String(o._id).slice(-6).toUpperCase()}`}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {o.customer?.name ||
                          (typeof o.customer === "string"
                            ? o.customer
                            : t("orders.guest"))}
                      </TableCell>
                      <TableCell>{formatPrice(o.total)}</TableCell>
                      <TableCell className="pr-6">
                        <Badge variant={STATUS_VARIANT[o.status]}>
                          {statusLabel[o.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              {t("dashboard.lowStock")}
            </CardTitle>
            <Button variant="ghost" size="sm">
              {t("common.viewAll")}
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            {d.lowStock.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                {t("dashboard.noLowStock")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">
                      {t("dashboard.product")}
                    </TableHead>
                    <TableHead>{t("dashboard.currentStock")}</TableHead>
                    <TableHead className="pr-6">
                      {t("dashboard.minStock")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.lowStock.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell className="pl-6 font-medium">
                        {p.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {p.current ?? p.stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-muted-foreground">
                        {p.min ?? 10}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
