# Auction Platform  auction-coral-five.vercel.app


A full-stack, real-time auction platform engineered to handle high-frequency bidding — thousands of bids in the final seconds of an auction — without row locking or storage-layer crashes.

## Overview

BidVault separates real-time performance from relational persistence using a hybrid database architecture:

- **Write-Behind Cache (Redis):** Sub-millisecond bid verification via an atomic Lua script that checks auction status, validates the minimum increment, and updates the current highest bid.
- **Relational Core (PostgreSQL / Neon):** Source-of-truth for analytics, auditing, and financial settlement. Validated bids are drained from Redis to PostgreSQL every 5 seconds.

This split lets the system absorb extreme transactional spikes at auction close while keeping a durable, auditable record of every bid.

## Tech Stack

**Backend**
- Spring Boot
- Neon PostgreSQL
- Redis Cloud (Lua scripting, Pub/Sub)
- WebSocket / STOMP (real-time bid broadcast)
- JWT authentication (jjwt 0.12.6), BCrypt (strength 12), stateless sessions
- Deployed on Render

**Frontend**
- React + Vite
- Tailwind CSS v4
- AuthContext, STOMP hook, countdown hook

## Architecture

### Relational Entity Model
- `PersonDetails` — centralizes PII, referenced 1:1 by Admin, Auctioneer, and Bidder
- `Bidder` — holds financial balances
- `Auctioneer` — holds corporate credentials
- `ItemDetailsEntity` — product catalog, valuations, shipping, image array
- `AuctionDetailsEntity` — transactional hub: starting price, reserve price, minimum increment
- `AuctionRegistrationEntity` — mandatory entry gate; bidders are vetted before entering the Redis bidding queue
- `BidHistoryEntity` — validated bids drained from Redis to PostgreSQL, with a composite index (`idx_auction_bid_amount`) for fast lookups

### Anti-Sniping Engine
- `enableAutoExtension` — monitors incoming bids near close
- `extensionWindowMinutes` — trigger threshold (e.g., 2 minutes before close)
- `extensionDurationMinutes` — how far the end time is pushed forward when triggered (e.g., +5 minutes)

### Auction Lifecycle
```
SCHEDULED → ACTIVE → COMPLETED / CANCELLED
```
A thread-safe `PAUSED` state is available for admin triage at any point during `ACTIVE`.

### Roles
- `ROLE_ADMIN`
- `ROLE_AUCTIONEER`
- `ROLE_BIDDER`

Role routing is handled by a `CustomUserDetailsService` that dispatches across separate role repositories.

## Features

- Live, real-time bidding over WebSocket/STOMP
- Atomic bid validation via Redis Lua scripting across six keys
- Auto-extension anti-sniping logic
- Auction CRUD with ownership enforcement
- Scheduled jobs for auto-start and auto-complete of auctions
- Async email notifications (Gmail SMTP)
- Stateless JWT authentication with role-based access control

## Status

Core end-to-end functionality is confirmed working: live bidding, Redis Lua atomicity, and email notifications.

**Currently in progress:**
- JWT Authentication Filter hardening
- Redis Lua configuration layer for the verification script

## Design Structure

### Backend (Spring Boot — layered architecture)
```
backend/
├── config/            # Security, JWT, Redis, WebSocket/STOMP, CORS config
├── controller/         # REST endpoints (Auction, Bid, Auth, Admin)
├── dto/                 # Request/response payloads
├── entity/             # PersonDetails, Bidder, Auctioneer, ItemDetailsEntity,
│                        # AuctionDetailsEntity, AuctionRegistrationEntity, BidHistoryEntity
├── repository/          # JPA repositories per entity/role
├── security/            # JwtAuthFilter, CustomUserDetailsService, BCrypt setup
├── service/              # Business logic (auction lifecycle, bid validation, notifications)
│   ├── redis/            # Lua script execution, Pub/Sub bid broadcast
│   └── scheduler/        # Auto-start/auto-complete jobs, write-behind drain
├── websocket/            # STOMP handlers, real-time bid channels
├── exception/            # Global exception handling
└── util/                 # Shared helpers (BigDecimal handling, mappers)
```

**Data flow for a bid:**
```
Client → WebSocket/STOMP → Controller → Redis Lua (atomic check + update)
       → Pub/Sub broadcast to subscribers → Scheduled drain job → PostgreSQL (BidHistoryEntity)
```

### Frontend (React + Vite)
```
frontend/
├── src/
│   ├── context/          # AuthContext
│   ├── hooks/             # useStomp, useCountdown
│   ├── pages/             # Auction list, auction detail/bidding, auth, admin
│   ├── components/        # Shared UI (bid form, countdown, auction card, etc.)
│   ├── services/           # API client, WebSocket client
│   └── styles/             # Tailwind config/theme
├── index.html
└── vite.config.js
```

> This layout follows standard Spring Boot layered conventions and typical React/Vite structure based on the components you've described — adjust package/folder names to match what's actually in your repo if it differs.

## Getting Started

> Fill in setup steps specific to your environment (env vars for Neon/Redis/Gmail SMTP credentials, running the Spring Boot backend, and starting the Vite frontend dev server).

```bash
# Backend
./mvnw spring-boot:run

# Frontend
npm install
npm run dev
```

## Notes

- Repository was renamed from `aution` to `auction`; backend code lives in a subfolder within the repo.
- Rotate any credentials that were shared in plaintext during debugging sessions.


