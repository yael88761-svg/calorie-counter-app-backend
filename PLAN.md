---
name: Calorie Counter Full Stack
overview: בניית אפליקציית ספירת קלוריות full-stack עם Angular + Angular Material בצד הלקוח, Node.js/Express + MongoDB בצד השרת, JWT auth, שליחת מייל שבועי עם Nodemailer + node-cron, ו-546 מוצרים מ-CSV.
todos:
  - id: backend-setup
    content: הגדרת index.js, config/db.js, התקנת כל חבילות Backend (bcryptjs, jsonwebtoken, node-cron, nodemailer, chartjs-node-canvas, csv-parser)
    status: in_progress
  - id: models
    content: "יצירת 3 Models: User.js, Product.js, DailyLog.js"
    status: pending
  - id: auth-routes
    content: יצירת auth.routes.js + auth.controller.js (register/login עם bcrypt + JWT) + auth.middleware.js + admin.middleware.js
    status: pending
  - id: product-routes
    content: יצירת product.routes.js + product.controller.js (CRUD + חיפוש עם regex) + scripts/seed.js לייבוא CSV
    status: pending
  - id: log-routes
    content: יצירת log.routes.js + log.controller.js (basket management, history, חישוב קלוריות)
    status: pending
  - id: user-routes
    content: יצירת user.routes.js + user.controller.js (profile, admin user management)
    status: pending
  - id: email-chart-cron
    content: יצירת services/email.service.js + services/chart.service.js (PNG) + jobs/weekly-email.job.js (node-cron Sunday)
    status: pending
  - id: angular-setup
    content: יצירת פרויקט Angular ב-frontend/ עם Angular Material, הגדרת routing, guards, JWT interceptor
    status: pending
  - id: angular-auth
    content: דפי Login + Register + AuthService
    status: pending
  - id: angular-dashboard
    content: "Dashboard: ProductSearch (autocomplete+debounce), BasketComponent, ProgressBar, UnitSelector"
    status: pending
  - id: angular-history
    content: "דף History: טבלה + גרף שבועי עם ng2-charts"
    status: pending
  - id: angular-products
    content: "דף My Products: הוספה/מחיקה של מוצרים פרטיים"
    status: pending
  - id: angular-admin
    content: "דף Admin: ניהול מוצרים גלובליים + ניהול משתמשים (route-guarded)"
    status: pending
  - id: angular-profile
    content: "דף Profile: עריכת פרטים אישיים + יעד קלוריות"
    status: pending
isProject: false
---

# תוכנית: Calorie Counter Full Stack App

> **מסונכרן עם דרישות המורה (PDF)**

## מבנה הפרויקט הסופי

```
calorie-counter/                      ← תיקייה ראשית
├── backend/                          ← Node.js + Express
│   ├── index.js
│   ├── package.json
│   ├── .env
│   ├── README.md
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── DailyLog.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── product.routes.js
│   │   ├── log.routes.js
│   │   └── user.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── product.controller.js
│   │   ├── log.controller.js
│   │   └── user.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js     ← JWT verify
│   │   ├── admin.middleware.js    ← role check
│   │   └── logger.middleware.js  ← custom factory middleware (חובה!)
│   ├── uploads/                  ← תמונות פרופיל (multer)
│   ├── services/
│   │   ├── email.service.js      ← Nodemailer
│   │   └── chart.service.js      ← Chart.js → PNG
│   ├── jobs/
│   │   └── weekly-email.job.js   ← node-cron (every Sunday)
│   ├── scripts/
│   │   └── seed.js               ← CSV → MongoDB
│   └── data/
│       └── products.csv
└── frontend/                         ← Angular project
    ├── .env
    ├── README.md
    └── calorie-frontend/
        └── src/app/...
```

---

## שלב 1 – Backend: Models

**שימוש ב-Mongoose functions** — חובה לפי PDF: `pre`, `static`, `toJSON`

