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
    content: יצירת פרויקט Angular ב-frontend/ עם Angular Material, הגדרת routing, guards, app.interceptor.ts
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
> **מקור אמת יחיד ומוחלט**: כל קובץ תכנון, חלוקת עבודה או מימוש חייב להתיישר לפי `PLAN.md`. במקרה של אי־התאמה, `PLAN.md` קובע.

## החלטות ארכיטקטורה מחייבות

- `Product.servingSizes` הוא תמיד מערך אובייקטים במבנה `{ unit: string, weightInGrams: number }` בכל שכבות המערכת: Mongoose schema, seed script, API responses, Angular models, UnitSelector וחישובי קלוריות.
- ה־HTTP interceptor היחיד הוא `src/app/core/interceptors/app.interceptor.ts`. הוא אחראי גם להזרקת JWT לכל request וגם לטיפול גלובלי בשגיאות עם `ngx-toastr`, לפי קטע הקוד המלא בהמשך המסמך.
- Developer A היא הבעלים הבלעדי של `src/app/core/services/auth.service.ts` ושל NgRx Auth Store. Developer B לא משנה את הקבצים האלה; בזמן פיתוח עצמאי היא משתמשת ב־localStorage/mock token helper בתוך branch הפיצ'ר שלה בלבד.
- Developer B בונה את השלד הראשי של `admin.component.ts` ואת לוגיקת ניהול המוצרים. Developer A מספקת את חוזי ה־API והאינטגרציה של ניהול המשתמשים, והחיבור הסופי נעשה לפי חוזים אלה.
- קובץ המוצרים ל־seed נמצא תמיד ב־`backend/data/products.csv`.
- העלאת תמונת פרופיל מתבצעת תמיד דרך `PUT /api/users/profile/image`.

## חוזי API מחייבים

**קובץ**: `frontend/calorie-frontend/src/app/core/models/api.models.ts`

