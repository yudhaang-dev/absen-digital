# ADR-0003: Frontend Feature Modules

**Status:** Accepted  
**Date:** 2026-08-22  
**Deciders:** Technical Lead, Frontend Team, Architecture Team  
**Technical Story:** Frontend architecture for Absen Digital SaaS platform

---

## Context

Absen.digital uses Inertia.js + React 19 for the frontend. As the application grows, we need a frontend architecture that:

- **Mirrors Backend Structure:** Consistent mental model between backend packages and frontend modules
- **Co-location:** Related components, hooks, types, and utilities grouped together
- **Reusability:** Feature modules portable across projects
- **Separation of Concerns:** Pages handle routing/layout, features handle logic/UI
- **Type Safety:** TypeScript types aligned with backend (Laravel models/enums)
- **Team Scalability:** Multiple developers working on different features without conflicts

The default Inertia starter kit structure is page-centric:

```
resources/react/
├── pages/
│   ├── welcome.tsx
│   ├── dashboard.tsx
│   └── ... (all components in pages)
├── components/
│   └── ui/
└── lib/
```

This flat structure leads to:
- **Fat pages:** Business logic mixed with presentation (200+ line components)
- **Poor discoverability:** Hard to find subscription-related code scattered across files
- **Not reusable:** Components tightly coupled to specific pages
- **No domain boundaries:** Any component can import any other component

With multi-tenancy (Central vs Tenant contexts) and multiple domain packages (auth, subscription, attendance), we need a structure that matches backend organization.

---

## Decision Drivers

1. **Consistency with Backend** (Weight: 25%) - Frontend structure mirrors backend packages
2. **Co-location** (Weight: 20%) - Related code grouped by feature, not by type
3. **Reusability** (Weight: 20%) - Feature modules portable to other projects
4. **Separation of Concerns** (Weight: 15%) - Pages vs Features vs Components
5. **Discoverability** (Weight: 10%) - Easy to find subscription/auth/attendance code
6. **Team Scalability** (Weight: 10%) - Parallel development without conflicts

---

## Considered Options

### Option 1: Page-Centric Structure (Default)

All components organized by pages with shared components in `components/`.

```
resources/react/
├── pages/
│   ├── auth/
│   │   ├── login.tsx (200 lines with form logic)
│   │   └── register.tsx
│   ├── subscriptions/
│   │   ├── index.tsx (300 lines)
│   │   └── create.tsx (250 lines)
│   └── dashboard.tsx
├── components/
│   ├── ui/
│   └── SubscriptionCard.tsx
└── lib/
    └── utils.ts
```

**Pros:**
- ✅ Simple, everyone understands pages
- ✅ Next.js/Remix developers familiar with pattern
- ✅ Minimal setup

**Cons:**
- ❌ Fat pages (business logic in page components)
- ❌ Hard to reuse logic (where to put shared subscription logic?)
- ❌ Poor discoverability (subscription code scattered)
- ❌ No alignment with backend structure
- ❌ Merge conflicts (everyone touches same files)

**Example Problem:**
```typescript
// pages/subscriptions/create.tsx (250 lines - fat page)
export default function CreateSubscription({ plans }: Props) {
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    
    const { data, setData, post } = useForm({
        plan_price_id: 0,
        subscriber_type: '',
    });
    
    const calculatePrice = (plan: Plan) => {
        // 30 lines of logic
    };
    
    const handleSubmit = (e: FormEvent) => {
        // 50 lines of logic
    };
    
    return (
        <div>
            {/* 150 lines of JSX */}
        </div>
    );
}

// Problem: How to reuse calculatePrice in other components?
// Where does subscription validation logic go?
```

**Scoring:** 48/100
- Consistency: 2/10 (no alignment with backend)
- Co-location: 3/10 (scattered)
- Reusability: 3/10 (tightly coupled to pages)
- Separation: 4/10 (logic mixed with presentation)
- Discoverability: 5/10 (have to search across pages)
- Team Scalability: 5/10 (conflicts common)

