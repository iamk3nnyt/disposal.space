# @ketryon/aws

Enterprise-grade AWS S3 file processing package with advanced security and validation for the disposal space application.

## Features

- ✅ **Multi-Size Upload Support**: Single upload, multipart upload, and smart auto-selection
- ✅ **Streaming Downloads**: Memory-efficient downloads with range support
- ✅ **Presigned URLs**: Generate secure upload/download URLs for direct client access
- ✅ **Advanced File Validation**: Size, type, content, and security validation
- ✅ **Smart MIME Detection**: Magic byte detection with confidence scoring and fallback
- ✅ **Security Scanning**: Malicious content detection (scripts, executables, injections)
- ✅ **100+ File Types**: Comprehensive support for modern file formats
- ✅ **Secure File Keys**: 256-bit entropy with user ID hashing
- ✅ **UI Helpers**: File categorization and extension utilities
- ✅ **Specialized Processors**: Configurable processors for different use cases

## Setup

### Environment Variables

```bash
AWS_REGION=eu-north-1                    # Stockholm region (default)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your-bucket-name
USER_SALT=your-random-salt-for-user-id-hashing  # Required for secure file keys
```

> **📋 Need help getting these credentials?** See our [AWS Setup Guide](./AWS_SETUP_GUIDE.md) for step-by-step instructions.

### Installation

```bash
pnpm add @ketryon/aws
```

## Usage

### Basic File Operations

```typescript
import { fileProcessor } from "@ketryon/aws";

// Smart upload with automatic size-based method selection
const result = await fileProcessor.uploadAndProcess(
  buffer,
  "document.pdf",
  "user123"
);
// Returns: { key, url, size, mimeType, originalName }

// Download file (loads into memory)
const fileBuffer = await fileProcessor.downloadFile(result.key);

// Stream download (memory efficient for large files)
const stream = await fileProcessor.downloadFileStream(result.key);

// Range download (partial content)
const chunk = await fileProcessor.downloadFileRange(result.key, 0, 1024);

// Delete file
await fileProcessor.deleteFile(result.key);

// Get file info
const metadata = await fileProcessor.getFileInfo(result.key);
```

### Presigned URLs

```typescript
import { fileProcessor } from "@ketryon/aws";

// Generate upload URL (for direct client uploads)
const { uploadUrl, key } = await fileProcessor.generateUploadUrl(
  "user123",
  "document.pdf"
);

// Generate download URL
const downloadUrl = await fileProcessor.generateDownloadUrl(key);
```

### Specialized Processors

```typescript
import { imageProcessor, documentProcessor } from "@ketryon/aws";

// Image processor (10MB limit, image types only)
const imageResult = await imageProcessor.uploadAndProcess(
  imageBuffer,
  "photo.jpg",
  "user123"
);

// Document processor (50MB limit, document types only)
const docResult = await documentProcessor.uploadAndProcess(
  docBuffer,
  "report.pdf",
  "user123"
);
```

### Smart MIME Type Detection

```typescript
import {
  detectMimeTypeSmart,
  getMimeType,
  getFileTypeCategory,
} from "@ketryon/aws";

// Smart detection with confidence scoring
const detection = detectMimeTypeSmart(buffer, "photo.heic");
// Returns: { mimeType: "image/heic", confidence: "high", method: "magic-bytes" }

// Extension-based detection
const mimeType = getMimeType("document.pdf"); // "application/pdf"

// UI-friendly categorization
const category = getFileTypeCategory("design.fig"); // "Design"
```

### Direct S3 Operations

```typescript
import {
  uploadFile,
  uploadFileAuto,
  uploadLargeFile,
  downloadFile,
  downloadFileStream,
  deleteFile,
} from "@ketryon/aws";

// Smart upload (auto-selects method based on size)
const result = await uploadFileAuto(buffer, "key.pdf", "application/pdf");

// Force multipart upload for large files
const largeResult = await uploadLargeFile(buffer, "key.zip", "application/zip");

// Memory-efficient streaming download
const stream = await downloadFileStream("key.pdf");

// Traditional operations
const fileBuffer = await downloadFile("key.pdf");
await deleteFile("key.pdf");
```

## File Key Structure

Files are stored with a secure key pattern:

```
files/{hashedUserId}/{secureRandom}{extension}
```

Example: `files/a1b2c3d4e5f6g7h8/f9e8d7c6b5a4938271605f4e3d2c1b0a9f8e7d6c5b4a39281706f5e4d3c2b1a0f.pdf`

### Security Features:

- **256-bit entropy**: Cryptographically secure random file names
- **User ID hashing**: Prevents user enumeration attacks
- **No timestamp**: Prevents time-based file discovery
- **No filename leakage**: Original filenames not exposed in keys

