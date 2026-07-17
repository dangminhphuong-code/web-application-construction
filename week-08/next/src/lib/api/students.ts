import "server-only";

import {
  CREATE_STUDENT_MUTATION,
  LOGIN_MUTATION,
  ME_QUERY
} from "@/lib/graphql/documents";
import { graphQLRequest } from "@/lib/graphql/client";
import type {
  CreateStudentResult,
  LoginResult,
  MeResult
} from "@/lib/graphql/types";

export async function loginStudent(input: { email: string; password: string }) {
  const data = await graphQLRequest<LoginResult, typeof input>({
    query: LOGIN_MUTATION,
    variables: input,
    cache: "no-store"
  });

  return data.login;
}

export async function createStudent(input: {
  name: string;
  email: string;
  password: string;
}) {
  const data = await graphQLRequest<CreateStudentResult, { input: typeof input }>({
    query: CREATE_STUDENT_MUTATION,
    variables: { input },
    cache: "no-store"
  });

  return data.createStudent;
}

export async function getMe(token: string) {
  const data = await graphQLRequest<MeResult>({
    query: ME_QUERY,
    token,
    cache: "no-store"
  });

  return data.me;
}
