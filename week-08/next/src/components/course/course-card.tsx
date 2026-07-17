import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CapacityBadge } from "@/components/course/capacity-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import type { Course } from "@/lib/graphql/types";

type CourseCardProps = {
  course: Course;
};

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.id}`} className="block h-full">
      <Card className="flex h-full flex-col transition hover:border-primary/50 hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-lg leading-snug">{course.title}</CardTitle>
            <CapacityBadge
              enrolledCount={course.enrolledCount}
              capacity={course.capacity}
              status={course.status}
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between gap-4">
          <CardDescription className="line-clamp-3 text-sm">
            {course.description || "Chưa có mô tả cho học phần này."}
          </CardDescription>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{course.instanceName}</span>
            <span className="inline-flex items-center gap-1 text-primary">
              Chi tiết <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
