import type { SendMessageBatchRequestEntry } from "@aws-sdk/client-sqs";

import type { Message } from "./types.js";
import { isObject, isString, isMessageAttributeValid } from "./validation.js";

/**
 * Converts a message object to a SendMessageBatchRequestEntry
 * @param message - The message to convert
 * @returns The SendMessageBatchRequestEntry
 * @throws Will throw an error if the message is invalid
 */
function entryFromObject(message: Message): SendMessageBatchRequestEntry {
  if (!message.body) {
    throw new Error(`Object messages must have 'body' prop`);
  }

  if (!message.groupId && !message.deduplicationId && !message.id) {
    throw new Error(`Object messages must have 'id' prop`);
  }

  if (message.deduplicationId && !message.groupId) {
    throw new Error(`FIFO Queue messages must have 'groupId' prop`);
  }

  if (message.id) {
    if (!isString(message.id)) {
      throw new Error("Message.id value must be a string");
    }
  }

  const entry: SendMessageBatchRequestEntry = {
    Id: message.id,
    MessageBody: message.body,
  };

  if (message.delaySeconds) {
    if (
      typeof message.delaySeconds !== "number" ||
      message.delaySeconds < 0 ||
      message.delaySeconds > 900
    ) {
      throw new Error(
        "Message.delaySeconds value must be a number contained within [0 - 900]",
      );
    }

    entry.DelaySeconds = message.delaySeconds;
  }

  if (message.messageAttributes) {
    if (!isObject(message.messageAttributes)) {
      throw new Error("Message.messageAttributes must be an object");
    }

    Object.values(message.messageAttributes).every(isMessageAttributeValid);

    entry.MessageAttributes = message.messageAttributes;
  }

  if (message.groupId) {
    if (!isString(message.groupId)) {
      throw new Error("Message.groupId value must be a string");
    }

    entry.MessageGroupId = message.groupId;
  }

  if (message.deduplicationId) {
    if (!isString(message.deduplicationId)) {
      throw new Error("Message.deduplicationId value must be a string");
    }

    entry.MessageDeduplicationId = message.deduplicationId;
  }

  return entry;
}

/**
 * Converts a message string to a SendMessageBatchRequestEntry
 * @param message The message to convert
 */
function entryFromString(message: string): SendMessageBatchRequestEntry {
  return {
    Id: message,
    MessageBody: message,
  };
}

/**
 * Converts a message to a SendMessageBatchRequestEntry using the appropriate method
 * depending on if the message is a string or an object
 * @param message The message to convert
 */
export function toEntry(
  message: string | Message,
): SendMessageBatchRequestEntry {
  if (isString(message)) {
    return entryFromString(message as string);
  }
  if (isObject(message)) {
    return entryFromObject(message as Message);
  }

  throw new Error("A message can either be an object or a string");
}
