import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.database import Base, get_db
from app.core.bootstrap import bootstrap_system
from app.core.security import verify_password
from app.models.user import User, PasswordRecoveryChallenge
from app.main import app
from app.services.spatial_service import SpatialService
from app.services.yield_estimator import YieldEstimator
from app.services.calendar_service import CalendarService

# Test database setup (in-memory SQLite)
TEST_DATABASE_URL = "sqlite:///./test_farm_intel.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    bootstrap_system(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def client():
    return TestClient(app)

def test_super_admin_bootstrap():
    """Verify Super Admin is provisioned with required bootstrap credentials and must_change_password."""
    db = TestingSessionLocal()
    admin_user = db.query(User).filter_by(email="ologunemmanuel2015@gmail.com").first()
    assert admin_user is not None
    assert admin_user.is_admin is True
    assert admin_user.must_change_password is True
    assert verify_password("123456789", admin_user.hashed_password) is True
    db.close()

def test_admin_direct_login_and_password_rotation(client):
    """Verify direct admin login with token and in-dashboard password rotation."""
    # Step 1: Submit credentials directly
    login_res = client.post("/api/v1/auth/admin/login", json={
        "email": "ologunemmanuel2015@gmail.com",
        "password": "123456789"
    })
    assert login_res.status_code == 200
    data = login_res.json()
    assert data["requires_otp"] is False
    assert data["must_change_password"] is True
    assert "access_token" in data
    token = data["access_token"]

    # Step 2: Rotate password via in-dashboard API using the authenticated token
    change_res = client.post(
        "/api/v1/auth/admin/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "email": "ologunemmanuel2015@gmail.com",
            "current_password": "123456789",
            "new_password": "PermanentAdminPassword2026!"
        }
    )
    assert change_res.status_code == 200

    # Step 3: Verify profile updated
    db = TestingSessionLocal()
    admin_user = db.query(User).filter_by(email="ologunemmanuel2015@gmail.com").first()
    assert admin_user.must_change_password is False
    assert verify_password("PermanentAdminPassword2026!", admin_user.hashed_password) is True
    db.close()

def test_farmer_registration_and_login(client):
    """Test farmer registration and authenticated session."""
    reg_res = client.post("/api/v1/auth/register", json={
        "full_name": "Babajide Farmer",
        "email": "farmer.test@example.com",
        "password": "StrongPassword2026!",
        "phone": "+2348012345678",
        "country_code": "NG"
    })
    assert reg_res.status_code == 200
    token_data = reg_res.json()
    assert "access_token" in token_data
    assert token_data["user"]["full_name"] == "Babajide Farmer"
    assert token_data["user"]["is_admin"] is False

def test_spatial_area_and_zone_mapping():
    """Verify GeoJSON polygon area calculation and Nigerian agroecological zone assignment."""
    # Polygon around Kaduna / Zaria (Northern Guinea Savannah)
    coords = [
        [7.410, 10.510],
        [7.420, 10.510],
        [7.420, 10.520],
        [7.410, 10.520],
        [7.410, 10.510]
    ]
    area_ha = SpatialService.calculate_polygon_area_hectares(coords)
    assert area_ha > 0.0

    zone, state = SpatialService.determine_nigerian_zone(10.515, 7.415)
    assert zone == "Northern Guinea Savannah"
    assert "Kaduna" in state

def test_yield_estimation_logic():
    """Verify calibrated yield ranges and transparent uncertainty."""
    # Test valid model for rice
    rice_est = YieldEstimator.estimate_yield_range(
        crop_code="rice",
        area_hectares=3.0,
        suitability_score=85.0,
        farming_system="rainfed_lowland"
    )
    assert rice_est["available"] is True
    assert rice_est["yield_min_per_ha"] > 0
    assert rice_est["yield_max_per_ha"] > rice_est["yield_min_per_ha"]
    assert "tons/hectare" in rice_est["unit"]

    # Test uncalibrated crop (transparent withholding)
    unknown_est = YieldEstimator.estimate_yield_range(
        crop_code="dragonfruit",
        area_hectares=1.0,
        suitability_score=50.0,
        farming_system="rainfed"
    )
    assert unknown_est["available"] is False
    assert unknown_est["yield_min_per_ha"] is None

def test_cultivation_plan_generation():
    """Verify 11-stage cultivation plan generation relative to planting date."""
    from datetime import datetime, timezone
    planting = datetime(2026, 6, 1, tzinfo=timezone.utc)
    plan = CalendarService.generate_cultivation_plan("maize", planting)
    assert len(plan) == 11
    assert plan[0]["stage_number"] == 1
    assert "Pre-Planting" in plan[0]["stage_name"]
    assert plan[10]["stage_number"] == 11
    assert "Harvest" in plan[10]["stage_name"]

def test_billing_plans_list(client):
    """Verify subscription tiers are listed accurately in minor currency units (NGN)."""
    res = client.get("/api/v1/billing/plans")
    assert res.status_code == 200
    plans = res.json()
    assert len(plans) >= 3
    plan_codes = [p["code"] for p in plans]
    assert "free" in plan_codes
    assert "farmer_plus" in plan_codes
    assert "professional" in plan_codes
