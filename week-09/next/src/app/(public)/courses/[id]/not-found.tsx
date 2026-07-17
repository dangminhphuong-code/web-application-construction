import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function CourseNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Không tìm thấy học phần</h1>
      <p className="mt-3 text-muted-foreground">
        Học phần có thể đã bị xóa hoặc mã học phần không hợp lệ.
      </p>
      <Button asChild className="mt-6">
        <Link href="/courses">Quay lại danh sách học phần</Link>
      </Button>
    </div>
  );
}
