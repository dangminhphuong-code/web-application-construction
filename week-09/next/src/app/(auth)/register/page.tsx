import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Đăng ký tài khoản",
  description: "Tạo tài khoản sinh viên mới."
};

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Đăng ký tài khoản</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tạo tài khoản sinh viên mới để chủ động đăng ký học phần.
          </p>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
}
