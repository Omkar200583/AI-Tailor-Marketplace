# AI Tailor — role-based portal refactor

Frontend-only refactor. **Untouched (byte-identical):** `src/app/api/**`, `src/lib/auth.ts`, `src/lib/db.ts`, `src/lib/api-client.ts`, `src/lib/helpers.ts`, `prisma/**`, `db/**`, `scripts/**`, `mini-services/**`, `.env`, `package.json`, `next.config.ts`.

## Before → after
The app was one page (`src/app/page.tsx`) switching "views" through a Zustand hash router; one `AuthPanel` served every role.
It is now three URL-based portals plus a welcome screen.

| URL | What it is |
|---|---|
| `/` | Redirects to `/user/login` (no landing page). |
| `/user` … | Customer portal. Public storefront: `/user`, `/user/explore`, `/user/product/:id`, `/user/categories`, `/user/tailors`, `/user/tailors/:id`, `/user/designers`, `/user/designers/:id`, `/user/ai-studio`, `/user/try-on`, `/user/about`, `/user/contact`. Auth: `/user/login`, `/user/register`. Signed-in: `/user/dashboard`, `orders`, `cart`, `wishlist`, `measurements`, `designs`, `notifications`, `chat`, `try-on-history`, `settings` |
| `/seller` | Router only → dashboard or `/seller/login`. Auth: `/seller/login`, `/seller/register`. Workspace: `dashboard`, `products`, `orders`, `shop`, `earnings`, `reviews`, `verification`, `notifications`, `chat` |
| `/admin` | Router only → dashboard or `/admin/login`. **No register page.** `dashboard`, `users`, `sellers`, `orders`, `commission`, `ai-monitoring` |

## Original → new component mapping
| Original | Now |
|---|---|
| `app/page.tsx` (home view + switch) | `app/page.tsx` (welcome) + `app/user/(shop)/**` pages; sections moved to `components/user/marketplace/home-content.tsx` |
| `AboutView`, `ContactView` (inside page.tsx) | `components/user/marketplace/about.tsx`, `contact.tsx` |
| `components/auth/auth-panel.tsx` (**removed**) | `components/shared/auth/*` (fields, validation, `use-auth-flow`, `login-form`, `auth-frame`) + `user/auth`, `seller/auth`, `admin/auth` |
| `DashboardShell` (sidebar/tabs) | `components/user/layout/user-shell.tsx`, `seller/layout/seller-shell.tsx`, `admin/layout/admin-shell.tsx`; `dashboard/shell.tsx` keeps `PageHeader` + `StatCard` |
| `CustomerDashboard` / `SellerDashboard` / `AdminDashboard` | Same components, now rendered once per route with a `tab` prop |
| hash routing in `store/app-store.ts` | Real URLs. `navigate({name})` is kept for the ~60 existing call sites and maps to paths via `lib/portals.ts` |
| auth dialog (`setAuthOpen`) | `setAuthOpen(true)` now navigates to `/user/login?next=…` |

New: `lib/portals.ts` (route map), `lib/guards.ts` (server guards), `components/shared/*`, `seller/verification/seller-verification.tsx`, `landing/welcome.tsx`.
Modified: `globals.css` (portal themes), `layout.tsx` (AppProviders), `store/app-store.ts`, `layout/navbar.tsx`, the three dashboards (shell wrapper → `PageHeader`; seller gained `verification` + `notifications` tabs), `types.ts` (added the missing `Category` type).

## Auth & role flow
1. Login/register call the existing `/api/v1/auth/*` endpoints; the session cookie is unchanged.
2. The real role is read from `/auth/me`. The user is sent to their **own** portal dashboard (`?next=` is honoured only for same-portal relative paths).
3. ADMIN credentials are refused on customer/seller forms (generic "Invalid email or password"); non-admins are refused on `/admin/login`. The admin console is never linked from public pages.
4. **Server-side gating**: `(account)`, `seller/(portal)`, `admin/(portal)` layouts are Server Components calling `requirePortalUser()` → guests go to that portal's login; wrong roles go to their own dashboard. A client check (`usePortalSession`) covers session loss while a page is open.
5. API role checks (`requireAuth`) are unchanged and remain the real authorization for data.
6. DESIGNER lives in the customer portal (registers at `/user/register`, uses the customer dashboard exactly as before).

## Themes
Brand colours moved from `@theme inline` to a plain `@theme` block, so `.theme-seller` (emerald/amber) and `.theme-admin` (indigo/slate) can remap `wine-*`/`gold-*` and shadcn variables. All existing components re-theme without class changes.

## Not verified here / limitations
- The workspace had no `node_modules` and no network, so `tsc`, `eslint`, `next build` and live route tests could **not** be run. Only a syntax + import-resolution pass and a route-reference check were done (all passed). Run `bun install && bun run lint && bun run build` locally.
- No document-upload API exists, so `/seller/verification` shows status + a profile checklist only.
- The admin sidebar badge calls `/admin/stats` once in addition to each admin page's own call.
- Demo-login helper buttons remain on customer/seller login (hide with `NEXT_PUBLIC_DEMO_LOGINS=off`); there is none for admin. Seed accounts still exist — change them before production, and set `AUTH_SECRET`.
