# 📦 Smart Inventory Management System

<div align="center">

![Inventory OS Banner](https://img.shields.io/badge/Inventory%20OS-Enterprise%20Dashboard-16A34A?style=for-the-badge&logo=databricks&logoColor=white)

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.1-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20Optional-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**A premium, enterprise-grade Inventory Management System** with a Notion-inspired minimal dashboard, full CRUD operations, real-time analytics, animated canvas background, and a clean REST API backend.

[Features](#features) · [Screenshots](#screenshots) · [Quick Start](#quick-start) · [API Reference](#api-reference) · [Configuration](#configuration)

</div>

---

## ✨ Features

### 🎨 UI / UX
- **Notion-inspired minimal design** — clean white sidebar, soft neutral backgrounds
- **Animated inventory canvas** — floating warehouse icons, barcodes, shelves, carts (subtle 15% opacity)
- **Glassmorphism navbar** with backdrop blur
- **Responsive** — Desktop → Laptop → Tablet → Mobile (iPhone & Android pixel-perfect)
- **Smooth animations** — fade-up cards, slide-in sidebar items, hover lift effects, ripple buttons
- **Dark mode toggle** support

### 📊 Dashboard & Analytics
- **5 KPI metric cards** — Total Products, Low Stock, Inventory Value, Today's Updates, Categories
- **3 interactive Chart.js charts** — Inventory Value bar chart, Category Donut, Stock Trend line chart
- **Recent Activity log** — live log of create/update/delete actions
- **Top Products** ranking by inventory value

### 📦 Inventory CRUD
| Operation | Description |
|-----------|-------------|
| ✅ Create | Add products with name, SKU, barcode, supplier, category, price, quantity, dates, image, description |
| 📖 Read   | Browse with live search, category filter, column sorting, pagination |
| ✏️ Update | Inline edit — form pre-fills on edit click |
| 🗑️ Delete | Confirm modal before deletion |

### 🔍 Advanced Table
- **Global live search** — name, SKU, barcode, supplier
- **Category filter** dropdown
- **Column sort** — name, category, price, quantity, date
- **Pagination** with page info
- **Export** to CSV, Excel (client-side), PDF (print)
- **Status badges** — Active, Low Stock, Out of Stock, Archived
- **Product thumbnails** from uploaded images

### 🔌 REST API
Full JSON API served by Flask with SQLite (default) or MongoDB Atlas backend.

---

## 🖼️ Screenshots

> The application has a Notion/Linear inspired clean aesthetic with a green accent palette.

| Dashboard | Inventory Table |
|-----------|----------------|
| Full KPI cards, charts, analytics | Sortable, searchable, paginated table |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- pip
- Git

### 1. Clone the repository

```bash
git clone https://github.com/SUBRAHMANYA2726/Smart-Inventory-Management-System-CORIZO.git
cd Smart-Inventory-Management-System-CORIZO
```

### 2. Create a virtual environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment (optional)

Copy the example file and fill in values:

```bash
cp .env.example .env
```

> **Note:** If no `.env` is provided, the app automatically falls back to **SQLite** (`database.db`).

### 5. Run the application

```bash
python app.py
```

Open your browser at **http://127.0.0.1:5000**

---

## ⚙️ Configuration

Create a `.env` file in the project root:

```env
# Leave MONGODB_URI blank to use SQLite (default)
MONGODB_URI=

# MongoDB Atlas (optional — for cloud storage)
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/
MONGODB_DATABASE=ECOM
MONGODB_COLLECTION=items
```

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | *(empty)* | MongoDB Atlas connection string. Leave blank for SQLite. |
| `MONGODB_DATABASE` | `ECOM` | MongoDB database name |
| `MONGODB_COLLECTION` | `items` | MongoDB collection name |

---

## 📡 API Reference

Base URL: `http://127.0.0.1:5000`

### Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/items` | List all items (supports `?search=`, `?category=`, `?sort=`, `?order=`, `?page=`, `?limit=`) |
| `POST` | `/api/items` | Create a new item |
| `PUT` | `/api/items/<id>` | Update an item |
| `DELETE` | `/api/items/<id>` | Delete an item |
| `GET` | `/api/stats` | Dashboard statistics |

### Example — Create Item

```bash
curl -X POST http://127.0.0.1:5000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Keyboard",
    "category": "Electronics",
    "quantity": 50,
    "price": 29.99,
    "supplier": "Acme Supply Co.",
    "sku": "SKU-2026-001",
    "status": "Active"
  }'
```

### Example — List Items with filters

```bash
# Search + category filter + sort
curl "http://127.0.0.1:5000/api/items?search=keyboard&category=Electronics&sort=price&order=desc&page=1&limit=20"
```

### Response Format

```json
{
  "items": [
    {
      "id": "1",
      "name": "Wireless Keyboard",
      "category": "Electronics",
      "quantity": 50,
      "price": 29.99,
      "supplier": "Acme Supply Co.",
      "sku": "SKU-2026-001",
      "barcode": "",
      "status": "Active",
      "min_stock": 5,
      "purchase_date": "",
      "expiry_date": "",
      "description": "",
      "image": "",
      "created_at": "2026-07-07T08:00:00+00:00",
      "updated_at": "2026-07-07T08:00:00+00:00"
    }
  ],
  "total": 1,
  "page": 1,
  "pages": 1
}
```

---

## 🗂️ Project Structure

```
Smart-Inventory-Management-System-CORIZO/
│
├── app.py              # Flask backend — REST API, SQLite + MongoDB
├── index.html          # Main SPA — full dashboard layout
├── style.css           # Premium Notion-inspired CSS design system
├── script.js           # Frontend JS — CRUD, charts, state management
│
├── requirements.txt    # Python dependencies
├── .env.example        # Environment variable template
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3, Flask 3.1 |
| **Database** | SQLite 3 (default) · MongoDB Atlas (optional) |
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| **Charts** | Chart.js |
| **Icons** | Lucide Icons |
| **Typography** | Inter · Manrope · Space Grotesk (Google Fonts) |
| **Animations** | CSS keyframes · Canvas API (background) |

---

## 🎨 Design System

Inspired by **Notion**, **Linear**, **Stripe**, **Apple**, and **Microsoft** design languages.

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#F7F7F5` | Page background |
| `--card` | `#FFFFFF` | Card surfaces |
| `--primary` | `#16A34A` | Buttons, links, focus |
| `--primary-l` | `#22C55E` | Hover states |
| `--accent` | `#4ADE80` | Highlights |
| `--text` | `#191919` | Primary text |
| `--text-2` | `#6B7280` | Secondary text |
| `--border` | `#E7E5E4` | Borders |
| `--hover` | `#F3F4F6` | Row / item hover |
| `--danger` | `#EF4444` | Delete / error |
| `--warning` | `#F59E0B` | Low stock alerts |

---

## 🔒 Security Notes

- **Never commit `.env`** — it's in `.gitignore`
- The SQLite `database.db` is also ignored — data stays local
- For production, use environment variables for all secrets
- MongoDB Atlas connection strings contain credentials — keep them private

---

## 📋 Field Reference

Each inventory item supports:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Product name |
| `category` | string | | Product category |
| `quantity` | integer | ✅ | Current stock |
| `price` | float | ✅ | Unit price (USD) |
| `supplier` | string | | Supplier name |
| `sku` | string | | Stock Keeping Unit |
| `barcode` | string | | Barcode / EAN |
| `status` | string | | Active · Low Stock · Out of Stock · Archived |
| `min_stock` | integer | | Reorder threshold |
| `purchase_date` | date | | When purchased |
| `expiry_date` | date | | Expiry / best-before |
| `description` | string | | Notes / specs |
| `image` | string | | Base64 product image |

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

## 👤 Author

**Subrahmanya** — CORIZO Minor Project

[![GitHub](https://img.shields.io/badge/GitHub-SUBRAHMANYA2726-181717?style=flat-square&logo=github)](https://github.com/SUBRAHMANYA2726)

---

<div align="center">
  Made with ❤️ as part of the CORIZO Internship Program
</div>
