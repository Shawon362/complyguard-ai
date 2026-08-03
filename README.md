# 🛡️ ComplyGuard AI — Complete Technical Documentation & Deployment Guide

> **App Title:** ComplyGuard AI (EU AI Act & GDPR Compliance Suite for Shopify)  
> **Target Standard:** EU AI Act Article 50 Transparency Directives, GDPR & E-Privacy Compliance  
> **Architecture:** Modern Shopify App (Remix Framework, React, Shopify App Bridge, Prisma ORM, Theme App Extensions & Checkout UI Extensions)

---

## 📐 Table of Contents
1. [Executive Summary & Core Objective](#1-executive-summary--core-objective)
2. [Complete Tech Stack Breakdown](#2-complete-tech-stack-breakdown)
3. [End-to-End System Architecture & Data Flow](#3-end-to-end-system-architecture--data-flow)
4. [Step-by-Step Execution Lifecycle](#4-step-by-step-execution-lifecycle)
5. [In-Depth Feature Analysis (A to Z)](#5-in-depth-feature-analysis-a-to-z)
6. [Prisma Database Schema & Models](#6-prisma-database-schema--models)
7. [App Routes & API Endpoints Reference](#7-app-routes--api-endpoints-reference)
8. [Core Modules & Utility Functions Deep-Dive](#8-core-modules--utility-functions-deep-dive)
9. [Shopify Extensions (Theme App & Checkout UI)](#9-shopify-extensions-theme-app--checkout-ui)
10. [Secret Super-Admin Portal (`/admin`)](#10-secret-super-admin-portal-admin)
11. [Local Development Guide](#11-local-development-guide)
12. [CloudPanel Production Deployment & Updates](#12-cloudpanel-production-deployment--updates)
13. [Deploying Shopify Extensions (`shopify app deploy`)](#13-deploying-shopify-extensions-shopify-app-deploy)

---

## 📌 1. Executive Summary & Core Objective

### What is this App?
**ComplyGuard AI** is a full-stack Shopify application built to help e-commerce merchants analyze, monitor, and enforce compliance with the **European Union Artificial Intelligence Act (EU AI Act Article 50)** as well as broader GDPR consent regulations.

Under Article 50 of the EU AI Act, any e-commerce merchant selling to consumers in the European Union that utilizes Artificial Intelligence (AI) — such as AI-generated product images, AI chatbots, automated description generators, or recommendation engines — is legally mandated to **explicitly declare and label** synthetic media and AI interactions transparently.

### Core Value Proposition:
1. **Automated Store Auditing & AI Detection:** Scans product images, descriptions, installed third-party Shopify AI apps, and legal store policies.
2. **One-Click Auto-Fixing (AI & Rule-Based):** Updates product image Alt Texts with `[AI-Generated]` labels, updates legal Privacy Policies/Terms, and marks processed image caches.
3. **Frontend Compliance Display Widgets:** Theme App Extensions and Checkout Extensions that display floating AI transparency badges, cookie consent banners, and checkout disclosures to visitors.
4. **Audit Reports & Certification:** Generates official PDF compliance certificates and keeps auditable consent logs to protect store owners against regulatory fines.

---

## 🛠 2. Complete Tech Stack Breakdown

### 1. Frontend & Presentation Layer
* **Framework:** Remix v2 (React Router, Server-Side Rendering with `loader` and `action` functions).
* **UI Components:** Shopify Polaris (`@shopify/polaris`) — Official Shopify Admin UI design system.
* **App Bridge Integration:** `@shopify/app-bridge-react` for native modals, toast notifications, and embedded admin navigation.
* **Icons & Styling:** Polaris Icons, Custom CSS Modules (`app/routes/_index/styles.module.css`, `public/polaris.css`).

### 2. Backend Runtime & APIs
* **Runtime:** Node.js (ES Modules).
* **Framework Integration:** `@shopify/shopify-app-remix` (handles OAuth 2.0, session storage, webhook authentication, and GraphQL Admin API client).
* **GraphQL & REST Admin APIs:** For querying shop products, theme Liquid assets, webhooks, and billing subscriptions.
* **AI Analysis Engines:** Multi-provider API architecture integrating **OpenAI, Anthropic Claude, Google Gemini, Oxyy API, and Flux** with dynamic fallback & priority scheduling.

### 3. Database & ORM
* **ORM:** Prisma v5 (`prisma/schema.prisma`).
* **Database Drivers:** SQLite for local/testing environments (`dev.sqlite`), PostgreSQL ready for production environments.

### 4. Extensions Framework
* **Theme App Extension (Liquid & Vanilla JS):**
  * `ai-badge-embed.liquid`: Product page embedded badge.
  * `ai-badge.liquid`: Store-wide AI disclosure badge.
  * `cookie-banner.liquid`: GDPR & EU AI Act cookie consent banner.
* **Checkout UI Extension (`checkout-ui`):** Written in React using `@shopify/ui-extensions-react/checkout`.

---

## 🏗 3. End-to-End System Architecture & Data Flow

```
+-----------------------------------------------------------------------------------+
|                                 SHOPIFY STOREFRONT                                |
|  [Cookie Banner]  -->  [Consent API (/api/consent)]  -->  [Prisma: ConsentLog]    |
|  [Product Badge]  -->  [Liquid Theme Extension]                                  |
|  [Checkout Disclosure]  -->  [Checkout UI Extension]                           |
+-----------------------------------------------------------------------------------+
                                          ^
                                          |
+-----------------------------------------------------------------------------------+
|                                SHOPIFY ADMIN APP                                  |
|                                                                                   |
|  1. Merchant Clicks "Start Compliance Scan"                                        |
|  2. app/routes/app._index.jsx triggers Background Worker (scan-runner.server.js)  |
|  3. fetchProducts.js fetches products/images via Shopify GraphQL API              |
|  4. scanAIApps.js checks installed apps against AI database                        |
|  5. ai-detector.server.js sends images to AI API (Gemini/OpenAI/Oxyy)            |
|  6. Check Prisma: AnalyzedImage cache -> Save API cost if hash exists              |
|  7. checkPolicies.js evaluates Privacy Policy & Terms of Service                  |
|  8. calculateScore.js computes Grade (A-F) & Score (0-100)                        |
|  9. Issues written to Prisma: Scan & Issue models                                 |
| 10. Merchant triggers Auto-Fix All -> fixAltText, fixPrivacyPolicy executed       |
| 11. PDF Certificate generated via generatePDF.js & PDFReportTemplate.jsx          |
+-----------------------------------------------------------------------------------+
                                          ^
                                          |
+-----------------------------------------------------------------------------------+
|                             INTERNAL ADMIN PORTAL (/admin)                         |
|  - Manages API Keys & Priority Fallbacks (apiKeyManager.server.js)                |
|  - Tracks Global Merchants, Revenue, Usage, and Rate Limits                       |
+-----------------------------------------------------------------------------------+
```

---

## 🔄 4. Step-by-Step Execution Lifecycle

### Step 1: Installation & OAuth
1. Merchant installs ComplyGuard AI via Shopify App Store.
2. `app/shopify.server.js` handles OAuth 2.0 handshake.
3. Access tokens stored in `Session` table; shop profile initialized in `Merchant` table.

### Step 2: Store Onboarding
1. Merchant lands on `/app` (`app/routes/app._index.jsx`).
2. `OnboardingFlow.jsx` detects new store and guides merchant through baseline setup and initial scan.

### Step 3: Audit Execution Engine (`app/scan-runner.server.js`)
1. **Product Scan (`fetchProducts.js`):** Fetches store catalog via GraphQL Admin API.
2. **AI Image Analysis (`scanAIApps.js` & `ai-detector.server.js`):** Checks `AnalyzedImage` cache table; uncached images are sent to AI API provider.
3. **App Ecosystem Audit (`ai-apps-database.js`):** Identifies installed third-party AI apps.
4. **Policy Inspection (`checkPolicies.js`):** Scans store policies for mandatory transparency disclosures.
5. **Scoring (`calculateScore.js` & `buildIssues.js`):** Generates Grade (`A` to `F`), numerical score, and structured issue tickets.

### Step 4: One-Click Auto-Fix Execution (`app/routes/app.auto-fix-all.jsx`)
1. **Alt Text Fix (`fixAltText.js`):** Appends `[AI-Generated]` to product image alt tags via GraphQL.
2. **Policy Fix (`fixPrivacyPolicy.js`, `fixTerms.js`):** Auto-injects legal disclosure clauses into store policies.
3. **Cache Update (`fixAIImage.js`):** Updates image status in `AnalyzedImage` table.
4. **Score Recalculation (`recalculateScore.js`):** Recomputes overall store score upon issue resolution.

---

## ✨ 5. In-Depth Feature Analysis (A to Z)

* **A — AI App Scanner:** Detects third-party AI apps running on the store by matching them against a curated database (`ai-apps-database.js`).
* **B — Banner Customizer (`app.banner-settings.jsx`):** Customizes colors, text, position, and compliance modes for storefront cookie banners.
* **C — Checkout Compliance UI (`checkout-ui`):** Injects mandatory customer disclosures into the Shopify Checkout flow.
* **D — Deadline Countdown Banner (`DeadlineCountdownCard.jsx`):** Displays countdown indicators for legal compliance enforcement dates.
* **E — Escalation & Severity Tracking:** Issues categorized into `Critical`, `High`, `Medium`, and `Low` risk levels.
* **F — Free Auto-Fix Allocation:** Automatically manages free auto-fix limits based on subscription tier (`freeAutoFixesUsed`).
* **G — Grade Calculation (`ComplianceGradeCard.jsx`):** Computes store compliance grade (`A` to `F`).
* **H — Historical Audit Trail (`app.history.jsx`):** Keeps full logs of all previous scans, resolved issues, and score progression.
* **I — Image Detection Cache (`AnalyzedImage`):** Caches image analysis results to prevent duplicate API costs.
* **M — Multi-Tier Billing (`app.pricing.jsx`, `planLimits.js`):** Supports `Free`, `Starter`, `Pro`, and `Enterprise` plans integrated with Shopify Recurring Charges API.
* **P — PDF Audit Certificates (`generatePDF.js`, `PDFReportTemplate.jsx`):** Generates official downloadable PDF compliance proof for EU regulators.
* **S — Secret Super-Admin Portal (`/admin`):** Internal management dashboard for API keys, merchant tracking, usage analytics, and revenue reports.

---

## 🗄 6. Prisma Database Schema & Models

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:dev.sqlite"
}

generator client {
  provider = "prisma-client-js"
}

// 1. Session Storage
model Session {
  id                  String    @id
  shop                String
  state               String
  isOnline            Boolean   @default(false)
  scope               String?
  expires             DateTime?
  accessToken         String
  userId              BigInt?
  firstName           String?
  lastName            String?
  email               String?
  accountOwner        Boolean   @default(false)
  locale              String?
  collaborator        Boolean?  @default(false)
  emailVerified       Boolean?  @default(false)
  refreshToken        String?
  refreshTokenExpires DateTime?
}

// 2. Scan Tracking
model Scan {
  id                String    @id @default(cuid())
  shop              String
  status            String    @default("running") // running, completed, failed
  grade             String?   // A, B, C, D, F
  score             Int?      // 0 - 100
  totalProducts     Int       @default(0)
  totalImages       Int       @default(0)
  totalPages        Int       @default(0)

  criticalCount     Int       @default(0)
  highCount         Int       @default(0)
  mediumCount       Int       @default(0)
  lowCount          Int       @default(0)

  currentPhase      String    @default("queued")
  progress          Int       @default(0)
  imagesProcessed   Int       @default(0)
  imagesTotal       Int       @default(0)
  errorMessage      String?
  freeAutoFixesUsed Int       @default(0)

  createdAt         DateTime  @default(now())
  completedAt       DateTime?
  issues            Issue[]
}

// 3. Identified Compliance Issues
model Issue {
  id               String    @id @default(cuid())
  shop             String
  category         String    // ai_image, ai_text, policy, cookie
  article          String    // e.g., "EU AI Act Article 50"
  severity         String    // critical, high, medium, low
  title            String
  description      String
  evidence         String
  fixAvailable     Boolean   @default(false)
  fixAction        String?
  suggestedFix     String?
  status           String    @default("open") // open, fixed, acknowledged
  fixedAt          DateTime?
  fixDetails       String?
  acknowledgedAt   DateTime?
  acknowledgedNote String?
  createdAt        DateTime  @default(now())
  scanId           String
  scan             Scan      @relation(fields: [scanId], references: [id], onDelete: Cascade)

  @@index([scanId])
  @@index([shop])
}

// 4. Merchant Store Profile & Plan
model Merchant {
  id              String    @id @default(cuid())
  shop            String    @unique
  onboardingDone  Boolean   @default(false)
  onboardingStep  Int       @default(0)
  storeName       String?
  storeUrl        String?
  plan            String    @default("free") // free, starter, pro, enterprise
  planStartDate   DateTime? @default(now())
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// 5. Visitor Consent Audit Log
model ConsentLog {
  id           String   @id @default(cuid())
  shop         String
  necessary    Boolean  @default(true)
  analytics    Boolean  @default(false)
  marketing    Boolean  @default(false)
  consentType  String   @default("custom")
  country      String?
  userAgent    String?
  createdAt    DateTime @default(now())

  @@index([shop])
}

// 6. AI Image Cache
model AnalyzedImage {
  id            String   @id @default(cuid())
  shop          String
  imageUrl      String
  isAI          Boolean
  confidence    Float
  reasoning     String?
  hasPeople     Boolean  @default(false)
  hasText       Boolean  @default(false)
  hasAISigns    Boolean  @default(false)
  analyzedAt    DateTime @default(now())
  lastSeenAt    DateTime @default(now())

  @@unique([shop, imageUrl])
  @@index([shop])
  @@index([analyzedAt])
}

// 7. Internal Admin Users
model AdminUser {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String
  role          String    @default("admin")
  lastLogin     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// 8. API Quota & Usage Analytics
model ApiUsage {
  id              String   @id @default(cuid())
  shop            String
  date            DateTime @default(now())
  provider        String   @default("gemini")
  callsCount      Int      @default(0)
  imagesProcessed Int      @default(0)
  cacheHits       Int      @default(0)
  estimatedCost   Float    @default(0)
  createdAt       DateTime @default(now())

  @@index([shop, date])
  @@index([date])
}

// 9. Multi-Provider API Keys
model ApiKey {
  id               String    @id @default(cuid())
  name             String
  provider         String    // openai, claude, gemini, oxyy
  apiKey           String   
  baseUrl          String?
  modelName        String 
  priority         Int       @default(100) 
  isActive         Boolean   @default(true)
  totalCalls       Int       @default(0)
  totalErrors      Int       @default(0)
  lastUsedAt       DateTime?
  lastErrorAt      DateTime?
  lastErrorMessage String?
  lastTestedAt     DateTime?
  lastTestSuccess  Boolean?
  createdBy        String 
  notes            String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@index([provider, priority])
  @@index([isActive])
}

// 10. Rate Limits & Overrides
model RateLimitOverride {
  id              String   @id @default(cuid())
  shop            String   @unique
  dailyApiLimit   Int? 
  monthlyApiLimit Int?
  notes           String?
  setByAdmin      String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model AdminAuditLog {
  id          String   @id @default(cuid())
  adminEmail  String
  action      String 
  targetShop  String?
  details     String?
  ipAddress   String?
  createdAt   DateTime @default(now())

  @@index([createdAt])
  @@index([adminEmail])
}
```

---

## 🌐 7. App Routes & API Endpoints Reference

### Merchant Admin Routes (`app/routes/app.*`)
* `app._index.jsx`: Main dashboard featuring score, onboarding, scan trigger, and issue summary.
* `app.auto-fix-all.jsx`: Action route handling one-click auto-fixing.
* `app.banner-settings.jsx`: Customizer UI for storefront cookie banners.
* `app.cookie-scanner.jsx`: Scanner interface for tracking scripts and cookies.
* `app.history.jsx`: Historical compliance scan logs and score progression.
* `app.issue-acknowledge.jsx`: Route for manually acknowledging warnings.
* `app.pricing.jsx`: Subscription plans integrated with Shopify Billing API.
* `app.scan-status.jsx`: Real-time polling API endpoint returning current scan progress.
* `app.update-issue.jsx`: Applies single-issue fixes.
* `app.consent-records.jsx`: Displays visitor consent records.

### Public & Webhook Routes (`app/routes/*`)
* `api.consent.jsx`: Public API endpoint called by storefront cookie banner to log visitor consent.
* `privacy.jsx` & `terms.jsx`: App privacy policy and terms of service pages.
* `webhooks.app.uninstalled.jsx`: Handles app uninstallation cleanup.
* `webhooks.app_subscriptions_update.jsx`: Syncs subscription plan changes.
* `webhooks.customers.redact.jsx`, `webhooks.customers.data_request.jsx`, `webhooks.shop.redact.jsx`: Mandatory GDPR webhook handlers.

---

## 🧰 8. Core Modules & Utility Functions Deep-Dive

### Scanning Utilities (`app/utils/scan/*`)
1. **`index.js`:** Main orchestrator function for scanning pipeline.
2. **`fetchProducts.js`:** Retrieves products, descriptions, and media URLs via GraphQL.
3. **`scanAIApps.js`:** Matches installed apps against `ai-apps-database.js`.
4. **`checkPolicies.js`:** Inspects store policies for mandatory legal disclosures.
5. **`calculateScore.js` & `buildIssues.js`:** Computes score/grade ratings and generates issue tickets.

### Auto-Fix Utilities (`app/utils/autoFix/*`)
1. **`fixAltText.js`:** Updates image Alt tags via GraphQL Admin API.
2. **`fixPrivacyPolicy.js` & `fixTerms.js`:** Appends legal AI disclosure clauses to store policies.
3. **`fixAIImage.js`:** Updates image cache state in database.
4. **`recalculateScore.js`:** Recomputes compliance score in real time after issue resolution.

---

## 🎨 9. Shopify Extensions (Theme App & Checkout UI)

### 1. Theme App Extension (`extensions/compliance-badge/`)
* `blocks/ai-badge-embed.liquid`: Embeds an inline AI disclosure badge on product pages.
* `blocks/ai-badge.liquid`: Floating storewide compliance badge.
* `blocks/cookie-banner.liquid`: Storefront banner capturing visitor consents and transmitting telemetry to `/api/consent`.

### 2. Checkout UI Extension (`extensions/checkout-ui/`)
* Injects mandatory EU AI Act transparency disclosures directly into the checkout pipeline prior to order placement.

---

## 🔐 10. Secret Super-Admin Portal (`/admin`)

Located under `/admin`:
* **/admin/login & /admin/logout:** Session-based authentication (`AdminUser` model).
* **/admin/dashboard:** Global metrics across all installed merchant stores.
* **/admin/api-keys:** Multi-provider API key management (OpenAI, Gemini, Claude, Oxyy) with failover scheduling.
* **/admin/merchants:** View active merchants, manually override plan limits, or reset stuck scans.
* **/admin/revenue & /admin/usage:** Billing analytics, cache hit rates, and API consumption tracking.

---

## 💻 11. Local Development Guide

### Prerequisites:
- Node.js v18.0.0+
- Shopify CLI (`npm install -g @shopify/cli`)
- Shopify Partner Account & Development Store

### Steps:
1. **Create `.env` file:**
   ```env
   SHOPIFY_API_KEY="your_shopify_app_api_key"
   SHOPIFY_API_SECRET="your_shopify_app_api_secret"
   SCOPES="read_products,write_products,read_themes,write_themes,read_script_tags,write_script_tags"
   SHOPIFY_APP_URL="https://your-ngrok-or-cloud-url.io"
   DATABASE_URL="file:./dev.sqlite"
   ADMIN_JWT_SECRET="your-super-secret-admin-jwt-key"
   ```

2. **Install & Setup Database:**
   ```bash
   npm install
   npx prisma migrate dev
   node scripts/create-admin.js
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

---

## 🚀 12. CloudPanel Production Deployment & Updates

When hosting ComplyGuard AI on **CloudPanel** (Node.js Site context):

### Step-by-Step Code Update Sequence on CloudPanel

```bash
# 1. SSH into CloudPanel server and navigate to app root
cd /home/cloudpanel/htdocs/app.complyguard.ai

# 2. Pull latest code from Git
git pull origin main

# 3. Install dependencies
npm install --production=false

# 4. Run Prisma migrations
npx prisma migrate deploy

# 5. Re-generate Prisma client
npx prisma generate

# 6. Build Remix production bundle
npm run build

# 7. Restart application process via PM2
pm2 restart complyguard-ai
```

---

## 📦 13. Deploying Shopify Extensions (`shopify app deploy`)

Updating Remix server code via `git pull` on CloudPanel updates the backend, but **Theme App Extensions** (`extensions/compliance-badge`) and **Checkout UI Extensions** (`extensions/checkout-ui`) must be pushed directly to Shopify's CDN via Shopify CLI.

### How to Deploy Extension Updates:

1. On your local development machine, make required edits to Liquid or Checkout UI code.
2. Authenticate CLI if needed:
   ```bash
   npx shopify auth login
   ```
3. Run deploy command:
   ```bash
   npx shopify app deploy
   ```
4. Confirm release prompt. Shopify will build, version, and release the new extension bundle across all installed merchant stores automatically.

---
*Documentation maintained for **ComplyGuard AI**.*
