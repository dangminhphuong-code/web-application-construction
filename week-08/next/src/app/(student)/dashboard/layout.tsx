import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentStudent } from "@/lib/auth/session";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const student = await getCurrentStudent();

  if (!student) {
    redirect("/login");
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[240px_1fr]">
      <aside className="space-y-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Đang đăng nhập</p>
          <p className="font-semibold">{student.name}</p>
          <p className="text-sm text-muted-foreground">{student.email}</p>
        </div>

        <nav className="flex flex-col gap-2">
          <Button asChild variant="ghost" className="justify-start">
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              Tổng quan
            </Link>
          </Button>
          <Button asChild variant="ghost" className="justify-start">
            <Link href="/dashboard/enrollments">
              <BookOpen className="h-4 w-4" />
              Học phần của tôi
            </Link>
          </Button>
          <Button asChild variant="ghost" className="justify-start">
            <Link href="/courses">Tìm học phần</Link>
          </Button>
        </nav>
      </aside>

      <section>{children}</section>
    </div>
  );
}
