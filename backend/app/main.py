from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app import db
from app.routes import auth, user, ai, apps, data, imports, export, automations, activity


def create_app() -> FastAPI:
    application = FastAPI(title="ForgeAI API")

    # CORS
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    # Warm up the connection pool on first request
    @application.on_event("startup")
    def startup():
        db.get_pool()
        print(f"ForgeAI backend started. Pool ready.")

    @application.on_event("shutdown")
    def shutdown():
        db.close_pool()

    # Global error handler
    @application.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": "SERVER_ERROR", "message": "Internal server error"},
        )

    from starlette.exceptions import HTTPException as StarletteHTTPException
    @application.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        if isinstance(exc.detail, dict):
            return JSONResponse(status_code=exc.status_code, content=exc.detail)
        return JSONResponse(status_code=exc.status_code, content={"message": exc.detail})

    # Routers
    application.include_router(auth.router)
    application.include_router(user.router)
    application.include_router(ai.router)
    application.include_router(apps.router)
    application.include_router(data.router)
    application.include_router(imports.router)
    application.include_router(export.router)
    application.include_router(automations.router)
    application.include_router(activity.router)

    @application.get("/api/health")
    async def health():
        return {"status": "ok"}

    return application


app = create_app()
