# ADR-0005: Multi-Tenancy Database Strategy

**Status:** Accepted  
**Date:** 2026-08-22  
**Deciders:** Technical Lead, Architecture Team, DevOps Team  
**Technical Story:** Multi-tenant architecture for Absen Digital SaaS platform

---

## Context

Absen.digital is a multi-tenant SaaS platform where multiple organizations (tenants) share the same application instance but have completely isolated data. Each tenant (organization) should:

- Have complete data isolation (Tenant A cannot access Tenant B's data)
- Be able to use custom domains (e.g., `acme.absen.digital` or `attendance.acme.com`)
- Have independent database backups and restore capabilities
- Scale independently if they grow large
- Comply with data sovereignty requirements (GDPR, data residency)

We need to choose a multi-tenancy database strategy that balances:
- **Data Isolation:** Zero risk of data leakage between tenants
- **Scalability:** Support from 10 to 10,000+ tenants
- **Performance:** Fast queries without excessive filtering
- **Backup/Restore:** Easy to backup and restore individual tenants
- **Compliance:** Meet regulatory requirements for data isolation
- **Development Experience:** Simple to develop and test

---

## Decision Drivers

1. **Data Isolation** (Weight: 30%) - Absolute separation, zero risk of data leakage
2. **Scalability** (Weight: 20%) - Support thousands of tenants
3. **Performance** (Weight: 15%) - Fast queries without overhead
4. **Backup/Restore** (Weight: 15%) - Easy tenant-specific operations
5. **Development Experience** (Weight: 10%) - Simple to develop and test
6. **Compliance** (Weight: 10%) - Meet regulatory requirements

---

## Considered Options

### Option 1: Shared Database + Tenant ID Column

Single database with `tenant_id` foreign key on every table.

```sql
-- subscriptions table
CREATE TABLE subscriptions (
    id BIGINT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,  -- Every table has this
    plan_price_id BIGINT,
    status VARCHAR(50),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- attendances table
CREATE TABLE attendances (
    id BIGINT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,  -- Every table has this
    employee_id BIGINT,
    clock_in TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

**Pros:**
- ✅ Simple initial setup
- ✅ Single database to manage
- ✅ Easy to share reference data
- ✅ Cost-effective (single database)
- ✅ Cross-tenant queries possible (analytics)

**Cons:**
- ❌ **Data leakage risk:** Forget `WHERE tenant_id = ?` → data breach
- ❌ **Performance:** All queries need tenant_id filter (index overhead)
- ❌ **No per-tenant backup:** Can't restore single tenant
- ❌ **Scaling limits:** Single database bottleneck
- ❌ **Compliance issues:** Data not physically isolated
- ❌ **Query complexity:** Every query needs tenant scoping

**Example Problem:**
```php
// ❌ Dangerous: Forgot tenant_id filter
$attendances = Attendance::where('employee_id', $employeeId)->get();
// Returns ALL tenants' data!

// ✅ Must remember tenant_id everywhere
$attendances = Attendance::where('tenant_id', $currentTenantId)
    ->where('employee_id', $employeeId)
    ->get();

// Developers WILL forget this eventually → data breach
```

**Scoring:** 45/100
- Data Isolation: 3/10 (high risk of developer error)
- Scalability: 4/10 (single DB bottleneck)
- Performance: 5/10 (tenant_id filter overhead)
- Backup/Restore: 2/10 (no tenant isolation)
- Development: 6/10 (simple but error-prone)
- Compliance: 3/10 (shared database)

---

### Option 2: Shared Database + Schema per Tenant

Single database with PostgreSQL schemas (or MySQL databases) per tenant.

```sql
-- PostgreSQL schemas
CREATE SCHEMA tenant_acme;
CREATE SCHEMA tenant_techcorp;

-- Each schema has same tables
tenant_acme.attendances
tenant_acme.employees

tenant_techcorp.attendances
tenant_techcorp.employees

-- Central schema
public.tenants
public.domains
```

**Pros:**
- ✅ Better isolation than tenant_id column
- ✅ No tenant_id in queries (schema sets context)
- ✅ Cost-effective (single database)
- ✅ Per-schema backup possible

**Cons:**
- ❌ **PostgreSQL-specific** (not portable to MySQL easily)
- ❌ **Scaling limits:** Still single database
- ❌ **Schema proliferation:** 1,000 tenants = 1,000 schemas
- ❌ **Migration complexity:** Run migrations on 1,000 schemas
- ❌ **Connection overhead:** Schema switching has cost
- ❌ **Backup:** Still backing up entire database

**Example:**
```php
// Set schema for tenant
DB::statement('SET search_path TO tenant_acme');

// Query without tenant_id
$attendances = Attendance::where('employee_id', $employeeId)->get();
// Automatically scoped to tenant_acme schema
```

**Scoring:** 62/100
- Data Isolation: 7/10 (better, but same DB)
- Scalability: 5/10 (single DB limit)
- Performance: 7/10 (no tenant_id overhead)
- Backup/Restore: 6/10 (per-schema possible)
- Development: 6/10 (schema management)
- Compliance: 6/10 (logical isolation)

---

### Option 3: Database per Tenant

Separate physical database for each tenant.

```
Database: absen_digital_central
├── tenants
├── domains
├── plans
└── subscriptions

Database: absen_digital_tenant_uuid1
├── users
├── employees
├── attendances
└── shifts

Database: absen_digital_tenant_uuid2
├── users
├── employees
├── attendances
└── shifts
```

**Pros:**
- ✅ **Perfect data isolation:** Physical separation
- ✅ **No tenant_id needed:** Queries are naturally scoped
- ✅ **Per-tenant backup:** Easy backup/restore individual tenants
- ✅ **Horizontal scaling:** Distribute databases across servers
- ✅ **Performance:** No tenant_id filtering
- ✅ **Compliance-friendly:** Physical isolation meets regulations
- ✅ **Tenant-specific optimization:** Indexes per tenant needs
- ✅ **Easy tenant deletion:** Drop database

**Cons:**
- ❌ **More databases to manage:** 1,000 tenants = 1,000 databases
- ❌ **Migration management:** Run migrations on all tenant databases
- ❌ **Cross-tenant queries:** Hard to query across tenants (analytics)
- ❌ **Connection management:** More database connections
- ❌ **Resource overhead:** Each database has overhead

**Example:**
```php
// Switch to tenant database
tenancy()->initialize($tenant);

// Query without any tenant_id
$attendances = Attendance::where('employee_id', $employeeId)->get();
// Automatically queries tenant-specific database

// Impossible to accidentally access other tenant's data
// (different database!)
```

**Scoring:** 85/100
- Data Isolation: 10/10 (perfect physical separation)
- Scalability: 9/10 (horizontal scaling possible)
- Performance: 9/10 (no filtering overhead)
- Backup/Restore: 10/10 (per-tenant operations)
- Development: 7/10 (migration management)
- Compliance: 10/10 (physical isolation)

---

### Option 4: Hybrid (Central + Tenant Databases)

Central database for tenant management, separate databases for tenant data.

```
Database: absen_digital_central (shared)
├── tenants
├── domains
├── plans
├── plan_prices
└── subscriptions

Database: absen_digital_tenant_{uuid} (per tenant)
├── users
├── employees
├── attendances
├── shifts
└── leaves
```

This is essentially Option 3 with explicit central database structure.

**Scoring:** 88/100 (same as Option 3 but clearer architecture)

---

## Decision Outcome

**Chosen option:** "Hybrid: Central Database + Database per Tenant" ⭐

**Rationale:**

The hybrid database-per-tenant approach scores highest (88/100) and provides the best solution for our multi-tenant SaaS:

1. **Data Isolation (30% weight):** Perfect score (10/10)
   - Physical database separation makes data leakage architecturally impossible
   - Developers cannot accidentally query wrong tenant (different database)
   - Security audits are simpler (physical boundaries)

2. **Scalability (20% weight):** Excellent (9/10)
   - Start with single MySQL server, scale to multiple servers
   - Distribute tenant databases across database servers:
     ```
     DB Server 1: tenants 1-500
     DB Server 2: tenants 501-1000
     DB Server 3: large tenants only
     ```
   - Move large tenants to dedicated servers

3. **Performance (15% weight):** Excellent (9/10)
   - No `tenant_id` filtering needed
   - Simple queries: `SELECT * FROM attendances WHERE employee_id = ?`
   - Each tenant has own indexes (optimized for their data size)

4. **Backup/Restore (15% weight):** Perfect (10/10)
   - Individual tenant backup:
     ```bash
     mysqldump absen_digital_tenant_uuid1 > tenant_backup.sql
     ```
   - Restore single tenant without affecting others
   - Different backup frequencies per tenant tier

5. **Compliance (10% weight):** Perfect (10/10)
   - Physical isolation satisfies GDPR, HIPAA, SOC 2
   - Data residency: place tenant DB in specific region
   - Easy to provide data exports per tenant

6. **Development Experience (10% weight):** Good (7/10)
   - Migration management via `stancl/tenancy` package
   - Automatic database switching via middleware
   - Slightly more complex than single database, but worth it

**Key Advantage:** **Architectural Safety**
```php
// Impossible to access wrong tenant's data
tenancy()->initialize($tenantA);
$data = Employee::all(); // Only tenant A's employees

// Even if developer forgets to switch context,
// queries go to current tenant database
// No way to leak tenant B's data to tenant A
```

---

## Consequences

### Positive

- ✅ **Zero Data Leakage Risk:** Physical separation prevents architectural mistakes
- ✅ **Simple Queries:** No `tenant_id` filtering needed
- ✅ **Easy Backups:** Per-tenant backup and restore
- ✅ **Horizontal Scaling:** Distribute databases across servers
- ✅ **Performance:** Each tenant has optimized indexes for their data size
- ✅ **Compliance:** Physical isolation meets regulatory requirements
- ✅ **Tenant Deletion:** Drop database to completely remove tenant
- ✅ **Custom Optimization:** Large tenants can get dedicated resources
- ✅ **Data Residency:** Place tenant database in specific geographic region

### Negative

- ❌ **More Databases:** 1,000 tenants = 1,000 databases to manage
- ❌ **Migration Overhead:** Must run migrations on all tenant databases
- ❌ **Cross-Tenant Queries:** Can't easily query across all tenants (analytics)
- ❌ **Connection Pool:** More databases = more connection management
- ❌ **Monitoring:** Need to monitor many databases

### Neutral

- ⚪ **Initial Setup:** More complex than single database, but `stancl/tenancy` handles it
- ⚪ **Resource Overhead:** Each database has small overhead, but negligible at scale

---

## Implementation Notes

### Database Naming Convention

```
Central Database:
absen_digital_central

Tenant Databases:
absen_digital_tenant_{uuid}

Examples:
absen_digital_tenant_01h2xcejqtf2nxs9jp6rbpk8h3
absen_digital_tenant_01h2xcejtqf2nxs9jp6rbpk8h4
```

### Central Database Schema

**Tables in `absen_digital_central`:**
```sql
-- Tenant management
tenants (id, uuid, data, created_at, updated_at)
domains (id, domain, tenant_id, created_at, updated_at)

-- Subscription management
plans (id, name, description, attributes, is_active)
plan_prices (id, plan_id, name, price, cycle_count, cycle_unit)
subscriptions (id, subscriber_type, subscriber_id, plan_price_id, status)

-- User management (central users who can access multiple tenants)
users (id, name, email, password)
tenant_users (id, tenant_id, user_id, role)
```

**Purpose:** Manage tenants, billing, access control

### Tenant Database Schema

**Tables in each `absen_digital_tenant_{uuid}`:**
```sql
-- Application data (tenant-specific)
users (id, name, email, employee_id)
employees (id, name, department_id, position_id)
departments (id, name)
positions (id, title)
attendances (id, employee_id, clock_in, clock_out)
shifts (id, name, start_time, end_time)
leaves (id, employee_id, start_date, end_date, status)
```

**Purpose:** Tenant's operational data

### Migration Strategy

**Central Migrations:**
```
database/migrations/
├── 2026_08_22_000001_create_tenants_table.php
├── 2026_08_22_000002_create_plans_table.php
└── 2026_08_22_000003_create_subscriptions_table.php
```

Run with: `php artisan migrate`

**Tenant Migrations:**
```
database/migrations/tenant/
├── 2026_08_22_000001_create_employees_table.php
├── 2026_08_22_000002_create_attendances_table.php
└── 2026_08_22_000003_create_shifts_table.php
```

Run with: `php artisan tenants:migrate`

### Tenant Identification

**By Domain/Subdomain:**
```
Central Domain:
- absen.digital
- localhost
- 127.0.0.1

Tenant Domains:
- acme.absen.digital (subdomain)
- attendance.acme.com (custom domain)
```

**Configuration:**
```php
// config/tenancy.php
return [
    'central_domains' => [
        '127.0.0.1',
        'localhost',
        env('APP_CENTRAL_DOMAIN', 'absen.digital'),
    ],
    
    'database' => [
        'prefix' => 'absen_digital_tenant_',
        'suffix' => '',
    ],
];
```

### Middleware Setup

**Routes:**
```php
// routes/web.php (Central)
Route::domain(config('app.url'))->group(function () {
    Route::get('/', [LandingController::class, 'index']);
    Route::get('/pricing', [PricingController::class, 'index']);
});

// routes/tenant.php (Tenant)
Route::middleware([
    'web',
    InitializeTenancyByDomainOrSubdomain::class,
    PreventAccessFromCentralDomains::class,
])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::resource('attendances', AttendanceController::class);
});
```

**Automatic Database Switching:**
```php
// When request hits acme.absen.digital:
// 1. Middleware identifies tenant by domain
// 2. Switches to absen_digital_tenant_{uuid}
// 3. All queries go to tenant database automatically
```

### Tenant Provisioning

**Create New Tenant:**
```php
use App\Models\Central\Tenant;

