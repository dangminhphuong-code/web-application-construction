# Week 07 - Kubernetes and Unit Tests

This week moves the microservices stack from Docker Compose to Kubernetes and
adds Jest unit tests for backend services.

## Added Features

- Shared `Dockerfile.k8s` with `APP_DIR` build argument for each Node.js service.
- Kubernetes namespace `w07`.
- Kubernetes `Secret` and `ConfigMap` for database, Redis, RabbitMQ, gRPC, JWT,
  cache, and outbox settings.
- Kubernetes deployments/services for PostgreSQL, RabbitMQ, Redis, student,
  course, enrollment, notification, chat, and GraphQL gateway.
- Kubernetes migration/seed jobs for student, course, enrollment, and chat
  databases.
- Kubernetes background deployments for enrollment outbox, course enrollment
  consumer, and course outbox worker.
- `course-service` runs with `replicas: 2`; Kubernetes Service load-balances gRPC
  traffic between the pods.
- Jest unit tests for student-service, course-service, enrollment-service, and
  GraphQL resolvers.

## Build Images

Run these commands in PowerShell:

```powershell
cd "D:\Web Application Construction\week-07"
kubectl config use-context docker-desktop

docker build -f Dockerfile.k8s --build-arg APP_DIR=graphql-server -t w07/graphql-server:dev .
docker build -f Dockerfile.k8s --build-arg APP_DIR=services/student-service -t w07/student-service:dev .
docker build -f Dockerfile.k8s --build-arg APP_DIR=services/course-service -t w07/course-service:dev .
docker build -f Dockerfile.k8s --build-arg APP_DIR=services/enrollment-service -t w07/enrollment-service:dev .
docker build -f Dockerfile.k8s --build-arg APP_DIR=services/notification-service -t w07/notification-service:dev .
docker build -f Dockerfile.k8s --build-arg APP_DIR=services/chat-service -t w07/chat-service:dev .
```

If you use Minikube instead of Docker Desktop Kubernetes, run this before
building images:

```powershell
minikube start
minikube docker-env | Invoke-Expression
```

## Deploy to Kubernetes

Apply infrastructure first:

```powershell
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-config.yaml
kubectl apply -f k8s/02-postgres.yaml
kubectl apply -f k8s/03-rabbitmq.yaml
kubectl apply -f k8s/04-redis.yaml

kubectl wait --for=condition=available deployment/postgres -n w07 --timeout=120s
kubectl wait --for=condition=available deployment/rabbitmq -n w07 --timeout=180s
kubectl wait --for=condition=available deployment/redis -n w07 --timeout=120s
```

Run database jobs:

```powershell
kubectl apply -f k8s/05-jobs.yaml
kubectl wait --for=condition=complete job/student-migrate -n w07 --timeout=180s
kubectl wait --for=condition=complete job/course-migrate -n w07 --timeout=180s
kubectl wait --for=condition=complete job/enrollment-migrate -n w07 --timeout=180s
kubectl wait --for=condition=complete job/chat-migrate -n w07 --timeout=180s
```

Start app services and workers:

```powershell
kubectl apply -f k8s/06-services.yaml
kubectl apply -f k8s/07-workers.yaml
kubectl get pods -n w07 -o wide
kubectl get svc -n w07
```

## Port Forward

GraphQL:

```powershell
kubectl port-forward -n w07 svc/graphql-server 4000:4000
```

Notification SSE:

```powershell
kubectl port-forward -n w07 svc/notification-service 3004:3004
```

RabbitMQ Management UI:

```powershell
kubectl port-forward -n w07 svc/rabbitmq 15672:15672
```

RabbitMQ account: `app` / `app123`.

## Useful Checks

```powershell
kubectl get pods -n w07
kubectl logs -f -n w07 deployment/graphql-server
kubectl logs -f -n w07 deployment/course-service
kubectl logs -f -n w07 deployment/enrollment-outbox-worker
kubectl describe pod -n w07 <pod-name>
```

Test GraphQL after port-forwarding:

```graphql
query {
  topCourses(limit: 5) {
    id
    title
    enrolledCount
    instanceName
  }
}
```

Use `POST http://localhost:4000/graphql` with header
`Content-Type: application/json`.

## Run Unit Tests

Install dependencies once:

```powershell
npm install
```

Run all tests:

```powershell
npm test
```

Run tests one group at a time:

```powershell
npm run test:student
npm run test:course
npm run test:enrollment
npm run test:graphql
```

## Reset Week 07 Kubernetes Resources

```powershell
kubectl delete namespace w07
```

If you only want to rerun migration jobs:

```powershell
kubectl delete job student-migrate course-migrate enrollment-migrate chat-migrate -n w07
kubectl apply -f k8s/05-jobs.yaml
```
