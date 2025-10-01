/**
 * Comprehensive file icon utility supporting all file types from the AWS package
 * Uses emoji icons for consistent cross-platform display
 */

export function getFileIcon(type: string, filename?: string): string {
  // Handle folder type first
  if (type === "folder") {
    return "📁";
  }

  // Get file extension for additional context
  const extension = filename ? filename.split(".").pop()?.toLowerCase() : "";

  // Map file types to appropriate emoji icons
  switch (type.toLowerCase()) {
    // Documents
    case "pdf":
      return "📄";
    case "document":
    case "docx":
    case "doc":
      return "📝";
    case "spreadsheet":
    case "xlsx":
    case "xls":
    case "csv":
      return "📊";
    case "presentation":
    case "pptx":
    case "ppt":
      return "📊";
    case "rtf":
      return "📄";

    // Images
    case "image":
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "bmp":
    case "webp":
    case "svg":
    case "ico":
    case "tiff":
    case "tif":
    case "heic":
    case "heif":
    case "avif":
      return "🖼️";

    // Design Files
    case "design":
      if (extension === "psd") return "🎨";
      if (extension === "ai" || extension === "eps") return "🎨";
      if (extension === "sketch") return "🎨";
      if (extension === "fig") return "🎨";
      if (extension === "xd") return "🎨";
      return "🎨";

    // Video
    case "video":
    case "mp4":
    case "avi":
    case "mov":
    case "wmv":
    case "flv":
    case "webm":
    case "mkv":
    case "m4v":
    case "3gp":
    case "ogv":
      return "🎬";

    // Audio
    case "audio":
    case "mp3":
    case "wav":
    case "flac":
    case "aac":
    case "ogg":
    case "wma":
    case "m4a":
    case "opus":
      return "🎵";

    // Archives
    case "archive":
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
    case "bz2":
    case "xz":
      return "🗜️";

    // Code/Development
    case "code":
      if (extension === "js" || extension === "ts") return "🟨";
      if (extension === "py") return "🐍";
      if (extension === "java") return "☕";
      if (extension === "cpp" || extension === "c" || extension === "h")
        return "⚙️";
      if (extension === "php") return "🐘";
      if (extension === "rb") return "💎";
      if (extension === "go") return "🐹";
      if (extension === "rs") return "🦀";
      if (extension === "swift") return "🐦";
      if (extension === "kt") return "🎯";
      if (extension === "scala") return "🔴";
      return "💻";

    // Text Files
    case "text":
    case "txt":
    case "md":
    case "markdown":
      return "📝";

    // Web Files
    case "html":
    case "htm":
      return "🌐";
    case "css":
      return "🎨";
    case "json":
      return "📋";
    case "xml":
      return "📄";

    // Configuration Files
    case "yaml":
    case "yml":
    case "toml":
    case "ini":
    case "conf":
    case "cfg":
    case "env":
      return "⚙️";

    // Database
    case "database":
    case "db":
    case "sqlite":
    case "sqlite3":
    case "sql":
      return "🗄️";

    // Fonts
    case "font":
    case "ttf":
    case "otf":
    case "woff":
    case "woff2":
    case "eot":
      return "🔤";

    // 3D Models
    case "3d model":
    case "obj":
    case "fbx":
    case "dae":
    case "3ds":
    case "blend":
    case "dwg":
    case "dxf":
      return "🎲";

    // Executables
    case "executable":
    case "exe":
    case "msi":
    case "deb":
    case "rpm":
    case "apk":
    case "ipa":
      return "⚡";

    // Disk Images
    case "disk image":
    case "iso":
    case "dmg":
    case "img":
      return "💿";

    // Log Files
    case "log":
      return "📜";

    // Default fallback
    default:
      // Try to infer from extension if type categorization failed
      if (extension) {
        // Image extensions
        if (
          [
            "png",
            "jpg",
            "jpeg",
            "gif",
            "bmp",
            "webp",
            "svg",
            "ico",
            "tiff",
            "tif",
            "heic",
            "heif",
            "avif",
          ].includes(extension)
        ) {
          return "🖼️";
        }

        // Video extensions
        if (
          [
            "mp4",
            "avi",
            "mov",
            "wmv",
            "flv",
            "webm",
            "mkv",
            "m4v",
            "3gp",
            "ogv",
          ].includes(extension)
        ) {
          return "🎬";
        }

        // Audio extensions
        if (
          ["mp3", "wav", "flac", "aac", "ogg", "wma", "m4a", "opus"].includes(
            extension,
          )
        ) {
          return "🎵";
        }

        // Archive extensions
        if (
          ["zip", "rar", "7z", "tar", "gz", "bz2", "xz"].includes(extension)
        ) {
          return "🗜️";
        }

        // Code extensions
        if (
          [
            "js",
            "ts",
            "py",
            "java",
            "cpp",
            "c",
            "h",
            "php",
            "rb",
            "go",
            "rs",
            "swift",
            "kt",
            "scala",
          ].includes(extension)
        ) {
          return "💻";
        }

        // Document extensions
        if (["pdf", "doc", "docx", "rtf"].includes(extension)) {
          return "📄";
        }

        // Spreadsheet extensions
        if (["xls", "xlsx", "csv"].includes(extension)) {
          return "📊";
        }

        // Text extensions
        if (["txt", "md", "log"].includes(extension)) {
          return "📝";
        }
      }

      return "📄"; // Generic file icon
  }
}

/**
 * Get file icon with enhanced context
 * Uses both type category and filename for better icon selection
 */
export function getFileIconEnhanced(type: string, filename: string): string {
  return getFileIcon(type, filename);
}

/**
 * Get file type display name for UI
 * Maps internal type categories to user-friendly names
 */
export function getFileTypeDisplayName(type: string): string {
  const typeMap: Record<string, string> = {
    folder: "Folder",
    image: "Image",
    video: "Video",
    audio: "Audio",
    document: "Document",
    spreadsheet: "Spreadsheet",
    presentation: "Presentation",
    pdf: "PDF",
    archive: "Archive",
    code: "Code",
    text: "Text",
    font: "Font",
    "3d model": "3D Model",
    database: "Database",
    executable: "Executable",
    "disk image": "Disk Image",
    design: "Design",
    file: "File",
  };

  return typeMap[type.toLowerCase()] || type.toUpperCase();
}

/**
 * Check if file type supports preview
 */
export function isPreviewable(type: string): boolean {
  const previewableTypes = [
    "image",
    "png",
    "jpg",
    "jpeg",
    "gif",
    "bmp",
    "webp",
    "svg",
    "pdf",
    "text",
    "txt",
    "md",
    "json",
    "xml",
    "html",
    "css",
    "js",
    "ts",
  ];

  return previewableTypes.includes(type.toLowerCase());
}

/**
 * Get file icon color class for styling
 */
export function getFileIconColor(type: string): string {
  switch (type.toLowerCase()) {
    case "image":
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
      return "text-blue-500";
    case "video":
    case "mp4":
    case "avi":
      return "text-purple-500";
    case "audio":
    case "mp3":
    case "wav":
      return "text-green-500";
    case "code":
    case "js":
    case "ts":
    case "py":
      return "text-yellow-500";
    case "pdf":
    case "document":
      return "text-red-500";
    case "archive":
    case "zip":
    case "rar":
      return "text-orange-500";
    default:
      return "text-gray-500";
  }
}
