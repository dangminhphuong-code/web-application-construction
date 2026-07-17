export function createError(message, code = "INVALID_ARGUMENT", status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

export function normalizeId(value, fieldName) {
  if (!value || !String(value).trim()) {
    throw createError(`${fieldName} is required`);
  }

  return String(value).trim();
}

export function normalizeMessageContent(value) {
  if (typeof value !== "string") {
    throw createError("Message content is required");
  }

  const content = value.trim();

  if (!content) {
    throw createError("Message content is required");
  }

  if (content.length > 1000) {
    throw createError("Message content must be at most 1000 characters");
  }

  return content;
}

