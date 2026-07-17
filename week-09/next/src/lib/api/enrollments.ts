import "server-only";

import {
  CREATE_MY_ENROLLMENT_MUTATION,
  MY_ENROLLMENTS_QUERY
} from "@/lib/graphql/documents";
import { graphQLRequest } from "@/lib/graphql/client";
import type {
  CreateMyEnrollmentResult,
  MyEnrollmentsResult
} from "@/lib/graphql/types";

export async function getMyEnrollments(token: string) {
  const data = await graphQLRequest<MyEnrollmentsResult>({
    query: MY_ENROLLMENTS_QUERY,
    token,
    cache: "no-store"
  });

  return data.myEnrollments;
}

export async function createMyEnrollment(params: {
  token: string;
  courseId: string;
}) {
  const data = await graphQLRequest<
    CreateMyEnrollmentResult,
    { courseId: string }
  >({
    query: CREATE_MY_ENROLLMENT_MUTATION,
    variables: {
      courseId: params.courseId
    },
    token: params.token,
    cache: "no-store"
  });

  return data.createMyEnrollment;
}
