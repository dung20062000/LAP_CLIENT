# LAP_CLIENT — Agent System

## Tech Stack

- **Angular 21** (standalone components, signals)
- **TypeScript** strict mode
- **Bootstrap 4** + jQuery
- **RxJS** for reactive patterns

## Agent Rules

| File | Trigger | Scope |
|------|---------|-------|
| `angular.mdc` | Always | All files |
| `architecture.mdc` | Always | All files |
| `security.mdc` | Always | All files |
| `api.mdc` | Always | All files |

## Skills

| Skill | When to Use |
|-------|------------|
| `web-design-guidelines` | "Review UI", "Check accessibility", "Audit design" |
| `security-auditor` | Full security audit, compliance review |
| `frontend-security-coder` | Writing Angular components/services |
| `api-security-best-practices` | API endpoint design, REST patterns |
| `concise-planning` | "Make a plan", "How to approach" |

## Workflow

1. Read `AGENTS.md` for project context
2. Read relevant `.cursor/rules/*.mdc` for coding standards
3. Follow `concise-planning` skill when asked for a plan
4. Follow `frontend-security-coder` skill when writing Angular code
5. Follow `web-design-guidelines` skill when reviewing UI/UX

## Project Structure

```
src/
└── app/
    ├── app.ts           # Root component
    ├── app.routes.ts    # Route definitions
    ├── app.config.ts    # App configuration
    ├── app.html         # Root template
    └── main.ts          # Bootstrap
```

## Comments & Documentation

- Chỉ dùng `//` cho TypeScript/Angular. **Tuyệt đối không dùng `/* */`**.
- Viết bằng **Tiếng Việt có dấu** hoặc **Tiếng Anh** xuyên suốt — không trộn lẫn.
- **Block comment** (bắt buộc đủ 3 phần) cho Class, Method, Properties, Logic phức tạp:

  ```
  /**
   * Người tạo: [Tên]
   * Ngày tạo: DD/MM/YYYY
   * [Nội dung ghi chú]
   */
  ```

- **Inline comment** viết phía trên dòng code, ngắn gọn, tránh lạm dụng gây "code smell".
- **Đầu mỗi file** nên có header mô tả ngắn.

## Key Conventions

- **Angular 21** standalone components (no NgModules)
- **Signals** for local state, **RxJS** for async streams
- **Reactive forms** over template-driven forms
- **OnPush** change detection
- All API calls via a dedicated HTTP service layer
- **Bootstrap 4** for layout — no Tailwind
