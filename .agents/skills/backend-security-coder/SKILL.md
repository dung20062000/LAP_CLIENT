---
name: backend-security-coder
description: Expert in secure .NET 8 backend coding. Use PROACTIVELY when writing ASP.NET Core API endpoints, services, or data access code.
risk: unknown
source: community
date_added: "2026-02-27"
---

# Backend Security Coder (.NET 8)

> Focus on **writing secure C# backend code** — not auditing. Use `security-auditor` for audits/threat modeling.

> **Note**: LAP_CLIENT is a frontend-only project (Angular 21). This skill is for future backend development or shared-context projects.

## Architecture

When a backend is added, it should use **Clean Architecture**:
- `QuickApp.Server/` — Controllers, DTOs, Authorization
- `QuickApp.Core/` — Services, Models, Infrastructure (EF Core, DbContext)
- `QuickApp.Client/` — Angular 19 SPA

## Key Patterns

### Authorization (ASP.NET Core)

```csharp
// Policy-based in Program.cs
builder.Services.AddAuthorizationBuilder()
    .AddPolicy(AuthPolicies.ViewAllUsersPolicy,
        policy => policy.RequireClaim(CustomClaims.Permission, ApplicationPermissions.ViewUsers));

// Use [Authorize] attribute on controller actions
[Authorize(Policy = AuthPolicies.ManageAllUsersPolicy)]
public async Task<IActionResult> DeleteUser(string id) { ... }
```

### Current User Access

```csharp
// In BaseApiController
protected string GetCurrentUserId(string errorMsg = "Error retrieving userId")
{
    return Utilities.GetUserId(User) ?? throw new UserNotFoundException(errorMsg);
}

// In services (via IUserIdAccessor)
public class MyService {
    private readonly IUserIdAccessor _userIdAccessor;
    public async Task DoSomething() {
        var userId = _userIdAccessor.GetCurrentUserId();
    }
}
```

### EF Core — Prevent SQL Injection

```csharp
// ✅ Safe — always use parameterized queries via LINQ
var customer = await _context.Customers.FindAsync(id);

// ✅ Safe — parameterized raw query
await _context.Database.ExecuteSqlRawAsync(
    "UPDATE Customers SET Name = {0} WHERE Id = {1}", name, id);

// ❌ Never concatenate user input into raw SQL
await _context.Database.ExecuteSqlRawAsync($"UPDATE Customers SET Name = '{name}'");
```

### FluentValidation — Input Validation

```csharp
// DTO must implement FluentValidation.AbstractValidator<T>
public class NhaCungCapValidator : AbstractValidator<NhaCungCapRequestServerDto>
{
    public NhaCungCapValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).EmailAddress();
    }
}

// Registered in Program.cs
builder.Services.AddValidatorsFromAssemblyContaining<NhaCungCapValidator>();
```

### Audit Trail (IAuditableEntity)

```csharp
// Implement IAuditableEntity for auto audit fields
public class Customer : BaseEntity, IAuditableEntity {
    public DateTime CreatedDate { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime UpdatedDate { get; set; }
    public string? UpdatedBy { get; set; }
}

// ApplicationDbContext auto-populates these via SaveChanges override
```

### OpenIddict — Token Security

```csharp
// Password flow (client app)
options.AllowPasswordFlow().AllowRefreshTokenFlow();

// Production: use real certificates (not development ones)
var cert = new X509Certificate2(path, password);
options.AddEncryptionCertificate(cert).AddSigningCertificate(cert);
```

### Error Handling — No Data Leaks

```csharp
catch (Exception ex) {
    _logger.LogError(ex, "Operation failed");
    // Return generic message — never expose ex.Message or stack trace
    return StatusCode(500, new { message = "An error occurred. Please try again." });
}
```

### CORS Configuration

```csharp
// Program.cs — be strict in production
app.UseCors(builder => builder
    .AllowAnyOrigin()  // ❌ Only for dev
    .AllowAnyHeader()
    .AllowAnyMethod());

// Production: specify exact origins
    .WithOrigins("https://yourdomain.com")
```

### Rate Limiting (.NET 8)

```csharp
// Add RateLimiter middleware in Program.cs
builder.Services.AddRateLimiter(options => {
    options.AddPolicy("strict", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString(),
            factory: _ => new FixedWindowRateLimiterOptions {
                PermitLimit = 5, Window = TimeSpan.FromMinutes(15)
            }));
});
```

## Checklist

- [ ] All API endpoints require `[Authorize]` or `[AllowAnonymous]`
- [ ] Policy-based authorization for sensitive operations
- [ ] All user inputs validated with FluentValidation
- [ ] No raw SQL with string concatenation — use LINQ or parameterized queries
- [ ] `[SanitizeModel]` applied to controllers handling user input
- [ ] Audit fields (`IAuditableEntity`) set on new entities
- [ ] Current user ID captured via `IUserIdAccessor` or `GetCurrentUserId()`
- [ ] Error responses do not leak internal details
- [ ] CORS restricted to known origins (not `AllowAnyOrigin`)
- [ ] OpenIddict certificates configured for production
- [ ] No secrets or credentials in code — use `appsettings.json` or env vars

## When to Use

- Writing new API endpoints in `QuickApp.Server/Controllers`
- Adding service logic in `QuickApp.Core/Services`
- Creating new models or DTOs
- Configuring authorization policies
- Adding FluentValidation validators
- Reviewing backend code for security issues
