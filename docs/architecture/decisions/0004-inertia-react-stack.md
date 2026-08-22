# ADR-0004: Inertia.js + React Stack

**Status:** Accepted  
**Date:** 2026-08-22  
**Deciders:** Technical Lead, Architecture Team  
**Technical Story:** Frontend technology stack selection for Absen Digital

---

## Context

Absen.digital is a multi-tenant SaaS attendance management system that requires a modern, interactive user interface. We need to choose a frontend architecture that balances:

- **Developer Experience:** Fast development with hot module replacement, component libraries
- **User Experience:** SPA-like interactivity without full page reloads
- **SEO & Performance:** Server-rendered initial pages for better SEO and perceived performance
- **Type Safety:** Strong typing between backend and frontend
- **Team Familiarity:** Leverage existing Laravel and React knowledge
- **Maintenance:** Minimize infrastructure complexity (API layer, state management)

The project was initialized with Laravel's official starter kit which includes Inertia.js + React 19. We need to validate this choice against alternatives.

**Current Stack (Starter Kit):**
- Laravel 13.17 (backend)
- Inertia.js 3.0 (adapter layer)
- React 19 (UI library)
- TypeScript (type safety)
- Vite (build tool)
- Tailwind CSS 4 (styling)
- shadcn/ui (component library)

---

## Decision Drivers

1. **Developer Experience** (Weight: 25%) - Fast development, good tooling, hot reload
2. **User Experience** (Weight: 20%) - SPA-like interactivity, fast navigation
3. **Type Safety** (Weight: 20%) - Backend types flow to frontend
4. **Infrastructure Simplicity** (Weight: 15%) - Minimal layers, easy deployment
5. **SEO & Performance** (Weight: 10%) - Server-rendered, fast initial load
6. **Future-Proofing** (Weight: 10%) - Can adapt if mobile app needed

---

## Considered Options

### Option 1: Traditional Server-Side Rendering (Blade)

Use Laravel Blade templates with Livewire for interactivity.

```
Backend (Laravel)
    ↓
Blade Templates + Livewire
    ↓
Browser (HTML + Alpine.js)
```

**Pros:**
- ✅ Simple architecture (no build step for views)
- ✅ Native Laravel integration
- ✅ SEO-friendly (server-rendered)
- ✅ No API layer needed
- ✅ Livewire provides SPA-like experience

**Cons:**
- ❌ Less interactive than modern SPAs
- ❌ Limited component ecosystem (compared to React)
- ❌ No TypeScript for views
- ❌ Harder to reuse components
- ❌ Team prefers React experience
- ❌ Not suitable for complex UIs (dashboard with real-time updates)

**Example:**
```blade
{{-- resources/views/subscriptions/create.blade.php --}}
<div>
    <h1>Create Subscription</h1>
    
    @livewire('create-subscription-form', ['plans' => $plans])
</div>
```

**Scoring:** 52/100
- DX: 5/10 (no hot reload, limited tooling)
- UX: 5/10 (page reloads, less interactive)
- Type Safety: 2/10 (no TypeScript)
- Infrastructure: 10/10 (simplest)
- SEO: 10/10 (fully server-rendered)
- Future-Proofing: 3/10 (need API for mobile)

---

### Option 2: Separate SPA + REST API

Build React SPA that consumes Laravel REST API.

```
Backend (Laravel)
    ↓
REST API (JSON)
    ↓
Frontend (React SPA)
```

**Pros:**
- ✅ Full React ecosystem
- ✅ Clear separation (frontend/backend)
- ✅ API ready for mobile apps
- ✅ TypeScript for frontend
- ✅ Modern developer experience

**Cons:**
- ❌ API layer overhead (controllers, resources, authentication)
- ❌ State management complexity (React Query, Zustand)
- ❌ CORS configuration needed
- ❌ Duplicate validation (backend + frontend)
- ❌ SEO challenges (client-side rendering)
- ❌ Two deployments (API + SPA)
- ❌ Authentication complexity (tokens, refresh)

**Example:**
```typescript
// Frontend: Call API
const { data: plans } = useQuery('plans', async () => {
    const response = await axios.get('/api/plans');
    return response.data;
});

// Backend: API Controller
class PlanController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Plan::all());
    }
}

// Duplication:
// - Laravel validation rules in FormRequest
// - Frontend validation in Zod/Yup schema
// - Need to sync manually
```

**Scoring:** 63/100
- DX: 8/10 (great React DX)
- UX: 9/10 (full SPA)
- Type Safety: 6/10 (requires OpenAPI/manual sync)
- Infrastructure: 3/10 (complex: API + CORS + tokens)
- SEO: 4/10 (need SSR setup)
- Future-Proofing: 10/10 (API ready)

