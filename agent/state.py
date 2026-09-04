from typing import TypedDict, Any, List, Dict


class AgentState(TypedDict, total=False):
    input_data: Dict[str, Any]

    # Risk detection
    probability: float
    prediction: int
    risk_level: str

    # Explainability
    explanations: List[Dict[str, Any]]

    # Root cause
    root_cause: str
    root_cause_details: List[str]

    # Intervention
    intervention: str
    intervention_reason: str

    # Policy / execution
    action_allowed: bool
    action_status: str
    workflow_id: str
    agent_message: str

    # Human-in-the-loop
    review_id: str
    review_decision: str

    # Agent activity timeline
    activity_log: List[Dict[str, Any]]