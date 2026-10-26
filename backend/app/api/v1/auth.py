from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.core.security import verify_password, create_access_token
from app.core.exceptions import AuthenticationError
from app.models.entities import User
from app.schemas.domain import LoginRequest, AuthTokenResponse, UserProfile, APIResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=APIResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == req.username).options(selectinload(User.organization))
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        raise AuthenticationError("Invalid email or password.")

    if not user.is_active:
        raise AuthenticationError("Account is inactive.")

    token = create_access_token(
        data={
            "sub": user.id,
            "email": user.email,
            "role": user.role,
            "org_id": user.organization_id,
            "msp_id": user.organization.msp_id
        }
    )

    profile = UserProfile(
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        organization_id=user.organization_id,
        organization_name=user.organization.name,
        msp_id=user.organization.msp_id
    )

    return APIResponse(
        success=True,
        data=AuthTokenResponse(
            access_token=token,
            expires_in=3600,
            user=profile
        )
    )

@router.get("/me", response_model=APIResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    profile = UserProfile(
        user_id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        organization_id=current_user.organization_id,
        organization_name=current_user.organization.name,
        msp_id=current_user.organization.msp_id
    )
    return APIResponse(success=True, data=profile)
