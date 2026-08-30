# RevivePay — Fintech Payment Recovery Detection

**RevivePay** is a machine learning-powered fintech web platform designed to detect payment recovery opportunities for e-commerce transactions. It pairs an XGBoost classification pipeline with a modern, high-performance fintech dashboard.

---

## System Architecture

```
                                  ┌───────────────────────────────┐
                                  │      RevivePay Frontend       │
                                  │  (React 18 + Vite + Tailwind) │
                                  │     http://localhost:5173     │
                                  └───────────────┬───────────────┘
                                                  │
                                          POST /predict (JSON)
                                                  │
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │       FastAPI ML Server       │
                                  │     http://127.0.0.1:8000     │
                                  └───────────────┬───────────────┘
                                                  │
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │    Tuned XGBoost Pipeline     │
                                  │   (19 Features, Threshold: 0.4)│
                                  └───────────────────────────────┘
```

---

## Getting Started

### 1. Start the FastAPI Backend
Ensure your Python virtual environment is activated, then launch the FastAPI server:

```powershell
# From the project root
.rpay\Scripts\python.exe -m uvicorn api.main:app --reload --port 8000
```
- API Root: `http://127.0.0.1:8000/`
- Interactive API Docs (Swagger): `http://127.0.0.1:8000/docs`
- Prediction Endpoint: `POST http://127.0.0.1:8000/predict`

---

### 2. Start the React Frontend Dashboard
In a separate terminal, navigate into `frontend` and start the Vite dev server:

```powershell
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## Key Dashboard Features

1. **4 Structured Form Sections (All 19 Features)**:
   - **Transaction Details**: `total_payment_value`, `payment_count`, `payment_installments`, `primary_payment_type`
   - **Customer Details**: `customer_city`, `customer_state`
   - **Purchase Details**: `item_count`, `total_item_price`, `total_freight_value`, `unique_products`, `unique_sellers`, `purchase_year`, `purchase_month`, `purchase_day`, `purchase_dayofweek`, `purchase_hour`
   - **Delivery & Logistics**: `approval_delay_hours`, `delivery_time_days`, `estimated_delivery_gap_days`

2. **Demonstration Presets**:
   - One-click buttons to load test scenarios (e.g. *High Recovery Opportunity*, *Standard Healthy Transaction*, *High-Value Installment Case*).

3. **Classification & Risk Meter**:
   - Prominent **YES / NO** Opportunity decision badge.
   - Exact calibrated **Recovery Probability** (`XX.XX%`).
   - Visual **40.0% Decision Threshold** marker.
   - Recommended fintech intervention actions (payment retry routing, customer outreach, logistics escalation).

4. **Future-Proof SHAP Explainability**:
   - Modular architecture hook and feature impact breakdown container ready for tree-based SHAP plot integration.

5. **Session History Drawer**:
   - Real-time session history log with 1-click reload back into the form.

6. **Connection Health Diagnostics**:
   - Live backend status monitoring with latency indicator and automatic error recovery.
