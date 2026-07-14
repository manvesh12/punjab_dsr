# Legacy Portal Runtime Modules

These files are the editable source of `../portal.bundle.js`.

`build.js` concatenates them in its explicit dependency order. Do not change the order
without browser regression tests: the legacy portal deliberately exposes compatibility
functions and state on `window` for its existing templates and feature extensions.

| Module group | Responsibility |
| --- | --- |
| `api`, `state`, `phase`, `hierarchy` | Shared transport, state and project lifecycle. |
| `navigation`, `auth`, `projects` | Application navigation, authentication and project selection. |
| `frontmatter`, `chapters`, `plates`, `graphs`, `tables` | Core DSR authoring screens. |
| `anx*`, `annexure-*`, `more-annexures` | Annexure feature modules. |
| `signatures`, `pdf-preview` | Finalisation and preview functionality. |
| `audit-logs`, `model-dsr`, `main` | Administration, Model DSR compatibility and bootstrap. |

The next migration step is to extract shared state and HTTP helpers behind stable wrappers,
then replace inline template handlers feature by feature. The compiled bundle remains checked
in during that migration so existing URLs and static deployment behaviour do not change.
