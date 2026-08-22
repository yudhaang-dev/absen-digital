# ADR-XXXX: [Short Title of Decision]

**Status:** [Proposed | Accepted | Deprecated | Superseded by ADR-YYYY]  
**Date:** YYYY-MM-DD  
**Deciders:** [List of people involved in the decision]  
**Technical Story:** [Link to GitHub issue, Jira ticket, or discussion thread]

---

## Context

[Describe the context and problem statement. What is the issue we're trying to solve? What forces are at play? What constraints exist?]

**Example:**
> We need to decide how to organize our business logic layer. The current MVC approach is leading to fat controllers and models. We need a solution that promotes DRY principles, testability, and separation of concerns while remaining pragmatic for our team size and project timeline.

---

## Decision Drivers

[List the key factors that influence this decision, ordered by importance]

- **[Driver 1]** - [Brief explanation]
- **[Driver 2]** - [Brief explanation]
- **[Driver 3]** - [Brief explanation]

**Example:**
- **DRY Principle** - Business logic must be reusable across controllers, jobs, and commands
- **Development Speed** - Pattern should not slow down feature development
- **Team Experience** - Must be understandable for junior developers

---

## Considered Options

### Option 1: [Name of Option]

[Brief description of this option]

**Pros:**
- [Positive aspect 1]
- [Positive aspect 2]
- [Positive aspect 3]

**Cons:**
- [Negative aspect 1]
- [Negative aspect 2]
- [Negative aspect 3]

**Trade-offs:**
- [Trade-off 1]

**Example Implementation:**
```php
// Optional: Show code snippet
```

---

### Option 2: [Name of Option]

[Follow same structure as Option 1]

---

### Option 3: [Name of Option]

[Follow same structure as Option 1]

---

## Decision Outcome

**Chosen option:** "[Option X]"

**Rationale:**

[Explain why this option was chosen. Reference the decision drivers and explain how this option best addresses them. Be specific about the trade-offs you're accepting.]

**Example:**
> We chose Service-Repository Pattern because it provides the best balance between structure and pragmatism. While it requires more files than pure MVC (trade-off), it gives us the reusability and testability we need (decision drivers) without the complexity of full DDD.

---

## Consequences

### Positive

[List the positive consequences of this decision]

- [Positive consequence 1]
- [Positive consequence 2]

### Negative

[List the negative consequences or trade-offs]

- [Negative consequence 1]
- [Negative consequence 2]

### Neutral

[List consequences that are neither clearly positive nor negative]

- [Neutral consequence 1]

---

## Implementation Notes

[Provide practical guidance for implementing this decision]

### Structure

[If applicable, show folder structure or architecture diagram]

```
example/
├── folder/
│   └── structure.php
```

### Rules & Guidelines

1. [Rule 1]
2. [Rule 2]
3. [Rule 3]

### Examples

[Provide concrete code examples or scenarios]

```php
// Good example
```

```php
// Bad example (anti-pattern)
```

### Success Metrics

[How will we measure if this decision is successful?]

- [Metric 1: e.g., "Service classes average < 200 lines"]
- [Metric 2: e.g., "Test coverage > 70%"]

---

## Validation

[Optional: How can someone verify this decision is being followed?]

- [Validation method 1]
- [Validation method 2]

**Example:**
- Code review checklist includes service layer verification
- Static analysis checks for fat controllers (>20 lines)

---

## References

[Links to relevant resources, articles, documentation]

- [Reference 1 with link]
- [Reference 2 with link]
- [Reference 3 with link]

---

## Related ADRs

[Link to related architecture decisions]

- [ADR-XXXX: Related Decision Title](XXXX-related-decision.md)

---

## Revision History

| Date       | Change Description      | Author        |
|------------|-------------------------|---------------|
| YYYY-MM-DD | Initial draft          | [Your Name]   |
| YYYY-MM-DD | Status changed to X    | [Your Name]   |

---

## Notes

[Any additional notes, caveats, or context that doesn't fit elsewhere]

---

**Template Version:** 1.0  
**Last Updated:** 2026-08-22
