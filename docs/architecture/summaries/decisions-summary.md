# Architecture Decisions Summary

**Last Updated:** 2026-08-22  
**Purpose:** Quick reference for AI agents and developers  
**Token Count:** ~1,200 tokens

> For full details, see individual ADR files in [`decisions/`](../decisions/) folder.

---

## ADR-0001: Service-Repository Pattern

**Status:** Accepted | **Date:** 2026-08-22

**Decision:** Use Service-Repository Pattern (hybrid layered architecture)

**Why:** 
- Rejected pure MVC (leads to fat controllers/models, not DRY, hard to test)
- Rejected full DDD (over-engineering for attendance system, 3x slower development)
- Best balance: DRY (8/10), Reusability (9/10), Scalability (9/10), No Over-Engineering (8/10)

**Structure:**
```
Controllers (thin, 10-20 lines) 
    ↓
Services (business logic, transactions, events)
    ↓
Actions (single-purpose operations)
    ↓
Models (Eloquent) + Repositories (complex queries, optional)
```

**Key Rules:**
- Controllers: max 20 lines per method, orchestration only
- Services: business logic, DB transactions, event dispatching
- Actions: reusable single-purpose (SendEmailAction, GenerateInvoiceAction)
- Repositories: ONLY for complex queries (joins, subqueries), simple CRUD → Eloquent in Service

**Impact:** 
- ✅ Testability without HTTP layer
- ✅ Logic reusable in Controller/Job/Command/Tests
- ✅ Thin controllers, fat services
- ❌ Requires discipline (developers can bypass pattern)
- ❌ More files than pure MVC (but less than DDD)

[Full details](../decisions/0001-service-repository-pattern.md)

---

## ADR-0002: Package-Based Architecture

**Status:** Accepted | **Date:** 2026-08-22

**Decision:** Organize code into internal packages (domain-based modules)

**Initial Packages:**
- `packages/auth/` - Authentication & authorization
- `packages/subscription/` - Billing, plans, subscriptions
- `packages/shared/` - Base classes, traits, abstracts, utilities

**Why:**
- Reusable across projects (copy package to new project)
- Clear boundaries (Central vs Tenant context enforced by namespace)
- Independent testing (test per package)
- Team scalability (Team A owns subscription/, Team B owns attendance/)

**Structure per package:**
```
packages/{name}/
├── src/
│   ├── Services/                      # Business logic
│   ├── Actions/                       # Single-purpose ops
│   ├── DataTransferObjects/           # Type-safe data
│   ├── Repositories/                  # Complex queries (optional)
│   ├── Models/                        # Eloquent models
│   ├── Contracts/                     # Interfaces
│   ├── Events/, Listeners/, Jobs/
│   ├── Enums/, Exceptions/
│   └── {Name}ServiceProvider.php
├── config/{package}.php
├── database/migrations/
├── tests/Unit/, Feature/
└── composer.json
```

**Autoloading:**
```json
"psr-4": {
    "Packages\\Auth\\": "packages/auth/src/",
    "Packages\\Subscription\\": "packages/subscription/src/",
    "Packages\\Shared\\": "packages/shared/src/"
}
```

**Impact:**
- ✅ Modularity, clear ownership
- ✅ Extract to composer package nanti (internal → external)
- ✅ Isolated testing
- ❌ More folders (but organized)
- ❌ Need discipline to enforce boundaries

[Full details](../decisions/0002-package-based-architecture.md)

---

## ADR-0003: Frontend Feature Modules

**Status:** Accepted | **Date:** 2026-08-22

**Decision:** Mirror backend packages in frontend feature modules

**Structure:**
```
resources/react/
├── features/                    # Match backend packages
│   ├── auth/                   → packages/auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts            # Barrel export
│   ├── subscription/           → packages/subscription/
│   └── tenancy/                → packages/tenancy/
│
├── pages/                      # Inertia pages (THIN)
│   ├── central/
│   │   ├── auth/
│   │   ├── admin/              # BackOffice
│   │   └── site/               # FrontOffice
│   └── tenant/
│       ├── dashboard.tsx
│       └── attendance/
│
├── components/                 # Shared UI components
│   ├── ui/                     # shadcn/ui
│   ├── common/                 # Header, Sidebar, Footer
│   └── forms/
│
├── layouts/                    # Layout wrappers
│   ├── CentralLayout.tsx
│   └── TenantLayout.tsx
│
├── hooks/                      # Global hooks
├── lib/                        # Utils (cn, api, date)
└── types/                      # Global types
```

