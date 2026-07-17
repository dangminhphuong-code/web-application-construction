import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào cổng đăng ký học phần."
};

type LoginPageProps = {
  searchParams: Promise<{
    registered?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const registered = params.registered === "1";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Đăng nhập</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sử dụng tài khoản sinh viên để đăng ký học phần.
          </p>
        </CardHeader>
        <CardContent>
          {registered ? (
            <Alert className="mb-5 border-emerald-200 text-emerald-700">
              <AlertDescription>
                Tạo tài khoản thành công. Vui lòng đăng nhập.
              </AlertDescription>
            </Alert>
          ) : null}
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
