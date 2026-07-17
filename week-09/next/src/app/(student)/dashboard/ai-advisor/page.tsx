import type { Metadata } from "next";

import { CourseAdvisorChat } from "@/components/ai/course-advisor-chat";

export const metadata: Metadata = {
  title: "AI Course Advisor"
};

export const dynamic = "force-dynamic";

export default function AiAdvisorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Course Advisor</h1>
        <p className="mt-2 text-muted-foreground">
          Tư vấn học phần, tìm kiếm ngữ nghĩa và xem dữ liệu đăng ký bằng AI.
        </p>
      </div>

      <CourseAdvisorChat />
    </div>
  );
}
