from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Tuple

class CalendarService:
    """
    Planting window calculation and 11-stage cultivation plan generator
    based on FAO Crop Calendar and AfricaRice crop management guidelines.
    """

    # Typical planting window months (start_month, end_month) by zone in Nigeria
    PLANTING_WINDOWS = {
        "rice": {
            "Sahel Savannah": (6, 7),               # June - July (Irrigated or early rain)
            "Sudan Savannah": (6, 7),               # June - July
            "Northern Guinea Savannah": (5, 6),     # May - June
            "Southern Guinea Savannah": (5, 7),     # May - July
            "Derived Savannah": (4, 7),             # April - July
            "Humid Forest": (3, 8),                 # March - August (Bimodal rainy season)
            "Mangrove Swamp / Coastal": (3, 9)
        },
        "maize": {
            "Sahel Savannah": (6, 7),
            "Sudan Savannah": (6, 7),
            "Northern Guinea Savannah": (5, 6),
            "Southern Guinea Savannah": (4, 6),
            "Derived Savannah": (3, 6),             # Early maize March-April; late maize August
            "Humid Forest": (3, 5),
            "Mangrove Swamp / Coastal": (3, 5)
        },
        "cassava": {
            "Southern Guinea Savannah": (4, 9),
            "Derived Savannah": (3, 10),
            "Humid Forest": (3, 11),
            "Mangrove Swamp / Coastal": (3, 11)
        },
        "sorghum": {
            "Sahel Savannah": (6, 7),
            "Sudan Savannah": (5, 6),
            "Northern Guinea Savannah": (5, 6)
        },
        "soybean": {
            "Northern Guinea Savannah": (6, 7),
            "Southern Guinea Savannah": (6, 7)
        }
    }

    @classmethod
    def get_planting_window(cls, crop_code: str, zone: str, target_year: Optional[int] = None) -> Tuple[datetime, datetime, str]:
        """
        Determine optimal planting window start and end dates based on zone.
        """
        if not target_year:
            target_year = datetime.now(timezone.utc).year

        crop_windows = cls.PLANTING_WINDOWS.get(crop_code, {})
        start_m, end_m = crop_windows.get(zone, (5, 7))  # Default May - July

        start_date = datetime(target_year, start_m, 1, tzinfo=timezone.utc)
        # End date at end of month
        if end_m in (4, 6, 9, 11):
            end_day = 30
        elif end_m == 2:
            end_day = 28
        else:
            end_day = 31
        end_date = datetime(target_year, end_m, end_day, tzinfo=timezone.utc)

        guidance = f"Optimal rainfed planting window for {crop_code.capitalize()} in {zone} is between {start_date.strftime('%B')} and {end_date.strftime('%B')}. Wait for soil moisture accumulation (minimum 25-30mm rainfall event)."
        return start_date, end_date, guidance

    @classmethod
    def generate_cultivation_plan(cls, crop_code: str, planting_date: datetime, variety_name: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Generate actionable 11-stage cultivation plan (PRD Section 22)
        with specific timeline relative to chosen planting date.
        """
        plan = []

        # Stage 1: Pre-planting preparation (-21 to -14 days)
        plan.append({
            "stage_number": 1,
            "stage_name": "Pre-Planting Preparation",
            "title": "Soil Sampling & Field Demarcation",
            "description": "Clear stubble, conduct perimeter checks, inspect drainage contours, and collect composite topsoil samples (0-20cm) if not yet tested.",
            "start_date": planting_date - timedelta(days=21),
            "end_date": planting_date - timedelta(days=14),
            "evidence_source": "FAO Good Agricultural Practices (GAP)"
        })

        # Stage 2: Land Preparation (-14 to -2 days)
        plan.append({
            "stage_number": 2,
            "stage_name": "Land Preparation & Tillage",
            "title": "Plowing, Harrowing & Ridge/Bed Formation",
            "description": "Plow to 15-20cm depth to break soil compaction. Form ridges (75cm spacing for maize/sorghum) or level bunded basins for lowland rice to facilitate water retention.",
            "start_date": planting_date - timedelta(days=14),
            "end_date": planting_date - timedelta(days=2),
            "evidence_source": "AfricaRice / IITA Land Preparation Protocol"
        })

        # Stage 3: Seed / Variety Selection (-7 to 0 days)
        variety_str = variety_name or "certified high-yielding variety adapted to your agroecology"
        plan.append({
            "stage_number": 3,
            "stage_name": "Seed & Variety Selection",
            "title": "Seed Viability Testing & Treatment",
            "description": f"Source certified seeds of {variety_str}. Conduct floatation germination test (minimum 85% germination rate). Dress seed with approved bio-protectant or fungicide.",
            "start_date": planting_date - timedelta(days=7),
            "end_date": planting_date,
            "evidence_source": "National Agricultural Seeds Council (NASC) Standards"
        })

        # Stage 4: Planting (Day 0 to +3 days)
        plan.append({
            "stage_number": 4,
            "stage_name": "Planting & Sowing",
            "title": "Sowing at Recommended Spacing & Depth",
            "description": "Plant into moist soil. For maize: 75cm between rows, 25cm within row (1 seed/hole at 3-5cm depth). For rice: direct seeding at 20cm x 20cm or transplant 21-day old seedlings.",
            "start_date": planting_date,
            "end_date": planting_date + timedelta(days=3),
            "evidence_source": "AfricaRice / IITA Field Guide"
        })

        # Stage 5: Early Crop Establishment (+7 to +14 days)
        plan.append({
            "stage_number": 5,
            "stage_name": "Early Crop Establishment",
            "title": "Emergence Scouting & Supplying/Thinning",
            "description": "Inspect seedling emergence across all field sectors. Replant missing stands (gap filling) within 10 days of sowing to preserve uniform stand density.",
            "start_date": planting_date + timedelta(days=7),
            "end_date": planting_date + timedelta(days=14),
            "evidence_source": "RiceAdvice Core Protocols"
        })

        # Stage 6: Nutrient Management (+14 to +45 days)
        plan.append({
            "stage_number": 6,
            "stage_name": "Nutrient Management",
            "title": "Basal & Top-Dressing Fertilizer Application",
            "description": "Apply basal NPK (e.g. 15-15-15 or 20-10-10) placed 5cm away from plant base and cover with soil. Top-dress with Urea at active tillering / knee-high stage (4-6 weeks after emergence). Avoid broadcast on dry soil.",
            "start_date": planting_date + timedelta(days=14),
            "end_date": planting_date + timedelta(days=45),
            "evidence_source": "AfricaRice Nutrient Manager / Federal Ministry Soil Health"
        })

        # Stage 7: Weed Management (+14 to +35 days)
        plan.append({
            "stage_number": 7,
            "stage_name": "Weed Management",
            "title": "Critical Weed-Free Window Maintenance",
            "description": "Perform first manual weeding or post-emergence herbicide spray at 14-21 DAE. Keep field clean during the critical competition period (first 30-40 days).",
            "start_date": planting_date + timedelta(days=14),
            "end_date": planting_date + timedelta(days=35),
            "evidence_source": "IITA Weed Science Center"
        })

        # Stage 8: Water Management (+20 to +75 days)
        plan.append({
            "stage_number": 8,
            "stage_name": "Water Management",
            "title": "Moisture Conservation & Drainage Monitoring",
            "description": "Maintain bunds in lowland rice to hold 3-5cm standing water. In upland crops, ensure furrows drain ponded water during heavy downpours to prevent root asphyxiation.",
            "start_date": planting_date + timedelta(days=20),
            "end_date": planting_date + timedelta(days=75),
            "evidence_source": "FAO WaPOR Water Productivity Guidelines"
        })

        # Stage 9: Pest & Disease Monitoring (+25 to +85 days)
        plan.append({
            "stage_number": 9,
            "stage_name": "Pest & Disease Monitoring",
            "title": "Integrated Pest Management (IPM) Scouting",
            "description": "Scout field twice weekly for Fall Armyworm (maize), Stem Borer (rice), or African Cassava Mosaic. Check undersides of leaves and whorls. Deploy pheromone traps or approved biological controls if action thresholds are reached.",
            "start_date": planting_date + timedelta(days=25),
            "end_date": planting_date + timedelta(days=85),
            "evidence_source": "NIHORT & IITA Plant Protection Division"
        })

        # Stage 10: Harvest Preparation (+85 to +105 days)
        plan.append({
            "stage_number": 10,
            "stage_name": "Harvest Preparation",
            "title": "Physiological Maturity Assessment",
            "description": "Examine grain hardening or tuber skin corking. When 80-85% of panicles turn golden brown (rice) or black layer appears at maize kernel base, prepare drying tarpaulins and clean storage.",
            "start_date": planting_date + timedelta(days=85),
            "end_date": planting_date + timedelta(days=105),
            "evidence_source": "NCRI Badeggi Harvest Manual"
        })

        # Stage 11: Harvest & Post-Harvest (+105 to +125 days)
        plan.append({
            "stage_number": 11,
            "stage_name": "Harvest & Post-Harvest Handling",
            "title": "Threshing, Moisture Reduction & Airtight Storage",
            "description": "Harvest on clear dry days. Thresh immediately on clean tarpaulins to avoid sand contamination. Dry grains down to 12-13% moisture before bagging in hermetic PICS bags to prevent weevil damage.",
            "start_date": planting_date + timedelta(days=105),
            "end_date": planting_date + timedelta(days=125),
            "evidence_source": "Purdue Improved Crop Storage (PICS) / FAO Post-Harvest"
        })

        return plan
