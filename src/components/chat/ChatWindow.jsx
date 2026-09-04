import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import socketService from '../../services/socket';
import { API_URL } from '../../config';
import { FiSend } from 'react-icons/fi';
import { format } from 'date-fns';

export default function ChatWindow({ conversation, currentUser, onClose }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState('');
    
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        if (!conversation) return;

        const token = localStorage.getItem('token');
        const socket = socketService.connect(token);

        const fetchMessages = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${API_URL}/api/chat/conversations/${conversation._id}/messages`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(res.data.messages);
                
                // Mark messages read
                await axios.patch(`${API_URL}/api/chat/conversations/${conversation._id}/read`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (err) {
                console.error("Error fetching messages:", err);
            } finally {
                setLoading(false);
                scrollToBottom();
            }
        };

        fetchMessages();
        socket.emit('join_conversation', conversation._id);

        // Socket listeners
        const handleNewMessage = (msg) => {
            setMessages((prev) => [...prev, msg]);
            scrollToBottom();
            
            // If the message is received while the window is active, mark it as read immediately
            if (msg.senderId._id !== currentUser._id) {
                axios.patch(`${API_URL}/api/chat/conversations/${conversation._id}/read`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        };

        const handleTyping = (data) => {
            if (data.userId !== currentUser._id) {
                setIsTyping(true);
                setTypingUser(data.name);
            }
        };

        const handleStopTyping = (data) => {
            if (data.userId !== currentUser._id) {
                setIsTyping(false);
            }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('typing', handleTyping);
        socket.on('stop_typing', handleStopTyping);

        return () => {
            socket.emit('leave_conversation', conversation._id);
            socket.off('new_message', handleNewMessage);
            socket.off('typing', handleTyping);
            socket.off('stop_typing', handleStopTyping);
        };
    }, [conversation, currentUser]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const socket = socketService.getSocket();
        if (socket) {
            socket.emit('send_message', {
                conversationId: conversation._id,
                text: newMessage
            });
            setNewMessage('');
            socket.emit('stop_typing', conversation._id);
        }
    };

    const handleTypingChange = (e) => {
        setNewMessage(e.target.value);
        const socket = socketService.getSocket();
        
        if (socket) {
            socket.emit('typing', conversation._id);
            
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stop_typing', conversation._id);
            }, 2000);
        }
    };

    // Determine the other participant
    const isBuyer = currentUser.userType === 'buyer';
    const otherUser = isBuyer ? conversation.sellerId : conversation.buyerId;

    if (!conversation) return <div className="flex-1 flex items-center justify-center text-gray-500">Select a conversation to start chatting.</div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-[#4960B2]/10 flex items-center justify-center overflow-hidden">
                    {otherUser?.profileImage ? (
                        <img src={`${API_URL}${otherUser.profileImage}`} alt={otherUser.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-[#4960B2] font-bold">{otherUser?.name?.charAt(0).toUpperCase()}</span>
                    )}
                </div>
                <div>
                    <h3 className="font-bold text-[#1e1e2d]">{otherUser?.name} {otherUser?.companyName && `(${otherUser.companyName})`}</h3>
                    <p className="text-xs text-gray-500">
                        {conversation.propertyId?.title} - ${conversation.propertyId?.price?.toLocaleString()}
                    </p>
                </div>
                {onClose && (
                    <button 
                        onClick={onClose} 
                        className="ml-auto w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 scrollbar-hide">
                {loading ? (
                    <div className="text-center text-gray-400 mt-10">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10">No messages yet. Say hi!</div>
                ) : (
                    messages.map((msg, index) => {
                        const isMine = msg.senderId._id === currentUser._id;
                        return (
                            <div key={msg._id || index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-2xl px-5 py-3 ${isMine ? 'bg-[#4960B2] text-white rounded-br-sm shadow-md shadow-[#4960B2]/20' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'}`}>
                                    <p className="text-sm">{msg.text}</p>
                                    <div className={`text-[10px] mt-1 text-right ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
                                        {format(new Date(msg.createdAt || Date.now()), 'hh:mm a')}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 rounded-full px-4 py-2 text-xs text-gray-500 shadow-sm animate-pulse">
                            {typingUser} is typing...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={handleTypingChange}
                        placeholder="Type a message..." 
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-6 py-3 text-sm focus:outline-none focus:border-[#4960B2] focus:bg-white transition-colors"
                    />
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim()}
                        className="w-12 h-12 bg-[#4960B2] text-white rounded-full flex items-center justify-center hover:bg-[#3a4d91] transition-colors shadow-md shadow-[#4960B2]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FiSend />
                    </button>
                </form>
            </div>
        </div>
    );
}
