from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
from pathlib import Path
import shap
import numpy as np
from typing import Optional

from agent.graph import build_recovery_agent

from agent.review import (
    get_review,
    approve_review,
    reject_review,
)

from agent.tools import create_payment_recovery


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="RevivePay Prediction API",
    description="API for detecting and recovering revenue opportunities",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = (
    BASE_DIR
    / "src"
    / "tuned_xgb_model.pkl"
)


# ============================================================
# LOAD TRAINED MODEL
# ============================================================

model = joblib.load(MODEL_PATH)


# ============================================================
# BUILD REVIVEPAY LANGGRAPH AGENT
# ============================================================

recovery_agent = build_recovery_agent()


# ============================================================
# SHAP EXPLAINABILITY
# ============================================================

preprocessor = model.named_steps["preprocessor"]

xgb_model = model.named_steps["model"]

shap_explainer = shap.TreeExplainer(
    xgb_model
)


def get_shap_explanation(data):

    # --------------------------------------------------------
    # Original 19 features used by the model
    # --------------------------------------------------------

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
        "estimated_delivery_gap_days",
    ]

    # --------------------------------------------------------
    # Create one-row DataFrame
    # --------------------------------------------------------

    X = pd.DataFrame(
        [data],
        columns=feature_cols
    )

    # --------------------------------------------------------
    # Apply SAME preprocessing used during training
    # --------------------------------------------------------

    X_transformed = preprocessor.transform(X)

    # --------------------------------------------------------
    # Calculate SHAP values
    # --------------------------------------------------------

    shap_values = shap_explainer.shap_values(
        X_transformed
    )

    shap_values = np.asarray(
        shap_values
    )

    # --------------------------------------------------------
    # Handle binary classification SHAP output
    # --------------------------------------------------------

    if shap_values.ndim == 3:

        shap_values = shap_values[
            0,
            :,
            1
        ]

    elif shap_values.ndim == 2:

        shap_values = shap_values[
            0
        ]

    # --------------------------------------------------------
    # Get transformed feature names
    # --------------------------------------------------------

    transformed_names = (
        preprocessor
        .get_feature_names_out()
    )

    # --------------------------------------------------------
    # Aggregate transformed SHAP values
    # back to original features
    # --------------------------------------------------------

    aggregated = {}

    for original_feature in feature_cols:

        aggregated[
            original_feature
        ] = 0.0

    for name, value in zip(
        transformed_names,
        shap_values
    ):

        # Numeric feature
        if name.startswith("num__"):

            original_feature = (
                name.replace(
                    "num__",
                    "",
                    1
                )
            )

        # Categorical feature
        elif name.startswith("cat__"):

            categorical_name = (
                name.replace(
                    "cat__",
                    "",
                    1
                )
            )

            if categorical_name.startswith(
                "primary_payment_type_"
            ):

                original_feature = (
                    "primary_payment_type"
                )

            elif categorical_name.startswith(
                "customer_city_"
            ):

                original_feature = (
                    "customer_city"
                )

            elif categorical_name.startswith(
                "customer_state_"
            ):

                original_feature = (
                    "customer_state"
                )

            else:
                continue

        else:
            continue

        if original_feature in aggregated:

            aggregated[
                original_feature
            ] += float(value)

    # --------------------------------------------------------
    # Convert to frontend-friendly format
    # --------------------------------------------------------

    explanations = []

    for feature, shap_value in (
        aggregated.items()
    ):

        explanations.append(
            {
                "feature": feature,
                "shap_value": round(
                    shap_value,
                    6
                ),
                "impact": (
                    "positive"
                    if shap_value > 0
                    else "negative"
                ),
            }
        )

    # --------------------------------------------------------
    # Sort by absolute SHAP impact
    # --------------------------------------------------------

    explanations.sort(
        key=lambda x: abs(
            x["shap_value"]
        ),
        reverse=True
    )

    # --------------------------------------------------------
    # Return top 10
    # --------------------------------------------------------

    return explanations[:10]


# ============================================================
# INPUT SCHEMA
# ============================================================

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


# ============================================================
# HEALTH / HOME
# ============================================================

@app.get("/")
def home():

    return {
        "message": "RevivePay Prediction API is running"
    }


# ============================================================
# ORIGINAL PREDICTION ENDPOINT
# ============================================================

