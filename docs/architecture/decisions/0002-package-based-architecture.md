# ADR-0002: Package-Based Architecture

**Status:** Accepted  
**Date:** 2026-08-22  
**Deciders:** Technical Lead, Architecture Team  
**Technical Story:** Modular code organization for Absen Digital

---

## Context

Absen.digital is a multi-tenant SaaS platform that will evolve with multiple domain-specific features (authentication, subscription management, attendance tracking, employee management, reporting, etc.). As the application grows, we need a code organization strategy that:

- **Enables Reusability:** Core functionality (auth, subscriptions) should be portable to other Laravel projects
- **Enforces Boundaries:** Clear separation between Central (landlord) and Tenant contexts
- **Supports Team Scaling:** Multiple developers working on different domains without conflicts
- **Independent Testing:** Each module testable in isolation
- **Gradual Extraction:** Start internal, extract to Composer packages later if needed

The default Laravel structure (`app/Http`, `app/Models`) becomes difficult to navigate as the application grows. A large SaaS application can have:

- 50+ models
- 100+ controllers
- 200+ service classes

Without clear organization, developers waste time searching for files and accidentally create cross-domain dependencies.

Additionally, the multi-tenant architecture requires strict separation:

- **Central context:** Managing tenants, subscriptions, plans (absen_digital_central database)
- **Tenant context:** Attendance, employees, shifts (tenant-specific databases)

Mixing these contexts in a flat `app/` structure is error-prone.

---

## Decision Drivers

1. **Reusability** (Weight: 25%) - Components should be reusable in other projects
2. **Clear Boundaries** (Weight: 20%) - Prevent accidental cross-domain dependencies
3. **Team Scalability** (Weight: 20%) - Multiple developers working in parallel
4. **Discoverability** (Weight: 15%) - Easy to find code by domain
5. **Testing** (Weight: 10%) - Independent testing per module
6. **No Over-Engineering** (Weight: 10%) - Avoid unnecessary complexity

---

## Considered Options

### Option 1: Flat Laravel Structure (Default)

Keep everything in `app/` with subdirectories by type (Models, Controllers, Services).

```
app/
├── Http/Controllers/
│   ├── SubscriptionController.php
│   ├── TenantController.php
│   ├── AttendanceController.php
│   └── ... (50+ controllers)
├── Models/
│   ├── Subscription.php
│   ├── Tenant.php
│   ├── Attendance.php
│   └── ... (50+ models)
├── Services/
│   ├── SubscriptionService.php
│   ├── TenantService.php
│   └── ... (50+ services)
└── ...
```

**Pros:**

- ✅ Laravel standard structure
- ✅ No setup required
- ✅ Developers already familiar

**Cons:**

- ❌ Hard to navigate (50+ files per folder)
- ❌ No domain boundaries (AttendanceService can call SubscriptionService freely)
- ❌ Not reusable (tightly coupled to this project)
- ❌ Merge conflicts common (everyone touches same folders)
- ❌ Central vs Tenant separation unclear
- ❌ Can't extract features to other projects easily

**Scoring:** 45/100

- Reusability: 2/10 (very project-specific)
- Clear Boundaries: 3/10 (none enforced)
- Team Scalability: 4/10 (merge conflicts)
- Discoverability: 5/10 (hard to find related code)
- Testing: 6/10 (can test, but no isolation)
- No Over-Engineering: 10/10 (simplest)

---

### Option 2: Domain Folders in `app/`

Organize by domain within `app/` directory.

```
app/
├── Subscription/
│   ├── Controllers/
│   ├── Models/
│   ├── Services/
│   └── ...
├── Tenancy/
│   ├── Controllers/
│   ├── Models/
│   └── ...
└── Attendance/
    └── ...
```

**Pros:**

- ✅ Better discoverability
- ✅ Some domain isolation
- ✅ Still in Laravel's `app/` namespace

**Cons:**

- ❌ Not truly reusable (still coupled to this project)
- ❌ No enforcement of boundaries (can still cross-domain call)
- ❌ Can't have separate `composer.json` per domain
- ❌ Can't test domains independently
- ❌ Mixed with application code (hard to extract)

