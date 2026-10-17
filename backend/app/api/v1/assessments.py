import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db
from app.models.agronomy import Crop, CropRequirement, CropVariety
from app.models.assessment import (
    Assessment, AssessmentJob, AssessmentLayer, CropPlan, CropPlanTask
)
from app.models.farm import Farm, Field
from app.models.user import User
from app.schemas.agronomy import (
    AssessmentOut, CropPlanOut, CropPlanTaskOut, SuitabilityAssessmentRequest
)
from app.services.agronomy_engine import AgronomyEngine
from app.services.calendar_service import CalendarService
from app.services.spatial_service import SpatialService
from app.services.yield_estimator import YieldEstimator

router = APIRouter(prefix="/assessments", tags=["Assessments & Crop Plans"])

def _build_assessment_out(assessment: Assessment, db: Session) -> AssessmentOut:
    crop = db.query(Crop).filter_by(id=assessment.crop_id).first()
    results = json.loads(assessment.results_json) if assessment.results_json else {}
    limitations = json.loads(assessment.limitations_json) if assessment.limitations_json else []
    
    # Load layer GeoJSON if available
    layer = db.query(AssessmentLayer).filter_by(assessment_id=assessment.id).first()
    layers_data = json.loads(layer.geojson_data) if layer else None

    return AssessmentOut(
        id=assessment.id,
        assessment_job_id=assessment.assessment_job_id,
        field_id=assessment.field_id,
        crop_id=assessment.crop_id,
        crop_name=crop.common_name if crop else "Unknown",
        assessment_version=assessment.assessment_version,
        overall_suitability_category=assessment.overall_suitability_category,
        suitability_score=assessment.suitability_score,
        confidence_category=assessment.confidence_category,
        yield_min=assessment.yield_min,
        yield_max=assessment.yield_max,
        yield_unit=assessment.yield_unit,
        results=results,
        limitations=limitations,
        layers=layers_data,
        created_at=assessment.created_at
    )

