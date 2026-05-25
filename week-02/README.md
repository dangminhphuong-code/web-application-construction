# Huong dan query test GraphQL

## 1. Chay server

Bat Docker Desktop, sau do chay trong thu muc `Week1`:

```bash
docker compose up -d --build
```

Neu chay local khong dung Docker, can chay dung GraphQL gateway:

```bash
npm run dev:student
npm run dev:course
npm run dev:enrollment
npm run dev:graphql
```

Neu dang chay server cu bang `node server.js`, hay tat server do va chay lai. Server cu o root co the khong dung schema trong `graphql-server`.

Mo GraphQL Sandbox:

```text
http://localhost:4000/graphql
```

Tai khoan seed de test login:

```text
email: an@example.com
password: student123
```

Student id mau:

```text
11111111-1111-1111-1111-111111111111
```

## 2. Test lay 1 student

Query:

```graphql
query S($studentId: ID!) {
  student(id: $studentId) {
    id
    name
  }
}
```

Variables:

```json
{
  "studentId": "11111111-1111-1111-1111-111111111111"
}
```

## 3. Test login

Query:

```graphql
mutation Login($email: String!, $pwd: String!) {
  login(email: $email, password: $pwd) {
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
  "pwd": "student123"
}
```

## 4. Test lay danh sach students

Query:

```graphql
query ListS($limit: Int, $offset: Int) {
  students(limit: $limit, offset: $offset) {
    name
  }
}
```

Variables:

```json
{
  "limit": 10,
  "offset": 0
}
```
