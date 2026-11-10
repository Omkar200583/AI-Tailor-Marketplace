import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.routes import assistant_routes, design_routes, health_routes, recommendation_routes, tryon_routes
from app.core.config import get_settings
from app.core.exceptions import AIEngineError
from app.services import mongodb_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("ai-engine")


@asynccontextmanager
async def lifespan(_: FastAPI):
    mongodb_service.connect()
    yield
    mongodb_service.close()


app = FastAPI(title=get_settings().app_name, version="1.0.0", lifespan=lifespan)

for r in (
    health_routes.router,
    design_routes.router,
    tryon_routes.router,
    assistant_routes.router,
    recommendation_routes.router,
):
    app.include_router(r)


@app.exception_handler(AIEngineError)
async def engine_error_handler(_: Request, exc: AIEngineError):
    log.error("%s: %s", exc.code, exc.message)
    return JSONResponse(status_code=exc.status_code, content={"error": exc.code, "message": exc.message})


@app.exception_handler(Exception)
async def unhandled(_: Request, exc: Exception):
    log.exception("Unhandled error")
    return JSONResponse(status_code=500, content={"error": "internal_error", "message": "Something went wrong"})


@app.get("/")
async def root():
    return {
        "success": True,
        "service": "AI Tailor Engine",
        "status": "running",
        "message": "AI Engine is online"
    }
