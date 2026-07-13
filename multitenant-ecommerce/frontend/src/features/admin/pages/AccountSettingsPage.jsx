import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { UserCog, Lock } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from "../../auth/authApi";

/**
 * Admin "My account" page. Lets the logged-in admin edit their own profile
 * (name + phone) and change their password. Uses the same shared auth endpoints
 * as the storefront customer account.
 */
export default function AccountSettingsPage() {
  const { t } = useTranslation();
  const user = useSelector((s) => s.auth.user);

  const [updateProfile, { isLoading: savingProfile }] =
    useUpdateProfileMutation();
  const [changePassword, { isLoading: changingPass }] =
    useChangePasswordMutation();

  // Profile form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addr, setAddr] = useState({
    line1: "",
    city: "",
    state: "",
    zip: "",
  });
  const [profileMsg, setProfileMsg] = useState(null);

  // Password form
  const [pass, setPass] = useState({ current: "", next: "", confirm: "" });
  const [passMsg, setPassMsg] = useState(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setPhone(user.profile?.phone || "");
    const a = user.profile?.address || {};
    setAddr({
      line1: a.line1 || "",
      city: a.city || "",
      state: a.state || "",
      zip: a.zip || "",
    });
  }, [user]);

  const updAddr = (field) => (e) =>
    setAddr((a) => ({ ...a, [field]: e.target.value }));

  const saveProfile = async () => {
    setProfileMsg(null);
    try {
      await updateProfile({
        name,
        phone,
        address: {
          line1: addr.line1,
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
          country: "AR",
        },
      }).unwrap();
      setProfileMsg({ type: "ok", text: t("adminAccount.profileSaved") });
    } catch {
      setProfileMsg({ type: "err", text: t("adminAccount.profileError") });
    }
  };

  const changePass = async () => {
    setPassMsg(null);
    if (pass.next.length < 8) {
      setPassMsg({ type: "err", text: t("adminAccount.passwordTooShort") });
      return;
    }
    if (pass.next !== pass.confirm) {
      setPassMsg({ type: "err", text: t("adminAccount.passwordMismatch") });
      return;
    }
    try {
      await changePassword({
        currentPassword: pass.current,
        newPassword: pass.next,
      }).unwrap();
      setPassMsg({ type: "ok", text: t("adminAccount.passwordChanged") });
      setPass({ current: "", next: "", confirm: "" });
    } catch (err) {
      const text =
        err?.status === 401
          ? t("adminAccount.passwordWrongCurrent")
          : err?.data?.message || t("adminAccount.passwordError");
      setPassMsg({ type: "err", text });
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {t("adminAccount.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("adminAccount.subtitle")}
        </p>
      </div>

      {/* Profile */}
      <div className="rounded-2xl border border-border p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <UserCog className="h-4 w-4" /> {t("adminAccount.profileTitle")}
        </h2>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("adminAccount.name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("adminAccount.email")}</Label>
            <Input value={user?.email || ""} disabled />
            <p className="text-xs text-muted-foreground">
              {t("adminAccount.emailHint")}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t("adminAccount.phone")}</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Dirección personal */}
          <div className="space-y-1.5">
            <Label htmlFor="line1">{t("adminAccount.addressLine")}</Label>
            <Input id="line1" value={addr.line1} onChange={updAddr("line1")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">{t("adminAccount.city")}</Label>
            <Input id="city" value={addr.city} onChange={updAddr("city")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="state">{t("adminAccount.state")}</Label>
              <Input
                id="state"
                value={addr.state}
                onChange={updAddr("state")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zip">{t("adminAccount.zip")}</Label>
              <Input id="zip" value={addr.zip} onChange={updAddr("zip")} />
            </div>
          </div>

          <Button
            className="rounded-full"
            size="sm"
            onClick={saveProfile}
            disabled={savingProfile}
          >
            {savingProfile
              ? t("adminAccount.saving")
              : t("adminAccount.saveProfile")}
          </Button>
          {profileMsg && (
            <p
              className={`text-xs ${profileMsg.type === "ok" ? "text-green-600" : "text-destructive"}`}
            >
              {profileMsg.text}
            </p>
          )}
        </div>
      </div>

      {/* Password */}
      <div className="rounded-2xl border border-border p-6">
        <h2 className="mb-1 flex items-center gap-2 font-semibold">
          <Lock className="h-4 w-4" /> {t("adminAccount.securityTitle")}
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          {t("adminAccount.securitySubtitle")}
        </p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">
              {t("adminAccount.currentPassword")}
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={pass.current}
              onChange={(e) =>
                setPass((p) => ({ ...p, current: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">{t("adminAccount.newPassword")}</Label>
            <Input
              id="newPassword"
              type="password"
              value={pass.next}
              onChange={(e) => setPass((p) => ({ ...p, next: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">
              {t("adminAccount.confirmPassword")}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={pass.confirm}
              onChange={(e) =>
                setPass((p) => ({ ...p, confirm: e.target.value }))
              }
            />
          </div>
          <Button
            className="rounded-full"
            size="sm"
            onClick={changePass}
            disabled={
              changingPass || !pass.current || !pass.next || !pass.confirm
            }
          >
            {changingPass
              ? t("adminAccount.savingPassword")
              : t("adminAccount.changePassword")}
          </Button>
          {passMsg && (
            <p
              className={`text-xs ${passMsg.type === "ok" ? "text-green-600" : "text-destructive"}`}
            >
              {passMsg.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
