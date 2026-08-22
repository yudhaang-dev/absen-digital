# Absen Digital

Multi-tenant SaaS attendance management system built with Laravel 13 and React 19.

---

## 📐 Architecture Documentation

- **[Architecture Decisions Summary](docs/architecture/summaries/decisions-summary.md)** - Quick overview (~5 min read)
- **[Full ADR Documentation](docs/architecture/decisions/)** - Detailed architecture decisions
- **[ADR Template](docs/architecture/template.md)** - Template for new architecture decisions

### Key Architectural Decisions

| Decision | Summary | ADR |
|----------|---------|-----|
| **Service-Repository Pattern** | Hybrid layered architecture for business logic | [ADR-0001](docs/architecture/decisions/0001-service-repository-pattern.md) |
| **Package-Based Architecture** | Internal packages for domain modules | [ADR-0002](docs/architecture/decisions/0002-package-based-architecture.md) |
| **Frontend Feature Modules** | Domain-driven React organization | [ADR-0003](docs/architecture/decisions/0003-frontend-feature-modules.md) |
| **Inertia + React Stack** | Hybrid SPA without API layer | [ADR-0004](docs/architecture/decisions/0004-inertia-react-stack.md) |
| **Database per Tenant** | Multi-tenancy isolation strategy | [ADR-0005](docs/architecture/decisions/0005-multi-tenancy-approach.md) |
| **Phase-Based Testing** | Pragmatic testing for marathon mode | [ADR-0006](docs/architecture/decisions/0006-testing-strategy.md) |
| **Type Safety** | Auto-generate TypeScript from PHP | [ADR-0007](docs/architecture/decisions/0007-type-safety-backend-frontend.md) |
| **Naming Conventions** | Code standards and patterns | [ADR-0008](docs/architecture/decisions/0008-naming-conventions.md) |

---

## 🚀 Quick Start

### Prerequisites

- PHP 8.3+
- Composer 2.x
- Node.js 20+
- pnpm 9+
- MySQL 8.0+

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/absen.digital.git
cd absen.digital

# Install dependencies
composer install
pnpm install

# Setup environment
cp .env.example .env
php artisan key:generate

# Setup database
php artisan migrate

# Generate TypeScript types
php artisan typescript:generate

# Start development server
composer run dev
```

The application will be available at:
- Central: http://localhost:8000
- Tenant: http://{tenant-slug}.localhost:8000

---

## 📦 Project Structure

```
absen.digital/
├── app/                      # Application layer (thin)
│   └── Http/Controllers/    # Orchestration only
│
├── packages/                 # Domain modules (reusable)
│   ├── auth/                # Authentication & authorization
│   ├── subscription/        # Billing & subscriptions
│   └── shared/              # Base classes & utilities
│
├── resources/react/          # Frontend
│   ├── features/            # Domain modules (mirror backend)
│   ├── pages/               # Inertia pages (thin)
│   ├── components/          # Shared UI components
│   └── layouts/             # Layout wrappers
│
├── docs/                     # Documentation
│   └── architecture/        # Architecture Decision Records
│
├── database/
│   ├── migrations/          # Central DB migrations
│   └── migrations/tenant/   # Tenant DB migrations
│
└── tests/                    # Tests
    ├── Feature/             # Feature tests (primary)
    └── Unit/                # Unit tests (complex logic)
```

---

## 🛠️ Development

### Backend

```bash
# Run linter
./vendor/bin/pint

# Run static analysis
./vendor/bin/phpstan analyse

# Run tests
./vendor/bin/pest

# Run tests with coverage
./vendor/bin/pest --coverage --min=70
```

### Frontend

```bash
# Run linter
pnpm lint

# Format code
pnpm format

# Type check
pnpm types:check

# Run tests
pnpm test

# Build for production
pnpm build
```

### Generate Types

```bash
# Generate TypeScript types from PHP
php artisan typescript:generate
```

---

## 🏗️ Architecture Principles

1. **DRY & Reusable:** Services/Actions reusable across layers
2. **Separation of Concerns:** Thin controllers/pages, fat services/features
3. **Type Safety:** Backend types → Frontend types (auto-generated)
4. **Clear Boundaries:** Packages enforce domain separation
5. **Pragmatic:** Repository optional, test after implementation
6. **Scalable:** Package-based allows team parallelization
7. **Multi-tenant First:** Central vs Tenant context in code structure

---

## 🧪 Testing Strategy

**Phase-Based Approach:**
- **Week 1-4:** Rapid prototyping (no tests)
- **Week 5-8:** Feature tests for critical flows (auth, billing, tenant isolation)
- **Week 9+:** Unit tests for complex business logic
- **Target:** 60-70% coverage (not 100%)

**Priority:**
1. High: Authentication, billing, tenant isolation
2. Medium: CRUD operations, validations
3. Low: Getters/setters, simple helpers

---

## 📚 Tech Stack

### Backend
- **Framework:** Laravel 13.17
- **PHP:** 8.3
- **Database:** MySQL 8.0
- **Multi-Tenancy:** stancl/tenancy
- **Permissions:** spatie/laravel-permission
- **Testing:** Pest

### Frontend
- **Framework:** React 19
- **Language:** TypeScript 5.9
- **Routing:** Inertia.js 3.0
- **Styling:** Tailwind CSS 4
- **Components:** shadcn/ui
- **Build:** Vite 8.2
- **Testing:** Vitest

---

## 🔐 Multi-Tenancy

**Architecture:** Database per tenant

**Identification:** Domain/subdomain-based
- Central: `absen.digital`, `localhost`
- Tenant: `{slug}.absen.digital` or custom domain

**Data Isolation:**
- Central DB: `abdigi_central` (tenants, plans, subscriptions)
- Tenant DB: `absen_digital_tenant_{uuid}` (attendance, employees)

**Benefits:**
- Perfect data isolation (zero risk of data leakage)
- Easy per-tenant backup/restore
- Horizontal scaling (distribute databases)
- Compliance-friendly (physical separation)

---

## 📖 Documentation

- **[Architecture Decisions](docs/architecture/)** - Why we made certain technical choices
- **[API Documentation](docs/api/)** - API endpoints and usage *(coming soon)*
- **[Deployment Guide](docs/deployment/)** - How to deploy to production *(coming soon)*

---

## 🤝 Contributing

### Workflow

1. Create feature branch: `feature/subscription-renewal`
2. Implement changes following [naming conventions](docs/architecture/decisions/0008-naming-conventions.md)
3. Run linters and tests
4. Create pull request with tests included
5. Wait for code review

### Code Quality Checks

All PRs must pass:
- ✅ PHP linting (Pint)
- ✅ PHP static analysis (PHPStan)
- ✅ TypeScript linting (ESLint)
- ✅ TypeScript formatting (Prettier)
- ✅ Type checking (TypeScript)
- ✅ Tests (Pest + Vitest)
- ✅ Coverage maintained at 60%+

### Creating New ADRs

When making significant architectural decisions:

1. Copy `docs/architecture/template.md`
2. Fill out all sections (Context, Options, Decision, Consequences)
3. Number sequentially (e.g., `0009-your-decision.md`)
4. Update `docs/architecture/README.md` index
5. Update `docs/architecture/summaries/decisions-summary.md`
6. Submit PR for team review

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 👥 Team

- **Technical Lead:** [Name]
- **Backend Team:** [Names]
- **Frontend Team:** [Names]
- **DevOps:** [Names]

---

## 📞 Support

- **Slack:** #absen-digital-dev
- **Email:** dev@absen.digital
- **Documentation:** [Internal Wiki URL]

---

**Built with ❤️ by the Absen Digital Team**
