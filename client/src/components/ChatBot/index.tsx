
'use client';

import React, { useState } from 'react';
import ChatButton from './ChatButton';
import ChatWindow from './ChatWindow';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            {isOpen && <ChatWindow />}
            <ChatButton onClick={toggleChat} isOpen={isOpen} />
        </>
    );
};

export default ChatBot;
