from typing import TypedDict, Any, List, Dict


class AgentState(TypedDict, total=False):
    # Original transaction
    input_data: Dict[str, Any]

    # Risk detection
    probability: float
    prediction: int
    risk_level: str

    # Explainability
    explanations: List[Dict[str, Any]]

    # Agent reasoning
    root_cause: str
    root_cause_details: List[str]

    # Intervention
    intervention: str
    intervention_reason: str

    # Safety / execution
    action_allowed: bool
    action_status: str
    workflow_id: str

    # Final response
    agent_message: str