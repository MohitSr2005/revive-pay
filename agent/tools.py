from pathlib import Path
import joblib
import pandas as pd
import numpy as np
import shap

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "src" / "tuned_xgb_model.pkl"

model = joblib.load(MODEL_PATH)

THRESHOLD = 0.40


MODEL_FEATURES = [
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
    "estimated_delivery_gap_days",
]


def detect_revenue_risk(input_data: dict) -> dict:
    """
    Run the existing tuned XGBoost model and determine
    whether the transaction represents a recovery opportunity.
    """

    data = {
        feature: input_data[feature]
        for feature in MODEL_FEATURES
    }

    df = pd.DataFrame([data])

    probability = float(model.predict_proba(df)[0][1])

    prediction = int(probability >= THRESHOLD)

    if probability >= 0.80:
        risk_level = "HIGH"
    elif probability >= THRESHOLD:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return {
        "probability": probability,
        "prediction": prediction,
        "risk_level": risk_level,
    }
def get_shap_explanation(input_data: dict) -> list:
    """
    Generate a local SHAP explanation for one transaction.

    Returns the original model features ranked by their
    contribution to this specific prediction.
    """

    data = {
        feature: input_data[feature]
        for feature in MODEL_FEATURES
    }

    df = pd.DataFrame([data])

    # Get the preprocessing pipeline
    preprocessor = model.named_steps["preprocessor"]

    # Get the trained XGBoost model
    xgb_model = model.named_steps["model"]

    # Transform the raw transaction into model features
    transformed_data = preprocessor.transform(df)

    # Convert sparse matrix if necessary
    if hasattr(transformed_data, "toarray"):
        transformed_data = transformed_data.toarray()

    # Create TreeSHAP explainer
    explainer = shap.TreeExplainer(xgb_model)

    shap_values = explainer.shap_values(transformed_data)

    # Handle different SHAP output formats
    if isinstance(shap_values, list):
        shap_values = shap_values[0]

    shap_values = np.asarray(shap_values)

    if shap_values.ndim > 1:
        shap_values = shap_values[0]

    # Get transformed feature names
    feature_names = preprocessor.get_feature_names_out()

    # Aggregate one-hot encoded features back to original features
    aggregated = {}

    for feature_name, shap_value in zip(feature_names, shap_values):

        # Remove transformer prefix
        clean_name = feature_name

        if clean_name.startswith("num__"):
            original_feature = clean_name.replace("num__", "", 1)

        elif clean_name.startswith("cat__"):
            clean_name = clean_name.replace("cat__", "", 1)

            # Match categorical one-hot features
            matched_feature = None

            for original in [
                "primary_payment_type",
                "customer_city",
                "customer_state",
            ]:
                if clean_name.startswith(original + "_"):
                    matched_feature = original
                    break

            original_feature = matched_feature or clean_name

        else:
            original_feature = clean_name

        aggregated[original_feature] = (
            aggregated.get(original_feature, 0.0)
            + float(shap_value)
        )

    # Sort by absolute SHAP impact
    sorted_features = sorted(
        aggregated.items(),
        key=lambda x: abs(x[1]),
        reverse=True
    )

    explanations = []

    for feature, value in sorted_features[:10]:

        explanations.append({
            "feature": feature,
            "shap_value": round(float(value), 6),
            "impact": "positive" if value > 0 else "negative"
        })

    return explanations
def analyze_transaction(input_data: dict) -> dict:
    """
    Perform both risk detection and SHAP analysis.
    This will later become one of the Agent's workflow steps.
    """

    risk = detect_revenue_risk(input_data)

    explanations = get_shap_explanation(input_data)

    return {
        **risk,
        "explanations": explanations
    }
# ---------------------------------------------------------
# BOUNDED RECOVERY EXECUTION
# ---------------------------------------------------------

from datetime import datetime
import uuid
def create_payment_recovery(
    transaction_value: float,
    probability: float
) -> dict:
    """
    Create a bounded payment recovery workflow.

    This is a simulated execution tool for the RevivePay
    prototype. It does not charge, refund, or transfer money.
    """

    workflow_id = (
        f"RP-{datetime.now().strftime('%Y%m%d')}-"
        f"{uuid.uuid4().hex[:8].upper()}"
    )

    return {
        "workflow_id": workflow_id,
        "action": "payment_recovery",
        "transaction_value": transaction_value,
        "risk_probability": probability,
        "status": "initiated",
        "execution_mode": "simulated",
        "message": (
            "Payment recovery workflow initiated successfully."
        )
    }