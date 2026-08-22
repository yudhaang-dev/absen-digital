# ADR-0001: Service-Repository Pattern for Business Logic

**Status:** Accepted  
**Date:** 2026-08-22  
**Deciders:** Technical Lead, Architecture Team  
**Technical Story:** Initial architecture design for Absen Digital

---

## Context

Absen.digital is a multi-tenant SaaS attendance management system built with Laravel 13 and React 19. The project requires an architectural pattern that supports:

- **DRY Principle:** Business logic must be reusable across controllers, queue jobs, artisan commands, and tests
- **Reusability:** Components should be portable to other projects
- **Scalability:** Easy to add new features without modifying existing code
- **Maintainability:** Clear separation of concerns, avoiding fat controllers/models
- **No Over-Engineering:** Pragmatic approach suitable for a team building an MVP with growth potential

The starter kit uses Laravel's default MVC structure, which is suitable for simple applications but tends to lead to:
- Fat controllers with business logic mixed with HTTP concerns
- Fat models with hundreds of methods handling multiple responsibilities
- Difficulty reusing logic outside HTTP request lifecycle
- Challenges testing business logic in isolation

Additionally, the multi-tenant nature (Central vs Tenant contexts) requires clear architectural boundaries to prevent cross-context contamination.

---

## Decision Drivers

1. **DRY Principle** (Weight: 20%) - Business logic must be reusable across all application layers
2. **Reusability** (Weight: 20%) - Components should be portable to other Laravel projects
3. **Scalability** (Weight: 15%) - Architecture should support feature growth without major refactoring
4. **No Over-Engineering** (Weight: 15%) - Avoid unnecessary complexity that slows development
5. **Development Speed** (Weight: 15%) - Pattern should not significantly slow initial development
6. **Team Onboarding** (Weight: 15%) - Pattern should be learnable by junior developers within 1-2 weeks

---

## Considered Options

### Option 1: Pure MVC (Laravel Default)

Stick with Laravel's default MVC architecture with controllers, models, and views (Inertia pages).

**Pros:**
- ✅ Fast initial development (no additional layers)
- ✅ Laravel standard, extensive documentation available
- ✅ Team already familiar with the pattern
- ✅ Minimal file overhead
- ✅ Direct use of Eloquent ORM features

**Cons:**
- ❌ Fat controllers inevitable (business logic mixed with HTTP handling)
- ❌ Fat models inevitable (200+ line models common)
- ❌ Logic not reusable in Queue Jobs without duplicating code
- ❌ Testing requires full HTTP layer setup or database access
- ❌ Multi-tenancy logic gets mixed into models (tenant_id checks everywhere)
- ❌ Hard to enforce team conventions (everyone has different approaches)

**Example of Problem:**
```php
// SubscriptionController.php (Fat Controller - 150+ lines)
public function store(Request $request)
{
    $validated = $request->validate([
        'plan_price_id' => 'required|exists:plan_prices,id',
        'subscriber_type' => 'required',
        'subscriber_id' => 'required',
    ]);
    
    // Business logic in controller
    $planPrice = PlanPrice::findOrFail($validated['plan_price_id']);
    
    DB::beginTransaction();
    try {
        $subscription = Subscription::create([
            'subscriber_type' => $validated['subscriber_type'],
            'subscriber_id' => $validated['subscriber_id'],
            'plan_price_id' => $planPrice->id,
            'cycle_count' => $planPrice->cycle_count,
            'cycle_unit' => $planPrice->cycle_unit,
            'amount' => $planPrice->price,
            'starts_at' => now(),
            'ends_at' => now()->addMonths($planPrice->cycle_count),
            'status' => SubscriptionStatus::PENDING,
        ]);
        
        // Send email
        Mail::to($subscription->subscriber->email)->send(
            new SubscriptionCreatedMail($subscription)
        );
        
        // Create invoice
        Invoice::create([
            'subscription_id' => $subscription->id,
            'amount' => $planPrice->price,
            'due_date' => now()->addDays(7),
        ]);
        
        // Log activity
        activity()
            ->performedOn($subscription)
            ->log('Subscription created');
            
        DB::commit();
    } catch (\Exception $e) {
        DB::rollBack();
        throw $e;
    }
    
    return redirect()->route('subscriptions.show', $subscription);
}

// Problem: How to reuse this logic in:
// - Queue Job for bulk subscription creation
// - Artisan Command for admin-initiated subscriptions
// - API endpoint (future mobile app)
// - Tests without hitting HTTP layer
```

