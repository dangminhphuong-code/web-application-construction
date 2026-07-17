"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createStudent, loginStudent } from "@/lib/api/students";
import { getReadableGraphQLError } from "@/lib/graphql/errors";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

export type AuthActionState = {
  message?: string;
};

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ."),
  password: z.string().min(1, "Mật khẩu không được để trống.")
});

const registerSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự."),
  email: z.string().email("Email không hợp lệ."),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự.")
});

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? "")
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Dữ liệu đăng nhập không hợp lệ."
    };
  }

  let token: string;

  try {
    const authPayload = await loginStudent(parsed.data);
    token = authPayload.token;
  } catch (error) {
    return {
      message: getReadableGraphQLError(error)
    };
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24
  });

  redirect("/dashboard");
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? "")
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Dữ liệu đăng ký không hợp lệ."
    };
  }

  try {
    await createStudent(parsed.data);
  } catch (error) {
    return {
      message: getReadableGraphQLError(error)
    };
  }

  redirect("/login?registered=1");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect("/login");
}
