import type { ObligationModel } from "./formation";

export type DemoScenario = {
  name: string;
  title: string;
  text: string;
  obligations: ObligationModel;
};

export const demoScenarios: DemoScenario[] = [
  {
    name: "Procurement agreement",
    title: "European provider intelligence report",
    text: "Produce a competitor report covering the five largest European providers, using public sources, by Friday at 17:00.",
    obligations: {
      scope: "five largest EU providers by revenue",
      evidence: "two independent public sources",
      deadline: "Friday 17:00 CET",
      quantity: 5,
    },
  },
  {
    name: "Research / reporting",
    title: "Quarterly market brief",
    text: "Prepare a concise market brief with cited sources and deliver it by the end of the quarter.",
    obligations: { scope: "quarterly market brief", evidence: "cited sources", deadline: "end of the quarter", quantity: 1 },
  },
  {
    name: "Freelance delivery",
    title: "Product launch package",
    text: "Deliver the launch package with design files, copy, and a review call within ten business days.",
    obligations: { scope: "product launch package", evidence: "design files, copy, and review call", deadline: "within ten business days", quantity: 1 },
  },
  {
    name: "Agent service",
    title: "Agent-to-agent service",
    text: "Monitor a service endpoint, report anomalies, and escalate verified incidents within one hour.",
    obligations: { scope: "service endpoint monitoring", evidence: "reported and verified incidents", deadline: "within one hour", quantity: 1 },
  },
];

export function deriveConservativeObligations(description: string): ObligationModel {
  const lower = description.toLowerCase();
  return {
    scope: description.split(",")[0]?.trim() || "mutually defined scope",
    evidence: lower.includes("source") ? "independent public sources" : "evidence agreed by both parties",
    deadline: "deadline agreed by both parties",
    quantity: 1,
  };
}
