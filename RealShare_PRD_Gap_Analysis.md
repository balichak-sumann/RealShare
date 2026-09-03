# RealShare — PRD vs. Codebase Gap Analysis

Compares the client's "Detailed Product Requirements Report" against the current state of the `RealShare` repo (`admin-dashboard/` Next.js app, `android-app/` Expo app, `backend/schema.sql`), as of Sep 3, 2026.

Status key: ✅ Built & wired to real data · 🟡 UI built, but mock/hardcoded data or non-functional · ❌ Not present in the codebase

## Bottom line

No, it doesn't have everything yet. The **fractional-investment core loop is real and working end-to-end**: browse approved properties → view a property → pay a booking amount via Razorpay → get an `Investment` record → see it in a portfolio, plus a working admin approval/KYC/agent-commission backend. That's the strongest, most complete part of the build.

But a large share of what the PRD describes is currently **UI scaffolding wired to hardcoded arrays**, not real product logic — most visibly the AI layer, the home-screen discovery sections, search, compare, developer profiles, and most of "My Assets." The client PRD leans heavily on things (AI recommendations, rentals, resale, documents, ledger, home services) that either don't exist server-side or exist only as static/dummy screens.

## 1–2. Overall concept & Management Console

✅ A separate admin/management console exists (`admin-dashboard`), with role-based portals for admin, agent, employee (sales/support/accounts), and builder submission review.
🟡 The specific pixel note "move logo right, increase size" is a cosmetic detail — not something I can confirm without visually inspecting the deployed header, but nothing in the layout code (`AdminLayout.tsx`) suggests this was deliberately addressed.
❌ No distinct "property manager" or plain "tenant/renter" role exists anywhere — the `role` field only supports `investor / agent / builder / employee_* / admin`.

## 3. Outright purchase vs. fractional/shared ownership

🟡 Partially. The `Property` model only models fractional ownership (`total_fractions`, `available_fractions`, `price_per_fraction` are all required, non-nullable). There is **no field distinguishing "outright purchase" from "fractional investment"** — every property is fractional by schema design. The PRD's core dual-model (buy the whole thing OR buy shares) is not implemented; only the shares model is.

## 4. Property categories (Commercial, Fractional, Residential, Holiday, Investor)

🟡 `property_type` is a free-text string, populated with values like `commercial`, `residential`, `holiday` in seed data — so the categories exist loosely, but there's no enum/validation enforcing the PRD's five categories, and "Investor Property" isn't a distinct category anywhere (it's implicit in every listing). The Android app's actual filter chips (`MOCK_CATEGORIES`) don't match the PRD's categories at all — they show *Buy / Rent / Projects / PG-Hostels / Plot & Land / Commercial / Luxury / Investment*, a generic 99acres-style taxonomy, not the RealShare-specific one from the notes.

## 5. Property posting (Admin / Builder / Agent)

✅ Admin posting: `admin-dashboard/src/app/properties/new` + `POST /api/properties/builder`.
✅ Builder posting: `android-app/src/app/builder-portal.tsx` submits, admin approves/rejects via `approval_status`.
❌ **Agent posting is missing.** The agent portal (`AgentCRMScreen`, `AgentClientsScreen`, `AgentEarningsScreen`) handles clients, chat, and commissions — but there is no agent property-listing form or endpoint. Agents can't submit properties per the PRD's "Agent Posting" requirement.

## 6. Listing data table (Property, Type, Posted By, Total/Sold/Available Shares, Price, Yield, Status, Admin Status, Remarks)

✅ Very close match — the admin properties table shows exactly this: share pool (sold/total), price, yield (`assured_yield`), status pills, and a rejection-notes field functions as "Remarks." This is one of the best-matched sections of the whole PRD.

## 7. Share management (Total/Sold/Available, % funded)

✅ Fully implemented — `total_fractions`, `sold_fractions`, `available_fractions` on `Property`, with a progress bar shown both in the admin table and (presumably) property detail pages.

## 8. Listing status lifecycle (Active / Sold Out / Closed)