---

### Option 2: Component-Centric Structure

Organize by component types (forms, cards, tables).

```
resources/react/
├── pages/ (thin)
├── components/
│   ├── forms/
│   │   ├── LoginForm.tsx
│   │   ├── SubscriptionForm.tsx
│   │   └── AttendanceForm.tsx
│   ├── cards/
│   │   ├── PlanCard.tsx
│   │   └── EmployeeCard.tsx
│   └── tables/
└── hooks/
    ├── useAuth.ts
    ├── useSubscription.ts
    └── useAttendance.ts
```

**Pros:**
- ✅ Component reusability
- ✅ Clear component organization
- ✅ Thin pages

**Cons:**
- ❌ Still no domain boundaries (forms/ has auth, subscription, attendance mixed)
- ❌ Hard to find all subscription-related code
- ❌ Doesn't mirror backend structure
- ❌ Hooks and components separated (not co-located)

**Scoring:** 55/100
- Consistency: 3/10 (no backend alignment)
- Co-location: 4/10 (hooks separate from components)
- Reusability: 6/10 (better than page-centric)
- Separation: 7/10 (thin pages)
- Discoverability: 5/10 (scattered by type)
- Team Scalability: 6/10 (better but still conflicts)

---

### Option 3: Feature Modules (Domain-Driven)

Organize by domain features that mirror backend packages.

```
resources/react/
├── features/                    # Domain modules (mirror backend)
│   ├── auth/                   → packages/auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── TwoFactorModal.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   ├── utils/
│   │   │   └── auth.utils.ts
│   │   └── index.ts            # Barrel export
│   │
│   ├── subscription/           → packages/subscription/
│   │   ├── components/
│   │   │   ├── PlanCard.tsx
│   │   │   └── forms/
│   │   │       └── CreateSubscriptionForm.tsx
│   │   ├── hooks/
│   │   │   └── useSubscription.ts
│   │   ├── types/
│   │   │   ├── subscription.types.ts
│   │   │   └── enums.ts
│   │   ├── utils/
│   │   │   └── pricing.utils.ts
│   │   └── index.ts
│   │
│   └── tenancy/                → packages/tenancy/
│
├── pages/                      # Thin (orchestration only)
│   ├── central/
│   │   ├── auth/
│   │   │   └── login.tsx       # 20 lines max
│   │   ├── admin/
│   │   └── site/
│   └── tenant/
│
├── components/                 # Shared UI (not domain-specific)
│   ├── ui/                     # shadcn/ui
│   ├── common/                 # Header, Footer, Sidebar
│   └── forms/                  # Generic form components
│
├── layouts/
│   ├── CentralLayout.tsx
│   └── TenantLayout.tsx
│
├── hooks/                      # Global hooks
├── lib/                        # Global utils
└── types/                      # Global types
```

**Pros:**
- ✅ Perfect alignment with backend packages
- ✅ Co-located code (components + hooks + types together)
- ✅ Highly reusable (copy feature folder to new project)
- ✅ Clear domain boundaries
- ✅ Excellent discoverability (all subscription code in one folder)
- ✅ Team scalability (ownership per feature)
- ✅ Thin pages (logic in features)

**Cons:**
- ❌ More initial setup
- ❌ Learning curve (developers need to understand feature structure)
- ❌ Need to decide what goes in features vs shared components

