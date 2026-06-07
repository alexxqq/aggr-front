# Merchant Portal — Frontend

Nuxt 3 + Vue 3 + TypeScript + Pinia + VueUse + Tailwind CSS.

## Quick start

```bash
# 1. Copy env
cp .env.example .env

# 2. Edit .env
#   Set NUXT_PUBLIC_DEV_BYPASS=true to skip real auth (for local dev)
#   Set NUXT_PUBLIC_API_BASE_URL to point at the API Gateway

# 3. Install and run
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm run typecheck    # manual TS check
```

## Dev bypass mode

To develop without a real Firebase auth backend:

```env
NUXT_PUBLIC_DEV_BYPASS=true
NUXT_PUBLIC_DEV_BYPASS_TOKEN=dev-bypass-token   # forwarded as Bearer token
```

The app will skip the login page, skip the auth middleware, and inject the token automatically into every API call.

## Project structure

```
front/
├── app.vue                     Root entry
├── nuxt.config.ts              Nuxt configuration
├── tailwind.config.ts          Tailwind configuration
├── assets/css/main.css         Global CSS (Tailwind layers)
├── types/index.ts              Shared domain types
│
├── composables/
│   ├── useApi.ts               HTTP client → API Gateway only
│   └── useAuth.ts              Auth abstraction (Bearer + dev bypass)
│
├── stores/
│   ├── auth.ts                 Auth Pinia store (token, user, localStorage)
│   └── merchant.ts             Merchant profile Pinia store
│
├── middleware/
│   └── auth.ts                 Global route guard → redirects to /login
│
├── layouts/
│   ├── default.vue             Sidebar + topbar shell
│   └── auth.vue                Centered card for login
│
├── pages/
│   ├── index.vue               Redirects to /dashboard
│   ├── login.vue               Login page (auth layout)
│   ├── dashboard.vue           Overview / stats
│   ├── profile.vue             Merchant profile & settings
│   ├── products/index.vue      Products list
│   ├── paywalls/index.vue      Paywalls list
│   └── payment-intents/        Payment intents list + status filter
│       └── index.vue
│
└── components/
    ├── AppSidebar.vue          Collapsible sidebar nav
    ├── AppTopbar.vue           Top header (hamburger, user, logout)
    ├── icons/                  SVG icon components
    │   ├── IconDashboard.vue
    │   ├── IconProducts.vue
    │   ├── IconPaywalls.vue
    │   ├── IconPayments.vue
    │   ├── IconProfile.vue
    │   └── IconChevronLeft.vue
    └── ui/                     Reusable UI primitives
        ├── UiButton.vue        variant: primary/secondary/ghost/danger, size: sm/md/lg
        ├── UiCard.vue          white card with optional title/header slot
        ├── UiBadge.vue         inline status pill
        ├── UiAlert.vue         dismissible alert (info/success/warning/danger)
        ├── UiSpinner.vue       loading spinner
        └── UiEmptyState.vue    centered empty-state with icon/action slots
```

## API client

`useApi()` wraps `fetch` and always targets `NUXT_PUBLIC_API_BASE_URL`.

```ts
const api = useApi()

// GET with query params
const { data, error } = await api.get<Product[]>('/v1/products', { params: { page: 1 } })

// POST with body
const { data, error } = await api.post<Product>('/v1/products', { name: 'My Product', ... })

// PATCH / DELETE
await api.patch('/v1/products/123', { name: 'Updated' })
await api.del('/v1/products/123')
```

All responses return `{ data, error }`. `error.statusCode` and `error.message` are populated on failure.

## Auth flow

### Real flow (production)
1. User enters credentials on `/login`.
2. App calls Firebase `signInWithEmailAndPassword` (not yet wired — see TODO in `pages/login.vue`).
3. On success: `auth.setToken(idToken, user)` — stored in Pinia + localStorage.
4. Every API call from `useApi()` reads `authStore.token` and sends it as `Authorization: Bearer <token>`.

### Dev bypass
- Set `NUXT_PUBLIC_DEV_BYPASS=true` in `.env`.
- Login page auto-redirects to `/dashboard`.
- Middleware is skipped.
- Token from `NUXT_PUBLIC_DEV_BYPASS_TOKEN` is forwarded on all requests.

## Dev bypass — how it works end-to-end

1. Set in frontend `.env`:
   ```
   NUXT_PUBLIC_DEV_BYPASS=true
   NUXT_PUBLIC_DEV_BYPASS_TOKEN=dev-bypass-token
   NUXT_PUBLIC_DEV_BYPASS_UID=dev-uid
   NUXT_PUBLIC_DEV_BYPASS_EMAIL=dev@example.com
   ```
2. Set in API Gateway `.env`: `DEV_BYPASS_TOKEN=dev-bypass-token`
3. Frontend login page auto-redirects to `/dashboard`.
4. Every `useApi()` request sends:
   - `Authorization: Bearer dev-bypass-token`
   - `X-Dev-Firebase-Uid: dev-uid`
   - `X-Dev-Email: dev@example.com`
5. Gateway verifies token matches, skips Firebase, bootstraps merchant via User Service.

## Implemented MVP slices

### Auth entry (login.vue)
- Dev bypass auto-redirect (fully functional).
- Real Firebase flow: stub in place — see TODO in `pages/login.vue`.

### Products (`/products`)
- List: `GET /v1/products` — table with name, description, status badge, created date.
- Create: `POST /v1/products` — modal form (name required, description optional).
- Edit: `PATCH /v1/products/:id` — pre-filled modal, includes active toggle.
- Delete: `DELETE /v1/products/:id` — confirmation dialog.
- Loading spinner, error banner, empty state all handled.

### Payment Intents (`/payment-intents`, `/payment-intents/:id`)
- List: `GET /v1/payment-intents` — table with short ID, asset/chain, amount, status badge, created date.
- Status filter tabs: All / Pending / Confirmed / Completed / Failed / Expired.
- Create: `POST /v1/payment-intents` — modal with asset, chain, amount (required), payer address + product price ID (optional). Redirects to detail on success.
- Detail (`/payment-intents/:id`): `GET /v1/payment-intents/:id` — shows all fields, addresses, metadata.
- Events timeline: `GET /v1/payment-intents/:id/events` — chronological event list with status transitions.
- Refresh button re-fetches intent + events.
- Status badge component (`PaymentIntentStatusBadge`) shared across list and detail.

## Next implementation steps

### 1. Wire real Firebase auth (login.vue)
Replace the stub in `pages/login.vue` with real `signInWithEmailAndPassword`.
Optionally add token refresh via `onIdTokenChanged`.

### 2. Paywalls CRUD
- Similar to products, linked to a product ID.
- Show status badge (active / draft / archived).
- Copy shareable URL.

### 3. Dashboard stats
- Aggregate counts from products / paywalls / payment-intents endpoints.
- Recent intents table.

### 5. Profile save
- `PATCH /v1/me` with name, email, webhookUrl.
- Error/success feedback already wired — just replace the setTimeout stub.

### 6. Paywall execution demo page
- `/payment-intents/:id` detail view.
- Show QR code / wallet address, countdown, status polling.
