import sys
from pathlib import Path

import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from agent.graph import build_recovery_agent


DATASET_PATH = BASE_DIR / "data" / "processed" / "revive_pay_model_data.csv"


FEATURES = [
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


def build_transaction(row):
    transaction = {}

    for feature in FEATURES:
        value = row[feature]

        if pd.isna(value):
            transaction[feature] = None
        else:
            transaction[feature] = value

    return transaction


def print_result(title, result, order_id):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)

    print(f"Order ID        : {order_id}")
    print(f"Probability     : {result.get('probability'):.4f}")
    print(f"Prediction      : {result.get('prediction')}")
    print(f"Risk Level      : {result.get('risk_level')}")
    print(f"Intervention    : {result.get('intervention')}")
    print(f"Action Allowed  : {result.get('action_allowed')}")
    print(f"Action Status   : {result.get('action_status')}")
    print(f"Workflow ID     : {result.get('workflow_id')}")
    print(f"Review ID       : {result.get('review_id')}")


def main():

    print("\n" + "#" * 70)
    print("REVIVEPAY FINAL AGENT VERIFICATION")
    print("#" * 70)

    print(f"\nDataset: {DATASET_PATH}")

    # ---------------------------------------------------------
    # LOAD REAL DATASET
    # ---------------------------------------------------------

    df = pd.read_csv(DATASET_PATH)

    print(f"Dataset rows: {len(df):,}")

    # ---------------------------------------------------------
    # LOAD AGENT
    # ---------------------------------------------------------

    agent = build_recovery_agent()

    # ---------------------------------------------------------
    # FIND REPRESENTATIVE REAL TRANSACTIONS
    # ---------------------------------------------------------

    # LOW = lowest recovery probability
    # MEDIUM = closest to 0.60
    # HIGH = highest recovery probability

    from api.main import model

    model_input = df[FEATURES].copy()

    probabilities = model.predict_proba(model_input)[:, 1]

    df = df.copy()
    df["_probability"] = probabilities

    low_row = df.loc[df["_probability"].idxmin()]

    medium_row = df.loc[
        (df["_probability"] - 0.60).abs().idxmin()
    ]

    high_row = df.loc[df["_probability"].idxmax()]

    scenarios = [
        ("LOW-RISK SCENARIO", low_row),
        ("MEDIUM-RISK SCENARIO", medium_row),
        ("HIGH-RISK SCENARIO", high_row),
    ]

    results = {}

    # ---------------------------------------------------------
    # RUN REAL TRANSACTIONS THROUGH THE AGENT
    # ---------------------------------------------------------

    for title, row in scenarios:

        order_id = row["order_id"]

        transaction = build_transaction(row)

        result = agent.invoke({
            "input_data": transaction
        })

        results[title] = result

        print_result(
            title,
            result,
            order_id
        )

        print(
            f"Ground Truth    : "
            f"{row['recovery_opportunity']}"
        )

        print(
            f"Revenue at Risk : "
            f"{row['revenue_at_risk']}"
        )

    # ---------------------------------------------------------
    # VERIFICATION CHECKS
    # ---------------------------------------------------------

    print("\n" + "=" * 70)
    print("VERIFICATION CHECKS")
    print("=" * 70)

    checks = []

    low_result = results["LOW-RISK SCENARIO"]
    medium_result = results["MEDIUM-RISK SCENARIO"]
    high_result = results["HIGH-RISK SCENARIO"]

    # LOW
    checks.append((
        "Low-risk transaction monitored",
        low_result.get("action_status") == "monitoring"
    ))

    checks.append((
        "Low-risk transaction does not execute recovery",
        low_result.get("workflow_id") is None
    ))

    # MEDIUM
    checks.append((
        "Medium-risk transaction requires human review",
        medium_result.get("action_status") == "human_review"
    ))

    checks.append((
        "Human review ID generated",
        bool(medium_result.get("review_id"))
    ))

    # HIGH
    checks.append((
        "High-risk transaction detected",
        high_result.get("prediction") == 1
    ))

    checks.append((
        "High-risk recovery executed",
        high_result.get("action_status") == "initiated"
    ))

    checks.append((
        "Recovery workflow created",
        bool(high_result.get("workflow_id"))
    ))

    # EXPLAINABILITY
    checks.append((
        "SHAP explanation generated",
        bool(high_result.get("explanations"))
    ))

    checks.append((
        "Root cause generated",
        bool(high_result.get("root_cause"))
    ))

    # INTERVENTION
    checks.append((
        "Intervention selected",
        bool(high_result.get("intervention"))
    ))

    # ACTIVITY LOG
    checks.append((
        "Agent activity timeline generated",
        len(high_result.get("activity_log", [])) >= 5
    ))

    # ---------------------------------------------------------
    # PRINT RESULTS
    # ---------------------------------------------------------

    passed = 0

    for check_name, passed_check in checks:

        if passed_check:
            print(f"[PASS] {check_name}")
            passed += 1
        else:
            print(f"[FAIL] {check_name}")

    print("\n" + "-" * 70)

    print(
        f"RESULT: {passed}/{len(checks)} checks passed"
    )

    print("-" * 70)

    if passed == len(checks):

        print(
            "\nALL CORE AGENT VERIFICATION CHECKS PASSED."
        )

    else:

        print(
            "\nSOME VERIFICATION CHECKS FAILED."
        )


if __name__ == "__main__":
    main()