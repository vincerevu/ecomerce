
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { streamChatMessage, type ChatSuggestedProduct } from '@/libs/chatbot-api';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    suggestedProducts?: ChatSuggestedProduct[];
    isStreaming?: boolean;
}

const THINKING_MESSAGES = [
    'Đang đọc nhu cầu của bạn...',
    'Đang tìm sản phẩm phù hợp...',
    'Đang soạn câu trả lời...',
];

const MIN_VISIBLE_STREAM_LENGTH = 8;

const formatPrice = (price?: number | null) => {
    if (typeof price !== 'number') return 'Liên hệ';
    return `${price.toLocaleString('vi-VN')}đ`;
};

const compactAnswerForProductCards = (text: string, products?: ChatSuggestedProduct[]) => {
    if (!products?.length) return text;
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
    const hasList = lines.some((line) => /^(-|\*|\d+[\.)])\s+/.test(line));
    if (!hasList && lines.length <= 3) return text;
    return 'Mình đã chọn vài sản phẩm phù hợp với nhu cầu của bạn. Bạn bấm vào các card bên dưới để xem ảnh, giá và chi tiết sản phẩm nhé.';
};

const renderInlineMarkdown = (text: string) =>
    text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
    });

const MarkdownText = ({ text }: { text: string }) => (
    <div className="space-y-1 whitespace-normal break-words">
        {text.split('\n').map((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) {
                return <div key={index} className="h-2" />;
            }
            const isListItem = /^(-|\d+\.)\s+/.test(trimmed);
            return (
                <p key={index} className={isListItem ? 'pl-2' : undefined}>
                    {renderInlineMarkdown(trimmed)}
                </p>
            );
        })}
    </div>
);

