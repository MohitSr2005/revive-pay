import json
from pathlib import Path
from typing import Dict, Any, List

import pandas as pd

from agent.graph import build_recovery_agent


BASE_DIR = Path(__file__).resolve().parent.parent

DATA_PATH = BASE_DIR / "data" / "processed" / "revive_pay_model_data.csv"

STATE_DIR = BASE_DIR / "data" / "agent_state"
PROCESSED_ORDERS_PATH = STATE_DIR / "processed_orders.json"


# These are the only features sent to the ML/agent pipeline.
MODEL_FEATURES = [
    "total_payment_value",
    "payment_count",
    "payment_installments",
    "primary_payment_type",
    "item_count",
    "total_item_price",
    "total_freight_value",
    "unique_products",
    "unique_sellers",
    "customer_city",
    "customer_state",
    "purchase_year",
    "purchase_month",
    "purchase_day",
    "purchase_dayofweek",
    "purchase_hour",
    "approval_delay_hours",
    "delivery_time_days",
    "estimated_delivery_gap_days",
]


class TransactionStreamProcessor:

    def __init__(
        self,
        data_path: Path = DATA_PATH,
        state_path: Path = PROCESSED_ORDERS_PATH,
    ):
        self.data_path = data_path
        self.state_path = state_path

        self.state_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        self.agent = build_recovery_agent()

        self.processed_orders = self._load_processed_orders()

    def _load_processed_orders(self) -> set:
        """
        Load previously processed order IDs.

        This prevents the autonomous agent from processing
        the same transaction more than once.
        """

        if not self.state_path.exists():
            return set()

        try:
            with open(
                self.state_path,
                "r",
                encoding="utf-8"
            ) as file:
                data = json.load(file)

            return set(data)

        except (json.JSONDecodeError, TypeError):
            return set()

    def _save_processed_orders(self):
        """
        Persist processed order IDs to disk.
        """

        with open(
            self.state_path,
            "w",
            encoding="utf-8"
        ) as file:
            json.dump(
                sorted(self.processed_orders),
                file,
                indent=2
            )

    def _load_transactions(self) -> pd.DataFrame:
        """
        Load the transaction stream source.
        """

        if not self.data_path.exists():
            raise FileNotFoundError(
                f"Transaction dataset not found: {self.data_path}"
            )

        return pd.read_csv(self.data_path)

    def _build_agent_input(
        self,
        transaction: pd.Series
    ) -> Dict[str, Any]:
        """
        Convert a dataset row into the exact input expected
        by the RevivePay agent.
        """

        data = {}

        for feature in MODEL_FEATURES:
            value = transaction[feature]

            # Convert pandas NaN to None so FastAPI/Pydantic
            # and the model pipeline can handle missing values.
            if pd.isna(value):
                data[feature] = None
            else:
                data[feature] = value

        return data

    def get_next_transactions(
        self,
        batch_size: int = 1
    ) -> pd.DataFrame:
        """
        Return the next unprocessed transactions.
        """

        df = self._load_transactions()

        # Make sure order_id exists.
        if "order_id" not in df.columns:
            raise ValueError(
                "Dataset must contain an order_id column."
            )

        unprocessed = df[
            ~df["order_id"].astype(str).isin(
                self.processed_orders
            )
        ]

        return unprocessed.head(batch_size)

    def process_transaction(
        self,
        transaction: pd.Series
    ) -> Dict[str, Any]:
        """
        Process one transaction through the complete
        RevivePay LangGraph agent.
        """

        order_id = str(transaction["order_id"])

        # Duplicate protection
        if order_id in self.processed_orders:
            return {
                "order_id": order_id,
                "status": "skipped",
                "reason": "Transaction already processed.",
            }

        agent_input = self._build_agent_input(transaction)

        # Run the complete recovery agent.
        result = self.agent.invoke({
            "input_data": agent_input
        })

        # Mark the transaction as processed only after
        # successful agent execution.
        self.processed_orders.add(order_id)
        self._save_processed_orders()

        return {
            "order_id": order_id,
            "status": "processed",

            "recovery_probability": result.get(
                "probability"
            ),

            "prediction": result.get(
                "prediction"
            ),

            "risk_level": result.get(
                "risk_level"
            ),

            "intervention": result.get(
                "intervention"
            ),

            "action_allowed": result.get(
                "action_allowed",
                False
            ),

            "action_status": result.get(
                "action_status"
            ),

            "workflow_id": result.get(
                "workflow_id"
            ),

            "agent_message": result.get(
                "agent_message"
            ),

            # Dataset information used only for
            # monitoring/demo purposes.
            "revenue_at_risk": transaction.get(
                "revenue_at_risk"
            ),

            "ground_truth": transaction.get(
                "recovery_opportunity"
            ),
        }
    def find_demo_transactions(
        self
    ) -> List[Dict[str, Any]]:
        """
        Find representative LOW, MEDIUM, and HIGH risk
        transactions from the real dataset.

        The model itself determines the probability.
        No synthetic transaction data is generated.
        """

        df = self._load_transactions()

        if "order_id" not in df.columns:
            raise ValueError(
                "Dataset must contain an order_id column."
            )

        # Remove transactions that have already been processed.
        df = df[
            ~df["order_id"].astype(str).isin(
                self.processed_orders
            )
        ].copy()

        if df.empty:
            return []

        print("Scanning transactions with the trained agent...")

        candidates = []

        # We need enough transactions to find representative
        # probability ranges. Process in chunks so we don't
        # load unnecessary data into the agent at once.
        for _, transaction in df.iterrows():

            try:
                order_id = str(transaction["order_id"])

                agent_input = self._build_agent_input(
                    transaction
                )

                result = self.agent.invoke({
                    "input_data": agent_input
                })

                probability = float(
                    result.get("probability", 0.0)
                )

                risk_level = result.get(
                    "risk_level"
                )

                candidates.append({
                    "transaction": transaction,
                    "result": result,
                    "probability": probability,
                    "risk_level": risk_level,
                })

                # Once we have all three categories,
                # we can stop scanning.
                categories = {
                    item["risk_level"]
                    for item in candidates
                }

                if (
                    "LOW" in categories
                    and "MEDIUM" in categories
                    and "HIGH" in categories
                ):
                    break

            except Exception as exc:
                print(
                    f"Warning: failed to analyze "
                    f"{transaction['order_id']}: {exc}"
                )

        if not candidates:
            return []

        selected = []

        # LOW: choose the lowest probability.
        low_candidates = [
            item
            for item in candidates
            if item["risk_level"] == "LOW"
        ]

        if low_candidates:
            selected.append(
                min(
                    low_candidates,
                    key=lambda x: x["probability"]
                )
            )

        # MEDIUM: choose the candidate closest to 0.60.
        medium_candidates = [
            item
            for item in candidates
            if item["risk_level"] == "MEDIUM"
        ]

        if medium_candidates:
            selected.append(
                min(
                    medium_candidates,
                    key=lambda x: abs(
                        x["probability"] - 0.60
                    )
                )
            )

        # HIGH: choose the highest probability.
        high_candidates = [
            item
            for item in candidates
            if item["risk_level"] == "HIGH"
        ]

        if high_candidates:
            selected.append(
                max(
                    high_candidates,
                    key=lambda x: x["probability"]
                )
            )

        final_results = []

        for item in selected:

            transaction = item["transaction"]
            result = item["result"]

            order_id = str(
                transaction["order_id"]
            )

            # Persist the selected demo transaction as processed.
            self.processed_orders.add(order_id)

            final_results.append({
                "order_id": order_id,
                "status": "processed",

                "recovery_probability": result.get(
                    "probability"
                ),

                "prediction": result.get(
                    "prediction"
                ),

                "risk_level": result.get(
                    "risk_level"
                ),

                "intervention": result.get(
                    "intervention"
                ),

                "action_allowed": result.get(
                    "action_allowed",
                    False
                ),

                "action_status": result.get(
                    "action_status"
                ),

                "workflow_id": result.get(
                    "workflow_id"
                ),

                "agent_message": result.get(
                    "agent_message"
                ),

                "revenue_at_risk": transaction.get(
                    "revenue_at_risk"
                ),

                "ground_truth": transaction.get(
                    "recovery_opportunity"
                ),
            })

        self._save_processed_orders()

        return final_results
    
    def process_batch(
        self,
        batch_size: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Process a batch of new transactions.
        """

        transactions = self.get_next_transactions(
            batch_size=batch_size
        )

        results = []

        for _, transaction in transactions.iterrows():

            try:
                result = self.process_transaction(
                    transaction
                )

                results.append(result)

            except Exception as exc:

                order_id = str(
                    transaction["order_id"]
                )

                results.append({
                    "order_id": order_id,
                    "status": "error",
                    "error": str(exc),
                })

        return results