import "dotenv/config";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

import { authenticateHttp, authenticateSocket } from "./auth.js";
import {
  createMessageForStudent,
  getConversationForStudent,
  getOrCreateDirectConversation,
  listConversationsForStudent,
  listMessagesForStudent
} from "./chatRepository.js";
import { db } from "./db.js";

const PORT = Number(process.env.PORT || 3005);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    credentials: true
  }
});

function studentRoom(studentId) {
  return `student:${studentId}`;
}

function conversationRoom(conversationId) {
  return `conversation:${conversationId}`;
}

function emitToConversation(conversation, eventName, payload) {
  let emitter = io.to(conversationRoom(conversation.id));

  for (const participant of conversation.participants) {
    emitter = emitter.to(studentRoom(participant.studentId));
  }

  emitter.emit(eventName, payload);
}

function ackSuccess(ack, payload) {
  if (typeof ack === "function") {
    ack({
      ok: true,
      ...payload
    });
  }
}

function ackError(socket, ack, error) {
  const payload = {
    ok: false,
    message: error.message,
    code: error.code || "SOCKET_ERROR"
  };

  if (typeof ack === "function") {
    ack(payload);
    return;
  }

  socket.emit("chat.error", payload);
}

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true
  })
);
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await db.raw("select 1");
    res.json({
      status: "ok",
      service: "chat-service",
      socketClients: io.engine.clientsCount
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      service: "chat-service",
      message: error.message
    });
  }
});

app.use(authenticateHttp);

app.get("/conversations", async (req, res, next) => {
  try {
    res.json({
      data: await listConversationsForStudent(req.user.studentId)
    });
  } catch (error) {
    next(error);
  }
});

app.post("/conversations/direct", async (req, res, next) => {
  try {
    const conversation = await getOrCreateDirectConversation(
      req.user.studentId,
      req.body.recipientStudentId
    );

    emitToConversation(conversation, "conversation.updated", {
      conversation
    });

    res.status(201).json({
      data: conversation
    });
  } catch (error) {
    next(error);
  }
});

app.get("/conversations/:conversationId/messages", async (req, res, next) => {
  try {
    res.json({
      data: await listMessagesForStudent(req.params.conversationId, req.user.studentId, {
        limit: req.query.limit
      })
    });
  } catch (error) {
    next(error);
  }
});

app.post("/conversations/:conversationId/messages", async (req, res, next) => {
  try {
    const result = await createMessageForStudent({
      conversationId: req.params.conversationId,
      senderStudentId: req.user.studentId,
      content: req.body.content
    });

    emitToConversation(result.conversation, "message.created", {
      message: result.message
    });

    res.status(201).json({
      data: result.message
    });
  } catch (error) {
    next(error);
  }
});

io.use(authenticateSocket);

io.on("connection", (socket) => {
  socket.join(studentRoom(socket.user.studentId));

  socket.emit("chat.connected", {
    studentId: socket.user.studentId
  });

  socket.on("conversation:join", async (payload = {}, ack) => {
    try {
      const conversation = await getConversationForStudent(
        payload.conversationId,
        socket.user.studentId
      );

      socket.join(conversationRoom(conversation.id));

      ackSuccess(ack, {
        conversation
      });
    } catch (error) {
      ackError(socket, ack, error);
    }
  });

  socket.on("message:send", async (payload = {}, ack) => {
    try {
      const result = await createMessageForStudent({
        conversationId: payload.conversationId,
        senderStudentId: socket.user.studentId,
        content: payload.content
      });

      emitToConversation(result.conversation, "message.created", {
        message: result.message
      });

      ackSuccess(ack, {
        message: result.message
      });
    } catch (error) {
      ackError(socket, ack, error);
    }
  });
});

app.use((error, _req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const status = error.status || 500;
  res.status(status).json({
    message: error.message,
    code: error.code || "INTERNAL_ERROR"
  });
});

httpServer.listen(PORT, () => {
  console.log(`[chat-service] HTTP/Socket.IO listening on port ${PORT}`);
});

process.on("SIGTERM", async () => {
  await db.destroy();
  httpServer.close(() => process.exit(0));
});
