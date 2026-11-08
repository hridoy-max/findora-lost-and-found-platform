from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from Backend.routes import users, categories, items, claims, item_returns, admin, health, images
from Backend.auth import auth as auth_routes
from Backend.config import settings
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware


# Rate Limiter
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Findora API", version="1.0.0")

# CORS - MUST be one of the first middlewares added
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SlowAPI Middleware & Exception Handler
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Global Exception Handlers
@app.exception_handler(IntegrityError)
async def integrity_exception_handler(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=409,
        content={"detail": "Database integrity conflict occurred"},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    # Manually add CORS headers to 500 responses so the browser shows the actual error
    headers = {
        "Access-Control-Allow-Origin": "http://localhost:5173",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
    }
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers=headers
    )

# Router Registration
try:
    app.mount("/static", StaticFiles(directory="Backend/static"), name="static")
except RuntimeError:
    print("Warning: Backend/static directory not found, skipping static mount")

try:
    app.mount("/static/uploads", StaticFiles(directory="Backend/uploads"), name="uploads")
except RuntimeError:
    print("Warning: Backend/uploads directory not found, skipping uploads mount")

app.include_router(health.router)

app.include_router(auth_routes.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1/users")
app.include_router(categories.router, prefix="/api/v1/categories")
app.include_router(items.router, prefix="/api/v1/items")
app.include_router(claims.router, prefix="/api/v1/claims")
app.include_router(item_returns.router, prefix="/api/v1/item-returns")
app.include_router(admin.router, prefix="/api/v1/admin")
app.include_router(images.router, prefix="/api/v1/images")

