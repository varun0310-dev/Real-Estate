import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import socketService from '../../services/socket';
import { API_URL } from '../../config';
import { FiSend } from 'react-icons/fi';
import { format } from 'date-fns';

const getAvatarUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    return `${API_URL}/${img.replace(/^\/+/, '')}`;
};

export default function ChatWindow({ conversation, currentUser, onClose }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState('');
    const [sending, setSending] = useState(false);
    
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
                setMessages(res.data.messages || []);
                
                // Mark messages read
                await axios.patch(`${API_URL}/api/chat/conversations/${conversation._id}/read`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => {});
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
            if (msg.conversationId !== conversation._id) return;

            setMessages((prev) => {
                if (prev.some((m) => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
            scrollToBottom();
            
            // If the message is received while the window is active, mark it as read immediately
            const senderId = (msg.senderId?._id || msg.senderId)?.toString();
            const myId = currentUser?._id?.toString();
            if (senderId !== myId) {
                axios.patch(`${API_URL}/api/chat/conversations/${conversation._id}/read`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => {});
            }
        };

        const handleTyping = (data) => {
            const typingId = (data.userId?._id || data.userId)?.toString();
            const myId = currentUser?._id?.toString();
            if (typingId !== myId) {
                setIsTyping(true);
                setTypingUser(data.name || 'User');
            }
        };

        const handleStopTyping = (data) => {
            const typingId = (data.userId?._id || data.userId)?.toString();
            const myId = currentUser?._id?.toString();
            if (typingId !== myId) {
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

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const text = newMessage.trim();
        if (!text || sending) return;

        setSending(true);
        setNewMessage('');

        const token = localStorage.getItem('token');
        const socket = socketService.getSocket();

        try {
            if (socket && socket.connected) {
                socket.emit('send_message', {
                    conversationId: conversation._id,
                    text
                });
                socket.emit('stop_typing', conversation._id);
            } else {
                // Fallback to REST endpoint
                const res = await axios.post(
                    `${API_URL}/api/chat/conversations/${conversation._id}/messages`,
                    { text },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.data?.message) {
                    setMessages((prev) => {
                        if (prev.some((m) => m._id === res.data.message._id)) return prev;
                        return [...prev, res.data.message];
                    });
                    scrollToBottom();
                }
            }
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setSending(false);
        }
    };

    const handleTypingChange = (e) => {
        setNewMessage(e.target.value);
        const socket = socketService.getSocket();
        
        if (socket && socket.connected) {
            socket.emit('typing', conversation._id);
            
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stop_typing', conversation._id);
            }, 2000);
        }
    };

    if (!conversation) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a conversation to start chatting.
            </div>
        );
    }

    // Determine other participant accurately
    const isCurrentUserBuyer = conversation.buyerId?._id?.toString() === currentUser?._id?.toString();
    const otherUser = isCurrentUserBuyer ? conversation.sellerId : conversation.buyerId;
    const avatarUrl = getAvatarUrl(otherUser?.profileImage);

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 shadow-xs">
                <div className="w-10 h-10 rounded-full bg-[#4960B2]/10 flex items-center justify-center overflow-hidden shrink-0">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={otherUser?.name || 'User'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.name || 'User')}&background=4960B2&color=fff`;
                            }}
                        />
                    ) : (
                        <span className="text-[#4960B2] font-bold">
                            {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 truncate">
                        {otherUser?.name || 'User'} {otherUser?.companyName && `(${otherUser.companyName})`}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                        {conversation.propertyId?.title ? (
                            <>
                                🏠 {conversation.propertyId.title}
                                {conversation.propertyId?.price ? ` • ₹${conversation.propertyId.price.toLocaleString('en-IN')}` : ''}
                            </>
                        ) : (
                            'Direct Conversation'
                        )}
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
                    <div className="text-center text-gray-400 mt-10">Loading message history...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10">
                        <p className="text-sm font-semibold">No messages yet.</p>
                        <p className="text-xs mt-1">Send a greeting to start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const senderId = (msg.senderId?._id || msg.senderId)?.toString();
                        const myId = currentUser?._id?.toString();
                        const isMine = senderId === myId;

                        return (
                            <div key={msg._id || index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-2xl px-5 py-3 ${isMine ? 'bg-[#4960B2] text-white rounded-br-xs shadow-md shadow-[#4960B2]/15' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-xs shadow-xs'}`}>
                                    <p className="text-xs md:text-sm whitespace-pre-wrap break-words">{msg.text}</p>
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
                        <div className="bg-white border border-gray-100 rounded-full px-4 py-2 text-xs text-gray-500 shadow-xs animate-pulse">
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
                        placeholder="Type your message..." 
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-5 py-3 text-xs md:text-sm focus:outline-none focus:border-[#4960B2] focus:bg-white transition-colors"
                    />
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim() || sending}
                        className="w-11 h-11 bg-[#4960B2] text-white rounded-full flex items-center justify-center hover:bg-[#3a4d91] transition-colors shadow-md shadow-[#4960B2]/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                        <FiSend size={15} />
                    </button>
                </form>
            </div>
        </div>
    );
}
