# Test GraphQL va RabbitMQ - Week 04

## 1. Chay he thong

```powershell
cd "F:\Web Application Construction\Week4"
docker compose down -v
docker compose up -d --build
docker compose ps
```

Mo GraphQL:

```text
http://localhost:4000/graphql
```

Mo RabbitMQ UI:

```text
http://localhost:15672
user: app
password: app123
```

Xem log worker/consumer:

```powershell
docker compose logs -f enrollment-outbox-worker course-enrollment-consumer
```

## 2. Du lieu seed can nho

Tai khoan test:

```text
email: an@example.com
password: student123
studentId: 11111111-1111-1111-1111-111111111111
```

Course seed:

```text
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1 - Web Application Construction
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2 - Database Systems
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3 - Distributed Systems
```

## 3. Login lay JWT token

```graphql
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
```

Variables:

```json
{
  "email": "an@example.com",
  "password": "student123"
}
```

## 4. Lay danh sach course truoc khi enroll

```graphql
query Courses {
  coursesPage(limit: 10, offset: 0) {
    items {
      id
      title
      status
      enrolledCount
      capacity
    }
    pageInfo {
      total
      hasNextPage
    }
  }
}
```

Ghi lai `enrolledCount` cua course can test, vi no se tang bat dong bo sau khi RabbitMQ consumer xu ly event.

## 5. Tao enrollment bang token dang nhap

Header:

```json
{
  "Authorization": "Bearer <TOKEN_TU_BUOC_LOGIN>"
}
```

Mutation:

```graphql
mutation CreateMyEnrollment($courseId: ID!) {
  createMyEnrollment(courseId: $courseId) {
    id
    studentId
    courseId
    status
    student {
      name
      email
    }
    course {
      id
      title
      enrolledCount
      capacity
    }
  }
}
```

Variables:

```json
{
  "courseId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3"
}
```

Ket qua GraphQL tra ve enrollment ngay lap tuc. `course.enrolledCount` co the chua tang tai thoi diem response vi course-service cap nhat thong qua RabbitMQ.

## 6. Kiem tra cap nhat bat dong bo

Doi 2-5 giay, chay lai query course:

```graphql
query Course($id: ID!) {
  course(id: $id) {
    id
    title
    enrolledCount
    capacity
  }
}
```

Variables:

```json
{
  "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3"
}
```

`enrolledCount` phai tang them 1 sau khi `course-enrollment-consumer` xu ly event.

Kiem tra outbox trong enrollment DB:

```powershell
docker exec -it db_w04 psql -U admin -d enrollment_db -c "select id, event_type, routing_key, status, attempts, published_at from outbox_events order by created_at desc limit 5;"
```

Kiem tra processed event trong course DB:

```powershell
docker exec -it db_w04 psql -U admin -d course_db -c "select event_id, event_type, processed_at from processed_events order by processed_at desc limit 5;"
```

## 7. Kiem tra enrollment cua user hien tai

Header:

```json
{
  "Authorization": "Bearer <TOKEN_TU_BUOC_LOGIN>"
}
```

Query:

```graphql
query MyEnrollments {
  myEnrollments {
    id
    status
    course {
      id
      title
      enrolledCount
    }
  }
}
```

## 8. Kich ban loi nen test

Tao lai enrollment cung `courseId` o buoc 5. GraphQL phai tra loi loi `ALREADY_EXISTS`.

Tao enrollment voi `courseId` khong ton tai:

```json
{
  "courseId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa99"
}
```

GraphQL phai tra loi loi `NOT_FOUND`.

## 9. Chay thu cong khong dung Docker Compose full

Can chay cac terminal rieng:

```powershell
npm install
npm run migrate
npm run seed
npm run start:student
npm run start:course
npm run start:enrollment
npm run worker:outbox
npm run consumer:enrollment
npm run start:graphql
```

Neu chay local, RabbitMQ can dang mo o `localhost:5672` voi user `app/app123`.
