from langgraph.graph import StateGraph, START, END

from agent.state import AgentState
from agent.graph import (
    policy_checker,
    route_after_policy,
    policy_blocked,
    policy_human_review,
    policy_approved,
)


# ---------------------------------------------------------
# BUILD A SMALL POLICY-ONLY TEST GRAPH
# ---------------------------------------------------------

def build_policy_test_graph():

    workflow = StateGraph(AgentState)

    workflow.add_node(
        "policy_checker",
        policy_checker
    )

    workflow.add_node(
        "policy_blocked",
        policy_blocked
    )

    workflow.add_node(
        "policy_human_review",
        policy_human_review
    )

    workflow.add_node(
        "policy_approved",
        policy_approved
    )

    workflow.add_edge(
        START,
        "policy_checker"
    )

    workflow.add_conditional_edges(
        "policy_checker",
        route_after_policy,
        {
            "blocked": "policy_blocked",
            "human_review": "policy_human_review",
            "approved": "policy_approved",
        },
    )

    workflow.add_edge(
        "policy_blocked",
        END
    )

    workflow.add_edge(
        "policy_human_review",
        END
    )

    workflow.add_edge(
        "policy_approved",
        END
    )

    return workflow.compile()


agent = build_policy_test_graph()


# =========================================================
# TEST 1 — HIGH RISK + SAFE VALUE
# Expected: APPROVED
# =========================================================

safe_state = {
    "input_data": {
        "total_payment_value": 100.0
    },

    "probability": 0.90,
    "prediction": 1,
    "risk_level": "HIGH",

    "intervention": "payment_recovery",
    "intervention_reason": "High recovery opportunity detected.",
}


print("\n======================================")
print(" TEST 1 — HIGH RISK / SAFE VALUE")
print("======================================")

result = agent.invoke(safe_state)

print(f"Probability       : {result['probability']}")
print(f"Risk Level        : {result['risk_level']}")
print(f"Intervention      : {result['intervention']}")
print(f"Policy Status     : {result['action_status']}")
print(f"Action Allowed    : {result['action_allowed']}")
print(f"Agent Message     : {result['agent_message']}")


# =========================================================
# TEST 2 — HIGH RISK + HIGH VALUE
# Expected: HUMAN REVIEW
# =========================================================

high_value_state = {
    "input_data": {
        "total_payment_value": 1000.0
    },

    "probability": 0.90,
    "prediction": 1,
    "risk_level": "HIGH",

    "intervention": "payment_recovery",
    "intervention_reason": "High recovery opportunity detected.",
    "root_cause": "Transaction value exceeds the automatic recovery limit.",
    "root_cause_details": [
        "High-value recovery requires additional human oversight."
    ],
}


print("\n======================================")
print(" TEST 2 — HIGH RISK / HIGH VALUE")
print("======================================")

result = agent.invoke(high_value_state)

print(f"Probability       : {result['probability']}")
print(f"Risk Level        : {result['risk_level']}")
print(f"Intervention      : {result['intervention']}")
print(f"Policy Status     : {result['action_status']}")
print(f"Action Allowed    : {result['action_allowed']}")
print(f"Agent Message     : {result['agent_message']}")