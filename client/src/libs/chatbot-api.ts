import { getAccessToken } from "./auth-storage";

export type ChatApiMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatSuggestedProduct = {
  id: string;
  name: string;
  slug?: string | null;
  price?: number | null;
  thumbnailUrl?: string | null;
  totalStock?: number | null;
  category?: string | null;
};

export type ChatApiResponse = {
  conversationId: string;
  answer: string;
  suggestedProducts: ChatSuggestedProduct[];
  model?: string | null;
};

export type ChatStreamEvent =
  | {
      type: "status";
      conversationId: string;
      message: string;
    }
  | {
      type: "delta";
      conversationId: string;
      text: string;
      model?: string | null;
    }
  | {
      type: "done";
      conversationId: string;
      suggestedProducts: ChatSuggestedProduct[];
      model?: string | null;
    }
  | {
      type: "error";
      message: string;
    };

const CHATBOT_API_URL =
  process.env.NEXT_PUBLIC_CHATBOT_API_URL || "http://localhost:8000/api/v1";

export const sendChatMessage = async ({
  message,
  conversationId,
  history,
}: {
  message: string;
  conversationId?: string;
  history?: ChatApiMessage[];
}): Promise<ChatApiResponse> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${CHATBOT_API_URL}/chat/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message,
      conversationId,
      history: history ?? [],
    }),
  });

  if (!response.ok) {
    throw new Error("CHATBOT_REQUEST_FAILED");
  }

  return (await response.json()) as ChatApiResponse;
};

export const streamChatMessage = async ({
  message,
  conversationId,
  history,
  onEvent,
}: {
  message: string;
  conversationId?: string;
  history?: ChatApiMessage[];
  onEvent: (event: ChatStreamEvent) => void;
}): Promise<void> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${CHATBOT_API_URL}/chat/stream`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message,
      conversationId,
      history: history ?? [],
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error("CHATBOT_STREAM_FAILED");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const event = parseStreamEvent(part);
      if (event) {
        onEvent(event);
      }
    }
  }

  if (buffer.trim()) {
    const event = parseStreamEvent(buffer);
    if (event) {
      onEvent(event);
    }
  }
};

const parseStreamEvent = (rawEvent: string): ChatStreamEvent | null => {
  const dataLine = rawEvent
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("data:"));

  if (!dataLine) {
    return null;
  }

  return JSON.parse(dataLine.replace(/^data:\s*/, "")) as ChatStreamEvent;
};
