export const models = [
  {
    id: "LiquidAI/LFM2.5-350M-ONNX",
    name: "LFM 2.5 350M",
    sizeMB: 276,
    dtype: "q4" as const,
    licence: {
      name: "Liquid AI LFM Open License 1.0",
      url: "https://huggingface.co/LiquidAI/LFM2.5-350M/blob/main/LICENSE",
    },
  },
  {
    id: "HuggingFaceTB/SmolLM2-360M-Instruct",
    name: "SmolLM2 360M Instruct",
    sizeMB: 400,
    dtype: "q4" as const,
    licence: {
      name: "Apache 2.0",
      url: "https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct/blob/main/LICENSE",
    },
  },
];
export type BrowserModel = (typeof models)[number];
