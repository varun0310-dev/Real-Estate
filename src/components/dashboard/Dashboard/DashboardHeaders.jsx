import React from "react";
import { FiEye, FiHeart } from "react-icons/fi";
import { FaBuilding, FaUsers } from "react-icons/fa";

const stats = [
  {
    label: "All Properties",
    value: 234,
    icon: <FaBuilding size={20} className="text-white" />,
    cardBg: "bg-orange-50",
    dotColor: "bg-orange-500",
  },
  {
    label: "Total View",
    value: 78,
    icon: <FiEye size={20} className="text-white" />,
    cardBg: "bg-green-100",
    dotColor: "bg-green-500",
  },
  {
    label: "Total Visitor",
    value: 234,
    icon: <FaUsers size={20} className="text-white" />,
    cardBg: "bg-purple-100",
    dotColor: "bg-purple-500",
  },
  {
    label: "Total Favorites",
    value: 100,
    icon: <FiHeart size={20} className="text-white" />,
    cardBg: "bg-pink-100",
    dotColor: "bg-pink-500",
  },
];

const DashboardHeaders = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 p-3 rounded-[10px] bg-[#ffffff] gap-4">
      {stats.map((item, index) => (
        <div
          key={index}
          className={`relative flex flex-col items-start justify-start px-4 py-4 rounded-[5px] ${item.cardBg}`}
        >
          {/* Left colored bar */}
         <div className={`absolute left-0 bottom-5 h-[50px] w-[4px] rounded-full ${item.dotColor}`} />


          {/* Icon on top */}
          <div
            className={`rounded-full ${item.dotColor} p-2 mb-4`}
          >
            {item.icon}
          </div>

          {/* Number */}
          <div className="text-2xl font-bold text-black">
            {item.value}
          </div>

          {/* Label */}
          <div className="text-sm text-gray-700">{item.label}</div>
        </div>
      ))}
    </div>
  );
};

export default DashboardHeaders;
