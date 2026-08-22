# ADR-0006: Testing Strategy (Marathon Mode)

**Status:** Accepted  
**Date:** 2026-08-22  
**Deciders:** Technical Lead, Engineering Team  
**Technical Story:** Testing approach for rapid SaaS development

---

## Context

Absen.digital is being built as a multi-tenant SaaS platform with aggressive development timelines (marathon mode). We need a testing strategy that:

- **Supports Rapid Development:** Doesn't slow down feature delivery
- **Provides Confidence:** Catches critical bugs before production
- **Focuses on Value:** Tests high-risk areas, not everything
- **Sustainable Long-Term:** Can evolve as the application matures
- **Practical for Team:** Realistic for team size and experience

**Current Situation:**

- Fresh Laravel 13 project with Pest installed
- Small team (2-4 developers)
- MVP timeline: 3-4 months
- Requirements changing based on customer feedback
- Need to ship features quickly to validate product-market fit

**Testing Philosophy Considerations:**

1. **Test-Driven Development (TDD):** Write tests before code
   - Best for stable requirements
   - Slows initial development
   - Requirements changing frequently (SaaS MVP)

2. **Test-After Development (TAD):** Write tests after feature works
   - Faster initial development
   - Risk: tests never get written
   - Better for exploratory phase

3. **No Testing:** Ship and fix bugs as reported
   - Fastest development
   - High bug rate in production
   - Customer trust damage

---

## Decision Drivers

1. **Development Speed** (Weight: 30%) - Ship features fast for MVP validation
2. **Bug Prevention** (Weight: 25%) - Catch critical issues before production
3. **Confidence to Refactor** (Weight: 20%) - Safe to improve code later
4. **Long-Term Sustainability** (Weight: 15%) - Strategy scales with team growth
5. **Team Productivity** (Weight: 10%) - Not demotivating or frustrating

---

## Considered Options

### Option 1: Full Test-Driven Development (TDD)

Write tests before every feature, aim for 90%+ coverage.

```php
// 1. Write test first (Red)
test('creates subscription for tenant', function () {
    $data = new SubscriptionData(...);
    $subscription = $this->service->createSubscription($data);
    expect($subscription)->toBeInstanceOf(Subscription::class);
});

// 2. Implement feature (Green)
class SubscriptionService {
    public function createSubscription($data) {
        return Subscription::create($data->toArray());
    }
}

// 3. Refactor (Refactor)
```

**Pros:**

- ✅ High test coverage (90%+)
- ✅ Tests document intended behavior
- ✅ Catches regressions immediately
- ✅ Forces good design (testable code)
- ✅ Confidence to refactor

**Cons:**

- ❌ **Slow initial development:** 30-50% slower than no tests
- ❌ **High friction:** Constant red-green-refactor cycle
- ❌ **Doesn't fit changing requirements:** Rewrite tests often
- ❌ **Team frustration:** Feels like busy work during MVP
- ❌ **False confidence:** Tests might test wrong behavior

**Real-World Impact:**

```
Feature without TDD: 2 days
Feature with TDD: 3-4 days

10 features without TDD: 20 days
10 features with TDD: 30-40 days

Loss: 10-20 days = 2-4 weeks delay on MVP
```

**Scoring:** 58/100

- Development Speed: 4/10 (significantly slower)
- Bug Prevention: 10/10 (excellent)
- Confidence: 10/10 (highest)
- Sustainability: 8/10 (requires discipline)
- Productivity: 5/10 (frustrating during MVP)

---

### Option 2: No Testing (Cowboy Coding)

Write no tests, ship fast, fix bugs as reported.

**Pros:**

- ✅ Fastest development (no test overhead)
- ✅ Maximum flexibility (no test maintenance)
- ✅ Easy to pivot (no tests to rewrite)

**Cons:**

- ❌ **High bug rate:** Production is testing environment
- ❌ **Customer trust damage:** Bugs in critical flows (billing)
- ❌ **No refactoring confidence:** Break things unknowingly
- ❌ **Technical debt:** Hard to add tests later
- ❌ **Scaling issues:** Bugs multiply as codebase grows

**Real Consequences:**

```
Week 1: Ship subscription feature
Week 2: Customer reports: "Charged twice"
Week 3: Fix bug, but breaks existing subscriptions
Week 4: Another customer: "Can't cancel subscription"
Week 5: Developers afraid to touch subscription code
Week 6: Hire QA person to manually test everything
```

