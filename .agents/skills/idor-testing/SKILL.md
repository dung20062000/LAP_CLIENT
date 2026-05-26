---
name: idor-testing
description: "Use when asked to test for insecure direct object references, find IDOR vulnerabilities, or exploit broken access control in Angular 21 + ASP.NET Core apps."
risk: unknown
source: community
author: zebbern
date_added: "2026-02-27"
---

# IDOR Vulnerability Testing (Angular 21 + .NET 8)

> ⚠️ **Only test with written authorization.** Do not access real user data.

> **Note**: LAP_CLIENT is currently frontend-only. This skill is for future backend API testing.

## Project-Specific Context

When a backend is added, this project will use:
- **OpenIddict** for authentication (Bearer tokens in `Authorization` header)
- **EF Core** with GUID primary keys
- **Angular 21** SPA consuming REST API
- **Policy-based authorization** via ASP.NET Core

## Quick Reference

### IDOR Types in This Project (future)

**Entity Reference via Route Parameters:**
```
GET /api/customers/550e8400-e29b-41d4-a716-446655440000
GET /api/products/550e8400-e29b-41d4-a716-446655440000
```

### Detection Checklist

| Test | Method | Indicator |
|------|--------|-----------|
| GUID enumeration | Change GUID to another user's GUID | Returns other user's data |
| Horizontal privilege | Access another user's resource by GUID | Data returned without 403 |
| Vertical privilege | Try admin endpoints with regular user token | 403 or still returns data |
| Parameter pollution | ?customerId=A&customerId=B | Uses first or last |
| HTTP method switch | GET→POST→PUT→DELETE | Bypass via wrong method |

### Response Interpretation

| Status | Meaning |
|--------|---------|
| 200 OK | Potential IDOR — verify data ownership |
| 401 Unauthorized | No token / expired token |
| 403 Forbidden | Access control working |
| 404 Not Found | Resource doesn't exist |
| 500 Error | Input validation issue |

## Workflow

1. **Obtain Two Tokens** — Login as regular user (UserA) and another user (UserB) to get separate access tokens
2. **Identify Entity IDs** — Browse API responses to find entity GUIDs in responses
3. **Test Horizontal Access** — As UserA, try to access UserB's resources by GUID
4. **Test Vertical Access** — As regular user, try admin-only endpoints
5. **Verify Ownership** — Check if EF Core queries filter by `CreatedBy` or `UserId`

## Bypass Techniques

```
1. HTTP method switching (GET → POST → PUT → DELETE)
2. GUID case variation (uppercase/lowercase)
3. Alternative endpoints for same resource
4. Try with/without Bearer prefix
5. Token expiration edge case (just expired vs still valid)
```

## Remediation Patterns (.NET)

```csharp
// ❌ Vulnerable — only checks auth, not ownership
[HttpGet("{id}")]
public async Task<IActionResult> GetCustomer(string id) {
    return Ok(await _context.Customers.FindAsync(id));
}

// ✅ Secure — filter by current user ownership
[HttpGet("{id}")]
[Authorize(Policy = AuthPolicies.ViewAllUsersPolicy)]
public async Task<IActionResult> GetCustomer(string id) {
    var userId = GetCurrentUserId();
    var customer = await _context.Customers
        .FirstOrDefaultAsync(c => c.Id == id && c.CreatedBy == userId);

    if (customer == null) return NotFound();
    return Ok(customer);
}

// ✅ Alternative — using service layer with ownership check
public async Task<Customer?> GetCustomerAsync(string id, string userId) {
    return await _context.Customers
        .FirstOrDefaultAsync(c => c.Id == id && c.CreatedBy == userId);
}
```

## Common Vulnerable Locations

- **Orders** — `GET /api/orders/{id}` (may expose other users' orders)
- **Products** — `GET /api/products/{id}` (may expose all products)
- **Customer data** — `GET /api/customers/{id}` (PII exposure)
- **File downloads** — `GET /api/fileupload/{filename}` (static file IDOR)

## Constraints

- Requires ≥2 valid user accounts
- GUID primary keys reduce enumeration risk but don't eliminate it
- ASP.NET Core authorization policies may be incorrectly scoped
- Rate limiting may block enumeration attempts
- Document all findings and methodology

## When to Use

- Testing access control on customer/order/user resources
- Verifying authorization on API endpoints
- Auditing file upload/download access patterns
- Checking for horizontal/vertical privilege escalation