**Scoring:** 62/100

- Reusability: 4/10 (slightly better but still coupled)
- Clear Boundaries: 6/10 (visual but not enforced)
- Team Scalability: 7/10 (fewer conflicts)
- Discoverability: 8/10 (domain folders)
- Testing: 6/10 (same as flat)
- No Over-Engineering: 8/10 (still simple)

---

### Option 3: Internal Packages (Modular Monolith)

Create `packages/` directory with independent modules, each with its own structure and `composer.json`.

```
packages/
├── auth/
│   ├── src/
│   │   ├── Services/
│   │   ├── Actions/
│   │   ├── Models/
│   │   ├── Contracts/
│   │   └── AuthServiceProvider.php
│   ├── config/auth-package.php
│   ├── database/migrations/
│   ├── tests/
│   └── composer.json
│
├── subscription/
│   ├── src/
│   │   ├── Services/
│   │   ├── Actions/
│   │   ├── Models/
│   │   ├── Enums/
│   │   └── SubscriptionServiceProvider.php
│   ├── database/migrations/
│   ├── tests/
│   └── composer.json
│
└── shared/
    ├── src/
    │   ├── Abstracts/
    │   ├── Traits/
    │   └── Exceptions/
    └── composer.json
```

**Pros:**

- ✅ Highly reusable (copy package to other projects)
- ✅ Clear boundaries enforced by namespaces
- ✅ Independent testing per package
- ✅ Separate `composer.json` allows package-specific dependencies
- ✅ Team can work independently (ownership per package)
- ✅ Easy to extract as Composer package later
- ✅ Central vs Tenant enforced (packages/central vs packages/tenant)

**Cons:**

- ❌ More initial setup (folder structure, autoloading)
- ❌ Need to register service providers
- ❌ Slightly more complex than flat structure

**Scoring:** 83/100

- Reusability: 9/10 (almost fully portable)
- Clear Boundaries: 9/10 (namespace enforcement)
- Team Scalability: 9/10 (independent work)
- Discoverability: 8/10 (domain packages)
- Testing: 9/10 (isolated tests)
- No Over-Engineering: 7/10 (some complexity)

---

## Decision Outcome

**Chosen option:** "Internal Packages (Modular Monolith)"

**Rationale:**

The package-based architecture scores highest (83/100) and directly addresses our primary needs:

1. **Reusability (25% weight):** Packages are self-contained modules with their own `composer.json`. Moving a package to another Laravel project is as simple as:

   ```bash
   cp -r packages/subscription ../new-project/packages/
   composer dump-autoload
   ```

2. **Clear Boundaries (20% weight):** Namespace-based isolation prevents accidental dependencies:

   ```php
   // ✅ Allowed (within package)
   Packages\Subscription\Services\SubscriptionService
       → Packages\Subscription\Models\Subscription
   
   // ✅ Allowed (shared dependency)
   Packages\Subscription\Services\SubscriptionService
       → Packages\Shared\Abstracts\BaseService
   
   // ❌ Prevented by namespace (IDE will warn)
   Packages\Subscription\Services\SubscriptionService
       → Packages\Attendance\Models\Attendance
   ```

3. **Team Scalability (20% weight):** Package ownership model:
   - Developer A owns `packages/subscription/`
   - Developer B owns `packages/attendance/`
   - Minimal merge conflicts, clear responsibility

4. **Multi-Tenancy Fit:** Package structure naturally separates contexts:

   ```
   packages/
   ├── subscription/    # Central DB (tenants, plans, billing)
   ├── tenancy/         # Central DB (tenant management)
   ├── attendance/      # Tenant DB (attendance records)
   └── employee/        # Tenant DB (employee data)
   ```

5. **Future-Proof:** Start as internal packages (monolith), extract to separate repos/Composer packages later if needed (microservices migration path).

---

## Consequences

### Positive

