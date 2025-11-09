# AIVRA Frontend

Next.js + TypeScript implementation of the AIVRA catalogue UI. The legacy static HTML/Tailwind assets have been removed; all work now happens inside the `frontend/` app.

## Getting Started

```bash
cd frontend
npm install       # run once
npm run dev       # start local dev server (default http://127.0.0.1:3000)
```

### Useful Scripts

- `npm run lint` – verify ESLint rules
- `npm run build` – production build
- `npm run start` – run compiled app

## Project Layout

- `frontend/app/` – Next.js App Router pages and layout
- `frontend/components/` – UI building blocks (sidebar, product cards, shell, etc.)
- `frontend/lib/` – catalogue data and navigation helpers
- `frontend/public/images/product-placeholder.svg` – shared placeholder used when no product image is supplied
