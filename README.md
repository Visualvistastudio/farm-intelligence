# Farm Intelligence — AI Agronomy & Spatial Intelligence Platform

[![Build & Test](https://img.shields.io/badge/tests-7%20passed-success)](https://github.com/farm-intelligence)
[![Market](https://img.shields.io/badge/market-Nigeria%20(Initial)-forest)](https://github.com/farm-intelligence)
[![Architecture](https://img.shields.io/badge/stack-FastAPI%20%2B%20Next.js%20%2B%20PostgreSQL-blue)](https://github.com/farm-intelligence)

> **Understand your land. Choose your crop. Plan your season. Make better farming decisions.**

Farm Intelligence is an evidence-grounded, mobile-first agricultural decision-support and spatial intelligence platform. Built initially for the diverse agroecological zones of Nigeria and engineered for modular international expansion, it transforms field boundary coordinates and gridded biophysical observations into actionable crop suitability assessments, 11-stage seasonal management plans, and calibrated yield estimates.

---

## 1. Key Platform Modules & Architecture

### Public Marketing & Conversion
- **Modern Responsive Experience**: Fast, high-converting public pages at `/`, `/how-it-works`, `/features`, `/pricing`, `/terms`, `/privacy`.
- **Transparent Positioning**: Clear decision-support disclaimers without fabricated scientific completeness or fake testimonial seals.

### Farmer Application (`/app`)
- **Interactive Field Boundary Demarcation**: Touch-friendly vector polygon drawer and GPS coordinate validator with real-time acreage calculation (hectares) and Nigerian agroecological zone assignment.
- **Biophysical Suitability Engine**: Multi-factor biophysical scoring (Climate 35%, Soil 35%, Water 20%, Terrain 10%) evaluating crops against NASA POWER 30-year climatology, ISRIC SoilGrids, and Nigeria National Farm and Soil Health Scheme baselines.
- **11-Stage Cultivation Calendar**: Dynamic scheduling covering pre-planting soil testing, land tillage, certified seed sourcing, split nitrogen top-dressing, and hermetic PICS bag post-harvest storage.
- **Calibrated Yield Ranges**: Lower and upper production bounds based on validated AfricaRice (FARO varieties) and IITA (SAMMAZ varieties) models, with transparent withholding for uncalibrated crops.

### Dedicated Super Admin Console (`/admin`)
- **Strict Role-Based Access Control (RBAC)**: 6 default roles (`super_admin`, `platform_admin`, `finance_admin`, `agronomy_admin`, `data_admin`, `customer_support`) plus custom role builder supporting 20+ granular permissions.
- **Operational Metrics Dashboard**: Real-time database calculations for registered users, active farms, assessment pipelines, gross collections, net revenue, and provider health.
- **Paystack Payment & Settlement Hub**: Local Nigerian subscription management (Free, Farmer Plus ₦3,000/mo, Professional ₦15,000/mo, Organization custom), test/live gateway toggle, masked credentials, and webhook HMAC-SHA512 verification.
- **Audit Logging**: Immutable security audit trail recording all administrative logins, permission changes, refunds, and data sync operations.

---

## 2. Competitive & Scientific References

| Live Reference Product | Domain | What Farm Intelligence Implements |
|---|---|---|
| [AfricaRice / RiceAdvice](https://www.africarice.org/innovations/riceadvice) | Crop Management & Nutrients | Target yield response, certified FARO variety parameters, and split urea application timing. |
| [FAO Crop Calendar](https://cropcalendar.apps.fao.org/) | Agroecological Planting Windows | Zonal sowing/harvesting windows across Sahel, Sudan, Guinea Savannah, and Humid Forest zones. |
| [Nigeria Soil Health Scheme](https://nfshcs.agriculture.gov.ng/) | Soil Nutrients & Sampling | Topsoil pH, texture, and organic matter calibration across 36 states and FCT. |
| [NASA POWER](https://power.larc.nasa.gov/) | Agroclimatology | 30-year historical daily solar radiation, rainfall distribution, and thermal baseline time-series. |
| [FAO WaPOR](https://www.fao.org/in-action/remote-sensing-for-water-productivity/wapor-data/) | Remote Sensing | Resolution safeguards and water productivity guidelines for rainfed vs. irrigated systems. |

---

## 3. Initial Super Admin Bootstrap Workflow

In accordance with PRD Addendum Section 3 & 4:
1. **Initial Admin Account**: Configured via environment variable `INITIAL_SUPER_ADMIN_EMAIL=ologunemmanuel2015@gmail.com`.
2. **Temporary Bootstrap Password**: Default `123456789` is hashed with PBKDF2 with salt. Stored with `must_change_password = true`.
3. **Mandatory Rotation**: Upon first successful login via `/admin/login`, the platform enforces an email OTP verification challenge followed by mandatory creation of a new permanent password.
4. **Permanent Invalidation**: The temporary credential cannot be reused.

---

## 4. Local Development Quickstart

### Prerequisites
- Node.js (v18+) & npm
- Python (v3.10+)

### Backend Setup (FastAPI)
```bash
# 1. Navigate to backend
cd backend

# 2. Activate virtual environment
# Windows:
..\venv\Scripts\activate
# Linux/macOS:
source ../venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run automated test suite
python -m pytest app/tests/test_backend.py -v

# 5. Start API server on http://127.0.0.1:8000
python run.py
```

### Frontend Setup (Next.js)
```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Run production build check
npm run build

# 4. Start Next.js development server on http://localhost:3000
npm run dev
```

---

## 5. Environment Configuration (`.env`)

```ini
# Backend Core Settings
PROJECT_NAME="Farm Intelligence"
SECRET_KEY="replace-with-a-cryptographically-secure-random-key"
DATABASE_URL="sqlite:///./farm_intelligence.db"

# Super Admin Bootstrap Configuration
INITIAL_SUPER_ADMIN_EMAIL="ologunemmanuel2015@gmail.com"
INITIAL_SUPER_ADMIN_TEMP_PASSWORD="replace-temporary-credential-in-production"
INITIAL_SUPER_ADMIN_NAME="Platform Owner"
INITIAL_SUPER_ADMIN_ENABLED=true

# Paystack Gateway (Test Mode default)
PAYSTACK_SECRET_KEY="sk_test_..."
PAYSTACK_PUBLIC_KEY="pk_test_..."
PAYSTACK_WEBHOOK_SECRET="whsec_..."
PAYSTACK_TEST_MODE=true

# SMTP Mail Server for OTP Dispatch
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM_EMAIL="noreply@farmintelligence.africa"
```

---

## 6. Cloud & Production Deployment Guide

### Deploying Frontend to Vercel (vercel.app)
1. Go to **[vercel.com/new](https://vercel.com/new)** and connect your GitHub account.
2. Select your repository: **`Visualvistastudio/farm-intelligence`**.
3. **Configure Project Settings**:
   - **Framework Preset**: Next.js (automatically detected).
   - **Root Directory**: Click **Edit** and choose `frontend`.
   - **Build Command**: `npm run build` (default).
   - **Output Directory**: `.next` (default).
4. **Environment Variables**:
   - Add `NEXT_PUBLIC_API_URL` set to your live backend domain (e.g. `https://your-api.onrender.com`).
5. Click **Deploy**. Vercel will build and assign you a live `https://farm-intelligence-xxx.vercel.app` domain.

### Deploying FastAPI Backend (Render / Railway / Fly.io)
Because FastAPI utilizes persistent database storage (SQLite / PostgreSQL) and long-running background tasks, deploy the `backend/` folder to a persistent host:
- **Render.com**: Create a **Web Service**, select `backend` as the Root Directory, `pip install -r requirements.txt` as Build Command, and `uvicorn app.main:app --host 0.0.0.0 --port $PORT` as Start Command.
- **Railway.app**: New Project -> Deploy from GitHub repo -> select `backend` directory.

---

## 7. License & Scientific Attribution
- Developed for Nigerian agricultural transformation and global scalability.
- Integrates open agroclimatic data from NASA POWER and FAO Crop Calendar.

