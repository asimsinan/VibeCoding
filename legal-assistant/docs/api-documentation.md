# Turkish Legal Assistant - API Documentation

## Overview
The Turkish Legal Assistant API provides endpoints for document management, AI-powered chat, and legal document analysis with Turkish language support.

**Base URL**: `http://localhost:3000/api/v1` (Development)  
**Base URL**: `https://api.legal-assistant.com/v1` (Production)

**Version**: 1.0.0

## Authentication
All endpoints require authentication using Bearer tokens.

**Header**:
```
Authorization: Bearer <token>
```

---

## API Endpoints

### 1. Upload Document
**POST** `/documents/upload`

Upload a legal document (PDF or DOCX) for analysis.

**Request**:
```http
POST /api/v1/documents/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: [binary]
title: İş Sözleşmesi
description: Yıllık iş sözleşmesi
```

**Response**: `201 Created`
```json
{
  "id": "doc_123",
  "title": "İş Sözleşmesi",
  "filePath": "/uploads/doc_123.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf",
  "createdAt": "2025-01-27T10:00:00Z"
}
```

**Error Responses**:
- `400` - Invalid file format
- `401` - Unauthorized
- `413` - File too large (>20MB)

**Example Usage**:
```typescript
const formData = new FormData();
formData.append('file', fileBlob);
formData.append('title', 'İş Sözleşmesi');

const response = await fetch('/api/v1/documents/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
const document = await response.json();
```

---

### 2. List Documents
**GET** `/documents`

Retrieve a paginated list of all uploaded documents.

**Parameters**:
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 10) - Items per page

