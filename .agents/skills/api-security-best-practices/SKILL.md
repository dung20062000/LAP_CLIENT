---
name: api-security-best-practices
description: "Implement secure API patterns in Angular 21 + ASP.NET Core 8. Covers authentication, FluentValidation, EF Core security, CORS, and OWASP Top 10 for this project."
risk: unknown
source: community
date_added: "2026-02-27"
---

# API Security Best Practices (Angular 21 + .NET 8)

> **Note**: LAP_CLIENT is currently frontend-only (Angular 21). This skill covers frontend HTTP patterns now and backend API patterns for future development.

## Angular Frontend — HTTP Patterns

### Service Layer

```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  get<T>(path: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${path}`, { params });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${path}`, body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${path}`);
  }
}
```

### Error Handling

```typescript
// Catch + rethrow with logging
.pipe(
  catchError((err) => {
    console.error('API error:', err);
    return throw(() => err);
  })
);

// Component: show user-friendly message
error: (err) => {
  this.error.set('Không thể tải dữ liệu. Vui lòng thử lại.');
}
```

## Future Backend — .NET 8 API Security

### Authentication (OpenIddict)

```csharp
// Program.cs — OpenIddict server configuration
builder.Services.AddOpenIddict()
    .AddServer(options => {
        options.SetTokenEndpointUris("connect/token");
        options.AllowPasswordFlow().AllowRefreshTokenFlow();

        options.RegisterScopes(Scopes.Profile, Scopes.Email, Scopes.Roles);

        // Production: use real certificates
        if (!builder.Environment.IsDevelopment()) {
            var cert = new X509Certificate2(path, password);
            options.AddEncryptionCertificate(cert).AddSigningCertificate(cert);
        }
    });
```

### Authorization (ASP.NET Core)

```csharp
// Program.cs — define policies
builder.Services.AddAuthorizationBuilder()
    .AddPolicy(AuthPolicies.ViewAllUsersPolicy,
        policy => policy.RequireClaim(CustomClaims.Permission, ApplicationPermissions.ViewUsers))
    .AddPolicy(AuthPolicies.ManageAllUsersPolicy,
        policy => policy.RequireClaim(CustomClaims.Permission, ApplicationPermissions.ManageUsers));

// Controller — use policies
[Authorize(Policy = AuthPolicies.ManageAllUsersPolicy)]
public async Task<IActionResult> DeleteUser(string id) { ... }
```

### Input Validation (FluentValidation)

```csharp
// DTO Validator
public class NhaCungCapValidator : AbstractValidator<NhaCungCapRequestServerDto>
{
    public NhaCungCapValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(100);
        RuleFor(x => x.Email)
            .EmailAddress().When(x => !string.IsNullOrEmpty(x.Email));
    }
}

// Program.cs — register
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<NhaCungCapValidator>();
```

### SQL Injection Prevention (EF Core)

```csharp
// ✅ Safe — LINQ queries parameterized automatically
var customer = await _context.Customers
    .Where(c => c.Name == searchTerm)
    .ToListAsync();

// ❌ Never do this — string interpolation in SQL
await _context.Database.ExecuteSqlRawAsync($"UPDATE Customers SET Name = '{name}'");
```

### Error Handling

```csharp
// ❌ Never expose internal errors
catch (Exception ex) {
    _logger.LogError(ex, "Failed");
    return StatusCode(500, new { message = ex.Message }); // leaks info
}

// ✅ Return generic message
catch (Exception ex) {
    _logger.LogError(ex, "Failed");
    return StatusCode(500, new { message = "An error occurred. Please try again." });
}
```

### CORS Configuration

```csharp
// Production — specify exact origins
app.UseCors(builder => builder
    .WithOrigins("https://yourdomain.com", "https://admin.yourdomain.com")
    .AllowCredentials()
    .AllowAnyHeader()
    .AllowAnyMethod());
```

## Checklist

### Frontend
- [ ] All API calls go through service layer
- [ ] Error handling with user-friendly messages
- [ ] `takeUntilDestroyed` for subscription cleanup
- [ ] Token attached via HTTP interceptor

### Future Backend
- [ ] OpenIddict configured with production certificates
- [ ] All API endpoints have `[Authorize]` or `[AllowAnonymous]`
- [ ] Policy authorization on sensitive operations
- [ ] All DTOs have FluentValidation validators
- [ ] No raw SQL with string interpolation
- [ ] Audit fields on all entities
- [ ] Error responses do not leak internal details
- [ ] CORS restricted to known origins

## OWASP API Top 10 Quick Reference

1. **Broken Object Level Authorization** — filter by `CreatedBy` or ownership
2. **Broken Authentication** — OpenIddict configured correctly
3. **Broken Object Property Level Authorization** — select only needed fields
4. **Unrestricted Resource Consumption** — rate limiting + pagination
5. **Broken Function Level Authorization** — policy-based checks
6. **Mass Assignment** — explicit DTOs, no dynamic object binding
7. **Server-Side Request Forgery (SSRF)** — validate URLs
8. **Security Misconfiguration** — CORS, HTTPS, Swagger locked down
9. **Improper Inventory Management** — remove unused endpoints
10. **Unsafe Consumption of APIs** — validate third-party responses

## When to Use

- Designing new API endpoints
- Securing existing APIs
- Conducting API security reviews
- Preparing for security audits
