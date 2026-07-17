import "server-only";

import { embed, embedMany } from "ai";

import {
  courseAdvisorEmbeddingModel,
  hasGithubModelsToken
} from "./github-models";
import { getCoursesForAdvisor } from "./graphql";
import type {
  CourseForAdvisor,
  CourseSearchResult,
  IndexedCourse
} from "./types";

const INDEX_TTL_MS = 5 * 60 * 1000;

let cachedIndex: {
  createdAt: number;
  items: IndexedCourse[];
} | null = null;

function courseToDocument(course: CourseForAdvisor) {
  return [
    `Mã học phần: ${course.id}`,
    `Tên học phần: ${course.title}`,
    course.description ? `Mô tả: ${course.description}` : null,
    `Trạng thái: ${course.status}`,
    `Sĩ số: ${course.enrolledCount}/${course.capacity}`,
    course.instanceName ? `Backend instance: ${course.instanceName}` : null
  ]
    .filter(Boolean)
    .join("\n");
}

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (!normA || !normB) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function keywordScore(query: string, text: string) {
  const words = query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const keywords = words.filter((word) => word.length >= 2);

  if (!keywords.length) {
    return 0;
  }

  const haystack = text.toLowerCase();
  return keywords.reduce(
    (score, word) => score + (haystack.includes(word) ? 1 : 0),
    0
  );
}

async function buildCourseIndex(): Promise<IndexedCourse[]> {
  const courses = await getCoursesForAdvisor(100);
  const values = courses.map(courseToDocument);

  if (!values.length) {
    return [];
  }

  if (!hasGithubModelsToken()) {
    return courses.map((course, index) => ({
      course,
      text: values[index],
      embedding: null
    }));
  }

  try {
    const { embeddings } = await embedMany({
      model: courseAdvisorEmbeddingModel(),
      values
    });

    return courses.map((course, index) => ({
      course,
      text: values[index],
      embedding: embeddings[index] ?? null
    }));
  } catch {
    return courses.map((course, index) => ({
      course,
      text: values[index],
      embedding: null
    }));
  }
}

export async function getCourseIndex() {
  if (cachedIndex && Date.now() - cachedIndex.createdAt < INDEX_TTL_MS) {
    return cachedIndex.items;
  }

  const items = await buildCourseIndex();

  if (items.length > 0) {
    cachedIndex = {
      createdAt: Date.now(),
      items
    };
  }

  return items;
}

export async function searchCoursesByRag(
  query: string,
  options: {
    onlyOpen?: boolean;
    limit?: number;
  } = {}
): Promise<CourseSearchResult[]> {
  const limit = Math.min(Math.max(options.limit ?? 5, 1), 10);
  const index = await getCourseIndex();

  if (!index.length) {
    return [];
  }

  const filtered = index.filter((item) => {
    if (!options.onlyOpen) {
      return true;
    }

    return item.course.status.toLowerCase() === "open";
  });

  let queryEmbedding: number[] | null = null;

  if (hasGithubModelsToken() && filtered.some((item) => item.embedding)) {
    try {
      const result = await embed({
        model: courseAdvisorEmbeddingModel(),
        value: query
      });
      queryEmbedding = result.embedding;
    } catch {
      queryEmbedding = null;
    }
  }

  return filtered
    .map((item) => {
      if (queryEmbedding && item.embedding) {
        return {
          course: item.course,
          score: cosineSimilarity(queryEmbedding, item.embedding),
          matchedBy: "embedding" as const
        };
      }

      return {
        course: item.course,
        score: keywordScore(query, item.text),
        matchedBy: "keyword" as const
      };
    })
    .filter((item) => item.score > 0 || query.trim().length === 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function formatCourseForAdvisor(course: CourseForAdvisor) {
  return `${course.title} (${course.id}) - trạng thái ${course.status}, sĩ số ${course.enrolledCount}/${course.capacity}${course.description ? `, mô tả: ${course.description}` : ""}`;
}
