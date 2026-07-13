---
Task ID: events-offers-coupons
Agent: Main
Task: Add future events, store offers, coupons/QR codes, and smart suggestions

Work Log:
- Updated Prisma schema with Event, Store, StoreOffer, Coupon, StoreSubscription models
- Pushed schema to DB and regenerated Prisma client
- Fixed store auth to use in-memory sessions (separate from user DB sessions)
- Created 13+ API routes for events, stores, offers, coupons, suggestions, QR codes
- Created 5 new UI components: AddEventDialog, SuggestionsPanel, OffersView, CouponCard, MyCouponsView
- Updated 4 existing components: CalendarView, BottomNav, ProfileView, page.tsx
- Added types and actions to Zustand store for events, offers, coupons, suggestions
- Fixed store password leak in API responses
- Tested all features via curl and Agent Browser
- Events: create, list, show on calendar with emerald dots
- Store offers: public browsing with city/category filters
- Coupons: claim with unique code, QR code generation, status tracking
- Suggestions: tag-matched wardrobe items + store offers

Stage Summary:
- Full events system with 8 event types, 14 fashion tags, location/city
- Store offer marketplace with discount percentages, pricing, city targeting
- QR code coupon system with claim tracking and max coupon limits
- Smart suggestions matching event tags to wardrobe + store offers
- Store owner monetization: subscription plans (monthly/per-coupon)
- All APIs verified working, browser tested end-to-end
