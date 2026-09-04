import json
import uuid
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

BASE_DIR = Path(__file__).resolve().parent.parent

STATE_DIR = BASE_DIR / "data" / "agent_state"
PENDING_REVIEWS_PATH = STATE_DIR / "pending_reviews.json"


STATE_DIR.mkdir(
    parents=True,
    exist_ok=True
)


def _load_reviews() -> Dict[str, Any]:
    if not PENDING_REVIEWS_PATH.exists():
        return {}

    try:
        with open(
            PENDING_REVIEWS_PATH,
            "r",
            encoding="utf-8"
        ) as file:
            return json.load(file)

    except (json.JSONDecodeError, TypeError):
        return {}
def _json_safe(value):
    if isinstance(value, np.integer):
        return int(value)

    if isinstance(value, np.floating):
        return float(value)

    if isinstance(value, np.bool_):
        return bool(value)

    if isinstance(value, np.ndarray):
        return value.tolist()

    if pd.isna(value):
        return None

    return value

def _save_reviews(reviews: Dict[str, Any]):
    with open(PENDING_REVIEWS_PATH, "w", encoding="utf-8") as file:
        json.dump(
            reviews,
            file,
            indent=2,
            default=_json_safe
        )


def create_review_request(
    transaction: Dict[str, Any],
    probability: float,
    intervention: str,
    root_cause: str,
) -> Dict[str, Any]:

    reviews = _load_reviews()

    review_id = (
        f"RV-"
        f"{datetime.now().strftime('%Y%m%d')}-"
        f"{uuid.uuid4().hex[:8].upper()}"
    )

    review = {
        "review_id": review_id,
        "transaction": transaction,
        "probability": float(probability),
        "intervention": intervention,
        "root_cause": root_cause,
        "status": "pending",
        "decision": None,
        "created_at": datetime.now().isoformat(),
        "reviewed_at": None,
    }

    reviews[review_id] = review

    _save_reviews(reviews)

    return review


def get_review(
    review_id: str
) -> Dict[str, Any] | None:

    reviews = _load_reviews()

    return reviews.get(review_id)


def approve_review(
    review_id: str
) -> Dict[str, Any]:

    reviews = _load_reviews()

    if review_id not in reviews:
        raise ValueError(
            f"Review request not found: {review_id}"
        )

    review = reviews[review_id]

    if review["status"] != "pending":
        raise ValueError(
            f"Review request is already "
            f"{review['status']}."
        )

    review["status"] = "approved"
    review["decision"] = "approved"
    review["reviewed_at"] = datetime.now().isoformat()

    reviews[review_id] = review

    _save_reviews(reviews)

    return review


def reject_review(
    review_id: str
) -> Dict[str, Any]:

    reviews = _load_reviews()

    if review_id not in reviews:
        raise ValueError(
            f"Review request not found: {review_id}"
        )

    review = reviews[review_id]

    if review["status"] != "pending":
        raise ValueError(
            f"Review request is already "
            f"{review['status']}."
        )

    review["status"] = "rejected"
    review["decision"] = "rejected"
    review["reviewed_at"] = datetime.now().isoformat()

    reviews[review_id] = review

    _save_reviews(reviews)

    return review