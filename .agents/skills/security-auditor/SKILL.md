---
name: security-auditor
description: Expert security auditor for Angular 21 + ASP.NET Core applications. Use for security audits, penetration testing, and compliance reviews.
risk: unknown
source: community
date_added: "2026-02-27"
---

# Security Auditor (Angular 21 + .NET 8)

> Focus on **auditing & assessing** security posture — not writing code. Use `backend-security-coder` / `frontend-security-coder` for implementation.

> **Note**: LAP_CLIENT is currently frontend-only (Angular 21). This skill covers both frontend and future backend auditing.

## Project Architecture

| Layer | Technology | Security Focus |
|-------|-----------|----------------|
| API (future) | ASP.NET Core 8 + OpenIddict | Authentication, authorization, input validation |
| Data (future) | EF Core + SQL Server | SQL injection, data access, audit trails |
| Frontend | Angular 21 + RxJS | XSS, auth flows, route guards |
| Auth | JWT / OpenIddict | Token management, claims, policies |

## Audit Checklist

### Angular Frontend

- [ ] AuthGuard on all protected routes
- [ ] Permission checks in UI before showing sensitive elements
- [ ] No `innerHTML` with user-generated content
- [ ] Tokens stored in sessionStorage (not localStorage)
- [ ] API calls through service layer (not direct HTTP)
- [ ] External URLs validated before navigation
- [ ] No sensitive data in URL query params
- [ ] `takeUntilDestroyed` used for all Observables

### Authentication (OpenIddict — future backend)

- [ ] OpenIddict Password Flow properly configured
- [ ] Refresh tokens implemented and stored securely
- [ ] Token expiration enforced (access token TTL)
- [ ] Password complexity enforced via Identity options
- [ ] Account lockout configured (max failed attempts)
- [ ] Production certificates for token signing/encryption

### Authorization (future backend)

- [ ] All API endpoints have `[Authorize]` or `[AllowAnonymous]`
- [ ] Policy-based authorization for sensitive operations
- [ ] `GetCurrentUserId()` used correctly in controllers
- [ ] Claims checked via `RequireClaim()` — not just authentication

### Input Validation (future backend)

- [ ] FluentValidation on all DTOs
- [ ] `[SanitizeModel]` applied to controllers handling user input
- [ ] String length limits enforced (MaxLength on all strings)

### API Security

- [ ] CORS restricted to known origins (not `AllowAnyOrigin`)
- [ ] HTTPS enforced in production
- [ ] Rate limiting configured
- [ ] No stack traces in API responses
- [ ] Error messages do not leak internal details

## OWASP Top 10 Quick Reference

| # | Vulnerability | Checklist Item |
|---|---------------|----------------|
| A01 | Broken Access Control | Policy authorization on all endpoints |
| A02 | Cryptographic Failures | Production certs for OpenIddict |
| A03 | Injection | FluentValidation + no raw SQL |
| A04 | Insecure Design | Threat model for business logic |
| A05 | Security Misconfiguration | CORS, HTTPS, Swagger locked down |
| A06 | Vulnerable Components | NuGet packages up to date |
| A07 | Auth Failures | OpenIddict configured correctly |
| A08 | Data Integrity Failures | Audit trails on all entities |
| A09 | Logging Failures | Failed auth attempts logged |
| A10 | SSRF | URL validation on external requests |

## Severity Classification

| Severity | CVSS | Action |
|----------|------|--------|
| Critical | 9.0–10.0 | Fix immediately |
| High | 7.0–8.9 | Fix within 1 week |
| Medium | 4.0–6.9 | Fix within 1 month |
| Low | 0.1–3.9 | Fix within next quarter |

## Output Format

```markdown
## Findings

### [CRITICAL] <Title>
- **Description**: ...
- **Affected**: Endpoint / Component
- **Impact**: ...
- **Remediation**: ...

### [HIGH] <Title>
...
```

## Safety

- Do not run intrusive tests in production without written approval
- Protect sensitive data — never expose secrets in reports
- Document all testing scope and methodology

## When to Use

- Requesting a full security audit
- Preparing for compliance certification
- Validating security controls after implementation
- Threat modeling for new features
- Post-incident security review
