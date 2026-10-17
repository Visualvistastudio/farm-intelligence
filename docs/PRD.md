# FARM INTELLIGENCE
## Master Product Requirements Document (PRD) & Operational Specification

**Product category:** AI-assisted agronomy, precision agriculture, geospatial intelligence, and farm decision support  
**Initial market:** Nigeria  
**Expansion strategy:** International, using country-specific agronomy and data configurations  
**Release:** MVP v1  
**Primary experience:** Mobile-first responsive web application  
**Native mobile applications:** Future phase, not part of MVP  
**Development environment:** Google Antigravity IDE/CLI and Google AI development tools  
**Document audience:** AI coding agents, frontend and backend engineers, geospatial engineers, agronomists, QA engineers, and product designers

---

# PART A — PRODUCT DEFINITION

## 1. Executive summary

Build a complete, production-oriented web platform that enables farmers to make better crop-production decisions using their farm location, field boundaries, available soil information, climate data, agronomic research, and geospatial analysis.

A farmer should be able to create an account, register a farm, identify its boundaries, choose a crop or request recommendations, and receive an evidence-backed assessment containing:

- Crop suitability.
- A map of the farm.
- Suitability zones where the underlying data supports them.
- Recommended planting periods.
- Crop-specific cultivation guidance.
- Soil and water constraints.
- Estimated yield ranges where validated models are available.
- Confidence and evidence-quality indicators.
- A practical crop-management calendar.
- A downloadable farm assessment report.

The product must serve farmers who are not GIS specialists. Technical complexity belongs in the backend; the interface must make the results understandable and actionable.

### Product positioning
An intelligent agronomy platform that connects agricultural research with field-specific decisions.

### Core product promise
**Understand your land. Choose your crop. Plan your season. Make better farming decisions.**

This is a decision-support product. It does not guarantee a successful harvest, replace laboratory soil analysis, or automatically provide legally or professionally certified agronomic advice.

## 2. Product objectives

### Primary objectives
1. Help farmers determine which crops are appropriate for their fields.
2. Help farmers understand when and how to plant.
3. Convert farm coordinates and field boundaries into useful spatial assessments.
4. Present field suitability visually rather than relying entirely on text.
5. Provide yield estimates only where an appropriate model and sufficient evidence exist.
6. Make trusted agricultural information accessible through a simple mobile interface.
7. Support agronomists and extension agents who serve multiple farmers.
8. Build an extensible technical foundation for additional crops, regions, and countries.

### Business objectives
- Establish a useful product for Nigerian farmers and agricultural service providers.
- Validate willingness to pay before committing to expensive data infrastructure.
- Create a recurring-revenue opportunity through subscriptions and paid assessments.
- Develop a defensible advantage through validated local agronomy, data provenance, spatial processing, and field observations.
- Support future partnerships with agricultural research institutions, cooperatives, input providers, and extension services.

### Non-goals for MVP
The initial release will not attempt to:
- Support every crop in every country.
- Produce laboratory-equivalent soil measurements from coordinates.
- Guarantee crop yields.
- Automate every environmental or agricultural decision.
- Build a satellite constellation or collect proprietary satellite imagery.
- Train a new foundational language model.
- Operate a native Android or iOS application.
- Build an agricultural marketplace, credit product, or farm-input delivery service.
- Diagnose every pest or disease from photographs.
- Generate unsupported fertilizer recommendations.

## 3. Product principles

### 3.1 Evidence before explanation
Every agronomic recommendation must be generated from approved data, rules, or validated models. The AI language model explains results; it does not invent the underlying calculations.

### 3.2 Geographic accuracy
The application must distinguish a location pin, a field boundary, a soil sampling point, a raster cell, and an estimated suitability zone.

### 3.3 Transparent uncertainty
Every major result must communicate what is known, what is estimated, what is missing, and what the farmer should do next.

### 3.4 Practical guidance
Farmers need actionable instructions, not only technical charts and scientific terminology.

### 3.5 Mobile-first usability
The primary user interface must be designed for smartphone screens and intermittent connectivity. Desktop layouts must also be supported for extension agents and commercial farm managers.

### 3.6 Country-specific science
Crop requirements, planting calendars, varieties, units, and management practices must be configurable by country and agroecological context.

### 3.7 No fabricated completeness
A field assessment may be partially complete. The product must be able to return a partial result with clear limitations rather than manufacture a confident-looking answer.

---

# PART B — COMPETITIVE RESEARCH AND REFERENCE PRODUCTS

## 4. Reference product analysis

### 4.1 RiceAdvice / AfricaRice (https://www.africarice.org/innovations/riceadvice)
Learn from: Farm-specific rice management, target-yield recommendations, nutrient timing, onboarding questionnaires.  
Implementation: Build a configurable agronomy engine that considers actual growing conditions without copying proprietary source code.

### 4.2 FAO Crop Calendar (https://cropcalendar.apps.fao.org/)
Learn from: Agroecological zone filtering, planting/harvesting periods, structured agronomic reference data.  
Implementation: Field-aware crop calendar incorporating farmer location and agroecological context.

### 4.3 Nigeria National Farm and Soil Health Scheme (https://nfshcs.agriculture.gov.ng/)
Learn from: Nigerian soil-health data, nutrient mapping, soil sampling workflows.  
Implementation: Data-provider integration layer respecting data licensing and spatial resolution.

### 4.4 Syngenta Cropwise (https://www.cropwise.com/)
Learn from: Connected farm management, field operational tracking, recurring crop plans.  
Implementation: Clean smallholder-friendly farm and field hierarchy without overwhelming complexity.

### 4.5 FAO WaPOR (https://www.fao.org/in-action/remote-sensing-for-water-productivity/wapor-data/)
Learn from: Satellite-derived evapotranspiration, biomass, and water productivity layers.  
Implementation: Resolution-aware spatial processing; never imply coarse layers reveal sub-meter within-field variations.

### 4.6 NASA POWER (https://power.larc.nasa.gov/)
Learn from: Agroclimatology datasets, historical temperature/precipitation time-series.  
Implementation: Historical seasonal calculations; do not present historical averages as short-term daily forecasts.

---

# PRD ADDENDUM: SUPER ADMIN, PLATFORM MANAGEMENT, RBAC AND FINANCIAL OPERATIONS

**Initial Setup Configuration:**
- Initial Super Admin email: `ologunemmanuel2015@gmail.com`
- Preferred payment provider: `Paystack` (test mode initial, with full lifecycle and webhook verification)
- Domain strategy: Use deployment provider domain
- Admin authentication: Email OTP with cryptographically secure random codes
- Bootstrap password: One-time setup credential only (`123456789`), mandatory replacement on first login
- Admin routes: Protected `/admin/*` space
- Public & Farmer routes: `/`, `/app/*`

**RBAC Default Roles:**
1. `Super Admin` (Full platform administration, financial setup, agronomy publishing, RBAC)
2. `Platform Admin` (General operations, user management, assessment monitoring)
3. `Finance Admin` (Payments, transaction review, revenue reporting, authorized refunds)
4. `Agronomy Admin` (Crop catalog, planting calendar, suitability rules, expert review)
5. `Data Admin` (External data sources, sync monitoring, geospatial pipelines)
6. `Customer Support` (User queries, account status review, non-financial assistance)
