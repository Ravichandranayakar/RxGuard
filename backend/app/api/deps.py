from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.core.security import decode_access_token
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.models.entities import User

async def get_current_user(
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Extracts and verifies JWT Bearer token from request header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthenticationError("Missing or malformed Authorization header.")

    token = authorization.split(" ")[1]
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Invalid token payload: missing subject.")
    except Exception as e:
        raise AuthenticationError(f"Token validation failed: {str(e)}")

    stmt = select(User).where(User.id == user_id).options(selectinload(User.organization))
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not user.is_active:
        raise AuthenticationError("User not found or account is deactivated.")

    return user

def require_role(*allowed_roles: str):
    """Dependency factory checking user role."""
    def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles and user.role != "SYSTEM_ADMIN":
            raise AuthorizationError(f"Access forbidden. Requires one of roles: {allowed_roles}")
        return user
    return role_checker
