import "server-only";

import {
  COURSE_DETAIL_QUERY,
  COURSES_PAGE_QUERY,
  TOP_COURSES_QUERY
} from "@/lib/graphql/documents";
import { graphQLRequest } from "@/lib/graphql/client";
import type {
  CourseResult,
  CoursesPageResult,
  TopCoursesResult
} from "@/lib/graphql/types";

export async function getCoursesPage(params: { limit: number; offset: number }) {
  const data = await graphQLRequest<CoursesPageResult, typeof params>({
    query: COURSES_PAGE_QUERY,
    variables: params,
    next: {
      revalidate: 30,
      tags: ["courses"]
    }
  });

  return data.coursesPage;
}

export async function getTopCourses(limit = 4) {
  const data = await graphQLRequest<TopCoursesResult, { limit: number }>({
    query: TOP_COURSES_QUERY,
    variables: { limit },
    next: {
      revalidate: 60,
      tags: ["top-courses"]
    }
  });

  return data.topCourses;
}

export async function getCourseById(id: string) {
  const data = await graphQLRequest<CourseResult, { id: string }>({
    query: COURSE_DETAIL_QUERY,
    variables: { id },
    next: {
      revalidate: 30,
      tags: [`course:${id}`]
    }
  });

  return data.course;
}
