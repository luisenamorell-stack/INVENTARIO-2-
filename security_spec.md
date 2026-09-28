# Security Specification: StockFlow Pro

## Data Invariants
- A Product must have a unique SKU and a name.
- A Warehouse must have a name, type, and location.
- Inventory records are tied to a Product and a Warehouse.
- InventoryMovements record changes in stock and must reference existing Products and Warehouses.

## The Dirty Dozen Payloads (Rejection Targets)
1. Creating a product with a 1MB name string.
2. Updating a product SKU (SKUs are immutable once assigned in this app's logic).
3. Deleting a warehouse that still has inventory.
4. Setting a negative quantity in an entry movement.
5. Spoofing a movement date to the past or future (must use server time).
6. Moving stock from a warehouse that doesn't exist.
7. Moving stock to a destination that doesn't exist.
8. Unauthorized user trying to list products.
9. Anonymous user trying to delete a product.
10. Modifying `createdAt` field on a product.
11. Injecting a ghost field `isAdmin: true` into a user profile (if it existed).
12. Updating inventory quantity without a corresponding movement record (though rules can't strictly enforce this without batch validation).
