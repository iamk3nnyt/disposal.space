import {
  Archive,
  ArrowRight,
  ArrowUpDown,
  ChevronRight,
  File,
  Folder,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Shield,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const features = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Hidden Storage",
      description: "Store things you don't want cluttering your daily view",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Future Recovery",
      description: "Restore items when you unexpectedly need them later",
    },
    {
      icon: <Upload className="h-6 w-6" />,
      title: "Invisible Archive",
      description: "Keep things that exist around you but out of sight",
    },
  ];

  const mockFiles = [
    { name: "Old Projects", type: "folder", size: "", date: "Sep. 26 2025" },
    {
      name: "random_thoughts.docx",
      type: "DOCX",
      size: "6.5KB",
      date: "Sep. 26 2025",
    },
    {
      name: "screenshot_mess.png",
      type: "PNG",
      size: "5.5GB",
      date: "Sep. 26 2025",
    },
    {
      name: "broken_script.py",
      type: "CODE",
      size: "7.5MB",
      date: "Sep. 26 2025",
    },
    {
      name: "old_finances.xls",
      type: "XLS",
      size: "7.0GB",
      date: "Sep. 26 2025",
    },
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case "folder":
        return "📁";
      case "DOCX":
        return "📄";
      case "PNG":
        return "🖼️";
      case "CODE":
        return "💾";
      case "XLS":
        return "📊";
      default:
        return "📄";
    }
  };

  return (
    <div className="flex min-h-screen items-center overflow-x-hidden bg-white">
      {/* Hero Section */}
      <div className="w-full px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-12 xl:grid-cols-2">
            {/* Left Column - Hero Content */}
            <div className="text-gray-900">
              <h1 className="mb-6 text-5xl leading-tight font-bold xl:text-6xl">
                Your Digital
                <br />
                Disposal{" "}
                <Archive className="mb-2 inline h-12 w-12 text-gray-700" />{" "}
                Space
              </h1>
              <p className="mb-8 text-xl leading-relaxed text-gray-600">
                Store things you never want to see cluttering your life, but
                might need someday. A hidden cloud space for digital disposal
                and unexpected recovery when the time comes.
              </p>

              {/* Features List */}
              <div className="mb-8 space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-4 lg:flex-row">
                <Link
                  href="/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center rounded-xl bg-gray-900 px-8 py-4 font-medium text-white transition-colors hover:bg-gray-800"
                >
                  Start Disposing
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/download"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-8 py-4 font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
                >
                  Download App
                </Link>
              </div>
            </div>

            {/* Right Column - Dashboard Preview */}
            <div className="relative w-full max-w-5xl">
              {/* Dashboard Preview */}
              <div className="h-[600px] w-[1200px] overflow-hidden rounded-2xl border border-gray-200 bg-white">
                {/* Mock Sidebar and Content */}
                <div className="flex h-full">
                  <div className="flex w-64 flex-col border-r border-gray-200 bg-gray-50">
                    {/* Sidebar Header */}
                    <div className="flex h-16 items-center border-b border-gray-200 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
                          <span className="text-sm font-medium text-white">
                            DS
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            Disposal Space
                          </div>
                          <div className="text-xs text-gray-500">
                            Hidden Archive
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="space-y-1 px-4 py-3">
                      <button className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-100">
                        <Upload className="h-4 w-4" />
                        <span>Upload</span>
                      </button>
                      <button className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-100">
                        <Search className="h-4 w-4" />
                        <span>Find</span>
                      </button>
                      <button className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-100">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </button>
                    </div>

                    {/* File Tree */}
                    <div className="px-4 py-2">
                      <div className="mb-3 text-xs font-medium tracking-wider text-gray-400 uppercase">
                        DISPOSED
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex cursor-pointer items-center space-x-2 rounded-md bg-gray-200 px-2 py-1 text-sm text-gray-900">
                          <div className="flex flex-1 items-center space-x-2 truncate">
                            <Folder className="h-4 w-4 shrink-0" />
                            <span className="truncate whitespace-nowrap">
                              Old Projects
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button className="rounded p-0.5 hover:bg-gray-200">
                              <MoreHorizontal className="h-3 w-3" />
                            </button>
                            <button className="rounded p-0.5 hover:bg-gray-200">
                              <Plus className="h-3 w-3" />
                            </button>
                            <button className="rounded p-0.5 hover:bg-gray-200">
                              <ChevronRight className="h-3 w-3 transition-transform" />
                            </button>
                          </div>
                        </div>
                        <div className="flex cursor-pointer items-center space-x-2 rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-100">
                          <File className="h-4 w-4 shrink-0" />
                          <span className="truncate whitespace-nowrap">
                            Random Docs
                          </span>
                        </div>
                        <div className="flex cursor-pointer items-center space-x-2 rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-100">
                          <div className="flex flex-1 items-center space-x-2 truncate">
                            <Folder className="h-4 w-4 shrink-0" />
                            <span className="truncate whitespace-nowrap">
                              Maybe Later
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button className="rounded p-0.5 hover:bg-gray-200">
                              <MoreHorizontal className="h-3 w-3" />
                            </button>
                            <button className="rounded p-0.5 hover:bg-gray-200">
                              <Plus className="h-3 w-3" />
                            </button>
                            <button className="rounded p-0.5 hover:bg-gray-200">
                              <ChevronRight className="h-3 w-3 rotate-90 transition-transform" />
                            </button>
                          </div>
                        </div>
                        {/* Nested items */}
                        <div className="mt-0.5 ml-6 space-y-0.5">
                          <div className="flex cursor-pointer items-center space-x-2 rounded-md px-2 py-0.5 text-sm text-gray-600 hover:bg-gray-100">
                            <File className="h-3 w-3" />
                            <span>old_resume.pdf</span>
                          </div>
                          <div className="flex cursor-pointer items-center space-x-2 rounded-md px-2 py-0.5 text-sm text-gray-600 hover:bg-gray-100">
                            <File className="h-3 w-3" />
                            <span>random_notes.txt</span>
                          </div>
                          <div className="flex cursor-pointer items-center space-x-2 rounded-md px-2 py-0.5 text-sm text-gray-600 hover:bg-gray-100">
                            <File className="h-3 w-3" />
                            <span>maybe_useful.zip</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Usage Details */}
                    <div className="mt-auto border-t border-gray-200 p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Storage Used</span>
                          <span>2.4 GB of 15 GB</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-200">
                          <div className="h-1.5 w-1/6 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Items Disposed</span>
                          <span>247</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mock Main Content Area */}
                  <div className="flex h-full flex-1 flex-col">
                    {/* Mock Content Header */}
                    <div className="flex h-16 w-full items-center justify-between border-b border-gray-200 px-6">
                      <div className="flex items-center">
                        <h2 className="text-base font-medium text-gray-900">
                          Maybe Later
                        </h2>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                          Settings
                        </button>
                        <button className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800">
                          Upload
                        </button>
                      </div>
                    </div>

                    {/* Mock File List */}
                    <div className="flex-1 overflow-auto py-3 pr-6 pl-3">
                      <div className="overflow-x-auto py-3">
                        <table className="w-full min-w-[800px]">
                          <thead>
                            <tr className="border-b border-gray-100 text-left text-sm text-gray-500">
                              <th className="w-12 pb-3 pl-3 font-medium">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                              </th>
                              <th className="pb-3 font-medium">
                                <div className="flex items-center space-x-2">
                                  <span>Name</span>
                                  <ArrowUpDown className="h-4 w-4" />
                                </div>
                              </th>
                              <th className="pb-3 font-medium">Type</th>
                              <th className="pb-3 font-medium">Size</th>
                              <th className="pb-3 font-medium">
                                Last modified
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {mockFiles.map((file, index) => (
                              <tr
                                key={index}
                                className="group hover:bg-gray-50"
                              >
                                <td className="py-4 pl-3">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                  />
                                </td>
                                <td className="py-4">
                                  <div className="flex items-center space-x-3">
                                    <div className="text-2xl">
                                      {getFileIcon(file.type)}
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                      {file.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4">
                                  {file.type !== "folder" && (
                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                                      {file.type}
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 text-sm text-gray-500">
                                  {file.size}
                                </td>
                                <td className="py-4 text-sm text-gray-500">
                                  {file.date}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
