import { OpenCodeProvider } from "./OpenCodeProvider";
import { OpenRouterProvider } from "./OpenRouterProvider";
import { DeepSeekProvider } from "./DeepSeekProvider";
import { QwenProvider } from "./QwenProvider";
import { LlamaProvider } from "./LlamaProvider";
import { LocalProvider } from "./LocalProvider";
import { BRANPYLocalDemoProvider } from "./BRANPYLocalDemoProvider";

const PROVIDER_REGISTRY = {
  opencode: OpenCodeProvider,
  openrouter: OpenRouterProvider,
  deepseek: DeepSeekProvider,
  qwen: QwenProvider,
  llama: LlamaProvider,
  local: LocalProvider,
  "branpy-demo": BRANPYLocalDemoProvider,
};

const PROVIDER_PRIORITY = ["opencode", "openrouter", "deepseek", "qwen", "llama", "local", "branpy-demo"];

let providerInstances = {};

export function createProvider(id, config = {}) {
  const ProviderClass = PROVIDER_REGISTRY[id];
  if (!ProviderClass) {
    throw new Error(`Unknown provider: ${id}. Available: ${Object.keys(PROVIDER_REGISTRY).join(", ")}`);
  }
  return new ProviderClass(config);
}

export function getProvider(id, config = {}) {
  if (!providerInstances[id]) {
    providerInstances[id] = createProvider(id, config);
  }
  return providerInstances[id];
}

export function resetProviders() {
  providerInstances = {};
}

export function getAvailableProviders() {
  return PROVIDER_PRIORITY.map((id) => ({
    id,
    name: PROVIDER_REGISTRY[id].prototype.constructor?.name || id,
    instance: getProvider(id),
  }));
}

export function getProviderPriority() {
  return [...PROVIDER_PRIORITY];
}

export function setProviderPriority(priority) {
  if (priority.length > 0) {
    PROVIDER_PRIORITY.length = 0;
    PROVIDER_PRIORITY.push(...priority);
  }
}

export function listProviderIds() {
  return Object.keys(PROVIDER_REGISTRY);
}

export { PROVIDER_REGISTRY, PROVIDER_PRIORITY };
