# Database Schema Documentation

## Database Engine Choice

**Selected Database**: Firebase Firestore (NoSQL Document Database)

### Justification

Firebase Firestore is optimal for this mobile-first food label scanner app because:

1. **Real-time Synchronization**: Automatic real-time updates across devices
2. **Offline-First Capabilities**: Built-in offline persistence and sync when online
3. **Scalability**: Automatic horizontal scaling with Firebase's global CDN
4. **Seamless Integration**: Native integration with Firebase Authentication and Cloud Storage
5. **Document-Based Structure**: Aligns well with hierarchical nutrition data
6. **Performance**: Sub-100ms query response times for user history
7. **Security**: Row-level security rules integrated with Firebase Authentication

### Data Volume Estimates

- **Initial Users**: 1,000-10,000 users
- **Scans per User**: 50-200 food items per month
- **Total Documents**: 10,000-100,000 food scans initially
- **Expected Growth**: Linear scaling with user base

### Performance Requirements

- **Query Response Time**: <100ms for user history queries
- **Write Latency**: <500ms for scan creation
- **Consistency**: Eventual consistency for user data, strong consistency for authentication
- **Backup/Recovery**: Automatic daily backups with 30-day retention

---

## Database Schema

### Collections and Documents

#### Collection: `users`

**Description**: User profiles and authentication data

**Document Structure**:
```typescript
{
  uid: string,                    // Firebase Auth UID (document ID)
  email: string,                  // User email address
  displayName: string,            // User's display name
  language: "en" | "tr",         // Preferred language
  dietaryRestrictions: string[],  // Array of dietary restrictions
  createdAt: Timestamp,          // Account creation timestamp
  lastLoginAt: Timestamp,        // Last login timestamp
  preferences: {
    notifications: boolean,       // Notification preferences
    offlineMode: boolean,         // Offline mode preference
  },
  stats: {
    totalScans: number,          // Total number of scans
    lastScanAt: Timestamp,       // Last scan timestamp
  }
}
```

**Indexes**:
- `email` (ascending)
- `createdAt` (descending)
- `lastLoginAt` (descending)

**Security Rules**:
```
users/{userId}: {
  read: request.auth != null && request.auth.uid == userId,
  write: request.auth != null && request.auth.uid == userId
}
```

---

#### Collection: `scans`

**Description**: Food label scan records

**Document Structure**:
```typescript
{
  scanId: string,                 // Unique scan identifier (document ID)
  userId: string,                 // Reference to users collection
  status: "pending" | "processing" | "completed" | "failed",
  imageUrl: string,               // Firebase Storage URL
  imageMetadata: {
    size: number,                 // File size in bytes
    format: "jpeg" | "png",      // Image format
    width: number,                // Image width in pixels
    height: number,               // Image height in pixels
    uploadedAt: Timestamp,        // Upload timestamp
  },
  language: "en" | "tr",          // Processing language
  createdAt: Timestamp,          // Scan creation timestamp
  processedAt: Timestamp | null,  // Processing completion timestamp
  nutritionData: {
    // NutritionCard data structure
    foodName: string,
    brand: string | null,
    servingSize: string,
    calories: number,
    nutrients: {
      protein: number,
      carbs: number,
      fat: number,
      fiber: number,
      sodium: number,
      sugar: number,
      saturatedFat: number,
      transFat: number,
    },
    allergens: Array<{
      name: string,
      severity: "high" | "medium" | "low",
      description: string,
    }>,
    vitamins: Array<{
      name: string,
      amount: number,
      unit: string,
      dailyValue: number,
    }>,
    minerals: Array<{
      name: string,
      amount: number,
      unit: string,
      dailyValue: number,
    }>,
  },
  alternatives: Array<{
    id: string,
    name: string,
    reason: string,
    nutritionComparison: object,
    imageUrl: string | null,
  }> | null,
  error: {
    code: string,
    message: string,
    timestamp: Timestamp,
  } | null,
}
```

**Indexes**:
- `userId` (ascending) + `createdAt` (descending) - for user history queries
- `status` (ascending) + `createdAt` (ascending) - for processing queue
- `createdAt` (descending) - for recent scans

**Security Rules**:
```
scans/{scanId}: {
  read: request.auth != null && resource.data.userId == request.auth.uid,
  create: request.auth != null && request.resource.data.userId == request.auth.uid,
  update: request.auth != null && resource.data.userId == request.auth.uid,
  delete: request.auth != null && resource.data.userId == request.auth.uid
}
```

---

#### Collection: `alternatives`

**Description**: Healthier alternative suggestions cache

