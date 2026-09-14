# v0.3.0
# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }
import genlayer as gl


class SemanticConsensus(gl.contract.Contract):
    last_agreement_id: str
    last_outcome: str

    def __init__(self):
        self.last_agreement_id = ""
        self.last_outcome = "UNRESOLVED"

    @gl.public.write
    def evaluate(self, agreement_id: str, party_a: str, party_b: str, question: str) -> str:
        def source() -> str:
            return (
                "Agreement ID: " + agreement_id + "\n"
                "Party A interpretation:\n" + party_a + "\n"
                "Party B interpretation:\n" + party_b + "\n"
                "Question: " + question
            )

        result = gl.eq_principle.prompt_non_comparative(
            source,
            task="Classify the interpretations as EQUIVALENT, MATERIAL_CONFLICT, or UNRESOLVED.",
            criteria="EQUIVALENT requires materially matching scope, deadline, evidence, quantities, conditions, and exceptions. Any meaningful mismatch is MATERIAL_CONFLICT. Insufficiently clear meaning is UNRESOLVED.",
        )
        if result not in ["EQUIVALENT", "MATERIAL_CONFLICT", "UNRESOLVED"]:
            raise gl.vm.UserError("invalid consensus outcome")
        self.last_agreement_id = agreement_id
        self.last_outcome = result
        return result

    @gl.public.view
    def get_outcome(self, agreement_id: str) -> str:
        if agreement_id != self.last_agreement_id:
            return "UNRESOLVED"
        return self.last_outcome