### [`models/User.js`](models/User.js)
```js
{ name, email, password (bcrypt), role: 'user'|'admin',
  calorieGoal: { type: Number, default: 2000 },
  age, gender, weight, height,
  profileImage: String,  // ← שם קובץ מ-multer
  createdAt }
// pre('save'): hash סיסמה לפני שמירה
// toJSON: הסרת שדה password מה-response
```

### [`models/Product.js`](models/Product.js)
```js
{ name, caloriesPer100g,
  servingSizes: { type: Map, of: Number },
  imageUrl: String,
  createdBy: ObjectId|null }  // null = global
// static findGlobalAndUserProducts(userId, search): מחזיר גלובליים + של המשתמש
```

### [`models/DailyLog.js`](models/DailyLog.js)
```js
{ userId, date: 'YYYY-MM-DD',
  targetCalories,
  totalCaloriesConsumed,
  items: [{ productId, productName, unit, quantity, calories }] }
// unique index: { userId, date }
// toJSON: מוסיף שדה מחושב 'goalMet' (totalCaloriesConsumed <= targetCalories)
```

---

## שלב 2 – Backend: API Routes

### Auth (`/api/auth`)
- `POST /register` — bcrypt hash, JWT response
- `POST /login` — verify password, JWT response

### Products (`/api/products`)
- `GET /?search=` — returns global + user's own (debounce-friendly)
- `POST /` — user adds private product; admin adds global (createdBy=null)
- `DELETE /:id` — user deletes own; admin deletes any
- `GET /my` — user's private products only

### Daily Log (`/api/logs`)
- `GET /today` — fetch or create today's log (upsert by userId+date)
- `GET /:date` — fetch specific date
- `POST /add` — `{ productId, unit, quantity }` → calculate calories → push to items[], $inc totalCalories
- `DELETE /item/:itemId` — remove item from today's basket, $inc totalCalories negatively
- `GET /history` — all logs for user sorted by date

### Users (`/api/users`)
- `GET /profile` — own profile
- `PUT /profile` — edit name, calorieGoal, age, gender, etc.
- `PUT /profile/image` — **multer** upload תמונת פרופיל
- `GET /` *(admin)* — list all users
- `DELETE /:id` *(admin)*
- `PUT /:id/role` *(admin)* — change role

---

## שלב 3 – Backend: Middleware & Services

### JWT Middleware ([`middleware/auth.middleware.js`](middleware/auth.middleware.js))
- מאמת Authorization header, מוסיף `req.user` לכל request

### Admin Middleware ([`middleware/admin.middleware.js`](middleware/admin.middleware.js))
- בודק `req.user.role === 'admin'`

### Logger Middleware Factory ([`middleware/logger.middleware.js`](middleware/logger.middleware.js)) — **חובה לפי PDF**
- **middleware creator** — פונקציה שמחזירה middleware
- בסביבת `development`: מדפיסה לוג לקונסול (method, url, status, time)
- בסביבת `production`: כותבת לוג לקובץ `logs/access.log`
- דוגמה לשימוש: `app.use(createLogger({ env: process.env.NODE_ENV }))`

### File Upload ([`middleware/upload.middleware.js`](middleware/upload.middleware.js)) — **multer - חובה לפי PDF**
- multer מגדיר `storage` לתיקיית `uploads/`
- לשימוש בנתיב `PUT /api/users/profile` (העלאת תמונת פרופיל)

### Email Service ([`services/email.service.js`](services/email.service.js))
- Nodemailer + Gmail SMTP (נתונים ב-.env)
- פונקציה `sendWeeklyReport(user, weekLogs)`

### Chart Service ([`services/chart.service.js`](services/chart.service.js))
- Chart.js + `chartjs-node-canvas` → PNG Buffer
- גרף עמודות: יום בציר X, קלוריות בציר Y, קו יעד בצבע אחר

### Weekly Email Job ([`jobs/weekly-email.job.js`](jobs/weekly-email.job.js))
- `node-cron`: כל יום ראשון ב-08:00
- שולף 7 ימים אחרונים לכל משתמש
- מחשב: סך קלוריות, ימי עמידה ביעד, יום הטוב/גרוע
- מייצר PNG גרף ושולח מייל HTML מעוצב

