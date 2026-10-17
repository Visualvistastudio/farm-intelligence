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

class Farm(Base):
    __tablename__ = "farms"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    owner_user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), nullable=True)
    name = Column(String(255), nullable=False)
    country_code = Column(String(5), default="NG", nullable=False)
    state = Column(String(100), nullable=True)  # e.g., Kaduna, Oyo, Benue, Kano
    lga = Column(String(100), nullable=True)    # Local Government Area
    agroecological_zone = Column(String(100), nullable=True)  # Derived Savannah, Sudan Savannah, etc.
    boundary_geojson = Column(Text, nullable=True)  # GeoJSON Polygon / MultiPolygon
    calculated_area_hectares = Column(Float, default=0.0, nullable=False)
    farming_system = Column(String(50), default="rainfed", nullable=False)  # rainfed, irrigated, mixed
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    archived_at = Column(DateTime, nullable=True)
    
    owner = relationship("User", back_populates="farms")
    fields = relationship("Field", back_populates="farm", cascade="all, delete-orphan")

class Field(Base):
    __tablename__ = "fields"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    boundary_geojson = Column(Text, nullable=True)  # Field specific boundary GeoJSON
    area_hectares = Column(Float, default=0.0, nullable=False)
    current_crop_id = Column(String(36), nullable=True)
    slope_percentage = Column(Float, nullable=True)
    elevation_meters = Column(Float, nullable=True)
    status = Column(String(50), default="active", nullable=False)  # active, fallow, preparing
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    
    farm = relationship("Farm", back_populates="fields")
    observations = relationship("FieldObservation", back_populates="field", cascade="all, delete-orphan")
    soil_tests = relationship("SoilTest", back_populates="field", cascade="all, delete-orphan")
    assessment_jobs = relationship("AssessmentJob", back_populates="field", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="field", cascade="all, delete-orphan")
    crop_plans = relationship("CropPlan", back_populates="field", cascade="all, delete-orphan")

class FieldObservation(Base):
    __tablename__ = "field_observations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="CASCADE"), nullable=False, index=True)
    observation_type = Column(String(100), nullable=False)  # weed_pressure, waterlogging, pest_infestation, soil_color
    value_json = Column(Text, nullable=False)
    unit = Column(String(50), nullable=True)
    source_type = Column(String(50), default="farmer", nullable=False)  # farmer, extension_agent, agronomist
    observed_at = Column(DateTime, default=utc_now, nullable=False)
    created_by = Column(String(36), nullable=False)
    verification_status = Column(String(50), default="unverified", nullable=False)

    field = relationship("Field", back_populates="observations")

class SoilTest(Base):
    __tablename__ = "soil_tests"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="CASCADE"), nullable=False, index=True)
    sample_point_geojson = Column(Text, nullable=True)
    sampling_depth_cm = Column(Integer, default=20, nullable=False)
    laboratory = Column(String(255), nullable=True)
    tested_at = Column(DateTime, nullable=True)
    results_json = Column(Text, nullable=False)  # pH, nitrogen, phosphorus, potassium, organic_matter, texture
    units_json = Column(Text, nullable=True)
    document_uri = Column(String(500), nullable=True)
    verification_status = Column(String(50), default="unverified", nullable=False)

    field = relationship("Field", back_populates="soil_tests")
