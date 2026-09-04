from agent.graph import build_recovery_agent


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


agent = build_recovery_agent()


initial_state = {
    "input_data": test_transaction
}


result = agent.invoke(initial_state)


print("\n======================================")
print("       REVIVEPAY AI AGENT")
print("======================================")

print(f"\nRisk Probability : {result['probability']:.4f}")
print(f"Risk Level       : {result['risk_level']}")

print(
    f"\nIntervention     : "
    f"{result.get('intervention', 'N/A')}"
)

print(
    f"Status           : "
    f"{result.get('action_status', 'N/A')}"
)

print(
    f"\nAgent Message:\n"
    f"{result.get('agent_message', 'No message')}"
)

if result.get("root_cause"):
    print(
        f"\nRoot Cause:\n"
        f"{result['root_cause']}"
    )