**Request**:
```http
GET /api/v1/documents?page=1&limit=10
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "documents": [
    {
      "id": "doc_123",
      "title": "İş Sözleşmesi",
      "fileSize": 1024000,
      "createdAt": "2025-01-27T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

**Example Usage**:
```typescript
const response = await fetch('/api/v1/documents?page=1&limit=10', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
```

---

### 3. Get Document
**GET** `/documents/{id}`

Retrieve details of a specific document.

**Request**:
```http
GET /api/v1/documents/doc_123
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "id": "doc_123",
  "title": "İş Sözleşmesi",
  "description": "Yıllık iş sözleşmesi",
  "filePath": "/uploads/doc_123.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf",
  "textContent": "Sözleşme metni...",
  "userId": "user_123",
  "createdAt": "2025-01-27T10:00:00Z",
  "updatedAt": "2025-01-27T10:00:00Z"
}
```

**Error Responses**:
- `404` - Document not found
- `401` - Unauthorized

---

### 4. Delete Document
**DELETE** `/documents/{id}`

Delete a document and its associated data.

**Request**:
```http
DELETE /api/v1/documents/doc_123
Authorization: Bearer <token>
```

**Response**: `204 No Content`

**Error Responses**:
- `404` - Document not found
- `401` - Unauthorized

---

### 5. Analyze Document
**POST** `/documents/{id}/analyze`

Perform KVKK compliance or clause analysis on a document.

**Request Body**:
```json
{
  "analysisType": "kvkk_compliance"
}
```

**Analysis Types**:
- `kvkk_compliance` - KVKK compliance check
- `data_mapping` - Data mapping analysis
- `clause_analysis` - Clause-by-clause analysis

**Request**:
```http
POST /api/v1/documents/doc_123/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "analysisType": "kvkk_compliance"
}
```

**Response**: `202 Accepted`
```json
{
  "analysisId": "analysis_456",
  "status": "in_progress",
  "documentId": "doc_123",
  "analysisType": "kvkk_compliance"
}
```

**Error Responses**:
- `404` - Document not found
- `400` - Invalid analysis type
- `401` - Unauthorized

---

### 6. Get Analysis Results
**GET** `/documents/{id}/analyze/{analysisId}`

Retrieve analysis results for a document.

**Request**:
```http
GET /api/v1/documents/doc_123/analyze/analysis_456
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "id": "analysis_456",
  "documentId": "doc_123",
  "analysisType": "kvkk_compliance",
  "status": "completed",
  "results": {
    "score": 85,
    "recommendations": [
      "Veri saklama süresi belirtilmeli",
      "Çerez politikası eklenmeli"
    ]
  },
  "createdAt": "2025-01-27T10:05:00Z"
}
```

---

### 7. Create Chat Session
**POST** `/chat/sessions`

Create a new chat session.

**Request Body**:
```json
{
  "documentId": "doc_123",
  "title": "KVKK Sorguları"
}
```

**Request**:
```http
POST /api/v1/chat/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "documentId": "doc_123",
  "title": "KVKK Sorguları"
}
```

**Response**: `201 Created`
```json
{
  "id": "session_789",
  "userId": "user_123",
  "documentId": "doc_123",
  "title": "KVKK Sorguları",
  "createdAt": "2025-01-27T10:10:00Z"
}
```

---

### 8. Send Chat Message
**POST** `/chat/sessions/{sessionId}/messages`

Send a message in a chat session.

**Request Body**:
```json
{
  "content": "Bu sözleşmedeki gizlilik maddelerini açıklar mısın?"
}
```

**Request**:
```http
POST /api/v1/chat/sessions/session_789/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Bu sözleşmedeki gizlilik maddelerini açıklar mısın?"
}
```

**Response**: `201 Created`
```json
{
  "id": "msg_101",
  "sessionId": "session_789",
  "role": "assistant",
  "content": "Gizlilik maddeleri şunları içerir...",
  "createdAt": "2025-01-27T10:12:00Z"
}
```

---

### 9. Get Chat Messages
**GET** `/chat/sessions/{sessionId}/messages`

Retrieve all messages in a chat session.

**Request**:
```http
GET /api/v1/chat/sessions/session_789/messages
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "messages": [
    {
      "id": "msg_100",
      "role": "user",
      "content": "Bu sözleşmedeki gizlilik maddelerini açıklar mısın?",
      "createdAt": "2025-01-27T10:11:00Z"
    },
    {
      "id": "msg_101",
      "role": "assistant",
      "content": "Gizlilik maddeleri şunları içerir...",
      "createdAt": "2025-01-27T10:12:00Z"
    }
  ]
}
```

---

### 10. Generate Agreement
**POST** `/agreements/generate`

Generate a tailored legal agreement.

**Request Body**:
```json
{
  "type": "employment_contract",
  "details": {
    "companyName": "ABC Şirketi",
    "employeeName": "Mehmet Yılmaz",
    "position": "Yazılım Geliştirici"
  }
}
```

**Agreement Types**:
- `employment_contract` - İş Sözleşmesi
- `nda` - Gizlilik Sözleşmesi
- `service_agreement` - Hizmet Sözleşmesi
- `privacy_policy` - Gizlilik Politikası
- `data_processing` - Veri İşleme Sözleşmesi

**Request**:
```http
POST /api/v1/agreements/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "employment_contract",
  "details": {
    "companyName": "ABC Şirketi",
    "employeeName": "Mehmet Yılmaz",
    "position": "Yazılım Geliştirici"
  }
}
```

**Response**: `201 Created`
```json
{
  "id": "agreement_555",
  "type": "employment_contract",
  "content": "İŞ SÖZLEŞMESİ\n\n1. TARAFLAR...",
  "downloadUrl": "/api/v1/agreements/agreement_555/download",
  "createdAt": "2025-01-27T10:20:00Z"
}
```

---

## Error Handling

All API endpoints return consistent error responses:

**Error Response Format**:
```json
{
  "error": "Hata mesajı Türkçe",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `201` - Created
- `202` - Accepted
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `413` - Payload Too Large
- `500` - Internal Server Error

## Turkish Language Support

All API responses, error messages, and content are in Turkish:
- ✅ Request/response bodies in Turkish
- ✅ Error messages in Turkish
- ✅ Document titles in Turkish
- ✅ AI-generated content in Turkish
- ✅ Full UTF-8 encoding support

## Rate Limiting

API endpoints have rate limits:
- Document upload: 10 requests/hour per IP
- Chat messages: 60 requests/hour per user
- Analysis requests: 20 requests/hour per user
- General API: 100 requests/hour per IP

## Swagger UI

Interactive API documentation available at:
`http://localhost:3000/api-docs` (Development)

---

## Summary

✅ **ALL 10 API ENDPOINTS DOCUMENTED**  
✅ **Request/response examples provided**  
✅ **Turkish language support verified**  
✅ **Error handling documented**  
✅ **Authentication requirements specified**  
✅ **Usage instructions included**
