"use client";

import { useState, useEffect } from "react";
import {
  User,
  Bell,
  Shield,
  Sliders,
  LogOut,
  ChevronRight,
  Camera,
  Mail,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Moon,
  Sun,
  Globe,
  CreditCard,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Save,
  KeyRound,
  Info,
} from "lucide-react";

import MobilePageHeader from "@/components/layout/MobilePageHeader";
import { useAuth } from "@/lib/hooks/useAuth";
import { authApi } from "@/lib/api/auth.api";

// ================================================================
// TYPES
// ================================================================

type SettingsTab =
  | "profile"
  | "notifications"
  | "security"
  | "preferences"
  | "danger";

interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ElementType;
  description: string;
}

// ================================================================
// CONFIG
// ================================================================

const tabs: TabConfig[] = [
  {
    id: "profile",
    label: "Profile",
    icon: User,
    description: "Personal information & avatar",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    description: "Alerts & communication prefs",
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    description: "Password, 2FA & sessions",
  },
  {
    id: "preferences",
    label: "Preferences",
    icon: Sliders,
    description: "Theme, language & currency",
  },
  {
    id: "danger",
    label: "Danger Zone",
    icon: AlertTriangle,
    description: "Delete account & data",
  },
];

// ================================================================
// SUB-COMPONENTS — outside main to prevent cursor bug on re-render
// ================================================================

interface SectionTitleProps {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}

