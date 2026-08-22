# ADR-0007: Type Safety Backend ↔ Frontend

**Status:** Accepted  
**Date:** 2026-08-22  
**Deciders:** Technical Lead, Frontend Team, Backend Team  
**Technical Story:** Type synchronization between Laravel and React

---

## Context

Absen.digital uses Laravel (PHP) for the backend and React (TypeScript) for the frontend, connected via Inertia.js. As the application grows, maintaining type consistency between backend and frontend becomes critical:

**Pain Points Without Type Safety:**
```typescript
// Backend: SubscriptionStatus enum changes
enum SubscriptionStatus: string {
    case PENDING = 'pending';
    case ACTIVE = 'active';
    case SUSPENDED = 'suspended';  // Added new status
}

// Frontend: Developer doesn't know about new status
function getBadgeColor(status: string) {  // Accepts any string
    switch (status) {
        case 'pending': return 'yellow';
        case 'active': return 'green';
        // Missing 'suspended' case → runtime bug
        default: return 'gray';
    }
}

// No compile-time error, bug discovered in production
```

**Challenges:**
- Backend types (PHP) don't automatically flow to frontend (TypeScript)
- Manual type definitions drift out of sync
- Enums, model properties, DTOs duplicated across layers
- Refactoring breaks frontend silently (no compile errors)
- Developer must remember to update types in two places

We need an automated approach to keep types synchronized.

---

## Decision Drivers

1. **Developer Experience** (Weight: 30%) - Minimize manual type maintenance
2. **Type Accuracy** (Weight: 25%) - Backend changes reflect in frontend immediately
3. **Refactoring Safety** (Weight: 20%) - TypeScript catches breaking changes
4. **Build Performance** (Weight: 10%) - Type generation shouldn't slow builds
5. **Team Adoption** (Weight: 10%) - Easy for team to use correctly
6. **Maintainability** (Weight: 5%) - Simple to understand and debug

---

## Considered Options

### Option 1: Manual Type Definitions

Manually write and maintain TypeScript types for all backend models.

```typescript
// Backend: packages/subscription/src/Models/Subscription.php
class Subscription extends Model
{
    protected $fillable = [
        'subscriber_type',
        'subscriber_id',
        'plan_price_id',
        'status',
        'amount',
    ];
}

// Frontend: Manually written types
// features/subscription/types/subscription.types.ts
export interface Subscription {
    id: number;
    subscriber_type: string;
    subscriber_id: number;
    plan_price_id: number;
    status: SubscriptionStatus;
    amount: number;
    created_at: string;
    updated_at: string;
}

// Developer must manually keep in sync!
```

**Pros:**
- ✅ No tooling needed
- ✅ Full control over types
- ✅ Can add frontend-specific properties

**Cons:**
- ❌ **High maintenance:** Every backend change needs manual frontend update
- ❌ **Drift:** Types get out of sync over time
- ❌ **No validation:** No way to ensure types match
- ❌ **Duplication:** Same data structure defined twice
- ❌ **Refactoring risk:** Rename field in backend → frontend breaks silently

**Scoring:** 40/100
- DX: 3/10 (high maintenance burden)
- Accuracy: 3/10 (drifts easily)
- Refactoring Safety: 2/10 (no safety)
- Build Performance: 10/10 (no build step)
- Adoption: 7/10 (simple to understand)
- Maintainability: 4/10 (tedious)

---

### Option 2: OpenAPI/Swagger Generation

Generate TypeScript from OpenAPI spec.

```yaml
# openapi.yaml (generated from Laravel)
components:
  schemas:
    Subscription:
      type: object
      properties:
        id:
          type: integer
        subscriber_type:
          type: string
        status:
          type: string
          enum: [pending, active, suspended]

# Command to generate TypeScript
npx openapi-typescript openapi.yaml --output types/api.ts
```

**Pros:**
- ✅ Industry standard (OpenAPI)
- ✅ Works with REST APIs
- ✅ Tooling ecosystem (Swagger UI, etc.)

