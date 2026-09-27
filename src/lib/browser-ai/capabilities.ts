export interface CapabilityEnvironment {
  secure: boolean;
  gpu?: { requestAdapter: () => Promise<unknown> };
  storage?: { estimate: () => Promise<{ quota?: number; usage?: number }> };
}
export async function detectCapabilities(env: CapabilityEnvironment) {
  if (!env.secure)
    return {
      available: false,
      message: "Browser AI requires HTTPS or localhost.",
    };
  if (!env.gpu)
    return {
      available: false,
      message:
        "WebGPU is unavailable in this browser. Choose cloud AI or Ollama.",
    };
  try {
    if (!(await env.gpu.requestAdapter()))
      return { available: false, message: "No WebGPU adapter is available." };
    const storage = await env.storage?.estimate();
    return {
      available: true,
      message: "WebGPU available. Model download requires your consent.",
      freeBytes:
        storage?.quota !== undefined
          ? storage.quota - (storage.usage ?? 0)
          : undefined,
    };
  } catch {
    return {
      available: false,
      message: "WebGPU or browser storage could not be accessed.",
    };
  }
}