**Scoring:** 59/90
- DRY: 4/10 (logic duplicated across layers)
- Reusability: 3/10 (tightly coupled to framework)
- Scalability: 5/10 (becomes messy with more features)
- No Over-Engineering: 9/10 (very simple)
- Development Speed: 9/10 (fastest initially)
- Team Onboarding: 10/10 (everyone knows MVC)

---

### Option 2: Domain-Driven Design (Full DDD)

Implement a complete DDD approach with Aggregates, Value Objects, Domain Services, Repositories, and Application Services.

**Pros:**
- ✅ Perfect isolation of business logic from infrastructure
- ✅ Highly testable without any framework dependencies
- ✅ Clear domain boundaries using Ubiquitous Language
- ✅ Excellent for complex business rules
- ✅ Framework-agnostic (can swap Laravel for another framework)

**Cons:**
- ❌ Massive over-engineering for an attendance system
- ❌ Steep learning curve (2-3 months for team to become productive)
- ❌ Development 3x slower than MVC (every feature requires 10+ files)
- ❌ Doesn't leverage Laravel's magic (Eloquent, Events, etc.)
- ❌ Excessive boilerplate for straightforward CRUD operations
- ❌ Hard to find Laravel developers with DDD experience

**Example Structure:**
```php
// Just to create a subscription, you'd need:

// 1. Value Objects
Domain/Subscription/ValueObjects/SubscriptionId.php
Domain/Subscription/ValueObjects/Money.php
Domain/Subscription/ValueObjects/BillingCycle.php
Domain/Subscription/ValueObjects/SubscriptionStatus.php

// 2. Entity
Domain/Subscription/Entities/Subscription.php

// 3. Aggregate Root
Domain/Subscription/Aggregates/SubscriptionAggregate.php

// 4. Domain Service
Domain/Subscription/Services/SubscriptionDomainService.php

// 5. Repository Interface
Domain/Subscription/Repositories/SubscriptionRepositoryInterface.php

// 6. Repository Implementation
Infrastructure/Persistence/Eloquent/EloquentSubscriptionRepository.php

// 7. Command
Application/Subscription/Commands/CreateSubscriptionCommand.php

// 8. Command Handler
Application/Subscription/Handlers/CreateSubscriptionCommandHandler.php

// 9. DTO
Application/Subscription/DataTransferObjects/CreateSubscriptionDTO.php

// 10. Application Service
Application/Subscription/Services/SubscriptionApplicationService.php

// Total: 10+ files just to create a subscription!
```

**Scoring:** 58/90
- DRY: 9/10 (perfect reusability)
- Reusability: 10/10 (framework-agnostic)
- Scalability: 10/10 (perfect for complex domains)
- No Over-Engineering: 2/10 (massive overkill)
- Development Speed: 3/10 (very slow)
- Team Onboarding: 2/10 (requires expert knowledge)

---

### Option 3: Service-Repository Pattern (Hybrid Layered)

A pragmatic middle ground: use Service classes for business logic, optional Repository classes for complex queries, and Action classes for single-purpose operations.

**Pros:**
- ✅ Best balance between structure and pragmatism
- ✅ Services reusable across all application layers
- ✅ Thin controllers (10-20 lines max)
- ✅ Business logic testable without HTTP layer
- ✅ Leverages Laravel's Eloquent and ecosystem
- ✅ Repository layer optional (only when needed for complex queries)
- ✅ Proven pattern (used by Spatie, Laravel News, Flarum)
- ✅ Medium learning curve (1-2 weeks)

**Cons:**
- ❌ Requires team discipline (developers can bypass and use Eloquent directly in controllers)
- ❌ More files than pure MVC (but far less than DDD)
- ❌ Team needs to learn when to use Service vs Action vs Repository

