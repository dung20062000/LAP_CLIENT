---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  author: vercel
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

## Project Design System

This project uses:
- **Angular 21** with **Bootstrap 4**
- **SCSS** for component styles
- **jQuery** + **Popper.js** (Bootstrap dependencies)

### Bootstrap Components

| Component | Class |
|-----------|-------|
| Grid | `.row`, `.col-*`, `.col-md-*`, `.col-lg-*` |
| Buttons | `.btn`, `.btn-primary`, `.btn-secondary` |
| Forms | `.form-control`, `.form-group`, `.was-validated` |
| Cards | `.card`, `.card-body`, `.card-header` |
| Modals | `.modal`, `.modal-dialog`, `.modal-content` |
| Tables | `.table`, `.table-striped`, `.table-hover` |
| Alerts | `.alert`, `.alert-danger`, `.alert-success` |
| Navbar | `.navbar`, `.navbar-expand-*`, `.navbar-nav` |

## How It Works

1. Fetch the latest guidelines from the source URL below
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the fetched guidelines
4. Output findings in the terse `file:line` format

## Guidelines Source

Fetch fresh guidelines before each review:

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Use WebFetch to retrieve the latest rules. The fetched content contains all the rules and output format instructions.

## Usage

When a user provides a file or pattern argument:
1. Fetch guidelines from the source URL above
2. Read the specified files
3. Apply all rules from the fetched guidelines
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.

## Angular-Specific Guidelines

### Component Architecture

```typescript
// ✅ Good: Smart/Dumb component separation
// Smart component (container) — handles data
// Dumb component (presentational) — just renders

// ✅ Good: Use Angular's built-in sanitization
// {{ expression }} — auto-sanitized
// [innerHTML]="html" — only if content is trusted

// ❌ Bad: Using innerHTML with user input
// <div [innerHTML]="userInput"></div> — XSS risk
```

### Responsive Design

```html
<!-- Bootstrap grid system -->
<div class="row">
  <div class="col-12 col-md-6 col-lg-4">
    <!-- Content -->
  </div>
</div>

<!-- Responsive utilities -->
<div class="d-none d-md-block">Hidden on mobile</div>
<div class="d-block d-md-none">Only on mobile</div>
```

### Accessibility (a11y)

```html
<!-- Semantic HTML -->
<nav aria-label="Main navigation">...</nav>
<main role="main">...</main>
<button type="button">Click me</button> <!-- not <div onclick> -->

<!-- ARIA when needed -->
<button aria-label="Close dialog" (click)="close()">
  <i class="fa fa-times" aria-hidden="true"></i>
</button>
```

## When to Use

- "Review my UI"
- "Check accessibility"
- "Audit design"
- "Review UX"
- "Check my site against best practices"
