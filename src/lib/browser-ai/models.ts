export const models = [
  {
    id: "onnx-community/LFM2.5-350M-ONNX",
    revision: "2c07371c2e84776cad597f3d813b7d306d292aea",
    name: "LFM 2.5 350M",
    sizeMB: 276,
    dtype: "q4" as const,
    description: "Fast local chat for prompt review on this device.",
    licence: {
      name: "Liquid AI LFM Open License 1.0",
      url: "https://huggingface.co/LiquidAI/LFM2.5-350M/blob/main/LICENSE",
    },
  },
  {
    id: "LiquidAI/LFM2.5-1.2B-Instruct-ONNX",
    revision: "10f72e70abf67ac0fd7ebf15bc5854726891d864",
    name: "LFM 2.5 1.2B Instruct",
    sizeMB: 760,
    dtype: "q4f16" as const,
    description: "Higher-quality local chat. Larger download.",
    licence: {
      name: "Liquid AI LFM Open License 1.0",
      url: "https://huggingface.co/LiquidAI/LFM2.5-1.2B-Instruct/blob/main/LICENSE",
    },
  },
];
export type BrowserModel = (typeof models)[number];
export const defaultBrowserModel = models[0];
