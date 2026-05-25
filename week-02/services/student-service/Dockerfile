FROM node:lts-alpine
WORKDIR /app
COPY package*.json ./
COPY graphql-server/package*.json ./graphql-server/
COPY services/student-service/package*.json ./services/student-service/
COPY services/course-service/package*.json ./services/course-service/
COPY services/enrollment-service/package*.json ./services/enrollment-service/
RUN npm ci --omit=dev --workspace=services/student-service --include-workspace-root=false
COPY protos ./protos
COPY services/student-service ./services/student-service
WORKDIR /app/services/student-service
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh
ENTRYPOINT ["/bin/sh", "docker-entrypoint.sh"]
CMD ["npm", "start"]
EXPOSE 50051 3001