$tenant = Tenant::create([
    'id' => 'acme',
]);

$tenant->domains()->create([
    'domain' => 'acme.absen.digital',
]);

// Automatically creates database: absen_digital_tenant_{uuid}
// Runs tenant migrations
// Ready to use!
```

**Under the Hood (stancl/tenancy):**
```bash
1. Create database: absen_digital_tenant_01h2xcejqtf2nxs9jp6rbpk8h3
2. Run migrations from database/migrations/tenant/
3. Seed initial data (if configured)
```

### Tenant Deletion

**Delete Tenant:**
```php
$tenant = Tenant::find('acme');
$tenant->delete();

// Automatically:
// 1. Drops database: absen_digital_tenant_{uuid}
// 2. Deletes domains
// 3. Deletes tenant record
```

### Querying from Models

**Automatic Scoping:**
```php
// In tenant context (e.g., acme.absen.digital)
namespace App\Models\Tenant;

class Employee extends Model
{
    // No tenant_id needed!
}

// Controller
class EmployeeController extends Controller
{
    public function index()
    {
        // Automatically queries acme's database
        $employees = Employee::all();
        
        return Inertia::render('employees/index', [
            'employees' => $employees,
        ]);
    }
}

// Impossible to access other tenant's data
// (different database!)
```

**Accessing Central Data from Tenant:**
```php
// In tenant context, access central data
use App\Models\Central\Plan;

