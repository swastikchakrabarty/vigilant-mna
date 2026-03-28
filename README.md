# Vigilant M&A Engine

**A Full-Stack Accretion/Dilution Financial Modeling application built for Tier-1 Investment Bank standard precision.**

The Vigilant application provides dynamic, scenario-driven accretion/dilution analysis, enabling instant determination of pro-forma combined net income, issued shares, and transaction structures. Designed as a "Front Desk" interactive tool, it seamlessly integrates strict backend calculations with a professional low-latency Next.js terminal.

---

## The "Secret Sauce": Circular Reference Resolution

In M&A modeling, estimating transaction fees creates a systemic circular reference when fees are sized dynamically (e.g., Debt Issuance Fees). 

1. **The Problem:** The combined Enterprise Value dictates the amount of Debt needed to fund the cash portion of the transaction. But Debt Issuance Fees are a specific percentage of that New Debt. The New Debt needed *must therefore increase* to cover these very fees, which then increases the fees, which increases the debt further.
2. **The Solution:** Inside `/backend/finance_math.py`, Vigilant implements an advanced **Iterative Convergence Solver**. Instead of ignoring the mathematical loop or relying on Excel's "Iterative Calculations" checkmark, the FastAPI backend calculates the delta between required capital and generated debt until the tolerance approaches $0 (<$100 precision), solving the loop securely before pushing constraints to the presentation layer.

## Architecture

- **Backend (`/backend`)**: High-performance Python FastAPI engine built rigidly around `pydantic` schemas for absolute type-safe financial numbers. Calculates synergistic net-incomes, taxes, and loop-resolving transaction balances.
- **Frontend (`/frontend`)**: Next.js 14+ interface inspired by Bloomberg/PitchBook aesthetics. Integrates Tailwind CSS (Zinc layout), optimized client-side components, responsive sliders, and a heat-mapped 'Excel Data Table' recreating standard IB sensitivities.

## Deployment Ready

- **Frontend:** Optimized out of the box for `Vercel` via Next.js (`vercel.json` included).
- **Backend:** Optimized for `Render`/`Railway`/`Heroku`. Requirements properly tracked with standard `Procfile` (`web: uvicorn main:app --host 0.0.0.0 --port $PORT`).

## Local Setup

### 1. Database & Math API (Backend)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Front Desk Terminal (Frontend)
```bash
cd frontend
npm install
npm run dev
# The Terminal is now live at http://localhost:3000
```
