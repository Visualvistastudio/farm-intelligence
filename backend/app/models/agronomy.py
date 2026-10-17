import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Crop(Base):
    __tablename__ = "crops"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    crop_code = Column(String(50), unique=True, index=True, nullable=False)  # maize, rice, cassava, etc.
    scientific_name = Column(String(255), nullable=False)
    common_name = Column(String(255), nullable=False)
    category = Column(String(100), default="cereal", nullable=False)  # cereal, tuber, legume, vegetable, cash_crop
    description = Column(Text, nullable=True)
    status = Column(String(50), default="active", nullable=False)  # active, draft, archived
    created_at = Column(DateTime, default=utc_now, nullable=False)
    
    varieties = relationship("CropVariety", back_populates="crop", cascade="all, delete-orphan")
    requirements = relationship("CropRequirement", back_populates="crop", cascade="all, delete-orphan")
    rules = relationship("AgronomyRule", back_populates="crop", cascade="all, delete-orphan")

class CropVariety(Base):
    __tablename__ = "crop_varieties"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    crop_id = Column(String(36), ForeignKey("crops.id", ondelete="CASCADE"), nullable=False, index=True)
    variety_name = Column(String(255), nullable=False)
    maturity_days_min = Column(Integer, nullable=False)
    maturity_days_max = Column(Integer, nullable=False)
    potential_yield_tons_ha = Column(Float, nullable=True)
    supported_regions_json = Column(Text, nullable=True)  # List of Nigerian agroecological zones
    evidence_reference = Column(Text, nullable=True)     # e.g., IITA, AfricaRice, NCRI Badeggi
    validation_status = Column(String(50), default="validated", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    crop = relationship("Crop", back_populates="varieties")

class CropRequirement(Base):
    __tablename__ = "crop_requirements"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    crop_id = Column(String(36), ForeignKey("crops.id", ondelete="CASCADE"), nullable=False, index=True)
    country_code = Column(String(5), default="NG", nullable=False)
    agroecological_zone = Column(String(100), nullable=False)  # Sahel, Sudan, Guinea Savannah, Humid Forest
    production_system = Column(String(50), default="rainfed", nullable=False)
    
    # JSON-encoded structured requirements:
    # climate: min_temp_c, opt_temp_min_c, opt_temp_max_c, max_temp_c, min_rainfall_mm, opt_rainfall_mm, growing_degree_days
    climate_reqs_json = Column(Text, nullable=False)
    # soil: opt_ph_min, opt_ph_max, min_ph, max_ph, textures, drainage_req, min_organic_carbon_pct
    soil_reqs_json = Column(Text, nullable=False)
    water_reqs_json = Column(Text, nullable=True)
    terrain_constraints_json = Column(Text, nullable=True)  # max_slope_pct, flood_risk_tolerance
    planting_rules_json = Column(Text, nullable=False)      # window_start_month, window_end_month, onset_rule
    
    source_reference = Column(String(255), nullable=False)  # FAO Crop Calendar, AfricaRice, NFSHCS, NIHORT
    version = Column(String(50), default="1.0.0", nullable=False)
    approval_status = Column(String(50), default="published", nullable=False)  # draft, reviewed, approved, published
    created_at = Column(DateTime, default=utc_now, nullable=False)

    crop = relationship("Crop", back_populates="requirements")

class AgronomyRule(Base):
    __tablename__ = "agronomy_rules"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    rule_name = Column(String(255), nullable=False)
    crop_id = Column(String(36), ForeignKey("crops.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_type = Column(String(50), nullable=False)  # planting_timing, nutrient_management, pest_advisory, water_stress
    condition_expression = Column(Text, nullable=False)
    action_payload = Column(Text, nullable=False)
    version = Column(String(50), default="1.0.0", nullable=False)
    approved_by = Column(String(36), nullable=True)
    approval_status = Column(String(50), default="approved", nullable=False)  # draft, approved, deprecated
    created_at = Column(DateTime, default=utc_now, nullable=False)

    crop = relationship("Crop", back_populates="rules")

class DataSource(Base):
    __tablename__ = "data_sources"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider = Column(String(100), nullable=False)  # NASA_POWER, FAO_WAPOR, ISRIC_SOILGRIDS, NIGERIA_SOIL_HEALTH
    dataset_name = Column(String(255), nullable=False)
    dataset_version = Column(String(50), nullable=True)
    license = Column(String(100), nullable=False)
    resolution_metadata_json = Column(Text, nullable=True)  # spatial_res, temporal_res
    coverage_metadata_json = Column(Text, nullable=True)    # bbox, countries
    last_sync_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="operational", nullable=False)  # operational, degraded, offline, unconfigured
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

class PlatformSetting(Base):
    __tablename__ = "platform_settings"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value_json = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    updated_by_user_id = Column(String(36), nullable=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
