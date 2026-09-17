import os
import uuid

from eth_account import Account
from gltest.contracts import ContractFactory
from gltest.clients import get_gl_client


def test_studio_dev_write_records_receipt(default_account):
    address = os.environ["CLAUSUM_CONTRACT_ADDRESS"]
    party_b = Account.create().address
    factory = ContractFactory.from_file_path("semantic_consensus.py")
    contract = factory.build_contract(contract_address=address, account=default_account)
    agreement_id = "AG-FEE-" + uuid.uuid4().hex[:12].upper()
    args = [agreement_id, party_b, "0.1"]
    estimate = get_gl_client().estimate_transaction_fees_for_write(
        address=address,
        function_name="create_negotiation",
        account=default_account,
        args=args,
    )
    receipt = contract.create_negotiation(args=args).transact(
        fees={"distribution": estimate["distribution"], "feeValue": estimate["feeValue"]},
        wait_until="finalized",
    )
    assert receipt
    assert receipt.get("transaction_id") or receipt.get("tx_hash") or receipt.get("id")
