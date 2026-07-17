export type Course = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  enrolledCount: number;
  capacity: number;
  instanceName: string | null;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

const GRAPHQL_ENDPOINT =
  process.env.BACKEND_GRAPHQL_URL ?? "http://localhost:4000/graphql";
const READ_TOKEN = process.env.COURSE_PORTAL_READ_TOKEN;

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
  query McpCourses($limit: Int, $offset: Int) {
    courses(limit: $limit, offset: $offset) {
      ${COURSE_FIELDS}
    }
  }
`;

const COURSE_DETAIL_QUERY = `
  query McpCourse($id: ID!) {
    course(id: $id) {
      ${COURSE_FIELDS}
    }
  }
`;

async function graphQLRequest<T>(
  query: string,
  variables: Record<string, unknown> = {}
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (READ_TOKEN) {
    headers.Authorization = `Bearer ${READ_TOKEN}`;
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers,
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

export async function listCourses(limit = 100) {
  const data = await graphQLRequest<{ courses: Course[] }>(COURSES_QUERY, {
    limit,
    offset: 0
  });

  return data.courses;
}

export async function getCourseById(id: string) {
  const data = await graphQLRequest<{ course: Course | null }>(
    COURSE_DETAIL_QUERY,
    { id }
  );

  return data.course;
}

function keywordScore(query: string, course: Course) {
  const words = query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const keywords = words.filter((word) => word.length >= 2);

  if (!keywords.length) {
    return 0;
  }

  const text = [
    course.id,
    course.title,
    course.description,
    course.status,
    course.instanceName
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return keywords.reduce(
    (score, word) => score + (text.includes(word) ? 1 : 0),
    0
  );
}

export function searchCoursesLocally(
  courses: Course[],
  query: string,
  options: { onlyOpen?: boolean; limit?: number } = {}
) {
  const limit = Math.min(Math.max(options.limit ?? 5, 1), 20);

  return courses
    .filter((course) =>
      options.onlyOpen ? course.status.toLowerCase() === "open" : true
    )
    .map((course) => ({
      course,
      score: keywordScore(query, course)
    }))
    .filter((result) => result.score > 0 || query.trim().length === 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
