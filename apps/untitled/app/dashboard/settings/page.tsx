"use client";

import { cn } from "@/lib/utils";
import { Download, Folder, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const settingSections = [
    {
      title: "Storage",
      settings: [
        {
          id: "storage-usage",
          icon: <Folder className="h-5 w-5" />,
          title: "Storage Usage",
          description: "2.4 GB of 15 GB used",
          type: "info",
          value: "16% used",
        },
        {
          id: "export-data",
          icon: <Download className="h-5 w-5" />,
          title: "Export Data",
          description: "Download all your disposed items",
          type: "button",
          action: "Export",
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
                          {setting.type === "button" && (
                            <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                              {setting.action}
                            </button>
                          )}
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
