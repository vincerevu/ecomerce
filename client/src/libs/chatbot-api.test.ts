import { sendChatMessage, streamChatMessage } from "./chatbot-api";
import { getAccessToken } from "./auth-storage";
import { TextDecoder, TextEncoder } from "util";
import { ReadableStream } from "stream/web";

jest.mock("./auth-storage", () => ({
  getAccessToken: jest.fn(),
}));

global.TextDecoder = TextDecoder as typeof global.TextDecoder;

describe("chatbot api", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        conversationId: "conv_1",
        answer: "Gợi ý áo khoác",
        suggestedProducts: [],
        model: "fake",
      }),
    }) as jest.Mock;
  });

  it("sends message history and bearer token to chatbot service", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("access-token");

    const result = await sendChatMessage({
      message: "Tư vấn áo khoác",
      conversationId: "conv_1",
      history: [{ role: "user", content: "hello" }],
    });

    expect(result.answer).toBe("Gợi ý áo khoác");
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/chat/messages",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer access-token",
        },
        body: JSON.stringify({
          message: "Tư vấn áo khoác",
          conversationId: "conv_1",
          history: [{ role: "user", content: "hello" }],
        }),
      })
    );
  });

  it("throws when chatbot service returns an error status", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as jest.Mock;

    await expect(sendChatMessage({ message: "hello" })).rejects.toThrow("CHATBOT_REQUEST_FAILED");
  });

  it("streams chatbot events from the SSE response", async () => {
    (getAccessToken as jest.Mock).mockReturnValue(null);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"type":"status","conversationId":"conv_1","message":"Đang soạn"}\n\n'));
        controller.enqueue(encoder.encode('data: {"type":"delta","conversationId":"conv_1","text":"Xin chào"}\n\n'));
        controller.enqueue(encoder.encode('data: {"type":"done","conversationId":"conv_1","suggestedProducts":[]}\n\n'));
        controller.close();
      },
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: stream,
    }) as jest.Mock;
    const events: unknown[] = [];

    await streamChatMessage({
      message: "hello",
      onEvent: (event) => events.push(event),
    });

    expect(events).toEqual([
      { type: "status", conversationId: "conv_1", message: "Đang soạn" },
      { type: "delta", conversationId: "conv_1", text: "Xin chào" },
      { type: "done", conversationId: "conv_1", suggestedProducts: [] },
    ]);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/chat/stream",
      expect.objectContaining({ method: "POST" })
    );
  });
});
