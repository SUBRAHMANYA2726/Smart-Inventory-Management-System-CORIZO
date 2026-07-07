# Inventory OS - Premium Inventory Management System

## Introduction

Inventory OS is a modern CRUD web application for managing inventory items through a premium dashboard interface. CRUD stands for Create, Read, Update, and Delete, which are the four core operations used by most data-driven business applications.

## Objectives

- Create new inventory records.
- Read and search existing records.
- Update item details such as name, description, quantity, and price.
- Delete records that are no longer needed.
- Store all records persistently in MongoDB Atlas, with SQLite available as a local fallback.
- Track category, supplier, SKU, barcode, images, purchase date, expiry date, minimum stock, status, and timestamps.
- View dashboard statistics, charts, recent activity, top products, and low-stock alerts.
- Export inventory data as CSV, Excel, print view, or browser PDF.

## Technology Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Python Flask
- Database: MongoDB Atlas
- Charts: Chart.js
- Icons: Lucide Icons

Flask was chosen because it is simple, lightweight, and suitable for a minor web development project. MongoDB Atlas was chosen because it provides cloud-based document storage and works well with JSON-style data used by web APIs. Chart.js and Lucide Icons provide professional analytics and dashboard visuals.

## System Architecture

User <-> Frontend (HTML/CSS/JavaScript) <-> Flask API <-> MongoDB Atlas

## Database Design

Collection: `items`

| Field | Type | Description |
| --- | --- | --- |
| Field | Type | Description |
| --- | --- | --- |
| `_id` | ObjectId | Unique MongoDB document ID |
| `name` | String | Name of the inventory item |
| `description` | String | Optional item details |
| `quantity` | Number | Available stock count |
| `price` | Number | Price per unit |
| `category` | String | Product category |
| `supplier` | String | Supplier name |
| `sku` | String | Internal stock keeping unit |
| `barcode` | String | Product barcode |
| `purchase_date` | String | Purchase date |
| `expiry_date` | String | Expiry date |
| `min_stock` | Number | Minimum stock alert threshold |
| `status` | String | Active, Low Stock, Out of Stock, or Archived |
| `image` | String | Product image data URL |
| `created_at` | String | Record creation timestamp |
| `updated_at` | String | Last update timestamp |

## UI/UX Features

- Glassmorphism dashboard layout.
- Dark and light mode.
- Responsive design for desktop, laptop, tablet, Android, and iPhone.
- Toast notifications and loading spinner.
- Delete confirmation modal.
- Live search, category filter, sorting, and pagination.
- Sticky modern data table with action icons.
- Keyboard shortcuts: `Ctrl + K` for search and `Ctrl + N` for new product.
- Recent activity log and top products section.
- Dashboard cards for total products, low stock, inventory value, and today's updates.
- Charts for inventory value, category distribution, stock trend, and monthly updates.

## API Endpoints

| Operation | Method | Endpoint | Purpose |
| --- | --- | --- | --- |
| Read | `GET` | `/api/items` | Fetch all inventory items |
| Create | `POST` | `/api/items` | Add a new item |
| Update | `PUT` | `/api/items/<id>` | Modify an existing item |
| Delete | `DELETE` | `/api/items/<id>` | Remove an item |

## How to Run

```bash
python -m pip install -r requirements.txt
$env:MONGODB_URI="your-mongodb-atlas-connection-string"
python app.py
```

Open this URL in a browser:

```text
http://127.0.0.1:5000/
```

## Future Scope

- User login and authentication.
- Category management.
- Pagination for large inventories.
- Export inventory as CSV or PDF.
- Low-stock alerts.
