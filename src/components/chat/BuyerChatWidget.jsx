import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import socketService from '../../services/socket';
import { API_URL } from '../../config';
import { FiMessageSquare, FiChevronDown } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import FloatingChat from './FloatingChat';

/**
 * BuyerChatWidget – floating inbox for buyer users.
 * Shows a chat bubble with total unread count.
 * Clicking opens conversation list, selecting one opens FloatingChat.
 */
export default function BuyerChatWidget({ currentUser }) {
    const [conversations, setConversations] = useState([]);
    const [totalUnread, setTotalUnread] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [activeConv, setActiveConv] = useState(null);
    const [loading, setLoading] = useState(true);

    const activeConvRef = useRef(activeConv);
    useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

    useEffect(() => {
        if (currentUser?.userType !== 'buyer') return;

        const token = localStorage.getItem('token');
        if (!token) return;

        const load = async () => {
            try {
                const socket = socketService.connect(token);

                const res = await axios.get(`${API_URL}/api/chat/conversations`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const convs = res.data.conversations;
                setConversations(convs);
                const total = convs.reduce((acc, c) => acc + (c.buyerUnreadCount || 0), 0);
                setTotalUnread(total);
                setLoading(false);

                // Join all conversation rooms so we receive messages
                convs.forEach(c => socket.emit('join_conversation', c._id));

                socket.on('new_message', (msg) => {
                    setConversations((prev) => {
                        const newConvs = [...prev];
                        const idx = newConvs.findIndex((c) => c._id === msg.conversationId);
                        if (idx !== -1) {
                            newConvs[idx] = {
                                ...newConvs[idx],
                                lastMessage: msg.text,
                                lastMessageAt: msg.createdAt,
                            };

                            const current = activeConvRef.current;
                            if (msg.senderId._id !== currentUser._id && (!current || current._id !== msg.conversationId)) {
                                newConvs[idx] = { ...newConvs[idx], buyerUnreadCount: (newConvs[idx].buyerUnreadCount || 0) + 1 };
                            }

                            const [moved] = newConvs.splice(idx, 1);
                            newConvs.unshift(moved);
                        }
                        return newConvs;
                    });

                    if (msg.senderId._id !== currentUser._id) {
                        const current = activeConvRef.current;
                        if (!current || current._id !== msg.conversationId) {
                            setTotalUnread((n) => n + 1);
                        }
                    }
                });
            } catch (err) {
                console.error('BuyerChatWidget load error:', err);
                setLoading(false);
            }
        };

        load();
    }, [currentUser]);

    if (currentUser?.userType !== 'buyer') return null;
    // Don't show if no conversations at all
    if (!loading && conversations.length === 0) return null;

    const handleOpenConv = (conv) => {
        setActiveConv(conv);
        setIsOpen(false);
        setConversations((prev) => {
            const newConvs = [...prev];
            const idx = newConvs.findIndex((c) => c._id === conv._id);
            if (idx !== -1) {
                const delta = newConvs[idx].buyerUnreadCount || 0;
                newConvs[idx] = { ...newConvs[idx], buyerUnreadCount: 0 };
                setTotalUnread((n) => Math.max(0, n - delta));
            }
            return newConvs;
        });
    };

    const handleCloseChat = () => setActiveConv(null);

    return (
        <>
            {activeConv && (
                <FloatingChat
                    conversation={activeConv}
                    currentUser={currentUser}
                    onClose={handleCloseChat}
                />
            )}

            {!activeConv && (
                <div className="fixed bottom-6 right-6 z-[99] flex flex-col items-end gap-3">
                    {isOpen && (
                        <div className="w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                            style={{ animation: 'slideUp 0.25s ease-out' }}
                        >
                            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#4960B2] to-[#3a4d91] text-white">
                                <h3 className="font-bold text-sm">My Chats</h3>
                                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1 transition-colors">
                                    <FiChevronDown size={14} />
                                </button>
                            </div>

                            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                                {loading ? (
                                    <div className="p-6 text-center text-gray-400 text-sm">Loading…</div>
                                ) : conversations.length === 0 ? (
                                    <div className="p-6 text-center text-gray-400 text-sm">No conversations yet.</div>
                                ) : (
                                    conversations.map((conv) => {
                                        const seller = conv.sellerId;
                                        const unread = conv.buyerUnreadCount || 0;
                                        const propertyTitle = conv.propertyId?.title;
                                        const hasPhoto = seller?.profileImage && seller.profileImage.trim() !== '';
                                        return (
                                            <div
                                                key={conv._id}
                                                onClick={() => handleOpenConv(conv)}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-[#f0f4ff] cursor-pointer transition-colors"
                                            >
                                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#4960B2] to-[#6c7fcf] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                                                    {hasPhoto
                                                        ? <img src={`${API_URL}${seller.profileImage}`} alt={seller.name} className="w-full h-full object-cover" />
                                                        : <span className="text-white font-bold text-base">{seller?.name?.charAt(0).toUpperCase() || '?'}</span>
                                                    }
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-0.5">
                                                        <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-[#1e1e2d]' : 'font-semibold text-gray-700'}`}>
                                                            {seller?.name || 'Seller'}
                                                        </p>
                                                        {conv.lastMessageAt && (
                                                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2 flex-shrink-0">
                                                                {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {propertyTitle && (
                                                        <p className="text-[10px] text-[#4960B2] font-semibold truncate flex items-center gap-1 mb-0.5">
                                                            🏠 {propertyTitle}
                                                        </p>
                                                    )}
                                                    <p className={`text-xs truncate ${unread > 0 ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>
                                                        {conv.lastMessage || 'No messages yet'}
                                                    </p>
                                                </div>

                                                {unread > 0 && (
                                                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 animate-pulse">
                                                        {unread > 9 ? '9+' : unread}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {/* FAB button */}
                    <button
                        onClick={() => setIsOpen((v) => !v)}
                        className="relative w-14 h-14 bg-[#4960B2] text-white rounded-full shadow-xl hover:bg-[#3a4d91] transition-all duration-200 flex items-center justify-center"
                    >
                        <FiMessageSquare size={22} />
                        {totalUnread > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                                {totalUnread > 9 ? '9+' : totalUnread}
                            </span>
                        )}
                    </button>
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
}
