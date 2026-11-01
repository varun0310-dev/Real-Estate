import React from "react";
import { FiEye, FiHeart } from "react-icons/fi";
import { FaBuilding, FaUsers } from "react-icons/fa";

const defaultStats = [
  {
    label: "All Properties",
    value: 0,
    icon: <FaBuilding size={20} className="text-white" />,
    cardBg: "bg-orange-50",
    dotColor: "bg-orange-500",
  },
  {
    label: "Total Views",
    value: 0,
    icon: <FiEye size={20} className="text-white" />,
    cardBg: "bg-green-50",
    dotColor: "bg-green-500",
  },
  {
    label: "Total Inquiries",
    value: 0,
    icon: <FaUsers size={20} className="text-white" />,
    cardBg: "bg-purple-50",
    dotColor: "bg-purple-500",
  },
  {
    label: "Total Favorites",
    value: 0,
    icon: <FiHeart size={20} className="text-white" />,
    cardBg: "bg-pink-50",
    dotColor: "bg-pink-500",
  },
];

const DashboardHeaders = ({ stats = defaultStats }) => {
  const displayStats = stats && stats.length > 0 ? stats : defaultStats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 p-4 rounded-2xl bg-white shadow-sm border border-gray-100 gap-4">
      {displayStats.map((item, index) => (
        <div
          key={index}
          className={`relative flex flex-col items-start justify-between p-5 rounded-xl ${item.cardBg || 'bg-gray-50'} transition-all duration-200 hover:shadow-sm`}
        >
          {/* Left colored accent bar */}
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-12 w-1 rounded-r-full ${item.dotColor || 'bg-blue-500'}`} />

          {/* Icon circle */}
          <div
            className={`rounded-full ${item.dotColor || 'bg-blue-500'} p-2.5 mb-3 shadow-sm flex items-center justify-center`}
          >
            {item.icon}
          </div>

          <div>
            {/* Number */}
            <div className="text-2xl font-black text-gray-900 tracking-tight">
              {item.value}
            </div>

            {/* Label */}
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mt-1">
              {item.label}
            </div>

            {/* Optional subtext or breakdown */}
            {item.subtext && (
              <div className="text-[11px] text-gray-400 mt-1 font-medium">
                {item.subtext}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardHeaders;