---

## שלב 4 – Backend: Seed Script

### [`scripts/seed.js`](scripts/seed.js)
- קורא `backend/products.csv`
- ממפה עמודות CSV לסכמת Product:
  - `calories per 100 grams` → `caloriesPer100g`
  - teaspoon/tablespoon/cup/slice/single → `servingSizes Map`
  - `url` → `imageUrl`
  - `createdBy: null` (global products)
- מוסיף npm script: `"seed": "node scripts/seed.js"`

---

## שלב 5 – Frontend: Angular

### יצירה
```bash
cd frontend
ng new calorie-frontend --routing --style=scss
ng add @angular/material
```

**RTL**: בגלל שהאפליקציה בעברית — `dir="rtl"` על `<html>` + `@use '@angular/material' as mat` עם `$direction: rtl`

### מבנה תיקיות (Feature-Based — חובה לפי PDF)
```
src/app/
├── core/
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── admin.guard.ts
│   ├── interceptors/
│   │   └── jwt.interceptor.ts      ← מוסיף Authorization header לכל בקשה
│   └── services/
│       ├── auth.service.ts
│       └── product.service.ts, log.service.ts, user.service.ts
├── store/                           ← NgRx (Redux equivalent — חובה לפי PDF)
│   ├── auth/auth.actions.ts + auth.reducer.ts + auth.effects.ts + auth.selectors.ts
│   └── logs/logs.actions.ts + ...
├── features/
│   ├── auth/
│   │   ├── login/login.component.ts
│   │   └── register/register.component.ts
│   ├── dashboard/
│   │   ├── dashboard.component.ts
│   │   ├── basket/basket.component.ts
│   │   └── progress-bar/progress-bar.component.ts
│   ├── history/history.component.ts
│   ├── my-products/
│   │   └── product-form/product-form.component.ts   ← אותו form לhוספה ועריכה
│   ├── admin/admin.component.ts
│   └── profile/profile.component.ts
└── shared/
    ├── product-search/product-search.component.ts   ← autocomplete + debounce
    └── navbar/navbar.component.ts                   ← תפריט לפי role
```

### דפים ונתיבים
- `/login` — LoginComponent — ללא guard
- `/register` — RegisterComponent — ללא guard
- `/dashboard` — DashboardComponent — AuthGuard
- `/history` — HistoryComponent — AuthGuard
- `/my-products` — MyProductsComponent — AuthGuard
- `/my-products/new` — ProductFormComponent — AuthGuard
- `/my-products/edit/:id` — ProductFormComponent (עם ID) — AuthGuard
- `/profile` — ProfileComponent — AuthGuard
- `/admin` — AdminComponent — AdminGuard

### דרישות מרכזיות לפי PDF
- **Reactive Forms** (Angular) — לכל הטפסים (register, login, add-product, profile)
- **Validators** בצד לקוח: required, email, minLength, custom password validator
- **NgRx Store** — ניהול state של auth (user, token) ו-logs (basket)
- **RTL** — כיוון קריאה ימין לשמאל לכל קומפוננטות Angular Material
- **Responsive** — שני גדלי מסך: desktop (4 מוצרים בשורה) ו-mobile (2 בשורה) + hamburger menu
- **URL params לחיפוש** — `/dashboard?search=חומוס` מעדכן URL בכל חיפוש
- **ProductFormComponent** — אותו component לhוספה ועריכה לפי נוכחות `:id`
- **NavbarComponent** — מציג קישורים שונים לפי role (admin/user/guest)
- **HttpClient** (Angular built-in) — במקום axios
- **ספרייה נוספת**: `ngx-toastr` להתראות (success/error notifications)

### רכיבים מרכזיים
- **ProgressBar**: ירוק < 100%, כתום 100-120%, אדום > 120% מהיעד
- **ProductSearch**: `mat-autocomplete` + `debounceTime(300)` + RxJS
- **UnitSelector**: מציג רק יחידות קיימות ב-`servingSizes` של המוצר
- **WeeklyChart**: `ng2-charts` / Chart.js לדף ההיסטוריה

