# v0.3.0
# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }
import genlayer as gl


class SemanticConsensus(gl.contract.Contract):
    outcome: str

    def __init__(self):
        self.outcome = "UNRESOLVED"

    @gl.public.write
    def evaluate(self, agreement_id: str, party_a: str, party_b: str, question: str) -> str:
        self.outcome = gl.eq_principle.prompt_non_comparative(
            lambda: party_a + "\n" + party_b + "\n" + question,
            task="Return EQUIVALENT, MATERIAL_CONFLICT, or UNRESOLVED.",
            criteria="Compare material obligations.",
        )
        return self.outcome

    @gl.public.view
    def get_outcome(self, agreement_id: str) -> str:
        return self.outcome
