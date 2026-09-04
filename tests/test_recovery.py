from agent.tools import create_payment_recovery


print("\n======================================")
print("      REVIVEPAY RECOVERY ENGINE")
print("======================================")


result = create_payment_recovery(
    transaction_value=100.0,
    probability=0.90
)


print("\nRECOVERY WORKFLOW")
print("-----------------")

print(f"Workflow ID      : {result['workflow_id']}")
print(f"Action           : {result['action']}")
print(f"Transaction Value: {result['transaction_value']}")
print(f"Risk Probability : {result['risk_probability']}")
print(f"Status           : {result['status']}")
print(f"Execution Mode   : {result['execution_mode']}")
print(f"Message          : {result['message']}")