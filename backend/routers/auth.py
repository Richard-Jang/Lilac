import uuid
from datetime import datetime, timezone
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from database import get_session, UserRow
from models import ok, err, LoginRequest, RegisterRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
def register(body: RegisterRequest) -> JSONResponse:
    with get_session() as session:
        if session.query(UserRow).filter(UserRow.username == body.username).first():
            return err("Username already taken", 409)
        user = UserRow(
            id=str(uuid.uuid4()),
            username=body.username,
            password=body.password,
            created_at=datetime.now(timezone.utc),
        )
        session.add(user)
        session.commit()
        return JSONResponse(
            content=ok({"token": user.id, "user_id": user.id, "username": user.username}),
            status_code=201,
        )


@router.post("/login")
def login(body: LoginRequest) -> JSONResponse:
    with get_session() as session:
        user = (
            session.query(UserRow)
            .filter(UserRow.username == body.username, UserRow.password == body.password)
            .first()
        )
        if not user:
            return err("Invalid username or password", 401)
        return JSONResponse(
            content=ok({"token": user.id, "user_id": user.id, "username": user.username})
        )