**Example:**
```typescript
// pages/central/subscriptions/create.tsx (20 lines - thin page)
import { CentralLayout } from '@/layouts/CentralLayout';
import { CreateSubscriptionForm } from '@/features/subscription';

export default function CreateSubscription({ plans }: PageProps<{ plans: Plan[] }>) {
    return (
        <CentralLayout title="Create Subscription">
            <CreateSubscriptionForm plans={plans} />
        </CentralLayout>
    );
}

// features/subscription/components/forms/CreateSubscriptionForm.tsx
import { useCreateSubscription } from '@/features/subscription/hooks';
import { calculatePrice } from '@/features/subscription/utils';

export function CreateSubscriptionForm({ plans }: Props) {
    const { submit, processing, errors } = useCreateSubscription();
    
    return (
        <form onSubmit={submit}>
            {/* Clean JSX */}
        </form>
    );
}

// features/subscription/hooks/useCreateSubscription.ts
export function useCreateSubscription() {
    const { data, setData, post, processing, errors } = useForm<SubscriptionData>({
        plan_price_id: 0,
        subscriber_type: '',
    });
    
    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('subscriptions.store'));
    };
    
    return { data, setData, submit, processing, errors };
}

// All subscription logic co-located, reusable everywhere!
```

**Scoring:** 86/100
- Consistency: 10/10 (perfect backend alignment)
- Co-location: 9/10 (components + hooks + types together)
- Reusability: 9/10 (feature folders portable)
- Separation: 9/10 (pages thin, features fat)
- Discoverability: 10/10 (all subscription code in features/subscription/)
- Team Scalability: 9/10 (clear ownership)

---

## Decision Outcome

**Chosen option:** "Feature Modules (Domain-Driven)"

**Rationale:**

The feature module architecture scores highest (86/100) and provides the best alignment with our backend package structure:

1. **Consistency with Backend (25% weight):** Perfect 1:1 mapping:
   ```
   Backend                    Frontend
   ─────────────────────────────────────
   packages/auth/         →   features/auth/
   packages/subscription/ →   features/subscription/
   packages/tenancy/      →   features/tenancy/
   ```

2. **Co-location (20% weight):** Everything related to subscriptions is in `features/subscription/`:
   - Components: `PlanCard.tsx`, `SubscriptionStatus.tsx`
   - Hooks: `useSubscription.ts`, `usePlans.ts`
   - Types: `subscription.types.ts`, `enums.ts`
   - Utils: `pricing.utils.ts`, `subscription.utils.ts`

3. **Reusability (20% weight):** Entire feature module is portable:
   ```bash
   # Copy to another project
   cp -r resources/react/features/subscription ../new-project/resources/react/features/
   ```

4. **Clear Separation (15% weight):**
   - **Pages:** Routing + layout + data passing (thin, 10-30 lines)
   - **Features:** Business logic + UI components (fat)
   - **Shared Components:** Generic UI (buttons, inputs, cards)

5. **Team Scalability (10% weight):** Feature ownership model prevents conflicts:
   - Developer A owns `features/subscription/`
   - Developer B owns `features/attendance/`
   - Minimal merge conflicts

---

## Consequences

### Positive

- ✅ **Consistent Mental Model:** Developers understand backend → frontend mapping instantly
- ✅ **Co-location:** All subscription code in one place (DX improvement)
- ✅ **Thin Pages:** Pages become simple routers (easy to understand)
- ✅ **Reusable Features:** Copy feature folder to new project with minimal changes
- ✅ **Clear Boundaries:** Can't accidentally import `features/attendance` from `features/subscription`
- ✅ **Better Testing:** Test features in isolation
- ✅ **Barrel Exports:** Clean imports via `@/features/subscription`
- ✅ **Team Ownership:** Clear responsibility per feature

### Negative

- ❌ **Learning Curve:** Team needs 1 week to understand feature structure
- ❌ **Initial Setup:** More boilerplate (index.ts, folder structure)
- ❌ **Decision Overhead:** Need to decide feature vs shared component
- ❌ **More Files:** Feature that was 1 page is now page + feature folder

### Neutral

- ⚪ **Not Everything is a Feature:** Generic UI stays in `components/ui/`
- ⚪ **Pages Still Exist:** Inertia pages are entry points, features are logic

---

## Implementation Notes

### Feature Module Structure

