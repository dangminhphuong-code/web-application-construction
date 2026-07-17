export type CourseForAdvisor = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  enrolledCount: number;
  capacity: number;
  instanceName: string | null;
};

export type EnrollmentForAdvisor = {
  id: string;
  status: string;
  course: CourseForAdvisor;
};

export type CourseSearchResult = {
  course: CourseForAdvisor;
  score: number;
  matchedBy: "embedding" | "keyword";
};

export type IndexedCourse = {
  course: CourseForAdvisor;
  text: string;
  embedding: number[] | null;
};
