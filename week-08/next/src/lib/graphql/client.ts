import "server-only";

import { GraphQLClientError, type GraphQLErrorItem } from "./errors";

type GraphQLResponse<TData> = {
  data?: TData;
  errors?: GraphQLErrorItem[];
};

type GraphQLRequestOptions<TVariables> = {
  query: string;
  variables?: TVariables;
  token?: string | null;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
};

const GRAPHQL_ENDPOINT =
  process.env.BACKEND_GRAPHQL_URL ?? "http://localhost:4000/graphql";

export async function graphQLRequest<
  TData,
  TVariables extends Record<string, unknown> = Record<string, never>
>({
  query,
  variables,
  token,
  cache,
  next
}: GraphQLRequestOptions<TVariables>): Promise<TData> {
  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query,
      variables: variables ?? {}
    }),
    cache,
    next
  });

  if (!response.ok) {
    throw new Error(`GraphQL HTTP error: ${response.status}`);
  }

  const json = (await response.json()) as GraphQLResponse<TData>;

  if (json.errors?.length) {
    throw new GraphQLClientError(json.errors);
  }

  if (!json.data) {
    throw new Error("GraphQL response does not contain data.");
  }

  return json.data;
}