**Key Pattern:**
```typescript
// ❌ Bad: Logic in page
pages/subscriptions/create.tsx (200 lines with logic)

// ✅ Good: Page orchestrates features
pages/subscriptions/create.tsx (20 lines)
    ↓
features/subscription/components/CreateSubscriptionForm.tsx
    ↓
features/subscription/hooks/useCreateSubscription.ts
```

**Rules:**
- **Pages:** Thin (layout + data passing), max 30 lines
- **Features:** Fat (all logic + UI components)
- **Barrel exports:** `features/{name}/index.ts` exports all public APIs

**TypeScript Paths:**
```json
"paths": {
    "@/*": ["./resources/react/*"],
    "@/features/*": ["./resources/react/features/*"]
}
```

**Impact:**
- ✅ Consistent mental model (backend ↔ frontend)
- ✅ Co-location (subscription logic in 1 folder)
- ✅ Reusable features
- ❌ Learning curve (developers used to page-based)

[Full details](../decisions/0003-frontend-feature-modules.md)

---

## ADR-0004: Inertia.js + React Stack

**Status:** Accepted | **Date:** 2026-08-22

**Decision:** Use Inertia.js with React (from Laravel starter kit)

**Why:**
- Best of SPA + SSR hybrid
- No API layer needed (backend passes props directly)
- Type-safe page props (TypeScript + Laravel Data)
- SEO-friendly (server-rendered initial page)
- Excellent DX (hot reload, React DevTools work)

