from fastapi import FastAPI
from app.api.routes import router
from datetime import datetime

app = FastAPI()
app.include_router(router)


@app.get("/")
async def root():
    return {"health": "ok", "datetime": datetime.now(),"status":"running....."}