**Structure:**
```
app/
├── Http/
│   ├── Controllers/              # Thin (orchestration only)
│   ├── Requests/                 # Form validation
│   └── Resources/                # API transformers
│
├── Services/                     # Business logic
│   ├── Central/
│   │   ├── SubscriptionService.php
│   │   ├── TenantProvisioningService.php
│   │   └── PlanService.php
│   └── Tenant/
│       ├── AttendanceService.php
│       └── EmployeeService.php
│
├── Actions/                      # Single-purpose operations
│   ├── CreateSubscriptionAction.php
│   ├── SendSubscriptionEmailAction.php
│   └── GenerateInvoiceAction.php
│
├── DataTransferObjects/          # Type-safe data passing
│   └── CreateSubscriptionData.php
│
├── Repositories/                 # Complex queries (optional)
│   └── SubscriptionRepository.php
│
└── Models/                       # Eloquent (relationships only)
    ├── Central/
    └── Tenant/
```

**Example Implementation:**
```php
// 1. Thin Controller (15 lines)
class SubscriptionController extends Controller
{
    public function __construct(
        private SubscriptionService $subscriptionService
    ) {}

    public function store(CreateSubscriptionRequest $request)
    {
        $subscription = $this->subscriptionService->createSubscription(
            CreateSubscriptionData::fromRequest($request)
        );

        return redirect()
            ->route('subscriptions.show', $subscription)
            ->with('success', 'Subscription created successfully!');
    }
}

// 2. Form Request (Validation)
class CreateSubscriptionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'plan_price_id' => 'required|exists:plan_prices,id',
            'subscriber_type' => 'required|string',
            'subscriber_id' => 'required|integer',
        ];
    }
}

// 3. Data Transfer Object
class CreateSubscriptionData
{
    public function __construct(
        public string $subscriberType,
        public int $subscriberId,
        public int $planPriceId,
    ) {}

    public static function fromRequest(CreateSubscriptionRequest $request): self
    {
        return new self(
            subscriberType: $request->validated('subscriber_type'),
            subscriberId: $request->validated('subscriber_id'),
            planPriceId: $request->validated('plan_price_id'),
        );
    }
}

// 4. Service (Business Logic)
class SubscriptionService
{
    public function __construct(
        private CreateSubscriptionAction $createAction,
        private SendSubscriptionEmailAction $emailAction,
        private GenerateInvoiceAction $invoiceAction,
    ) {}

    public function createSubscription(CreateSubscriptionData $data): Subscription
    {
        return DB::transaction(function () use ($data) {
            $subscription = $this->createAction->execute($data);
            
            $this->emailAction->execute($subscription);
            $this->invoiceAction->execute($subscription);
            
            event(new SubscriptionCreated($subscription));
            
            return $subscription;
        });
    }
}

// 5. Action (Single Purpose)
class CreateSubscriptionAction
{
    public function execute(CreateSubscriptionData $data): Subscription
    {
        $planPrice = PlanPrice::findOrFail($data->planPriceId);
        
        return Subscription::create([
            'subscriber_type' => $data->subscriberType,
            'subscriber_id' => $data->subscriberId,
            'plan_price_id' => $planPrice->id,
            'cycle_count' => $planPrice->cycle_count,
            'cycle_unit' => $planPrice->cycle_unit,
            'amount' => $planPrice->price,
            'starts_at' => now(),
            'ends_at' => now()->addMonths($planPrice->cycle_count),
            'status' => SubscriptionStatus::PENDING,
        ]);
    }
}

// Now this logic is reusable everywhere:
// - Controller: $service->createSubscription($data)
// - Queue Job: $service->createSubscription($data)
// - Artisan Command: $service->createSubscription($data)
// - Test: $service->createSubscription($data)
```

**Scoring:** 74/90 ⭐
- DRY: 8/10 (services reusable everywhere)
- Reusability: 9/10 (services portable with minimal changes)
- Scalability: 9/10 (easy to add new services/actions)
- No Over-Engineering: 8/10 (pragmatic, repository optional)
- Development Speed: 7/10 (slightly slower than MVC but faster than DDD)
- Team Onboarding: 7/10 (1-2 week learning curve)

---

## Decision Outcome

**Chosen option:** "Service-Repository Pattern (Hybrid Layered Architecture)"

**Rationale:**

