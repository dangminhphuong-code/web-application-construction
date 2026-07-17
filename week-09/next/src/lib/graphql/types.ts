export type Student = {
  id: string;
  name: string;
  email: string;
};

export type PageInfo = {
  total: number;
  limit: number;
  offset: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type Course = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  enrolledCount: number;
  capacity: number;
  instanceName: string;
};

export type CoursePage = {
  items: Course[];
  pageInfo: PageInfo;
};

export type Enrollment = {
  id: string;
  studentId: string;
  courseId: string;
  status: string;
  student: Student;
  course: Course;
};

export type AuthPayload = {
  token: string;
  student: Student;
};

export type CoursesPageResult = {
  coursesPage: CoursePage;
};

export type TopCoursesResult = {
  topCourses: Course[];
};

export type CourseResult = {
  course: Course | null;
};

export type LoginResult = {
  login: AuthPayload;
};

export type MeResult = {
  me: Student | null;
};

export type CreateStudentResult = {
  createStudent: Student;
};

export type MyEnrollmentsResult = {
  myEnrollments: Enrollment[];
};

export type CreateMyEnrollmentResult = {
  createMyEnrollment: Enrollment;
};
