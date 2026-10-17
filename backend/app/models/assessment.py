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

class AssessmentJob(Base):
    __tablename__ = "assessment_jobs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_type = Column(String(50), nullable=False)  # crop_suitability, full_agronomic, planting_window
    status = Column(String(50), default="queued", nullable=False)
    # queued, validating, retrieving_data, processing_spatial_data, calculating_suitability, estimating_yield, generating_report, completed, completed_with_limitations, failed
    requested_inputs_json = Column(Text, nullable=False)
    error_code = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="assessment_jobs")
    field = relationship("Field", back_populates="assessment_jobs")
    assessments = relationship("Assessment", back_populates="assessment_job", cascade="all, delete-orphan")

class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_job_id = Column(String(36), ForeignKey("assessment_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_id = Column(String(36), ForeignKey("crops.id"), nullable=False, index=True)
    assessment_version = Column(String(50), default="1.0.0", nullable=False)
    
    # Core Agronomic Scoring
    overall_suitability_category = Column(String(50), nullable=False)  # Highly Suitable, Suitable with Constraints, Marginal, Not Recommended
    suitability_score = Column(Float, nullable=False)  # 0.0 to 100.0
    confidence_category = Column(String(50), nullable=False)  # High, Moderate, Preliminary
    
    # Yield Range (PRD Principle 3.3 & 3.7 - transparent uncertainty)
    yield_min = Column(Float, nullable=True)
    yield_max = Column(Float, nullable=True)
    yield_unit = Column(String(50), default="tons/hectare", nullable=True)
    
    results_json = Column(Text, nullable=False)      # breakdown: climate_score, soil_score, water_score, limiting_factors, favorable_factors
    limitations_json = Column(Text, nullable=False)  # resolution warnings, unconfirmed laboratory soil tests
    created_at = Column(DateTime, default=utc_now, nullable=False)

    assessment_job = relationship("AssessmentJob", back_populates="assessments")
    field = relationship("Field", back_populates="assessments")
    crop = relationship("Crop")
    layers = relationship("AssessmentLayer", back_populates="assessment", cascade="all, delete-orphan")
    crop_plans = relationship("CropPlan", back_populates="assessment", cascade="all, delete-orphan")
    expert_reviews = relationship("ExpertReview", back_populates="assessment", cascade="all, delete-orphan")

class AssessmentLayer(Base):
    __tablename__ = "assessment_layers"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    layer_type = Column(String(50), nullable=False)  # suitability_zones, soil_ph, elevation_contour, water_productivity
    geojson_data = Column(Text, nullable=False)      # Vector zones with GeoJSON FeatureCollection
    metadata_json = Column(Text, nullable=True)      # legend, resolution, scale
    created_at = Column(DateTime, default=utc_now, nullable=False)

    assessment = relationship("Assessment", back_populates="layers")

class CropPlan(Base):
    __tablename__ = "crop_plans"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="SET NULL"), nullable=True, index=True)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_id = Column(String(36), ForeignKey("crops.id"), nullable=False, index=True)
    planting_window_start = Column(DateTime, nullable=False)
    planting_window_end = Column(DateTime, nullable=False)
    plan_json = Column(Text, nullable=False)  # full schedule & stage management
    agronomy_version = Column(String(50), default="1.0.0", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    assessment = relationship("Assessment", back_populates="crop_plans")
    field = relationship("Field", back_populates="crop_plans")
    crop = relationship("Crop")
    tasks = relationship("CropPlanTask", back_populates="crop_plan", cascade="all, delete-orphan")
    progress_logs = relationship("CropProgressLog", back_populates="crop_plan", cascade="all, delete-orphan")

class CropPlanTask(Base):
    __tablename__ = "crop_plan_tasks"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    crop_plan_id = Column(String(36), ForeignKey("crop_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    stage = Column(String(100), nullable=False)  # Land Preparation, Sowing, Nutrient Application, Weed Control, Pest Scouting, Harvest
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    scheduled_start = Column(DateTime, nullable=False)
    scheduled_end = Column(DateTime, nullable=False)
    completion_status = Column(String(50), default="pending", nullable=False)  # pending, in_progress, completed, skipped
    completed_at = Column(DateTime, nullable=True)

    crop_plan = relationship("CropPlan", back_populates="tasks")

class CropProgressLog(Base):
    __tablename__ = "crop_progress_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_plan_id = Column(String(36), ForeignKey("crop_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    observation_date = Column(DateTime, default=utc_now, nullable=False)
    growth_stage = Column(String(100), nullable=False)
    measured_values_json = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(String(36), nullable=False)

    crop_plan = relationship("CropPlan", back_populates="progress_logs")

class ExpertReview(Base):
    __tablename__ = "expert_reviews"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="pending", nullable=False)  # pending, in_review, approved_with_limitations, revised, closed
    review_notes = Column(Text, nullable=True)
    changes_json = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    assessment = relationship("Assessment", back_populates="expert_reviews")
    reviewer = relationship("User")