$plans = Plan::on('central')->where('is_active', true)->get();
```

### Database Server Distribution

**Single Server (Start):**
```
MySQL Server: localhost
├── absen_digital_central
├── absen_digital_tenant_uuid1
├── absen_digital_tenant_uuid2
└── ... (up to ~500 tenants)
```

**Multiple Servers (Scale):**
```
MySQL Server 1 (central):
└── absen_digital_central

MySQL Server 2 (tenants A-M):
├── absen_digital_tenant_acme_uuid
├── absen_digital_tenant_beta_uuid
└── ...

MySQL Server 3 (tenants N-Z):
├── absen_digital_tenant_nova_uuid
├── absen_digital_tenant_zenith_uuid
└── ...

MySQL Server 4 (large tenants):
├── absen_digital_tenant_enterprise1_uuid
└── absen_digital_tenant_enterprise2_uuid
```

**Configuration:**
```php
// config/database.php
'connections' => [
    'central' => [
        'host' => env('DB_CENTRAL_HOST', '127.0.0.1'),
        'database' => env('DB_CENTRAL_DATABASE', 'absen_digital_central'),
    ],
    
    'tenant' => [
        'host' => env('DB_TENANT_HOST', '127.0.0.1'),
        // Database name set dynamically by tenancy package
    ],
],
```

### Backup Strategy

**Per-Tenant Backups:**
```bash
#!/bin/bash
# Daily backup of all tenant databases

