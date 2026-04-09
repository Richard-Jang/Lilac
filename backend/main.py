from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Lilac API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}



# --- Files ---
# POST   /files/upload    - upload epub/pdf
# GET    /files           - list uploaded files
# GET    /files/{id}      - get file metadata
# DELETE /files/{id}      - delete a file

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
    except:
        print("An error has occurred!")
        exit(1)