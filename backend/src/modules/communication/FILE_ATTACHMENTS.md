# File Attachments for Messaging

## Overview

This document describes the file attachment functionality for the messaging system, implementing **Requirement 24.4**.

## Features

- **Multiple File Types**: Support for images, documents, videos, and audio files
- **Secure Storage**: Files stored in organized directory structure by user ID
- **File Size Limits**: Maximum 10MB per file, up to 5 files per message
- **Image Optimization**: Automatic compression and resizing for images
- **Validation**: File type and size validation at upload time
- **Access Control**: Users can only delete their own attachments

## Supported File Types

### Images
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)

### Documents
- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Microsoft Excel (.xls, .xlsx)

### Videos
- MP4 (.mp4)
- MPEG (.mpeg)
- QuickTime (.mov)
- AVI (.avi)
- WebM (.webm)

### Audio
- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)
- WebM (.webm)
- AAC (.aac)

## API Endpoints

### Upload Attachments

**POST** `/api/v1/communication/attachments`

Upload one or more files to be attached to messages.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Authentication: Required (JWT token)
- Body: Form data with `files` field (array of files)

**Example using curl:**
```bash
curl -X POST \
  http://localhost:3000/api/v1/communication/attachments \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -F 'files=@/path/to/file1.pdf' \
  -F 'files=@/path/to/file2.jpg'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attachments": [
      {
        "type": "document",
        "url": "/uploads/attachments/messages/123/1234567890-abc123.pdf",
        "name": "file1.pdf",
        "size": 102400,
        "mimeType": "application/pdf",
        "uploadedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "type": "image",
        "url": "/uploads/attachments/messages/123/1234567891-def456.jpg",
        "name": "file2.jpg",
        "size": 51200,
        "mimeType": "image/jpeg",
        "uploadedAt": "2024-01-15T10:30:01.000Z"
      }
    ]
  },
  "message": "Attachments uploaded successfully"
}
```

### Delete Attachment

**DELETE** `/api/v1/communication/attachments`

Delete an uploaded attachment.

**Request:**
- Method: DELETE
- Content-Type: application/json
- Authentication: Required (JWT token)
- Body:
```json
{
  "attachmentUrl": "/uploads/attachments/messages/123/1234567890-abc123.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attachment deleted successfully"
}
```

## Usage in Messages

### Sending a Message with Attachments

1. First, upload the files using the upload endpoint
2. Get the attachment metadata from the response
3. Include the attachment metadata when sending the message

**Example:**

```javascript
// Step 1: Upload files
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);

const uploadResponse = await fetch('/api/v1/communication/attachments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { data: { attachments } } = await uploadResponse.json();

// Step 2: Send message with attachments
const messageResponse = await fetch('/api/v1/communication/messages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recipientId: 456,
    content: 'Check out these files!',
    attachments: attachments
  })
});
```

### Sending a Group Message with Attachments

```javascript
// Upload files first (same as above)
const { data: { attachments } } = await uploadResponse.json();

// Send group message with attachments
const messageResponse = await fetch('/api/v1/communication/groups/messages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    groupConversationId: 789,
    content: 'Team, please review these documents',
    attachments: attachments
  })
});
```

## File Storage Structure

Files are stored in the following directory structure:

```
uploads/
└── attachments/
    └── messages/
        └── {userId}/
            ├── 1234567890-abc123.pdf
            ├── 1234567891-def456.jpg
            └── ...
```

- Each user has their own directory identified by their user ID
- Filenames are generated with timestamp and random string to prevent conflicts
- Original file extensions are preserved

## Image Processing

Images are automatically processed to optimize storage and performance:

1. **Resizing**: Images larger than 1920x1920 pixels are resized
2. **Compression**: Images are compressed to reduce file size (target: max 2MB)
3. **Format**: Images are converted to JPEG format for optimal compression
4. **Quality**: Compression quality is adjusted dynamically to meet size limits

## Security Considerations

1. **File Type Validation**: Only allowed file types can be uploaded
2. **Size Limits**: Files exceeding 10MB are rejected
3. **Access Control**: Users can only delete their own attachments
4. **Path Traversal Prevention**: File paths are sanitized
5. **Unique Filenames**: Random filenames prevent guessing and conflicts

## Error Handling

### Common Errors

**400 Bad Request - No Files**
```json
{
  "success": false,
  "error": {
    "code": "NO_FILES",
    "message": "No files provided"
  }
}
```

**400 Bad Request - Invalid File Type**
```json
{
  "success": false,
  "error": {
    "code": "UPLOAD_FAILED",
    "message": "Invalid file type: application/x-executable. Allowed types: images, documents, videos, and audio files."
  }
}
```

**403 Forbidden - Unauthorized Delete**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to delete this attachment"
  }
}
```

**413 Payload Too Large**
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds maximum allowed size of 10MB"
  }
}
```

## Validation Rules

### Upload Validation

- Maximum 5 files per upload request
- Maximum 10MB per file
- Only allowed file types (see Supported File Types section)
- Files must have valid MIME types

### Attachment Metadata Validation

When including attachments in messages:

- `type`: Must be one of: 'image', 'document', 'video', 'audio'
- `url`: Must be a valid relative URL
- `name`: Required, original filename
- `size`: Required, file size in bytes (max 10MB)
- `mimeType`: Required, valid MIME type

## Testing

### Unit Tests

Run unit tests for the attachment service:

```bash
npm test -- attachment.service.test.ts
```

### Integration Tests

Run integration tests for the attachment endpoints:

```bash
npm test -- attachment.integration.test.ts
```

## Configuration

File upload configuration is defined in `src/config/constants.ts`:

```typescript
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
};
```

## Future Enhancements

Potential improvements for future iterations:

1. **Virus Scanning**: Integrate antivirus scanning for uploaded files
2. **Cloud Storage**: Support for AWS S3 or similar cloud storage
3. **Thumbnails**: Generate thumbnails for images and videos
4. **Preview**: In-app preview for documents and images
5. **Download Tracking**: Track file downloads for analytics
6. **Expiration**: Automatic cleanup of old attachments
7. **Compression**: Additional compression for videos
8. **Encryption**: Encrypt files at rest for sensitive data

## Related Files

- `attachment.service.ts` - Core attachment processing logic
- `communication.controller.ts` - HTTP request handlers
- `communication.routes.ts` - Route definitions
- `communication.validation.ts` - Input validation schemas
- `Message.model.ts` - Message model with attachments field
- `GroupMessage.model.ts` - Group message model with attachments field
