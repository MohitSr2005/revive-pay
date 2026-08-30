from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
from pathlib import Path


# Create FastAPI application
app = FastAPI(
    title="RevivePay Prediction API",
    description="API for detecting recovery opportunities",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Load trained model
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "src" / "tuned_xgb_model.pkl"

model = joblib.load(MODEL_PATH)


from typing import Optional


# Input schema
class PredictionInput(BaseModel):
    total_payment_value: float
    payment_count: float = 1.0
    payment_installments: float = 1.0
    primary_payment_type: str = "credit_card"

    item_count: Optional[float] = None
    total_item_price: Optional[float] = None
    total_freight_value: Optional[float] = None
    unique_products: Optional[float] = None
    unique_sellers: Optional[float] = None

    customer_city: str
    customer_state: str

    purchase_year: int
    purchase_month: int
    purchase_day: int
    purchase_dayofweek: int
    purchase_hour: int

    approval_delay_hours: float = 0.0
    delivery_time_days: Optional[float] = None
    estimated_delivery_gap_days: Optional[float] = None


@app.get("/")
def home():
    return {
        "message": "RevivePay Prediction API is running"
    }


@app.post("/predict")
def predict(data: PredictionInput):

    # Convert input to DataFrame
    input_data = pd.DataFrame([data.model_dump()])

    # Prediction
   # Probability of recovery opportunity
    probability = model.predict_proba(input_data)[0][1]

    # RevivePay decision threshold
    THRESHOLD = 0.40

    # Classify using our selected threshold
    prediction = int(probability >= THRESHOLD)

    return {
        "recovery_opportunity": prediction,
        "recovery_probability": round(float(probability), 4)
    }