Every feature follows this structure:

```
features/{feature-name}/
├── components/                 # Feature-specific UI components
│   ├── {Entity}Card.tsx
│   ├── {Entity}List.tsx
│   ├── {Entity}Status.tsx
│   └── forms/
│       ├── Create{Entity}Form.tsx
│       └── Edit{Entity}Form.tsx
│
├── hooks/                      # Feature-specific hooks
│   ├── use{Entity}.ts
│   ├── use{Entity}List.ts
│   └── useCreate{Entity}.ts
│
├── types/                      # Feature-specific types
│   ├── {entity}.types.ts
│   ├── {entity}-api.types.ts
│   └── enums.ts                # Mirror backend enums
│
├── utils/                      # Feature-specific utilities
│   ├── {entity}.utils.ts
│   ├── validation.ts
│   └── formatters.ts
│
└── index.ts                    # Barrel export (public API)
```

### Barrel Export Pattern

**`features/subscription/index.ts`:**
```typescript
// Components
export * from './components/PlanCard';
export * from './components/SubscriptionStatus';
export * from './components/forms/CreateSubscriptionForm';

// Hooks
export * from './hooks/useSubscription';
export * from './hooks/usePlans';

// Types
export * from './types/subscription.types';
export * from './types/enums';

// Utils
export * from './utils/pricing.utils';
```

**Usage:**
```typescript
// ✅ Good: Import from feature barrel
import { 
    PlanCard, 
    useSubscription, 
    type Subscription 
} from '@/features/subscription';

// ❌ Bad: Deep import (bypasses public API)
import { PlanCard } from '@/features/subscription/components/PlanCard';
```

### Page Structure

Pages are organized by context (Central vs Tenant):

```
pages/
├── central/                    # Central domain pages
│   ├── auth/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   │
│   ├── admin/                  # BackOffice (central management)
│   │   ├── dashboard.tsx
│   │   ├── tenants/
│   │   │   ├── index.tsx
│   │   │   ├── create.tsx
│   │   │   └── [id]/
│   │   │       ├── edit.tsx
│   │   │       └── show.tsx
│   │   ├── plans/
│   │   │   ├── index.tsx
│   │   │   └── create.tsx
│   │   └── subscriptions/
│   │       └── index.tsx
│   │
│   └── site/                   # FrontOffice (public pages)
│       ├── welcome.tsx
│       ├── pricing.tsx
│       └── about.tsx
│
└── tenant/                     # Tenant domain pages
    ├── dashboard.tsx
    ├── attendance/
    │   ├── index.tsx
    │   └── history.tsx
    ├── employees/
    │   ├── index.tsx
    │   └── [id]/
    │       └── show.tsx
    └── settings/
        └── index.tsx
```

### Page Pattern (Thin Orchestration)

```typescript
// pages/central/admin/subscriptions/create.tsx
import { Head } from '@inertiajs/react';
import { CentralLayout } from '@/layouts/CentralLayout';
import { CreateSubscriptionForm } from '@/features/subscription';
import type { Plan } from '@/features/subscription';
import type { PageProps } from '@/types';

interface CreateSubscriptionProps extends PageProps {
    plans: Plan[];
}

export default function CreateSubscription({ plans, auth }: CreateSubscriptionProps) {
    return (
        <CentralLayout user={auth.user}>
            <Head title="Create Subscription" />
            
            <div className="container mx-auto py-6">
                <h1 className="text-2xl font-bold mb-6">Create Subscription</h1>
                <CreateSubscriptionForm plans={plans} />
            </div>
        </CentralLayout>
    );
}

// Total: ~20 lines (thin page)
```

### Feature Component Pattern

