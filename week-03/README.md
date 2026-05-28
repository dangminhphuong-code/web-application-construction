# Week 03 - Microservices, gRPC, GraphQL

Project nay lam theo PDF `HDTH_Tuan03`: refactor bai truoc thanh kien truc microservices va test qua GraphQL gateway.

## Chay bang Docker

```powershell
cd "F:\Web Application Construction\Week3\Week1"
docker compose up -d --build
```

Mo GraphQL endpoint:

```text
http://localhost:4000/graphql
```

Kiem tra container:

```powershell
docker compose ps
```

Neu muon reset database:

```powershell
docker compose down -v
docker compose up -d --build
```

## Tai khoan test

```text
email: an@example.com
password: student123
```

Course seed mac dinh:

```text
1, 2, 3
```

## Query/Muation GraphQL chinh

### Login

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

### Courses

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
  }
}
```

### Create Enrollment

```graphql
mutation CreateEnrollment($input: CreateEnrollmentInput!) {
  createEnrollment(input: $input) {
    id
    studentId
    courseId
    status
    student {
      name
      email
    }
    course {
      title
      enrolledCount
    }
  }
}
```

Variables:

```json
{
  "input": {
    "studentId": "11111111-1111-1111-1111-111111111111",
    "courseId": 1
  }
}
```

### Create My Enrollment

Can them header:

```json
{
  "Authorization": "Bearer <TOKEN>"
}
```

```graphql
mutation CreateMyEnrollment($courseId: ID!) {
  createMyEnrollment(courseId: $courseId) {
    id
    studentId
    courseId
    status
    course {
      title
      enrolledCount
    }
  }
}
```

Variables:

```json
{
  "courseId": 3
}
```

## Tai lieu tinh nang

Xem file `FEATURES.md` de biet cac tinh nang/chuc nang da them.