- ✅ **Reusable Modules:** Copy package folder to reuse in other projects
- ✅ **Clear Ownership:** Each package has an owner (team/developer)
- ✅ **Independent Testing:** `./vendor/bin/pest packages/subscription/tests`
- ✅ **Namespace Safety:** IDE autocomplete shows only relevant classes
- ✅ **Package-Specific Dependencies:** Each package can require specific libraries
- ✅ **Documentation:** Each package has its own README with usage examples
- ✅ **Easy Extraction:** Promote internal package to Composer package without refactoring
- ✅ **Gradual Migration:** Old code in `app/`, new code in `packages/`, coexist during transition

### Negative

- ❌ **Initial Setup Time:** Need to create folder structure, autoloading, service providers
- ❌ **Learning Curve:** Team needs to understand package structure (1 week)
- ❌ **More Boilerplate:** Each package needs `composer.json`, service provider, README
- ❌ **Service Provider Registration:** Must register each package's service provider

### Neutral

- ⚪ **Monolith Still:** Still a single Laravel application, not microservices
- ⚪ **Optional Migration:** Can keep some code in `app/` (not everything must be packaged)

---

## Implementation Notes

### Standard Package Structure

Every package follows this structure:

```
packages/{package-name}/
├── src/                                    # Source code
│   ├── Services/                          # Business logic
│   │   └── {Entity}Service.php
│   ├── Actions/                           # Single-purpose operations
│   │   └── {Verb}{Entity}Action.php
│   ├── DataTransferObjects/               # Type-safe data
│   │   └── {Entity}Data.php
│   ├── Repositories/                      # Complex queries (optional)
│   │   └── {Entity}Repository.php
│   ├── Models/                            # Eloquent models
│   │   └── {Entity}.php
│   ├── Contracts/                         # Interfaces
│   │   └── {Service}Interface.php
│   ├── Events/                            # Domain events
│   │   └── {Entity}{Action}.php
│   ├── Listeners/                         # Event listeners
│   ├── Jobs/                              # Queue jobs
│   ├── Enums/                             # Enumerations
│   │   └── {Entity}Status.php
│   ├── Exceptions/                        # Package-specific exceptions
│   │   └── {Entity}Exception.php
│   ├── Middleware/                        # Package middleware (if needed)
│   └── {PackageName}ServiceProvider.php   # Service provider
│
├── config/                                 # Package configuration
│   └── {package-name}.php
│
├── database/                               # Database files
│   ├── migrations/                        # Central DB migrations
│   │   └── YYYY_MM_DD_create_{table}.php
│   └── migrations/tenant/                 # Tenant DB migrations (if applicable)
│       └── YYYY_MM_DD_create_{table}.php
│
├── tests/                                  # Package tests
│   ├── Unit/
│   │   ├── Services/
│   │   └── Actions/
│   └── Feature/
│       └── {Feature}Test.php
│
├── composer.json                           # Package dependencies
└── README.md                               # Package documentation
```

### Initial Package List

**Phase 1: Core Packages** (Implement first)

1. **`packages/shared/`** - Base classes, traits, utilities (dependency for all packages)
2. **`packages/auth/`** - Authentication & authorization
3. **`packages/setting/`** - Application settings management

**Phase 2: Domain Packages** (Implement later)
4. `packages/subscription/` - Billing, plans, subscriptions
5. `packages/tenancy/` - Tenant management
6. `packages/attendance/` - Attendance tracking
7. `packages/employee/` - Employee management
8. `packages/reporting/` - Reports & analytics

### Autoloading Configuration

**Root `composer.json`:**

```json
{
    "autoload": {
        "psr-4": {
            "App\\": "app/",
            "Packages\\Shared\\": "packages/shared/src/",
            "Packages\\Auth\\": "packages/auth/src/",
            "Packages\\Subscription\\": "packages/subscription/src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "Tests\\": "tests/"
        }
    },
    "extra": {
        "laravel": {
            "providers": [
                "Packages\\Auth\\AuthServiceProvider",
                "Packages\\Subscription\\SubscriptionServiceProvider"
            ]
        }
    }
}
```

After adding packages:

```bash
composer dump-autoload
```

### Package `composer.json` Template

**`packages/subscription/composer.json`:**

