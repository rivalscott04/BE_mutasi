# Database Scripts Summary

## Overview
After cleanup, only 6 essential scripts remain in the `backend/src/scripts/` folder.

## Remaining Scripts

### 1. `setup-database.ts` (8.3KB)
**Purpose**: Complete database setup script
**Command**: `npm run db:setup`
**Functionality**:
- Creates all tables and indexes
- Inserts default data (10 offices, 1 admin user)
- Fixes table structure (adds missing columns)
- Adds all foreign key constraints
- **This is the main script you should use**

### 2. `add-foreign-keys.ts` (3.7KB)
**Purpose**: Add foreign key constraints to existing tables
**Command**: `npm run db:add-fk`
**Functionality**:
- Adds 9 foreign key relationships
- Checks for existing constraints before adding
- Handles MariaDB limitations

### 3. `check-foreign-keys.ts` (1.7KB)
**Purpose**: Check status of foreign key constraints
**Command**: `npm run db:check-fk`
**Functionality**:
- Lists all foreign key constraints
- Verifies expected constraints exist
- Shows relationships between tables

### 4. `check-data.ts` (901B)
**Purpose**: Check data in database
**Command**: `npx ts-node src/scripts/check-data.ts`
**Functionality**:
- Shows offices data
- Shows users data
- Verifies admin user exists

### 5. `check-tables.ts` (989B)
**Purpose**: Check table structure
**Command**: `npx ts-node src/scripts/check-tables.ts`
**Functionality**:
- Lists all tables
- Shows table structure/columns
- Verifies offices table exists

### 6. `drop-all-tables.ts` (1.2KB)
**Purpose**: Reset database (drop all tables)
**Command**: `npx ts-node src/scripts/drop-all-tables.ts`
**Functionality**:
- Drops all tables (dangerous!)
- Use only for complete reset
- Run `npm run db:setup` after this

## Recommended Usage

### For New Setup:
```bash
npm run db:setup
```

### For Checking Status:
```bash
npm run db:check-fk
npx ts-node src/scripts/check-data.ts
npx ts-node src/scripts/check-tables.ts
```

### For Troubleshooting:
```bash
# If foreign keys are missing
npm run db:add-fk

# For complete reset (dangerous!)
npx ts-node src/scripts/drop-all-tables.ts
npm run db:setup
```

## Deleted Scripts
The following scripts were removed as they were duplicates or no longer needed:
- 13 migration-related scripts (consolidated into `setup-database.ts`)
- 8 seed scripts (replaced by `setup-database.ts`)
- 2 debug scripts (no longer needed)

## Benefits of Cleanup
1. **Reduced confusion** - Only essential scripts remain
2. **Better maintainability** - Single source of truth for setup
3. **Cleaner codebase** - Removed 23 unnecessary files
4. **Simplified workflow** - One command (`npm run db:setup`) does everything
