# Frontend Architecture Audit

## Scope and entry points

The frontend currently has two layers:

```text
Next.js app shell (`frontend/app`) ── serves ──> legacy portal (`public/legacy`)
                                                     │
                                                     ├─ `login.html` (compiled portal shell)
                                                     ├─ `home.html` / `index.html` (public landing page)
                                                     ├─ `js/portal.bundle.js` (feature runtime)
                                                     ├─ `js/model-dsr-module.js`
                                                     └─ `js/replenishment-module.js`
```

`login.html` loads the portal bundle and the two feature modules. The bundle contains the
following logical modules in execution order: API, state, phase, hierarchy, performance,
navigation, authentication, projects, front matter, chapters, plates, graphs, users,
tables, Annexures I-VII, additional annexures, signatures, PDF preview, audit logs, model
DSR, and application bootstrap. `model-dsr-module.js` and `replenishment-module.js` extend
this global runtime and are therefore dependent on the portal bundle being loaded first.

## Measured current state

| Area | Finding | Impact |
| --- | --- | --- |
| Main runtime | `portal.bundle.js` is 18,062 lines | One change risks unrelated portal features. |
| Compiled UI | `login.html` is 6,057 lines | Templates and generated output drift easily. |
| Styling | `premium-theme.css` is 7,177 lines; `styles.css` is 4,552 lines | Cascade conflicts and `!important` overrides are likely. |
| Feature modules | Replenishment is 4,293 lines; Model DSR is 3,098 lines | Each owns rendering, state, persistence, and export logic. |
| Data payload | `public/legacy/projects.json` is approximately 5 MB | Initial load and in-browser state work are slower than necessary. |
| Build configuration | `build.js` declares source files that are not present beside the compiled bundle | The build cannot be treated as the authoritative source of the runtime. |

## Root causes

1. The runtime was concatenated into a single bundle but its source modules were not kept as
   editable files.
2. UI markup uses inline handlers and inline styles, coupling templates to global functions.
3. State is centralised in global `window.S`, and feature modules mutate it directly.
4. API calls are partly centralised (`apiFetch`) but feature-specific request handling is mixed
   with rendering code.
5. Generated files (`login.html`, `home.html`, `index.html`) live with templates, making it
   easy to patch the generated file but lose the change on the next build.
6. CSS is split by historical themes rather than component ownership; later styles override
   earlier styles instead of sharing design tokens.

## Risk-controlled migration design

The portal will be migrated with a compatibility boundary, not a big-bang rewrite:

```text
templates + feature source modules
        │
        ▼
compatibility build step ──> portal.bundle.js / login.html (existing public contract)
        │                                      │
        ▼                                      ▼
new services, state helpers, styles      existing global handlers kept temporarily
```

This means URLs, API payloads, local storage keys, DOM IDs, button handlers and user-visible
behaviour stay stable while implementation ownership moves into source modules.

## Priority fixes

1. Recover each logical module from `portal.bundle.js` and make builds reproducible.
2. Make templates authoritative; do not manually edit compiled HTML.
3. Introduce shared API, state, notification, upload and route modules behind compatibility
   wrappers.
4. Migrate one feature at a time, starting with chapters/plates and project loading because
   those are current reliability risks.
5. Consolidate CSS tokens and component styles only after the runtime ownership is stable.

## Deferred removals

No legacy module, endpoint, DOM ID, CSS selector, local-storage key, or inline handler is
removed until its replacement has browser regression coverage. This is intentional: removing
them sooner would violate the requirement to preserve every existing feature.