const ProductSuggestionCard = ({ product }: { product: ChatSuggestedProduct }) => {
    const href = product.slug ? `/shop-details/${product.slug}` : '/products';
    const inStock = typeof product.totalStock === 'number' ? product.totalStock > 0 : true;

    return (
        <Link
            href={href}
            className="group flex w-[270px] gap-2 rounded-lg border border-[#E5E7EB] bg-white p-2 text-dark shadow-sm transition hover:border-[#FCAF17] hover:shadow-md"
        >
            <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md bg-gray-100">
                {product.thumbnailUrl ? (
                    <Image
                        src={product.thumbnailUrl}
                        alt={product.name}
                        fill
                        sizes="56px"
                        className="object-cover transition-transform group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                        Bagy
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                {product.category && (
                    <span className="mb-0.5 block truncate text-[10px] text-gray-500">{product.category}</span>
                )}
                <span className="line-clamp-2 text-xs font-medium leading-snug text-dark group-hover:text-[#C98700]">
                    {product.name}
                </span>
                <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#FCAF17]">{formatPrice(product.price)}</span>
                    <span className={`shrink-0 text-[10px] ${inStock ? 'text-green-600' : 'text-gray-400'}`}>
                        {inStock ? 'Còn hàng' : 'Hết hàng'}
                    </span>
                </div>
            </div>
        </Link>
    );
};

const ChatWindow = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?',
            sender: 'bot',
            timestamp: new Date(),
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [conversationId, setConversationId] = useState<string | undefined>();
    const [isSending, setIsSending] = useState(false);
    const [thinkingText, setThinkingText] = useState(THINKING_MESSAGES[0]);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const nextText = inputText.trim();
        if (!nextText || isSending) return;

        const newUserMessage: Message = {
            id: Date.now().toString(),
            text: nextText,
            sender: 'user',
            timestamp: new Date(),
        };
        const botMessageId = `${Date.now()}-bot`;

        setMessages((prev) => [
            ...prev,
            newUserMessage,
            {
                id: botMessageId,
                text: '',
                sender: 'bot',
                timestamp: new Date(),
                isStreaming: true,
            },
        ]);
        setInputText('');
        setIsSending(true);
        setThinkingText(THINKING_MESSAGES[0]);

        try {
            await streamChatMessage({
                message: nextText,
                conversationId,
                history: messages.slice(-8).map((message) => ({
                    role: message.sender === 'user' ? 'user' : 'assistant',
                    content: message.text,
                })),
                onEvent: (event) => {
                    if (event.type === 'status') {
                        setConversationId(event.conversationId);
                        setThinkingText(event.message);
                        return;
                    }

                    if (event.type === 'delta') {
                        setConversationId(event.conversationId);
                        setMessages((prev) =>
                            prev.map((message) =>
                                message.id === botMessageId
                                    ? { ...message, text: `${message.text}${event.text}` }
                                    : message,
                            ),
                        );
                        return;
                    }

                    if (event.type === 'done') {
                        setConversationId(event.conversationId);
                        setMessages((prev) =>
                            prev.map((message) =>
                                message.id === botMessageId
                                    ? {
                                        ...message,
                                        text: compactAnswerForProductCards(message.text, event.suggestedProducts),
                                        isStreaming: false,
                                        suggestedProducts: event.suggestedProducts,
                                    }
                                    : message,
                            ),
                        );
                        return;
                    }

                    setMessages((prev) =>
                        prev.map((message) =>
                            message.id === botMessageId
                                ? {
                                    ...message,
                                    text: event.message,
                                    isStreaming: false,
                                }
                                : message,
                        ),
                    );
                },
            });
        } catch {
            setMessages((prev) =>
                prev.map((message) =>
                    message.id === botMessageId
                        ? {
                            ...message,
                            text: 'Xin lỗi, hiện mình chưa kết nối được trợ lý tư vấn. Bạn thử lại sau ít phút nhé.',
                            isStreaming: false,
                        }
                        : message,
                ),
            );
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed right-6 bottom-40 z-[99999] w-[350px] overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-black/5 sm:w-[380px]">
            {/* Header */}
            <div className="flex items-center justify-between bg-[#FCAF17] p-4 text-white">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M12 2C6.477 2 2 6.477 2 12C2 13.849 2.487 15.572 3.342 17.06L2.245 20.899C2.083 21.465 2.535 21.917 3.101 21.755L6.94 20.658C8.428 21.513 10.151 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z"
                                fill="white"
                                fillOpacity="0.2"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M8 12H8.01M12 12H12.01M16 12H16.01"
                                stroke="white"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Bagy Support</h3>
                        <span className="flex items-center gap-1.5 text-xs text-white/90">
                            <span className="block h-2 w-2 rounded-full bg-green-400"></span>
                            Đang hoạt động
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="h-[400px] overflow-y-auto bg-gray-50 p-4">
                <div className="flex flex-col gap-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex w-max max-w-[80%] flex-col ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                                }`}
                        >
                            <div
                                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.sender === 'user'
                                    ? 'bg-[#FCAF17] text-white rounded-br-none'
                                    : 'bg-white text-dark shadow-sm rounded-bl-none border border-[#E5E7EB]'
                                    }`}
                            >
                                {msg.text || msg.isStreaming ? (
                                    <>
                                        {msg.text.length >= MIN_VISIBLE_STREAM_LENGTH && (
                                            <MarkdownText text={msg.text} />
                                        )}
                                        {msg.isStreaming && msg.text.length < MIN_VISIBLE_STREAM_LENGTH && (
                                            <span className="inline-flex items-center gap-2 text-gray-500">
                                                <span>{thinkingText}</span>
                                                <span className="inline-flex items-center gap-1">
                                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#FCAF17] [animation-delay:-0.2s]"></span>
                                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#FCAF17] [animation-delay:-0.1s]"></span>
                                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#FCAF17]"></span>
                                                </span>
                                            </span>
                                        )}
                                        {msg.isStreaming && msg.text.length >= MIN_VISIBLE_STREAM_LENGTH && (
                                            <span className="ml-1 inline-block h-4 w-1 translate-y-0.5 animate-pulse rounded-full bg-[#FCAF17]"></span>
                                        )}
                                    </>
                                ) : null}
                            </div>
                            {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                                <div className="mt-2 flex w-full flex-col gap-2">
                                    {msg.suggestedProducts.map((product) => (
                                        <ProductSuggestionCard key={product.id} product={product} />
                                    ))}
                                </div>
                            )}
                            <span className="mt-1 text-[10px] text-gray-500">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="bg-white p-4">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 rounded-full border border-[#E5E7EB] bg-gray-50 px-4 py-2 text-sm focus:border-[#FCAF17] focus:outline-none focus:ring-1 focus:ring-[#FCAF17]"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim() || isSending}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FCAF17] text-white transition-colors hover:bg-[#e09b15] disabled:opacity-50"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </form>
            </div>
        </div >
    );
};

export default ChatWindow;
