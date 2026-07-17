"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { createMyEnrollment } from "@/lib/api/enrollments";
import { getAuthToken } from "@/lib/auth/session";
import { getReadableGraphQLError } from "@/lib/graphql/errors";

export type EnrollmentActionResult = {
  ok: boolean;
  message: string;
};

export async function enrollCourseAction(
  courseId: string
): Promise<EnrollmentActionResult> {
  const token = await getAuthToken();

  if (!token) {
    return {
      ok: false,
      message: "Bạn cần đăng nhập trước khi đăng ký học phần."
    };
  }

  try {
    await createMyEnrollment({
      token,
      courseId
    });

    revalidateTag("courses");
    revalidateTag("top-courses");
    revalidateTag(`course:${courseId}`);
    revalidatePath("/courses");
    revalidatePath(`/courses/${courseId}`);
    revalidatePath("/dashboard/enrollments");

    return {
      ok: true,
      message: "Đăng ký học phần thành công."
    };
  } catch (error) {
    return {
      ok: false,
      message: getReadableGraphQLError(error)
    };
  }
}
