# Security Specification - StockFlow Pro

## Data Invariants
1. Only authenticated users can read data.
2. Only verified admin users (listed in `admins/` collection) can write data (create, update, delete).
3. The user `Luisenamorell@gmail.com` is the bootstrap admin.
4. Timestamps (`createdAt`, `updatedAt`, `lastUpdated`) must be server-generated.
5. Quantities must be numbers.

## The "Dirty Dozen" Payloads

1. **Unauthenticated Read**: Try to list products without signing in.
2. **Guest Write**: Try to create a product as a signed-in user who is NOT an admin.
3. **Admin Email Spoof**: Try to write as an admin by providing a payload with `Luisenamorell@gmail.com` but with `email_verified: false`.
4. **Shadow Update**: Try to update a product with an extra `isAdmin: true` field.
5. **Malicious ID**: Try to create a warehouse with a 2MB string as ID.
6. **Orphaned Inventory**: Try to create an inventory item for a product that doesn't exist.
7. **Negative Quantity**: Try to set stock to -100.
8. **Future Timestamp**: Try to set `createdAt` to a date in 2030.
9. **Bypass Validation**: Try to create a product without a `category`.
10. **Admin Self-Promotion**: Try to add yourself to the `admins/` collection.
11. **Type Poisoning**: Try to set `costPrice` to a string "expensive".
12. **Resource Poisoning**: Try to set `description` to a 5MB string.

## Test Runner (Planned)
The test runner will verify these 12 scenarios.
