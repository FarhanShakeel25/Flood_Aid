# Flood Aid - Database Schema Documentation

## Overview

This document describes the data models, database tables, relationships, and constraints for the Flood Aid application.

**Database System**: PostgreSQL 12+  
**ORM**: Entity Framework Core 10.0  
**Migrations**: Managed via Entity Framework Code-First approach

---

## Table of Contents

1. [Entity Relationship Diagram](#entity-relationship-diagram)
2. [Tables](#tables)
3. [Enumerations](#enumerations)
4. [Indexes](#indexes)
5. [Constraints](#constraints)
6. [Data Relationships](#data-relationships)

---

## Entity Relationship Diagram

```
┌─────────────────────┐       ┌──────────────────┐
│   AdminUser         │       │   Donation       │
├─────────────────────┤       ├──────────────────┤
│ PK: Id              │       │ PK: Id           │
│    Name             │       │    ReceiptId     │
│    Email            │       │    DonationType  │
│    Username         │       │    DonationDate  │
│    PasswordHash     │       │    Status        │
│    Role             │       │    DonorName     │
│    IsActive         │       │    DonorEmail    │
│    CreatedAt        │       │    Amount        │
│    LastLoginAt      │       │    Quantity      │
└─────────────────────┘       │    Description  │
                              │    AccountNumber │
                              └──────────────────┘
        
┌──────────────────────┐
│   HelpRequest        │
├──────────────────────┤
│ PK: Id               │
│    RequestType       │
│    RequestStatus     │
│    Description       │
│    Latitude          │
│    Longitude         │
│    RequestorName     │
│    RequestorEmail    │
│    RequestorPhone    │
└──────────────────────┘
```

---

## Tables

### 1. AdminUsers

Stores administrator user accounts with authentication credentials.

**Table Name**: `admin_users`

**Columns**:

| Column | Type | Null | Default | Constraints | Description |
| --- | --- | --- | --- | --- | --- |
| id | integer | No | auto-increment | PK, IDENTITY | Unique admin identifier |
| name | varchar(255) | No | - | NOT NULL, UNIQUE | Admin's full name |
| email | varchar(255) | No | - | NOT NULL, UNIQUE | Email address (login) |
| username | varchar(100) | No | - | NOT NULL, UNIQUE | Username (login) |
| password_hash | varchar(255) | No | - | NOT NULL | BCrypt hashed password |
| role | varchar(50) | No | 'super_admin' | NOT NULL, CHECK | Admin role/permission level |
| is_active | boolean | No | true | NOT NULL | Account activation status |
| created_at | timestamp | No | NOW() | NOT NULL | Account creation timestamp |
| last_login_at | timestamp | Yes | NULL | - | Last successful login time |

**Indexes**:
- `idx_admin_email` on `email` (for login)
- `idx_admin_username` on `username` (for login)

**Sample Data**:
```sql
INSERT INTO admin_users (name, email, username, password_hash, role, is_active, created_at)
VALUES (
  'System Admin',
  'admin@floodaid.org',
  'admin',
  '$2a$11$...',  -- bcrypt hash
  'super_admin',
  true,
  '2025-12-31 10:00:00'
);
```

**Notes**:
- Email and Username are unique identifiers for login
- PasswordHash is BCrypt hashed with work factor 11
- Role determines permissions (super_admin, admin, moderator)
- IsActive allows soft-disable without deletion

---

### 2. Donations

Records all monetary and supply donations to the platform.

**Table Name**: `donations`

**Columns**:

| Column | Type | Null | Default | Constraints | Description |
| --- | --- | --- | --- | --- | --- |
| id | integer | No | auto-increment | PK, IDENTITY | Unique donation record ID |
| receipt_id | varchar(36) | No | - | NOT NULL, UNIQUE | GUID for receipt/confirmation |
| donation_type | integer | No | - | NOT NULL, CHECK (0-4) | Type of donation (enum) |
| donation_date | timestamp | No | NOW() | NOT NULL | When donation was made |
| status | integer | No | 0 | NOT NULL, CHECK (0-3) | Current status (enum) |
| donor_name | varchar(255) | Yes | NULL | - | Donor's full name |
| donor_email | varchar(255) | Yes | NULL | - | Donor's email address |
| donor_account_number | varchar(100) | No | - | NOT NULL | Account/ID for tracking |
| donation_amount | decimal(10,2) | Yes | NULL | CHECK (>0) | Cash amount in PKR |
| quantity | integer | Yes | NULL | CHECK (>0) | Item count for supplies |
| supplies_description | text | Yes | NULL | - | Description of supplies |

**Indexes**:
- `idx_donation_receipt_id` on `receipt_id` (for lookup)
- `idx_donation_donor_email` on `donor_email` (for reporting)
- `idx_donation_status` on `status` (for admin dashboard)
- `idx_donation_date` on `donation_date` (for analytics)

**Sample Data**:
```sql
INSERT INTO donations (
  receipt_id, donation_type, donation_date, status,
  donor_name, donor_email, donor_account_number, donation_amount
)
VALUES (
  'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6',
  0,  -- CashDonation
  '2025-12-31 10:30:00',
  1,  -- Approved
  'John Doe',
  'john@example.com',
  'uuid-or-account-id',
  5000.00
);
```

**Enums**:

**DonationType**:
- `0`: CashDonation
- `1`: FoodSupplies
- `2`: MedicalSupplies
- `3`: ClothingSupplies
- `4`: OtherSupplies

**DonationStatus**:
- `0`: Pending (default, awaiting approval)
- `1`: Approved (admin approved)
- `2`: Rejected (admin rejected)
- `3`: Completed (fulfilled)

**Notes**:
- ReceiptId is auto-generated GUID for reference
- DonationAmount only for cash donations
- SuppliesDescription for in-kind donations
- Status tracks admin review process
- Donor can be anonymous (null name/email)

---

### 3. HelpRequests

Records supply requests from flood-affected areas.

**Table Name**: `help_requests`

**Columns**:

| Column | Type | Null | Default | Constraints | Description |
| --- | --- | --- | --- | --- | --- |
| id | integer | No | auto-increment | PK, IDENTITY | Unique request ID |
| request_type | integer | No | - | NOT NULL, CHECK (0-4) | Type of help needed (enum) |
| request_status | integer | No | 0 | NOT NULL, CHECK (0-3) | Current status (enum) |
| request_description | text | No | - | NOT NULL | Detailed request description |
| latitude | double | No | - | NOT NULL, CHECK (range) | GPS latitude coordinate |
| longitude | double | No | - | NOT NULL, CHECK (range) | GPS longitude coordinate |
| requestor_name | varchar(255) | Yes | NULL | - | Name of person requesting |
| requestor_email | varchar(255) | Yes | NULL | - | Contact email |
| requestor_phone_number | varchar(20) | Yes | NULL | - | Contact phone |

**Indexes**:
- `idx_help_request_status` on `request_status`
- `idx_help_request_location` on `(latitude, longitude)` (for geo queries)

**Sample Data**:
```sql
INSERT INTO help_requests (
  request_type, request_status, request_description,
  latitude, longitude, requestor_name, requestor_email
)
VALUES (
  1,  -- FoodSupplies
  0,  -- Pending
  'Need food and water for 200 people in shelter',
  31.5497,  -- Lahore latitude
  74.3436,  -- Lahore longitude
  'Ahmed Ali',
  'ahmed@shelter.org'
);
```

**Enums**:

**RequestType**:
- `0`: FoodSupplies
- `1`: MedicalSupplies
- `2`: ClothingSupplies
- `3`: ShelterNeeds
- `4`: OtherNeeds

**RequestStatus**:
- `0`: Pending (new request)
- `1`: Approved (verified and approved)
- `2`: Rejected (cannot fulfill)
- `3`: Completed (fulfilled)

**Notes**:
- Latitude/Longitude enable mapping of affected areas
- GPS coordinates stored as double precision
- Requestor contact info optional
- Used by admin to prioritize distribution

---

## Enumerations

### DonationType

```csharp
public enum DonationType
{
    CashDonation = 0,
    FoodSupplies = 1,
    MedicalSupplies = 2,
    ClothingSupplies = 3,
    OtherSupplies = 4
}
```

### DonationStatus

```csharp
public enum DonationStatus
{
    Pending = 0,      // Initial state, awaiting admin review
    Approved = 1,     // Admin verified and approved
    Rejected = 2,     // Admin rejected for policy reasons
    Completed = 3     // Donation received/utilized
}
```

### RequestType

```csharp
public enum RequestType
{
    FoodSupplies = 0,
    MedicalSupplies = 1,
    ClothingSupplies = 2,
    ShelterNeeds = 3,
    OtherNeeds = 4
}
```

### RequestStatus

```csharp
public enum RequestStatus
{
    Pending = 0,      // New request
    Approved = 1,     // Verified and scheduled for fulfillment
    Rejected = 2,     // Cannot fulfill
    Completed = 3     // Request fulfilled
}
```

---

## Indexes

**Purpose**: Optimize query performance for common operations.

### All Indexes

| Table | Index Name | Columns | Type | Purpose |
| --- | --- | --- | --- | --- |
| admin_users | PK_admin_users | id | PRIMARY | Unique identifier |
| admin_users | idx_admin_email | email | UNIQUE | Fast login lookup |
| admin_users | idx_admin_username | username | UNIQUE | Fast login lookup |
| donations | PK_donations | id | PRIMARY | Unique identifier |
| donations | idx_donation_receipt_id | receipt_id | UNIQUE | Receipt lookup |
| donations | idx_donation_donor_email | donor_email | B-TREE | Donor search |
| donations | idx_donation_status | status | B-TREE | Admin dashboard filtering |
| donations | idx_donation_date | donation_date | B-TREE | Analytics/reporting |
| help_requests | PK_help_requests | id | PRIMARY | Unique identifier |
| help_requests | idx_help_request_status | request_status | B-TREE | Status filtering |
| help_requests | idx_help_request_location | latitude, longitude | B-TREE | Geo queries |

---

## Constraints

### Primary Keys (PK)

All tables have surrogate integer primary keys with auto-increment:
```sql
id SERIAL PRIMARY KEY
```

### Unique Constraints

- `AdminUsers.Email` - Email must be unique for login
- `AdminUsers.Username` - Username must be unique for login
- `Donations.ReceiptId` - Receipt ID must be globally unique

### Foreign Keys

Currently, no foreign key relationships defined. Admin and Donation tables are separate.

**Future Enhancement**: Link completed donations to help requests:
```sql
ALTER TABLE donations ADD COLUMN help_request_id INTEGER REFERENCES help_requests(id)
```

### Check Constraints

| Table | Column | Constraint | Description |
| --- | --- | --- | --- |
| admin_users | role | IN ('super_admin', 'admin', 'moderator') | Role enumeration |
| donations | status | IN (0, 1, 2, 3) | Status enumeration |
| donations | donation_type | IN (0, 1, 2, 3, 4) | Type enumeration |
| donations | donation_amount | > 0 | Non-negative amount |
| donations | quantity | > 0 | Non-negative quantity |
| help_requests | request_type | IN (0, 1, 2, 3, 4) | Type enumeration |
| help_requests | request_status | IN (0, 1, 2, 3) | Status enumeration |
| help_requests | latitude | BETWEEN -90 AND 90 | Valid latitude |
| help_requests | longitude | BETWEEN -180 AND 180 | Valid longitude |

---

## Data Relationships

### Current Relationships

```
AdminUsers (1) ─────┐
                    │
                    └─ No foreign key to Donations
                    
Donations (many) ─┐
                  │
                  └─ No foreign key to HelpRequests

HelpRequests (many) ─┐
                     │
                     └─ Standalone, no FK
```

### Potential Future Relationships

```
AdminUser (1) ────────────┐
                          ├── ApprovedDonations (many)
                          
HelpRequest (1) ──────────┐
                          ├── FulfilledByDonations (many)
```

### Data Flow

```
DONATION WORKFLOW
─────────────────
User submits donation
    ↓
Backend creates Donation record (status=Pending)
    ↓
Email confirmation sent to donor
    ↓
Admin reviews in dashboard
    ↓
Admin approves/rejects
    ↓
Donation status updated
    ↓
Optional: Link to HelpRequest for fulfillment


HELP REQUEST WORKFLOW
────────────────────
Area coordinator submits request
    ↓
Backend creates HelpRequest record (status=Pending)
    ↓
Admin reviews location and need
    ↓
Admin approves request
    ↓
Donations matched to fulfill request
    ↓
Status updated to Completed
```

---

## Data Types Reference

| CLR Type | SQL Type | Size | Description |
| --- | --- | --- | --- |
| int | integer | 4 bytes | Integer ID values |
| string | varchar(n) | variable | Strings (max n chars) |
| string | text | variable | Large text (descriptions) |
| decimal | decimal(10,2) | 8 bytes | Money amounts (PKR) |
| double | double precision | 8 bytes | GPS coordinates |
| boolean | boolean | 1 byte | True/False flags |
| DateTime | timestamp | 8 bytes | Date and time |
| Guid | uuid | 16 bytes | Unique identifier |

---

## Common Queries

### Dashboard Statistics

```sql
-- Total donations by status
SELECT status, COUNT(*) as count, SUM(donation_amount) as total
FROM donations
GROUP BY status;

-- Recent donations (last 7 days)
SELECT * FROM donations
WHERE donation_date >= NOW() - INTERVAL '7 days'
ORDER BY donation_date DESC;

-- Pending approvals
SELECT * FROM donations
WHERE status = 0
ORDER BY donation_date ASC;

-- Help requests by type
SELECT request_type, COUNT(*) as count
FROM help_requests
GROUP BY request_type;
```

### Admin Management

```sql
-- List all active admins
SELECT * FROM admin_users
WHERE is_active = true
ORDER BY created_at DESC;

-- Admin login history
SELECT username, last_login_at
FROM admin_users
WHERE last_login_at IS NOT NULL
ORDER BY last_login_at DESC;
```

### Reporting & Analytics

```sql
-- Total cash donations
SELECT SUM(donation_amount) as total
FROM donations
WHERE donation_type = 0 AND status = 1;

-- Donation frequency by donor
SELECT donor_email, COUNT(*) as frequency, SUM(donation_amount) as total
FROM donations
WHERE donation_type = 0
GROUP BY donor_email
ORDER BY total DESC;

-- Geographic heat map
SELECT latitude, longitude, COUNT(*) as need_count
FROM help_requests
WHERE status IN (0, 1)
GROUP BY latitude, longitude;
```

---

## Database Maintenance

### Backup Strategy

```bash
# PostgreSQL backup (full database)
pg_dump floodaid > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql floodaid < backup_20251231_120000.sql
```

### Migration Management

```bash
# Apply pending migrations
dotnet ef database update

# Revert to previous migration
dotnet ef database update PreviousMigration

# Create new migration
dotnet ef migrations add DescriptiveChangeName
```

### Performance Optimization

1. **Index Usage**: Queries on status, email, and dates benefit from indexes
2. **Partitioning**: Consider partitioning Donations by year for large datasets
3. **Archiving**: Archive completed donations >1 year old
4. **Vacuum**: Run `VACUUM ANALYZE` periodically in PostgreSQL

---

## Security Considerations

### Data Protection

1. **Passwords**: BCrypt hashed (never stored plain text)
2. **Sensitive Fields**: Email addresses stored but not exposed in APIs
3. **PII**: Donor names/emails protected by role-based access
4. **Audit Trail**: CreatedAt/LastLoginAt track history

### Access Control

1. **Admin Only**: Only authenticated admins can approve donations
2. **Role-Based**: Different admin roles have different permissions
3. **Rate Limiting**: API endpoints rate-limited to prevent abuse

### Compliance

- **GDPR**: Support data deletion for donors (right to be forgotten)
- **PII Security**: Email addresses encrypted at rest (future enhancement)
- **Audit Logs**: Track who approves/rejects donations (future enhancement)

---

**Last Updated**: December 31, 2025  
**Version**: 1.0  
**EF Core Migration**: 20251228142302_InitialCreate
