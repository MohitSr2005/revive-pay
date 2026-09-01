from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
from pathlib import Path
import shap
import numpy as np
from typing import Optional

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
# SHAP explainability
preprocessor = model.named_steps["preprocessor"]
xgb_model = model.named_steps["model"]

shap_explainer = shap.TreeExplainer(xgb_model)
def get_shap_explanation(data):

    # Original 19 features used by the model
    feature_cols = [
        "total_payment_value",
        "payment_count",
        "payment_installments",
        "primary_payment_type",
        "item_count",
        "total_item_price",
        "total_freight_value",
        "unique_products",
        "unique_sellers",
        "customer_city",
        "customer_state",
        "purchase_year",
        "purchase_month",
        "purchase_day",
        "purchase_dayofweek",
        "purchase_hour",
        "approval_delay_hours",
        "delivery_time_days",
        "estimated_delivery_gap_days"
    ]

    # Create one-row DataFrame
    X = pd.DataFrame([data], columns=feature_cols)

    # Transform using the SAME preprocessing pipeline used during training
    X_transformed = preprocessor.transform(X)

    # SHAP values for transformed features
    shap_values = shap_explainer.shap_values(X_transformed)

    # Convert to numpy array
    shap_values = np.asarray(shap_values)

    # For binary classification, handle possible 3D output
    if shap_values.ndim == 3:
        shap_values = shap_values[0, :, 1]

    elif shap_values.ndim == 2:
        shap_values = shap_values[0]

    # Get transformed feature names
    transformed_names = preprocessor.get_feature_names_out()

    # Aggregate SHAP values back to original features
    aggregated = {}

    for original_feature in feature_cols:
        aggregated[original_feature] = 0.0

    for name, value in zip(transformed_names, shap_values):

        # Numeric feature
        if name.startswith("num__"):
            original_feature = name.replace("num__", "", 1)

        # Categorical feature
        elif name.startswith("cat__"):
            categorical_name = name.replace("cat__", "", 1)

            # Find which original categorical feature this belongs to
            if categorical_name.startswith("primary_payment_type_"):
                original_feature = "primary_payment_type"

            elif categorical_name.startswith("customer_city_"):
                original_feature = "customer_city"

            elif categorical_name.startswith("customer_state_"):
                original_feature = "customer_state"

            else:
                continue

        else:
            continue

        if original_feature in aggregated:
            aggregated[original_feature] += float(value)

    # Convert to frontend-friendly format
    explanations = []

    for feature, shap_value in aggregated.items():

        explanations.append({
            "feature": feature,
            "shap_value": round(shap_value, 6),
            "impact": "positive" if shap_value > 0 else "negative"
        })

    # Sort by absolute SHAP impact
    explanations.sort(
        key=lambda x: abs(x["shap_value"]),
        reverse=True
    )

    # Return top 10
    return explanations[:10]

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
# Temporary SHAP explanation endpoint
@app.post("/explain")
def explain(input_data: PredictionInput):

    data = input_data.model_dump()

    explanations = get_shap_explanation(data)

    return {
        "explanations": explanations
    }