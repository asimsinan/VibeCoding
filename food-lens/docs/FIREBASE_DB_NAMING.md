# Firestore Database Naming Guide

## Recommended Database Name

**Use: `(default)`** ✅

This is the recommended name for your first Firestore database in Firebase Console.

## Why "(default)"?

1. **Code Compatibility**: Your code uses `getFirestore(this.app)` which automatically connects to the default database
2. **Simplicity**: No need to specify database name in code
3. **Best Practice**: Firebase recommends using "(default)" for single-database projects
4. **No Code Changes**: Works immediately with your current implementation

## Setup Steps in Firebase Console

1. Go to **Firestore Database** in Firebase Console
2. Click **Create database**
3. Choose **Production mode** (we'll add security rules)
4. Select a **location** (choose closest to your users)
5. **Database ID**: Leave as `(default)` or enter `(default)` explicitly
6. Click **Enable**

## Alternative: Custom Database Name

If you want a custom name (e.g., `foodlens-db`), you would need to update the code:

**Current code (uses default):**
```typescript
this.db = getFirestore(this.app);
```

**Updated code (custom name):**
```typescript
this.db = getFirestore(this.app, 'foodlens-db');
```

**But this is NOT recommended** because:
- Requires code changes
- Adds unnecessary complexity
- Default database is standard for single-database apps

## Multiple Databases

Firebase allows multiple databases per project, but for this app:
- **One database is sufficient**
- **Use "(default)"**
- This matches your current code implementation

## Verification

After creating the database:
1. Check it appears in Firebase Console → Firestore Database
2. Database ID should show as `(default)` or `(default)`
3. Your code will automatically connect to it

---

**Recommendation**: Use `(default)` - it's the simplest and matches your current code implementation.

