import argparse

from agent.stream import TransactionStreamProcessor


def print_result(result):
    print("-" * 70)

    print(
        f"Order ID           : "
        f"{result.get('order_id')}"
    )

    print(
        f"Status             : "
        f"{result.get('status')}"
    )

    if result.get("status") != "processed":
        print(
            f"Reason/Error       : "
            f"{result.get('reason') or result.get('error')}"
        )
        return

    probability = result.get("recovery_probability")

    if probability is not None:
        print(
            f"Recovery Probability: "
            f"{probability:.4f}"
        )

    print(
        f"Risk Level         : "
        f"{result.get('risk_level')}"
    )

    print(
        f"Intervention       : "
        f"{result.get('intervention')}"
    )

    print(
        f"Action Allowed     : "
        f"{result.get('action_allowed')}"
    )

    print(
        f"Action Status      : "
        f"{result.get('action_status')}"
    )

    print(
        f"Workflow ID        : "
        f"{result.get('workflow_id')}"
    )

    print(
        f"Revenue at Risk    : "
        f"{result.get('revenue_at_risk')}"
    )

    print(
        f"Ground Truth       : "
        f"{result.get('ground_truth')}"
    )


def run_normal_mode(processor, batch_size):
    print(f"\nProcessing next {batch_size} transactions...\n")

    results = processor.process_batch(
        batch_size=batch_size
    )

    for result in results:
        print_result(result)

    return results


def run_demo_mode(processor):
    print("\nDEMO MODE")
    print("-" * 70)
    print("Searching the real dataset for representative risk scenarios.")
    print("No synthetic transactions are being generated.\n")

    results = processor.find_demo_transactions()

    if not results:
        print("No suitable demo transactions were found.")
        return []

    for result in results:

        print_result(result)

    return results


def main():

    parser = argparse.ArgumentParser(
        description="RevivePay autonomous transaction stream"
    )

    parser.add_argument(
        "--mode",
        choices=["normal", "demo"],
        default="normal",
        help="normal = sequential stream, demo = representative risk scenarios",
    )

    parser.add_argument(
        "--batch-size",
        type=int,
        default=5,
        help="Number of transactions to process in normal mode",
    )

    args = parser.parse_args()

    print("=" * 70)
    print("REVIVEPAY AUTONOMOUS TRANSACTION STREAM")
    print("=" * 70)

    processor = TransactionStreamProcessor()

    print(
        f"\nDataset: {processor.data_path}"
    )

    print(
        f"Previously processed orders: "
        f"{len(processor.processed_orders)}"
    )

    if args.mode == "demo":
        results = run_demo_mode(processor)
    else:
        results = run_normal_mode(
            processor,
            args.batch_size
        )

    print("\n" + "=" * 70)

    print(
        f"Total processed orders now: "
        f"{len(processor.processed_orders)}"
    )

    print("=" * 70)


if __name__ == "__main__":
    main()