import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import { FiMessageSquare, FiSearch, FiEye, FiX } from 'react-icons/fi';
import { format, formatDistanceToNow } from 'date-fns';

const ManageConversations = () => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/admin/conversations`, { headers });
            setConversations(res.data.conversations);
        } catch (err) {
            console.error('Error fetching conversations:', err);
        } finally {
            setLoading(false);
        }
    };

    const viewMessages = async (conv) => {
        setSelectedConv(conv);
        setMessagesLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/chat/conversations/${conv._id}/messages?limit=100`, { headers });
            setMessages(res.data.messages);
        } catch (err) {
            console.error('Error fetching messages:', err);
        } finally {
            setMessagesLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedConv(null);
        setMessages([]);
    };

    // Filter conversations by search
    const filtered = conversations.filter(conv => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            conv.propertyId?.title?.toLowerCase().includes(q) ||
            conv.buyerId?.name?.toLowerCase().includes(q) ||
            conv.sellerId?.name?.toLowerCase().includes(q)
        );
    });

    const getStatusBadge = (status) => {
        const styles = {
            active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            closed: 'bg-gray-100 text-gray-600 border-gray-200',
            blocked: 'bg-red-100 text-red-700 border-red-200',
        };
        return styles[status] || styles.active;
    };

    const getRoleBadge = (userType) => {
        const styles = {
            superadmin: 'bg-purple-100 text-purple-700',
            seller: 'bg-blue-100 text-blue-700',
            buyer: 'bg-emerald-100 text-emerald-700',
        };
        return styles[userType] || 'bg-gray-100 text-gray-600';
    };

    return (
        <div className="pt-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D1C44] tracking-tight">Chat Conversations</h1>
                    <p className="text-sm text-gray-400 mt-1">Monitor all buyer-seller conversations</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-500 font-medium">
                    <FiMessageSquare size={16} />
                    {conversations.length} Total
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative max-w-md">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by property, buyer, or seller..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:border-[#4960B2] focus:bg-white text-sm outline-none transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">Loading conversations...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">No conversations found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Property</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Buyer</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Seller / Admin</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Last Message</th>
                                    <th className="text-center px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Unread</th>
                                    <th className="text-center px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="text-center px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((conv) => {
                                    const buyer = conv.buyerId;
                                    const seller = conv.sellerId;
                                    const property = conv.propertyId;
                                    const totalUnread = (conv.buyerUnreadCount || 0) + (conv.sellerUnreadCount || 0);
                                    const hasBuyerPhoto = buyer?.profileImage && buyer.profileImage.trim() !== '';
                                    const hasSellerPhoto = seller?.profileImage && seller.profileImage.trim() !== '';

                                    return (
                                        <tr key={conv._id} className="hover:bg-gray-50/50 transition-colors">
                                            {/* Property */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-[#4960B2]/10 flex items-center justify-center text-[#4960B2] flex-shrink-0 overflow-hidden">
                                                        {property?.images?.[0] ? (
                                                            <img src={`${API_URL}/uploads/${property.images[0]}`} alt={property.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-lg">🏠</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">
                                                            {property?.title || 'Unknown Property'}
                                                        </div>
                                                        {property?.price && (
                                                            <div className="text-xs text-gray-400">₹{property.price.toLocaleString()}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Buyer */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {hasBuyerPhoto
                                                            ? <img src={`${API_URL}${buyer.profileImage}`} alt={buyer.name} className="w-full h-full object-cover" />
                                                            : <span className="text-white text-xs font-bold">{buyer?.name?.charAt(0).toUpperCase() || '?'}</span>
                                                        }
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-800">{buyer?.name || 'Unknown'}</div>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getRoleBadge('buyer')}`}>BUYER</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Seller / Admin */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${seller?.userType === 'superadmin' ? 'bg-gradient-to-br from-purple-400 to-purple-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'}`}>
                                                        {hasSellerPhoto
                                                            ? <img src={`${API_URL}${seller.profileImage}`} alt={seller.name} className="w-full h-full object-cover" />
                                                            : <span className="text-white text-xs font-bold">{seller?.name?.charAt(0).toUpperCase() || '?'}</span>
                                                        }
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-800">{seller?.name || 'Unknown'}</div>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getRoleBadge(seller?.userType)}`}>
                                                            {seller?.userType === 'superadmin' ? 'ADMIN' : 'SELLER'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Last Message */}
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600 truncate max-w-[200px]">
                                                    {conv.lastMessage || <span className="text-gray-300 italic">No messages</span>}
                                                </div>
                                                {conv.lastMessageAt && (
                                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Unread */}
                                            <td className="px-6 py-4 text-center">
                                                {totalUnread > 0 ? (
                                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full">
                                                        {totalUnread}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300 text-sm">—</span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(conv.status)}`}>
                                                    {conv.status?.toUpperCase() || 'ACTIVE'}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => viewMessages(conv)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#4960B2]/10 text-[#4960B2] text-xs font-bold hover:bg-[#4960B2] hover:text-white transition-colors cursor-pointer"
                                                >
                                                    <FiEye size={12} /> View Chat
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Chat History Modal */}
            {selectedConv && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#4960B2] to-[#3a4d91] text-white flex-shrink-0">
                            <div>
                                <h3 className="font-bold">Chat History</h3>
                                <p className="text-xs text-white/70">
                                    🏠 {selectedConv.propertyId?.title} — {selectedConv.buyerId?.name} ↔ {selectedConv.sellerId?.name}
                                </p>
                            </div>
                            <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors">
                                <FiX size={16} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50/60">
                            {messagesLoading ? (
                                <div className="text-center text-gray-400 py-10">Loading messages...</div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-gray-400 py-10">No messages in this conversation.</div>
                            ) : (
                                messages.map((msg) => {
                                    const isBuyer = msg.senderId?._id === selectedConv.buyerId?._id;
                                    return (
                                        <div key={msg._id} className={`flex ${isBuyer ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isBuyer
                                                ? 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'
                                                : 'bg-[#4960B2] text-white rounded-br-sm shadow-md shadow-[#4960B2]/20'
                                            }`}>
                                                <p className={`text-[10px] font-bold mb-1 ${isBuyer ? 'text-emerald-600' : 'text-white/80'}`}>
                                                    {msg.senderId?.name || 'Unknown'}
                                                </p>
                                                <p className="text-sm leading-snug">{msg.text}</p>
                                                <p className={`text-[10px] mt-0.5 text-right ${isBuyer ? 'text-gray-400' : 'text-white/60'}`}>
                                                    {format(new Date(msg.createdAt), 'dd MMM, hh:mm a')}
                                                    {msg.isRead ? ' ✓✓' : ' ✓'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-400 flex-shrink-0">
                            Read-only view — Admin monitoring
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageConversations;