**Trade-offs:**
- ✅ Faster development vs REST API
- ✅ No API versioning needed
- ✅ Share validation rules (backend + frontend)
- ❌ Not suitable for mobile app (will need REST API layer nanti)
- ❌ Tied to Laravel (can't use backend-agnostic frontend)

**Stack:**
- React 19
- Inertia.js 3.0
- TypeScript
- Tailwind CSS 4
- shadcn/ui components

[Full details](../decisions/0004-inertia-react-stack.md)

---

## ADR-0005: Multi-Tenancy (Database per Tenant)

**Status:** Accepted | **Date:** 2026-08-22

**Decision:** Database per tenant using stancl/tenancy

**Why:**
- Strong data isolation (tenant A cannot access tenant B data)
- Easy backup/restore per tenant
- Scalable (distribute tenants across DB servers)
- Simple queries (no tenant_id filtering needed)

**Structure:**
```
Database: abdigi_central
├── tenants
├── domains
├── plans
├── plan_prices
└── subscriptions

Database: absen_digital_tenant_{uuid}
├── users
├── employees
├── attendances
├── shifts
└── leaves
```

**Migration Paths:**
```
database/migrations/          → Central DB
database/migrations/tenant/   → Tenant DBs
```

**Identification:** Domain/Subdomain based
- Central: `absen.digital`, `localhost`, `127.0.0.1`
- Tenant: `{slug}.absen.digital` or custom domain

**Impact:**
- ✅ Security (perfect isolation)
- ✅ Scalability (horizontal sharding)
- ✅ Compliance (per-tenant data sovereignty)
- ❌ More databases to manage
- ❌ Cross-tenant reports harder

[Full details](../decisions/0005-multi-tenancy-approach.md)

---

## ADR-0006: Testing Strategy (Marathon Mode)

**Status:** Accepted | **Date:** 2026-08-22

**Decision:** Feature tests priority, tests written AFTER implementation

**Strategy (Phase-Based):**
```
Week 1-4:  No tests (rapid prototyping, establish patterns)
Week 5-8:  Feature tests for critical flows
Week 9+:   Add unit tests for complex business logic
Target:    60-70% coverage (NOT 100%)
```

**Priority Matrix:**
```
High Priority (MUST test):
├─ Authentication & Authorization
├─ Payment/Subscription flows
├─ Tenant provisioning
└─ Data isolation (tenant A ≠ tenant B)

Medium Priority (test if time):
├─ CRUD operations
├─ Form validations
└─ API endpoints

Low Priority (skip):
├─ Getters/Setters
├─ Simple transformers
└─ Static helpers
```

**Tools:**
- Backend: Pest (feature + unit tests)
- Frontend: Vitest + React Testing Library
- E2E: Laravel Dusk (for critical user flows only)

**Why NOT TDD:**
- Requirements change rapidly in SaaS
- TDD slows initial development
- Better ROI: write tests after feature works

**Impact:**
- ✅ Faster initial development
- ✅ Focus on high-value tests
- ❌ Lower initial coverage
- ❌ Need discipline to add tests later

[Full details](../decisions/0006-testing-strategy.md)

---

## ADR-0007: Type Safety (Backend ↔ Frontend)

**Status:** Accepted | **Date:** 2026-08-22

**Decision:** Auto-generate TypeScript types from Laravel models/enums

**Tools:**
- `spatie/laravel-data` - DTOs with type casting
- `spatie/laravel-typescript-transformer` - Generate TS types

**Flow:**
```php
// Backend: packages/subscription/src/Enums/SubscriptionStatus.php
enum SubscriptionStatus: string {
    case PENDING = 'pending';
    case ACTIVE = 'active';
}

// Command: php artisan typescript:generate

// Auto-generated: resources/react/types/enums.ts
export enum SubscriptionStatus {
    PENDING = 'pending',
    ACTIVE = 'active'
}
```

**Benefits:**
- Single source of truth (backend)
- No manual sync needed
- Type errors caught at compile time
- Refactor safety (rename enum → TS error if frontend not updated)

**Impact:**
- ✅ Developer experience
- ✅ Fewer runtime errors
- ✅ Confidence in refactoring
- ❌ Build step dependency

[Full details](../decisions/0007-type-safety-backend-frontend.md)

---

## ADR-0008: Naming Conventions & Standards

**Status:** Accepted | **Date:** 2026-08-22

**Backend:**
- Code style: PSR-12
- Services: `{Entity}Service.php` (e.g., `SubscriptionService.php`)
- Actions: `{Verb}{Entity}Action.php` (e.g., `CreateSubscriptionAction.php`)
- DTOs: `{Entity}Data.php` (e.g., `SubscriptionData.php`)
- Repositories: `{Entity}Repository.php` (optional)
- Namespaces: `Packages\{Package}\{Layer}\{Class}`

**Frontend:**
- Code style: Airbnb React + Prettier
- Components: PascalCase (e.g., `SubscriptionCard.tsx`)
- Hooks: `use{Name}.ts` (e.g., `useSubscription.ts`)
- Types: `{entity}.types.ts` (e.g., `subscription.types.ts`)
- Utils: `{entity}.utils.ts` (e.g., `subscription.utils.ts`)
- Pages: kebab-case files, PascalCase exports (e.g., `create-subscription.tsx` → `export default CreateSubscription`)

**Paths:**
- Backend: `packages/{package}/src/{Layer}/{File}.php`
- Frontend: `features/{feature}/{layer}/{file}.tsx`
- Imports: `@/features/{feature}` (TypeScript path alias)

**Database:**
- Tables: snake_case, plural (e.g., `subscriptions`, `plan_prices`)
- Columns: snake_case (e.g., `created_at`, `subscriber_type`)
- Foreign keys: `{table}_id` (e.g., `plan_price_id`)

[Full details](../decisions/0008-naming-conventions.md)

---

## Quick Reference Matrix

| Concern | Decision | Key Takeaway | ADR |
|---------|----------|--------------|-----|
| **Business Logic** | Service-Repository | Controllers thin, Services fat | [0001](../decisions/0001-service-repository-pattern.md) |
| **Code Organization** | Package-based | Domain modules, clear boundaries | [0002](../decisions/0002-package-based-architecture.md) |
| **Frontend Structure** | Feature modules | Mirror backend packages | [0003](../decisions/0003-frontend-feature-modules.md) |
| **UI Framework** | Inertia + React | Hybrid SPA/SSR, no API needed | [0004](../decisions/0004-inertia-react-stack.md) |
| **Data Isolation** | DB per tenant | Strong isolation, scalable | [0005](../decisions/0005-multi-tenancy-approach.md) |
| **Testing** | Feature-first | Write after implementation, 60-70% coverage | [0006](../decisions/0006-testing-strategy.md) |
| **Type Safety** | Auto-generate | Laravel → TypeScript types | [0007](../decisions/0007-type-safety-backend-frontend.md) |
| **Naming** | PSR-12 + Airbnb | Consistent conventions | [0008](../decisions/0008-naming-conventions.md) |

---

## Architecture Principles Summary

1. **DRY & Reusable:** Services/Actions reusable across layers
2. **Separation of Concerns:** Thin controllers/pages, fat services/features
3. **Type Safety:** Backend types → Frontend types (auto-generated)
4. **Clear Boundaries:** Packages enforce domain separation
5. **Pragmatic:** Repository optional, test after implementation
6. **Scalable:** Package-based allows team parallelization
7. **Multi-tenant First:** Central vs Tenant context in code structure

---

**Total Token Count:** ~1,200 tokens  
**AI Reading Time:** ~2 seconds  
**Human Reading Time:** ~5 minutes

For full implementation details, rationale, and examples, see individual ADR documents.
