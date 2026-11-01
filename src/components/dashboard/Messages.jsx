import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';
import { API_URL } from '../../config';
import ChatWindow from '../chat/ChatWindow';
import socketService from '../../services/socket';
import { formatDistanceToNow } from 'date-fns';
import { FiSearch, FiMessageSquare, FiArrowLeft, FiHome } from 'react-icons/fi';

const getAvatarUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    return `${API_URL}/${img.replace(/^\/+/, '')}`;
};

const Messages = () => {
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchParams] = useSearchParams();

    const activeConversationRef = useRef(activeConversation);
    useEffect(() => {
        activeConversationRef.current = activeConversation;
    }, [activeConversation]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const loadChatData = async () => {
            try {
                setLoading(true);

                // 1. Fetch current user profile
                const profileRes = await axios.get(`${API_URL}/api/profile/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const user = profileRes.data.user;
                setCurrentUser(user);

                // 2. Connect socket
                const socket = socketService.connect(token);

                // 3. Fetch user conversations
                const convRes = await axios.get(`${API_URL}/api/chat/conversations`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const convs = convRes.data.conversations || [];
                setConversations(convs);

                // Join all conversation rooms
                const joinRooms = () => {
                    convs.forEach((c) => socket.emit('join_conversation', c._id));
                };

                if (socket.connected) {
                    joinRooms();
                }
                socket.on('connect', joinRooms);

                // Select target conversation from URL param or default to first
                const targetId = searchParams.get('conversationId');
                if (targetId) {
                    const found = convs.find((c) => c._id === targetId);
                    if (found) setActiveConversation(found);
                    else if (convs.length > 0) setActiveConversation(convs[0]);
                } else if (convs.length > 0) {
                    setActiveConversation(convs[0]);
                }

                // Handle incoming real-time messages
                const handleNewMessage = (msg) => {
                    setConversations((prev) => {
                        const newConvs = [...prev];
                        const idx = newConvs.findIndex((c) => c._id === msg.conversationId);
                        if (idx !== -1) {
                            newConvs[idx].lastMessage = msg.text;
                            newConvs[idx].lastMessageAt = msg.createdAt;

                            const currentActive = activeConversationRef.current;
                            if (!currentActive || currentActive._id !== msg.conversationId) {
                                const isBuyer = user.userType === 'buyer';
                                if (isBuyer) {
                                    newConvs[idx].buyerUnreadCount = (newConvs[idx].buyerUnreadCount || 0) + 1;
                                } else {
                                    newConvs[idx].sellerUnreadCount = (newConvs[idx].sellerUnreadCount || 0) + 1;
                                }
                            }

                            // Move updated conversation to top
                            const [moved] = newConvs.splice(idx, 1);
                            newConvs.unshift(moved);
                        }
                        return newConvs;
                    });
                };

                socket.on('new_message', handleNewMessage);

                return () => {
                    socket.off('connect', joinRooms);
                    socket.off('new_message', handleNewMessage);
                };
            } catch (err) {
                console.error('Error loading conversations in dashboard:', err);
            } finally {
                setLoading(false);
            }
        };

        loadChatData();
    }, [searchParams]);

    const handleSelectConversation = (conv) => {
        setActiveConversation(conv);
        // Clear unread count locally
        setConversations((prev) => {
            const newConvs = [...prev];
            const idx = newConvs.findIndex((c) => c._id === conv._id);
            if (idx !== -1) {
                if (currentUser?.userType === 'buyer') {
                    newConvs[idx].buyerUnreadCount = 0;
                } else {
                    newConvs[idx].sellerUnreadCount = 0;
                }
            }
            return newConvs;
        });
    };

    if (loading) {
        return (
            <div className="h-[calc(100vh-140px)] flex items-center justify-center bg-white rounded-2xl border border-gray-100">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-[#4960B2] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-semibold text-gray-500">Loading conversation history...</p>
                </div>
            </div>
        );
    }

    const filteredConversations = conversations.filter((conv) => {
        if (!searchTerm.trim()) return true;
        const isCurrentUserBuyer = conv.buyerId?._id?.toString() === currentUser?._id?.toString();
        const otherUser = isCurrentUserBuyer ? conv.sellerId : conv.buyerId;
        const name = (otherUser?.name || '').toLowerCase();
        const propTitle = (conv.propertyId?.title || '').toLowerCase();
        const term = searchTerm.toLowerCase();
        return name.includes(term) || propTitle.includes(term);
    });

    return (
        <div className="h-[calc(100vh-120px)] bg-white rounded-2xl shadow-sm border border-gray-100 flex overflow-hidden">
            {/* Conversation List (Left) */}
            <div
                className={`w-full md:w-5/12 lg:w-4/12 border-r border-gray-100 flex flex-col h-full bg-white z-10 ${
                    activeConversation ? 'hidden md:flex' : 'flex'
                }`}
            >
                {/* Search Bar */}
                <div className="p-4 border-b border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-gray-900 tracking-tight">Messages</h2>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#4960B2]">
                            {conversations.length} {conversations.length === 1 ? 'chat' : 'chats'}
                        </span>
                    </div>

                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by user or property..."
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-400 border border-gray-100"
                        />
                    </div>
                </div>

                {/* List Items */}
                <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-gray-50">
                    {filteredConversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-xs">
                            <FiMessageSquare className="mx-auto mb-2 text-gray-300" size={28} />
                            {searchTerm ? 'No conversations matching search' : 'No message history found.'}
                        </div>
                    ) : (
                        filteredConversations.map((conv) => {
                            const isCurrentUserBuyer = conv.buyerId?._id?.toString() === currentUser?._id?.toString();
                            const otherUser = isCurrentUserBuyer ? conv.sellerId : conv.buyerId;
                            const unreadCount = isCurrentUserBuyer ? conv.buyerUnreadCount : conv.sellerUnreadCount;
                            const isActive = activeConversation?._id === conv._id;
                            const avatarUrl = getAvatarUrl(otherUser?.profileImage);

                            return (
                                <div
                                    key={conv._id}
                                    onClick={() => handleSelectConversation(conv)}
                                    className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                                        isActive ? 'bg-blue-50/70 border-r-3 border-[#4960B2]' : 'hover:bg-gray-50/70'
                                    }`}
                                >
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 bg-gray-100 border border-gray-100">
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
                                            <div className="w-full h-full bg-[#4960B2] text-white flex items-center justify-center font-bold text-xs">
                                                {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                            <p className={`text-xs truncate ${unreadCount > 0 ? 'font-black text-gray-900' : 'font-bold text-gray-800'}`}>
                                                {otherUser?.name || 'User'}
                                            </p>
                                            {conv.lastMessageAt && (
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0 font-medium">
                                                    {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                                                </span>
                                            )}
                                        </div>

                                        {conv.propertyId?.title && (
                                            <p className="text-[10px] text-[#4960B2] font-semibold truncate mb-0.5">
                                                🏠 {conv.propertyId.title}
                                            </p>
                                        )}

                                        <p className={`text-[11px] truncate ${unreadCount > 0 ? 'font-bold text-gray-900' : 'text-gray-400'}`}>
                                            {conv.lastMessage || 'Start conversation...'}
                                        </p>
                                    </div>

                                    {unreadCount > 0 && (
                                        <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 animate-pulse mt-1">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Area (Right) */}
            <div
                className={`w-full md:w-7/12 lg:w-8/12 h-full flex-col bg-white ${
                    activeConversation ? 'flex' : 'hidden md:flex'
                }`}
            >
                {activeConversation ? (
                    <div className="h-full flex flex-col relative">
                        {/* Mobile Back Button */}
                        <div className="md:hidden p-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                            <button
                                onClick={() => setActiveConversation(null)}
                                className="flex items-center gap-1 text-xs font-bold text-[#4960B2] px-2 py-1 rounded-lg hover:bg-white"
                            >
                                <FiArrowLeft size={14} /> Back to chats
                            </button>
                        </div>

                        <ChatWindow
                            conversation={activeConversation}
                            currentUser={currentUser}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#4960B2] flex items-center justify-center mb-3">
                            <FiMessageSquare size={28} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-800">Your Messages</h3>
                        <p className="text-xs text-gray-400 max-w-sm mt-1">
                            Select any conversation from the list to view full message history and reply in real-time.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