**Scoring:** 35/100

- Development Speed: 10/10 (fastest)
- Bug Prevention: 2/10 (terrible)
- Confidence: 2/10 (none)
- Sustainability: 3/10 (tech debt accumulates)
- Productivity: 5/10 (debugging is draining)

---

### Option 3: Phase-Based Testing (Test After, Prioritized)

Write tests AFTER features work, prioritize critical flows.

**Phase 1: Rapid Prototyping (Week 1-4)**

- No tests initially
- Focus: Establish architecture, validate patterns
- Goal: Prove technical approach works

**Phase 2: Critical Path Testing (Week 5-8)**

- Add feature tests for critical flows
- Focus: Auth, billing, tenant isolation
- Goal: Protect revenue and security

**Phase 3: Stabilization (Week 9-12)**

- Add unit tests for complex business logic
- Increase coverage gradually
- Goal: 60-70% coverage (not 100%)

**Phase 4: Maintenance (Week 13+)**

- New features include tests from day 1
- Refactor legacy code with tests
- Goal: Sustain 70% coverage

**Pros:**

- ✅ Fast initial development (no test overhead)
- ✅ Tests added when patterns stabilize
- ✅ Focused testing (high-value scenarios)
- ✅ Team learns patterns before testing them
- ✅ Realistic for small teams
- ✅ Balances speed and quality

**Cons:**

- ❌ Some bugs in early weeks (acceptable risk)
- ❌ Requires discipline (easy to never write tests)
- ❌ Lower initial coverage (catch up later)

**Priority Matrix:**

```
High Priority (MUST test):
├─ Authentication (login, logout, password reset)
├─ Authorization (roles, permissions)
├─ Tenant isolation (Tenant A ≠ Tenant B data)
├─ Subscription flows (create, renew, cancel)
├─ Payment processing (billing)
└─ Data integrity (critical business rules)

Medium Priority (SHOULD test):
├─ CRUD operations (employees, attendance)
├─ Form validations
├─ API endpoints
└─ Email notifications

Low Priority (SKIP initially):
├─ Getters/setters
├─ Simple transformers
├─ Static helpers
└─ Presentation logic
```

**Example Timeline:**

```
Week 1-4: Build features, no tests (MVP validation)
Week 5: Add auth tests (security critical)
Week 6: Add tenant isolation tests (data leakage risk)
Week 7: Add subscription tests (revenue protection)
Week 8: Add critical business logic tests
Week 9+: New features include tests
```

**Scoring:** 82/100

- Development Speed: 9/10 (fast initially, slightly slower later)
- Bug Prevention: 8/10 (covers critical paths)
- Confidence: 8/10 (high for tested areas)
- Sustainability: 9/10 (scales with team)
- Productivity: 9/10 (pragmatic balance)

---

### Option 4: Hybrid (TDD for Critical, TAD for Features)

Use TDD for critical code, test-after for features.

**TDD for:**

- Security (auth, permissions)
- Money (billing, subscriptions)
- Data integrity (tenant isolation)

**TAD for:**

- CRUD features
- UI components
- Reports

**Pros:**

- ✅ Critical paths well-tested
- ✅ Flexibility for features
- ✅ Good balance

**Cons:**

- ❌ Cognitive overhead (which strategy when?)
- ❌ Team confusion
- ❌ Similar to Option 3 but more complex

**Scoring:** 75/100 (similar to Option 3 but more decision overhead)

---

## Decision Outcome

**Chosen option:** "Phase-Based Testing (Test After, Prioritized)" ⭐

**Rationale:**

Phase-based testing scores highest (82/100) and provides the best balance for our marathon development context:

1. **Development Speed (30% weight):** Excellent in early phases
   - Week 1-4: No test overhead, establish patterns quickly
   - Week 5+: Tests added when code stabilizes
   - Net result: 10-15% slower than no tests, 40% faster than TDD

2. **Bug Prevention (25% weight):** Focused on critical areas
   - Tests protect revenue (subscriptions, billing)
   - Tests protect security (auth, tenant isolation)
   - Tests protect data integrity (business rules)
   - Lower priority bugs acceptable in MVP phase

3. **Confidence to Refactor (20% weight):** Builds over time
   - Week 1-4: Low confidence (no tests) but code is fresh
   - Week 5+: Increasing confidence as tests added
   - Week 12+: High confidence with 70% coverage

