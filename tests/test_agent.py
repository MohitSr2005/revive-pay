from agent.tools import analyze_transaction
from agent.root_cause import analyze_root_cause
from agent.intervention import select_intervention
test_transaction = {
    "total_payment_value": 150.0,
    "payment_count": 1,
    "payment_installments": 2,
    "primary_payment_type": "credit_card",
    "item_count": 1,
    "total_item_price": 130.0,
    "total_freight_value": 20.0,
    "unique_products": 1,
    "unique_sellers": 1,
    "customer_city": "sao paulo",
    "customer_state": "SP",
    "purchase_year": 2018,
    "purchase_month": 5,
    "purchase_day": 10,
    "purchase_dayofweek": 3,
    "purchase_hour": 14,
    "approval_delay_hours": 1.0,
    "delivery_time_days": 5.0,
    "estimated_delivery_gap_days": 2.0,
}


result = analyze_transaction(test_transaction)
root_cause_result = analyze_root_cause(
    probability=result["probability"],
    risk_level=result["risk_level"],
    explanations=result["explanations"]
)
intervention_result = select_intervention(
    probability=result["probability"],
    risk_level=result["risk_level"],
    root_cause=root_cause_result["root_cause"],
    explanations=result["explanations"]
)

print("\nREVIVEPAY AGENT — TRANSACTION ANALYSIS")
print("---------------------------------------")

print(f"Probability : {result['probability']:.4f}")
print(f"Prediction  : {result['prediction']}")
print(f"Risk Level  : {result['risk_level']}")

print("\nTOP SHAP DRIVERS")
print("----------------")

for explanation in result["explanations"]:
    print(
        f"{explanation['feature']:30} "
        f"{explanation['shap_value']:>10.4f} "
        f"{explanation['impact']}"
    )
print("\nROOT CAUSE ANALYSIS")
print("-------------------")

print(root_cause_result["root_cause"])

print("\nKey Drivers:")

for detail in root_cause_result["root_cause_details"]:
    print(f"- {detail}")

print("\nINTERVENTION DECISION")
print("---------------------")

print(
    f"Recommended Action : "
    f"{intervention_result['intervention']}"
)

print(
    f"Reason : "
    f"{intervention_result['intervention_reason']}"
)