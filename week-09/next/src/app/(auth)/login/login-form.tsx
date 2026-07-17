"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction, type AuthActionState } from "@/app/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      {state.message ? (
        <Alert className="border-destructive/40 text-destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="student@example.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
          Đăng ký tại đây
        </Link>
      </p>
    </form>
  );
}
