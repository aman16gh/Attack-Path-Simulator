from fastapi import FastAPI
from database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Attack Path Simulator")

@app.get("/")
async def root():
    return {"message": "API is running"}