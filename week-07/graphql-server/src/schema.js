export const typeDefs = `#graphql
  type Student {
    id: ID!
    name: String!
    email: String!
  }

  type Course {
    id: ID!
    title: String!
    description: String
    status: String!
    enrolledCount: Int!
    capacity: Int!
    instanceName: String!
  }

  type AuthPayload {
    token: String!
    student: Student!
  }

  type PageInfo {
    total: Int!
    limit: Int!
    offset: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  type StudentPage {
    items: [Student!]!
    pageInfo: PageInfo!
  }

  type CoursePage {
    items: [Course!]!
    pageInfo: PageInfo!
  }

  type Enrollment {
    id: ID!
    studentId: ID!
    courseId: ID!
    status: String!
    student: Student!
    course: Course!
  }

  input CreateStudentInput {
    name: String!
    email: String!
    password: String!
  }

  input CreateEnrollmentInput {
    studentId: ID!
    courseId: ID!
  }

  type Query {
    student(id: ID!): Student
    me: Student
    students(limit: Int, offset: Int): [Student!]!
    studentsPage(limit: Int, offset: Int): StudentPage!
    course(id: ID!): Course
    courses(limit: Int, offset: Int): [Course!]!
    coursesPage(limit: Int, offset: Int): CoursePage!
    topCourses(limit: Int = 10): [Course!]!
    enrollmentsByStudent(studentId: ID!): [Enrollment!]!
    myEnrollments: [Enrollment!]!
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    createStudent(input: CreateStudentInput!): Student!
    createEnrollment(input: CreateEnrollmentInput!): Enrollment!
    createMyEnrollment(courseId: ID!): Enrollment!
  }
`;