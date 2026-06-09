# Week 05 - Tinh Nang Va Chuc Nang Da Them

## Kien truc

- Tach he thong thanh nhieu service: `student-service`, `course-service`, `enrollment-service`, va `graphql-server`.
- GraphQL server dong vai tro gateway, nhan request tu client va goi cac service bang gRPC.
- Moi service co database/schema rieng theo huong microservices.
- Tich hop RabbitMQ de xu ly bat dong bo event `EnrollmentConfirmed` va `CourseEnrollmentCountIncreased`.
- Bo sung notification realtime bang Server-Sent Events.
- Bo sung chat realtime giua cac student bang REST + Socket.IO.

## Student Service

- Quan ly danh sach sinh vien.
- Tao sinh vien moi voi password duoc hash bang `bcryptjs`.
- Dang nhap bang email/password.
- Tra ve thong tin sinh vien theo id.
- Ho tro batch get students de GraphQL load nested field hieu qua.
- Co health check tai port `3001`.

## Course Service

- Quan ly danh sach mon hoc.
- Lay danh sach course co phan trang.
- Lay course theo id.
- Ho tro batch get courses.
- Luu `enrolled_count` va `capacity` cho moi course.
- Co RabbitMQ consumer xu ly event `EnrollmentConfirmed` tu queue `course.enrollment.confirmed.queue` de tang `enrolled_count`.
- Co bang `processed_events` de dam bao idempotency, tranh xu ly trung event.
- Co bang `outbox_events` de ghi event `CourseEnrollmentCountIncreased` sau khi `enrolled_count` tang.
- Co `course-outbox-worker` publish event len exchange `course.events`.
- Co health check tai port `3002`.

## Enrollment Service

- Tao dang ky hoc phan.
- Kiem tra sinh vien ton tai va dang ACTIVE truoc khi dang ky.
- Kiem tra course ton tai, dang OPEN va chua day.
- Chan dang ky trung cung mot student/course bang unique constraint.
- Tao enrollment va outbox event trong cung mot database transaction.
- Co outbox worker doc bang `outbox_events` va publish event len RabbitMQ.
- Co circuit breaker khi goi student-service va course-service.
- Co health check tai port `3003`.

## Notification Service

- Consume event `CourseEnrollmentCountIncreased` tu RabbitMQ.
- Cung cap SSE endpoint `http://localhost:3004/events`.
- Xac thuc SSE bang JWT token qua query `token` hoac Bearer token.
- Co the loc notification theo `courseId`.
- Co health check tai port `3004`.

## Chat Service

- Tao direct conversation giua 2 student.
- Luu conversation, participant va message vao `chat_db`.
- Cung cap REST API:
  - `POST /conversations/direct`
  - `GET /conversations`
  - `GET /conversations/:conversationId/messages`
  - `POST /conversations/:conversationId/messages`
- Ho tro realtime bang Socket.IO voi event `conversation:join` va `message:send`.
- Xac thuc bang JWT token tu GraphQL login.
- Co health check tai port `3005`.

## GraphQL Server

- Cung cap GraphQL endpoint tai `http://localhost:4000/graphql`.
- Ho tro cac query:
  - `student`
  - `me`
  - `students`
  - `studentsPage`
  - `course`
  - `courses`
  - `coursesPage`
  - `enrollmentsByStudent`
  - `myEnrollments`
- Ho tro cac mutation:
  - `login`
  - `createStudent`
  - `createEnrollment`
  - `createMyEnrollment`
- Tao va doc JWT token qua header `Authorization`.
- Dung DataLoader de load nested field `Enrollment.student` va `Enrollment.course`.
- Co circuit breaker khi goi cac gRPC backend service.
- Co health check tai `http://localhost:4000/health`.

## Docker Va Database

- `docker-compose.yml` chay Postgres, RabbitMQ, cac backend service, GraphQL gateway, outbox worker, notification service va chat service.
- `init-db/01-create-databases.sql` tao cac database rieng:
  - `student_db`
  - `course_db`
  - `enrollment_db`
  - `chat_db`
- Moi service co migration va seed rieng.

## Test GraphQL Chinh

- Login lay JWT token.
- Lay danh sach students/courses.
- Tao enrollment bang `createEnrollment`.
- Tao enrollment cho user dang login bang `createMyEnrollment`.
- Xem enrollment cua user bang `myEnrollments`.
- Kiem tra `enrolledCount` tang sau khi RabbitMQ consumer xu ly event.
