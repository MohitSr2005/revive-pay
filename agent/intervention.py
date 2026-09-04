from typing import Dict, Any
def select_intervention(
    probability: float,
    risk_level: str,
    root_cause: str,
    explanations: list
) -> Dict[str, Any]:
    """
    Select a bounded recovery intervention based on the
    model risk and available evidence.
    """

    # LOW RISK
    if probability < 0.40:
        return {
            "intervention": "monitor",
            "intervention_reason": (
                "The predicted recovery probability is below "
                "the intervention threshold. No active recovery "
                "action is recommended."
            )
        }

    # MEDIUM RISK
    if probability < 0.80:
        return {
            "intervention": "payment_recovery",
            "intervention_reason": (
                "The transaction exceeds the recovery threshold. "
                "A payment recovery workflow is recommended to "
                "attempt to recover the at-risk revenue."
            )
        }

    # HIGH RISK
    return {
        "intervention": "payment_recovery",
        "intervention_reason": (
            "The transaction has a high recovery probability. "
            "A payment recovery workflow should be initiated, "
            "subject to policy validation."
        )
    }