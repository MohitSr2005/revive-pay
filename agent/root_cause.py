from typing import Dict, Any, List


def analyze_root_cause(
    probability: float,
    risk_level: str,
    explanations: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Convert SHAP feature contributions into a business-level
    root cause analysis.
    """

    positive_drivers = [
        item for item in explanations
        if item["shap_value"] > 0
    ]

    negative_drivers = [
        item for item in explanations
        if item["shap_value"] < 0
    ]

    positive_drivers.sort(
        key=lambda x: abs(x["shap_value"]),
        reverse=True
    )

    negative_drivers.sort(
        key=lambda x: abs(x["shap_value"]),
        reverse=True
    )

    root_cause_details = []

    # Strongest positive drivers
    for driver in positive_drivers[:3]:
        root_cause_details.append(
            f"{driver['feature']} is increasing recovery risk "
            f"(SHAP {driver['shap_value']:.4f})."
        )

    # Strongest negative drivers
    for driver in negative_drivers[:3]:
        root_cause_details.append(
            f"{driver['feature']} is reducing recovery risk "
            f"(SHAP {driver['shap_value']:.4f})."
        )

    # Overall interpretation
    if probability >= 0.80:
        root_cause = (
            "Strong revenue recovery opportunity detected. "
            "The transaction contains significant model signals "
            "associated with potential recovery."
        )

    elif probability >= 0.40:
        root_cause = (
            "Moderate revenue recovery opportunity detected. "
            "The transaction shows meaningful risk signals "
            "that may justify intervention."
        )

    else:
        root_cause = (
            "No significant revenue recovery opportunity detected. "
            "The model does not identify sufficient risk to justify "
            "an active recovery intervention."
        )

    return {
        "root_cause": root_cause,
        "root_cause_details": root_cause_details,
        "positive_drivers": positive_drivers[:3],
        "negative_drivers": negative_drivers[:3],
    }