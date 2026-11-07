from fastapi import APIRouter
from backend.app.api.routes import health, model, predict, history, analytics, reports

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(model.router, prefix="/model", tags=["Model"])
api_router.include_router(predict.router, prefix="/predict", tags=["Prediction"])
api_router.include_router(history.router, prefix="/history", tags=["History"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