---

### Option 3: Inertia.js + React (Hybrid)

Use Inertia.js as adapter between Laravel and React.

```
Backend (Laravel)
    ↓
Inertia.js (Adapter)
    ↓
Frontend (React SPA)

No API layer needed
```

**Pros:**
- ✅ SPA experience without API layer
- ✅ Backend passes props directly to React components
- ✅ Type-safe page props (TypeScript + Laravel Data)
- ✅ Share validation rules (backend validates, frontend shows errors)
- ✅ SEO-friendly (server-rendered initial page)
- ✅ Full React ecosystem available
- ✅ Hot module replacement
- ✅ Simple authentication (Laravel session)
- ✅ No CORS, no token management
- ✅ Single deployment
- ✅ Fast development (no API controllers needed)

**Cons:**
- ❌ Not suitable for mobile apps (would need REST API later)
- ❌ Tightly coupled to Laravel (can't swap backend)
- ❌ Less flexibility than pure SPA
- ❌ Inertia-specific patterns to learn

**Example:**
```php
// Backend: Controller
class SubscriptionController extends Controller
{
    public function create()
    {
        return Inertia::render('subscriptions/create', [
            'plans' => Plan::with('prices')->where('is_active', true)->get(),
        ]);
    }
    
    public function store(CreateSubscriptionRequest $request)
    {
        $subscription = $this->subscriptionService->create(
            SubscriptionData::fromRequest($request)
        );
        
        return redirect()
            ->route('subscriptions.show', $subscription)
            ->with('success', 'Subscription created!');
    }
}

// Frontend: React Component (TypeScript)
interface CreateSubscriptionProps extends PageProps {
    plans: Plan[];
}

export default function CreateSubscription({ plans }: CreateSubscriptionProps) {
    const { data, setData, post, processing, errors } = useForm({
        plan_price_id: 0,
    });
    
    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('subscriptions.store'));
    };
    
    return (
        <form onSubmit={submit}>
            {/* Type-safe access to plans */}
            {/* Validation errors from Laravel */}
        </form>
    );
}

// Benefits:
// 1. No API controller needed
// 2. No separate validation
// 3. Type-safe props
// 4. Laravel session auth (no tokens)
```

**Scoring:** 82/100
- DX: 9/10 (excellent, no API overhead)
- UX: 9/10 (SPA-like)
- Type Safety: 9/10 (Laravel Data → TypeScript)
- Infrastructure: 9/10 (simple, single deployment)
- SEO: 8/10 (server-rendered initial)
- Future-Proofing: 6/10 (need API for mobile)

---

### Option 4: Next.js + API Routes

Use Next.js with API routes instead of Laravel.

**Pros:**
- ✅ React Server Components
- ✅ Full-stack TypeScript
- ✅ Excellent SEO

**Cons:**
- ❌ Abandon Laravel (lose ecosystem, packages, tenancy)
- ❌ Rewrite backend logic in JavaScript/TypeScript
- ❌ Team has Laravel expertise, not Next.js API
- ❌ Multi-tenancy harder (stancl/tenancy doesn't exist for Next.js)

**Scoring:** 45/100 (loses Laravel benefits)

---

## Decision Outcome

**Chosen option:** "Inertia.js + React (Hybrid)" ⭐

**Rationale:**

Inertia.js + React scores highest (82/100) and provides the best balance for our needs:

1. **Developer Experience (25% weight):** Excellent DX without API layer overhead:
   - No need to write API controllers, resources, transformers
   - No need to manage authentication tokens
   - No need for state management library (React Query, Zustand)
   - Laravel validation rules flow directly to React components
   - Hot module replacement works perfectly

2. **User Experience (20% weight):** SPA-like navigation without full page reloads:
   - Persistent layouts (sidebar doesn't re-render)
   - Smooth transitions between pages
   - Loading states built-in
   - Form submissions without page refresh

3. **Type Safety (20% weight):** Backend types flow to frontend:
   ```typescript
   // Backend: Laravel Data DTO
   class SubscriptionData extends Data
   {
       public function __construct(
           public int $planPriceId,
           public string $subscriberType,
       ) {}
   }
   
   // Auto-generated TypeScript (via spatie/laravel-typescript-transformer)
   interface SubscriptionData {
       planPriceId: number;
       subscriberType: string;
   }
   
   // Page props are type-safe
   interface CreateSubscriptionProps extends PageProps {
       plans: Plan[];
   }
   ```

4. **Infrastructure Simplicity (15% weight):** Single Laravel application:
   - No separate API deployment
   - No CORS configuration
   - No token management
   - Laravel session authentication (already secure)
   - Single codebase, single deployment

5. **SEO & Performance (10% weight):**
   - Server-rendered initial page load
   - Subsequent navigation is SPA (fast)
   - Automatic code splitting per page

6. **Team Fit:** Leverages existing expertise:
   - Team knows Laravel well
   - Team knows React well
   - Inertia.js is just glue between them (1-2 day learning curve)

**Trade-off Accepted:** If mobile app is needed in future, we'll need to add REST API layer. This is acceptable because:
- Mobile app is not in current roadmap
- When needed, we can add API controllers alongside Inertia (coexist)
- Core business logic is in Services (already API-ready)

---

## Consequences

### Positive

- ✅ **Fast Development:** No API layer means features ship faster
- ✅ **Type Safety:** Backend types → Frontend types via auto-generation
- ✅ **Simple Auth:** Laravel session authentication (no JWT, no refresh tokens)
- ✅ **Shared Validation:** Laravel validates, React shows errors
- ✅ **Single Deployment:** One Laravel app, not API + SPA
- ✅ **SEO-Friendly:** Server-rendered initial page
- ✅ **Great DX:** Hot reload, React DevTools, TypeScript
- ✅ **No CORS:** Backend and frontend same origin

### Negative

- ❌ **Mobile App Requires API:** If mobile app needed, must add REST API layer
- ❌ **Coupled to Laravel:** Can't swap backend without rewriting
- ❌ **Inertia-Specific Patterns:** Team must learn Inertia conventions
- ❌ **Less Flexibility:** Can't independently scale frontend/backend (but not needed for SaaS)

### Neutral

- ⚪ **Not Pure SPA:** Initial page is server-rendered, then becomes SPA
- ⚪ **Session-Based Auth:** Traditional sessions, not stateless tokens (fine for web app)

---

## Implementation Notes

### Stack Components

**Backend:**
- Laravel 13.17
- Inertia Laravel Adapter 3.0
- Spatie Laravel Data (DTOs)
- Spatie TypeScript Transformer (type generation)

**Frontend:**
- React 19
- Inertia React Adapter 3.0
- TypeScript 5.9
- Vite 8.2 (build tool)
- Tailwind CSS 4
- shadcn/ui (component library)

### Page Props Pattern

**Type-Safe Page Props:**
```typescript
// types/inertia.d.ts
import { Page, PageProps as InertiaPageProps } from '@inertiajs/core';
import { User } from '@/types/models';

declare module '@inertiajs/core' {
    interface PageProps {
        auth: {
            user: User | null;
        };
        flash: {
            success?: string;
            error?: string;
        };
        errors: Record<string, string>;
    }
}

// Every page gets these props automatically
```

**Usage:**
```typescript
interface CreateSubscriptionProps extends PageProps {
    plans: Plan[];
}

export default function CreateSubscription({ plans, auth, flash, errors }: CreateSubscriptionProps) {
    // Type-safe access to:
    // - plans (page-specific)
    // - auth.user (global)
    // - flash.success (global)
    // - errors (validation errors)
}
```

### Form Handling

**Inertia Form Helper:**
```typescript
import { useForm } from '@inertiajs/react';

export default function CreateSubscription() {
    const { data, setData, post, processing, errors, reset } = useForm({
        plan_price_id: 0,
        subscriber_type: '',
        subscriber_id: 0,
    });
    
    const submit = (e: FormEvent) => {
        e.preventDefault();
        
        post(route('subscriptions.store'), {
            onSuccess: () => reset(),
            onError: (errors) => console.log('Validation failed', errors),
        });
    };
    
    return (
        <form onSubmit={submit}>
            <select
                value={data.plan_price_id}
                onChange={e => setData('plan_price_id', Number(e.target.value))}
            >
                {/* options */}
            </select>
            
            {errors.plan_price_id && (
                <span className="text-red-500">{errors.plan_price_id}</span>
            )}
            
            <button type="submit" disabled={processing}>
                {processing ? 'Creating...' : 'Create'}
            </button>
        </form>
    );
}
```

### Persistent Layouts

**Layout Pattern:**
```typescript
// layouts/CentralLayout.tsx
import { PropsWithChildren } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';

export function CentralLayout({ children }: PropsWithChildren) {
    return (
        <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

// pages/subscriptions/index.tsx
import { CentralLayout } from '@/layouts/CentralLayout';

export default function Subscriptions({ subscriptions }: Props) {
    return (
        <CentralLayout>
            <h1>Subscriptions</h1>
            {/* content */}
        </CentralLayout>
    );
}

// Sidebar/Header persist across page navigation (don't re-render)
```

### Navigation

**Route Helper (Type-Safe):**
```typescript
// Using ziggy (Laravel routes in JavaScript)
import { route } from 'ziggy-js';

// ✅ Type-safe route generation
<Link href={route('subscriptions.show', subscription.id)}>
    View Subscription
</Link>

// ✅ Programmatic navigation
router.visit(route('subscriptions.index'));

// ✅ Preserve scroll position
router.visit(route('subscriptions.index'), { preserveScroll: true });
```

### Loading States

**Built-in Progress Indicator:**
```typescript
// resources/react/app.tsx
createInertiaApp({
    progress: {
        color: '#4B5563',
        showSpinner: true,
    },
});

// Automatic loading bar on page navigation
```

**Manual Loading State:**
```typescript
const { processing } = useForm();

<button disabled={processing}>
    {processing ? 'Saving...' : 'Save'}
</button>
```

### Flash Messages

**Backend:**
```php
return redirect()
    ->route('subscriptions.index')
    ->with('success', 'Subscription created successfully!');
```

**Frontend:**
```typescript
export default function Subscriptions({ flash }: PageProps) {
    return (
        <div>
            {flash.success && (
                <div className="bg-green-100 p-4 rounded">
                    {flash.success}
                </div>
            )}
            {/* content */}
        </div>
    );
}
```

### Type Generation Workflow

**1. Define Backend Types:**
```php
// packages/subscription/src/Enums/SubscriptionStatus.php
#[TypeScript]
enum SubscriptionStatus: string
{
    case PENDING = 'pending';
    case ACTIVE = 'active';
}
```

**2. Generate TypeScript:**
```bash
php artisan typescript:generate
```

**3. Auto-Generated Types:**
```typescript
// resources/react/types/enums.ts
export enum SubscriptionStatus {
    PENDING = 'pending',
    ACTIVE = 'active'
}
```

**4. Use in React:**
```typescript
import { SubscriptionStatus } from '@/types/enums';

function getBadgeColor(status: SubscriptionStatus) {
    switch (status) {
        case SubscriptionStatus.ACTIVE:
            return 'green';
        case SubscriptionStatus.PENDING:
            return 'yellow';
    }
}
```

### SEO Optimization

**Page Title & Meta:**
```typescript
import { Head } from '@inertiajs/react';

export default function CreateSubscription() {
    return (
        <>
            <Head>
                <title>Create Subscription - Absen Digital</title>
                <meta name="description" content="Create a new subscription" />
            </Head>
            
            {/* content */}
        </>
    );
}
```

### Authentication

**Middleware (Backend):**
```php
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/subscriptions', [SubscriptionController::class, 'index']);
});
```

**Access User (Frontend):**
```typescript
export default function Dashboard({ auth }: PageProps) {
    const { user } = auth;
    
    return (
        <div>
            <p>Welcome, {user.name}!</p>
        </div>
    );
}
```

**Logout:**
```typescript
import { router } from '@inertiajs/react';

function logout() {
    router.post(route('logout'));
}
```

---

## Validation

### Success Criteria

- ✅ Pages load with SSR (view source shows content)
- ✅ Navigation doesn't trigger full page reload
- ✅ Form validation errors display from Laravel
- ✅ TypeScript types match backend models
- ✅ Hot reload works during development
- ✅ Build time < 30 seconds

### Performance Targets

- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Lighthouse Score > 90

---

## References

- [Inertia.js Official Docs](https://inertiajs.com/)
- [React 19 Documentation](https://react.dev/)
- [Laravel Inertia Starter Kit](https://laravel.com/docs/13.x/starter-kits#breeze-and-inertia)
- [Spatie Laravel Data](https://github.com/spatie/laravel-data)
- [Spatie TypeScript Transformer](https://github.com/spatie/laravel-typescript-transformer)

---

## Related ADRs

- [ADR-0003: Frontend Feature Modules](0003-frontend-feature-modules.md) - Frontend organization
- [ADR-0007: Type Safety Backend ↔ Frontend](0007-type-safety-backend-frontend.md) - Type synchronization strategy

---

## Revision History

| Date       | Change Description      | Author        |
|------------|-------------------------|---------------|
| 2026-08-22 | Initial draft          | Technical Lead |

---

## Notes

**Mobile App Future:** If mobile app is required, we'll add REST API controllers:
```
routes/api.php  (new API routes)
app/Http/Controllers/Api/  (API controllers)
resources/react/  (existing Inertia pages, unchanged)
```

Services remain reusable across Inertia and API controllers.

**Hybrid Approach:** Inertia for web app, REST API for mobile. Both consume same Services/Actions layer.

**Remember:** Inertia.js is not a framework. It's just glue between Laravel and React. You still write normal Laravel controllers and normal React components.
