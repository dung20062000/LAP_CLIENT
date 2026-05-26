---
name: frontend-security-coder
description: Expert in secure Angular 21 coding. Use PROACTIVELY when writing Angular components, services, or any frontend security patterns.
risk: unknown
source: community
date_added: "2026-02-27"
---

# Frontend Security Coder (Angular 21)

> Focus on **writing secure Angular code** — not auditing. Use `security-auditor` for audits/threat modeling.

## Architecture

This project uses **Angular 21** standalone components:
- `src/app/services/` — API services, auth, utilities
- `src/app/components/` — Reusable UI components
- `src/app/pages/` — Route-level page components
- `src/app/models/` — TypeScript interfaces and types
- `src/app/guards/` — Route guards

## Key Patterns

### Authentication

```typescript
// AuthService handles token storage and login
// Tokens stored in sessionStorage (not localStorage)
// Access token sent via HTTP interceptor

// Check if user is logged in
import { AuthService } from '../services/auth.service';
const isLoggedIn = authService.isLoggedIn;
```

### Permission Checking

```typescript
// Check permission before showing UI
import { PermissionService } from '../services/permission.service';
if (!this.permissionService.hasPermission('view_users')) {
  // hide or disable
}
```

### Route Guards

```typescript
// Use CanActivateFn on protected routes in app.routes.ts
// auth.guard.ts checks isLoggedIn and redirects to login

// In component: redirect if not authorized
import { AuthService } from '../services/auth.service';
if (!this.authService.isLoggedIn) {
  this.authService.redirectForLogin();
}
```

### XSS Prevention

```typescript
// ✅ Safe — never use innerHTML with user input
// Use textContent or Angular binding (automatically sanitized)
<span>{{ userInput }}</span>

// ❌ Dangerous — bypass Angular's sanitization
// <div [innerHTML]="userHtml"></div>

// If you must render HTML, sanitize first with DOMPurify
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(dirtyHtml);
```

### URL / Navigation Security

```typescript
// Validate external URLs before navigation
function isSafeRedirect(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// External links must have rel="noopener noreferrer"
<a [href]="externalUrl" target="_blank" rel="noopener noreferrer">
```

### HTTP Interceptors

```typescript
// AuthInterceptor handles:
// 1. Attaching access token to requests
// 2. Refreshing tokens when expired
// 3. Redirecting to login on 401

// Never modify tokens manually — use AuthService methods
authService.logout();
authService.loginWithCredentials(username, password);
```

### Form Validation

```typescript
// Use reactive forms with built-in validators
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
this.form = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(8)]],
});

// Validate before API calls
if (this.form.invalid) return;
```

### File Upload Security

```typescript
// Validate file type and size before upload
onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  // Validate MIME type
  if (!file.type.startsWith('image/')) {
    alert('Vui lòng chọn file hình ảnh');
    return;
  }
  // Validate size (e.g., 10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    alert('Kích thước file không được vượt quá 10MB');
    return;
  }

  this.selectedFile = file;
}
```

### Multipart FormData Pattern

```typescript
// Backend sends [FromForm] — send FormData with multipart encoding
private buildFormData(): FormData {
  const formData = new FormData();
  const values = this.form.value;

  formData.append('title', values.title ?? '');
  formData.append('content', values.content ?? '');
  if (this.selectedFile) {
    formData.append('file', this.selectedFile);
  }
  return formData;
}

// In service — no Content-Type header, browser sets it automatically
create(formData: FormData): Observable<SomeResponse> {
  return this.http.post<SomeResponse>(this.apiUrl, formData);
}
```

## Checklist

- [ ] All protected routes have a `CanActivateFn` guard
- [ ] Permission checks before showing sensitive UI
- [ ] Never use `innerHTML` with untrusted content — use `{{ expression }}`
- [ ] External links have `rel="noopener noreferrer"`
- [ ] All API calls go through service layer (not direct HTTP)
- [ ] Forms validated before submission
- [ ] No sensitive data in URL query params
- [ ] Tokens stored in sessionStorage (not localStorage)
- [ ] Redirect URLs validated before navigation
- [ ] File uploads validate type and size client-side before sending
- [ ] FormData used for multipart/form-data (no JSON Content-Type header)
- [ ] Unsubscribe from Observables using `takeUntilDestroyed`

## When to Use

- Writing Angular components, services, or directives
- Implementing login/logout flows
- Building protected routes
- Rendering user-generated content
- Making HTTP requests to API
- Reviewing Angular code for security issues
