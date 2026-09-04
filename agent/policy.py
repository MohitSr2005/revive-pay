import json
from pathlib import Path
from typing import Dict, Any


# ---------------------------------------------------------
# LOAD REVIVEPAY POLICY CONFIGURATION
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
POLICY_PATH = BASE_DIR / "config" / "recovery_policy.json"


with open(POLICY_PATH, "r", encoding="utf-8") as file:
    POLICY = json.load(file)


# ---------------------------------------------------------
# POLICY VALIDATION
# ---------------------------------------------------------

def validate_recovery_action(
    probability: float,
    intervention: str,
    transaction_value: float
) -> Dict[str, Any]:
    """
    Determine whether a recovery intervention is allowed
    under the RevivePay policy.

    The ML model recommends risk.
    The intervention planner recommends an action.
    This policy engine determines whether that action
    can be executed automatically.
    """

    # -----------------------------------------------------
    # CHECK 1 — Recovery threshold
    # -----------------------------------------------------

    if probability < POLICY["recovery_threshold"]:
        return {
            "action_allowed": False,
            "policy_status": "blocked",
            "requires_human_review": False,
            "policy_reason": (
                "Risk probability is below the recovery "
                "threshold. No active recovery action is allowed."
            )
        }

    # -----------------------------------------------------
    # CHECK 2 — Allowed intervention
    # -----------------------------------------------------

    if intervention not in POLICY["allowed_interventions"]:
        return {
            "action_allowed": False,
            "policy_status": "blocked",
            "requires_human_review": True,
            "policy_reason": (
                "The requested intervention is not an "
                "approved RevivePay recovery action."
            )
        }

    # -----------------------------------------------------
    # CHECK 3 — Mandatory human-review intervention
    # -----------------------------------------------------

    if intervention in POLICY["human_review_actions"]:
        return {
            "action_allowed": False,
            "policy_status": "human_review",
            "requires_human_review": True,
            "policy_reason": (
                "This intervention requires human approval "
                "under the RevivePay policy."
            )
        }

    # -----------------------------------------------------
    # CHECK 4 — Automatic execution confidence
    # -----------------------------------------------------

    if probability < POLICY["auto_execute_threshold"]:
        return {
            "action_allowed": False,
            "policy_status": "human_review",
            "requires_human_review": True,
            "policy_reason": (
                "Recovery opportunity detected, but model "
                "confidence is below the automatic execution "
                "threshold."
            )
        }

    # -----------------------------------------------------
    # CHECK 5 — Transaction value limit
    # -----------------------------------------------------

    if transaction_value > POLICY["max_auto_recovery_value"]:
        return {
            "action_allowed": False,
            "policy_status": "human_review",
            "requires_human_review": True,
            "policy_reason": (
                "Transaction value exceeds the maximum "
                "amount allowed for automatic recovery."
            )
        }

    # -----------------------------------------------------
    # ALL POLICY CHECKS PASSED
    # -----------------------------------------------------

    return {
        "action_allowed": True,
        "policy_status": "approved",
        "requires_human_review": False,
        "policy_reason": (
            "Recovery action satisfies all RevivePay "
            "automatic execution policies."
        )
    }