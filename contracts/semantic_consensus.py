# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import typing

class SemanticConsensus(gl.Contract):
    outcomes: TreeMap[str, str]
    questions: TreeMap[str, str]

    def __init__(self):
        pass

    @gl.public.write
    def evaluate(self, agreement_id: str, party_a: str, party_b: str, question: str) -> typing.Any:
        def source() -> str:
            return (
                "Agreement ID: " + agreement_id + "\n"
                "Party A interpretation:\n" + party_a + "\n"
                "Party B interpretation:\n" + party_b + "\n"
                "Question: " + question
            )
        result = gl.eq_principle.prompt_non_comparative(
            source,
            task=(
                "Classify whether the two interpretations create materially equivalent commitments. "
                "Return exactly one token: EQUIVALENT, MATERIAL_CONFLICT, or UNRESOLVED."
            ),
            criteria=(
                "The response must be exactly one allowed token. EQUIVALENT only applies when scope, "
                "deadline, evidence, quantities, conditions, and exceptions are materially the same. "
                "MATERIAL_CONFLICT applies to any meaningful mismatch. UNRESOLVED applies if meaning "
                "cannot safely be determined."
            ),
        )
        if result not in ["EQUIVALENT", "MATERIAL_CONFLICT", "UNRESOLVED"]:
            raise gl.vm.UserError("invalid consensus outcome")
        self.outcomes[agreement_id] = result
        self.questions[agreement_id] = question
        return result

    @gl.public.view
    def get_outcome(self, agreement_id: str) -> str:
        return self.outcomes[agreement_id]
