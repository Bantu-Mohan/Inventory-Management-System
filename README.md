# 📦 Inventory Management System

A mobile-first Admin Dashboard designed for shop owners to manage inventory, track sales, and visualize business analytics efficiently. Built with modern web technologies and a real-time backend.

## 🚀 Features

- **📊 Comprehensive Dashboard**: A unified view for all your management needs.
- **📦 Inventory Management**: Track stock levels, set low-stock alerts, and manage product details.
- **➕ Add Stock**: Easy interface to restock existing items or add new products, with support for "loose" items and packs.
- **💸 Point of Sale**: Quick "Sell Item" interface that automatically updates inventory and records transactions.
- **📜 Sales History**: Detailed logs of all past transactions with filtering capabilities.
- **📈 Analytics**: Visual insights into sales trends and popular items using interactive charts.
- **🔐 Secure Authentication**: Email/Password login powered by Supabase.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Vanilla CSS (Custom Design System, Mobile-First)
- **Backend & Database**: Supabase (PostgreSQL, Auth, Real-time)
- **Visualization**: Recharts

## 📂 Project Structure

```
├── src/
│   ├── components/       # Core feature components (Inventory, SellItem, etc.)
│   ├── lib/             # Supabase client and utility functions
│   ├── App.jsx          # Main application layout and routing
│   ├── styles.css       # Global design system and component styles
│   └── main.jsx         # Entry point
├── supabase/            # SQL scripts for database schema and functions
├── .env                 # Environment variables
└── package.json         # Dependencies and scripts
```

## ⚙️ Setup & Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A [Supabase](https://supabase.com) project

### 1. Clone the repository

```bash
git clone <repository-url>
cd "Inventory management"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory based on `.env.example`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_LOW_STOCK_THRESHOLD=10
```

### 4. Database Setup

Run the SQL scripts located in the `supabase/` folder in your Supabase SQL Editor to sets up the necessary tables (`inventory`, `sales`) and RPC functions (`sell_item`, `add_stock`).

Recommended order:
1. `schema.sql` (Base tables)
2. `enable_auth_access.sql` (Permissions)
3. `restore_function.sql` / `create_add_stock_rpc.sql` (Logic functions)

### 5. Run the Application

```bash
npm run dev
```

The app will start at `http://localhost:5173`.

## 📜 Database Functions

We use PostgreSQL functions (RPC) to ensure data integrity during transactions:

- **`sell_item`**: Atomically decrements stock and records the sale to prevent race conditions.
- **`add_stock`**: Handles incoming stock logic, calculating total items available based on pack sizes.

## 🎨 Design System

The application uses a custom set of CSS variables for a consistent, dark-mode friendly aesthetic:

- **Colors**: Uses a semantic color scale (Primary, Surface, Border, Text).
- **Typography**: Modern sans-serif stack.
- **Components**: Reusable card-based layouts optimized for mobile touch targets.

---

*Built for efficiency and reliability.*
# Inventory-Management-System
