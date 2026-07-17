import crypto from "node:crypto";

import { db } from "./db.js";
import {
  createError,
  normalizeId,
  normalizeMessageContent
} from "./errors.js";

function directKeyFor(studentA, studentB) {
  return [studentA, studentB].sort().join(":");
}

function mapParticipant(row) {
  return {
    studentId: row.student_id,
    joinedAt: row.created_at
  };
}

function mapMessage(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderStudentId: row.sender_student_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapConversation(row, participants = [], lastMessage = null) {
  return {
    id: row.id,
    type: row.type,
    directKey: row.direct_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    participants,
    lastMessage
  };
}

async function getParticipants(conversationId) {
  const rows = await db("conversation_participants")
    .select("student_id", "created_at")
    .where({ conversation_id: conversationId })
    .orderBy("created_at", "asc");

  return rows.map(mapParticipant);
}

async function getLastMessage(conversationId) {
  const row = await db("messages")
    .select("id", "conversation_id", "sender_student_id", "content", "created_at", "updated_at")
    .where({ conversation_id: conversationId })
    .orderBy("created_at", "desc")
    .first();

  return row ? mapMessage(row) : null;
}

async function findConversationById(conversationId) {
  const row = await db("conversations")
    .select("id", "type", "direct_key", "created_at", "updated_at")
    .where({ id: conversationId })
    .first();

  if (!row) {
    return null;
  }

  const [participants, lastMessage] = await Promise.all([
    getParticipants(conversationId),
    getLastMessage(conversationId)
  ]);

  return mapConversation(row, participants, lastMessage);
}

export async function ensureConversationParticipant(conversationId, studentId) {
  const participant = await db("conversation_participants")
    .where({
      conversation_id: conversationId,
      student_id: studentId
    })
    .first();

  if (!participant) {
    throw createError("Conversation not found", "NOT_FOUND", 404);
  }
}

export async function getOrCreateDirectConversation(studentIdValue, recipientIdValue) {
  const studentId = normalizeId(studentIdValue, "student_id");
  const recipientStudentId = normalizeId(recipientIdValue, "recipient_student_id");

  if (studentId === recipientStudentId) {
    throw createError("Cannot create a direct conversation with yourself");
  }

  const directKey = directKeyFor(studentId, recipientStudentId);

  const conversationRow = await db.transaction(async (trx) => {
    const inserted = await trx("conversations")
      .insert({
        id: crypto.randomUUID(),
        type: "direct",
        direct_key: directKey
      })
      .onConflict("direct_key")
      .ignore()
      .returning(["id", "type", "direct_key", "created_at", "updated_at"]);

    const row =
      inserted[0] ||
      (await trx("conversations")
        .select("id", "type", "direct_key", "created_at", "updated_at")
        .where({ direct_key: directKey })
        .first());

    if (inserted.length > 0) {
      await trx("conversation_participants")
        .insert([
          {
            conversation_id: row.id,
            student_id: studentId
          },
          {
            conversation_id: row.id,
            student_id: recipientStudentId
          }
        ])
        .onConflict(["conversation_id", "student_id"])
        .ignore();
    }

    return row;
  });

  return findConversationById(conversationRow.id);
}

export async function listConversationsForStudent(studentIdValue) {
  const studentId = normalizeId(studentIdValue, "student_id");

  const rows = await db("conversations as c")
    .join("conversation_participants as mine", "mine.conversation_id", "c.id")
    .select("c.id", "c.type", "c.direct_key", "c.created_at", "c.updated_at")
    .where("mine.student_id", studentId)
    .orderBy("c.updated_at", "desc");

  const conversations = [];

  for (const row of rows) {
    const [participants, lastMessage] = await Promise.all([
      getParticipants(row.id),
      getLastMessage(row.id)
    ]);

    conversations.push(mapConversation(row, participants, lastMessage));
  }

  return conversations;
}

export async function getConversationForStudent(conversationIdValue, studentIdValue) {
  const conversationId = normalizeId(conversationIdValue, "conversation_id");
  const studentId = normalizeId(studentIdValue, "student_id");

  await ensureConversationParticipant(conversationId, studentId);

  const conversation = await findConversationById(conversationId);

  if (!conversation) {
    throw createError("Conversation not found", "NOT_FOUND", 404);
  }

  return conversation;
}

export async function listMessagesForStudent(conversationIdValue, studentIdValue, options = {}) {
  const conversationId = normalizeId(conversationIdValue, "conversation_id");
  const studentId = normalizeId(studentIdValue, "student_id");
  const limit = Math.min(Math.max(Number(options.limit || 50), 1), 100);

  await ensureConversationParticipant(conversationId, studentId);

  const rows = await db("messages")
    .select("id", "conversation_id", "sender_student_id", "content", "created_at", "updated_at")
    .where({ conversation_id: conversationId })
    .orderBy("created_at", "desc")
    .limit(limit);

  return rows.reverse().map(mapMessage);
}

export async function createMessageForStudent({ conversationId, senderStudentId, content }) {
  const normalizedConversationId = normalizeId(conversationId, "conversation_id");
  const normalizedSenderStudentId = normalizeId(senderStudentId, "sender_student_id");
  const normalizedContent = normalizeMessageContent(content);

  const conversation = await getConversationForStudent(
    normalizedConversationId,
    normalizedSenderStudentId
  );

  const [messageRow] = await db("messages")
    .insert({
      id: crypto.randomUUID(),
      conversation_id: normalizedConversationId,
      sender_student_id: normalizedSenderStudentId,
      content: normalizedContent
    })
    .returning(["id", "conversation_id", "sender_student_id", "content", "created_at", "updated_at"]);

  await db("conversations")
    .where({ id: normalizedConversationId })
    .update({
      updated_at: db.fn.now()
    });

  return {
    conversation,
    message: mapMessage(messageRow)
  };
}

