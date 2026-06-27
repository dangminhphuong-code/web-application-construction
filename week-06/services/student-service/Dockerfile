FROM node:22-alpine

WORKDIR /app/services/student-service

COPY services/student-service/package*.json ./
RUN npm install --omit=dev

COPY protos /app/protos
COPY services/student-service ./

EXPOSE 50051 3001

CMD ["npm", "run", "start:docker"]
