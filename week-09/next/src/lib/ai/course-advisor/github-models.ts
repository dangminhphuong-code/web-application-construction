import { createOpenAI } from "@ai-sdk/openai";

const token = process.env.GITHUB_MODELS_TOKEN;

export const githubModels = token
  ? createOpenAI({
      name: "github-models",
      apiKey: token,
      baseURL: "https://models.github.ai/inference",
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    })
  : null;

export function hasGithubModelsToken() {
  return Boolean(token);
}

export function courseAdvisorChatModel() {
  if (!githubModels) {
    throw new Error("Missing GITHUB_MODELS_TOKEN");
  }

  return githubModels.chat(
    process.env.GITHUB_MODELS_CHAT_MODEL ?? "openai/gpt-4o-mini"
  );
}

export function courseAdvisorEmbeddingModel() {
  if (!githubModels) {
    throw new Error("Missing GITHUB_MODELS_TOKEN");
  }

  return githubModels.embedding(
    process.env.GITHUB_MODELS_EMBEDDING_MODEL ??
      "openai/text-embedding-3-small"
  );
}
