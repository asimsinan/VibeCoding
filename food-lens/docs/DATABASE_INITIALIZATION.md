# Food Lens Database Initialization Guide

**Version**: 1.0.0  
**Last Updated**: 2025-01-27

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Migration Scripts](#migration-scripts)
5. [Data Seeding](#data-seeding)
6. [Database Setup](#database-setup)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

## Overview

Food Lens uses Firebase Firestore as its database. While Firestore is schemaless, we provide migration scripts to ensure proper database structure, indexes, and initial data setup.

### Database Collections

- **users**: User profiles and authentication data
- **scans**: Food label scan records
- **alternatives**: Healthier alternative suggestions cache
- **_migrations**: Migration tracking (internal)

## Prerequisites

### Required

- Firebase project created
- Firebase credentials configured
- Node.js and npm installed
- Access to Firebase Console

### Firebase Setup

1. Create Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Get Firebase configuration keys
4. Set environment variables (see `config/env.example.md`)

## Initial Setup

### Step 1: Run Database Setup

For a fresh installation:

```bash
# Development environment
npx tsx scripts/database/setup.ts setup development

# Testing environment
npx tsx scripts/database/setup.ts setup testing

# Production environment (migrations only, no seeding)
npx tsx scripts/database/setup.ts setup production
```

This will:
1. ✅ Run all database migrations
2. ✅ Create necessary collections
3. ✅ Set up indexes (documentation)
4. ✅ Seed initial data (dev/testing only)

### Step 2: Verify Setup

```bash
npx tsx scripts/database/setup.ts verify
```

## Migration Scripts

### Overview

Migration scripts ensure database structure is consistent across environments and handle schema changes over time.

### Running Migrations

```bash
# Run all pending migrations
npx tsx scripts/database/migrate.ts migrate

# Rollback to specific version
npx tsx scripts/database/migrate.ts rollback 1.0.0
```

### Available Migrations

#### Migration 1.0.0: Initial Database Schema

**Description**: Sets up initial database collections and structure.

**Actions**:
- Creates `users` collection structure
- Creates `scans` collection structure
- Creates `alternatives` collection structure
- Adds schema version markers

**Run**:
```bash
npx tsx scripts/database/migrate.ts migrate
```

#### Migration 1.1.0: Add Indexes for Scan Queries

**Description**: Documents and verifies required Firestore indexes.

**Actions**:
- Documents required composite indexes
- Verifies collection structure
- Notes index creation requirements

**Note**: Composite indexes must be created manually in Firebase Console.

**Required Indexes**:

1. **scans collection**:
   - Fields: `userId` (ASC), `createdAt` (DESC)
   - Purpose: User scan history queries
   
2. **scans collection**:
   - Fields: `status` (ASC), `createdAt` (DESC)
   - Purpose: Pending scan processing

**Creating Indexes in Firebase Console**:

1. Go to Firebase Console > Firestore > Indexes
2. Click "Create Index"
3. Add required fields in order specified
4. Click "Create"

## Data Seeding

### Overview

Data seeding generates realistic sample data for development and testing environments.

### Running Seeder

```bash
# Seed development environment (5 users, 20 scans)
npx tsx scripts/database/seed.ts seed development

# Seed testing environment (10 users, 50 scans)
npx tsx scripts/database/seed.ts seed testing
```

### Generated Data

#### Sample Users

- 5 users (development) or 10 users (testing)
- Realistic names and emails
- Mixed languages (English/Turkish)
- Some with dietary restrictions
- Various scan counts

#### Sample Scans

- 20 scans (development) or 50 scans (testing)
- Mix of completed, pending, and processing status
- Realistic nutrition data
- Various allergens
- Historical dates (last 30 days)

### Clearing Seeded Data

```bash
# Clear all seeded data (use with caution)
npx tsx scripts/database/seed.ts clear
```

**Warning**: This is a placeholder. Manual cleanup through Firebase Console is recommended for safety.

## Database Setup

### Complete Setup Script

The `setup.ts` script runs both migrations and seeding:

```bash
# Complete setup for development
npx tsx scripts/database/setup.ts setup development

# Complete setup for testing
npx tsx scripts/database/setup.ts setup testing

# Production setup (migrations only)
npx tsx scripts/database/setup.ts setup production
```

### Setup Process

1. **Initialize Firebase**: Connect to Firebase project
2. **Run Migrations**: Apply all pending migrations
3. **Seed Data**: Generate sample data (dev/testing only)
4. **Verify**: Check database structure

## Production Deployment

### Production Setup Steps

1. **Configure Environment Variables**:
   ```bash
   export EXPO_PUBLIC_FIREBASE_API_KEY=your-production-key
   export EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-production-project
   # ... other variables
   ```

2. **Run Migrations Only**:
   ```bash
   npx tsx scripts/database/setup.ts setup production
   ```

3. **Create Indexes Manually**:
   - Go to Firebase Console
   - Navigate to Firestore > Indexes
   - Create required composite indexes (see Migration 1.1.0)

4. **Verify Setup**:
   ```bash
   npx tsx scripts/database/setup.ts verify
   ```

### Production Checklist

- ✅ Migrations run successfully
- ✅ All required indexes created
- ✅ Environment variables configured
- ✅ Firestore security rules configured
- ✅ Backup strategy in place
- ✅ Monitoring enabled

## Migration Procedures

### Creating New Migrations

1. **Create Migration File**:
   ```typescript
   {
     version: '1.2.0',
     description: 'Your migration description',
     up: async () => {
       // Migration logic
     },
     down: async () => {
       // Rollback logic (optional)
     },
   }
   ```

2. **Add to Migration Array**:
   Add to `migrations` array in `scripts/database/migrate.ts`

3. **Test Migration**:
   ```bash
   npx tsx scripts/database/migrate.ts migrate
   ```

### Data Transformation Procedures

For data transformations:

1. **Create Transformation Script**:
   ```typescript
   async function transformData() {
     // Read existing data
     // Transform as needed
     // Write back transformed data
   }
   ```

2. **Include in Migration**:
   Add transformation to migration `up` function

3. **Test Transformation**:
   Test on development data first

## Sample Data

### Sample User Data

```typescript
{
  uid: 'seed_user_1',
  email: 'john@example.com',
  displayName: 'John Doe',
  language: 'en',
  dietaryRestrictions: ['peanuts', 'dairy'],
  stats: {
    totalScans: 25,
    lastScanAt: new Date(),
  },
}
```

### Sample Scan Data

```typescript
{
  scanId: 'seed_scan_1',
  userId: 'seed_user_1',
  status: 'completed',
  nutritionData: {
    foodName: 'Chocolate Chip Cookies',
    calories: 150,
    nutrients: {
      protein: 2,
      carbs: 20,
      fat: 7,
    },
  },
  allergens: [
    {
      name: 'Milk',
      severity: 'medium',
    },
  ],
}
```

## Verification

### Verify Database Structure

```bash
npx tsx scripts/database/setup.ts verify
```

### Manual Verification

1. **Check Collections**:
   - Firebase Console > Firestore
   - Verify `users`, `scans`, `alternatives` collections exist

2. **Check Indexes**:
   - Firebase Console > Firestore > Indexes
   - Verify required indexes are created

3. **Check Sample Data** (dev/testing):
   - Verify users and scans exist
   - Check data structure is correct

## Troubleshooting

### Common Issues

#### Migration Fails

**Problem**: Migration script fails with errors

**Solutions**:
1. Check Firebase credentials are correct
2. Verify Firestore is enabled in Firebase Console
3. Check network connectivity
4. Review error messages in logs

#### Indexes Not Created

**Problem**: Required indexes missing

**Solutions**:
1. Create indexes manually in Firebase Console
2. Check index field order matches documentation
3. Wait for index creation to complete (can take time)

#### Seeding Fails

**Problem**: Data seeding fails or creates duplicate data

**Solutions**:
1. Clear existing data first (use Firebase Console)
2. Check Firestore security rules allow writes
3. Verify batch size doesn't exceed limits (500 documents)

#### Database Connection Issues

**Problem**: Cannot connect to Firebase

**Solutions**:
1. Verify environment variables are set
2. Check Firebase project ID is correct
3. Verify network connectivity
4. Check Firebase service status

## Additional Resources

- **Database Schema**: `docs/database-schema.md`
- **Firebase Setup**: `docs/FIREBASE_SETUP.md`
- **Firebase Collections**: `docs/FIREBASE_COLLECTIONS.md`
- **Migration Script**: `scripts/database/migrate.ts`
- **Seeder Script**: `scripts/database/seed.ts`
- **Setup Script**: `scripts/database/setup.ts`

---

**Last Updated**: 2025-01-27  
**Maintainer**: Food Lens Development Team