@app.post("/predict")
def predict(
    data: PredictionInput
):

    # Convert input to DataFrame
    input_data = pd.DataFrame(
        [data.model_dump()]
    )

    # Predict probability
    probability = (
        model.predict_proba(
            input_data
        )[0][1]
    )

    # RevivePay decision threshold
    THRESHOLD = 0.40

    # Classification
    prediction = int(
        probability >= THRESHOLD
    )

    return {
        "recovery_opportunity": prediction,
        "recovery_probability": round(
            float(probability),
            4
        ),
    }


# ============================================================
# ORIGINAL SHAP ENDPOINT
# ============================================================

@app.post("/explain")
def explain(
    input_data: PredictionInput
):

    data = input_data.model_dump()

    explanations = (
        get_shap_explanation(
            data
        )
    )

    return {
        "explanations": explanations
    }


# ============================================================
# REVIVEPAY AGENT ENDPOINT
# ============================================================

@app.post("/agent/analyze")
def analyze_with_agent(
    input_data: PredictionInput
):

    transaction = (
        input_data.model_dump()
    )

    # --------------------------------------------------------
    # Run complete LangGraph recovery agent
    # --------------------------------------------------------

    result = recovery_agent.invoke(
        {
            "input_data": transaction
        }
    )

    # --------------------------------------------------------
    # Return agent decision
    # --------------------------------------------------------

    return {

        # Risk
        "recovery_probability": round(
            float(
                result.get(
                    "probability",
                    0.0
                )
            ),
            4
        ),

        "prediction": result.get(
            "prediction"
        ),

        "risk_level": result.get(
            "risk_level"
        ),

        # Explainability
        "explanations": result.get(
            "explanations",
            []
        ),

        # Root cause
        "root_cause": result.get(
            "root_cause"
        ),

        "root_cause_details": result.get(
            "root_cause_details",
            []
        ),

        # Intervention
        "intervention": result.get(
            "intervention"
        ),

        "intervention_reason": result.get(
            "intervention_reason"
        ),

        # Policy / execution
        "action_allowed": result.get(
            "action_allowed",
            False
        ),

        "action_status": result.get(
            "action_status"
        ),

        "workflow_id": result.get(
            "workflow_id"
        ),

        # Human-in-the-loop
        "review_id": result.get(
            "review_id"
        ),

        "review_decision": result.get(
            "review_decision"
        ),

        # Agent message
        "agent_message": result.get(
            "agent_message"
        ),

        # Activity timeline
        "activity_log": result.get(
            "activity_log",
            []
        ),
    }


# ============================================================
# HUMAN REVIEW — GET REQUEST
# ============================================================

@app.get(
    "/agent/review/{review_id}"
)
def get_human_review(
    review_id: str
):

    review = get_review(
        review_id
    )

    if review is None:

        return {
            "review_id": review_id,
            "status": "not_found",
            "message": (
                "Human review request "
                "was not found."
            ),
        }

    return review


# ============================================================
# HUMAN REVIEW — APPROVE
# ============================================================

@app.post(
    "/agent/review/{review_id}/approve"
)
def approve_human_review(
    review_id: str
):

    try:

        # ----------------------------------------------------
        # Validate and record human approval
        # ----------------------------------------------------

        review = approve_review(
            review_id
        )

        transaction = (
            review["transaction"]
        )

        transaction_value = float(
            transaction[
                "total_payment_value"
            ]
        )

        probability = float(
            review["probability"]
        )

        # ----------------------------------------------------
        # Execute BOUNDED recovery action
        # ----------------------------------------------------

        recovery = (
            create_payment_recovery(
                transaction_value=(
                    transaction_value
                ),
                probability=(
                    probability
                ),
            )
        )

        return {

            "review_id": review_id,

            "decision": "approved",

            "action_status": (
                recovery["status"]
            ),

            "workflow_id": (
                recovery["workflow_id"]
            ),

            "message": (
                "Human approval received. "
                "Bounded recovery workflow "
                "initiated."
            ),
        }

    except ValueError as exc:

        return {

            "review_id": review_id,

            "decision": "error",

            "message": str(exc),
        }


# ============================================================
# HUMAN REVIEW — REJECT
# ============================================================

@app.post(
    "/agent/review/{review_id}/reject"
)
def reject_human_review(
    review_id: str
):

    try:

        # ----------------------------------------------------
        # Record human rejection
        # ----------------------------------------------------

        reject_review(
            review_id
        )

        return {

            "review_id": review_id,

            "decision": "rejected",

            "action_status": "blocked",

            "workflow_id": None,

            "message": (
                "Human reviewer rejected "
                "the recovery action. "
                "No recovery workflow "
                "was executed."
            ),
        }

    except ValueError as exc:

        return {

            "review_id": review_id,

            "decision": "error",

            "message": str(exc),
        }