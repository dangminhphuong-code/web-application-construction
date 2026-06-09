# Week 05 - Microservices realtime

Project nay phat trien tiep tu Week 04: gRPC microservices, GraphQL gateway, RabbitMQ outbox, notification realtime bang SSE va chat realtime.

## Cach chay nhanh bang Docker

```powershell
cd "F:\Web Application Construction\Week5"
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
- `course-outbox-worker`: doc course outbox va publish `CourseEnrollmentCountIncreased`
- `notification-service`: SSE `3004`, endpoint `/events`
- `chat-service`: REST + Socket.IO `3005`

## Luong Week 05

1. `enrollment-service` ghi enrollment va outbox event `EnrollmentConfirmed`.
2. `enrollment-outbox-worker` publish event len `enrollment.events`.
3. `course-enrollment-consumer` consume event, tang `courses.enrolled_count`, ghi course outbox event `CourseEnrollmentCountIncreased`.
4. `course-outbox-worker` publish event len `course.events`.
5. `notification-service` consume `course.enrolled_count.increased` va broadcast SSE cho client.

## Tai lieu test GraphQL

Xem [TEST_GRAPHQL.md](./TEST_GRAPHQL.md) de co mutation/query, variables, headers va cac lenh kiem tra RabbitMQ/outbox.
