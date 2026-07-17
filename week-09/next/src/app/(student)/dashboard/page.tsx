import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentStudent } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Dashboard sinh viên"
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const student = await getCurrentStudent();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard sinh viên</h1>
        <p className="mt-2 text-muted-foreground">
          Quản lý thông tin cá nhân và học phần đã đăng ký.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin tài khoản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            <span className="font-medium">Họ tên:</span> {student?.name}
          </p>
          <p>
            <span className="font-medium">Email:</span> {student?.email}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