```typescript
// features/subscription/components/forms/CreateSubscriptionForm.tsx
import { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateSubscription } from '@/features/subscription/hooks';
import type { Plan } from '@/features/subscription/types';

interface CreateSubscriptionFormProps {
    plans: Plan[];
}

export function CreateSubscriptionForm({ plans }: CreateSubscriptionFormProps) {
    const { data, setData, submit, processing, errors } = useCreateSubscription();
    
    return (
        <form onSubmit={submit} className="space-y-4">
            <div>
                <label htmlFor="plan">Select Plan</label>
                <select
                    id="plan"
                    value={data.plan_price_id}
                    onChange={(e) => setData('plan_price_id', Number(e.target.value))}
                    disabled={processing}
                >
                    <option value="">Choose a plan</option>
                    {plans.map(plan => (
                        <option key={plan.id} value={plan.id}>
                            {plan.name}
                        </option>
                    ))}
                </select>
                {errors.plan_price_id && (
                    <span className="text-red-500 text-sm">{errors.plan_price_id}</span>
                )}
            </div>
            
            <Button type="submit" disabled={processing}>
                {processing ? 'Creating...' : 'Create Subscription'}
            </Button>
        </form>
    );
}
```

### Custom Hook Pattern

```typescript
// features/subscription/hooks/useCreateSubscription.ts
import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import type { SubscriptionFormData } from '@/features/subscription/types';

export function useCreateSubscription() {
    const { data, setData, post, processing, errors, reset } = useForm<SubscriptionFormData>({
        plan_price_id: 0,
        subscriber_type: '',
        subscriber_id: 0,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        
        post(route('subscriptions.store'), {
            onSuccess: () => {
                reset();
                router.visit(route('subscriptions.index'));
            },
        });
    };

    return {
        data,
        setData,
        submit,
        processing,
        errors,
    };
}
```

### Type Safety (Mirror Backend)

```typescript
// features/subscription/types/enums.ts
// Mirror backend: packages/subscription/src/Enums/SubscriptionStatus.php

export enum SubscriptionStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    GRACE_PERIOD = 'grace_period',
    SUSPENDED = 'suspended',
    TERMINATED = 'terminated',
    CANCELLED = 'cancelled',
}

export enum CycleUnit {
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    YEAR = 'year',
}

// features/subscription/types/subscription.types.ts
// Mirror backend: packages/subscription/src/Models/Subscription.php

export interface Subscription {
    id: number;
    subscriber_type: string;
    subscriber_id: number;
    plan_price_id: number;
    starts_at: string | null;
    ends_at: string | null;
    cycle_count: number;
    cycle_unit: CycleUnit;
    amount: number;
    status: SubscriptionStatus;
    created_at: string;
    updated_at: string;
    
    // Relations
    plan_price?: PlanPrice;
}

export interface SubscriptionFormData {
    plan_price_id: number;
    subscriber_type: string;
    subscriber_id: number;
}
```

### TypeScript Path Aliases

**`tsconfig.json`:**
```json
{
    "compilerOptions": {
        "paths": {
            "@/*": ["./resources/react/*"],
            "@/features/*": ["./resources/react/features/*"],
            "@/components/*": ["./resources/react/components/*"],
            "@/layouts/*": ["./resources/react/layouts/*"]
        }
    }
}
```

**Usage:**
```typescript
// ✅ Clean imports
import { CreateSubscriptionForm } from '@/features/subscription';
import { Button } from '@/components/ui/button';
import { CentralLayout } from '@/layouts/CentralLayout';

// ❌ Relative imports (avoid)
import { CreateSubscriptionForm } from '../../../features/subscription';
```

### Shared Components vs Feature Components

**Rule of Thumb:**

```
Domain-specific? → features/{feature}/components/
├─ SubscriptionCard (only used in subscription pages)
├─ PlanSelector (subscription-specific logic)
└─ AttendanceTimer (attendance-specific)

Generic UI? → components/ui/
├─ Button (used everywhere)
├─ Input (generic form input)
└─ Card (generic container)

Application-wide? → components/common/
├─ Header (navigation)
├─ Sidebar (menu)
└─ Footer (site footer)
```

