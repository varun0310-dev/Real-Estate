import React from "react";
import { Link } from "react-router-dom";
import { FiMessageSquare, FiArrowRight } from "react-icons/fi";
import { API_URL } from "../../../config";

const defaultMessages = [
  {
    name: "James Benny",
    message: "Hey, Let me know if you're still available...",
    img: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "William Chynita",
    message: "Okay thanks",
    img: "https://randomuser.me/api/portraits/men/33.jpg",
  },
  {
    name: "Henry David",
    message: "Alright I'll get back to you ASAP",
    img: "https://randomuser.me/api/portraits/men/34.jpg",
  },
  {
    name: "Charlotte Flair",
    message: "Sounds good buddy",
    img: "https://randomuser.me/api/portraits/women/35.jpg",
  },
];

const RecentMessages = ({ messages = [], title = "Recent Messages", viewAllLink = "/dashboard/messages" }) => {
  // If backend provided messages, normalize them
  const formattedMessages = messages && messages.length > 0 ? messages.map((m) => {
    const sender = m.buyerId || m.sellerId || {};
    const avatar = sender.profileImage
      ? (sender.profileImage.startsWith('http') ? sender.profileImage : `${API_URL}/${sender.profileImage.replace(/^\/+/, '')}`)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.name || 'User')}&background=4960B2&color=fff`;

    return {
      id: m._id,
      name: sender.name || sender.companyName || 'Anonymous',
      message: m.lastMessage || m.propertyId?.title || 'Inquired about your property',
      img: avatar,
      time: m.lastMessageAt ? new Date(m.lastMessageAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently',
      propertyTitle: m.propertyId?.title,
    };
  }) : defaultMessages;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-[#111827]">{title}</h2>
        <Link
          to={viewAllLink}
          className="text-xs font-semibold text-[#4960B2] hover:text-[#3b4f98] flex items-center gap-1 transition"
        >
          View All <FiArrowRight size={13} />
        </Link>
      </div>

      <div className="space-y-3">
        {formattedMessages.slice(0, 4).map((msg, idx) => (
          <Link
            key={msg.id || idx}
            to={viewAllLink}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition group"
          >
            <div className="relative">
              <img
                src={msg.img}
                alt={msg.name}
                className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-xs"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.name)}&background=4960B2&color=fff`;
                }}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-xs text-gray-900 group-hover:text-[#4960B2] truncate transition">
                  {msg.name}
                </p>
                {msg.time && (
                  <span className="text-[10px] text-gray-400 font-medium ml-2 shrink-0">
                    {msg.time}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">{msg.message}</p>
              {msg.propertyTitle && (
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-blue-50 text-[#4960B2] font-semibold rounded truncate max-w-full">
                  {msg.propertyTitle}
                </span>
              )}
            </div>
          </Link>
        ))}

        {formattedMessages.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-xs">
            <FiMessageSquare className="mx-auto mb-2 text-gray-300" size={24} />
            No recent messages found.
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentMessages;
