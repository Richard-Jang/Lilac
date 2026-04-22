from fastapi import Header, HTTPException


def get_current_user(authorization: str = Header(...)) -> str:
    try:
        scheme, user_id = authorization.split(" ", 1)
        if scheme.lower() != "bearer" or not user_id:
            raise HTTPException(status_code=401, detail="Invalid auth")
        return user_id
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid auth")
