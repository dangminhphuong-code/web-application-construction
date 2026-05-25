export const typeDefs = `#graphql
  type Student {
    id: ID!
    name: String!
    email: String!
    courses: [Course!]!
  }

  type Course {
    id: ID!
    title: String!
    description: String
    students: [Student!]!
  }

  type PageInfo {
    total: Int!
    limit: Int!
    offset: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  type CoursePage {
    items: [Course!]!
    pageInfo: PageInfo!
  }

  type StudentPage {
    items: [Student!]!
    pageInfo: PageInfo!
  }

  type Query {
    courses(limit: Int, offset: Int): [Course!]!
    coursesPage(limit: Int, offset: Int): CoursePage!
    course(id: ID!): Course
    studentsPage(limit: Int, offset: Int): StudentPage!
    student(id: ID!): Student
  }

  type AuthPayload {
    token: String!
    student: Student!
  }

  input CreateCourseInput {
    title: String!
    description: String
  }

  input CreateStudentInput {
    name: String!
    email: String!
    password: String!
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    createCourse(input: CreateCourseInput!): Course!
    createStudent(input: CreateStudentInput!): Student!
    enrollCourse(courseId: ID!): Boolean!
    unenrollCourse(courseId: ID!): Boolean!
  }
`;