import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { API_URL } from '../config';
import ChatWindow from '../components/chat/ChatWindow';
import { formatDistanceToNow } from 'date-fns';
import socketService from '../services/socket';

export default function MessagesPage() {
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const location = useLocation();
    const activeConversationRef = useRef(activeConversation);

    useEffect(() => {
        activeConversationRef.current = activeConversation;
    }, [activeConversation]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/'; // redirect to home if not logged in
            return;
        }

        const fetchInitialData = async () => {
            try {
                // Get current user profile
                const profileRes = await axios.get(`${API_URL}/api/profile/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const user = profileRes.data.user;
                setCurrentUser(user);

                // Initialize socket connection
                const socket = socketService.connect(token);
                
                // Fetch conversations
                const convRes = await axios.get(`${API_URL}/api/chat/conversations`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                setConversations(convRes.data.conversations);

                // If redirected here with a specific conversation ID, open it
                const searchParams = new URLSearchParams(location.search);
                const convIdParam = searchParams.get('conversationId');
                if (convIdParam) {
                    const targetConv = convRes.data.conversations.find(c => c._id === convIdParam);
                    if (targetConv) setActiveConversation(targetConv);
                } else if (convRes.data.conversations.length > 0) {
                    setActiveConversation(convRes.data.conversations[0]);
                }

                setLoading(false);

                // Listen for new messages across all conversations to update the sidebar preview & unread counts
                socket.on('new_message', (msg) => {
                    setConversations(prev => {
                        const newConvs = [...prev];
                        const idx = newConvs.findIndex(c => c._id === msg.conversationId);
                        if (idx !== -1) {
                            newConvs[idx].lastMessage = msg.text;
                            newConvs[idx].lastMessageAt = msg.createdAt;
                            // Only increment if we aren't currently viewing it
                            const currentActive = activeConversationRef.current;
                            if (!currentActive || currentActive._id !== msg.conversationId) {
                                if (user.userType === 'buyer') newConvs[idx].buyerUnreadCount += 1;
                                else newConvs[idx].sellerUnreadCount += 1;
                            }
                            // Move to top
                            const [moved] = newConvs.splice(idx, 1);
                            newConvs.unshift(moved);
                        }
                        return newConvs;
                    });
                });

            } catch (err) {
                console.error("Error loading chat data", err);
                setLoading(false);
            }
        };

        fetchInitialData();

        return () => {
            socketService.disconnect();
        };
    }, [location.search]);

    const handleSelectConversation = (conv) => {
        setActiveConversation(conv);
        // Clear unread count locally when selected
        setConversations(prev => {
            const newConvs = [...prev];
            const idx = newConvs.findIndex(c => c._id === conv._id);
            if (idx !== -1) {
                if (currentUser.userType === 'buyer') newConvs[idx].buyerUnreadCount = 0;
                else newConvs[idx].sellerUnreadCount = 0;
            }
            return newConvs;
        });
    };

    if (loading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-[#4960B2] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const isBuyer = currentUser?.userType === 'buyer';

    return (
        <div className="bg-gray-50 min-h-[calc(100vh-80px)] py-8 px-4 md:px-8">
            <div className="max-w-[1400px] mx-auto h-[80vh] bg-white rounded-2xl shadow-lg border border-gray-100 flex overflow-hidden">
                
                {/* Sidebar - Conversation List */}
                <div className="w-full md:w-1/3 border-r border-gray-100 flex flex-col h-full bg-white z-10">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-2xl font-extrabold text-[#1e1e2d]">Messages</h2>
                        <p className="text-sm text-gray-500 mt-1">Chat directly with {isBuyer ? 'sellers' : 'buyers'}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                No active conversations yet.
                            </div>
                        ) : (
                            conversations.map(conv => {
                                const otherUser = isBuyer ? conv.sellerId : conv.buyerId;
                                const unreadCount = isBuyer ? conv.buyerUnreadCount : conv.sellerUnreadCount;
                                const isActive = activeConversation?._id === conv._id;
                                const hasPhoto = otherUser?.profileImage && otherUser.profileImage.trim() !== '';
                                const propertyTitle = conv.propertyId?.title;

                                return (
                                    <div 
                                        key={conv._id}
                                        onClick={() => handleSelectConversation(conv)}
                                        className={`p-4 border-b border-gray-50 cursor-pointer transition-colors flex items-center gap-3 ${isActive ? 'bg-[#f0f4ff]' : 'hover:bg-gray-50'}`}
                                    >
                                        <div className="relative w-11 h-11 flex-shrink-0 rounded-full overflow-hidden">
                                            {hasPhoto ? (
                                                <img src={`${API_URL}${otherUser.profileImage}`} alt={otherUser.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-[#4960B2] to-[#6c7fcf] text-white flex items-center justify-center font-bold text-base shadow-sm">
                                                    {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <h4 className={`text-sm truncate ${unreadCount > 0 ? 'font-bold text-[#1e1e2d]' : 'font-semibold text-gray-700'}`}>
                                                    {otherUser?.name || 'Unknown'}
                                                </h4>
                                                {conv.lastMessageAt && (
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2 flex-shrink-0">
                                                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                                                    </span>
                                                )}
                                            </div>
                                            {propertyTitle && (
                                                <p className="text-[10px] text-[#4960B2] font-semibold truncate mb-0.5">
                                                    🏠 {propertyTitle}
                                                </p>
                                            )}
                                            <p className={`text-xs truncate ${unreadCount > 0 ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>
                                                {conv.lastMessage || 'No messages yet'}
                                            </p>
                                        </div>
                                        {unreadCount > 0 && (
                                            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 animate-pulse">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className={`w-full md:w-2/3 h-full ${activeConversation ? 'block' : 'hidden md:flex'} absolute md:relative`}>
                    {activeConversation ? (
                        <ChatWindow conversation={activeConversation} currentUser={currentUser} />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                            </div>
                            <p>Select a conversation to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
