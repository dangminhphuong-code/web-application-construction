export const COURSES_PAGE_QUERY = /* GraphQL */ `
  query CoursesPage($limit: Int, $offset: Int) {
    coursesPage(limit: $limit, offset: $offset) {
      items {
        id
        title
        description
        status
        enrolledCount
        capacity
        instanceName
      }
      pageInfo {
        total
        limit
        offset
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

export const TOP_COURSES_QUERY = /* GraphQL */ `
  query TopCourses($limit: Int) {
    topCourses(limit: $limit) {
      id
      title
      description
      status
      enrolledCount
      capacity
      instanceName
    }
  }
`;

export const COURSE_DETAIL_QUERY = /* GraphQL */ `
  query CourseDetail($id: ID!) {
    course(id: $id) {
      id
      title
      description
      status
      enrolledCount
      capacity
      instanceName
    }
  }
`;

export const LOGIN_MUTATION = /* GraphQL */ `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      student {
        id
        name
        email
      }
    }
  }
`;

export const CREATE_STUDENT_MUTATION = /* GraphQL */ `
  mutation CreateStudent($input: CreateStudentInput!) {
    createStudent(input: $input) {
      id
      name
      email
    }
  }
`;

export const ME_QUERY = /* GraphQL */ `
  query Me {
    me {
      id
      name
      email
    }
  }
`;

export const MY_ENROLLMENTS_QUERY = /* GraphQL */ `
  query MyEnrollments {
    myEnrollments {
      id
      studentId
      courseId
      status
      student {
        id
        name
        email
      }
      course {
        id
        title
        description
        status
        enrolledCount
        capacity
        instanceName
      }
    }
  }
`;

export const CREATE_MY_ENROLLMENT_MUTATION = /* GraphQL */ `
  mutation CreateMyEnrollment($courseId: ID!) {
    createMyEnrollment(courseId: $courseId) {
      id
      studentId
      courseId
      status
      course {
        id
        title
        description
        status
        enrolledCount
        capacity
        instanceName
      }
    }
  }
`;
