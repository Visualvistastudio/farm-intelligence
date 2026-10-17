from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class VarietyOut(BaseModel):
    id: str
    variety_name: str
    maturity_days_min: int
    maturity_days_max: int
    potential_yield_tons_ha: Optional[float] = None
    supported_regions_json: Optional[str] = None
    evidence_reference: Optional[str] = None
    validation_status: str

    class Config:
        from_attributes = True

class CropOut(BaseModel):
    id: str
    crop_code: str
    scientific_name: str
    common_name: str
    category: str
    description: Optional[str] = None
    status: str
    varieties: List[VarietyOut] = []

    class Config:
        from_attributes = True

class SuitabilityAssessmentRequest(BaseModel):
    field_id: str
    crop_id: Optional[str] = None  # None = recommend suitable crops
    planting_period: Optional[str] = None  # e.g., "June 2026"
    farming_system: str = "rainfed"
    soil_ph: Optional[float] = None
    soil_texture: Optional[str] = None
    annual_rainfall_mm: Optional[float] = None
    mean_temp_c: Optional[float] = None
    variety_id: Optional[str] = None

class AssessmentOut(BaseModel):
    id: str
    assessment_job_id: str
    field_id: str
    crop_id: str
    crop_name: Optional[str] = None
    assessment_version: str
    overall_suitability_category: str
    suitability_score: float
    confidence_category: str
    yield_min: Optional[float] = None
    yield_max: Optional[float] = None
    yield_unit: Optional[str] = None
    results: Dict[str, Any]
    limitations: List[str]
    layers: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CropPlanTaskOut(BaseModel):
    id: str
    stage: str
    title: str
    description: str
    scheduled_start: datetime
    scheduled_end: datetime
    completion_status: str
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CropPlanOut(BaseModel):
    id: str
    field_id: str
    crop_id: str
    crop_name: Optional[str] = None
    planting_window_start: datetime
    planting_window_end: datetime
    tasks: List[CropPlanTaskOut] = []
    agronomy_version: str
    created_at: datetime

    class Config:
        from_attributes = True
