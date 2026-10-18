import json
import logging
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User, Role, Permission, RolePermission, UserRole, AuditLog
from app.models.billing import Plan
from app.models.agronomy import Crop, CropVariety, CropRequirement, DataSource, PlatformSetting

logger = logging.getLogger("farm_intelligence.bootstrap")

PERMISSIONS_DEFINITION = [
    # Platform
    ("platform.settings.read", "platform", "View platform configuration and feature flags"),
    ("platform.settings.update", "platform", "Update platform settings and notices"),
    ("platform.features.manage", "platform", "Enable or disable product feature flags"),
    # Users
    ("users.read", "users", "View user accounts, profiles and summaries"),
    ("users.manage", "users", "Update user profile details"),
    ("users.suspend", "users", "Suspend or reactivate user accounts"),
    # Administration / RBAC
    ("admins.invite", "administration", "Invite administrative staff"),
    ("admins.manage", "administration", "Manage administrative staff accounts"),
    ("roles.read", "administration", "View system and custom roles"),
    ("roles.manage", "administration", "Create and modify roles and permissions"),
    ("permissions.assign", "administration", "Assign roles to administrators"),
    # Payments
    ("payments.read", "payments", "View payment transactions and metrics"),
    ("payments.reconcile", "payments", "Reconcile payment settlements with Paystack"),
    ("payments.refund", "payments", "Process authorized refunds to customers"),
    ("payments.provider.configure", "payments", "Configure Paystack API keys and webhooks"),
    # Subscriptions
    ("subscriptions.read", "subscriptions", "View active subscriptions and subscribers"),
    ("subscriptions.manage", "subscriptions", "Modify subscriber status and overrides"),
    ("subscription_plans.manage", "subscriptions", "Create, edit and archive subscription plans"),
    # Agronomy
    ("agronomy.read", "agronomy", "View crops, requirements and agronomy rules"),
    ("agronomy.crops.manage", "agronomy", "Manage crop catalog and varieties"),
    ("agronomy_rules.manage", "agronomy", "Draft and modify agronomy rules"),
    ("agronomy_rules.approve", "agronomy", "Approve and publish agronomy rules to production"),
    ("assessments.review", "agronomy", "Conduct expert review on flagged assessments"),
    # Data Sources
    ("data_sources.read", "data_sources", "View external data sources and status"),
    ("data_sources.configure", "data_sources", "Configure data ingestion settings"),
    ("data_sources.sync", "data_sources", "Trigger manual dataset synchronization"),
    # Audit
    ("audit_logs.read", "audit", "View immutable audit logs"),
    ("security.settings.manage", "audit", "Manage security policies and session timeouts"),
]

ROLE_PERMISSIONS_MAPPING = {
    "super_admin": [p[0] for p in PERMISSIONS_DEFINITION],  # All permissions
    "platform_admin": [
        "platform.settings.read", "platform.settings.update", "platform.features.manage",
        "users.read", "users.manage", "users.suspend",
        "roles.read", "subscriptions.read", "agronomy.read", "data_sources.read", "audit_logs.read"
    ],
    "finance_admin": [
        "payments.read", "payments.reconcile", "payments.refund", "payments.provider.configure",
        "subscriptions.read", "subscriptions.manage", "subscription_plans.manage",
        "audit_logs.read"
    ],
    "agronomy_admin": [
        "agronomy.read", "agronomy.crops.manage", "agronomy_rules.manage", "agronomy_rules.approve",
        "assessments.review", "data_sources.read"
    ],
    "data_admin": [
        "data_sources.read", "data_sources.configure", "data_sources.sync",
        "agronomy.read", "audit_logs.read"
    ],
    "customer_support": [
        "users.read", "subscriptions.read", "agronomy.read"
    ]
}