## File Size Support

| File Size       | Upload Method       | Memory Usage         | Best For                         |
| --------------- | ------------------- | -------------------- | -------------------------------- |
| **< 100MB**     | `uploadFile`        | Full file in memory  | Documents, images, small videos  |
| **100MB - 5GB** | `uploadLargeFile`   | 5MB chunks           | Large videos, datasets           |
| **> 5GB**       | `generateUploadUrl` | ~0MB (client direct) | Massive files, user uploads      |
| **Any size**    | `uploadFileAuto`    | Adaptive             | General purpose - let it decide! |

## Validation & Security

### File Type Support (100+ formats)

- **Documents**: PDF, Word, Excel, PowerPoint, OpenOffice, RTF
- **Images**: JPEG, PNG, GIF, WebP, HEIC, AVIF, TIFF, BMP, SVG, PSD
- **Video**: MP4, AVI, MOV, WebM, MKV, FLV, 3GP
- **Audio**: MP3, WAV, FLAC, AAC, OGG, M4A, Opus
- **Archives**: ZIP, RAR, 7Z, TAR, GZIP, BZIP2
- **Development**: Python, JavaScript, TypeScript, Java, C++, Go, Rust
- **Design**: Sketch, Figma, Adobe XD, Photoshop, Illustrator
- **3D & CAD**: OBJ, FBX, Blender, AutoCAD, COLLADA
- **And many more...**

### Security Features

- **Magic Byte Validation**: 40+ file signatures for content verification
- **Spoofing Protection**: Prevents malicious files disguised as safe types
- **Script Injection Detection**: Scans SVG, HTML, XML for embedded scripts
- **Executable Detection**: Identifies Windows, Linux, macOS executables
- **Shell Script Scanning**: Detects dangerous shell commands
- **Content Consistency**: Ensures file content matches declared type
- **Secure File Keys**: 256-bit entropy, user ID hashing, no filename leakage

### Validation Layers

1. **File Size**: Configurable limits (default 100MB)
2. **File Type**: Extension-based whitelist filtering
3. **MIME Detection**: Smart detection with confidence scoring
4. **Magic Bytes**: Binary signature verification
5. **Malicious Patterns**: Multi-layer security scanning
6. **Content Validation**: Cross-validation between methods

## Error Handling

All functions throw descriptive errors with detailed context:

```typescript
// Configuration errors
throw new Error(
  "Missing required AWS environment variables: AWS_ACCESS_KEY_ID, USER_SALT"
);

// Validation errors
throw new Error("File size exceeds limit of 104857600 bytes");
throw new Error("File type not allowed. Allowed types: .pdf, .jpg, .png");

// Security errors
throw new Error(
  "Content validation failed: File content doesn't match declared type. Expected: application/pdf, Detected: application/x-msdownload (magic bytes)"
);
throw new Error("File contains potentially malicious content");

// AWS errors (network, permissions, etc.)
throw new Error("Failed to upload file: Access Denied");
```

## Advanced Usage

### Custom Processors

```typescript
import { FileProcessor } from "@ketryon/aws";

// Create custom processor with specific rules
const strictProcessor = new FileProcessor({
  maxFileSize: 50 * 1024 * 1024, // 50MB limit
  allowedTypes: [".pdf", ".docx", ".xlsx"], // Documents only
});

const result = await strictProcessor.uploadAndProcess(buffer, filename, userId);
```

### Validation Only (No Upload)

```typescript
import {
  detectMimeTypeSmart,
  validateContentType,
  detectMaliciousPatterns,
} from "@ketryon/aws";

// Validate file without uploading
const detection = detectMimeTypeSmart(buffer, filename);
const validation = validateContentType(buffer, detection.mimeType, filename);
const isMalicious = detectMaliciousPatterns(buffer, detection.mimeType);

if (!validation.isValid || isMalicious) {
  throw new Error("File validation failed");
}
```

## Architecture

```
src/
├── config.ts          # AWS configuration and validation
├── s3.ts              # S3 operations (single, multipart, streaming)
├── file-processor.ts  # High-level processing with validation
├── utils.ts           # MIME detection, validation, security scanning
└── index.ts           # Main exports and convenience functions
```

## Performance Considerations

- **Small files (< 100MB)**: Use `uploadFile` for simplicity
- **Large files (> 100MB)**: Automatic multipart upload with `uploadFileAuto`
- **Huge files (> 5GB)**: Use presigned URLs for direct client upload
- **Downloads**: Use `downloadFileStream` for memory efficiency
- **Validation**: Magic byte detection adds ~1-5ms per file
- **Security scanning**: Adds ~5-10ms per file (scans first 2KB)
