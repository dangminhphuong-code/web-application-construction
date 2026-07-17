import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { getCurrentStudent } from "@/lib/auth/session";

export async function SiteHeader() {
  const student = await getCurrentStudent();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span>Course Portal</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/courses">Học phần</Link>
          </Button>
          {student ? (
            <>
              <Button asChild variant="ghost">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <form action={logoutAction}>
                <Button type="submit" variant="outline">
                  Đăng xuất
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Đăng nhập</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Đăng ký</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
