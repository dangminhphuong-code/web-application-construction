import "server-only";

import type { CourseForAdvisor, EnrollmentForAdvisor } from "./types";

const GRAPHQL_ENDPOINT =
  process.env.BACKEND_GRAPHQL_URL ?? "http://localhost:4000/graphql";

const COURSE_FIELDS = `
  id
  title
  description
  status
  enrolledCount
  capacity
  instanceName
`;

const COURSES_QUERY = `
  query AdvisorCourses($limit: Int, $offset: Int) {
    courses(limit: $limit, offset: $offset) {
      ${COURSE_FIELDS}
    }
  }
`;

const COURSE_DETAIL_QUERY = `
  query AdvisorCourse($id: ID!) {
    course(id: $id) {
      ${COURSE_FIELDS}
    }
  }
`;

const TOP_COURSES_QUERY = `
  query AdvisorTopCourses($limit: Int) {
    topCourses(limit: $limit) {
      ${COURSE_FIELDS}
    }
  }
`;

const MY_ENROLLMENTS_QUERY = `
  query AdvisorMyEnrollments {
    myEnrollments {
      id
      status
      course {
        ${COURSE_FIELDS}
      }
    }
  }
`;

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

async function graphQLRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
  token?: string | null
) {
  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`GraphQL HTTP error: ${response.status}`);
  }

  const json = (await response.json()) as GraphQLResponse<T>;

  if (json.errors?.length) {
    throw new Error(json.errors.map((error) => error.message).join("; "));
  }

  if (!json.data) {
    throw new Error("GraphQL response has no data.");
  }

  return json.data;
}

export async function getCoursesForAdvisor(limit = 100) {
  const data = await graphQLRequest<{ courses: CourseForAdvisor[] }>(
    COURSES_QUERY,
    {
      limit,
      offset: 0
    }
  );

  return data.courses;
}

export async function getCourseDetailForAdvisor(id: string) {
  const data = await graphQLRequest<{ course: CourseForAdvisor | null }>(
    COURSE_DETAIL_QUERY,
    {
      id
    }
  );

  return data.course;
}

export async function getTopCoursesForAdvisor(limit = 5) {
  const data = await graphQLRequest<{ topCourses: CourseForAdvisor[] }>(
    TOP_COURSES_QUERY,
    {
      limit
    }
  );

  return data.topCourses;
}

export async function getMyEnrollmentsForAdvisor(token: string) {
  const data = await graphQLRequest<{ myEnrollments: EnrollmentForAdvisor[] }>(
    MY_ENROLLMENTS_QUERY,
    {},
    token
  );

  return data.myEnrollments;
}