```ts
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

export interface ServingSize {
  unit: string;
  weightInGrams: number;
}

export interface Product {
  _id: string;
  name: string;
  caloriesPer100g: number;
  servingSizes: ServingSize[];
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
│   │   ├── logger.middleware.js   ← custom factory middleware (חובה!)
│   │   └── upload.middleware.js   ← multer profile image upload
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
  // מבנה מחייב בכל המערכת: מערך אובייקטים — נוח ל-*ngFor באנגולר וחישוב פשוט בשרת
  servingSizes: [{
    unit: { type: String, required: true },        // 'cup', 'slice', 'tablespoon', 'grams'
    weightInGrams: { type: Number, required: true } // משקל היחידה בגרמים
  }],
  imageUrl: String,
  createdBy: ObjectId|null }  // null = global
// static findGlobalAndUserProducts(userId, search): מחזיר גלובליים + של המשתמש
// חישוב קלוריות לפריט: quantity × weightInGrams × caloriesPer100g / 100
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
- `PUT /profile/image` — **multer** upload תמונת פרופיל. הנתיב המלא: `PUT /api/users/profile/image`
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
- לשימוש בנתיב `PUT /api/users/profile/image` (העלאת תמונת פרופיל)

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
- קורא `backend/data/products.csv`
- ממפה עמודות CSV לסכמת Product:
  - `calories per 100 grams` → `caloriesPer100g`
  - teaspoon/tablespoon/cup/slice/single → `servingSizes` (מערך אובייקטים: `{ unit, weightInGrams }`)
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
│   │   └── app.interceptor.ts      ← מוסיף Authorization header + תופס שגיאות שרת
│   ├── models/
│   │   └── api.models.ts           ← חוזי API משותפים לכל הפיצ'רים
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
    ├── navbar/navbar.component.ts                   ← תפריט לפי role
    ├── pipes/
    │   └── calorie-format.pipe.ts                   ← Custom Pipe (חובה לפי PDF)
    └── directives/
        └── calorie-warning.directive.ts             ← Custom Directive (חובה לפי PDF)
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
- **Custom Pipe** — `CalorieFormatPipe` (חובה לפי PDF) — ראה פירוט בהמשך
- **Custom Directive** — `CalorieWarningDirective` (חובה לפי PDF) — ראה פירוט בהמשך

### רכיבים מרכזיים
- **ProgressBar**: ירוק < 100%, כתום 100-120%, אדום > 120% מהיעד
- **ProductSearch**: `mat-autocomplete` + `debounceTime(300)` + RxJS
- **UnitSelector**: `*ngFor` על מערך `servingSizes` — מציג כל `unit` הקיים למוצר
- **WeeklyChart**: `ng2-charts` / Chart.js לדף ההיסטוריה

---

### Custom Pipe — `CalorieFormatPipe` — **חובה לפי PDF**

**קובץ**: `src/app/shared/pipes/calorie-format.pipe.ts`

**מה הוא עושה**: מקבל מספר קלוריות ומחזיר מחרוזת מעוצבת עם פסיק-אלפים ותווית עברית.

```ts
// קלט: 1500  → פלט: "1,500 קק״ל"
// קלט: 320   → פלט: "320 קק״ל"
@Pipe({ name: 'calorieFormat', standalone: true })
export class CalorieFormatPipe implements PipeTransform {
  transform(value: number): string {
    if (value == null) return '—';
    return value.toLocaleString('he-IL') + ' קק״ל';
  }
}
```

**איפה משתמשים בו**:
- `BasketComponent` — ליד כל פריט ב-basket: `{{ item.calories | calorieFormat }}`
- `ProgressBarComponent` — `{{ totalCalories | calorieFormat }} מתוך {{ goal | calorieFormat }}`
- `HistoryComponent` — בטבלת ה-logs היומיים

---

### Custom Directive — `CalorieWarningDirective` — **חובה לפי PDF**

**קובץ**: `src/app/shared/directives/calorie-warning.directive.ts`

**מה היא עושה**: מניפולציה על ה-DOM באמצעות `ElementRef` + `Renderer2` — מחייבת אינפוט של אחוז הקלוריות הנוכחי, ומשנה צבע רקע ומוסיפה אנימציית pulse כשהמשתמש עובר את היעד.

```ts
@Directive({ selector: '[appCalorieWarning]', standalone: true })
export class CalorieWarningDirective implements OnChanges {
  @Input() appCalorieWarning!: number; // אחוז מהיעד (0–100+)

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(): void {
    const pct = this.appCalorieWarning;
    // איפוס classes קודמים
    this.renderer.removeClass(this.el.nativeElement, 'warning-orange');
    this.renderer.removeClass(this.el.nativeElement, 'warning-red');

    if (pct > 120) {
      this.renderer.addClass(this.el.nativeElement, 'warning-red');   // > 120% — אדום + pulse
    } else if (pct > 100) {
      this.renderer.addClass(this.el.nativeElement, 'warning-orange'); // 100-120% — כתום
    }
  }
}
```

**איפה משתמשים בה**:
- `ProgressBarComponent`: `<div [appCalorieWarning]="percentConsumed">...</div>`
- `BasketComponent`: על כרטיסיית הסיכום היומי

---

### HTTP Interceptor — `AppInterceptor` — JWT + Error Handling

**קובץ**: `src/app/core/interceptors/app.interceptor.ts`

**שני תפקידים בinterceptor אחד**:

```ts
// 1. מזריק את ה-JWT Token לכל בקשה
// 2. תופס שגיאות שרת ומציג toast מתאים
export const appInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  const toastr = inject(ToastrService);

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        toastr.error('פג תוקף ההתחברות, אנא התחבר מחדש');
        inject(AuthService).logout();
      } else if (error.status === 403) {
        toastr.error('אין לך הרשאה לבצע פעולה זו');
      } else if (error.status >= 500) {
        toastr.error('שגיאת שרת, אנא נסה מחדש מאוחר יותר');
      } else {
        toastr.error(error.error?.message || 'אירעה שגיאה');
      }
      return throwError(() => error);
    })
  );
};
```

**רישום ב-`app.config.ts`**: `provideHttpClient(withInterceptors([appInterceptor]))`

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
- **Custom Pipe** — `CalorieFormatPipe` (`shared/pipes/calorie-format.pipe.ts`)
- **Custom Directive** — `CalorieWarningDirective` (`shared/directives/calorie-warning.directive.ts`)
- **HTTP Interceptor** — `AppInterceptor` (JWT injection + Error handling עם toastr)
