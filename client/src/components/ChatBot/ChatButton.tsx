
import React from 'react';

interface ChatButtonProps {
    onClick: () => void;
    isOpen: boolean;
}

const ChatButton: React.FC<ChatButtonProps> = ({ onClick, isOpen }) => {
    return (
        <button
            onClick={onClick}
            className={`fixed right-8 bottom-20 z-[9999] flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none ${isOpen ? 'bg-red hover:bg-[#d12e2e]' : 'bg-[#FCAF17] hover:bg-[#e09b15]'
                }`}
            aria-label="Toggle Chat"
        >
            {isOpen ? (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M18 6L6 18M6 6L18 18"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ) : (
                <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M12 2C6.477 2 2 6.477 2 12C2 13.849 2.487 15.572 3.342 17.06L2.245 20.899C2.083 21.465 2.535 21.917 3.101 21.755L6.94 20.658C8.428 21.513 10.151 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z"
                        fill="white"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M8 12H8.01M12 12H12.01M16 12H16.01"
                        stroke="#FCAF17"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )}
        </button>
    );
};

export default ChatButton;
