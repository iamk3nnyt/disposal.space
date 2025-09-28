"use client";

import { useUserStorage } from "@/lib/hooks/use-user-storage";
import { cn } from "@/lib/utils";
import { BarChart3, CreditCard, Folder, Trash2 } from "lucide-react";

interface SettingItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  type: "info" | "button" | "danger-button";
  value?: string;
  action?: string;
  href?: string;
}

interface SettingSection {
  title: string;
  settings: SettingItem[];
}

export default function SettingsPage() {
  const { data: storageData, isLoading: isLoadingStorage } = useUserStorage();
  const settingSections: SettingSection[] = [
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
      {/* Main Content Area */}
      <div className="flex h-full flex-1 flex-col">
        {/* Settings Content */}
        <div className="flex-1 overflow-auto px-6 py-6">
          <div className="max-w-4xl min-w-[800px]">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="mt-2 text-gray-600">
                Manage your disposal space preferences and account settings.
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
                          "flex items-center justify-between rounded-lg border p-4",
                          setting.type === "danger-button"
                            ? "border-red-200 bg-red-50"
                            : "border-gray-200",
                        )}
                      >
                        <div className="flex items-start space-x-3">
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
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {setting.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {setting.description}
                            </p>
                          </div>
                        </div>
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
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
