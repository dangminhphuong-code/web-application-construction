"use client";

import { useTransition, useState } from "react";

import { enrollCourseAction } from "@/app/actions/enrollment";
import { Button } from "@/components/ui/button";

type EnrollButtonProps = {
  courseId: string;
  disabled?: boolean;
};

export function EnrollButton({ courseId, disabled = false }: EnrollButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);

  function handleEnroll() {
    startTransition(async () => {
      const result = await enrollCourseAction(courseId);
      setMessage(result.message);
      setOk(result.ok);
    });
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleEnroll} disabled={disabled || isPending}>
        {isPending ? "Đang đăng ký..." : "Đăng ký học phần"}
      </Button>
      {message ? (
        <p className={ok ? "text-sm text-emerald-600" : "text-sm text-destructive"}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
