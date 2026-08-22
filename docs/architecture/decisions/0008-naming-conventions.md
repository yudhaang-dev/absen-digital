# ADR-0008: Naming Conventions & Code Standards

**Status:** Accepted  
**Date:** 2026-08-22  
**Deciders:** Technical Lead, Engineering Team  
**Technical Story:** Establish consistent naming and coding standards

---

## Context

Absen.digital is built by a team using PHP (Laravel) for backend and TypeScript (React) for frontend. As the team grows and codebase expands, consistent naming conventions and code standards become critical for:

- **Code Readability:** Developers can quickly understand code structure
- **Onboarding:** New team members learn patterns quickly
- **Maintenance:** Consistent patterns reduce cognitive load
- **Code Reviews:** Clear standards make reviews faster
- **Tooling:** Linters and formatters enforce standards automatically

Without explicit standards, codebases develop inconsistencies:
```php
// Different developers, different styles
class subscriptionService { }          // Wrong casing
class Subscription_Repository { }      // Wrong separator
class SubscriptionsManager { }         // Inconsistent naming
class HandleSubscription { }           // Unclear purpose
```

We need to establish clear, enforceable standards for the entire team.

---

## Decision Drivers

1. **Consistency** (Weight: 30%) - Same patterns everywhere
2. **Clarity** (Weight: 25%) - Names reveal intent immediately
3. **Laravel/React Standards** (Weight: 20%) - Follow framework conventions
4. **Tooling Support** (Weight: 15%) - Automated enforcement possible
5. **Team Adoption** (Weight: 10%) - Easy to learn and remember

---

## Decision Outcome

**Chosen approach:** Adopt industry-standard conventions from Laravel, React, PSR-12, and Airbnb style guides, customized for our architecture.

---

## Backend Conventions (PHP/Laravel)

### Code Style: PSR-12

