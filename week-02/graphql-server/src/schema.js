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

  input CreateStudentInput {
    name: String!
    email: String!
    password: String!
  }

  input CreateCourseInput {
    title: String!
    description: String
  }

  type Query {
    student(id: ID!): Student
    me: Student
    students(limit: Int, offset: Int): [Student!]!
    studentsPage(limit: Int, offset: Int): StudentPage!
    course(id: ID!): Course
    courses(limit: Int, offset: Int): [Course!]!
    coursesPage(limit: Int, offset: Int): CoursePage!
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    createStudent(input: CreateStudentInput!): Student!
    createCourse(input: CreateCourseInput!): Course!
    enrollCourse(courseId: ID!): Boolean!
    unenrollCourse(courseId: ID!): Boolean!
  }
`;
