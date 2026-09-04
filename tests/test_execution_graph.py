from langgraph.graph import StateGraph, START, END

from agent.state import AgentState
from agent.graph import (
    policy_checker,
    route_after_policy,
    policy_blocked,
    policy_human_review,
    policy_approved,
    execute_recovery,
)


workflow = StateGraph(AgentState)

workflow.add_node("policy_checker", policy_checker)
workflow.add_node("policy_blocked", policy_blocked)
workflow.add_node("policy_human_review", policy_human_review)
workflow.add_node("policy_approved", policy_approved)
workflow.add_node("execute_recovery", execute_recovery)

workflow.add_edge(START, "policy_checker")

workflow.add_conditional_edges(
    "policy_checker",
    route_after_policy,
    {
        "blocked": "policy_blocked",
        "human_review": "policy_human_review",
        "approved": "policy_approved",
    },
)

workflow.add_edge("policy_blocked", END)
workflow.add_edge("policy_human_review", END)

workflow.add_edge(
    "policy_approved",
    "execute_recovery"
)

workflow.add_edge(
    "execute_recovery",
    END
)

agent = workflow.compile()


test_state = {
    "input_data": {
        "total_payment_value": 100.0
    },
    "probability": 0.90,
    "prediction": 1,
    "risk_level": "HIGH",
    "intervention": "payment_recovery",
}

result = agent.invoke(test_state)


print("\nREVIVEPAY AGENT EXECUTION TEST")
print("--------------------------------")
print("Risk Probability :", result["probability"])
print("Risk Level       :", result["risk_level"])
print("Intervention     :", result["intervention"])
print("Action Status    :", result["action_status"])
print("Workflow ID      :", result["workflow_id"])
print("Agent Message    :", result["agent_message"])