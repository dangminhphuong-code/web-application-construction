import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  getCourseById,
  listCourses,
  searchCoursesLocally
} from "./graphql.js";

const server = new McpServer({
  name: "course-portal",
  version: "1.0.0"
});

function asJson(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

server.registerTool(
  "search_courses",
  {
    title: "Search courses",
    description:
      "Read-only search for courses in the course registration backend.",
    inputSchema: {
      query: z
        .string()
        .default("")
        .describe("Natural language query or course keyword."),
      onlyOpen: z
        .boolean()
        .optional()
        .describe("Only return courses with OPEN status."),
      limit: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe("Maximum number of courses to return.")
    }
  },
  async ({ query, onlyOpen, limit }) => {
    const courses = await listCourses(100);
    const results = searchCoursesLocally(courses, query, {
      onlyOpen,
      limit
    });

    return asJson({
      ok: true,
      count: results.length,
      courses: results.map((result) => ({
        ...result.course,
        score: result.score
      }))
    });
  }
);

server.registerTool(
  "get_course_detail",
  {
    title: "Get course detail",
    description:
      "Read-only lookup for one course by id in the course registration backend.",
    inputSchema: {
      courseId: z.string().min(1).describe("Course id.")
    }
  },
  async ({ courseId }) => {
    const course = await getCourseById(courseId);

    return asJson({
      ok: true,
      found: Boolean(course),
      course
    });
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("course-portal MCP server started");
