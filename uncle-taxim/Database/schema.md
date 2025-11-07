# Firebase Firestore Database Schema

## Database Engine
**Firebase Firestore** - NoSQL document database with real-time capabilities

## Collections and Relationships

### 1. Users Collection
**Collection Path:** `users/{userId}`

**Document Structure:**
```json
{
  "userId": "string (document ID)",
  "email": "string",
  "phoneNumber": "string",
  "fullName": "string",
  "profileImageUrl": "string (optional)",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "isActive": "boolean",
  "preferences": {
    "language": "string",
    "currency": "string",
    "notificationEnabled": "boolean"
  },
  "userPreferencesId": "string (reference to userPreferences collection)"
}
```

**Relationships:**
- One-to-many with `rides` collection (via `userId` field in rides)
- One-to-one with `userPreferences` collection (via `userPreferencesId`)

**Constraints:**
- `userId` is unique (document ID)
- `email` must be unique
- `phoneNumber` must be unique

---

### 2. Drivers Collection
**Collection Path:** `drivers/{driverId}`

**Document Structure:**
```json
{
  "driverId": "string (document ID)",
  "email": "string",
  "phoneNumber": "string",
  "fullName": "string",
  "licenseNumber": "string",
  "vehicleInfo": {
    "make": "string",
    "model": "string",
    "year": "integer",
    "licensePlate": "string",
    "color": "string"
  },
  "profileImageUrl": "string (optional)",
  "rating": "number (0-5)",
  "totalRides": "integer",
  "isAvailable": "boolean",
  "currentLocation": {
    "latitude": "number",
    "longitude": "number",
    "timestamp": "timestamp"
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Relationships:**
- One-to-many with `rides` collection (via `driverId` field in rides)

**Constraints:**
- `driverId` is unique (document ID)
- `licenseNumber` must be unique
- `email` must be unique

---

### 3. Rides Collection
**Collection Path:** `rides/{rideId}`

**Document Structure:**
```json
{
  "rideId": "string (document ID)",
  "userId": "string (reference to users collection)",
  "driverId": "string (reference to drivers collection, optional)",
  "status": "string (pending|accepted|in_progress|completed|cancelled)",
  "pickupLocation": {
    "latitude": "number",
    "longitude": "number",
    "address": "string"
  },
  "dropoffLocation": {
    "latitude": "number",
    "longitude": "number",
    "address": "string"
  },
  "scheduledTime": "timestamp (optional)",
  "actualPickupTime": "timestamp (optional)",
  "actualDropoffTime": "timestamp (optional)",
  "estimatedPrice": "number",
  "actualPrice": "number (optional)",
  "estimatedDuration": "integer (minutes)",
  "actualDuration": "integer (minutes, optional)",
  "rideType": "string (standard|premium|shared)",
  "paymentMethodId": "string (optional)",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "rideSuggestionId": "string (reference to rideSuggestions collection, optional)",
  "tripSummaryId": "string (reference to tripSummaries collection, optional)"
}
```

**Relationships:**
- Many-to-one with `users` collection (via `userId`)
- Many-to-one with `drivers` collection (via `driverId`)
- One-to-one with `rideSuggestions` collection (via `rideSuggestionId`, optional)
- One-to-one with `tripSummaries` collection (via `tripSummaryId`, optional)

**Constraints:**
- `rideId` is unique (document ID)
- `status` must be one of: pending, accepted, in_progress, completed, cancelled
- `userId` must reference existing user

---

### 4. RideSuggestions Collection
**Collection Path:** `rideSuggestions/{suggestionId}`

**Document Structure:**
```json
{
  "suggestionId": "string (document ID)",
  "userId": "string (reference to users collection)",
  "pickupLocation": {
    "latitude": "number",
    "longitude": "number",
    "address": "string"
  },
  "dropoffLocation": {
    "latitude": "number",
    "longitude": "number",
    "address": "string"
  },
  "estimatedPrice": "number",
  "estimatedDuration": "integer (minutes)",
  "rideType": "string (standard|premium|shared)",
  "suggestedDrivers": [
    {
      "driverId": "string",
      "estimatedArrivalTime": "integer (minutes)",
      "distance": "number (km)"
    }
  ],
  "source": "string (voice|chat|manual)",
  "createdAt": "timestamp",
  "expiresAt": "timestamp",
  "isAccepted": "boolean",
  "acceptedRideId": "string (reference to rides collection, optional)"
}
```

**Relationships:**
- Many-to-one with `users` collection (via `userId`)
- One-to-one with `rides` collection (via `acceptedRideId`, when accepted)

**Constraints:**
- `suggestionId` is unique (document ID)
- `userId` must reference existing user

---

### 5. TripSummaries Collection
**Collection Path:** `tripSummaries/{summaryId}`

**Document Structure:**
```json
{
  "summaryId": "string (document ID)",
  "rideId": "string (reference to rides collection)",
  "userId": "string (reference to users collection)",
  "driverId": "string (reference to drivers collection)",
  "tripSummary": {
    "totalDistance": "number (km)",
    "totalDuration": "integer (minutes)",
    "totalCost": "number",
    "pickupLocation": "string",
    "dropoffLocation": "string",
    "route": [
      {
        "latitude": "number",
        "longitude": "number",
        "timestamp": "timestamp"
      }
    ],
    "stops": [
      {
        "location": {
          "latitude": "number",
          "longitude": "number",
          "address": "string"
        },
        "timestamp": "timestamp"
      }
    ]
  },
  "userRating": "number (0-5, optional)",
  "driverRating": "number (0-5, optional)",
  "userFeedback": "string (optional)",
  "driverFeedback": "string (optional)",
  "createdAt": "timestamp"
}
```

**Relationships:**
- One-to-one with `rides` collection (via `rideId`)
- Many-to-one with `users` collection (via `userId`)
- Many-to-one with `drivers` collection (via `driverId`)

**Constraints:**
- `summaryId` is unique (document ID)
- `rideId` must reference existing ride
- `userId` must reference existing user
- `driverId` must reference existing driver

---

### 6. ChatMessages Collection
**Collection Path:** `chatMessages/{messageId}`

**Document Structure:**
```json
{
  "messageId": "string (document ID)",
  "userId": "string (reference to users collection)",
  "sessionId": "string",
  "message": "string",
  "sender": "string (user|ai)",
  "intent": "string (optional)",
  "entities": {
    "pickupLocation": "string (optional)",
    "dropoffLocation": "string (optional)",
    "rideType": "string (optional)"
  },
  "aiResponse": "string (optional)",
  "suggestedActions": ["string"],
  "rideSuggestionId": "string (reference to rideSuggestions collection, optional)",
  "timestamp": "timestamp",
  "createdAt": "timestamp"
}
```

**Relationships:**
- Many-to-one with `users` collection (via `userId`)
- Many-to-one with `rideSuggestions` collection (via `rideSuggestionId`, optional)

**Constraints:**
- `messageId` is unique (document ID)
- `userId` must reference existing user
- `sender` must be either "user" or "ai"

---

### 7. UserPreferences Collection
**Collection Path:** `userPreferences/{preferenceId}`

**Document Structure:**
```json
{
  "preferenceId": "string (document ID)",
  "userId": "string (reference to users collection)",
  "language": "string (default: en)",
  "currency": "string (default: USD)",
  "notificationSettings": {
    "pushEnabled": "boolean",
    "emailEnabled": "boolean",
    "smsEnabled": "boolean",
    "rideUpdates": "boolean",
    "promotions": "boolean"
  },
  "ridePreferences": {
    "defaultRideType": "string (standard|premium|shared)",
    "preferredPaymentMethod": "string",
    "accessibilityNeeds": "string (optional)"
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Relationships:**
- One-to-one with `users` collection (via `userId`)

**Constraints:**
- `preferenceId` is unique (document ID)
- `userId` must reference existing user and be unique within this collection

---

## Indexes Required

### Composite Indexes:
1. **rides** collection:
   - `userId` + `status` + `createdAt` (for querying user rides by status)
   - `driverId` + `status` + `createdAt` (for querying driver rides by status)
   - `status` + `createdAt` (for querying all rides by status)

2. **rideSuggestions** collection:
   - `userId` + `createdAt` (for querying user suggestions)
   - `isAccepted` + `expiresAt` (for cleaning up expired suggestions)

3. **chatMessages** collection:
   - `userId` + `sessionId` + `timestamp` (for querying chat history)
   - `sessionId` + `timestamp` (for querying session messages)

---

## Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Drivers collection
    match /drivers/{driverId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == driverId;
    }
    
    // Rides collection
    match /rides/{rideId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == resource.data.driverId);
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == resource.data.driverId);
    }
    
    // RideSuggestions collection
    match /rideSuggestions/{suggestionId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow write: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // TripSummaries collection
    match /tripSummaries/{summaryId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == resource.data.driverId);
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == resource.data.driverId);
    }
    
    // ChatMessages collection
    match /chatMessages/{messageId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow write: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // UserPreferences collection
    match /userPreferences/{preferenceId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow write: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

---

## Summary

**Total Collections:** 7
- users
- drivers
- rides
- rideSuggestions
- tripSummaries
- chatMessages
- userPreferences

**Key Relationships:**
- Users → Rides (one-to-many)
- Drivers → Rides (one-to-many)
- Rides → RideSuggestions (one-to-one, optional)
- Rides → TripSummaries (one-to-one, optional)
- Users → UserPreferences (one-to-one)
- Users → ChatMessages (one-to-many)
- ChatMessages → RideSuggestions (many-to-one, optional)

**Database Engine:** Firebase Firestore (configured and ready for use)