for db in $(mysql -e "SHOW DATABASES LIKE 'absen_digital_tenant_%';" -sN); do
    mysqldump $db | gzip > /backups/daily/$db-$(date +%Y%m%d).sql.gz
done
```

**Restore Single Tenant:**
```bash
# Restore tenant from backup
gunzip < /backups/daily/absen_digital_tenant_uuid1-20260822.sql.gz | \
    mysql absen_digital_tenant_uuid1
```

**Tiered Backup:**
```php
// Premium tenants: hourly backup
// Standard tenants: daily backup
// Free tenants: weekly backup

if ($tenant->subscription->plan->name === 'Premium') {
    // Schedule hourly backup
}
```

### Testing Strategy

**Test Database:**
```
.env.testing:
DB_CONNECTION=sqlite
DB_DATABASE=:memory:

# Each test creates in-memory tenant database
# Fast, isolated tests
```

**Feature Test:**
```php
use Illuminate\Foundation\Testing\RefreshDatabase;

test('employee can clock in', function () {
    $tenant = Tenant::factory()->create();
    
    tenancy()->initialize($tenant);
    
    $employee = Employee::factory()->create();
    
    $response = actingAs($employee->user)
        ->post('/attendances/clock-in');
    
    $response->assertRedirect();
    expect(Attendance::count())->toBe(1);
});
```

### Monitoring

**Database Metrics to Monitor:**
```
Per tenant database:
- Size (disk usage)
- Connection count
- Query performance
- Backup status

