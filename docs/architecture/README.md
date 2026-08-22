# Architecture Documentation

**Last Updated:** 2026-08-22

This directory contains Architecture Decision Records (ADRs) and related documentation for the Absen Digital project.

---

## 📚 Quick Navigation

### For AI Agents
- **Start here:** [decisions-summary.md](summaries/decisions-summary.md) (~1,200 tokens)
- Quick overview of all architectural decisions
- Links to full details when needed

### For Developers
- **New to project?** Read [decisions-summary.md](summaries/decisions-summary.md) first
- **Need details?** Browse [decisions/](decisions/) folder
- **Creating new ADR?** Use [template.md](template.md)

---

## 📋 ADR Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| [ADR-0001](decisions/0001-service-repository-pattern.md) | Service-Repository Pattern | Accepted | 2026-08-22 |
| [ADR-0002](decisions/0002-package-based-architecture.md) | Package-Based Architecture | Accepted | 2026-08-22 |
| [ADR-0003](decisions/0003-frontend-feature-modules.md) | Frontend Feature Modules | Accepted | 2026-08-22 |
| [ADR-0004](decisions/0004-inertia-react-stack.md) | Inertia.js + React Stack | Accepted | 2026-08-22 |
| [ADR-0005](decisions/0005-multi-tenancy-approach.md) | Multi-Tenancy Database Strategy | Accepted | 2026-08-22 |
| [ADR-0006](decisions/0006-testing-strategy.md) | Testing Strategy (Marathon Mode) | Accepted | 2026-08-22 |
| [ADR-0007](decisions/0007-type-safety-backend-frontend.md) | Type Safety Backend ↔ Frontend | Accepted | 2026-08-22 |
| [ADR-0008](decisions/0008-naming-conventions.md) | Naming Conventions & Standards | Accepted | 2026-08-22 |

---

## 🎯 What is an ADR?

Architecture Decision Records (ADRs) are documents that capture important architectural decisions made along with their context and consequences.

**Why ADRs?**
- Document **why** decisions were made, not just **what**
- Provide context for future team members
- Enable informed decision-making when revisiting choices
- Create institutional knowledge

---

## ✍️ Creating New ADRs

### When to Create an ADR

Create an ADR when you make a decision that:
- Affects the structure of the application
- Has significant impact on developers
- Is difficult or expensive to reverse
- Involves trade-offs between competing concerns

**Examples:**
- Choosing a new framework or library
- Changing database schema strategy
- Adopting a new architectural pattern
- Establishing coding standards

### How to Create an ADR

1. **Copy the template:**
   ```bash
   cp docs/architecture/template.md docs/architecture/decisions/XXXX-your-decision.md
   ```

2. **Number sequentially:**
   - Use 4-digit format: `0009`, `0010`, etc.
   - Check existing ADRs for the next available number

3. **Fill out all sections:**
   - Context: What is the situation?
   - Decision Drivers: What factors matter?
   - Considered Options: What alternatives exist?
   - Decision Outcome: What did we choose and why?
   - Consequences: What are the impacts?

4. **Update documentation:**
   - Add entry to this README
   - Update [decisions-summary.md](summaries/decisions-summary.md)
   - Link related ADRs if applicable

5. **Get review:**
   - Submit PR with ADR
   - Discuss with team
   - Mark as "Proposed" until consensus

---

## 📖 ADR Lifecycle

ADRs can have the following statuses:

- **Proposed**: Under discussion, not yet accepted
- **Accepted**: Decision is approved and should be followed
- **Deprecated**: No longer relevant but kept for historical context
- **Superseded**: Replaced by another ADR (link to new ADR)

---

## 🔗 External References

- [ADR GitHub Organization](https://adr.github.io/)
- [Documenting Architecture Decisions (Michael Nygard)](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR Tools](https://github.com/npryce/adr-tools)
- [Architecture Decision Records (ThoughtWorks)](https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records)

---

## 📞 Questions?

If you have questions about the architecture decisions or need clarification:
1. Check the full ADR document first
2. Search for related discussions in PR comments
3. Ask in the team chat with reference to the ADR number
4. If the ADR is unclear, submit a PR to improve it

---

**Note:** ADRs are living documents. If circumstances change or we gain new insights, we can deprecate or supersede old ADRs with new ones. Never delete ADRs - they provide valuable historical context.
