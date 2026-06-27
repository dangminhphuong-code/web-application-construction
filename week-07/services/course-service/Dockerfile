FROM node:22-alpine

WORKDIR /app/services/course-service

COPY services/course-service/package*.json ./
RUN npm install --omit=dev

COPY protos /app/protos
COPY services/course-service ./

EXPOSE 50052 3002

CMD ["npm", "run", "start:docker"]
