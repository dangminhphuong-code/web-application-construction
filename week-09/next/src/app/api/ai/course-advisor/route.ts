import { stepCountIs, streamText, type ModelMessage } from "ai";

import {
  courseAdvisorChatModel,
  hasGithubModelsToken
} from "@/lib/ai/course-advisor/github-models";
import {
  buildLocalAdvisorAnswer,
  COURSE_ADVISOR_SYSTEM_PROMPT
} from "@/lib/ai/course-advisor/prompts";
import {
  formatCourseForAdvisor,
  searchCoursesByRag
} from "@/lib/ai/course-advisor/rag";
import { createCourseAdvisorTools } from "@/lib/ai/course-advisor/tools";
import { getAuthToken } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClientMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
};

function toModelMessages(messages: ClientMessage[]): ModelMessage[] {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .filter((message) => message.content.trim().length > 0)
    .map((message) => ({
      role: message.role,
      content: message.content
    }));
}

function latestUserMessage(messages: ClientMessage[]) {
  return [...messages]
    .reverse()
    .find((message) => message.role === "user")
    ?.content.trim();
}

export async function POST(request: Request) {
  const body = (await request.json()) as { messages?: ClientMessage[] };
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const latestQuery = latestUserMessage(messages);

  if (!latestQuery) {
    return new Response("Vui lòng nhập câu hỏi về học phần.", {
      status: 400,
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  }

  const authToken = await getAuthToken();

  if (!hasGithubModelsToken()) {
    const results = await searchCoursesByRag(latestQuery, {
      onlyOpen: true,
      limit: 5
    });

    const answer = buildLocalAdvisorAnswer({
      query: latestQuery,
      courseLines: results.map(
        (result) =>
          `${formatCourseForAdvisor(result.course)} (độ khớp ${result.score.toFixed(
            2
          )}, ${result.matchedBy})`
      )
    });

    return new Response(answer, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  }

  const result = streamText({
    model: courseAdvisorChatModel(),
    system: COURSE_ADVISOR_SYSTEM_PROMPT,
    messages: toModelMessages(messages),
    tools: createCourseAdvisorTools({ authToken }),
    stopWhen: stepCountIs(5)
  });

  return result.toTextStreamResponse();
}