**Cons:**
- ❌ **Requires REST API:** We use Inertia (no API layer)
- ❌ **Doesn't fit Inertia props:** Page props aren't API responses
- ❌ **Complex setup:** Need to generate OpenAPI spec from Laravel
- ❌ **Verbose types:** API-centric types (data wrappers, pagination)
- ❌ **Overkill:** We don't need full OpenAPI for internal types

**Scoring:** 52/100
- DX: 6/10 (automated but complex setup)
- Accuracy: 8/10 (accurate when generated)
- Refactoring Safety: 7/10 (catches mismatches)
- Build Performance: 6/10 (generation overhead)
- Adoption: 4/10 (requires API mindset)
- Maintainability: 5/10 (OpenAPI spec maintenance)

---

### Option 3: Laravel TypeScript Transformer (Spatie)

Use Spatie's package to auto-generate TypeScript from PHP classes.

```php
// Backend: packages/subscription/src/Enums/SubscriptionStatus.php
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
enum SubscriptionStatus: string
{
    case PENDING = 'pending';
    case ACTIVE = 'active';
    case SUSPENDED = 'suspended';
}

// Backend: packages/subscription/src/Data/SubscriptionData.php
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class SubscriptionData extends Data
{
    public function __construct(
        public int $planPriceId,
        public string $subscriberType,
        public int $subscriberId,
        public SubscriptionStatus $status,
    ) {}
}

// Command to generate TypeScript
php artisan typescript:generate

// Auto-generated: resources/react/types/generated.ts
export enum SubscriptionStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
}

export type SubscriptionData = {
    planPriceId: number;
    subscriberType: string;
    subscriberId: number;
    status: SubscriptionStatus;
};
```

**Pros:**
- ✅ **Single source of truth:** PHP classes are the source
- ✅ **Automatic sync:** Run command to regenerate types
- ✅ **Laravel-native:** Designed for Laravel + TypeScript stack
- ✅ **Works with Inertia:** Generates types for page props
- ✅ **Selective:** Only annotated classes are transformed
- ✅ **Enums supported:** PHP enums → TypeScript enums
- ✅ **Laravel Data integration:** DTOs with type casting

**Cons:**
- ❌ **Build step required:** Must run `php artisan typescript:generate`
- ❌ **Git noise:** Generated files change frequently
- ❌ **Not real-time:** Changes require regeneration (not watch mode)

**Scoring:** 86/100
- DX: 9/10 (automated, Laravel-native)
- Accuracy: 10/10 (generated from source)
- Refactoring Safety: 10/10 (TypeScript catches changes)
- Build Performance: 8/10 (fast generation)
- Adoption: 9/10 (simple annotation)
- Maintainability: 8/10 (clear source → generated flow)

---

### Option 4: TypeScript as Backend (tRPC/GraphQL)

Rewrite backend in TypeScript or use tRPC/GraphQL for type sharing.

**Pros:**
- ✅ Perfect type sharing (same language)
- ✅ End-to-end type safety

**Cons:**
- ❌ **Abandon Laravel:** Lose ecosystem, packages, tenancy
- ❌ **Rewrite backend:** Months of work
- ❌ **Team expertise:** Team knows Laravel, not Node.js backend
- ❌ **Not applicable:** We already chose Laravel (ADR-0004)

**Scoring:** 30/100 (not viable for this project)

---

## Decision Outcome

**Chosen option:** "Laravel TypeScript Transformer (Spatie)" ⭐

**Rationale:**

Spatie's Laravel TypeScript Transformer scores highest (86/100) and provides the best solution for our Laravel + React + Inertia stack:

1. **Developer Experience (30% weight):** Excellent automation
   - Add `#[TypeScript]` attribute to PHP classes
   - Run `php artisan typescript:generate`
   - TypeScript types automatically created
   - No manual type maintenance

2. **Type Accuracy (25% weight):** Perfect accuracy
   - PHP classes are single source of truth
   - TypeScript generated directly from PHP
   - Impossible for types to drift (regenerate anytime)

