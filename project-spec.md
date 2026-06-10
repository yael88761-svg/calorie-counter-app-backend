# Project Specification: Daily Calorie Tracker

## 1. Project Overview
A lightweight, high-performance daily calorie tracking application. The system prioritizes efficiency by avoiding itemized historical logs for users, instead maintaining a single aggregated daily caloric total per date.

### Tech Stack
- **Backend:** Node.js, Express.js, MongoDB (Mongoose)
- **Frontend:** Angular (v17+)
- **Database Environment:** Local MongoDB (`mongodb://localhost:27017/calorie_tracker_db`)

---

## 2. Database Architecture (MongoDB Schemas)

### Products Collection (`products`)
Stores global product data and custom user-defined products.
```javascript
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  caloriesPer100g: { type: Number, required: true },
  servingSizes: {
    type: Map,
    of: Number, // Example: { "cup": 200, "spoon": 15 } -> values represent weight in grams
    required: true
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null } 
  // null = Global Admin product; ObjectId = Private User product
});

module.exports = mongoose.model('Product', ProductSchema);
Daily Logs Collection (dailylogs)A lean collection designed to hold ONLY the aggregated daily summary per user. No individual meal history is stored.JavaScriptconst mongoose = require('mongoose');

const DailyLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  targetCalories: { type: Number, required: true, default: 2000 },
  totalCaloriesConsumed: { type: Number, required: true, default: 0 }
});

// Composite Unique Index: Enforces exactly one log document per user per day.
DailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', DailyLogSchema);
3. Work Breakdown Structure (WBS) & Task Division👩‍💻 Developer A: Product Catalog & Management Module (Full-Stack)Database & Data Ingestion[ ] Design and implement the Product Mongoose Schema.[ ] Write a one-time migration/seeding script to parse the raw product data file (CSV exported from Google Sheets) and inject it into the local MongoDB products collection.Backend Development (Node.js/Express)[ ] GET /api/products?search=... -> Implement a text/fuzzy search API that returns global products (createdBy: null) AND custom products created by the currently authenticated user (createdBy: req.user.id).[ ] POST /api/products -> Create an endpoint allowing users to add custom products, or admins to add global products.[ ] DELETE /api/products/:id -> Implement secure deletion. (Admins can delete any product; regular users can only delete products where createdBy === req.user.id).Frontend Development (Angular)[ ] Create ProductService for API interactions.[ ] Build the Product Search Component (input field with input debounce to throttle API requests).[ ] Build the Custom Product Form allowing users to create their own food items.[ ] Build the Admin Dashboard (Route guarded) enabling administrators to manage the global catalog.👩‍💻 Developer B: Daily Log, Calculations & Tracker Module (Full-Stack)Database Configuration[ ] Design and implement the DailyLog Mongoose Schema with the unique composite index.Backend Development (Node.js/Express)[ ] GET /api/logs/:date -> Fetch the log summary for a specific day. If no log exists for that date, initialize a new document with totalCaloriesConsumed: 0 and return it.[ ] POST /api/logs/:date/add -> Process consumption.Payload: { productId, unit, quantity }Logic: Fetch product data -> lookup unit weight in servingSizes -> calculate consumed calories using formula:$$\text{Calories} = \left( \frac{\text{caloriesPer100g}}{100} \right) \times (\text{quantity} \times \text{unitWeight})$$Database Update: Use MongoDB $inc operator to atomically increase totalCaloriesConsumed in the log document.[ ] POST /api/logs/:date/reduce -> Recalculate and apply negative $inc to adjust errors or accidental inputs.Frontend Development (Angular)[ ] Create LogService for API interactions.[ ] Build the Main Dashboard Component showcasing the daily summary.[ ] Implement a dynamic Progress Bar Component visualizing percentage completion towards the daily target ($(\text{consumed} / \text{target}) \times 100$). Style dynamically (e.g., green for under target, red/warning for exceeding target).[ ] Build the Quantity & Unit Selection Form that wraps around Developer A's search component, dynamically rendering only the available units (servingSizes keys) for the selected food item.4. Integration ContractDeveloper A and Developer B must agree on the Product JSON structure structure before development begins. Developer B's consumption calculator relies directly on Developer A's caloriesPer100g and servingSizes payload scheme.