After evaluating all three options against our decision drivers, the Service-Repository Pattern scores highest (74/90) and provides the best balance for our needs:

1. **DRY & Reusability (40% weight combined):** Services can be called from anywhere - controllers, jobs, commands, tests. This directly addresses our primary requirement for code reusability.

2. **No Over-Engineering (15% weight):** Unlike full DDD, we only add layers when they provide value. Repository layer is optional - use it only for complex queries. Simple CRUD can stay in Services using Eloquent directly.

3. **Multi-Tenancy Fit:** Service organization naturally mirrors our multi-tenant structure:
   - `Services/Central/` for central database operations
   - `Services/Tenant/` for tenant database operations
   - Clear separation prevents accidental cross-context data access

4. **Proven Pattern:** This is not an experimental approach. It's used successfully by:
   - Spatie (laravel-permission, laravel-medialibrary)
   - Laravel News
   - Flarum
   - Numerous enterprise Laravel applications

5. **Team Scalability:** Clear layers mean team members can work in parallel:
   - Developer A: SubscriptionService
   - Developer B: AttendanceService
   - Developer C: Controllers consuming services

6. **Future-Proof:** If we ever need to:
   - Add a REST API (services already separate from HTTP)
   - Migrate to microservices (services are already bounded contexts)
   - Change frameworks (services have minimal Laravel coupling)

---

## Consequences

### Positive

- ✅ **Thin Controllers:** Controllers reduced to 10-20 lines (orchestration only)
- ✅ **Testable Business Logic:** Services can be tested without HTTP layer or database (using mocks)
- ✅ **Reusable Components:** Same service used in web, API, CLI, and queue contexts
- ✅ **Clear Separation:** HTTP concerns, business logic, and data access are clearly separated
- ✅ **Better Team Collaboration:** Multiple developers can work on different services without conflicts
- ✅ **Easier Refactoring:** Changes to business rules happen in one place (the service)
- ✅ **Multi-Tenant Safety:** Service organization enforces Central vs Tenant boundaries

### Negative

- ❌ **More Files:** A feature that would be 1 controller in MVC is now Controller + Service + Action(s) + DTO
- ❌ **Requires Discipline:** Developers can still bypass services and use Eloquent directly in controllers
- ❌ **Learning Curve:** Junior developers need 1-2 weeks to understand when to use Service vs Action vs Repository
- ❌ **Code Review Overhead:** Reviewers must enforce architectural rules

### Neutral

- ⚪ **Repository Layer Optional:** Use only for complex queries (joins, subqueries, aggregations). Simple CRUD stays in Services.
- ⚪ **Action Classes:** Optional for simple operations. Use when operation is reused or complex enough to warrant isolation.

---

## Implementation Notes

### Layer Responsibilities

#### 1. Controllers (HTTP Layer)
**Responsibility:** Orchestration only
**Max Lines:** 20 per method

```php
// ✅ Good Controller
class SubscriptionController extends Controller
{
    public function __construct(
        private SubscriptionService $service
    ) {}

    public function store(CreateSubscriptionRequest $request)
    {
        $subscription = $this->service->createSubscription(
            CreateSubscriptionData::fromRequest($request)
        );

        return redirect()
            ->route('subscriptions.show', $subscription)
            ->with('success', 'Subscription created!');
    }
}

// ❌ Bad Controller (Business Logic)
class SubscriptionController extends Controller
{
    public function store(Request $request)
    {
        // 100 lines of business logic here...
    }
}
```

#### 2. Services (Business Logic Layer)
**Responsibility:** Business rules, transactions, event dispatching
**Max Lines:** 200-300 per service (split if larger)

```php
// ✅ Good Service
class SubscriptionService
{
    public function createSubscription(CreateSubscriptionData $data): Subscription
    {
        return DB::transaction(function () use ($data) {
            $subscription = Subscription::create($data->toArray());
            event(new SubscriptionCreated($subscription));
            return $subscription;
        });
    }
    
    public function renewSubscription(Subscription $subscription): Subscription
    {
        // Business logic for renewal
    }
}

// ❌ Bad Service (HTTP Concerns)
class SubscriptionService
{
    public function createSubscription(Request $request) // NO! No Request objects
    {
        $request->validate([...]); // NO! Validation in FormRequest
        return redirect()->back(); // NO! No HTTP responses
    }
}
```