```json
{
    "name": "absendigital/subscription",
    "description": "Subscription and billing management package",
    "type": "library",
    "keywords": ["laravel", "subscription", "billing", "saas"],
    "license": "MIT",
    "authors": [
        {
            "name": "Absen Digital Team",
            "email": "dev@absen.digital"
        }
    ],
    "require": {
        "php": "^8.3",
        "illuminate/support": "^13.0",
        "illuminate/database": "^13.0"
    },
    "require-dev": {
        "pestphp/pest": "^5.1",
        "orchestra/testbench": "^10.0"
    },
    "autoload": {
        "psr-4": {
            "Packages\\Subscription\\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "Packages\\Subscription\\Tests\\": "tests/"
        }
    },
    "minimum-stability": "stable",
    "prefer-stable": true
}
```

### Service Provider Template

**`packages/subscription/src/SubscriptionServiceProvider.php`:**

```php
<?php

namespace Packages\Subscription;

use Illuminate\Support\ServiceProvider;

class SubscriptionServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Merge config
        $this->mergeConfigFrom(
            __DIR__.'/../config/subscription.php',
            'subscription'
        );

        // Register bindings
        $this->app->bind(
            Contracts\SubscriptionServiceInterface::class,
            Services\SubscriptionService::class
        );
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Publish config
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../config/subscription.php' => config_path('subscription.php'),
            ], 'subscription-config');
        }

        // Load migrations
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
        
        // Register events
        // Event::listen(...);
    }
}
```

### Package README Template

**`packages/subscription/README.md`:**

```markdown
# Subscription Package

Subscription and billing management for multi-tenant SaaS applications.

## Features

- Plan management (create, update, activate/deactivate)
- Subscription lifecycle (create, renew, suspend, cancel)
- Billing cycle management (monthly, yearly)
- Subscription status tracking (pending, active, grace period, suspended)

## Installation

This is an internal package. Autoloading is handled by root `composer.json`.

## Usage

### Creating a Subscription

```php
use Packages\Subscription\Services\SubscriptionService;
use Packages\Subscription\DataTransferObjects\SubscriptionData;

$service = app(SubscriptionService::class);

$subscription = $service->createSubscription(
    new SubscriptionData(
        subscriberType: Tenant::class,
        subscriberId: $tenant->id,
        planPriceId: $planPrice->id,
    )
);
```

### Renewing a Subscription

```php
$service->renewSubscription($subscription);
```

## Testing

```bash
./vendor/bin/pest packages/subscription/tests
```

## Configuration

Publish config:

```bash
php artisan vendor:publish --tag=subscription-config
```

## Dependencies

- `packages/shared` - Base classes and traits

## Authors

- Absen Digital Team

```

### Usage in Application Layer

**Application controllers use packages:**

```php
// app/Http/Controllers/Central/SubscriptionController.php
namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateSubscriptionRequest;
use Packages\Subscription\Services\SubscriptionService;
use Packages\Subscription\DataTransferObjects\SubscriptionData;

class SubscriptionController extends Controller
{
    public function __construct(
        private SubscriptionService $subscriptionService
    ) {}

    public function store(CreateSubscriptionRequest $request)
    {
        $subscription = $this->subscriptionService->createSubscription(
            SubscriptionData::fromRequest($request->validated())
        );

        return redirect()
            ->route('subscriptions.show', $subscription)
            ->with('success', 'Subscription created successfully!');
    }
}
```

### Testing Per Package

```bash
# Test single package
./vendor/bin/pest packages/subscription/tests

# Test all packages
./vendor/bin/pest packages/*/tests

# Test with coverage
./vendor/bin/pest packages/subscription/tests --coverage
```

### Package Dependencies

**Allowed:**

```php
// ✅ Package depends on shared package
Packages\Subscription\Services\SubscriptionService
    extends Packages\Shared\Abstracts\BaseService

// ✅ Package depends on Laravel
use Illuminate\Support\Facades\DB;

// ✅ Package depends on external composer package
use Carbon\Carbon;
```

**Not Allowed:**