🟡 Mostly implemented, but the vocabulary differs: the actual `approval_status` enum is `pending_approval / approved / rejected / sold_out` (per `backend/schema.sql`; Prisma has no CHECK constraint at all, it's a free string). There's no explicit "Closed" status distinct from "rejected" — the PRD's three-state lifecycle isn't a clean match.

## 9–14. App landing page, location discovery, Hot Selling / New Projects / Top Developers sliders

🟡 **This is UI-only.** `android-app/src/components/home/HeroCarousel.tsx`, `HotProjects.tsx`, `TopDevelopers.tsx`, `TopLocalities.tsx` all exist as horizontally-scrollable card components matching the PRD's sketches almost exactly — but the home tab (`(tabs)/index.tsx`) feeds them from `MOCK_PROPERTIES`, `MOCK_RESALE_PROPERTIES`, `MOCK_RENTAL_PROPERTIES` in `constants/mockData.ts`, not the live `/api/properties` endpoint. So visually this section is arguably the *best* match to the sketches, but none of it reflects real listings — a newly approved property in the admin console won't appear here.
✅ Location context does exist (`LocationContext.tsx`, a `LocationPicker` component using Leaflet) but it's not clearly wired into a "choose city → filtered results" flow on the home screen.

## 15. Complete Solutions for Your Home (Interiors / Home Loans / Property Management)

🟡 A static `services.tsx` screen exists with cards for Interior Design, Home Loans, Property Management, Legal, Cleaning, Insurance, Packers & Movers — but two of the PRD's three named services are explicitly marked **"Coming Soon"** in the code (Home Loans, Insurance), none have any backend, application flow, or lead-capture logic, and tapping a card does nothing. This section is a mood board, not a feature.

## 16–18. User profile (Customer/Investor, name/email/phone/photo/address) + Investment Properties

✅ Profile fields (name, email, phone, photo, member-since) are real, sourced from the Firebase-synced `Profile` record.
✅ Investment properties (portfolio) are real — `(tabs)/portfolio.tsx` fetches `/api/portfolio`, showing actual owned fractions, wallet, and yield payouts.
❌ No `address` field exists anywhere on `Profile` (schema or UI) — the PRD explicitly lists Address as a profile field.
🟡 "Customer vs Investor" as a distinct profile type isn't modeled; `role` covers `investor/agent/builder/employee/admin` but there's no plain "customer" (non-investing) role.

## 19. Rental Properties (owned/managed by user)

❌ **Missing entirely as real data.** No `Rental`/`Lease`/`Tenant` model exists in Prisma or `backend/schema.sql`. The only "rental" surface is the home screen's `MOCK_RENTAL_PROPERTIES` array (marketing copy, not a user's actual rental portfolio) and a generic "Rental Yield" figure shown in portfolio payouts (which is really investment yield, not rent from a managed property).

## 20–24. My Assets (Documents, Rental Agreements, Rental Statements, A/C Ledger, Add Property)

🟡 / ❌ This is the biggest gap versus the PRD's own emphasis (the report calls this "one of the strongest product concepts" and "a major part of the ecosystem").
- **Property Documents**: 🟡 `profile.tsx` has a "My Documents" card, but it's hardcoded to three KYC document types (Aadhaar/PAN/Passport) with an alert saying "upload coming soon" — not a per-property document repository (sale deed, agreements, etc.) as the PRD describes.
- **Rental Agreements**: ❌ No model, no screen.
- **Rental Statements**: ❌ No model, no screen.
- **A/C Ledger**: 🟡 An admin-side ledger exists (`admin-dashboard/src/app/ledger`) showing all transactions platform-wide with CSV export — genuinely solid — but it's an **admin financial ledger**, not the PRD's per-user "A/C Ledger" inside their own asset dashboard. There is no user-facing ledger screen in the Android app.
- **Add Property (self-managed asset, distinct from investing)**: ❌ Not present. The only "add property" flows are builder/admin listing submission for sale/investment, not a user registering a property they already own for management purposes.

## 25–26. Property lifecycle (Discover→Evaluate→Buy/Invest→Own→Manage→Rent→Resell)

🟡 Discover/Evaluate/Buy/Invest/Own are real (browse → detail → Razorpay payment → portfolio). Manage/Rent/Resell are not implemented as functioning product surfaces — Resell exists only as a mock section label, Rent/Manage don't exist beyond marketing copy.

## 27–28. Suggested app / admin information architecture

