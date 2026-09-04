from langgraph.graph import StateGraph, START, END

from agent.state import AgentState
from agent.tools import detect_revenue_risk, get_shap_explanation,create_payment_recovery
from agent.root_cause import analyze_root_cause
from agent.intervention import select_intervention
from agent.policy import validate_recovery_action
from agent.review import create_review_request
def add_activity(
    state: AgentState,
    step: str,
    message: str,
    status: str = "completed",
) -> list:
    activity_log = list(
        state.get("activity_log", [])
    )

    activity_log.append({
        "step": step,
        "message": message,
        "status": status,
    })

    return activity_log

# ---------------------------------------------------------
# NODE 1 — RISK DETECTION
# ---------------------------------------------------------

def risk_detector(state: AgentState) -> AgentState:
    result = detect_revenue_risk(
        state["input_data"]
    )

    activity_log = add_activity(
        state,
        "risk_detection",
        (
            f"Revenue risk detected: "
            f"{result['probability']:.2%} probability, "
            f"{result['risk_level']} risk."
        ),
    )

    return {
        **state,
        "probability": result["probability"],
        "prediction": result["prediction"],
        "risk_level": result["risk_level"],
        "activity_log": activity_log,
    }


# ---------------------------------------------------------
# NODE 2 — SHAP EXPLANATION
# ---------------------------------------------------------

def explain_transaction(state: AgentState) -> AgentState:
    explanations = get_shap_explanation(
        state["input_data"]
    )

    top_driver = (
        explanations[0]["feature"]
        if explanations
        else "No significant driver identified"
    )

    activity_log = add_activity(
        state,
        "shap_analysis",
        (
            f"SHAP analysis completed. "
            f"Top risk driver: {top_driver}."
        ),
    )

    return {
        **state,
        "explanations": explanations,
        "activity_log": activity_log,
    }


# ---------------------------------------------------------
# NODE 3 — ROOT CAUSE ANALYSIS
# ---------------------------------------------------------

def root_cause_analyzer(state: AgentState) -> AgentState:
    result = analyze_root_cause(
        probability=state["probability"],
        risk_level=state["risk_level"],
        explanations=state["explanations"],
    )

    activity_log = add_activity(
        state,
        "root_cause",
        (
            "Root cause identified: "
            f"{result['root_cause']}"
        ),
    )

    return {
        **state,
        "root_cause": result["root_cause"],
        "root_cause_details": result["root_cause_details"],
        "activity_log": activity_log,
    }


# ---------------------------------------------------------
# NODE 4 — INTERVENTION PLANNER
# ---------------------------------------------------------

def intervention_planner(state: AgentState) -> AgentState:
    result = select_intervention(
        probability=state["probability"],
        risk_level=state["risk_level"],
        root_cause=state["root_cause"],
        explanations=state["explanations"],
    )

    activity_log = add_activity(
        state,
        "intervention_planning",
        (
            f"Intervention selected: "
            f"{result['intervention']}."
        ),
    )

    return {
        **state,
        "intervention": result["intervention"],
        "intervention_reason": result["intervention_reason"],
        "activity_log": activity_log,
    }

# ---------------------------------------------------------
# NODE 5 — POLICY CHECK
# ---------------------------------------------------------

def policy_checker(state: AgentState) -> AgentState:
    transaction_value = float(
        state["input_data"]["total_payment_value"]
    )

    result = validate_recovery_action(
        probability=state["probability"],
        intervention=state["intervention"],
        transaction_value=transaction_value,
    )

    activity_log = add_activity(
        state,
        "policy_check",
        (
            f"Policy evaluation: "
            f"{result['policy_status']}."
        ),
    )

    return {
        **state,
        "action_allowed": result["action_allowed"],
        "action_status": result["policy_status"],
        "agent_message": result["policy_reason"],
        "activity_log": activity_log,
    }
# ---------------------------------------------------------
# ROUTER — POLICY DECISION
# ---------------------------------------------------------

def route_after_policy(state: AgentState) -> str:

    if state["action_status"] == "approved":
        return "approved"

    if state["action_status"] == "human_review":
        return "human_review"

    return "blocked"
# ---------------------------------------------------------
# POLICY OUTCOME — BLOCKED
# ---------------------------------------------------------

def policy_blocked(state: AgentState) -> AgentState:
    activity_log = add_activity(
        state,
        "policy_blocked",
        "Recovery action blocked by RevivePay policy.",
        status="blocked",
    )

    return {
        **state,
        "action_allowed": False,
        "action_status": "blocked",
        "agent_message": "Recovery action blocked by RevivePay policy.",
        "activity_log": activity_log,
    }