Central database:
- Tenant count
- Subscription status
- Domain count
```

**Alerts:**
```
- Tenant database > 10GB (consider dedicated server)
- Tenant database connections > 50 (investigate)
- Backup failed (alert immediately)
```

---

## Validation

### Security Checklist

- [ ] Tenant A cannot query tenant B's data (test with different domains)
- [ ] Central database queries don't leak into tenant context
- [ ] Tenant context resets between requests
- [ ] Middleware prevents access to central domains from tenant routes
- [ ] Database user permissions limit cross-database access

### Performance Benchmarks

- [ ] Tenant database creation < 2 seconds
- [ ] Database switching overhead < 10ms
- [ ] Query performance same as single-tenant app
- [ ] 1,000 tenants on single server (acceptable performance)

---

## References

- [stancl/tenancy Documentation](https://tenancyforlaravel.com/)
- [Multi-Tenancy Best Practices](https://aws.amazon.com/blogs/apn/multi-tenant-saas-database-tenancy-patterns/)
- [SaaS Tenant Isolation Strategies](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/tenant-isolation.html)

---

## Related ADRs

- [ADR-0002: Package-Based Architecture](0002-package-based-architecture.md) - Central vs Tenant packages
- [ADR-0006: Testing Strategy](0006-testing-strategy.md) - Testing multi-tenant code

---

## Revision History

| Date       | Change Description      | Author        |
|------------|-------------------------|---------------|
| 2026-08-22 | Initial draft          | Technical Lead |

---

## Notes

**Start Simple:** Begin with single MySQL server. Scale to multiple servers when needed (500+ tenants or when performance degrades).

**Database Naming:** Use UUID in database name (not tenant slug) to avoid collisions and special characters.

**Cross-Tenant Analytics:** For analytics across all tenants, replicate data to data warehouse (separate from production databases).

**Remember:** Physical database isolation is the gold standard for multi-tenant SaaS. The operational complexity is worth the security and compliance benefits.
