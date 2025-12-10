from fastapi import APIRouter, Depends
from app.core.security import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    """Get current user information."""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "created_at": str(current_user.created_at) if current_user.created_at else None,
        "email_confirmed_at": str(current_user.email_confirmed_at) if current_user.email_confirmed_at else None
    }
