# Week 04 - Microservices, RabbitMQ, gRPC, GraphQL

Project nay refactor tu Week 03 sang kien truc microservices co tich hop bat dong bo bang RabbitMQ.

## Cach chay nhanh bang Docker

```powershell
cd "F:\Web Application Construction\Week4"
docker compose down -v
docker compose up -d --build
docker compose ps
```

GraphQL endpoint:

```text
http://localhost:4000/graphql
```

RabbitMQ Management UI:

```text
http://localhost:15672
user: app
password: app123
```

## Cac service chinh

- `student-service`: gRPC `50051`, health `3001`
- `course-service`: gRPC `50052`, health `3002`
- `enrollment-service`: gRPC `50053`, health `3003`
- `graphql-server`: GraphQL gateway `4000`
- `enrollment-outbox-worker`: doc outbox va publish event len RabbitMQ
- `course-enrollment-consumer`: consume `EnrollmentConfirmed` va cap nhat `courses.enrolled_count`

## Tai lieu test GraphQL

Xem [TEST_GRAPHQL.md](./TEST_GRAPHQL.md) de co mutation/query, variables, headers va cac lenh kiem tra RabbitMQ/outbox.
