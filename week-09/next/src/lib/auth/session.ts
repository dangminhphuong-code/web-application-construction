import "server-only";

import { cookies } from "next/headers";

import { getMe } from "@/lib/api/students";

export const AUTH_COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME ?? "access_token";

export async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function requireAuthToken() {
  const token = await getAuthToken();

  if (!token) {
    throw new Error("UNAUTHENTICATED");
  }

  return token;
}

export async function getCurrentStudent() {
  const token = await getAuthToken();

  if (!token) {
    return null;
  }

  try {
    return await getMe(token);
  } catch {
    return null;
  }
}
