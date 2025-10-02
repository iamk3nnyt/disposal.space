"use client";

import { useUserStorage } from "@/lib/hooks/use-user-storage";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import {
  BarChart3,
  CreditCard,
  Folder,
  Key,
  Mail,
  Shield,
  Trash2,
} from "lucide-react";
import { useState } from "react";

interface SettingItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  type: "info" | "button" | "danger-button" | "password-form";
  value?: string;
  action?: string;
  href?: string;
}

interface SettingSection {
  title: string;
  settings: SettingItem[];
}

// Password form component
function SetPasswordForm() {
  const { user } = useUser();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  if (!user) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setMessage("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      await user.updatePassword({ newPassword });
      setMessage("Password set successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          New Password
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
          placeholder="Enter new password"
          minLength={8}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
          placeholder="Confirm new password"
          minLength={8}
          required
        />
      </div>
      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={isSubmitting || !newPassword || !confirmPassword}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSubmitting ? "Setting Password..." : "Set Password"}
        </button>
      </div>
      {message && (
        <p
          className={cn(
            "text-sm",
            message.includes("successfully")
              ? "text-green-600"
              : "text-red-600",
          )}
        >
          {message}
        </p>
      )}
    </form>
  );
}

export default function SettingsPage() {
  const { data: storageData, isLoading: isLoadingStorage } = useUserStorage();
  const { user, isLoaded: isUserLoaded } = useUser();

  // Helper function to check if user has connected Google account
  const isGoogleConnected = () => {
    if (!user?.externalAccounts) return false;

    return user.externalAccounts.some(
      (account) => account.provider === "google",
    );
  };

  // Helper function to check if user is Google-only (no password)
  const isGoogleOnlyUser = () => {
    if (!user) return false;

    const hasPassword = user.passwordEnabled;
    const googleOnly =
      user.externalAccounts?.length === 1 &&
      user.externalAccounts[0]?.provider === "google";

    return !hasPassword && googleOnly;
  };

  const settingSections: SettingSection[] = [
    {
      title: "Security",
      settings: [
        {
          id: "google-connection",
          icon: <Mail className="h-5 w-5" />,
          title: "Google Account",
          description: !isUserLoaded
            ? "Checking connection status..."
            : isGoogleConnected()
              ? "Connected with Google account"
              : "Not connected with Google",
          type: "info",
          value: !isUserLoaded
            ? "..."
            : isGoogleConnected()
              ? "Connected"
              : "Not connected",
        },
        ...(isGoogleOnlyUser()
          ? [
              {
                id: "set-password",
                icon: <Key className="h-5 w-5" />,
                title: "Set Password",
                description:
                  "Add a password to your account for additional security. This allows you to sign in with either Google or your password.",
                type: "password-form" as const,
              },
            ]
          : []),
        ...(!isUserLoaded
          ? []
          : user?.passwordEnabled
            ? [
                {
                  id: "password-status",
                  icon: <Shield className="h-5 w-5" />,
                  title: "Password Security",
                  description: "Your account is secured with a password",
                  type: "info" as const,
                  value: "Password enabled",
                },
              ]
            : []),
      ],
    },
    {
      title: "Storage",
      settings: [
        {
          id: "storage-usage",
          icon: <Folder className="h-5 w-5" />,
          title: "Storage Usage",
          description: isLoadingStorage
            ? "Loading storage information..."
            : `${storageData?.user.storageUsedFormatted || "0 Bytes"} of ${storageData?.user.storageLimitFormatted || "15 GB"} used`,
          type: "info",
          value: isLoadingStorage
            ? "Loading..."
            : `${storageData?.user.storageUsedPercentage || 0}% used`,
        },
        {
          id: "storage-details",
          icon: <BarChart3 className="h-5 w-5" />,
          title: "Storage Details",
          description: isLoadingStorage
            ? "Loading item statistics..."
            : `${storageData?.stats.totalItems || 0} total items (${storageData?.stats.fileCount || 0} files, ${storageData?.stats.folderCount || 0} folders)`,
          type: "info",
          value: isLoadingStorage
            ? "..."
            : `${storageData?.user.storageAvailableFormatted || "15 GB"} available`,
        },
      ],
    },
    {
      title: "Billing & Subscription",
      settings: [
        {
          id: "billing",
          icon: <CreditCard className="h-5 w-5" />,
          title: "Manage Billing",
          description:
            "View invoices, update payment methods, and manage your subscription",
          type: "button",
          action: "Open Billing Portal",
          href:
            process.env.NEXT_PUBLIC_STRIPE_BILLING_URL ||
            "https://billing.stripe.com/p/login/00w6oI7TX5Pf4UWc2X4gg00",
        },
      ],
    },
    {
      title: "Danger Zone",
      settings: [
        {
          id: "delete-account",
          icon: <Trash2 className="h-5 w-5" />,
          title: "Delete Account",
          description:
            "Permanently delete your account and all disposed items. This action cannot be undone.",
          type: "danger-button",
          action: "Delete Account",
        },
      ],
    },
  ];

  return (
    <>
      {/* Settings Content */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-4xl min-w-[800px]">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="mt-2 text-gray-600">
              Manage your account, monitor storage usage, and configure
              preferences
            </p>
          </div>

          <div className="space-y-8">
            {settingSections.map((section) => (
              <div key={section.title}>
                <h2
                  className={cn(
                    "mb-4 text-lg font-medium",
                    section.title === "Danger Zone"
                      ? "text-red-600"
                      : "text-gray-900",
                  )}
                >
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.settings.map((setting) => (
                    <div
                      key={setting.id}
                      className={cn(
                        "rounded-lg border p-4",
                        setting.type === "danger-button"
                          ? "border-red-200 bg-red-50"
                          : "border-gray-200",
                        setting.type === "password-form"
                          ? "block"
                          : "flex items-center justify-between",
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-start space-x-3",
                          setting.type === "password-form" ? "mb-0" : "",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg",
                            setting.type === "danger-button"
                              ? "bg-red-100 text-red-600"
                              : "bg-gray-100 text-gray-600",
                          )}
                        >
                          {setting.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {setting.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {setting.description}
                          </p>
                          {setting.type === "password-form" && (
                            <SetPasswordForm />
                          )}
                        </div>
                      </div>
                      {setting.type !== "password-form" && (
                        <div className="flex items-center">
                          {setting.type === "info" && (
                            <span className="text-sm font-medium text-gray-900">
                              {setting.value}
                            </span>
                          )}
                          {setting.type === "button" &&
                            ((setting as SettingItem).href ? (
                              <a
                                href={(setting as SettingItem).href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                {setting.action}
                              </a>
                            ) : (
                              <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                                {setting.action}
                              </button>
                            ))}
                          {setting.type === "danger-button" && (
                            <button className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">
                              {setting.action}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