@router.post("", response_model=AssessmentOut)
def run_assessment(req: SuitabilityAssessmentRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Run evidence-grounded crop suitability assessment, spatial zoning,
    and yield estimation for a designated field.
    """
    field = db.query(Field).join(Farm).filter(Field.id == req.field_id, Farm.owner_user_id == current_user.id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found or access denied.")

    farm = field.farm
    zone = farm.agroecological_zone or "Northern Guinea Savannah"

    # Select crop to evaluate
    if req.crop_id:
        target_crop = db.query(Crop).filter_by(id=req.crop_id).first()
        if not target_crop:
            raise HTTPException(status_code=404, detail="Requested crop not found.")
    else:
        # Default to primary national staple (Maize) if unspecified
        target_crop = db.query(Crop).filter_by(crop_code="maize").first() or db.query(Crop).first()

    # Create Assessment Job
    job = AssessmentJob(
        user_id=current_user.id,
        field_id=field.id,
        assessment_type="full_agronomic",
        status="processing_spatial_data",
        requested_inputs_json=json.dumps(req.dict()),
        started_at=datetime.now(timezone.utc)
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # 1. Agronomic Suitability
    req_record = db.query(CropRequirement).filter_by(crop_id=target_crop.id, agroecological_zone=zone).first()
    inputs = {
        "annual_rainfall_mm": req.annual_rainfall_mm,
        "mean_temp_c": req.mean_temp_c,
        "soil_ph": req.soil_ph,
        "soil_texture": req.soil_texture,
        "soil_test_available": False,
        "polygon_verified": bool(field.boundary_geojson or farm.boundary_geojson)
    }
    suitability = AgronomyEngine.evaluate_crop_suitability(
        crop=target_crop,
        req=req_record,
        zone=zone,
        farming_system=req.farming_system,
        user_inputs=inputs
    )

    # 2. Yield Range Estimation
    yield_res = YieldEstimator.estimate_yield_range(
        crop_code=target_crop.crop_code,
        area_hectares=field.area_hectares or 2.0,
        suitability_score=suitability["suitability_score"],
        farming_system=req.farming_system
    )

    # 3. Spatial Zoning
    boundary_str = field.boundary_geojson or farm.boundary_geojson
    outer_coords = []
    if boundary_str:
        parsed = SpatialService.validate_and_process_boundary(boundary_str)
        if parsed.get("valid"):
            outer_coords = parsed.get("coordinates", [])

    if not outer_coords:
        # Default representative 2-hectare plot in Nigeria (Kaduna reference)
        outer_coords = [
            [7.410, 10.510],
            [7.415, 10.510],
            [7.415, 10.515],
            [7.410, 10.515],
            [7.410, 10.510]
        ]

    spatial_zones = SpatialService.generate_suitability_zones_layer(outer_coords, suitability["suitability_score"])

    # 4. Save Assessment Record
    assessment = Assessment(
        assessment_job_id=job.id,
        field_id=field.id,
        crop_id=target_crop.id,
        assessment_version="1.0.0",
        overall_suitability_category=suitability["overall_suitability_category"],
        suitability_score=suitability["suitability_score"],
        confidence_category=suitability["confidence_category"],
        yield_min=yield_res.get("yield_min_per_ha"),
        yield_max=yield_res.get("yield_max_per_ha"),
        yield_unit=yield_res.get("unit"),
        results_json=json.dumps({
            "breakdown": suitability["breakdown"],
            "favorable_factors": suitability["favorable_factors"],
            "limiting_factors": suitability["limiting_factors"],
            "confidence_reason": suitability["confidence_reason"],
            "yield_details": yield_res,
            "data_provenance": suitability["data_provenance"]
        }),
        limitations_json=json.dumps(suitability["limitations_warnings"])
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    # 5. Save Spatial Layer
    layer = AssessmentLayer(
        assessment_id=assessment.id,
        layer_type="suitability_zones",
        geojson_data=json.dumps(spatial_zones),
        metadata_json=json.dumps({"legend": spatial_zones.get("properties", {}).get("legend", [])})
    )
    db.add(layer)

    # 6. Generate Crop Management Plan & Tasks
    start_window, end_window, guidance = CalendarService.get_planting_window(target_crop.crop_code, zone)
    cultivation_stages = CalendarService.generate_cultivation_plan(target_crop.crop_code, start_window)

    crop_plan = CropPlan(
        assessment_id=assessment.id,
        field_id=field.id,
        crop_id=target_crop.id,
        planting_window_start=start_window,
        planting_window_end=end_window,
        plan_json=json.dumps({"stages": cultivation_stages, "planting_guidance": guidance}),
        agronomy_version="1.0.0"
    )
    db.add(crop_plan)
    db.commit()
    db.refresh(crop_plan)

    for stage_item in cultivation_stages:
        task = CropPlanTask(
            crop_plan_id=crop_plan.id,
            stage=stage_item["stage_name"],
            title=stage_item["title"],
            description=stage_item["description"],
            scheduled_start=stage_item["start_date"],
            scheduled_end=stage_item["end_date"],
            completion_status="pending"
        )
        db.add(task)

    job.status = "completed"
    job.completed_at = datetime.now(timezone.utc)
    db.commit()

    return _build_assessment_out(assessment, db)

@router.get("", response_model=List[AssessmentOut])
def list_assessments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all assessments for farms owned by the current user."""
    assessments = db.query(Assessment).join(Field).join(Farm).filter(Farm.owner_user_id == current_user.id).order_by(Assessment.created_at.desc()).all()
    return [_build_assessment_out(a, db) for a in assessments]

@router.get("/{assessment_id}", response_model=AssessmentOut)
def get_assessment(assessment_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve full assessment details with suitability map layer and yield estimations."""
    assessment = db.query(Assessment).join(Field).join(Farm).filter(Assessment.id == assessment_id, Farm.owner_user_id == current_user.id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")
    return _build_assessment_out(assessment, db)

@router.get("/{assessment_id}/crop-plan", response_model=CropPlanOut)
def get_assessment_crop_plan(assessment_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get cultivation plan and task checklist associated with assessment."""
    plan = db.query(CropPlan).join(Assessment).join(Field).join(Farm).filter(
        CropPlan.assessment_id == assessment_id,
        Farm.owner_user_id == current_user.id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Crop plan not found for this assessment.")

    crop = db.query(Crop).filter_by(id=plan.crop_id).first()
    tasks = db.query(CropPlanTask).filter_by(crop_plan_id=plan.id).order_by(CropPlanTask.scheduled_start.asc()).all()

    return CropPlanOut(
        id=plan.id,
        field_id=plan.field_id,
        crop_id=plan.crop_id,
        crop_name=crop.common_name if crop else "Crop Plan",
        planting_window_start=plan.planting_window_start,
        planting_window_end=plan.planting_window_end,
        tasks=[CropPlanTaskOut.from_orm(t) for t in tasks],
        agronomy_version=plan.agronomy_version,
        created_at=plan.created_at
    )

@router.post("/tasks/{task_id}/toggle")
def toggle_task_completion(task_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Mark a crop plan task as completed or pending."""
    task = db.query(CropPlanTask).join(CropPlan).join(Field).join(Farm).filter(
        CropPlanTask.id == task_id,
        Farm.owner_user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    if task.completion_status == "completed":
        task.completion_status = "pending"
        task.completed_at = None
    else:
        task.completion_status = "completed"
        task.completed_at = datetime.now(timezone.utc)

    db.commit()
    return {"status": "success", "task_id": task.id, "completion_status": task.completion_status}
