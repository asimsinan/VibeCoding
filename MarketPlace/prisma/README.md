# Database Layer

This directory contains the database schema, migrations, and seeding scripts for the marketplace application.

## Files

- `schema.prisma` - Prisma schema definition
- `migrations/` - Database migration files
- `seed.ts` - Database seeding script

## Setup

1. Install dependencies:
   ```bash
   npm install prisma @prisma/client
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database URL
   ```

3. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

4. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Seed the database:
   ```bash
   npx prisma db seed
   ```

## Schema Overview

The database schema includes:
- Users and profiles
- Products and categories
- Orders and order statuses
- Notifications and notification types
- Image uploads
- Payment intents and refunds
- User preferences

## Models

### Core Models
- `User` - User accounts
- `UserProfile` - User profile information
- `Product` - Product listings
- `Order` - Purchase orders
- `Notification` - User notifications

### Supporting Models
- `Category` - Product categories
- `ImageUpload` - Image file metadata
- `PaymentIntent` - Stripe payment intents
- `Refund` - Payment refunds
- `UserPreferences` - User notification preferences

## Enums

- `OrderStatus` - Order status values
- `NotificationType` - Notification type values
- `NotificationCategory` - Notification category values