3. **Refactoring Safety (20% weight):** Maximum safety
   ```php
   // Backend: Rename field
   class SubscriptionData extends Data
   {
       public function __construct(
           public int $planId,  // Renamed from planPriceId
       ) {}
   }
   
   // Regenerate types
   php artisan typescript:generate
   
   // TypeScript immediately shows errors
   const data: SubscriptionData = {
       planPriceId: 1,  // ❌ TypeScript error: Property doesn't exist
       planId: 1,       // ✅ Correct
   };
   ```

4. **Laravel Integration:** Designed specifically for Laravel
   - Works with Laravel Data (DTOs)
   - Supports PHP 8.3+ enums
   - Handles nested objects, arrays, unions
   - Inertia.js page props supported

5. **Team Adoption:** Simple workflow
   ```
   1. Add #[TypeScript] attribute to PHP class
   2. Run php artisan typescript:generate
   3. Import generated types in React
   ```

---

## Consequences

### Positive

- ✅ **Single Source of Truth:** PHP classes define types, TypeScript follows
- ✅ **Automatic Sync:** Regenerate types anytime to catch drift
- ✅ **Refactoring Confidence:** TypeScript errors show breaking changes
- ✅ **No Manual Maintenance:** Don't write TypeScript types manually
- ✅ **Enum Support:** PHP enums → TypeScript enums (type-safe status checks)
- ✅ **IDE Autocomplete:** TypeScript provides full IntelliSense
- ✅ **Compile-Time Errors:** Catch type mismatches before runtime

### Negative

- ❌ **Build Step:** Must run `php artisan typescript:generate` after backend changes
- ❌ **Git Noise:** Generated files show diffs in commits
- ❌ **Not Real-Time:** Changes require manual regeneration (no watch mode)
- ❌ **Generated File Size:** Can grow large with many types

### Neutral

- ⚪ **Generated Files in Git:** Common practice to commit generated types
- ⚪ **Selective Transformation:** Only annotated classes transformed (intentional)

---

## Implementation Notes

### Installation

```bash
# Install Spatie Laravel Data (for DTOs)
composer require spatie/laravel-data

# Install TypeScript Transformer
composer require spatie/laravel-typescript-transformer --dev

# Publish config
php artisan vendor:publish --tag=typescript-transformer-config
```

### Configuration

**`config/typescript-transformer.php`:**
```php
<?php

return [
    /*
     * Paths to scan for TypeScript transformable classes
     */
    'searching_path' => [
        app_path(),
        base_path('packages'),  // Include packages
    ],

    /*
     * Output path for generated TypeScript
     */
    'output_file' => resource_path('react/types/generated.ts'),

    /*
     * Collectors gather classes to transform
     */
    'collectors' => [
        Spatie\TypeScriptTransformer\Collectors\DefaultCollector::class,
    ],

    /*
     * Transformers convert PHP to TypeScript
     */
    'transformers' => [
        Spatie\LaravelTypeScriptTransformer\Transformers\DtoTransformer::class,
        Spatie\TypeScriptTransformer\Transformers\EnumTransformer::class,
    ],

    /*
     * Auto-discover transformable classes (slower but convenient)
     */
    'auto_discover_types' => true,
];
```

### Annotating Backend Classes

**Enums:**
```php
// packages/subscription/src/Enums/SubscriptionStatus.php
namespace Packages\Subscription\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
enum SubscriptionStatus: string
{
    case PENDING = 'pending';
    case ACTIVE = 'active';
    case GRACE_PERIOD = 'grace_period';
    case SUSPENDED = 'suspended';
    case TERMINATED = 'terminated';
    case CANCELLED = 'cancelled';
}
```

**Data Transfer Objects:**
```php
// packages/subscription/src/DataTransferObjects/SubscriptionData.php
namespace Packages\Subscription\DataTransferObjects;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Packages\Subscription\Enums\SubscriptionStatus;

#[TypeScript]
class SubscriptionData extends Data
{
    public function __construct(
        public int $planPriceId,
        public string $subscriberType,
        public int $subscriberId,
        public ?int $cycleCount = 1,
        public ?SubscriptionStatus $status = SubscriptionStatus::PENDING,
    ) {}
}
```

