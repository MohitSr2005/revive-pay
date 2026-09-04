from agent.policy import validate_recovery_action


print("\n======================================")
print("       REVIVEPAY POLICY ENGINE")
print("======================================")


# TEST 1 — LOW RISK
result = validate_recovery_action(
    probability=0.20,
    intervention="payment_recovery",
    transaction_value=100.0
)

print("\nTEST 1 — LOW RISK")
print("-----------------")
print(result)


# TEST 2 — MEDIUM RISK
result = validate_recovery_action(
    probability=0.65,
    intervention="payment_recovery",
    transaction_value=100.0
)

print("\nTEST 2 — MEDIUM RISK")
print("--------------------")
print(result)


# TEST 3 — HIGH RISK / SAFE VALUE
result = validate_recovery_action(
    probability=0.90,
    intervention="payment_recovery",
    transaction_value=100.0
)

print("\nTEST 3 — HIGH RISK / SAFE VALUE")
print("--------------------------------")
print(result)


# TEST 4 — HIGH RISK / HIGH VALUE
result = validate_recovery_action(
    probability=0.90,
    intervention="payment_recovery",
    transaction_value=1000.0
)

print("\nTEST 4 — HIGH RISK / HIGH VALUE")
print("--------------------------------")
print(result)