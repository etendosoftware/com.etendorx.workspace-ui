---
name: workspace-ui-security
description: Checklist de seguridad frontend para auditar código React/Next.js en Etendo WorkspaceUI. Usado por Vigia cuando el diff contiene .tsx/.ts.
---

# Etendo WorkspaceUI — Frontend Security Audit Checklist

## Security Checklist

### XSS (Cross-Site Scripting)
- `dangerouslySetInnerHTML` without DOMPurify sanitization → Critical
- `href="javascript:"` or dynamic `href` with user input → Critical
- `eval()`, `Function()`, `setTimeout(string)` → Critical
- Rendering user-controlled HTML via template literals in JSX → High
- `window.location` assignment with user-controlled values → High
- `innerHTML` via DOM refs → High

### Sensitive Data Exposure
- API keys, tokens, secrets in source code or comments → Critical
- Sensitive data stored in `localStorage` or `sessionStorage` → High
- Sensitive data in URL query parameters → High
- Auth tokens or PII logged to console (even at debug level) → Medium
- Sensitive fields returned from API and rendered without filtering → Medium
- Environment variables exposed to client without `NEXT_PUBLIC_` prefix awareness → Medium

### Authentication & Authorization
- Client-side auth checks that can be bypassed → High
- Missing auth guards on protected routes/pages → High
- Token handling: stored in cookies (good) vs localStorage (bad for XSS) → Medium
- Session management: token refresh, expiry, logout cleanup → Medium
- Role-based UI rendering without server-side enforcement → Medium

### CSRF & Request Security
- Forms or API calls without CSRF token validation → High
- Missing `SameSite` attribute on cookies → Medium
- Cross-origin requests without proper CORS validation → Medium

### Next.js Specific
- Server Actions without input validation → High
- Middleware auth bypass: routes not covered by auth middleware → High
- `getServerSideProps` / `generateMetadata` exposing sensitive data to client → Medium
- API routes without rate limiting on sensitive operations → Medium
- Dynamic imports loading untrusted code → Medium

### Input Handling
- User input passed to `fetch()` URL without sanitization → High
- Unvalidated form inputs used in API calls → Medium
- File uploads without type/size validation → Medium
- RegExp with user input (ReDoS risk) → Medium

### Dependencies
- New npm packages added without security review → Medium
- Known vulnerable versions of existing packages → High

## Severity Classification
| Severity | Definition |
|----------|------------|
| Critical | Compromises data of all users / full application takeover |
| High     | Compromises data of a specific user or session |
| Medium   | Degrades security; requires manual review |
| Low      | Best practice not followed; no direct exploitability |

## Verdict Format
```
Verdict: CLEARED | BLOCKED
Checks performed: [list]

Findings:
- [CRITICAL/HIGH/MEDIUM/LOW] packages/MainUI/path/File.tsx line X: description, impact, suggested fix

(If no findings: "No security findings.")
```

BLOCKED: only on Critical or High findings.
Medium and Low: report as findings, do not block.

## Rules
1. Never post comments, reviews, or labels on GitHub
2. Report only what can be demonstrated from the diff
3. Medium and Low do not block the pipeline
4. Critical and High: report immediately to Compas for user escalation
