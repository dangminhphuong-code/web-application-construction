"use client";

import { Button } from "@/components/ui/button";

export default function CoursesError({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Không tải được danh sách học phần</h1>
      <p className="mt-3 text-muted-foreground">{error.message}</p>
      <Button className="mt-6" onClick={() => reset()}>
        Thử lại
      </Button>
    </div>
  );
}