# ---------------------------------------------------------
# POLICY OUTCOME — HUMAN REVIEW
# ---------------------------------------------------------

def policy_human_review(state: AgentState) -> AgentState:

    transaction = state["input_data"]

    review = create_review_request(
        transaction=transaction,
        probability=state["probability"],
        intervention=state["intervention"],
        root_cause=state["root_cause"],
    )

    review_id = review["review_id"]

    activity_log = add_activity(
        state,
        "human_review",
        (
            f"Human approval required. "
            f"Review ID: {review_id}."
        ),
        status="waiting",
    )

    return {
        **state,
        "action_allowed": False,
        "action_status": "human_review",
        "review_id": review_id,
        "review_decision": "pending",
        "agent_message": (
            "Recovery action requires human approval "
            "before execution."
        ),
        "activity_log": activity_log,
    }


# ---------------------------------------------------------
# POLICY OUTCOME — APPROVED
# ---------------------------------------------------------

def policy_approved(state: AgentState) -> AgentState:
    activity_log = add_activity(
        state,
        "policy_approved",
        "Recovery action approved for bounded automatic execution.",
    )

    return {
        **state,
        "action_allowed": True,
        "action_status": "approved",
        "agent_message": "Recovery action approved by RevivePay policy and ready for bounded execution.",
        "activity_log": activity_log,
    }
# ---------------------------------------------------------
# NODE — EXECUTE BOUNDED RECOVERY
# ---------------------------------------------------------

def execute_recovery(state: AgentState) -> AgentState:
    transaction_value = float(
        state["input_data"]["total_payment_value"]
    )

    result = create_payment_recovery(
        transaction_value=transaction_value,
        probability=state["probability"],
    )

    activity_log = add_activity(
        state,
        "recovery_execution",
        (
            f"Recovery workflow initiated: "
            f"{result['workflow_id']}."
        ),
    )

    return {
        **state,
        "workflow_id": result["workflow_id"],
        "action_status": result["status"],
        "agent_message": result["message"],
        "activity_log": activity_log,
    }


# ---------------------------------------------------------
# ROUTER — SHOULD WE INTERVENE?
# ---------------------------------------------------------

def route_after_risk_detection(state: AgentState) -> str:

    if state["probability"] >= 0.40:
        return "explain"

    return "monitor"


# ---------------------------------------------------------
# MONITOR NODE
# ---------------------------------------------------------

def monitor_transaction(state: AgentState) -> AgentState:
    activity_log = add_activity(
        state,
        "monitoring",
        "Risk is below the recovery threshold. Transaction will be monitored.",
    )

    return {
        **state,
        "intervention": "monitor",
        "intervention_reason": "Risk is below the recovery threshold. No active recovery intervention is required.",
        "action_allowed": False,
        "action_status": "monitoring",
        "agent_message": "Transaction does not require active recovery. Continue monitoring.",
        "activity_log": activity_log,
    }


# ---------------------------------------------------------
# BUILD LANGGRAPH
# ---------------------------------------------------------

def build_recovery_agent():

    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node(
        "risk_detector",
        risk_detector
    )

    workflow.add_node(
        "explain_transaction",
        explain_transaction
    )

    workflow.add_node(
        "root_cause_analyzer",
        root_cause_analyzer
    )

    workflow.add_node(
        "intervention_planner",
        intervention_planner
    )

    workflow.add_node(
        "monitor_transaction",
        monitor_transaction
    )
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
    workflow.add_node(
        "execute_recovery",
        execute_recovery
    )


    # Starting point
    workflow.add_edge(
        START,
        "risk_detector"
    )

    # Conditional routing
    workflow.add_conditional_edges(
        "risk_detector",
        route_after_risk_detection,
        {
            "explain": "explain_transaction",
            "monitor": "monitor_transaction",
        },
    )

    # Recovery path
    workflow.add_edge(
        "explain_transaction",
        "root_cause_analyzer"
    )

    workflow.add_edge(
        "root_cause_analyzer",
        "intervention_planner"
    )

    workflow.add_edge(
        "intervention_planner",
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
        "execute_recovery"
    )

    workflow.add_edge(
        "execute_recovery",
        END
    )
    # Monitoring path
    workflow.add_edge(
        "monitor_transaction",
        END
    )

    return workflow.compile()