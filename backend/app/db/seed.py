import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.entities import Organization, User, PrescriberKey, Prescription
from app.core.security import hash_password
from app.core.crypto import CryptoEngine

async def seed_initial_data():
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        res = await db.execute(select(Organization))
        if res.scalars().first():
            return

        # 1. Create Organizations
        hosp_org = Organization(
            id="org-hosp-01",
            name="Metro General Hospital",
            msp_id="HospitalMSP",
            org_type="HOSPITAL"
        )
        pharm_org = Organization(
            id="org-pharm-01",
            name="CareFirst Pharmacy Network",
            msp_id="PharmacyMSP",
            org_type="PHARMACY"
        )
        db.add_all([hosp_org, pharm_org])
        await db.flush()

        # 2. Create Users
        doctor = User(
            id="usr-doc-01",
            organization_id=hosp_org.id,
            email="dr.smith@metrohealth.org",
            name="Dr. Sarah Smith, MD",
            hashed_password=hash_password("DoctorPass123!"),
            role="DOCTOR",
            is_active=True
        )
        pharmacist = User(
            id="usr-pharm-01",
            organization_id=pharm_org.id,
            email="pharm.jones@carefirst.org",
            name="Marcus Jones, PharmD",
            hashed_password=hash_password("PharmPass123!"),
            role="PHARMACIST",
            is_active=True
        )
        admin = User(
            id="usr-admin-01",
            organization_id=hosp_org.id,
            email="admin@rxguard.org",
            name="System Administrator",
            hashed_password=hash_password("AdminPass123!"),
            role="SYSTEM_ADMIN",
            is_active=True
        )
        db.add_all([doctor, pharmacist, admin])
        await db.flush()

        # 3. Create Prescriber Public Key
        priv_pem, pub_pem = CryptoEngine.generate_ecdsa_keypair()
        key = PrescriberKey(
            id=str(uuid.uuid4()),
            user_id=doctor.id,
            key_id="KEY-DOC-SARAH-V1",
            public_key_pem=pub_pem,
            status="ACTIVE"
        )
        db.add(key)
        await db.commit()
