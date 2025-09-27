import { createHash, randomBytes } from "crypto";
import { extname } from "path";
import { awsConfig } from "./config";

// Generate secure file key
export function generateFileKey(
  userId: string,
  originalName: string,
  prefix = "files"
): string {
  // 32 bytes = 256 bits of cryptographically secure entropy
  const secureRandom = randomBytes(32).toString("hex");

  // Hash user ID to prevent enumeration attacks
  const hashedUserId = createHash("sha256")
    .update(userId + awsConfig.userSalt)
    .digest("hex")
    .slice(0, 16);

  // Only preserve file extension, not original filename
  const extension = extname(originalName);

  return `${prefix}/${hashedUserId}/${secureRandom}${extension}`;
}

// Extract file info from secure key
export function parseFileKey(key: string): {
  prefix: string;
  hashedUserId: string;
  secureRandom: string;
  extension: string;
} {
  const parts = key.split("/");
  if (parts.length < 3) {
    throw new Error("Invalid file key format");
  }

  const [prefix, hashedUserId, fileNameWithExt] = parts;
  const extension = extname(fileNameWithExt);
  const secureRandom = fileNameWithExt.replace(extension, "");

  return {
    prefix,
    hashedUserId,
    secureRandom,
    extension,
  };
}

// Get MIME type from file extension
export function getMimeType(filename: string): string {
  const ext = extname(filename).toLowerCase();

  const mimeTypes: Record<string, string> = {
    // Documents
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx":
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".odt": "application/vnd.oasis.opendocument.text",
    ".ods": "application/vnd.oasis.opendocument.spreadsheet",
    ".odp": "application/vnd.oasis.opendocument.presentation",
    ".rtf": "application/rtf",

    // Text & Data
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".json": "application/json",
    ".xml": "application/xml",
    ".html": "text/html",
    ".htm": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".ts": "application/typescript",
    ".md": "text/markdown",
    ".yaml": "application/x-yaml",
    ".yml": "application/x-yaml",
    ".toml": "application/toml",
    ".ini": "text/plain",
    ".log": "text/plain",
    ".sql": "application/sql",

    // Archives
    ".zip": "application/zip",
    ".rar": "application/x-rar-compressed",
    ".7z": "application/x-7z-compressed",
    ".tar": "application/x-tar",
    ".gz": "application/gzip",
    ".bz2": "application/x-bzip2",
    ".xz": "application/x-xz",

    // Images
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
    ".heic": "image/heic",
    ".heif": "image/heif",
    ".avif": "image/avif",

    // Design Files
    ".psd": "image/vnd.adobe.photoshop",
    ".ai": "application/postscript",
    ".eps": "application/postscript",
    ".sketch": "application/x-sketch",
    ".fig": "application/x-figma",
    ".xd": "application/vnd.adobe.xd",

    // Video
    ".mp4": "video/mp4",
    ".avi": "video/x-msvideo",
    ".mov": "video/quicktime",
    ".wmv": "video/x-ms-wmv",
    ".flv": "video/x-flv",
    ".webm": "video/webm",
    ".mkv": "video/x-matroska",
    ".m4v": "video/x-m4v",
    ".3gp": "video/3gpp",
    ".ogv": "video/ogg",

    // Audio
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".flac": "audio/flac",
    ".aac": "audio/aac",
    ".ogg": "audio/ogg",
    ".wma": "audio/x-ms-wma",
    ".m4a": "audio/mp4",
    ".opus": "audio/opus",

    // Fonts
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".eot": "application/vnd.ms-fontobject",

    // 3D & CAD
    ".obj": "model/obj",
    ".fbx": "application/octet-stream", // No standard MIME type
    ".dae": "model/vnd.collada+xml",
    ".3ds": "application/x-3ds",
    ".blend": "application/x-blender",
    ".dwg": "image/vnd.dwg",
    ".dxf": "image/vnd.dxf",

    // Database
    ".db": "application/x-sqlite3",
    ".sqlite": "application/x-sqlite3",
    ".sqlite3": "application/x-sqlite3",
    ".mdb": "application/x-msaccess",

    // Disk Images
    ".iso": "application/x-iso9660-image",
    ".dmg": "application/x-apple-diskimage",
    ".img": "application/octet-stream",

    // Packages & Executables
    ".deb": "application/vnd.debian.binary-package",
    ".rpm": "application/x-rpm",
    ".apk": "application/vnd.android.package-archive",
    ".ipa": "application/octet-stream",
    ".msi": "application/x-msi",
    ".exe": "application/x-msdownload",

    // Development
    ".py": "text/x-python",
    ".java": "text/x-java-source",
    ".cpp": "text/x-c++src",
    ".c": "text/x-csrc",
    ".h": "text/x-chdr",
    ".php": "application/x-httpd-php",
    ".rb": "application/x-ruby",
    ".go": "text/x-go",
    ".rs": "text/x-rust",
    ".swift": "text/x-swift",
    ".kt": "text/x-kotlin",
    ".scala": "text/x-scala",

    // Configuration
    ".env": "text/plain",
    ".gitignore": "text/plain",
    ".dockerfile": "text/plain",
    ".conf": "text/plain",
    ".cfg": "text/plain",
  };

  return mimeTypes[ext] || "application/octet-stream";
}

