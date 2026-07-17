import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CapacityBadge } from "@/components/course/capacity-badge";
import { EnrollButton } from "@/components/course/enroll-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { getCourseById } from "@/lib/api/courses";
import { GraphQLClientError } from "@/lib/graphql/errors";

export const dynamic = "force-dynamic";

type CourseDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params
}: CourseDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const course = await getCourseById(id);

    if (!course) {
      return {
        title: "Không tìm thấy học phần"
      };
    }

    return {
      title: course.title,
      description: course.description ?? `Thông tin chi tiết học phần ${course.title}.`
    };
  } catch {
    return {
      title: "Chi tiết học phần"
    };
  }
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { id } = await params;
  let course;

  try {
    course = await getCourseById(id);
  } catch (error) {
    if (error instanceof GraphQLClientError && error.code === "NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  if (!course) {
    notFound();
  }

  const isFull = course.enrolledCount >= course.capacity;
  const isClosed = course.status.toLowerCase() !== "open";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <Button asChild variant="ghost">
          <Link href="/courses">Quay lại danh sách</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-3xl">{course.title}</CardTitle>
            <p className="mt-2 text-muted-foreground">Mã học phần: {course.id}</p>
          </div>
          <CapacityBadge
            enrolledCount={course.enrolledCount}
            capacity={course.capacity}
            status={course.status}
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h2 className="font-semibold">Mô tả học phần</h2>
            <p className="mt-2 text-muted-foreground">
              {course.description || "Học phần này hiện chưa có mô tả chi tiết."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Đã đăng ký</p>
              <p className="mt-1 text-2xl font-semibold">{course.enrolledCount}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Sức chứa</p>
              <p className="mt-1 text-2xl font-semibold">{course.capacity}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Trạng thái</p>
              <p className="mt-1 text-2xl font-semibold">{course.status}</p>
            </div>
          </div>

          {course.instanceName ? (
            <p className="text-sm text-muted-foreground">Backend instance: {course.instanceName}</p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <EnrollButton courseId={course.id} disabled={isFull || isClosed} />
            <Button asChild variant="outline">
              <Link href="/dashboard/enrollments">Học phần của tôi</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
