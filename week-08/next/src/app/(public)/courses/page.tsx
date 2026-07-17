import type { Metadata } from "next";
import Link from "next/link";

import { CourseCard } from "@/components/course/course-card";
import { Button } from "@/components/ui/button";
import { getCoursesPage } from "@/lib/api/courses";

export const metadata: Metadata = {
  title: "Danh sách học phần",
  description: "Xem danh sách học phần, sĩ số, sức chứa và trạng thái đăng ký."
};

export const dynamic = "force-dynamic";

type CoursesPageProps = {
  searchParams: Promise<{
    page?: string;
  }>;
};

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(Number(params.page ?? "1"), 1);
  const limit = 12;
  const offset = (currentPage - 1) * limit;
  const result = await getCoursesPage({ limit, offset });
  const hasPreviousPage = result.pageInfo.hasPreviousPage;
  const hasNextPage = result.pageInfo.hasNextPage;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Danh sách học phần</h1>
          <p className="mt-2 text-muted-foreground">
            Dữ liệu lấy từ GraphQL query `coursesPage` của backend.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/enrollments">Học phần của tôi</Link>
        </Button>
      </div>

      {result.items.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          Hiện chưa có học phần nào để hiển thị.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {result.items.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button asChild variant="outline" aria-disabled={!hasPreviousPage}>
          <Link
            href={hasPreviousPage ? `/courses?page=${currentPage - 1}` : "#"}
            className={!hasPreviousPage ? "pointer-events-none opacity-50" : ""}
          >
            Trang trước
          </Link>
        </Button>

        <span className="text-sm text-muted-foreground">
          Trang {currentPage} - Tổng {result.pageInfo.total} học phần
        </span>

        <Button asChild variant="outline" aria-disabled={!hasNextPage}>
          <Link
            href={hasNextPage ? `/courses?page=${currentPage + 1}` : "#"}
            className={!hasNextPage ? "pointer-events-none opacity-50" : ""}
          >
            Trang sau
          </Link>
        </Button>
      </div>
    </div>
  );
}
