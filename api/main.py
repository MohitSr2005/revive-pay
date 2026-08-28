from fastapi import FastAPI
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


# Load trained model
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "src" / "tuned_xgb_model.pkl"

model = joblib.load(MODEL_PATH)


# Input schema
class PredictionInput(BaseModel):
    total_payment_value: float
    payment_count: float
    payment_installments: float
    primary_payment_type: str

    item_count: float
    total_item_price: float
    total_freight_value: float
    unique_products: float
    unique_sellers: float

    customer_city: str
    customer_state: str

    purchase_year: int
    purchase_month: int
    purchase_day: int
    purchase_dayofweek: int
    purchase_hour: int

    approval_delay_hours: float
    delivery_time_days: float
    estimated_delivery_gap_days: float


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
    prediction = model.predict(input_data)[0]

    # Probability of recovery opportunity
    probability = model.predict_proba(input_data)[0][1]

    return {
        "recovery_opportunity": int(prediction),
        "recovery_probability": round(float(probability), 4)
    }