// Get file type category for UI display
export function getFileTypeCategory(filename: string): string {
  const mimeType = getMimeType(filename);

  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType.startsWith("video/")) return "Video";
  if (mimeType.startsWith("audio/")) return "Audio";
  if (mimeType.startsWith("text/")) return "Text";
  if (mimeType.startsWith("font/")) return "Font";
  if (mimeType.startsWith("model/")) return "3D Model";

  // Specific document types
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "Document";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return "Spreadsheet";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return "Presentation";

  // Archives
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z") ||
    mimeType.includes("tar") ||
    mimeType.includes("gzip") ||
    mimeType.includes("bzip")
  ) {
    return "Archive";
  }

  // Development
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("python") ||
    mimeType.includes("java") ||
    mimeType.includes("c++") ||
    mimeType.includes("ruby") ||
    mimeType.includes("go") ||
    mimeType.includes("rust") ||
    mimeType.includes("swift")
  ) {
    return "Code";
  }

  // Design
  if (
    mimeType.includes("photoshop") ||
    mimeType.includes("sketch") ||
    mimeType.includes("figma") ||
    mimeType.includes("adobe")
  ) {
    return "Design";
  }

  // Database
  if (mimeType.includes("sqlite") || mimeType.includes("database"))
    return "Database";

  // Executables
  if (
    mimeType.includes("executable") ||
    mimeType.includes("msdownload") ||
    mimeType.includes("package") ||
    mimeType.includes("msi")
  ) {
    return "Executable";
  }

  // Disk images
  if (mimeType.includes("iso") || mimeType.includes("diskimage"))
    return "Disk Image";

  return "File";
}

