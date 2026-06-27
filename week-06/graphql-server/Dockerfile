FROM node:lts-alpine
WORKDIR /app
COPY package*.json ./
COPY graphql-server/package*.json ./graphql-server/
COPY services/student-service/package*.json ./services/student-service/
COPY services/course-service/package*.json ./services/course-service/
COPY services/enrollment-service/package*.json ./services/enrollment-service/
RUN npm ci --omit=dev --workspace=graphql-server --include-workspace-root=false
COPY protos ./protos
COPY graphql-server ./graphql-server
WORKDIR /app/graphql-server
CMD ["npm", "start"]
EXPOSE 4000
