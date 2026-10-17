from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class BoundaryValidationRequest(BaseModel):
    geojson: str

class BoundaryValidationResponse(BaseModel):
    valid: bool
    area_hectares: Optional[float] = None
    centroid: Optional[List[float]] = None
    agroecological_zone: Optional[str] = None
    probable_region: Optional[str] = None
    error: Optional[str] = None

class FarmCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    country_code: str = "NG"
    state: Optional[str] = None
    lga: Optional[str] = None
    agroecological_zone: Optional[str] = None
    boundary_geojson: Optional[str] = None
    calculated_area_hectares: float = 0.0
    farming_system: str = "rainfed"  # rainfed, irrigated, mixed

class FarmUpdate(BaseModel):
    name: Optional[str] = None
    state: Optional[str] = None
    lga: Optional[str] = None
    boundary_geojson: Optional[str] = None
    calculated_area_hectares: Optional[float] = None
    farming_system: Optional[str] = None

class FieldCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    boundary_geojson: Optional[str] = None
    area_hectares: float = 0.0
    current_crop_id: Optional[str] = None
    slope_percentage: Optional[float] = None
    status: str = "active"

class FieldOut(BaseModel):
    id: str
    farm_id: str
    name: str
    boundary_geojson: Optional[str] = None
    area_hectares: float
    current_crop_id: Optional[str] = None
    slope_percentage: Optional[float] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class FarmOut(BaseModel):
    id: str
    owner_user_id: str
    name: str
    country_code: str
    state: Optional[str] = None
    lga: Optional[str] = None
    agroecological_zone: Optional[str] = None
    boundary_geojson: Optional[str] = None
    calculated_area_hectares: float
    farming_system: str
    fields: List[FieldOut] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FieldObservationCreate(BaseModel):
    observation_type: str
    value_json: str
    unit: Optional[str] = None

class SoilTestCreate(BaseModel):
    sample_point_geojson: Optional[str] = None
    sampling_depth_cm: int = 20
    laboratory: Optional[str] = None
    results_json: str  # pH, N, P, K, texture
    units_json: Optional[str] = None
