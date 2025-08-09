Frontend (Next.js) UI

Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- TanStack Query
- zod

Run locally
1) cd frontend
2) npm install
3) Create .env.local with:
   NEXT_PUBLIC_API_URL=http://127.0.0.1:9100
4) npm run dev

Features
- Signals list with create/delete
- Signal actions editor (name + bit) with client-side duplicate-bit validation
- Uses gateway endpoints under /ui/*

