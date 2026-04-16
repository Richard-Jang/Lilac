import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from database import init_db
from routers.files import router as files_router

app = FastAPI(title="Lilac API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(files_router)

# --- Reader ---
# GET    /files/{id}/pages/{page}  - get rendered page content

# --- Auth ---
# POST   /auth/register
# POST   /auth/login
# POST   /auth/logout
# GET    /auth/me

if __name__ == "__main__":
    try:
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except Exception:
        print("An error has occurred!")
        exit(1)
