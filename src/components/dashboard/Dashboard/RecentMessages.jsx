import React from "react";
import { FaMapMarkerAlt } from "react-icons/fa";

const messages = [
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

const RecentMessages = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm ">
      {/* Recent Messages */}
      <h2 className="text-lg font-semibold mb-4">Recent Messages</h2>
      <div className="space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <img
              src={msg.img}
              alt={msg.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-sm">{msg.name}</p>
              <p className="text-sm text-gray-500">{msg.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Map View */}
      <h2 className="text-lg font-semibold mt-8 mb-4">Map View</h2>
      <div className="w-full h-64 rounded-xl overflow-hidden">
        <img
          src="./src/assets/Map.svg" 
          alt="Map View"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default RecentMessages;