#### 3. Actions (Single-Purpose Operations)
**Responsibility:** One specific operation, reusable across services

```php
// ✅ Good Action
class SendSubscriptionEmailAction
{
    public function execute(Subscription $subscription): void
    {
        Mail::to($subscription->subscriber->email)
            ->send(new SubscriptionCreatedMail($subscription));
    }
}

// Usage in multiple services:
class SubscriptionService
{
    public function __construct(
        private SendSubscriptionEmailAction $emailAction
    ) {}
    
    public function createSubscription($data)
    {
        // ...
        $this->emailAction->execute($subscription);
    }
}

class SubscriptionRenewalService
{
    public function __construct(
        private SendSubscriptionEmailAction $emailAction
    ) {}
    
    public function renewSubscription($subscription)
    {
        // ...
        $this->emailAction->execute($subscription); // Reused!
    }
}
```

#### 4. Repositories (Data Access Layer - OPTIONAL)
**Responsibility:** Complex queries only
**When to Use:** Joins, subqueries, complex aggregations
**When NOT to Use:** Simple CRUD (use Eloquent in Service)

```php
// ✅ Good Repository Use (Complex Query)
class SubscriptionRepository
{
    public function getActiveWithExpiringSoon(int $days = 7): Collection
    {
        return Subscription::query()
            ->where('status', SubscriptionStatus::ACTIVE)
            ->whereBetween('ends_at', [now(), now()->addDays($days)])
            ->with(['planPrice.plan', 'subscriber'])
            ->orderBy('ends_at')
            ->get();
    }
}

// ❌ Bad Repository Use (Simple Query - use Eloquent in Service)
class SubscriptionRepository
{
    public function find(int $id): ?Subscription
    {
        return Subscription::find($id); // Unnecessary! Use Eloquent directly
    }
}
```

#### 5. Data Transfer Objects (Type-Safe Data)
**Responsibility:** Carry data between layers with type safety

```php
class CreateSubscriptionData
{
    public function __construct(
        public string $subscriberType,
        public int $subscriberId,
        public int $planPriceId,
        public ?Carbon $startsAt = null,
    ) {}

    public static function fromRequest(FormRequest $request): self
    {
        return new self(
            subscriberType: $request->validated('subscriber_type'),
            subscriberId: $request->validated('subscriber_id'),
            planPriceId: $request->validated('plan_price_id'),
            startsAt: $request->has('starts_at') 
                ? Carbon::parse($request->validated('starts_at'))
                : null,
        );
    }

    public function toArray(): array
    {
        return [
            'subscriber_type' => $this->subscriberType,
            'subscriber_id' => $this->subscriberId,
            'plan_price_id' => $this->planPriceId,
            'starts_at' => $this->startsAt,
        ];
    }
}
```

### Decision Tree: Which Layer?

```
Need to handle HTTP request/response?
├─ YES → Controller
└─ NO
    │
    Contains business rules or orchestrates multiple operations?
    ├─ YES → Service
    └─ NO
        │
        Single reusable operation?
        ├─ YES → Action
        └─ NO
            │
            Complex database query?
            ├─ YES → Repository
            └─ NO → Use Eloquent in Service
```

### Rules & Guidelines

1. **Controllers:**
   - ONLY inject Services (never Models directly)
   - ONLY orchestrate (call service methods and return responses)
   - NO business logic
   - NO database queries
   - Max 20 lines per method

2. **Services:**
   - Contain business logic
   - Handle DB transactions
   - Dispatch events
   - NO HTTP concerns (Request, Response, redirect, session)
   - NO validation (use FormRequests)
   - Can use Eloquent directly for simple queries

3. **Actions:**
   - Single responsibility
   - Reusable across multiple services
   - Stateless (no properties, only execute method)

4. **Repositories:**
   - OPTIONAL - only for complex queries
   - If query is simple (Model::find(), Model::where()->get()), skip repository
   - Return Collections or Models (not arrays)

5. **DTOs:**
   - Immutable (public readonly properties in PHP 8.3+)
   - Factory methods (fromRequest, fromArray)
   - Conversion methods (toArray)

### Testing Strategy

