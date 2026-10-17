from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.agronomy import Crop, CropVariety
from app.schemas.agronomy import CropOut, VarietyOut

router = APIRouter(prefix="/agronomy", tags=["Agronomy Knowledge Base"])

@router.get("/crops", response_model=List[CropOut])
def list_crops(db: Session = Depends(get_db)):
    """List all supported crops and validated varieties in the Nigerian catalog."""
    crops = db.query(Crop).filter_by(status="active").all()
    results = []
    for c in crops:
        varieties = db.query(CropVariety).filter_by(crop_id=c.id, validation_status="validated").all()
        results.append(
            CropOut(
                id=c.id,
                crop_code=c.crop_code,
                scientific_name=c.scientific_name,
                common_name=c.common_name,
                category=c.category,
                description=c.description,
                status=c.status,
                varieties=[VarietyOut.from_orm(v) for v in varieties]
            )
        )
    return results

@router.get("/crops/{crop_id}", response_model=CropOut)
def get_crop(crop_id: str, db: Session = Depends(get_db)):
    """Get single crop details and varieties."""
    crop = db.query(Crop).filter_by(id=crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found.")
    varieties = db.query(CropVariety).filter_by(crop_id=crop.id).all()
    return CropOut(
        id=crop.id,
        crop_code=crop.crop_code,
        scientific_name=crop.scientific_name,
        common_name=crop.common_name,
        category=crop.category,
        description=crop.description,
        status=crop.status,
        varieties=[VarietyOut.from_orm(v) for v in varieties]
    )