**Eloquent Models:**
```php
// packages/subscription/src/Models/Subscription.php
namespace Packages\Subscription\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Packages\Subscription\Enums\SubscriptionStatus;

#[TypeScript]
class Subscription extends Model
{
    protected $fillable = [
        'subscriber_type',
        'subscriber_id',
        'plan_price_id',
        'starts_at',
        'ends_at',
        'cycle_count',
        'cycle_unit',
        'amount',
        'status',
    ];

    protected $casts = [
        'status' => SubscriptionStatus::class,
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'amount' => 'decimal:2',
    ];
}
```

### Generating TypeScript

```bash
# Generate types
php artisan typescript:generate

# Output: resources/react/types/generated.ts
```

**Generated Output:**
```typescript
// resources/react/types/generated.ts

export enum SubscriptionStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    GRACE_PERIOD = 'grace_period',
    SUSPENDED = 'suspended',
    TERMINATED = 'terminated',
    CANCELLED = 'cancelled',
}

export type SubscriptionData = {
    planPriceId: number;
    subscriberType: string;
    subscriberId: number;
    cycleCount: number | null;
    status: SubscriptionStatus | null;
};

export type Subscription = {
    id: number;
    subscriber_type: string;
    subscriber_id: number;
    plan_price_id: number;
    starts_at: string | null;
    ends_at: string | null;
    cycle_count: number;
    cycle_unit: string;
    amount: string;
    status: SubscriptionStatus;
    created_at: string;
    updated_at: string;
};
```

### Using Generated Types in Frontend

**Import and Use:**
```typescript
// features/subscription/components/SubscriptionCard.tsx
import { Subscription, SubscriptionStatus } from '@/types/generated';

interface SubscriptionCardProps {
    subscription: Subscription;
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
    const getBadgeColor = (status: SubscriptionStatus): string => {
        switch (status) {
            case SubscriptionStatus.ACTIVE:
                return 'green';
            case SubscriptionStatus.PENDING:
                return 'yellow';
            case SubscriptionStatus.SUSPENDED:
                return 'red';
            case SubscriptionStatus.GRACE_PERIOD:
                return 'orange';
            case SubscriptionStatus.TERMINATED:
            case SubscriptionStatus.CANCELLED:
                return 'gray';
            // TypeScript ensures all cases handled
        }
    };

    return (
        <div className="border rounded p-4">
            <h3>{subscription.plan_price_id}</h3>
            <span className={`badge badge-${getBadgeColor(subscription.status)}`}>
                {subscription.status}
            </span>
            <p>Amount: {subscription.amount}</p>
        </div>
    );
}
```

**Inertia Page Props:**
```typescript
// pages/central/admin/subscriptions/index.tsx
import { PageProps } from '@/types';
import { Subscription } from '@/types/generated';

interface SubscriptionsIndexProps extends PageProps {
    subscriptions: Subscription[];
}

export default function SubscriptionsIndex({ subscriptions, auth }: SubscriptionsIndexProps) {
    return (
        <div>
            <h1>Subscriptions</h1>
            {subscriptions.map(subscription => (
                <SubscriptionCard key={subscription.id} subscription={subscription} />
            ))}
        </div>
    );
}
```

### Automated Workflows

**Composer Script:**
```json
// composer.json
{
    "scripts": {
        "types:generate": [
            "@php artisan typescript:generate"
        ],
        "post-autoload-dump": [
            "@types:generate"
        ]
    }
}
```

**NPM Script:**
```json
// package.json
{
    "scripts": {
        "dev": "concurrently \"vite\" \"php artisan typescript:generate --watch\"",
        "build": "php artisan typescript:generate && vite build",
        "types": "php artisan typescript:generate"
    }
}
```

**Git Hook (Pre-commit):**
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Regenerate types before commit
php artisan typescript:generate