4. **Long-Term Sustainability (15% weight):** Scales with team
   - Initially: 2-3 developers, can move fast
   - Later: 5+ developers, tests prevent regressions
   - Pattern: New features always include tests (habit forms)

5. **Team Productivity (10% weight):** Pragmatic and motivating
   - No initial frustration (see features ship fast)
   - Team learns what to test (experience with bugs)
   - Gradual skill building (testing becomes natural)

**Key Principle:** **"Make it work, then make it right, then make it fast."**

In MVP phase:

1. Make it work (no tests, rapid development)
2. Make it right (add tests for critical paths)
3. Make it fast (optimize with confidence from tests)

---

## Consequences

### Positive

- ✅ **Fast MVP Delivery:** No test overhead in critical early weeks
- ✅ **Focused Testing:** Resources spent on high-value tests
- ✅ **Team Morale:** See features ship quickly, build momentum
- ✅ **Realistic Coverage:** 60-70% is achievable and maintains
- ✅ **Learning Opportunity:** Team learns what needs testing through experience
- ✅ **Gradual Adoption:** Testing habit builds naturally

### Negative

- ❌ **Early Bugs:** Some bugs in Week 1-8 (non-critical areas)
- ❌ **Discipline Required:** Easy to skip tests if not enforced
- ❌ **Catching Up:** Week 5+ spent adding tests for existing code
- ❌ **Lower Initial Coverage:** 20-30% in early weeks

### Neutral

- ⚪ **Coverage Goal:** 60-70% is acceptable (not 90%+)
- ⚪ **Test Types:** Feature tests prioritized over unit tests

---

## Implementation Notes

### Phase 1: Rapid Prototyping (Week 1-4)

**Goal:** Establish architecture, validate patterns

**Activities:**

```bash
# Create services, actions, models
# NO tests written yet
# Focus: Make it work

packages/subscription/src/Services/SubscriptionService.php
packages/subscription/src/Actions/CreateSubscriptionAction.php
packages/subscription/src/Models/Subscription.php

# Tests: 0
# Coverage: 0%
```

**Validation:**

- Manual testing in browser
- Test critical flows manually (subscription creation)
- Document bugs found (inform what to test later)

**Acceptable Risks:**

- UI bugs (button placement, styling)
- Edge cases not handled (empty states)
- Non-critical validation missing

**Unacceptable Risks:**

- Data leakage between tenants (must be architectural)
- Money-related bugs (double charging)
- Auth bypass (must be secure by design)

---

### Phase 2: Critical Path Testing (Week 5-8)

**Goal:** Protect revenue, security, and data integrity

**Priority 1: Authentication (Week 5)**

```php
// tests/Feature/Auth/LoginTest.php
test('user can login with valid credentials', function () {
    $user = User::factory()->create([
        'email' => 'john@example.com',
        'password' => bcrypt('password'),
    ]);
    
    $response = post('/login', [
        'email' => 'john@example.com',
        'password' => 'password',
    ]);
    
    $response->assertRedirect('/dashboard');
    expect(auth()->check())->toBeTrue();
});

test('user cannot login with invalid credentials', function () {
    $response = post('/login', [
        'email' => 'john@example.com',
        'password' => 'wrong',
    ]);
    
    $response->assertSessionHasErrors('email');
    expect(auth()->check())->toBeFalse();
});
```

**Priority 2: Tenant Isolation (Week 6)**

```php
// tests/Feature/Tenancy/TenantIsolationTest.php
test('tenant cannot access another tenant data', function () {
    $tenantA = Tenant::factory()->create(['id' => 'tenant-a']);
    $tenantB = Tenant::factory()->create(['id' => 'tenant-b']);
    
    // Create employee in tenant A
    tenancy()->initialize($tenantA);
    $employeeA = Employee::factory()->create(['name' => 'Alice']);
    
    // Switch to tenant B
    tenancy()->initialize($tenantB);
    $employeeB = Employee::factory()->create(['name' => 'Bob']);
    
    // Verify isolation
    expect(Employee::count())->toBe(1); // Only Bob
    expect(Employee::where('name', 'Alice')->exists())->toBeFalse();
});
```

**Priority 3: Subscription Flows (Week 7)**

