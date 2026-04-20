
import React, { useState, useRef, useEffect } from 'react';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

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
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const newUserMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newUserMessage]);
        setInputText('');

        // Simulate bot response
        setTimeout(() => {
            const botResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Cảm ơn bạn đã nhắn tin. Nhân viên tư vấn sẽ phản hồi sớm nhất có thể!',
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botResponse]);
        }, 1000);
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
                                className={`rounded-2xl px-4 py-2.5 text-sm ${msg.sender === 'user'
                                    ? 'bg-[#FCAF17] text-white rounded-br-none'
                                    : 'bg-white text-dark shadow-sm rounded-bl-none border border-[#E5E7EB]'
                                    }`}
                            >
                                {msg.text}
                            </div>
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
                        disabled={!inputText.trim()}
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
