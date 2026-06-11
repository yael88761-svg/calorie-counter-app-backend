# Team Split — 2 Developers Working at the Same Time (No Waiting)

> **Main idea**: Split by feature domain — each developer owns Backend + Frontend for her features.
> Both can start on Day 1 and work until the end without stopping.

---

## Hour 0 — Shared Setup (Both do this at the same time, ~1 hour)

| Developer A | Developer B |
|-------------|-------------|
| Create `backend/` + `index.js` + `config/db.js` + `.env` + install all packages | Create `frontend/calorie-frontend/` with `ng new` + Angular Material + NgRx + RTL |
| Set up `package.json` scripts | Set up `environment.ts` + `app.module.ts` |
| Push to main | Push to main |

**Only sync point**: After 1 hour, both do `git pull`. Then each works on her own branch.

---

## Developer A — Auth + Users + Infrastructure

### Backend
```
middleware/
  ├── auth.middleware.js        <- checks JWT token
  ├── admin.middleware.js       <- checks if user is admin
  ├── logger.middleware.js      <- factory function (required!)
  └── upload.middleware.js      <- multer file uploads

models/
  └── User.js                   <- pre('save') hash password + toJSON

routes/ + controllers/
  ├── auth.routes.js + auth.controller.js    <- register, login
  └── user.routes.js + user.controller.js    <- profile, profile image, admin user management
```

### Frontend
```
core/
  ├── guards/auth.guard.ts + admin.guard.ts
  ├── interceptors/jwt.interceptor.ts
  └── services/auth.service.ts + user.service.ts

store/auth/
  ├── auth.actions.ts
  ├── auth.reducer.ts
  ├── auth.effects.ts
  └── auth.selectors.ts

features/
  ├── auth/login/login.component.ts         <- Reactive Form + Validators
  ├── auth/register/register.component.ts   <- Reactive Form + Validators
  └── profile/profile.component.ts          <- edit profile + upload image

shared/navbar/navbar.component.ts           <- show links based on user role
```

### What Developer A gives to Developer B:
> A file `api-contracts.ts` (see below) with TypeScript types for all API responses.
> Developer B uses these types and does not need to wait for the real server.

---

## Developer B — Products + Logs + Charts

### Backend
```
models/
  ├── Product.js    <- static findGlobalAndUserProducts
  └── DailyLog.js   <- unique index + toJSON goalMet

routes/ + controllers/
  ├── product.routes.js + product.controller.js    <- CRUD + search
  └── log.routes.js + log.controller.js            <- basket, history

scripts/seed.js        <- import 546 products from CSV
data/products.csv

services/
  ├── email.service.js       <- Nodemailer
  └── chart.service.js       <- Chart.js to PNG image

jobs/weekly-email.job.js     <- node-cron (every Sunday at 08:00)
```

### Frontend
```
core/services/
  ├── product.service.ts
  └── log.service.ts

store/logs/
  ├── logs.actions.ts
  ├── logs.reducer.ts
  ├── logs.effects.ts
  └── logs.selectors.ts

features/
  ├── dashboard/
  │   ├── dashboard.component.ts
  │   ├── basket/basket.component.ts
  │   └── progress-bar/progress-bar.component.ts
  ├── history/history.component.ts        <- table + ng2-charts
  ├── my-products/
  │   └── product-form/product-form.component.ts   <- add or edit by ID
  └── admin/admin.component.ts            <- manage products + users

shared/product-search/product-search.component.ts  <- autocomplete + debounce
```

---

## API Contract (api-contracts.ts) — Agreed on Day 1, Never Changes

> Both developers agree on this file before writing any code.

```typescript
// src/app/core/models/api.models.ts

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  calorieGoal: number;
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  profileImage?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Product {
  _id: string;
  name: string;
  caloriesPer100g: number;
  servingSizes: Record<string, number>;
  imageUrl?: string;
  createdBy: string | null;
}

export interface LogItem {
  _id: string;
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  calories: number;
}

export interface DailyLog {
  _id: string;
  userId: string;
  date: string;
  targetCalories: number;
  totalCaloriesConsumed: number;
  goalMet: boolean;
  items: LogItem[];
}
```

---

## Timeline

| Day | Developer A | Developer B |
|-----|-------------|-------------|
| 1 | Backend setup + User model + Auth middleware | Angular setup + NgRx + RTL + routing |
| 2 | Auth routes (register/login) + `api-contracts.ts` | Product model + product routes + seed.js |
| 3 | User routes + multer upload | Log model + log routes + basket logic |
| 4 | Login/Register components (Reactive Forms) | Dashboard + ProductSearch + ProgressBar |
| 5 | Profile component + Auth guards + JWT interceptor | History + ng2-charts + My Products |
| 6 | Navbar + NgRx auth store | Admin component + email service + cron job |
| 7 | Test Auth flow + integration | Test Products/Logs flow + integration |
| 8 | Final merge + integration + README | Final merge + integration + README |

---

## The Golden Rule

**Developer B does not wait for the Auth API.**
She writes `AuthService` with a mock that returns a fake token in dev mode, and replaces it with the real API on Day 7.

```typescript
// during development — Developer B is fully independent
export class AuthService {
  getToken(): string {
    return localStorage.getItem('token') ?? 'mock-token-for-dev';
  }
}
```

---

## Git Strategy

- Each developer works on her own branch: `feature/dev-a` and `feature/dev-b`
- Merge to `main` only when a full feature is done (backend + frontend together)
- Day 8 — merge both branches and do final integration
