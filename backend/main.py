import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

from database import init_db
from routers.files import router as files_router
from routers.books import router as books_router
from routers.auth import router as auth_router
from routers.annotations import router as annotations_router
from routers.chat import router as chat_router

app = FastAPI(title="Lilac API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)

@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(files_router)
app.include_router(books_router)
app.include_router(annotations_router)
app.include_router(chat_router)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

if __name__ == "__main__":
    try:
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except Exception:
        print("An error has occurred!")
        exit(1)