---

## שלב 6 – חבילות להוסיף

### Backend
```bash
npm install bcryptjs jsonwebtoken node-cron nodemailer chartjs-node-canvas chart.js csv-parser multer express-validator
```
- `bcryptjs` — hash סיסמאות
- `jsonwebtoken` — JWT
- `node-cron` — cron job שבועי
- `nodemailer` — שליחת מייל (bonus API לפי PDF)
- `chartjs-node-canvas` + `chart.js` — PNG גרף במייל
- `csv-parser` — ייבוא CSV
- `multer` — **חובה לפי PDF** — העלאת קבצים
- `express-validator` — ולידציה בצד שרת

### Frontend
```bash
ng add @angular/material
npm install @ngrx/store @ngrx/effects @ngrx/entity ng2-charts chart.js ngx-toastr
```
- `@angular/material` — ספריית עיצוב (חובה לפי PDF, כ-MUI לReact)
- `@ngrx/store + effects + entity` — **ניהול state** (Redux equivalent — חובה לפי PDF)
- `ng2-charts` + `chart.js` — גרפים בדף ההיסטוריה
- `ngx-toastr` — **ספרייה נוספת** (חובה לפי PDF) — notifications

---

## משתני סביבה

### Backend [`.env`](.env)
```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/calorie_tracker_db
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
```

### Frontend [`frontend/calorie-frontend/.env`](frontend/calorie-frontend/.env) (או `environment.ts`)
```env
API_URL=http://localhost:3000/api
```

---

## תאימות לדרישות המורה — סיכום

- CRUD — כל 4 פעולות על Products, Users, DailyLogs
- 2 סוגי משתמשים — user + admin
- אימות — JWT + bcrypt
- MongoDB — 3 אוספים עם קשרים (User ↔ Product ↔ DailyLog)
- Mongoose pre/static/toJSON — בכל המודלים
- Custom middleware factory — logger.middleware.js
- העלאת קבצים — multer (תמונת פרופיל)
- ספריית עיצוב — Angular Material (RTL)
- ניהול state — NgRx (Redux equivalent)
- Reactive Forms + Validators — בכל הטפסים
- ולידציה בצד שרת — express-validator
- Responsive — CSS Grid + Angular Material breakpoints
- GitHub + README — שני ה-repos
- API חיצוני — Nodemailer לשליחת מייל שבועי (bonus)
- מדיה — תמונות מוצרים (imageUrl) + תמונת פרופיל (multer upload)
- ספרייה נוספת frontend — ngx-toastr
- ספרייה נוספת backend — csv-parser

---

## סדר ביצוע (לפי סוכנים)

### Backend (סוכן 1)
1. `config/db.js` + `index.js` + `.env` + התקנת חבילות
2. Models: `User.js` (pre+toJSON), `Product.js` (static), `DailyLog.js` (toJSON)
3. `middleware/logger.middleware.js` (factory) + `middleware/auth.middleware.js` + `middleware/admin.middleware.js` + `middleware/upload.middleware.js` (multer)
4. Auth routes: register + login + `express-validator`
5. Product routes: CRUD + fuzzy search + `scripts/seed.js`
6. Log routes: basket (add/remove) + history
7. User routes: profile + image upload + admin panel
8. Services: email + chart (PNG) + cron job
9. `README.md` לbackend

### Frontend (סוכן 2)
10. `ng new` + Angular Material + NgRx + ngx-toastr + הגדרת RTL
11. Core: guards, JWT interceptor, services
12. NgRx store: auth slice + logs slice
13. Shared: NavbarComponent + ProductSearchComponent
14. Auth pages: Login + Register (Reactive Forms + Validators)
15. Dashboard: basket + progress bar + URL params לחיפוש
16. History page: טבלה + ng2-charts
17. My Products: ProductFormComponent (add/edit לפי ID)
18. Profile page: עריכה + העלאת תמונה
19. Admin page: ניהול מוצרים + משתמשים
20. Responsive CSS + RTL fixes + `README.md` לfrontend