```php
// Service Test (No HTTP, No Database)
test('creates subscription with correct data', function () {
    $data = new CreateSubscriptionData(
        subscriberType: Tenant::class,
        subscriberId: 1,
        planPriceId: 1,
    );
    
    $service = new SubscriptionService(
        createAction: mock(CreateSubscriptionAction::class),
        emailAction: mock(SendSubscriptionEmailAction::class),
    );
    
    $subscription = $service->createSubscription($data);
    
    expect($subscription)->toBeInstanceOf(Subscription::class);
});

// Feature Test (Full Integration)
test('user can create subscription via HTTP', function () {
    $planPrice = PlanPrice::factory()->create();
    
    $response = actingAs($user)
        ->post('/subscriptions', [
            'plan_price_id' => $planPrice->id,
            'subscriber_type' => Tenant::class,
            'subscriber_id' => 1,
        ]);
    
    $response->assertRedirect();
    expect(Subscription::count())->toBe(1);
});
```

### Success Metrics

How to measure if this decision is working:

1. **Controller Complexity:** Average controller method < 20 lines
2. **Service Reuse:** Each service used in 2+ contexts (Controller + Job/Command)
3. **Test Coverage:** Services have 80%+ unit test coverage
4. **Developer Velocity:** Feature development time remains consistent (doesn't degrade)
5. **Code Review Time:** PRs reviewed in < 30 minutes (clear patterns make review easier)

### Migration from Existing Code

For existing MVC code, gradually refactor:

```php
// Week 1-2: Create Service structure
// Week 3-4: Move business logic from controllers to services
// Week 5-6: Refactor controllers to use services
// Week 7+: Old and new patterns coexist, gradually migrate

// Example: Gradual migration
// Step 1: Create service
class SubscriptionService
{
    public function createSubscription($data) { /* logic */ }
}

// Step 2: Controller calls service (but still has old logic)
class SubscriptionController
{
    public function store(Request $request)
    {
        // New approach
        if ($request->has('use_service')) {
            return $this->service->createSubscription($data);
        }
        
        // Old approach (keep temporarily)
        // ... old logic here
    }
}

// Step 3: Remove old logic once new approach is proven
```

---

## Validation

### Code Review Checklist

- [ ] Controllers are thin (< 20 lines per method)
- [ ] No business logic in controllers
- [ ] Services injected via constructor (not facades)
- [ ] Form validation in FormRequest classes
- [ ] Services return Models/Collections (not arrays)
- [ ] Database transactions in services (not controllers)
- [ ] Events dispatched from services
- [ ] DTOs used for data transfer

### Static Analysis

```bash
# PHPStan rules to enforce architecture
# phpstan.neon
rules:
    - No business logic in controllers
    - Services must not use HTTP classes (Request, Response)
    - Controllers must inject services (not models)
```

---

## References

- [Martin Fowler - Service Layer](https://martinfowler.com/eaaCatalog/serviceLayer.html)
- [Martin Fowler - Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Spatie Guidelines - Laravel](https://spatie.be/guidelines/laravel-php)
- [Laravel Beyond CRUD (Brent Roose)](https://laravel-beyond-crud.com/)
- [Domain-Oriented Laravel (Brent Roose)](https://stitcher.io/blog/laravel-beyond-crud-01-domain-oriented-laravel)
- [Action Pattern (Freek Van der Herten)](https://freek.dev/1371-refactoring-to-actions)

---

## Related ADRs

- [ADR-0002: Package-Based Architecture](0002-package-based-architecture.md) - Services organized into packages
- [ADR-0006: Testing Strategy](0006-testing-strategy.md) - How to test services

---

## Revision History

| Date       | Change Description      | Author        |
|------------|-------------------------|---------------|
| 2026-08-22 | Initial draft          | Technical Lead |

---

## Notes

This pattern is a pragmatic middle ground. It's intentionally not as pure as DDD, and intentionally more structured than MVC. The goal is **maximum value with minimum overhead**.

Key principle: **"Make it work, then make it right."** Don't over-optimize for patterns. If a service gets too large (>300 lines), split it. If a repository isn't needed yet, don't create it.

**Remember:** The best architecture is the one your team can maintain and evolve.