function SectionTitle({ icon: Icon, title, subtitle }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-3 pb-1">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background:
            "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-600))",
          boxShadow:
            "3px 3px 8px rgba(23,29,9,0.20), -1px -1px 4px rgba(114,143,50,0.16)",
        }}
      >
        <Icon size={16} className="text-white" />
      </div>
      <div>
        <p className="text-sm font-bold text-olive-900">{title}</p>
        {subtitle && (
          <p className="text-xs text-olive-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}

function FormField({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
}: FormFieldProps) {
  return (
    <div>
      <label className="block text-xs font-bold text-olive-600 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <Icon
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-olive-400 pointer-events-none"
        />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`clay-input !pl-9 ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        />
      </div>
    </div>
  );
}

interface PasswordFieldProps {
  label: string;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
}

function PasswordField({
  label,
  show,
  onToggle,
  placeholder,
}: PasswordFieldProps) {
  return (
    <div>
      <label className="block text-xs font-bold text-olive-600 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <Lock
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-olive-400 pointer-events-none"
        />
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          className="clay-input !pl-9 !pr-11"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-olive-400 hover:text-olive-700 transition-colors"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  highlight?: boolean;
  iconOn?: React.ElementType;
  iconOff?: React.ElementType;
}

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
  highlight,
  iconOn: IconOn,
  iconOff: IconOff,
}: ToggleRowProps) {
  return (
    <button onClick={onToggle} className="settings-row w-full text-left">
      <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-3">
        {(IconOn || IconOff) && (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: enabled
                ? "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-600))"
                : "linear-gradient(145deg, var(--color-cream-300), var(--color-cream-400))",
            }}
          >
            {enabled && IconOn ? (
              <IconOn size={13} className="text-white" />
            ) : IconOff ? (
              <IconOff size={13} className="text-olive-500" />
            ) : null}
          </div>
        )}
        <div className="min-w-0">
          <p
            className={`text-sm font-semibold ${highlight && enabled ? "text-olive-700" : "text-olive-800"}`}
          >
            {label}
          </p>
          <p className="text-xs text-olive-400 leading-snug mt-0.5 truncate">
            {description}
          </p>
        </div>
      </div>
      <div
        className="relative shrink-0 w-11 h-6 rounded-full transition-all duration-300"
        style={{
          background: enabled
            ? "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-600))"
            : "linear-gradient(145deg, var(--color-cream-300), var(--color-cream-400))",
        }}
        aria-checked={enabled}
        role="switch"
      >
        <span
          className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300"
          style={{ left: enabled ? "calc(100% - 1.25rem)" : "0.25rem" }}
        />
      </div>
    </button>
  );
}

// ================================================================
// PROFILE SECTION — wired to real API
// ================================================================

function ProfileSection() {
  const { user, setUser } = useAuth();

  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    businessName: user?.businessName ?? "",
    bankAccountName: user?.bankAccountName ?? "",
    bankAccountNumber: user?.bankAccountNumber ?? "",
    bankCode: user?.bankCode ?? "",
  });

  // Sync form when user loads
  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        businessName: user.businessName ?? "",
        bankAccountName: user.bankAccountName ?? "",
        bankAccountNumber: user.bankAccountNumber ?? "",
        bankCode: user.bankCode ?? "",
      });
    }
  }, [user]);

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const initials =
    `${form.firstName.charAt(0)}${form.lastName.charAt(0)}`.toUpperCase() ||
    "U";

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await authApi.updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        businessName: form.businessName || undefined,
        bankAccountName: form.bankAccountName || undefined,
        bankAccountNumber: form.bankAccountNumber || undefined,
        bankCode: form.bankCode || undefined,
      });
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save changes";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Avatar card */}
      <div className="clay-card flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0"
          style={{
            background:
              "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-700))",
            boxShadow:
              "5px 5px 14px rgba(23,29,9,0.28), -2px -2px 8px rgba(114,143,50,0.20)",
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-olive-900">Profile Photo</p>
          <p className="text-xs text-olive-400 mt-0.5 mb-2">
            JPG, PNG or GIF · Max 5MB
          </p>
          <button className="clay-btn-ghost px-4 py-2 text-xs gap-1.5">
            <Camera size={13} />
            Upload Photo
          </button>
        </div>
      </div>

      {/* Personal info */}
      <div className="clay-card space-y-4">
        <SectionTitle
          icon={User}
          title="Personal Information"
          subtitle="Update your name and contact details"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            label="First Name"
            icon={User}
            value={form.firstName}
            onChange={(v) => setForm({ ...form, firstName: v })}
            placeholder="First name"
          />
          <FormField
            label="Last Name"
            icon={User}
            value={form.lastName}
            onChange={(v) => setForm({ ...form, lastName: v })}
            placeholder="Last name"
          />
          <FormField
            label="Email Address"
            icon={Mail}
            type="email"
            value={form.email}
            onChange={() => {}}
            placeholder="you@example.com"
            disabled
          />
          <FormField
            label="Phone Number"
            icon={Phone}
            type="tel"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
            placeholder="+234 800 000 0000"
          />
          <div className="sm:col-span-2">
            <FormField
              label="Business Name (optional)"
              icon={MapPin}
              value={form.businessName}
              onChange={(v) => setForm({ ...form, businessName: v })}
              placeholder="Your business or store name"
            />
          </div>
        </div>
      </div>

      {/* Bank details */}
      <div className="clay-card space-y-4">
        <SectionTitle
          icon={CreditCard}
          title="Bank Account Details"
          subtitle="Required for receiving seller payouts"
        />
        <div className="clay-inset p-3 flex items-start gap-2">
          <Info size={14} className="text-olive-500 mt-0.5 shrink-0" />
          <p className="text-xs text-olive-600">
            These details are used to transfer your seller payouts after an
            order is completed and escrow is released.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            label="Account Name"
            icon={User}
            value={form.bankAccountName}
            onChange={(v) => setForm({ ...form, bankAccountName: v })}
            placeholder="Name on bank account"
          />
          <FormField
            label="Account Number"
            icon={CreditCard}
            value={form.bankAccountNumber}
            onChange={(v) => setForm({ ...form, bankAccountNumber: v })}
            placeholder="10-digit account number"
          />
          <div className="sm:col-span-2">
            <FormField
              label="Bank Code"
              icon={CreditCard}
              value={form.bankCode}
              onChange={(v) => setForm({ ...form, bankCode: v })}
              placeholder="e.g. 058 for GTBank, 011 for First Bank"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {saveError}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="clay-btn w-full py-3.5 gap-2 disabled:opacity-70"
      >
        {saving ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving...
          </>
        ) : saved ? (
          <>
            <CheckCircle size={16} />
            Changes Saved!
          </>
        ) : (
          <>
            <Save size={16} />
            Save Changes
          </>
        )}
      </button>
    </div>
  );
}

// ================================================================
// NOTIFICATIONS SECTION
// ================================================================

function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    orderUpdates: true,
    paymentAlerts: true,
    shipmentTracking: true,
    disputeAlerts: true,
    marketingEmails: false,
    smsAlerts: true,
    pushNotifications: true,
    weeklyDigest: false,
  });

  const toggle = (key: keyof typeof prefs) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const groups = [
    {
      label: "Transaction Alerts",
      icon: CreditCard,
      items: [
        {
          key: "orderUpdates" as const,
          label: "Order Updates",
          desc: "Status changes on your orders",
        },
        {
          key: "paymentAlerts" as const,
          label: "Payment Alerts",
          desc: "Escrow deposits, releases & confirmations",
        },
        {
          key: "shipmentTracking" as const,
          label: "Shipment Tracking",
          desc: "Carrier updates & delivery confirmations",
        },
        {
          key: "disputeAlerts" as const,
          label: "Dispute Alerts",
          desc: "New messages & dispute resolutions",
        },
      ],
    },
    {
      label: "Communication",
      icon: Bell,
      items: [
        {
          key: "smsAlerts" as const,
          label: "SMS Alerts",
          desc: "Critical notifications via SMS",
        },
        {
          key: "pushNotifications" as const,
          label: "Push Notifications",
          desc: "Browser & app push alerts",
        },
        {
          key: "weeklyDigest" as const,
          label: "Weekly Digest",
          desc: "Summary of your weekly activity",
        },
        {
          key: "marketingEmails" as const,
          label: "Marketing Emails",
          desc: "Product updates, tips & promotions",
        },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label} className="clay-card space-y-1">
          <SectionTitle icon={group.icon} title={group.label} />
          <div className="space-y-1 mt-3">
            {group.items.map((item) => (
              <ToggleRow
                key={item.key}
                label={item.label}
                description={item.desc}
                enabled={prefs[item.key]}
                onToggle={() => toggle(item.key)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ================================================================
// SECURITY SECTION
// ================================================================

function SecuritySection() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const { user } = useAuth();

  const sessions = [
    {
      device: "Chrome · MacBook Pro",
      location: "Lagos, Nigeria",
      time: "Active now",
      current: true,
    },
    {
      device: "Safari · iPhone 15",
      location: "Lagos, Nigeria",
      time: "2 hours ago",
      current: false,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="clay-card space-y-4">
        <SectionTitle
          icon={Lock}
          title="Change Password"
          subtitle="Use a strong, unique password"
        />
        <div className="space-y-3">
          <PasswordField
            label="Current Password"
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
            placeholder="Enter current password"
          />
          <PasswordField
            label="New Password"
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
            placeholder="At least 8 characters"
          />
          <PasswordField
            label="Confirm New Password"
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            placeholder="Repeat new password"
          />
        </div>
        <div className="clay-inset p-3 flex items-start gap-2">
          <Info size={14} className="text-olive-500 mt-0.5 shrink-0" />
          <p className="text-xs text-olive-600">
            Use 8+ characters with uppercase, lowercase, numbers and symbols.
          </p>
        </div>
        <button className="clay-btn w-full py-3.5 gap-2">
          <KeyRound size={16} />
          Update Password
        </button>
      </div>

      <div className="clay-card space-y-3">
        <SectionTitle
          icon={Smartphone}
          title="Two-Factor Authentication"
          subtitle="Add an extra layer of security"
        />
        <ToggleRow
          label="Enable 2FA"
          description="Require a verification code on every login"
          enabled={twoFA}
          onToggle={() => setTwoFA((v) => !v)}
          highlight
        />
        {twoFA && user?.phone && (
          <div className="clay-inset p-3 flex items-start gap-2">
            <CheckCircle size={14} className="text-olive-500 mt-0.5 shrink-0" />
            <p className="text-xs text-olive-600">
              Codes will be sent to <strong>{user.phone}</strong> via SMS.
            </p>
          </div>
        )}
      </div>

      <div className="clay-card space-y-3">
        <SectionTitle
          icon={Shield}
          title="Active Sessions"
          subtitle="Devices currently signed in"
        />
        <div className="space-y-2">
          {sessions.map((session, i) => (
            <div key={i} className="settings-row">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: session.current
                      ? "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-600))"
                      : "linear-gradient(145deg, var(--color-cream-300), var(--color-cream-400))",
                  }}
                >
                  <Smartphone
                    size={15}
                    className={
                      session.current ? "text-white" : "text-olive-500"
                    }
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-olive-800">
                    {session.device}
                  </p>
                  <p className="text-xs text-olive-400">
                    {session.location} · {session.time}
                  </p>
                </div>
              </div>
              {session.current ? (
                <span className="clay-badge bg-olive-100 text-olive-700 shrink-0">
                  Current
                </span>
              ) : (
                <button className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50">
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ================================================================
// PREFERENCES SECTION
// ================================================================

function PreferencesSection() {
  const [darkMode, setDarkMode] = useState(false);
  const [currency, setCurrency] = useState("NGN");
  const [language, setLanguage] = useState("en");

  const currencies = ["NGN", "USD", "GBP", "EUR", "GHS", "KES"];
  const languages = [
    { value: "en", label: "English" },
    { value: "yo", label: "Yoruba" },
    { value: "ig", label: "Igbo" },
    { value: "ha", label: "Hausa" },
    { value: "fr", label: "French" },
  ];

  return (
    <div className="space-y-4">
      <div className="clay-card space-y-3">
        <SectionTitle
          icon={Sun}
          title="Appearance"
          subtitle="Customise your visual experience"
        />
        <ToggleRow
          label="Dark Mode"
          description="Switch to a darker interface theme"
          enabled={darkMode}
          onToggle={() => setDarkMode((v) => !v)}
          iconOn={Moon}
          iconOff={Sun}
        />
      </div>

      <div className="clay-card space-y-4">
        <SectionTitle
          icon={Globe}
          title="Localisation"
          subtitle="Language & currency preferences"
        />
        <div>
          <label className="block text-xs font-bold text-olive-600 mb-2 uppercase tracking-wide">
            Display Currency
          </label>
          <div className="flex flex-wrap gap-2">
            {currencies.map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={[
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200",
                  currency === c
                    ? "clay-btn"
                    : "clay-inset text-olive-600 hover:scale-105",
                ].join(" ")}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-olive-600 mb-2 uppercase tracking-wide">
            Language
          </label>
          <div className="clay-inset p-1 rounded-xl">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-transparent text-sm text-olive-800 outline-none px-3 py-2 cursor-pointer"
            >
              {languages.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="clay-btn w-full py-3.5 gap-2">
          <Save size={16} />
          Save Preferences
        </button>
      </div>

      <div className="clay-card space-y-3">
        <SectionTitle
          icon={CreditCard}
          title="Escrow Preferences"
          subtitle="Default behaviour for transactions"
        />
        <ToggleRow
          label="Auto-release on Delivery"
          description="Automatically release funds when shipment is marked delivered"
          enabled={true}
          onToggle={() => {}}
        />
        <ToggleRow
          label="Dispute Notifications"
          description="Get notified immediately when a dispute is raised"
          enabled={true}
          onToggle={() => {}}
        />
        <ToggleRow
          label="Require PIN for Payments"
          description="Confirm large payments with a 4-digit PIN"
          enabled={false}
          onToggle={() => {}}
        />
      </div>
    </div>
  );
}

// ================================================================
// DANGER SECTION
// ================================================================

function DangerSection() {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const canDelete = inputVal === "DELETE";

  return (
    <div className="space-y-4">
      <div className="clay-card">
        <SectionTitle
          icon={Info}
          title="Export Your Data"
          subtitle="Download a copy of your account data"
        />
        <p className="text-xs text-olive-500 mt-3 mb-4">
          Request a full export of your orders, payments, shipments and account
          information. Exports are delivered to your registered email within 24
          hours.
        </p>
        <button className="clay-btn-ghost px-5 py-2.5 text-sm gap-2">
          <Globe size={15} />
          Request Data Export
        </button>
      </div>

      <div
        className="clay-card"
        style={{ borderColor: "rgba(251,191,36,0.35)" }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(145deg, #fbbf24, #d97706)" }}
          >
            <AlertTriangle size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-olive-900">
              Deactivate Account
            </p>
            <p className="text-xs text-olive-500 mt-1 mb-3">
              Temporarily disable your account. You can reactivate at any time
              by logging back in.
            </p>
            <button
              className="clay-btn-ghost px-4 py-2 text-xs gap-1.5"
              style={{ color: "#d97706", borderColor: "rgba(251,191,36,0.35)" }}
            >
              <EyeOff size={13} />
              Deactivate Account
            </button>
          </div>
        </div>
      </div>

      <div
        className="clay-card"
        style={{ borderColor: "rgba(220,38,38,0.30)" }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(145deg, #f87171, #dc2626)" }}
          >
            <Trash2 size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-700">Delete Account</p>
            <p className="text-xs text-olive-500 mt-1">
              Permanently delete your EaseWaybill account and all associated
              data. This action <strong>cannot be undone</strong>.
            </p>
          </div>
        </div>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="clay-btn-ghost px-4 py-2.5 text-sm gap-1.5 w-full"
            style={{ color: "#dc2626", borderColor: "rgba(220,38,38,0.30)" }}
          >
            <Trash2 size={15} />I want to delete my account
          </button>
        ) : (
          <div className="space-y-3">
            <div className="clay-inset p-3 flex items-start gap-2">
              <AlertTriangle
                size={14}
                className="text-red-500 shrink-0 mt-0.5"
              />
              <p className="text-xs text-red-700 font-medium">
                Type{" "}
                <strong className="font-mono bg-red-50 px-1 rounded">
                  DELETE
                </strong>{" "}
                to confirm permanent deletion.
              </p>
            </div>
            <input
              type="text"
              className="clay-input"
              placeholder='Type "DELETE" to confirm'
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmDelete(false);
                  setInputVal("");
                }}
                className="clay-btn-ghost flex-1 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={!canDelete}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: canDelete
                    ? "linear-gradient(145deg, #f87171, #dc2626)"
                    : "linear-gradient(145deg, #fca5a5, #f87171)",
                }}
              >
                Delete Forever
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================================
// DESKTOP SIDEBAR PROFILE — dynamic
// ================================================================

function DesktopSidebarProfile() {
  const { user } = useAuth();
  const firstName = user?.firstName ?? "";
  const lastName = user?.lastName ?? "";
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  const fullName = `${firstName} ${lastName}`.trim() || "User";

  return (
    <div className="clay-card-dark text-white mb-2">
      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-lg font-bold text-white"
          style={{
            background:
              "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-700))",
            boxShadow:
              "4px 4px 12px rgba(23,29,9,0.35), -2px -2px 6px rgba(114,143,50,0.20)",
          }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-white truncate">{fullName}</p>
          <p className="text-xs text-olive-200 truncate">{user?.email ?? ""}</p>
          <span
            className="clay-badge mt-1.5 text-[10px]"
            style={{ background: "rgba(162,191,114,0.20)", color: "#d4e8a0" }}
          >
            {user?.role ?? "SELLER"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// MOBILE PROFILE HEADER — dynamic
// ================================================================

function MobileProfileHeader() {
  const { user } = useAuth();
  const firstName = user?.firstName ?? "";
  const lastName = user?.lastName ?? "";
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  const fullName = `${firstName} ${lastName}`.trim() || "User";

  return (
    <div className="clay-card-dark text-white">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
            style={{
              background:
                "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-700))",
              boxShadow:
                "4px 4px 12px rgba(23,29,9,0.30), -2px -2px 6px rgba(114,143,50,0.18)",
            }}
          >
            {initials}
          </div>
          <button
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-600))",
            }}
            aria-label="Change avatar"
          >
            <Camera size={12} className="text-white" />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-lg truncate">{fullName}</p>
          <p className="text-xs text-olive-200 truncate">{user?.email ?? ""}</p>
          <span
            className="clay-badge text-[10px] mt-1.5 inline-block"
            style={{ background: "rgba(162,191,114,0.20)", color: "#d4e8a0" }}
          >
            {user?.role ?? "SELLER"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// DESKTOP CONTENT ROUTER
// ================================================================

function DesktopTabContent({ activeTab }: { activeTab: SettingsTab }) {
  const currentTab = tabs.find((t) => t.id === activeTab)!;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-olive-900">
          {currentTab.label}
        </h2>
        <p className="text-sm text-olive-500 mt-0.5">
          {currentTab.description}
        </p>
      </div>
      {activeTab === "profile" && <ProfileSection />}
      {activeTab === "notifications" && <NotificationsSection />}
      {activeTab === "security" && <SecuritySection />}
      {activeTab === "preferences" && <PreferencesSection />}
      {activeTab === "danger" && <DangerSection />}
    </div>
  );
}

// ================================================================
// MOBILE CONTENT
// ================================================================

function MobileTabsContent() {
  const { logout } = useAuth();
  return (
    <div className="space-y-5">
      <ProfileSection />
      <NotificationsSection />
      <SecuritySection />
      <PreferencesSection />
      <DangerSection />
      <button
        onClick={() => logout()}
        className="w-full clay-btn-ghost py-3.5 gap-2"
        style={{ color: "#dc2626", borderColor: "rgba(220,38,38,0.25)" }}
      >
        <LogOut size={18} />
        Log out
      </button>
    </div>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { logout } = useAuth();

  return (
    <>
      {/* MOBILE */}
      <div className="lg:hidden min-h-screen">
        <MobilePageHeader title="Settings" showBack={false} />
        <div className="px-4 pt-4 pb-8 space-y-5">
          <MobileProfileHeader />
          <MobileTabsContent />
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:flex gap-6 p-6 min-h-screen">
        <aside className="w-72 shrink-0 space-y-2">
          <DesktopSidebarProfile />
          <nav className="clay-card !p-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "w-full text-left transition-all duration-200",
                  activeTab === tab.id
                    ? "clay-nav-item-active"
                    : "clay-nav-item",
                ].join(" ")}
              >
                <tab.icon
                  size={17}
                  className={
                    activeTab === tab.id
                      ? "text-white"
                      : tab.id === "danger"
                        ? "text-red-500"
                        : "text-olive-500"
                  }
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={
                      tab.id === "danger" && activeTab !== tab.id
                        ? "text-red-600 font-semibold text-sm"
                        : "text-sm"
                    }
                  >
                    {tab.label}
                  </p>
                </div>
                <ChevronRight
                  size={14}
                  className={
                    activeTab === tab.id ? "text-white/60" : "text-olive-300"
                  }
                />
              </button>
            ))}
          </nav>
          <button
            onClick={() => logout()}
            className="w-full clay-btn-ghost !text-red-600 !border-red-200 py-3 gap-2"
          >
            <LogOut size={16} />
            Log out
          </button>
        </aside>

        <main className="flex-1 min-w-0">
          <DesktopTabContent activeTab={activeTab} />
        </main>
      </div>
    </>
  );
}