// Get file extension without dot
export function getFileExtension(filename: string): string {
  const ext = extname(filename).toLowerCase();
  return ext.startsWith(".") ? ext.slice(1).toUpperCase() : ext.toUpperCase();
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Validate file size (default 100MB limit)
export function validateFileSize(
  size: number,
  maxSize = 100 * 1024 * 1024
): boolean {
  return size <= maxSize;
}

// Validate file type
export function validateFileType(
  filename: string,
  allowedTypes?: string[]
): boolean {
  if (!allowedTypes) return true;

  const ext = extname(filename).toLowerCase();
  return allowedTypes.includes(ext);
}

// Magic byte signatures for common file types
const MAGIC_BYTES: Record<string, number[]> = {
  // Images
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/gif": [0x47, 0x49, 0x46, 0x38],
  "image/bmp": [0x42, 0x4d],
  "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF header (check WEBP at offset 8)
  "image/tiff": [0x49, 0x49, 0x2a, 0x00], // Little-endian TIFF
  "image/x-icon": [0x00, 0x00, 0x01, 0x00], // ICO format

  // Documents
  "application/pdf": [0x25, 0x50, 0x44, 0x46], // %PDF
  "application/msword": [0xd0, 0xcf, 0x11, 0xe0], // OLE2 compound document
  "application/rtf": [0x7b, 0x5c, 0x72, 0x74, 0x66], // {\rtf

  // Archives
  "application/zip": [0x50, 0x4b, 0x03, 0x04], // Also covers .docx, .xlsx, .pptx
  "application/x-rar-compressed": [0x52, 0x61, 0x72, 0x21], // Rar!
  "application/x-7z-compressed": [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c], // 7z
  "application/gzip": [0x1f, 0x8b], // GZIP
  "application/x-bzip2": [0x42, 0x5a, 0x68], // BZh

  // Video
  "video/mp4": [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // ftyp box
  "video/x-msvideo": [0x52, 0x49, 0x46, 0x46], // RIFF (AVI)
  "video/quicktime": [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70], // QuickTime
  "video/webm": [0x1a, 0x45, 0xdf, 0xa3], // EBML header
  "video/x-matroska": [0x1a, 0x45, 0xdf, 0xa3], // EBML header (same as WebM)

  // Audio
  "audio/mpeg": [0xff, 0xfb], // MP3 frame header (most common)
  "audio/wav": [0x52, 0x49, 0x46, 0x46], // RIFF header
  "audio/flac": [0x66, 0x4c, 0x61, 0x43], // fLaC
  "audio/ogg": [0x4f, 0x67, 0x67, 0x53], // OggS
  "audio/mp4": [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // M4A uses MP4 container

  // Executables
  "application/x-msdownload": [0x4d, 0x5a], // MZ (PE executable)
  "application/x-msi": [0xd0, 0xcf, 0x11, 0xe0], // MSI (OLE2 compound document)
  "application/vnd.debian.binary-package": [
    0x21, 0x3c, 0x61, 0x72, 0x63, 0x68, 0x3e,
  ], // !<arch>
  "application/x-rpm": [0xed, 0xab, 0xee, 0xdb], // RPM magic

  // Database
  "application/x-sqlite3": [0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66], // SQLite format 3

  // Disk Images
  "application/x-iso9660-image": [0x43, 0x44, 0x30, 0x30, 0x31], // CD001 (at offset 32769)

  // Text files (no magic bytes - content-based validation)
  "text/plain": [],
  "text/csv": [],
  "text/html": [],
  "text/css": [],
  "text/javascript": [],
  "text/markdown": [],
  "application/json": [],
  "application/xml": [],
  "application/javascript": [],
  "application/typescript": [],
  "application/sql": [],
  "application/x-yaml": [],
  "application/toml": [],

  // Design files (mostly proprietary, limited validation)
  "image/vnd.adobe.photoshop": [0x38, 0x42, 0x50, 0x53], // 8BPS
  "application/postscript": [0x25, 0x21, 0x50, 0x53], // %!PS

  // Modern image formats (limited support)
  "image/heic": [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // Uses MP4 container
  "image/avif": [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // Uses MP4 container
};

// Validate file content matches declared MIME type
export function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signature = MAGIC_BYTES[mimeType];

  // If no signature defined, allow (e.g., text files)
  if (!signature || signature.length === 0) {
    return true;
  }

  // Special case for WEBP (RIFF header + WEBP at offset 8)
  if (mimeType === "image/webp") {
    const riffCheck = signature.every((byte, i) => buffer[i] === byte);
    const webpCheck = buffer.slice(8, 12).toString() === "WEBP";
    return riffCheck && webpCheck;
  }

  // Check if buffer starts with expected magic bytes
  return signature.every((byte, i) => buffer[i] === byte);
}

// Detect actual MIME type from buffer content
export function detectMimeTypeFromBuffer(buffer: Buffer): string {
  for (const [mimeType, signature] of Object.entries(MAGIC_BYTES)) {
    if (signature.length === 0) continue; // Skip types without signatures

    if (mimeType === "image/webp") {
      const riffCheck = signature.every((byte, i) => buffer[i] === byte);
      const webpCheck = buffer.slice(8, 12).toString() === "WEBP";
      if (riffCheck && webpCheck) return mimeType;
    } else if (signature.every((byte, i) => buffer[i] === byte)) {
      return mimeType;
    }
  }

  return "application/octet-stream"; // Unknown type
}

// Smart MIME type detection with fallback strategy
export function detectMimeTypeSmart(
  buffer: Buffer,
  filename: string
): {
  mimeType: string;
  confidence: "high" | "medium" | "low";
  method: "magic-bytes" | "extension" | "fallback";
} {
  // First: Try magic byte detection (highest confidence)
  const magicByteMimeType = detectMimeTypeFromBuffer(buffer);
  if (magicByteMimeType !== "application/octet-stream") {
    return {
      mimeType: magicByteMimeType,
      confidence: "high",
      method: "magic-bytes",
    };
  }

  // Second: Try extension-based detection (medium confidence)
  const extensionMimeType = getMimeType(filename);
  if (extensionMimeType !== "application/octet-stream") {
    return {
      mimeType: extensionMimeType,
      confidence: "medium",
      method: "extension",
    };
  }

  // Fallback: Unknown type (low confidence)
  return {
    mimeType: "application/octet-stream",
    confidence: "low",
    method: "fallback",
  };
}

// Validate content matches declared type (prevent spoofing)
export function validateContentType(
  buffer: Buffer,
  declaredMimeType: string,
  filename: string
): { isValid: boolean; detectedType?: string; reason?: string } {
  // Get smart detection result
  const smartDetection = detectMimeTypeSmart(buffer, filename);

  // If we have high confidence magic byte detection
  if (smartDetection.confidence === "high") {
    if (smartDetection.mimeType !== declaredMimeType) {
      return {
        isValid: false,
        detectedType: smartDetection.mimeType,
        reason: `File content doesn't match declared type. Expected: ${declaredMimeType}, Detected: ${smartDetection.mimeType} (magic bytes)`,
      };
    }
  }

  // For medium/low confidence, just check extension consistency
  const extensionMimeType = getMimeType(filename);
  if (declaredMimeType !== extensionMimeType) {
    return {
      isValid: false,
      reason: `Declared MIME type (${declaredMimeType}) doesn't match file extension (${extensionMimeType})`,
    };
  }

  // Additional magic byte validation if available
  if (!validateMagicBytes(buffer, declaredMimeType)) {
    return {
      isValid: false,
      detectedType: smartDetection.mimeType,
      reason: `File content validation failed for ${declaredMimeType}`,
    };
  }

  return { isValid: true };
}

// Enhanced malicious content detection
export function detectMaliciousPatterns(
  buffer: Buffer,
  mimeType: string
): boolean {
  const content = buffer.toString("utf8", 0, Math.min(buffer.length, 2048)); // Check first 2KB

  // Check for script injection in SVG files
  if (mimeType === "image/svg+xml") {
    const svgScriptPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // onclick, onload, etc.
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<link.*javascript/i,
      /<style.*expression/i, // CSS expression attacks
      /xlink:href.*javascript/i,
    ];

    if (svgScriptPatterns.some((pattern) => pattern.test(content))) {
      return true;
    }
  }

  // Check for script injection in HTML/XML files
  if (mimeType === "text/html" || mimeType === "application/xml") {
    const htmlScriptPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /vbscript:/i,
      /data:.*base64/i, // Base64 encoded scripts
    ];

    if (htmlScriptPatterns.some((pattern) => pattern.test(content))) {
      return true;
    }
  }

  // Check for executable signatures (binary content)
  const executableSignatures = [
    /MZ/, // PE executable header (Windows .exe, .dll)
    /\x7fELF/, // ELF executable header (Linux)
    /\xca\xfe\xba\xbe/, // Mach-O fat binary (macOS)
    /\xfe\xed\xfa\xce/, // Mach-O 32-bit (macOS)
    /\xfe\xed\xfa\xcf/, // Mach-O 64-bit (macOS)
    /\xcf\xfa\xed\xfe/, // Mach-O reverse byte order
  ];

  if (executableSignatures.some((pattern) => pattern.test(content))) {
    return true;
  }

  // Check for shell script patterns in text files
  if (mimeType.startsWith("text/") || mimeType === "application/x-sh") {
    const shellPatterns = [
      /^#!.*\/bin\/(bash|sh|zsh|fish)/m, // Shebang lines
      /rm\s+-rf\s+[\/\*]/i, // Dangerous rm commands
      /curl.*\|\s*(bash|sh)/i, // Pipe to shell
      /wget.*\|\s*(bash|sh)/i, // Pipe to shell
      /eval\s*\(/i, // Eval statements
      /exec\s*\(/i, // Exec statements
    ];

    if (shellPatterns.some((pattern) => pattern.test(content))) {
      return true;
    }
  }

  // Check for suspicious patterns in any file type
  const suspiciousPatterns = [
    /powershell/i,
    /cmd\.exe/i,
    /system\s*\(/i, // System calls
    /passthru\s*\(/i, // PHP passthru
    /shell_exec\s*\(/i, // PHP shell_exec
    /base64_decode\s*\(/i, // PHP base64 decode (often used in malware)
    /__import__\s*\(\s*["']os["']\)/i, // Python os import
    /subprocess\./i, // Python subprocess
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(content));
}