**Example:**
```typescript
// ❌ Bad: PlanCard in shared components
components/ui/PlanCard.tsx  // Too specific for "ui"

// ✅ Good: PlanCard in subscription feature
features/subscription/components/PlanCard.tsx

// ✅ Good: Button in shared UI
components/ui/button.tsx  // Generic, reusable everywhere
```

### Testing Features

```typescript
// features/subscription/hooks/__tests__/useCreateSubscription.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCreateSubscription } from '../useCreateSubscription';

describe('useCreateSubscription', () => {
    it('submits subscription data', async () => {
        const { result } = renderHook(() => useCreateSubscription());
        
        act(() => {
            result.current.setData('plan_price_id', 1);
        });
        
        expect(result.current.data.plan_price_id).toBe(1);
    });
});

// features/subscription/utils/__tests__/pricing.utils.test.ts
import { calculatePrice, formatCurrency } from '../pricing.utils';

describe('pricing utils', () => {
    it('calculates price correctly', () => {
        expect(calculatePrice(100, 12)).toBe(1200);
    });
    
    it('formats currency', () => {
        expect(formatCurrency(1000)).toBe('Rp 1.000');
    });
});
```

### Migration Strategy

**Week 1-2: Setup Structure**
```bash
# Create features directory
mkdir -p resources/react/features/{auth,subscription,shared}
```

**Week 3-4: Extract Components to Features**
```bash
# Move subscription components
mv resources/react/components/SubscriptionCard.tsx \
   resources/react/features/subscription/components/
```

**Week 5-6: Create Hooks and Utils**
```bash
# Extract logic from pages to hooks
resources/react/features/subscription/hooks/useSubscription.ts
```

**Week 7+: Gradual Migration**
- New features → Always use feature structure
- Old pages → Migrate when touching that code
- Coexistence: Old pages and new features work together

---

## Validation

### Feature Module Checklist

Each feature must have:
- [ ] `components/` directory with UI components
- [ ] `hooks/` directory with custom hooks
- [ ] `types/` directory with TypeScript types
- [ ] `utils/` directory with utility functions (if needed)
- [ ] `index.ts` barrel export
- [ ] No imports from other features (except shared)
- [ ] Types mirror backend models/enums

### Code Review

- [ ] New pages are thin (< 30 lines)
- [ ] Business logic in features (not pages)
- [ ] Imports use barrel exports (`@/features/subscription`)
- [ ] TypeScript types defined and used
- [ ] No cross-feature imports (subscription → attendance)

---

## References

- [Feature-Sliced Design](https://feature-sliced.design/)
- [Bulletproof React](https://github.com/alan2207/bulletproof-react)
- [Domain-Driven React](https://khalilstemmler.com/articles/client-side-architecture/introduction/)
- [Inertia.js Best Practices](https://inertiajs.com/)

---

## Related ADRs

- [ADR-0002: Package-Based Architecture](0002-package-based-architecture.md) - Backend packages that features mirror
- [ADR-0004: Inertia.js + React Stack](0004-inertia-react-stack.md) - Technology choices
- [ADR-0007: Type Safety Backend ↔ Frontend](0007-type-safety-backend-frontend.md) - Type synchronization

---

## Revision History

| Date       | Change Description      | Author        |
|------------|-------------------------|---------------|
| 2026-08-22 | Initial draft          | Technical Lead |

---

## Notes

**Pages are Entry Points, Features are Logic:** Pages should only handle routing, layout, and passing data to feature components. All business logic lives in features.

**Barrel Exports are Public APIs:** Only export what should be used outside the feature. Internal components/hooks can stay private.

**Co-location Wins:** Having components, hooks, types, and utils in one folder makes features self-contained and portable.

**Remember:** Feature modules are about consistency and co-location. If it helps developers find code faster and makes the codebase match the mental model, it's working.