def bootstrap_system(db: Session):
    """
    Idempotent bootstrap routine:
    1. Provisions default granular permissions
    2. Provisions default RBAC roles
    3. Maps permissions to roles
    4. Creates the initial Super Admin account if enabled and not already existing
    5. Seeds subscription plans
    6. Seeds Nigerian agronomy knowledge base & external data sources
    """
    logger.info("Starting Farm Intelligence system bootstrap...")

    # 1. Seed Permissions
    existing_perms = {p.code: p for p in db.query(Permission).all()}
    for code, category, desc in PERMISSIONS_DEFINITION:
        if code not in existing_perms:
            perm = Permission(code=code, category=category, description=desc)
            db.add(perm)
    db.commit()

    # Refresh permissions
    perm_map = {p.code: p for p in db.query(Permission).all()}

    # 2. Seed Default Roles
    roles_def = [
        ("super_admin", "Super Admin", "Full platform administration, user/staff management, RBAC, financial settings, agronomy publishing"),
        ("platform_admin", "Platform Admin", "General operations, user management, assessment monitoring"),
        ("finance_admin", "Finance Admin", "Payments, transaction review, refunds, subscriptions, revenue reporting"),
        ("agronomy_admin", "Agronomy Admin", "Crop catalog, planting calendar, suitability rules, expert review"),
        ("data_admin", "Data Admin", "Data sources, sync monitoring, geospatial pipelines"),
        ("customer_support", "Customer Support", "User assistance, account review, non-financial support"),
    ]

    existing_roles = {r.name: r for r in db.query(Role).all()}
    for role_name, display_name, description in roles_def:
        if role_name not in existing_roles:
            role = Role(name=role_name, display_name=display_name, description=description, is_system=True)
            db.add(role)
            db.commit()
            db.refresh(role)
            existing_roles[role_name] = role

    # 3. Map Permissions to Roles
    for role_name, perm_codes in ROLE_PERMISSIONS_MAPPING.items():
        role = existing_roles.get(role_name)
        if not role:
            continue
        current_assigned = {rp.permission_id for rp in db.query(RolePermission).filter_by(role_id=role.id).all()}
        for code in perm_codes:
            perm = perm_map.get(code)
            if perm and perm.id not in current_assigned:
                rp = RolePermission(role_id=role.id, permission_id=perm.id)
                db.add(rp)
    db.commit()

    # 4. Bootstrap Initial Super Admin (PRD Addendum Section 3 & 4)
    if settings.INITIAL_SUPER_ADMIN_ENABLED and settings.INITIAL_SUPER_ADMIN_EMAIL:
        admin_email = settings.INITIAL_SUPER_ADMIN_EMAIL.strip().lower()
        existing_admin = db.query(User).filter_by(email=admin_email).first()
        
        if not existing_admin:
            logger.warning(f"Provisioning initial Super Admin: {admin_email}")
            hashed_pwd = hash_password(settings.INITIAL_SUPER_ADMIN_TEMP_PASSWORD)
            super_admin_user = User(
                email=admin_email,
                full_name=settings.INITIAL_SUPER_ADMIN_NAME,
                hashed_password=hashed_pwd,
                country_code="NG",
                is_admin=True,
                must_change_password=True,  # Mandatory password rotation on first login
                email_verified=False,        # Requires OTP verification
                account_status="active"
            )
            db.add(super_admin_user)
            db.commit()
            db.refresh(super_admin_user)

            # Assign super_admin role
            super_admin_role = existing_roles["super_admin"]
            user_role = UserRole(user_id=super_admin_user.id, role_id=super_admin_role.id)
            db.add(user_role)

            # Record audit log
            audit = AuditLog(
                actor_user_id=super_admin_user.id,
                actor_email="system_bootstrap",
                action="super_admin_provisioned",
                entity_type="user",
                entity_id=super_admin_user.id,
                details_json=json.dumps({
                    "email": admin_email,
                    "must_change_password": True,
                    "role": "super_admin"
                })
            )
            db.add(audit)
            db.commit()
            logger.info("Super Admin account successfully bootstrapped.")
        else:
            logger.info(f"Super Admin account ({admin_email}) already exists. Preserving credentials.")

    # 5. Seed Subscription Plans (PRD Addendum Section 11 & Master PRD Section 10)
    plans_data = [
        ("free", "Free Explore", "Essential field mapping, basic crop suitability assessment for 1 farm", "month", 0, "NGN", {
            "max_farms": 1,
            "max_assessments_per_month": 3,
            "export_pdf_reports": False,
            "seasonal_reminders": False,
            "priority_support": False
        }),
        ("farmer_plus", "Farmer Plus", "Comprehensive crop planning, seasonal reminders and suitability maps for expanding farms", "month", 300000, "NGN", {
            "max_farms": 5,
            "max_assessments_per_month": 25,
            "export_pdf_reports": True,
            "seasonal_reminders": True,
            "priority_support": False
        }),
        ("professional", "Professional Agronomist", "Advanced spatial reports, multiple fields, yield estimation scenarios and priority access", "month", 1500000, "NGN", {
            "max_farms": 25,
            "max_assessments_per_month": 150,
            "export_pdf_reports": True,
            "seasonal_reminders": True,
            "priority_support": True
        }),
        ("organization", "Extension & Enterprise", "Cooperative & extension agent portal, multi-farmer management and bulk GIS export", "month", 5000000, "NGN", {
            "max_farms": 500,
            "max_assessments_per_month": 2000,
            "export_pdf_reports": True,
            "seasonal_reminders": True,
            "priority_support": True
        }),
    ]

    for code, name, desc, interval, price_minor, currency, limits in plans_data:
        plan = db.query(Plan).filter_by(code=code).first()
        if not plan:
            plan = Plan(
                code=code,
                name=name,
                description=desc,
                billing_interval=interval,
                price_minor_units=price_minor,
                currency=currency,
                feature_limits_json=json.dumps(limits),
                is_active=True
            )
            db.add(plan)
    db.commit()

    # 6. Seed External Data Sources
    data_sources_def = [
        ("NASA_POWER", "NASA POWER Agroclimatology", "v2.0", "Open Access / Public Domain", 
         {"spatial_res": "0.5 x 0.5 deg", "temporal_res": "Daily"}, {"coverage": "Global", "focus": "Nigeria"}),
        ("FAO_WAPOR", "FAO WaPOR Water Productivity", "v3.0", "CC-BY-4.0", 
         {"spatial_res": "20m - 100m", "temporal_res": "Dekadal / Annual"}, {"coverage": "Africa & Near East"}),
        ("ISRIC_SOILGRIDS", "ISRIC SoilGrids250m", "v2.0", "CC-BY-4.0", 
         {"spatial_res": "250m", "depths": "0-5cm, 5-15cm, 15-30cm"}, {"coverage": "Global"}),
        ("NIGERIA_SOIL_HEALTH", "Nigeria National Farm and Soil Health Scheme", "v1.2", "Federal Ministry of Agriculture", 
         {"spatial_res": "State & LGA Reference Points"}, {"coverage": "Nigeria (36 States + FCT)"})
    ]
    for provider, name, ver, lic, res_meta, cov_meta in data_sources_def:
        ds = db.query(DataSource).filter_by(provider=provider).first()
        if not ds:
            ds = DataSource(
                provider=provider,
                dataset_name=name,
                dataset_version=ver,
                license=lic,
                resolution_metadata_json=json.dumps(res_meta),
                coverage_metadata_json=json.dumps(cov_meta),
                status="operational",
                is_active=True
            )
            db.add(ds)
    db.commit()

    # 7. Seed Nigerian Crops & Agronomy Knowledge Base
    crops_def = [
        ("maize", "Zea mays", "Maize (Corn)", "cereal", "Major staple cereal grown across all ecological zones in Nigeria."),
        ("rice", "Oryza sativa / Oryza glaberrima", "Rice (Paddy)", "cereal", "Primary food grain cultivated under rainfed lowland, upland, and irrigated ecology. Built with AfricaRice/RiceAdvice guidelines."),
        ("cassava", "Manihot esculenta", "Cassava", "tuber", "Drought-tolerant root crop, Nigeria is the world's largest producer."),
        ("sorghum", "Sorghum bicolor", "Sorghum (Guinea Corn)", "cereal", "Highly resilient cereal adapted to Sudan and Sahel Savannah drylands."),
        ("soybean", "Glycine max", "Soybean", "legume", "High-protein legume cultivated in Southern & Northern Guinea Savannah."),
        ("cowpea", "Vigna unguiculata", "Cowpea (Beans)", "legume", "Essential grain legume and soil-nitrogen fixing crop across Northern Nigeria."),
        ("yam", "Dioscorea rotundata", "White Yam", "tuber", "High-value root crop prominent in Middle Belt (Derived/Southern Guinea Savannah)."),
        ("tomato", "Solanum lycopersicum", "Tomato", "vegetable", "Major horticultural crop grown extensively in Kano, Kaduna, and plateau irrigation belts."),
        ("oil_palm", "Elaeis guineensis", "Oil Palm", "cash_crop", "Tree crop adapted to Humid Forest and coastal rain belts in Southern Nigeria.")
    ]

    for code, sci_name, com_name, cat, desc in crops_def:
        crop = db.query(Crop).filter_by(crop_code=code).first()
        if not crop:
            crop = Crop(
                crop_code=code,
                scientific_name=sci_name,
                common_name=com_name,
                category=cat,
                description=desc,
                status="active"
            )
            db.add(crop)
            db.commit()
            db.refresh(crop)

            # Add sample validated varieties & regional requirements for Nigeria
            if code == "rice":
                v1 = CropVariety(
                    crop_id=crop.id,
                    variety_name="FARO 44 (SiPi 692033)",
                    maturity_days_min=110,
                    maturity_days_max=120,
                    potential_yield_tons_ha=5.5,
                    supported_regions_json=json.dumps(["Southern Guinea Savannah", "Northern Guinea Savannah", "Derived Savannah"]),
                    evidence_reference="AfricaRice / NCRI Badeggi Certified Variety Catalog"
                )
                v2 = CropVariety(
                    crop_id=crop.id,
                    variety_name="FARO 52 (WITA 4)",
                    maturity_days_min=125,
                    maturity_days_max=135,
                    potential_yield_tons_ha=6.0,
                    supported_regions_json=json.dumps(["Lowland Rainfed", "Humid Forest", "Derived Savannah"]),
                    evidence_reference="AfricaRice / IITA Rice Breeding Program"
                )
                db.add_all([v1, v2])

                # Requirements for Southern Guinea Savannah
                req = CropRequirement(
                    crop_id=crop.id,
                    country_code="NG",
                    agroecological_zone="Southern Guinea Savannah",
                    production_system="rainfed_lowland",
                    climate_reqs_json=json.dumps({
                        "min_temp_c": 20, "opt_temp_min_c": 25, "opt_temp_max_c": 32, "max_temp_c": 38,
                        "min_annual_rainfall_mm": 900, "opt_rainfall_mm": 1300
                    }),
                    soil_reqs_json=json.dumps({
                        "opt_ph_min": 5.5, "opt_ph_max": 6.8, "min_ph": 4.5, "max_ph": 7.5,
                        "preferred_textures": ["Clay Loam", "Silt Loam", "Clay"],
                        "drainage_tolerance": "moderate_to_poor_drainage_accepted"
                    }),
                    water_reqs_json=json.dumps({"water_stress_sensitivity": "high_at_flowering"}),
                    terrain_constraints_json=json.dumps({"max_slope_pct": 5.0}),
                    planting_rules_json=json.dumps({
                        "window_start_month": 5, "window_end_month": 7,
                        "onset_condition": "after_3_consecutive_rain_days_exceeding_20mm"
                    }),
                    source_reference="FAO Crop Calendar & AfricaRice Field Evidence",
                    approval_status="published"
                )
                db.add(req)

            elif code == "maize":
                v1 = CropVariety(
                    crop_id=crop.id,
                    variety_name="SAMMAZ 15 (DMR-LSR-Y)",
                    maturity_days_min=105,
                    maturity_days_max=115,
                    potential_yield_tons_ha=4.8,
                    supported_regions_json=json.dumps(["Northern Guinea Savannah", "Southern Guinea Savannah"]),
                    evidence_reference="IITA / Institute for Agricultural Research (IAR) Samaru"
                )
                db.add(v1)

                req = CropRequirement(
                    crop_id=crop.id,
                    country_code="NG",
                    agroecological_zone="Northern Guinea Savannah",
                    production_system="rainfed",
                    climate_reqs_json=json.dumps({
                        "min_temp_c": 18, "opt_temp_min_c": 22, "opt_temp_max_c": 30, "max_temp_c": 35,
                        "min_annual_rainfall_mm": 600, "opt_rainfall_mm": 900
                    }),
                    soil_reqs_json=json.dumps({
                        "opt_ph_min": 5.8, "opt_ph_max": 7.0, "min_ph": 5.0, "max_ph": 7.8,
                        "preferred_textures": ["Sandy Loam", "Loam", "Clay Loam"],
                        "drainage_tolerance": "well_drained_required"
                    }),
                    terrain_constraints_json=json.dumps({"max_slope_pct": 8.0}),
                    planting_rules_json=json.dumps({
                        "window_start_month": 6, "window_end_month": 7,
                        "onset_condition": "stable_rains_exceeding_50mm_over_10_days"
                    }),
                    source_reference="IAR Samaru / FAO Crop Calendar",
                    approval_status="published"
                )
                db.add(req)

    # 7. Restore dynamic SMTP configuration from PlatformSetting if present
    try:
        smtp_setting = db.query(PlatformSetting).filter_by(key="smtp_settings").first()
        if smtp_setting and smtp_setting.value_json:
            val = json.loads(smtp_setting.value_json)
            if val.get("smtp_host"):
                settings.SMTP_HOST = val["smtp_host"]
            if val.get("smtp_port"):
                settings.SMTP_PORT = int(val["smtp_port"])
            if val.get("smtp_user"):
                settings.SMTP_USER = val["smtp_user"]
            if val.get("smtp_password"):
                settings.SMTP_PASSWORD = val["smtp_password"]
            if val.get("smtp_from_email"):
                settings.SMTP_FROM_EMAIL = val["smtp_from_email"]
            if val.get("smtp_from_name"):
                settings.SMTP_FROM_NAME = val["smtp_from_name"]
            logger.info("Restored dynamic SMTP settings from platform configuration.")
    except Exception as e:
        logger.warning(f"Could not restore SMTP settings from database: {e}")

    db.commit()
    logger.info("Farm Intelligence bootstrap finished successfully.")
