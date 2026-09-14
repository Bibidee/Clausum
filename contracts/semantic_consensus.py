# v0.3.0
# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }
import genlayer as gl


class SemanticConsensus(gl.contract.Contract):
    outcomes: str

    def __init__(self):
        self.outcomes = ""

    @gl.public.write
    def evaluate(self, agreement_id: str, party_a: str, party_b: str, question: str) -> str:
        result = gl.eq_principle.prompt_non_comparative(
            lambda: party_a + "\n" + party_b + "\n" + question,
            task="Return EQUIVALENT, MATERIAL_CONFLICT, or UNRESOLVED.",
            criteria="Compare material obligations.",
        )
        if result not in ["EQUIVALENT", "MATERIAL_CONFLICT", "UNRESOLVED"]:
            raise gl.vm.UserError("invalid consensus outcome")
        self.outcomes = self.outcomes + agreement_id + "\t" + result + "\n"
        return result

    @gl.public.view
    def get_outcome(self, agreement_id: str) -> str:
        for row in self.outcomes.split("\n"):
            parts = row.split("\t")
            if len(parts) == 2 and parts[0] == agreement_id:
                return parts[1]
        return "UNRESOLVED"
