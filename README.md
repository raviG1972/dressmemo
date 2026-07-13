# DressMemo — Never Forget a Look 👗

A wardrobe memory app that helps you remember what you wore, plan outfits, and discover fashion deals.

## Features

- 📸 **Save Outfits** — Snap a photo, drag a cut line to split into top & bottom, save to wardrobe
- 👕 **Match a Suit** — Split-screen slider panels with filters to mix & match tops + bottoms
- 🗓️ **Event Memos** — Plan upcoming events with tag-based outfit suggestions
- 📅 **Calendar Views** — See past outfits & upcoming events on beautiful calendars
- 👗 **My Wardrobe** — Browse all clothing by category with favorites & tags
- 🛍️ **Shop Offers** — Browse deals & coupons from connected fashion stores
- 💍 **Accessories** — Dedicated collection for jewelry, bags & more
- 🔍 **Search** — Find anything across outfits, events & wardrobe

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Prisma ORM with SQLite
- **State**: Zustand
- **Animations**: Framer Motion
- **Calendar**: react-day-picker v9
- **Carousel**: Embla Carousel

## Getting Started

```bash
# Install dependencies
bun install

# Set up database
bun run db:push

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes (auth, clothing, outfits, events, stores, coupons)
│   ├── page.tsx      # Main entry — state-based view switching
│   └── layout.tsx    # Root layout with metadata
├── components/
│   ├── app/          # App components (HomeDashboard, MatchSuit, Wardrobe, etc.)
│   ├── auth/         # Login & Register screens
│   └── ui/           # shadcn/ui components
└── lib/
    ├── store.ts      # Zustand state management
    ├── db.ts         # Prisma client
    ├── auth.ts       # Authentication helpers
    └── utils.ts      # Utility functions
```

## License

MIT