The actual nav structure is close in *shape* to what's recommended (Home, Explore/Properties, Portfolio, Profile tabs; Admin has Properties/Investors/Agents/Employees/Ledger/CMS) but several named nodes are missing or mock as detailed above (My Assets sub-tree, Rentals, structured Documents, dedicated Developers/Approvals admin section — developer profiles only exist as a **mock array** in the Android app, with no `Developer` model or admin CRUD for developers at all).

## 29. UI/UX patterns (sliders, cards)

✅ Strong match. Carousels, property cards, service cards, and dashboard KPI cards are all implemented with a consistent "glassmorphism / gold" design system (`constants/design.ts`). Visually this is the most PRD-faithful part of the build, even where the data behind it is fake.

## 30. Fractional ownership as core differentiator

✅ This is genuinely the one thing that's fully real, end-to-end: property detail → shares available → price per share → yield → Razorpay checkout → `Investment` + `Transaction` + `AgentCommission` records → shows up in portfolio. If the client cares about one thing working, this is it.

## 31. AI-driven positioning

❌ **This is marketing copy only, not a feature.** I searched the entire codebase for any LLM/AI service integration (OpenAI, Anthropic, Gemini, any `chat/completions`-style call) and found none. `AIChatBubble`, `AIOrb`, and `AIRecommendation` are presentational React Native components with no logic behind them — `AIRecommendation` just renders a normal `PropertyCard`. Search has no natural-language handling (it's a text input filtered against a hardcoded 124-item mock count). "India's AI-driven Real Estate Platform" appears only as a tagline string in mock data and CMS banners. None of the PRD's suggested AI capabilities (recommendations, yield analysis, NL search, portfolio insights) exist.

## 32–33. Overall vision & 5-area IA

Directionally the repo is organized the right way (Home / Properties / Investments / Assets / Profile + Admin console), but three of the PRD's five pillars — **Asset Management, Home Services, and the AI layer** — are largely unbuilt behind their UI, and a fourth — **property categories/outright vs. fractional** — doesn't match the data model the PRD asks for.

## Summary table

| PRD Area | Status |
|---|---|
| Admin management console | ✅ Real |
| Property posting: admin | ✅ Real |
| Property posting: builder | ✅ Real |
| Property posting: agent | ❌ Missing |
| Share management (total/sold/available) | ✅ Real |
| Listing approval workflow | ✅ Real (vocabulary differs slightly) |
| Outright vs. fractional purchase | ❌ Only fractional modeled |
| Property categories (5 types) | 🟡 Loose/unenforced, app's actual filters don't match PRD |
| Home discovery (hot/new/developers sliders) | 🟡 UI built, mock data only |
| Location-based discovery | 🟡 Partial |
| Search & filters | 🟡 UI only, no real query logic |
| Compare properties | 🟡 UI only, hardcoded 3 properties |
| Home services (interiors/loans/mgmt) | 🟡 Static cards, 2 of 3 marked "Coming Soon" |
| Profile (name/email/phone/photo) | ✅ Real |
| Profile address field | ❌ Missing |
| Investment portfolio | ✅ Real |
| Rental properties (owned/managed) | ❌ Missing |
| Property documents repository | 🟡 KYC docs only, no per-property docs |
| Rental agreements | ❌ Missing |
| Rental statements | ❌ Missing |
| User-facing A/C ledger | ❌ Missing (admin-only ledger exists) |
| Add property to manage (non-investment) | ❌ Missing |
| Resale marketplace | 🟡 Mock label only |
| Fractional investment purchase flow | ✅ Real, end-to-end (Razorpay) |
| KYC (PAN/Aadhaar/DigiLocker) | ✅ Real |
| Agent CRM / commissions / chat | ✅ Real |
| AI recommendations / NL search / insights | ❌ Not implemented anywhere |
| Developer profiles (admin-managed) | ❌ Mock array only, no model |

## Recommendation

If this report is going back to the client, the honest framing is: **the transactional core (list → approve → invest → own → track in portfolio) is production-grade; everything the PRD frames as "RealShare stays useful after purchase" (assets, rentals, documents, ledger) and the AI positioning are not yet built** — those are the two biggest gaps versus what the notes describe as the product's differentiators. Suggest treating those as the next roadmap phase rather than a QA punch-list, since they involve new data models (Rental, Lease, Document, Developer), not just wiring existing screens to existing endpoints.