**Standard:** [PSR-12: Extended Coding Style](https://www.php-fig.org/psr/psr-12/)

**Enforced by:** Laravel Pint
```bash
# Format code
./vendor/bin/pint

# Check without fixing
./vendor/bin/pint --test
```

**Configuration (`pint.json`):**
```json
{
    "preset": "laravel",
    "rules": {
        "align_multiline_comment": true,
        "array_indentation": true,
        "blank_line_before_statement": {
            "statements": ["return", "throw"]
        },
        "method_chaining_indentation": true,
        "no_unused_imports": true
    }
}
```

---

### Namespaces

**Pattern:** PascalCase with `\` separator

```php
// ✅ Correct
namespace Packages\Subscription\Services;
namespace Packages\Subscription\DataTransferObjects;
namespace App\Http\Controllers\Central;

// ❌ Wrong
namespace packages\subscription\services;      // lowercase
namespace Packages_Subscription_Services;       // underscore
```

**Package Namespace Structure:**
```
Packages\{PackageName}\{Layer}\{Class}

Examples:
Packages\Subscription\Services\SubscriptionService
Packages\Subscription\Actions\CreateSubscriptionAction
Packages\Subscription\Models\Subscription
Packages\Auth\Services\AuthService
Packages\Shared\Abstracts\BaseService
```

---

### Classes

**Pattern:** PascalCase (singular noun)

**Services:**
```php
// ✅ Correct
class SubscriptionService { }
class TenantProvisioningService { }
class PaymentService { }

// ❌ Wrong
class subscriptionService { }          // lowercase
class SubscriptionsService { }         // plural
class ManageSubscriptions { }          // verb phrase
```

**Actions:**
```php
// Pattern: {Verb}{Entity}Action
// ✅ Correct
class CreateSubscriptionAction { }
class RenewSubscriptionAction { }
class SendEmailAction { }
class GenerateInvoiceAction { }

// ❌ Wrong
class SubscriptionCreateAction { }    // wrong order
class CreateAction { }                 // too generic
class DoSubscription { }               // unclear verb
```

**Data Transfer Objects:**
```php
// Pattern: {Entity}Data
// ✅ Correct
class SubscriptionData extends Data { }
class CreateSubscriptionData extends Data { }
class PlanPriceData extends Data { }

// ❌ Wrong
class SubscriptionDTO { }              // Use Data suffix
class SubscriptionRequest { }          // Request is for HTTP
class SubscriptionPayload { }          // Use Data suffix
```

**Repositories:**
```php
// Pattern: {Entity}Repository
// ✅ Correct
class SubscriptionRepository { }
class TenantRepository { }

// ❌ Wrong
class SubscriptionsRepository { }      // plural
class SubscriptionRepo { }             // no abbreviations
```

**Models:**
```php
// Pattern: Singular noun (PascalCase)
// ✅ Correct
class Subscription extends Model { }
class PlanPrice extends Model { }
class Tenant extends Model { }

// ❌ Wrong
class Subscriptions extends Model { }   // plural
class subscription extends Model { }    // lowercase
```

**Enums:**
```php
// Pattern: {Entity}{Property} or {Entity}Status
// ✅ Correct
enum SubscriptionStatus: string { }
enum CycleUnit: string { }
enum PaymentMethod: string { }

// ❌ Wrong
enum Status: string { }                // too generic
enum SubscriptionStatuses: string { }  // plural
```

**Exceptions:**
```php
// Pattern: {Entity}Exception or {Specific}Exception
// ✅ Correct
class SubscriptionNotFoundException extends Exception { }
class InvalidSubscriptionStatusException extends Exception { }
class TenantNotFoundException extends Exception { }

// ❌ Wrong
class SubscriptionError { }            // use Exception
class NotFound { }                     // too generic
```

---

### Methods

**Pattern:** camelCase (verb phrase)

```php
// ✅ Correct
public function createSubscription(SubscriptionData $data): Subscription
public function renewSubscription(Subscription $subscription): Subscription
public function findActiveSubscriptions(): Collection
public function hasActiveSubscription(): bool

// ❌ Wrong
public function CreateSubscription() { }        // PascalCase
public function subscription_create() { }       // snake_case
public function subscription() { }              // noun (use get/find prefix)
```

**Boolean Methods:**
```php
// Prefix: is, has, can, should, will
// ✅ Correct
public function isActive(): bool
public function hasPermission(): bool
public function canAccessTenant(): bool
public function shouldRenew(): bool

// ❌ Wrong
public function active(): bool                  // no prefix
public function checkPermission(): bool         // use has
```

**Getters:**
```php
// Prefix: get, find, fetch
// ✅ Correct (when returning single item)
public function getSubscription(int $id): ?Subscription
public function findByTenant(Tenant $tenant): ?Subscription

// ✅ Correct (when returning collection)
public function getActiveSubscriptions(): Collection
public function findExpiring(): Collection

// ❌ Wrong
public function subscription(int $id) { }       // no verb
public function subscriptions() { }             // no verb
```

---

### Variables & Properties

**Pattern:** camelCase

```php
// ✅ Correct
$subscription = Subscription::find($id);
$planPrice = PlanPrice::find($priceId);
$activeSubscriptions = Subscription::where('status', 'active')->get();

private SubscriptionService $subscriptionService;
protected int $tenantId;

// ❌ Wrong
$Subscription = ...;                   // PascalCase
$plan_price = ...;                     // snake_case
$active_subscriptions = ...;           // snake_case
```

---

### Constants

**Pattern:** SCREAMING_SNAKE_CASE

```php
// ✅ Correct
const MAX_SUBSCRIPTIONS_PER_TENANT = 10;
const DEFAULT_CYCLE_UNIT = 'month';
const TRIAL_PERIOD_DAYS = 14;

// ❌ Wrong
const maxSubscriptions = 10;           // camelCase
const MaxSubscriptions = 10;           // PascalCase
```

---

### Database

**Tables:**
```sql
-- Pattern: snake_case, plural
-- ✅ Correct
subscriptions
plan_prices
tenant_users

-- ❌ Wrong
Subscriptions                    -- PascalCase
subscription                     -- singular
planPrices                       -- camelCase
```

**Columns:**
```sql
-- Pattern: snake_case
-- ✅ Correct
subscriber_type
plan_price_id
created_at

-- ❌ Wrong
subscriberType                   -- camelCase
SubscriberType                   -- PascalCase
```

**Foreign Keys:**
```sql
-- Pattern: {table}_id
-- ✅ Correct
plan_price_id
tenant_id
user_id

-- ❌ Wrong
planPriceId                      -- camelCase
price_id                         -- unclear reference
plan_price                       -- missing _id
```

**Pivot Tables:**
```sql
-- Pattern: {table1}_{table2} (alphabetical)
-- ✅ Correct
plan_tenant
subscription_user
tenant_user

-- ❌ Wrong
tenant_plan                      -- wrong order
tenants_plans                    -- plural
plan_to_tenant                   -- unnecessary words
```

---

### Files & Directories

**PHP Files:**
```
packages/subscription/src/Services/SubscriptionService.php
packages/subscription/src/Actions/CreateSubscriptionAction.php
packages/subscription/src/Models/Subscription.php

✅ Match class name exactly
❌ subscription-service.php
❌ SubscriptionService.class.php
```

**Directories:**
```
packages/subscription/src/Services/
packages/subscription/src/DataTransferObjects/
packages/subscription/database/migrations/

✅ PascalCase, plural when containing multiple items
❌ services/
❌ data-transfer-objects/
```

---

## Frontend Conventions (TypeScript/React)

### Code Style: Airbnb + Prettier

**Standards:**
- [Airbnb JavaScript Style Guide](https://airbnb.io/javascript/react/)
- [Prettier](https://prettier.io/)

**Enforced by:** ESLint + Prettier
```bash
# Check linting
pnpm lint

# Fix linting issues
pnpm lint --fix

# Format code
pnpm format
```

**Configuration:**
```javascript
// eslint.config.js
import airbnb from 'eslint-config-airbnb';
import prettier from 'eslint-config-prettier';

export default [
    airbnb,
    prettier,
    {
        rules: {
            'react/react-in-jsx-scope': 'off',  // React 19
            'react/prop-types': 'off',          // Using TypeScript
            'import/prefer-default-export': 'off',
        },
    },
];
```

---

### Components

**Pattern:** PascalCase

```typescript
// ✅ Correct
export function SubscriptionCard() { }
export function CreateSubscriptionForm() { }
export function PlanPriceList() { }

// ❌ Wrong
export function subscriptionCard() { }    // camelCase
export function subscription_card() { }   // snake_case
export function subscription-card() { }   // kebab-case
```

**File Names:**
```
features/subscription/components/SubscriptionCard.tsx
features/subscription/components/forms/CreateSubscriptionForm.tsx
components/ui/button.tsx

✅ PascalCase for components
✅ kebab-case for utility/config files
❌ subscription-card.tsx
❌ SubscriptionCard.component.tsx
```

---

### Hooks

**Pattern:** `use{Name}` (camelCase)

```typescript
// ✅ Correct
export function useSubscription() { }
export function useCreateSubscription() { }
export function useAuth() { }
export function useLocalStorage() { }

// ❌ Wrong
export function subscriptionHook() { }     // no use prefix
export function UseSubscription() { }      // PascalCase
export function use_subscription() { }     // snake_case
```

**File Names:**
```
features/subscription/hooks/useSubscription.ts
features/subscription/hooks/useCreateSubscription.ts
hooks/useDebounce.ts

✅ Match hook name exactly
❌ subscription-hook.ts
❌ subscription.hook.ts
```

---

### Types & Interfaces

**Pattern:** PascalCase

```typescript
// ✅ Correct (Types)
export type Subscription = { };
export type SubscriptionStatus = 'active' | 'pending';
export type CreateSubscriptionData = { };

// ✅ Correct (Interfaces)
export interface SubscriptionCardProps { }
export interface CreateSubscriptionFormProps { }

// ❌ Wrong
export type subscription = { };           // lowercase
export interface ISubscription { }        // Hungarian notation (I prefix)
export type TSubscription = { };          // Hungarian notation (T prefix)
```

**Props Interfaces:**
```typescript
// Pattern: {ComponentName}Props
// ✅ Correct
interface SubscriptionCardProps {
    subscription: Subscription;
    onEdit?: () => void;
}

interface CreateSubscriptionFormProps {
    plans: Plan[];
}

// ❌ Wrong
interface SubscriptionCardProperties { }   // verbose
interface ISubscriptionCardProps { }       // I prefix
interface Props { }                        // too generic
```

---

### Constants

**Pattern:** SCREAMING_SNAKE_CASE or camelCase

```typescript
// ✅ Correct (for true constants)
const MAX_FILE_SIZE = 5_000_000;
const DEFAULT_PAGE_SIZE = 20;
const API_BASE_URL = 'https://api.example.com';

// ✅ Correct (for config objects)
const apiConfig = {
    baseUrl: 'https://api.example.com',
    timeout: 5000,
};

// ❌ Wrong
const maxFileSize = 5000000;              // camelCase for number constant
const max_file_size = 5000000;            // snake_case in TypeScript
```

---

### Variables & Functions

**Pattern:** camelCase

```typescript
// ✅ Correct
const subscription = data.subscription;
const activeSubscriptions = subscriptions.filter(s => s.status === 'active');

function calculateTotal(items: Item[]): number { }
function formatCurrency(amount: number): string { }

// ❌ Wrong
const Subscription = ...;                 // PascalCase
const active_subscriptions = ...;         // snake_case
```

---

### Files & Directories

**Component Files:**
```
features/subscription/components/SubscriptionCard.tsx
features/subscription/components/forms/CreateSubscriptionForm.tsx
components/ui/button.tsx

✅ PascalCase for components
✅ Match component name
```

**Hook Files:**
```
features/subscription/hooks/useSubscription.ts
features/auth/hooks/useAuth.ts

✅ camelCase with 'use' prefix
```

**Utility Files:**
```
features/subscription/utils/pricing.utils.ts
features/subscription/utils/validation.ts
lib/utils.ts
lib/date.ts

✅ kebab-case for utility files
✅ .utils.ts suffix for utility files (optional)
```

**Type Files:**
```
features/subscription/types/subscription.types.ts
features/subscription/types/enums.ts
types/index.ts
types/inertia.d.ts

✅ kebab-case
✅ .types.ts suffix for type-only files
```

**Page Files:**
```
pages/central/admin/subscriptions/index.tsx
pages/central/admin/subscriptions/create.tsx
pages/central/admin/subscriptions/[id]/edit.tsx

✅ kebab-case for route-based pages
✅ Match URL structure
```

---

### Directories

```
features/subscription/
├── components/          ✅ lowercase, plural
├── hooks/              ✅ lowercase, plural
├── types/              ✅ lowercase, plural
├── utils/              ✅ lowercase, plural
└── index.ts            ✅ lowercase

pages/central/admin/    ✅ lowercase, matches routes
```

---

## Import/Export Conventions

### Backend (PHP)

**One class per file:**
```php
// ✅ Correct
// File: SubscriptionService.php
namespace Packages\Subscription\Services;

class SubscriptionService { }

// ❌ Wrong (multiple classes in one file)
class SubscriptionService { }
class PlanService { }
```

**Import order:**
```php
<?php

// 1. Declare strict types
declare(strict_types=1);

// 2. Namespace
namespace Packages\Subscription\Services;

// 3. Imports (alphabetical)
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Packages\Shared\Abstracts\BaseService;
use Packages\Subscription\Actions\CreateSubscriptionAction;
use Packages\Subscription\Models\Subscription;

class SubscriptionService extends BaseService { }
```

---

### Frontend (TypeScript)

**Named exports (preferred):**
```typescript
// ✅ Correct (named exports)
export function SubscriptionCard() { }
export function PlanCard() { }

// Import
import { SubscriptionCard, PlanCard } from '@/features/subscription';
```

**Default exports (pages only):**
```typescript
// ✅ Correct (Inertia pages require default export)
export default function CreateSubscription() { }

// Import
import CreateSubscription from '@/pages/subscriptions/create';
```

**Barrel exports:**
```typescript
// features/subscription/index.ts
export * from './components/SubscriptionCard';
export * from './components/PlanCard';
export * from './hooks/useSubscription';
export * from './types/subscription.types';

// Usage
import { 
    SubscriptionCard, 
    useSubscription,
    type Subscription 
} from '@/features/subscription';
```

**Import order:**
```typescript
// 1. React/External libraries
import { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';

// 2. Internal packages
import { SubscriptionCard } from '@/features/subscription';
import { Button } from '@/components/ui/button';

// 3. Types
import type { Subscription } from '@/types/generated';
import type { PageProps } from '@/types';

// 4. Relative imports (avoid if possible)
import { helper } from './utils';
```

---

## Documentation Standards

### PHPDoc

```php
/**
 * Create a new subscription for a tenant.
 *
 * @param  SubscriptionData  $data  The subscription data
 * @return Subscription The created subscription
 * @throws SubscriptionNotFoundException
 */
public function createSubscription(SubscriptionData $data): Subscription
{
    // ...
}
```

### TSDoc

```typescript
/**
 * Calculate the total price for a subscription.
 * 
 * @param basePrice - The base price before discounts
 * @param discount - The discount percentage (0-100)
 * @returns The final price after discount
 */
export function calculatePrice(basePrice: number, discount: number): number {
    return basePrice * (1 - discount / 100);
}
```

---

## Route Naming

### Backend Routes

```php
// Pattern: {resource}.{action}
// ✅ Correct
Route::get('/subscriptions', [SubscriptionController::class, 'index'])
    ->name('subscriptions.index');

Route::get('/subscriptions/create', [SubscriptionController::class, 'create'])
    ->name('subscriptions.create');

Route::post('/subscriptions', [SubscriptionController::class, 'store'])
    ->name('subscriptions.store');

Route::get('/subscriptions/{subscription}', [SubscriptionController::class, 'show'])
    ->name('subscriptions.show');

// ❌ Wrong
->name('subscription-index');          // kebab-case
->name('showSubscription');             // camelCase
->name('subscriptions_index');          // snake_case
```

---

## Environment Variables

**Pattern:** SCREAMING_SNAKE_CASE

```bash
# ✅ Correct
APP_NAME="Absen Digital"
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
CENTRAL_DOMAIN=absen.digital

# ❌ Wrong
appName="Absen Digital"               # camelCase
db-connection=mysql                   # kebab-case
```

---

## Git Conventions

### Branch Names

```bash
# Pattern: {type}/{description}
# ✅ Correct
feature/subscription-renewal
bugfix/tenant-isolation-leak
hotfix/payment-processing-error
chore/update-dependencies

# ❌ Wrong
subscription_renewal                  # no type
Feature/SubscriptionRenewal           # PascalCase
feat-subscription-renewal             # abbreviated type
```

### Commit Messages

```bash
# Pattern: {type}: {description}
# ✅ Correct
feat: add subscription renewal flow
fix: resolve tenant data leakage
docs: update ADR for testing strategy
refactor: extract subscription logic to service
test: add integration tests for auth

# ❌ Wrong
Add subscription renewal                # no type
feat: Added subscription renewal flow   # past tense
FEAT: add subscription renewal          # uppercase type
```

---

## Validation & Enforcement

### Automated Tools

**Backend:**
```bash
# Laravel Pint (PSR-12)
./vendor/bin/pint

# PHPStan (static analysis)
./vendor/bin/phpstan analyse

# Pest (testing)
./vendor/bin/pest
```

**Frontend:**
```bash
# ESLint (linting)
pnpm lint

# Prettier (formatting)
pnpm format

# TypeScript (type checking)
pnpm types:check

# Vitest (testing)
pnpm test
```

### CI/CD Checks

```yaml
# .github/workflows/ci.yml
- name: Check code style (PHP)
  run: ./vendor/bin/pint --test

- name: Static analysis (PHP)
  run: ./vendor/bin/phpstan analyse

- name: Check code style (TypeScript)
  run: pnpm lint:check

- name: Check formatting (TypeScript)
  run: pnpm format:check

- name: Type check (TypeScript)
  run: pnpm types:check
```

### Pre-commit Hooks

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running code quality checks..."

# PHP
./vendor/bin/pint --test || exit 1
./vendor/bin/phpstan analyse || exit 1

# TypeScript
pnpm lint:check || exit 1
pnpm format:check || exit 1
pnpm types:check || exit 1

echo "✓ All checks passed"
```

---

## IDE Configuration

### VS Code Settings

```json
{
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "[php]": {
        "editor.defaultFormatter": "bmewburn.vscode-intelephense-client"
    },
    "[typescript]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[typescriptreact]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    }
}
```

---

## References

- [PSR-12: Extended Coding Style](https://www.php-fig.org/psr/psr-12/)
- [Laravel Conventions](https://laravel.com/docs/13.x/contributions#coding-style)
- [Airbnb JavaScript Style Guide](https://airbnb.io/javascript/react/)
- [TypeScript Guidelines](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

## Related ADRs

- [ADR-0001: Service-Repository Pattern](0001-service-repository-pattern.md) - Class naming patterns
- [ADR-0002: Package-Based Architecture](0002-package-based-architecture.md) - Namespace organization

---

## Revision History

| Date       | Change Description      | Author        |
|------------|-------------------------|---------------|
| 2026-08-22 | Initial draft          | Technical Lead |

---

## Notes

**Consistency Over Perfection:** These conventions are not perfect, but they are consistent. Follow them even if you disagree with specific choices.

**Tooling Enforces Standards:** Use Pint, ESLint, and Prettier to automate formatting. Don't argue about style in code reviews - let tools handle it.

**When in Doubt:** Follow Laravel/React framework conventions. If the framework doesn't specify, follow industry standards (PSR-12 for PHP, Airbnb for JavaScript/TypeScript).

**Living Document:** These conventions can evolve. Propose changes via ADR process, not ad-hoc in code reviews.

**Remember:** Good naming reveals intent. `CreateSubscriptionAction` is immediately clear. `Handle` or `Process` requires reading implementation.
