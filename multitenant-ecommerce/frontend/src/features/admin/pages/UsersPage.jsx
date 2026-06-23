import { useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { UserCog, Trash2, UserPlus } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Badge } from "../../../components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/table";
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useDeleteUserMutation,
} from "../../users/usersApi";

/**
 * Admin → Users. Only the store OWNER manages admin users (create/delete).
 * Employees (regular admins) see the list read-only — no add form, no delete.
 * Create directly (name/email/password); plan limits cap how many.
 */
const EMPTY = { name: "", email: "", password: "" };

export default function UsersPage() {
  const { t } = useTranslation();
  const me = useSelector((s) => s.auth.user);
  const isOwner = Boolean(me?.isOwner);

  const { data, isLoading, isError } = useGetUsersQuery();
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState(null);

  const users = data?.users || [];
  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const fmtDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const add = async () => {
    setMsg(null);
    try {
      await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
      }).unwrap();
      setMsg({ type: "ok", text: t("users.added") });
      setForm(EMPTY);
    } catch (err) {
      // 403 here means the plan limit (owner-only is already enforced by hiding
      // the form, so a 403 reaching this point is the limit).
      const text =
        err?.status === 403
          ? t("users.limitReached")
          : err?.data?.message || t("users.addError");
      setMsg({ type: "err", text });
    }
  };

  const remove = async (id) => {
    if (!window.confirm(t("users.deleteConfirm"))) return;
    try {
      await deleteUser(id).unwrap();
    } catch {
      // ignore; list stays as-is
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {t("users.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("users.subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add user form — only the owner can manage users */}
        {isOwner && (
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 flex items-center gap-2 font-semibold">
                  <UserPlus className="h-4 w-4" /> {t("users.addTitle")}
                </h2>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">{t("users.name")}</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={update("name")}
                      placeholder={t("users.namePlaceholder")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">{t("users.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={update("email")}
                      placeholder={t("users.emailPlaceholder")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">{t("users.password")}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={update("password")}
                      placeholder={t("users.passwordPlaceholder")}
                    />
                  </div>
                  <Button className="w-full" onClick={add} disabled={creating}>
                    {creating ? t("users.adding") : t("users.add")}
                  </Button>
                  {msg && (
                    <p
                      className={`text-xs ${msg.type === "ok" ? "text-green-600" : "text-destructive"}`}
                    >
                      {msg.text}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users list — full width for non-owners (no form column) */}
        <div className={isOwner ? "lg:col-span-2" : "lg:col-span-3"}>
          <Card>
            <CardContent className="px-0 py-0">
              {isLoading && (
                <div className="space-y-2 p-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-12 animate-pulse rounded bg-muted"
                    />
                  ))}
                </div>
              )}

              {isError && (
                <div className="p-12 text-center text-destructive">
                  {t("users.loadError")}
                </div>
              )}

              {!isLoading && !isError && users.length === 0 && (
                <div className="p-12 text-center">
                  <UserCog className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 font-medium">{t("users.empty")}</p>
                </div>
              )}

              {!isLoading && !isError && users.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">
                        {t("users.colName")}
                      </TableHead>
                      <TableHead>{t("users.colEmail")}</TableHead>
                      <TableHead>{t("users.colSince")}</TableHead>
                      <TableHead className="pr-6 text-right">
                        {t("users.colActions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => {
                      const isMe = me && u.id === me.id;
                      // Only the owner sees delete; never for self or the owner.
                      const canDelete = isOwner && !isMe && !u.isOwner;
                      return (
                        <TableRow key={u.id}>
                          <TableCell className="pl-6 font-medium">
                            {u.name}
                            {u.isOwner && (
                              <Badge className="ml-2">{t("users.owner")}</Badge>
                            )}
                            {isMe && !u.isOwner && (
                              <Badge variant="secondary" className="ml-2">
                                {t("users.you")}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {u.email}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {fmtDate(u.createdAt)}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(u.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
