from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from schema import CompanyProfile, DealInputs, DealResponse
from finance_math import FinanceEngine, generate_sensitivity_table

app = FastAPI(
    title="Vigilant M&A Engine API",
    description="Full-stack M&A Accretion/Dilution Financial Calculator",
    version="1.0",
    docs_url="/docs"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-vercel-domain-placeholder.vercel.app", "*"], # Allow local dev and prod domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root_status():
    return {"message": "Backend Active"}

class DealRequestPayload(BaseModel):
    buyer: CompanyProfile
    target: CompanyProfile
    deal: DealInputs

@app.post("/calculate", response_model=DealResponse)
async def analyze_deal(payload: DealRequestPayload):
    try:
        if abs(payload.deal.percent_cash + payload.deal.percent_stock - 1.0) > 0.001:
            raise HTTPException(status_code=400, detail="Cash and Stock percentages must sum to 1.0")
            
        engine = FinanceEngine(payload.buyer, payload.target, payload.deal)
        metrics = engine.resolve_deal_structure()
        sensitivities = generate_sensitivity_table(payload.buyer, payload.target, payload.deal)
        
        return DealResponse(
            metrics=metrics,
            sensitivities=sensitivities
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "operational", "engine": "Vigilant M&A Engine FastAPI"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