```php
// tests/Feature/Subscription/CreateSubscriptionTest.php
test('tenant can create subscription', function () {
    $tenant = Tenant::factory()->create();
    $planPrice = PlanPrice::factory()->create(['price' => 100]);
    
    $response = actingAs($tenant->owner)
        ->post('/subscriptions', [
            'plan_price_id' => $planPrice->id,
        ]);
    
    $response->assertRedirect();
    
    expect(Subscription::count())->toBe(1);
    $subscription = Subscription::first();
    expect($subscription->amount)->toBe(100);
    expect($subscription->status)->toBe(SubscriptionStatus::PENDING);
});

test('subscription calculates end date correctly', function () {
    $planPrice = PlanPrice::factory()->create([
        'cycle_count' => 1,
        'cycle_unit' => CycleUnit::MONTH,
    ]);
    
    $subscription = Subscription::factory()->create([
        'plan_price_id' => $planPrice->id,
        'starts_at' => now(),
    ]);
    
    expect($subscription->ends_at->diffInDays($subscription->starts_at))
        ->toBe(30);
});
```

**Coverage Target:** 40-50%

---

### Phase 3: Business Logic Testing (Week 9-12)

**Goal:** Test complex business rules

**Unit Tests for Services:**

```php
// packages/subscription/tests/Unit/Services/SubscriptionServiceTest.php
test('subscription service creates subscription with correct data', function () {
    $service = app(SubscriptionService::class);
    
    $data = new SubscriptionData(
        subscriberType: Tenant::class,
        subscriberId: 1,
        planPriceId: 1,
    );
    
    $subscription = $service->createSubscription($data);
    
    expect($subscription)->toBeInstanceOf(Subscription::class);
    expect($subscription->subscriber_type)->toBe(Tenant::class);
});

test('subscription service dispatches event', function () {
    Event::fake();
    
    $service = app(SubscriptionService::class);
    $subscription = $service->createSubscription($data);
    
    Event::assertDispatched(SubscriptionCreated::class);
});
```

**Coverage Target:** 60-70%

---

### Phase 4: Maintenance Mode (Week 13+)

**Goal:** Sustain coverage, test new features from day 1

**New Feature Workflow:**

```
1. Build feature (no test yet)
2. Manual test in browser
3. Write feature test (before PR)
4. Write unit tests for complex logic (before PR)
5. PR requires tests (enforced)
```

**Refactoring Workflow:**

```
1. Before refactoring, add tests for current behavior
2. Refactor with confidence (tests catch regressions)
3. Update tests if behavior intentionally changes
```

**Coverage Target:** Maintain 70%

---

### Testing Tools

**Backend (PHP):**

```bash
# Install Pest
composer require pestphp/pest --dev
composer require pestphp/pest-plugin-laravel --dev

# Run tests
./vendor/bin/pest

# Run with coverage
./vendor/bin/pest --coverage --min=70

# Run specific suite
./vendor/bin/pest tests/Feature/Auth
```

**Frontend (TypeScript):**

```bash
# Install Vitest
pnpm add -D vitest @testing-library/react @testing-library/user-event

# Run tests
pnpm test

# Run with coverage
pnpm test --coverage

# Run specific feature
pnpm test features/subscription
```

**E2E (Critical Flows Only):**

```bash
# Install Dusk (optional, for critical flows)
composer require laravel/dusk --dev

# Test full user journey
php artisan dusk tests/Browser/SubscriptionFlowTest.php
```

---

### Test Categories

**Feature Tests (70% of tests):**

- Test from HTTP layer
- Test user flows
- Test database state
- Fast (use SQLite in-memory)

```php
test('user can create employee', function () {
    $tenant = Tenant::factory()->create();
    tenancy()->initialize($tenant);
    
    $response = actingAs($tenant->owner)
        ->post('/employees', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);
    
    $response->assertRedirect();
    expect(Employee::count())->toBe(1);
});
```

**Unit Tests (20% of tests):**

- Test services, actions in isolation
- Use mocks for dependencies
- Focus on complex business logic

```php
test('pricing calculator applies discount correctly', function () {
    $calculator = new PricingCalculator();
    
    $price = $calculator->calculate(
        basePrice: 100,
        discount: 10,
    );
    
    expect($price)->toBe(90);
});
```

**E2E Tests (10% of tests):**

- Test critical user journeys
- Use real browser (Laravel Dusk)
- Slow, run before deployment only

```php
test('user can complete subscription flow', function () {
    $this->browse(function (Browser $browser) {
        $browser->visit('/register')
            ->type('email', 'test@example.com')
            ->type('password', 'password')
            ->press('Register')
            ->assertPathIs('/subscription/create')
            ->select('plan', 'premium')
            ->press('Subscribe')
            ->assertSee('Subscription created successfully');
    });
});
```