# Add generated file to commit if changed
git add resources/react/types/generated.ts
```

**CI/CD (Verify Types):**
```yaml
# .github/workflows/ci.yml
- name: Generate TypeScript types
  run: php artisan typescript:generate

- name: Check TypeScript
  run: pnpm tsc --noEmit

- name: Verify types are up to date
  run: |
    if [[ -n $(git status --porcelain resources/react/types/generated.ts) ]]; then
      echo "TypeScript types are out of sync!"
      exit 1
    fi
```

### Handling Complex Types

**Nested Objects:**
```php
#[TypeScript]
class SubscriptionWithRelations extends Data
{
    public function __construct(
        public int $id,
        public PlanPriceData $planPrice,  // Nested object
        public SubscriptionStatus $status,
    ) {}
}

// Generated TypeScript
export type SubscriptionWithRelations = {
    id: number;
    planPrice: PlanPriceData;  // Nested type
    status: SubscriptionStatus;
};
```

**Arrays:**
```php
#[TypeScript]
class TenantData extends Data
{
    public function __construct(
        public string $name,
        /** @var array<SubscriptionData> */
        public array $subscriptions,
    ) {}
}

// Generated TypeScript
export type TenantData = {
    name: string;
    subscriptions: Array<SubscriptionData>;
};
```

**Unions:**
```php
#[TypeScript]
class PaymentData extends Data
{
    public function __construct(
        public int|string $reference,  // Union type
        public string $method,
    ) {}
}

// Generated TypeScript
export type PaymentData = {
    reference: number | string;
    method: string;
};
```

### Organizing Generated Types

**Split by Package:**
```php
// config/typescript-transformer.php
'output_file' => null,  // Disable single file

'output' => [
    'path' => resource_path('react/types'),
    'structure' => 'package',  // Split by namespace
],

// Output structure:
resources/react/types/
├── packages/
│   ├── subscription.ts
│   ├── auth.ts
│   └── tenancy.ts
└── app.ts
```

**Barrel Export:**
```typescript
// resources/react/types/index.ts
export * from './generated';

// Or organize manually
export * from './generated/subscription';
export * from './generated/auth';
```

---

## Validation

### Success Criteria

**Type Accuracy:**
- [ ] Backend enum changes reflect in TypeScript immediately
- [ ] Model property changes cause TypeScript errors
- [ ] Renamed fields caught by TypeScript compiler

**Developer Experience:**
- [ ] IDE autocomplete works for generated types
- [ ] No manual type definitions needed
- [ ] Type generation < 5 seconds

**Build Integration:**
- [ ] Types generated automatically on `composer install`
- [ ] CI/CD verifies types are up to date
- [ ] TypeScript compilation passes

---

## References

- [Spatie Laravel TypeScript Transformer](https://github.com/spatie/laravel-typescript-transformer)
- [Spatie Laravel Data](https://github.com/spatie/laravel-data)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Inertia.js Type Safety](https://inertiajs.com/typescript)

---

## Related ADRs

- [ADR-0001: Service-Repository Pattern](0001-service-repository-pattern.md) - DTOs benefit from type generation
- [ADR-0004: Inertia.js + React Stack](0004-inertia-react-stack.md) - Type-safe page props

---

## Revision History

| Date       | Change Description      | Author        |
|------------|-------------------------|---------------|
| 2026-08-22 | Initial draft          | Technical Lead |

---

## Notes

**When to Regenerate:**
- After changing PHP enum values
- After adding/removing DTO properties
- After modifying model casts
- Before committing backend changes
- In CI/CD pipeline (verify)

**Best Practice:** Run `php artisan typescript:generate` frequently during development. Consider adding to file watcher or pre-commit hook.

**Git Strategy:** Commit generated types. This allows reviewers to see type changes in PRs and ensures types are always available.

**Alternative:** Some teams gitignore generated types and regenerate in CI/CD. This reduces git noise but requires all developers to generate types locally.

**Remember:** The goal is zero manual type maintenance. PHP is the source of truth, TypeScript follows automatically.
