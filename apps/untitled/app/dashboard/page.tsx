"use client";

import { ArrowUpDown, Upload } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<
    {
      name: string;
      progress: number;
      size: string;
    }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);

  const files = [
    {
      id: "1",
      name: "old_resume.pdf",
      type: "PDF",
      size: "2.1MB",
      lastModified: "Mar. 15 2024",
    },
    {
      id: "2",
      name: "random_notes.txt",
      type: "TXT",
      size: "45KB",
      lastModified: "Jun. 08 2024",
    },
    {
      id: "3",
      name: "maybe_useful.zip",
      type: "ZIP",
      size: "156MB",
      lastModified: "Jan. 22 2024",
    },
    {
      id: "4",
      name: "forgotten_photos",
      type: "folder",
      size: "",
      lastModified: "Dec. 03 2023",
    },
    {
      id: "5",
      name: "old_presentations.pptx",
      type: "PPTX",
      size: "89MB",
      lastModified: "Nov. 14 2023",
    },
    {
      id: "6",
      name: "temp_download.dmg",
      type: "DMG",
      size: "1.2GB",
      lastModified: "Aug. 29 2024",
    },
    {
      id: "7",
      name: "unused_assets",
      type: "folder",
      size: "",
      lastModified: "May. 17 2024",
    },
    {
      id: "8",
      name: "Town hall",
      type: "PAGE",
      size: "5.6GB",
      lastModified: "Sep. 26 2025",
    },
  ];

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId],
    );
  };

  const toggleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map((file) => file.id));
    }
  };

  const isAllSelected = selectedFiles.length === files.length;
  const isIndeterminate =
    selectedFiles.length > 0 && selectedFiles.length < files.length;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const simulateUpload = (file: File) => {
    return new Promise<void>((resolve) => {
      const fileInfo = {
        name: file.name,
        progress: 0,
        size: formatFileSize(file.size),
      };

      setUploadingFiles((prev) => [...prev, fileInfo]);

      const interval = setInterval(() => {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.name === file.name
              ? {
                  ...f,
                  progress: Math.min(f.progress + Math.random() * 15 + 5, 100),
                }
              : f,
          ),
        );
      }, 200);

      // Complete upload after 2-4 seconds
      const uploadTime = 2000 + Math.random() * 2000;
      setTimeout(() => {
        clearInterval(interval);
        setUploadingFiles((prev) =>
          prev.map((f) => (f.name === file.name ? { ...f, progress: 100 } : f)),
        );

        // Remove from uploading list after showing completion
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.name !== file.name));
          resolve();
        }, 1000);
      }, uploadTime);
    });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setIsUploading(true);

      // Simulate uploading each file
      const uploadPromises = droppedFiles.map((file) => simulateUpload(file));

      try {
        await Promise.all(uploadPromises);
        // Show success message briefly
        setTimeout(() => {
          alert(`${droppedFiles.length} file(s) disposed successfully!`);
        }, 500);
      } catch (error) {
        console.error("Upload failed:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

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
      case "MP3":
        return "🎵";
      case "ZIP":
        return "🗜️";
      case "PAGE":
        return "📄";
      default:
        return "📄";
    }
  };

  return (
    <>
      {/* File List */}
      <div
        className="relative flex-1 overflow-auto py-3 pr-6 pl-3"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="overflow-x-auto py-3">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100 text-left text-sm text-gray-500">
                <th className="w-12 pb-3 pl-3 font-medium">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={toggleSelectAll}
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
                <th className="pb-3 font-medium">Last modified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {files.map((file) => (
                <tr key={file.id} className="group hover:bg-gray-50">
                  <td className="py-4 pl-3">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getFileIcon(file.type)}</div>
                      <span className="text-sm font-medium text-gray-900">
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4">
                    {file.type !== "folder" && (
                      <span
                        className={
                          "inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
                        }
                      >
                        {file.type}
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-sm text-gray-500">{file.size}</td>
                  <td className="py-4 text-sm text-gray-500">
                    {file.lastModified}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Upload Progress */}
        {uploadingFiles.length > 0 && (
          <div className="absolute right-4 bottom-4 w-80 space-y-2">
            {uploadingFiles.map((file) => (
              <div
                key={file.name}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Upload className="h-4 w-4 text-green-500" />
                    <span className="truncate text-sm font-medium text-gray-900">
                      {file.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{file.size}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Disposing...</span>
                    <span>{Math.round(file.progress)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-green-500 transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Drag Overlay */}
        {isDragOver && (
          <div className="bg-opacity-90 absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-green-300 bg-green-50">
            <div className="text-center">
              <Upload className="mx-auto mb-4 h-12 w-12 text-green-500" />
              <h3 className="mb-2 text-lg font-medium text-green-700">
                Drop files to dispose
              </h3>
              <p className="text-sm text-green-600">
                Release to add files to your disposal space
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
