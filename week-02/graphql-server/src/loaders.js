import DataLoader from "dataloader";

function unique(values) {
  return [...new Set(values.filter(Boolean).map(String))];
}

function sortByInputIds(items, ids) {
  const map = new Map(items.map((item) => [String(item.id), item]));

  return ids
    .map((id) => map.get(String(id)))
    .filter(Boolean);
}

export function createLoaders(grpcClients) {
  return {
    studentById: new DataLoader(async (ids) => {
      const requestIds = unique(ids);
      const response = await grpcClients.student.call("batchGetStudents", {
        ids: requestIds
      });
      const students = sortByInputIds(response.students || [], requestIds);
      const studentsById = new Map(students.map((student) => [student.id, student]));

      return ids.map((id) => studentsById.get(String(id)) || null);
    }),

    courseById: new DataLoader(async (ids) => {
      const requestIds = unique(ids);
      const response = await grpcClients.course.call("batchGetCourses", {
        ids: requestIds
      });
      const courses = sortByInputIds(response.courses || [], requestIds);
      const coursesById = new Map(courses.map((course) => [course.id, course]));

      return ids.map((id) => coursesById.get(String(id)) || null);
    }),

    courseIdsByStudentId: new DataLoader(async (studentIds) => {
      return Promise.all(
        studentIds.map(async (studentId) => {
          const response = await grpcClients.enrollment.call("listStudentCourseIds", {
            student_id: String(studentId)
          });

          return response.course_ids || [];
        })
      );
    }),

    studentIdsByCourseId: new DataLoader(async (courseIds) => {
      return Promise.all(
        courseIds.map(async (courseId) => {
          const response = await grpcClients.enrollment.call("listCourseStudentIds", {
            course_id: String(courseId)
          });

          return response.student_ids || [];
        })
      );
    })
  };
}