**Document Structure**:
```typescript
{
  foodId: string,                 // Food identifier (document ID)
  originalFoodName: string,        // Original food name
  alternatives: Array<{
    id: string,
    name: string,
    reason: string,
    nutritionComparison: {
      calories: { current: number, alternative: number, difference: number },
      protein: { current: number, alternative: number, difference: number },
      carbs: { current: number, alternative: number, difference: number },
      fat: { current: number, alternative: number, difference: number },
      fiber: { current: number, alternative: number, difference: number },
      sodium: { current: number, alternative: number, difference: number },
    },
    imageUrl: string | null,
  }>,
  language: "en" | "tr",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  expiresAt: Timestamp,           // Cache expiration (7 days)
}
```

**Indexes**:
- `createdAt` (descending)
- `expiresAt` (ascending) - for cleanup operations

**Security Rules**:
```
alternatives/{foodId}: {
  read: request.auth != null,
  write: false  // Only system can write (via Cloud Functions)
}
```

---

#### Collection: `processingQueue`

**Description**: Queue for pending AI processing tasks

**Document Structure**:
```typescript
{
  taskId: string,                  // Unique task identifier (document ID)
  scanId: string,                  // Reference to scans collection
  userId: string,                  // Reference to users collection
  status: "pending" | "processing" | "completed" | "failed",
  priority: number,                // Processing priority (1-10)
  imageUrl: string,                // Firebase Storage URL
  language: "en" | "tr",
  createdAt: Timestamp,
  startedAt: Timestamp | null,
  completedAt: Timestamp | null,
  retryCount: number,             // Number of retry attempts
  maxRetries: number,             // Maximum retry attempts (default: 3)
  error: {
    code: string,
    message: string,
    timestamp: Timestamp,
  } | null,
}
```

**Indexes**:
- `status` (ascending) + `priority` (descending) + `createdAt` (ascending)
- `scanId` (ascending)

**Security Rules**:
```
processingQueue/{taskId}: {
  read: false,  // Internal collection, no direct access
  write: false  // Only Cloud Functions can write
}
```

---

### Relationships

1. **User → Scans** (One-to-Many)
   - Each user can have multiple scans
   - Query: `scans` collection filtered by `userId`

2. **Scan → Alternatives** (One-to-Many, Optional)
   - Each scan can have multiple alternative suggestions
   - Stored as array within scan document or referenced via `alternatives` collection

3. **Scan → ProcessingQueue** (One-to-One)
   - Each scan creates one processing queue task
   - Reference via `scanId` field

---

### Constraints

1. **Unique Constraints**:
   - `users.uid` must be unique (enforced by Firebase Auth)
   - `users.email` must be unique (enforced by Firebase Auth)
   - `scans.scanId` must be unique (enforced by document ID)

2. **Data Validation**:
   - `scans.nutritionData.calories` must be >= 0
   - `scans.nutritionData.nutrients.*` must be >= 0
   - `scans.imageMetadata.size` must be <= 10MB (10,485,760 bytes)
   - `scans.status` must be one of: pending, processing, completed, failed

3. **Referential Integrity**:
   - `scans.userId` must reference existing `users.uid`
   - `processingQueue.scanId` must reference existing `scans.scanId`

---

### Security Rules Summary

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Scans collection
    match /scans/{scanId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.resource.data.userId == request.auth.uid);
    }

    // Alternatives collection (read-only for authenticated users)
    match /alternatives/{foodId} {
      allow read: if request.auth != null;
      allow write: if false; // Only Cloud Functions can write
    }

    // Processing queue (internal, no direct access)
    match /processingQueue/{taskId} {
      allow read, write: if false;
    }
  }
}
```

---

### Backup and Recovery

- **Automatic Backups**: Daily automated backups by Firebase
- **Retention Period**: 30 days
- **Recovery Process**: Manual restore via Firebase Console
- **Point-in-Time Recovery**: Available within retention period

---

### Migration Strategy

1. **Schema Versioning**: Include `schemaVersion` field in documents for future migrations
2. **Backward Compatibility**: Maintain compatibility with existing document structures
3. **Gradual Migration**: Use Cloud Functions for background data migration
4. **Data Validation**: Enforce schema validation in Cloud Functions

---

## Performance Optimization

1. **Composite Indexes**: Created for common query patterns
2. **Pagination**: Limit query results (default: 20, max: 100)
3. **Caching**: Alternatives cached for 7 days to reduce AI processing
4. **Batch Operations**: Use batch writes for multiple document operations
5. **Query Optimization**: Use specific field selections to reduce payload size

---

## Monitoring and Analytics

1. **Query Performance**: Monitor query execution times
2. **Document Size**: Track document sizes to prevent exceeding 1MB limit
3. **Read/Write Operations**: Monitor operation counts for billing optimization
4. **Error Tracking**: Log and monitor failed operations
5. **Index Usage**: Monitor index usage for optimization