---

### Coverage Targets

**Phase-Based Goals:**

```
Week 1-4:   0-20% coverage (acceptable)
Week 5-8:   40-50% coverage (critical paths)
Week 9-12:  60-70% coverage (business logic)
Week 13+:   70% coverage (maintain)
```

**By Test Type:**

```
Feature Tests:  70% of all tests
Unit Tests:     20% of all tests
E2E Tests:      10% of all tests
```

**By Code Layer:**

```
Controllers:    40% coverage (thin, less critical)
Services:       90% coverage (business logic, critical)
Actions:        80% coverage (reusable operations)
Models:         50% coverage (mostly Eloquent, less critical)
```

---

### CI/CD Integration

**GitHub Actions (Simple):**

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: 8.3
      
      - name: Install dependencies
        run: composer install
      
      - name: Run tests
        run: ./vendor/bin/pest --coverage --min=60
      
      - name: Frontend tests
        run: |
          pnpm install
          pnpm test
```

**Enforce in PR:**

```
PR Checklist:
- [ ] Feature tests for new features
- [ ] Unit tests for complex logic
- [ ] Coverage remains above 60%
- [ ] All tests pass
```

---

### What NOT to Test

**Skip These (Low ROI):**

```php
// ❌ Don't test framework features
test('Eloquent can save model', function () {
    $model = new User();
    $model->name = 'John';
    $model->save();
    expect($model->exists)->toBeTrue(); // Trust Laravel
});

// ❌ Don't test getters/setters
test('can set and get name', function () {
    $user = new User();
    $user->setName('John');
    expect($user->getName())->toBe('John'); // No value
});

// ❌ Don't test private methods directly
test('private method calculates correctly', function () {
    $service = new SubscriptionService();
    $result = $service->privateMethod(); // Test via public API
});

// ❌ Don't test UI implementation details
test('button has correct class', function () {
    $html = view('button')->render();
    expect($html)->toContain('bg-blue-500'); // Fragile, breaks with CSS changes
});
```

---

### Testing Multi-Tenancy

**Tenant Context Helpers:**

```php
// tests/Pest.php
function actingAsTenant(Tenant $tenant, ?User $user = null)
{
    tenancy()->initialize($tenant);
    
    if ($user) {
        return test()->actingAs($user);
    }
    
    return test();
}

// Usage
test('tenant can access own data', function () {
    $tenant = Tenant::factory()->create();
    $employee = Employee::factory()->for($tenant)->create();
    
    actingAsTenant($tenant)
        ->get("/employees/{$employee->id}")
        ->assertOk();
});
```

---

## Validation

### Success Metrics

**Week 5:**

- [ ] Auth tests cover login, logout, password reset
- [ ] Coverage: 30%+

**Week 8:**

- [ ] Tenant isolation tests prevent data leakage
- [ ] Subscription tests cover create, renew, cancel
- [ ] Coverage: 50%+

**Week 12:**

- [ ] Service layer has 80%+ coverage
- [ ] All critical paths tested
- [ ] Coverage: 70%+

**Ongoing:**

- [ ] New PRs include tests
- [ ] Coverage maintained at 70%
- [ ] CI/CD enforces test passing

---

## References

- [Pest PHP Documentation](https://pestphp.com/)
- [Laravel Testing](https://laravel.com/docs/13.x/testing)
- [Testing Pyramid (Martin Fowler)](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Kent Beck - TDD by Example](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)

---

## Related ADRs

- [ADR-0001: Service-Repository Pattern](0001-service-repository-pattern.md) - Services are highly testable
- [ADR-0005: Multi-Tenancy Approach](0005-multi-tenancy-approach.md) - Testing tenant isolation

---

## Revision History

| Date       | Change Description      | Author        |
|------------|-------------------------|---------------|
| 2026-08-22 | Initial draft          | Technical Lead |

---

## Notes

**Key Principle:** **Test high-value scenarios, not everything.**

70% coverage with 100% critical path coverage is better than 90% coverage with poor critical path coverage.

**Adjust as Needed:** This is Week 1 strategy. Re-evaluate at Week 8 and Week 16. If bugs are frequent, increase coverage target. If development is too slow, reduce scope.

**Team Growth:** When team grows to 5+ developers, consider shifting toward more TDD for new features (established patterns make TDD faster).

**Remember:** The goal is shipping a quality product, not achieving 100% coverage. Tests are a means to that end, not the end itself.
