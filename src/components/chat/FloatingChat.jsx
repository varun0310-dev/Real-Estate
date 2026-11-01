import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import socketService from '../../services/socket';
import { API_URL } from '../../config';
import { FiSend, FiMinus, FiX, FiMessageSquare } from 'react-icons/fi';
import { format } from 'date-fns';

const getAvatarUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    return `${API_URL}/${img.replace(/^\/+/, '')}`;
};

/**
 * FloatingChat – self-contained messenger-style popup.
 */
export default function FloatingChat({ conversation, currentUser, onClose, defaultMinimized = false }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState('');
    const [minimized, setMinimized] = useState(defaultMinimized);
    const [unreadCount, setUnreadCount] = useState(0);
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const minimizedRef = useRef(minimized);

    useEffect(() => { minimizedRef.current = minimized; }, [minimized]);

    useEffect(() => {
        if (!conversation) return;

        const token = localStorage.getItem('token');
        const socket = socketService.connect(token);

        const fetchMessages = async () => {
            try {
                setLoading(true);
                const res = await axios.get(
                    `${API_URL}/api/chat/conversations/${conversation._id}/messages`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setMessages(res.data.messages || []);

                // Mark as read immediately when opened
                await axios.patch(
                    `${API_URL}/api/chat/conversations/${conversation._id}/read`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                ).catch(() => {});
            } catch (err) {
                console.error('Error fetching messages:', err);
            } finally {
                setLoading(false);
                scrollToBottom();
            }
        };

        fetchMessages();
        socket.emit('join_conversation', conversation._id);

        const handleNewMessage = (msg) => {
            if (msg.conversationId !== conversation._id) return;

            setMessages((prev) => {
                if (prev.some((m) => m._id === msg._id)) return prev;
                return [...prev, msg];
            });

            const senderId = (msg.senderId?._id || msg.senderId)?.toString();
            const myId = currentUser?._id?.toString();

            if (minimizedRef.current) {
                if (senderId !== myId) {
                    setUnreadCount((n) => n + 1);
                }
            } else {
                scrollToBottom();
                if (senderId !== myId) {
                    axios.patch(
                        `${API_URL}/api/chat/conversations/${conversation._id}/read`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                    ).catch(() => {});
                }
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
            if (typingId !== myId) setIsTyping(false);
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
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const handleMaximize = () => {
        setMinimized(false);
        setUnreadCount(0);
        scrollToBottom();

        const token = localStorage.getItem('token');
        axios.patch(
            `${API_URL}/api/chat/conversations/${conversation._id}/read`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        ).catch(() => {});
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
                socket.emit('send_message', { conversationId: conversation._id, text });
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
            console.error('Failed to send floating message:', err);
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
            typingTimeoutRef.current = setTimeout(() => socket.emit('stop_typing', conversation._id), 2000);
        }
    };

    // Determine other participant
    const isCurrentUserBuyer = conversation.buyerId?._id?.toString() === currentUser?._id?.toString();
    const otherUser = isCurrentUserBuyer ? conversation.sellerId : conversation.buyerId;
    const avatarUrl = getAvatarUrl(otherUser?.profileImage);

    /* ─── MINIMIZED VIEW ─── */
    if (minimized) {
        return (
            <div
                className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 cursor-pointer select-none"
                style={{ filter: 'drop-shadow(0 8px 24px rgba(73,96,178,0.35))' }}
            >
                {unreadCount > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount}
                    </span>
                )}
                <div
                    onClick={handleMaximize}
                    className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-[#4960B2] to-[#3a4d91] text-white rounded-full shadow-lg hover:scale-105 transition-transform"
                >
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-white/20 flex items-center justify-center shrink-0">
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
                            <span className="font-bold text-xs">{otherUser?.name?.charAt(0).toUpperCase() || 'U'}</span>
                        )}
                    </div>
                    <div className="leading-tight">
                        <p className="font-bold text-xs">{otherUser?.name || 'User'}</p>
                        {isTyping && <p className="text-[10px] text-white/80 animate-pulse">typing…</p>}
                    </div>
                    <FiMessageSquare className="text-white/70 ml-1" size={13} />
                </div>

                <button
                    onClick={onClose}
                    className="w-8 h-8 bg-white text-gray-500 rounded-full shadow-md flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                    <FiX size={14} />
                </button>
            </div>
        );
    }

    /* ─── EXPANDED VIEW ─── */
    return (
        <div className="fixed bottom-6 right-6 w-[360px] md:w-[390px] h-[540px] z-[100] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#4960B2] to-[#3a4d91] text-white shrink-0">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-white/20 flex items-center justify-center shrink-0">
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
                        <span className="font-bold text-sm">{otherUser?.name?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                    <p className="font-bold text-sm truncate">{otherUser?.name || 'User'}</p>
                    <p className="text-[11px] text-white/70 truncate">
                        {conversation.propertyId?.title || 'Property Inquiry'}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setMinimized(true)}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                        title="Minimize"
                    >
                        <FiMinus size={14} />
                    </button>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                        title="Close"
                    >
                        <FiX size={14} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 scrollbar-hide">
                {loading ? (
                    <div className="text-center text-gray-400 mt-12 text-xs">Loading message history...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-12 text-xs">
                        <p className="font-semibold">No messages yet.</p>
                        <p className="mt-1">Send a message to start chatting!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const senderId = (msg.senderId?._id || msg.senderId)?.toString();
                        const myId = currentUser?._id?.toString();
                        const isMine = senderId === myId;

                        return (
                            <div key={msg._id || index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${isMine ? 'bg-[#4960B2] text-white rounded-br-xs shadow-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-xs shadow-xs'}`}>
                                    <p className="text-xs whitespace-pre-wrap break-words">{msg.text}</p>
                                    <div className={`text-[9px] mt-1 text-right ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
                                        {format(new Date(msg.createdAt || Date.now()), 'hh:mm a')}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 rounded-full px-3 py-1.5 text-[11px] text-gray-500 shadow-xs animate-pulse">
                            {typingUser} is typing...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-3 bg-white border-t border-gray-100 shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleTypingChange}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-[#4960B2] focus:bg-white transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="w-9 h-9 bg-[#4960B2] text-white rounded-full flex items-center justify-center hover:bg-[#3a4d91] transition-colors shadow-sm disabled:opacity-50 shrink-0"
                    >
                        <FiSend size={13} />
                    </button>
                </form>
            </div>
        </div>
    );
}
