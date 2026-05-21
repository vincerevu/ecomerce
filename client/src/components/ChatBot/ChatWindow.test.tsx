import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import ChatWindow from "./ChatWindow";
import { streamChatMessage } from "@/libs/chatbot-api";

jest.mock("@/libs/chatbot-api", () => ({
  streamChatMessage: jest.fn(),
}));

describe("ChatWindow", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    Element.prototype.scrollIntoView = jest.fn();
  });

  it("sends a user message and renders the chatbot response", async () => {
    (streamChatMessage as jest.Mock).mockImplementation(async ({ onEvent }) => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      onEvent({ type: "status", conversationId: "conv_1", message: "Đang soạn câu trả lời..." });
      onEvent({ type: "delta", conversationId: "conv_1", text: "Bạn có thể xem **áo khoác**:\n" });
      onEvent({ type: "delta", conversationId: "conv_1", text: "1. **áo khoác gió Basic**" });
      onEvent({
        type: "done",
        conversationId: "conv_1",
        suggestedProducts: [
          {
            id: "product-1",
            name: "Áo khoác gió Basic",
            slug: "ao-khoac-gio-basic",
            price: 399000,
            totalStock: 12,
            category: "Áo khoác",
          },
        ],
      });
    });

    render(<ChatWindow />);

    fireEvent.change(screen.getByPlaceholderText("Nhập tin nhắn..."), {
      target: { value: "Tư vấn áo khoác" },
    });
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("Tư vấn áo khoác")).toBeInTheDocument();
    expect(screen.getByText("Đang đọc nhu cầu của bạn...")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getAllByText((_, element) =>
          element?.textContent ===
          "Mình đã chọn vài sản phẩm phù hợp với nhu cầu của bạn. Bạn bấm vào các card bên dưới để xem ảnh, giá và chi tiết sản phẩm nhé."
        ).length
      ).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("Áo khoác gió Basic").length).toBeGreaterThan(0);
    expect(screen.queryByText("**")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Áo khoác gió Basic/i })).toHaveAttribute(
      "href",
      "/shop-details/ao-khoac-gio-basic"
    );
    expect(screen.getByText("399.000đ")).toBeInTheDocument();
    expect(screen.getByText("Còn hàng")).toBeInTheDocument();
    expect(streamChatMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Tư vấn áo khoác",
        onEvent: expect.any(Function),
      })
    );
  });

  it("shows a friendly error when the chatbot API fails", async () => {
    (streamChatMessage as jest.Mock).mockRejectedValue(new Error("network"));

    render(<ChatWindow />);

    fireEvent.change(screen.getByPlaceholderText("Nhập tin nhắn..."), {
      target: { value: "hello" },
    });
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("Xin lỗi, hiện mình chưa kết nối được trợ lý tư vấn. Bạn thử lại sau ít phút nhé.")).toBeInTheDocument();
    });
  });
});
