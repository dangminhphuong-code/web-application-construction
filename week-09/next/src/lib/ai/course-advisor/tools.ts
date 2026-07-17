import "server-only";

import { tool } from "ai";
import { z } from "zod";

import {
  getCourseDetailForAdvisor,
  getMyEnrollmentsForAdvisor,
  getTopCoursesForAdvisor
} from "./graphql";
import { searchCoursesByRag } from "./rag";

function createToolError(error: unknown) {
  return {
    ok: false,
    message: error instanceof Error ? error.message : "Tool failed"
  };
}

export function createCourseAdvisorTools(options: { authToken?: string | null }) {
  const { authToken } = options;

  return {
    searchCourses: tool({
      description:
        "Tìm học phần theo ngôn ngữ tự nhiên bằng RAG semantic search. Dùng khi sinh viên mô tả mục tiêu học tập, công nghệ muốn học hoặc học kỳ mong muốn.",
      inputSchema: z.object({
        query: z.string().min(1).describe("Câu hỏi hoặc nhu cầu tìm học phần"),
        onlyOpen: z
          .boolean()
          .optional()
          .describe("Chỉ lấy học phần đang mở nếu true"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .describe("Số kết quả tối đa")
      }),
      execute: async ({ query, onlyOpen, limit }) => {
        try {
          const results = await searchCoursesByRag(query, {
            onlyOpen,
            limit
          });

          return {
            ok: true,
            courses: results.map((result) => ({
              ...result.course,
              score: result.score,
              matchedBy: result.matchedBy
            }))
          };
        } catch (error) {
          return createToolError(error);
        }
      }
    }),

    getCourseDetail: tool({
      description:
        "Lấy chi tiết một học phần theo id/mã học phần. Dùng khi cần trạng thái, sức chứa hoặc mô tả chính xác.",
      inputSchema: z.object({
        courseId: z.string().min(1).describe("ID hoặc mã học phần")
      }),
      execute: async ({ courseId }) => {
        try {
          const course = await getCourseDetailForAdvisor(courseId);

          if (!course) {
            return {
              ok: true,
              found: false,
              message: `Không tìm thấy học phần với id: ${courseId}`
            };
          }

          return {
            ok: true,
            found: true,
            course
          };
        } catch (error) {
          return createToolError(error);
        }
      }
    }),

    getTopCourses: tool({
      description: "Lấy danh sách học phần phổ biến từ backend.",
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .describe("Số học phần phổ biến cần lấy")
      }),
      execute: async ({ limit }) => {
        try {
          const courses = await getTopCoursesForAdvisor(limit ?? 5);

          return {
            ok: true,
            courses
          };
        } catch (error) {
          return createToolError(error);
        }
      }
    }),

    getMyEnrollments: tool({
      description:
        "Lấy học phần đã đăng ký của sinh viên hiện tại. Chỉ dùng khi người dùng hỏi về lịch sử đăng ký cá nhân.",
      inputSchema: z.object({}),
      execute: async () => {
        if (!authToken) {
          return {
            ok: true,
            authenticated: false,
            message: "Người dùng chưa đăng nhập, không thể xem học phần đã đăng ký."
          };
        }

        try {
          const enrollments = await getMyEnrollmentsForAdvisor(authToken);

          return {
            ok: true,
            authenticated: true,
            enrollments
          };
        } catch (error) {
          return createToolError(error);
        }
      }
    })
  };
}
