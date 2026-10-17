import json
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db
from app.models.farm import Farm, Field
from app.models.user import User
from app.schemas.farm import (
    BoundaryValidationRequest, BoundaryValidationResponse, FarmCreate,
    FarmOut, FarmUpdate, FieldCreate, FieldOut
)
from app.services.spatial_service import SpatialService

router = APIRouter(prefix="/farms", tags=["Farms & Fields"])

@router.post("/validate-boundary", response_model=BoundaryValidationResponse)
def validate_field_boundary(req: BoundaryValidationRequest):
    """
    Validate GeoJSON polygon boundary, compute area in hectares,
    and determine Nigerian agroecological zone.
    """
    result = SpatialService.validate_and_process_boundary(req.geojson)
    if not result.get("valid"):
        return BoundaryValidationResponse(valid=False, error=result.get("error"))

    return BoundaryValidationResponse(
        valid=True,
        area_hectares=result.get("area_hectares"),
        centroid=result.get("centroid"),
        agroecological_zone=result.get("agroecological_zone"),
        probable_region=result.get("probable_region")
    )

@router.post("", response_model=FarmOut)
def create_farm(req: FarmCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new farm profile with boundary polygon."""
    calc_area = req.calculated_area_hectares
    zone = req.agroecological_zone
    state = req.state

    # If boundary provided, calculate precise area and zone
    if req.boundary_geojson:
        val = SpatialService.validate_and_process_boundary(req.boundary_geojson)
        if val.get("valid"):
            calc_area = val.get("area_hectares", 0.0)
            if not zone:
                zone = val.get("agroecological_zone")
            if not state:
                state = val.get("probable_region")

    farm = Farm(
        owner_user_id=current_user.id,
        name=req.name,
        country_code=req.country_code,
        state=state,
        lga=req.lga,
        agroecological_zone=zone,
        boundary_geojson=req.boundary_geojson,
        calculated_area_hectares=calc_area,
        farming_system=req.farming_system
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)

    # Automatically create primary field for the farm
    default_field = Field(
        farm_id=farm.id,
        name="Main Field Plot 1",
        boundary_geojson=req.boundary_geojson,
        area_hectares=calc_area,
        status="active"
    )
    db.add(default_field)
    db.commit()
    db.refresh(farm)

    return farm

@router.get("", response_model=List[FarmOut])
def list_my_farms(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all registered farms belonging to the current user."""
    farms = db.query(Farm).filter(Farm.owner_user_id == current_user.id, Farm.archived_at == None).all()
    return farms

@router.get("/{farm_id}", response_model=FarmOut)
def get_farm_details(farm_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get single farm details with fields."""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found.")
    return farm

@router.patch("/{farm_id}", response_model=FarmOut)
def update_farm(farm_id: str, req: FarmUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update farm profile or boundary."""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found.")

    if req.name is not None:
        farm.name = req.name
    if req.state is not None:
        farm.state = req.state
    if req.lga is not None:
        farm.lga = req.lga
    if req.farming_system is not None:
        farm.farming_system = req.farming_system
    if req.boundary_geojson is not None:
        farm.boundary_geojson = req.boundary_geojson
        val = SpatialService.validate_and_process_boundary(req.boundary_geojson)
        if val.get("valid"):
            farm.calculated_area_hectares = val.get("area_hectares", farm.calculated_area_hectares)
            farm.agroecological_zone = val.get("agroecological_zone", farm.agroecological_zone)

    farm.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(farm)
    return farm

@router.delete("/{farm_id}")
def archive_farm(farm_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Archive farm (soft delete)."""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found.")
    farm.archived_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "success", "message": "Farm archived."}

@router.post("/{farm_id}/fields", response_model=FieldOut)
def add_field_to_farm(farm_id: str, req: FieldCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Add a new field boundary to an existing farm."""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found.")

    area_ha = req.area_hectares
    if req.boundary_geojson:
        val = SpatialService.validate_and_process_boundary(req.boundary_geojson)
        if val.get("valid"):
            area_ha = val.get("area_hectares", 0.0)

    field = Field(
        farm_id=farm.id,
        name=req.name,
        boundary_geojson=req.boundary_geojson,
        area_hectares=area_ha,
        current_crop_id=req.current_crop_id,
        slope_percentage=req.slope_percentage,
        status=req.status
    )
    db.add(field)
    db.commit()
    db.refresh(field)
    return field
