import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import socketService from '../../services/socket';
import { API_URL } from '../../config';
import { FiSend, FiMinus, FiX, FiMessageSquare } from 'react-icons/fi';
import { format } from 'date-fns';

/**
 * FloatingChat – self-contained messenger-style popup.
 * Props:
 *   conversation    – conversation object (populated by API)
 *   currentUser     – authenticated user object
 *   onClose()       – called when user hits ✕
 *   defaultMinimized – start minimized (optional)
 */
export default function FloatingChat({ conversation, currentUser, onClose, defaultMinimized = false }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState('');
    const [minimized, setMinimized] = useState(defaultMinimized);
    const [unreadCount, setUnreadCount] = useState(0);

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const minimizedRef = useRef(minimized);

    // Keep ref in sync so the socket handler can read it without closure staleness
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
                setMessages(res.data.messages);

                // Mark as read immediately when opened
                await axios.patch(
                    `${API_URL}/api/chat/conversations/${conversation._id}/read`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
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
            setMessages((prev) => [...prev, msg]);

            if (minimizedRef.current) {
                // Accumulate unread count when minimized
                if (msg.senderId._id !== currentUser._id) {
                    setUnreadCount((n) => n + 1);
                }
            } else {
                scrollToBottom();
                // If expanded, mark read on-the-fly
                if (msg.senderId._id !== currentUser._id) {
                    axios.patch(
                        `${API_URL}/api/chat/conversations/${conversation._id}/read`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                }
            }
        };

        const handleTyping = (data) => {
            if (data.userId !== currentUser._id) {
                setIsTyping(true);
                setTypingUser(data.name);
            }
        };

        const handleStopTyping = (data) => {
            if (data.userId !== currentUser._id) setIsTyping(false);
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

        // Mark all as read server-side
        const token = localStorage.getItem('token');
        axios.patch(
            `${API_URL}/api/chat/conversations/${conversation._id}/read`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const socket = socketService.getSocket();
        if (socket) {
            socket.emit('send_message', { conversationId: conversation._id, text: newMessage });
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
            typingTimeoutRef.current = setTimeout(() => socket.emit('stop_typing', conversation._id), 2000);
        }
    };

    // Determine the other participant
    // Buyers see the seller; sellers and admins see the buyer
    const isBuyer = currentUser?.userType === 'buyer';
    const otherUser = isBuyer ? conversation.sellerId : conversation.buyerId;

    /* ─── MINIMIZED VIEW ─── */
    if (minimized) {
        return (
            <div
                className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 cursor-pointer select-none"
                style={{ filter: 'drop-shadow(0 8px 24px rgba(73,96,178,0.35))' }}
            >
                {/* Unread badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-2 -left-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center z-10 animate-bounce">
                        {unreadCount}
                    </span>
                )}

                {/* Mini pill */}
                <div
                    onClick={handleMaximize}
                    className="flex items-center gap-3 bg-[#4960B2] text-white px-4 py-3 rounded-full shadow-xl hover:bg-[#3a4d91] transition-all duration-200"
                >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0">
                        {otherUser?.profileImage
                            ? <img src={`${API_URL}${otherUser.profileImage}`} alt={otherUser.name} className="w-full h-full object-cover" />
                            : <span className="font-bold text-sm">{otherUser?.name?.charAt(0).toUpperCase()}</span>
                        }
                    </div>
                    <div className="leading-tight">
                        <p className="font-bold text-sm">{otherUser?.name}</p>
                        {isTyping && <p className="text-[10px] text-white/80 animate-pulse">typing…</p>}
                    </div>
                    <FiMessageSquare className="text-white/70 ml-1" />
                </div>

                {/* Close on minimized bar */}
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
        <div className="fixed bottom-6 right-6 w-[380px] h-[550px] z-[100] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
            style={{ animation: 'slideUp 0.28s ease-out' }}
        >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#4960B2] to-[#3a4d91] text-white flex-shrink-0">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0">
                    {otherUser?.profileImage
                        ? <img src={`${API_URL}${otherUser.profileImage}`} alt={otherUser.name} className="w-full h-full object-cover" />
                        : <span className="font-bold">{otherUser?.name?.charAt(0).toUpperCase()}</span>
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{otherUser?.name} {otherUser?.companyName && `(${otherUser.companyName})`}</p>
                    <p className="text-[10px] text-white/70 truncate">{conversation.propertyId?.title}</p>
                </div>

                {/* Controls */}
                <button
                    onClick={() => setMinimized(true)}
                    title="Minimize"
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                >
                    <FiMinus size={14} />
                </button>
                <button
                    onClick={onClose}
                    title="Close"
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                >
                    <FiX size={14} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/60">
                {loading ? (
                    <div className="text-center text-gray-400 mt-10 text-sm">Loading messages…</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10 text-sm">No messages yet. Say hi! 👋</div>
                ) : (
                    messages.map((msg, index) => {
                        const isMine = msg.senderId._id === currentUser._id;
                        return (
                            <div key={msg._id || index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMine
                                    ? 'bg-[#4960B2] text-white rounded-br-sm shadow-md shadow-[#4960B2]/20'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'
                                }`}>
                                    <p className="text-sm leading-snug">{msg.text}</p>
                                    <p className={`text-[10px] mt-0.5 text-right ${isMine ? 'text-white/60' : 'text-gray-400'}`}>
                                        {format(new Date(msg.createdAt || Date.now()), 'hh:mm a')}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 rounded-full px-4 py-2 text-xs text-gray-500 shadow-sm animate-pulse">
                            {typingUser} is typing…
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleTypingChange}
                        placeholder="Type a message…"
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#4960B2] transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="w-10 h-10 bg-[#4960B2] text-white rounded-full flex items-center justify-center hover:bg-[#3a4d91] transition-colors shadow disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    >
                        <FiSend size={14} />
                    </button>
                </form>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0);    }
                }
            `}</style>
        </div>
    );
}
