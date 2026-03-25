import { Answer, AuthPathway, Answers } from './types';

export const computeDerivedState = (answers: Answers) => {
  const markets = answers.A3 || [];
  const hasEU = markets.includes("EU");
  return {
    hasGenAI: (answers.A6 || []).some((m: string) => m?.includes("LLM") || m?.includes("Foundation") || m?.includes("Generative")),
    markets,
    isMultiMarket: markets.length > 1,
    hasEU,
    hasUK: markets.includes("UK"),
    hasCanada: markets.includes("Canada"),
    hasJapan: markets.includes("Japan"),
    hasNonUSMarket: markets.some((m: string) => m !== "US"),
    isCatIntendedUse: answers.B1 === "Intended Use / Indications for Use",
    isCatGenAI: answers.B1 === "Foundation Model / Generative AI",
    hasPCCP: answers.A2 === Answer.Yes,
    isPMA: answers.A1 === AuthPathway.PMA,
    isDeNovo: answers.A1 === AuthPathway.DeNovo,
    is510k: answers.A1 === AuthPathway.FiveOneZeroK,
    euHighRisk: hasEU && answers.A5 === Answer.Yes,
    isIVD: answers.A5b === Answer.Yes,
  };
};
