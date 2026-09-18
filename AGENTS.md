# Research Archive — stack notes

This project is a Next.js (App Router, TypeScript) web app, **not** Expo/React
Native. It uses:

- Next.js Route Handlers + `firebase-admin` for all data access (no direct
  client-side Firestore/Storage access — everything goes through the server).
- `pdf-lib` + `@pdf-lib/fontkit` + the bundled `assets/fonts/NotoSansThai-Regular.ttf`
  to stamp watermarks onto PDFs.
- `react-pdf` + `react-pageflip` for the e-book style page-flip viewer.

See `README.md` for setup (Firebase project, env vars, admin access code).
