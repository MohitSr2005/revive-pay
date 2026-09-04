import joblib
import pandas as pd
import requests
from pathlib import Path


# ---------------------------------------------------------
# PATHS
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_PATH = (
    BASE_DIR
    / "data"
    / "processed"
    / "revive_pay_model_data.csv"
)

MODEL_PATH = (
    BASE_DIR
    / "src"
    / "tuned_xgb_model.pkl"
)


# ---------------------------------------------------------
# MODEL FEATURES
# ---------------------------------------------------------

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


# ---------------------------------------------------------
# LOAD DATA + MODEL
# ---------------------------------------------------------

df = pd.read_csv(DATA_PATH)
model = joblib.load(MODEL_PATH)

print("\nREVIVEPAY CONTROLLED HIGH-RISK API TEST")
print("========================================")

print(f"Dataset rows: {len(df)}")


# ---------------------------------------------------------
# FIND HIGH-RISK TRANSACTIONS
# ---------------------------------------------------------

X = df[MODEL_FEATURES]

df["model_probability"] = model.predict_proba(X)[:, 1]


# We need:
# 1. HIGH risk probability >= 0.80
# 2. Transaction value <= 500
candidates = df[
    (df["model_probability"] >= 0.80)
    & (df["total_payment_value"] <= 500)
].copy()


if candidates.empty:

    print("\nNo high-risk transaction under 500 found.")

    # Show highest-risk transactions instead
    candidates = (
        df.sort_values(
            "model_probability",
            ascending=False
        )
        .head(10)
    )

    print("\nTop available high-risk transactions:")
    print(
        candidates[
            [
                "total_payment_value",
                "model_probability"
            ]
        ].to_string(index=False)
    )

    raise SystemExit


# Select highest probability candidate
transaction = candidates.sort_values(
    "model_probability",
    ascending=False
).iloc[0]


# ---------------------------------------------------------
# PREPARE API INPUT
# ---------------------------------------------------------

payload = {}

for feature in MODEL_FEATURES:

    value = transaction[feature]

    # Convert numpy values into normal Python values
    if pd.isna(value):
        payload[feature] = None
    elif feature in [
        "primary_payment_type",
        "customer_city",
        "customer_state",
    ]:
        payload[feature] = str(value)
    elif feature in [
        "purchase_year",
        "purchase_month",
        "purchase_day",
        "purchase_dayofweek",
        "purchase_hour",
    ]:
        payload[feature] = int(value)
    else:
        payload[feature] = float(value)


print("\nSELECTED TRANSACTION")
print("--------------------")
print(
    "Transaction Value :",
    payload["total_payment_value"]
)

print(
    "Model Probability  :",
    round(float(transaction["model_probability"]), 4)
)

print(
    "Payment Type       :",
    payload["primary_payment_type"]
)

print(
    "Customer           :",
    payload["customer_city"],
    payload["customer_state"]
)


# ---------------------------------------------------------
# CALL FASTAPI AGENT
# ---------------------------------------------------------

API_URL = "http://127.0.0.1:8000/agent/analyze"

print("\nCalling RevivePay Agent API...")


response = requests.post(
    API_URL,
    json=payload,
    timeout=120
)


print("HTTP Status:", response.status_code)


# ---------------------------------------------------------
# DISPLAY RESULT
# ---------------------------------------------------------

if response.status_code != 200:

    print("\nAPI ERROR")
    print(response.text)
    raise SystemExit


result = response.json()

print("\nREVIVEPAY AGENT RESULT")
print("======================")

print(
    "Recovery Probability :",
    result.get("recovery_probability")
)

print(
    "Prediction           :",
    result.get("prediction")
)

print(
    "Risk Level           :",
    result.get("risk_level")
)

print(
    "Intervention         :",
    result.get("intervention")
)

print(
    "Action Allowed       :",
    result.get("action_allowed")
)

print(
    "Action Status        :",
    result.get("action_status")
)

print(
    "Workflow ID          :",
    result.get("workflow_id")
)

print(
    "Agent Message        :",
    result.get("agent_message")
)

print("\nROOT CAUSE")
print("----------")
print(result.get("root_cause"))

print("\nROOT CAUSE DETAILS")
print("------------------")

for detail in result.get("root_cause_details", []):
    print("-", detail)
print("\nAGENT ACTIVITY TIMELINE")
print("-----------------------")
result = response.json()
for activity in result.get("activity_log", []):
    print(
        f"[{activity['status'].upper():9}] "
        f"{activity['step']:22} | "
        f"{activity['message']}"
    )