```php
// ❌ Package depends on application code
Packages\Subscription\Services\SubscriptionService
    → App\Models\User  // NO! Package can't depend on App\

// ❌ Package depends on another domain package
Packages\Subscription\Services\SubscriptionService
    → Packages\Attendance\Models\Attendance  // NO! Cross-domain
```

**Exception:** If truly needed, define contract in `shared/`:

```php
// packages/shared/src/Contracts/UserServiceInterface.php
interface UserServiceInterface
{
    public function find(int $id): ?object;
}

// app/Services/UserService.php implements interface
class UserService implements Packages\Shared\Contracts\UserServiceInterface

// Package depends on interface (not implementation)
Packages\Subscription\Services\SubscriptionService
{
    public function __construct(
        private UserServiceInterface $userService  // Dependency injection
    ) {}
}
```

### Migration Strategy

**Week 1-2: Setup Structure**

```bash
# Create packages directory and shared package
mkdir -p packages/shared/src/{Abstracts,Traits,Exceptions}
```

**Week 3-4: Move Existing Code**

```bash
# Move Models to packages
mv app/Models/Central/Subscription.php packages/subscription/src/Models/
mv app/Enums/SubscriptionStatus.php packages/subscription/src/Enums/

# Update namespaces
# Old: App\Models\Central\Subscription
# New: Packages\Subscription\Models\Subscription
```

**Week 5-6: Create Services**

```bash
# Create new services in packages
packages/subscription/src/Services/SubscriptionService.php
```

**Week 7+: Gradual Migration**

- New features → Always in packages
- Old code → Migrate when touching that code
- Coexistence: `app/` and `packages/` work together

### Extraction to External Package

When ready to extract as external Composer package:

```bash
# 1. Create new repo
git init packages/subscription
cd packages/subscription

# 2. Add .gitignore
echo "vendor/
composer.lock" > .gitignore

# 3. Update composer.json name
{
    "name": "absendigital/subscription-package",
    "type": "library"
}

# 4. Push to GitHub/GitLab
git remote add origin git@github.com:absendigital/subscription-package.git
git push -u origin main

# 5. In main project, require as composer package
composer require absendigital/subscription-package

# 6. Update namespaces if needed
```

---

## Validation

### Package Structure Checklist

Each package must have:

- [ ] `src/` directory with proper namespacing
- [ ] `composer.json` with package metadata
- [ ] `README.md` with usage examples
- [ ] Service Provider registered in root `composer.json`
- [ ] Tests in `tests/` directory
- [ ] Migrations in `database/migrations/`
- [ ] No dependencies on `App\` namespace
- [ ] No dependencies on other domain packages (except `shared/`)

### Code Review

- [ ] New features added to appropriate package
- [ ] No cross-domain dependencies
- [ ] Service provider registered
- [ ] Tests included
- [ ] README updated with new features

---

## References

- [Laravel Package Development](https://laravel.com/docs/13.x/packages)
- [Modular Monolith (Martin Fowler)](https://martinfowler.com/bliki/MonolithFirst.html)
- [Package-by-Feature vs Package-by-Layer](https://phauer.com/2020/package-by-feature/)
- [Spatie Package Tools](https://github.com/spatie/laravel-package-tools)

---

## Related ADRs

- [ADR-0001: Service-Repository Pattern](0001-service-repository-pattern.md) - Services organized in packages
- [ADR-0003: Frontend Feature Modules](0003-frontend-feature-modules.md) - Frontend mirrors backend packages

---

## Revision History

| Date       | Change Description      | Author        |
|------------|-------------------------|---------------|
| 2026-08-22 | Initial draft          | Technical Lead |

---

## Notes

**Start Small:** Begin with 3 packages (shared, auth, subscription). Add more packages as needed. Don't create packages prematurely.

**Shared Package:** Always create `packages/shared/` first. It contains base classes that other packages depend on.

**Application Code:** Not everything belongs in packages. Application-specific code (controllers, middleware, requests) stays in `app/`. Packages contain reusable domain logic.

**Remember:** Packages are about reusability and boundaries, not perfection. If unsure whether something belongs in a package, keep it in `app/` initially and move it later when patterns emerge.
