import Link from "next/link";
import { ArrowRight, BookOpen, Server, Users } from "lucide-react";

import { CourseCard } from "@/components/course/course-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTopCourses } from "@/lib/api/courses";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const topCourses = await getTopCourses(3).catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="grid gap-8 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <p className="text-sm font-medium text-muted-foreground">Next.js + GraphQL Gateway</p>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Cổng đăng ký học phần sinh viên
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Xem danh sách học phần, theo dõi số chỗ còn lại và đăng ký trực tiếp
              thông qua backend microservices đã xây dựng ở các tuần trước.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/courses">
                Xem học phần <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Đăng nhập sinh viên</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-muted/30 p-6">
          <h2 className="text-xl font-semibold">Kết nối backend</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Frontend Next.js gọi GraphQL gateway để phối hợp student-service,
            course-service và enrollment-service.
          </p>
          <div className="mt-6 grid gap-3">
            {[
              { icon: BookOpen, label: "Course catalog", value: "coursesPage" },
              { icon: Users, label: "Student auth", value: "login / register" },
              { icon: Server, label: "Realtime-ready", value: "SSE + chat service" }
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border bg-background p-4"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-primary" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <span className="text-sm text-muted-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Học phần nổi bật</h2>
            <p className="mt-2 text-muted-foreground">
              Dữ liệu lấy từ query `topCourses` của backend.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/courses">Xem tất cả</Link>
          </Button>
        </div>

        {topCourses.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {topCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            Chưa tải được dữ liệu học phần nổi bật. Hãy chạy backend GraphQL tại
            `http://localhost:4000/graphql` rồi tải lại trang.
          </div>
        )}
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Đăng nhập</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Sinh viên đăng nhập để tạo enrollment cá nhân.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Đăng ký học phần</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Action gọi mutation `createMyEnrollment` qua GraphQL.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Sinh viên xem lại thông tin tài khoản và các học phần đã đăng ký.
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
