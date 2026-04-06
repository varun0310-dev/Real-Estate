import { Link, useLocation } from "react-router-dom";
import Logo from "@assets/logo.svg";
import { HiMenuAlt2, HiChevronLeft } from "react-icons/hi";

// Define navigation structure
const navItems = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Categories", path: "/dashboard/categories" },
  { name: "Amenities", path: "/dashboard/amenities" },
  { name: "My Properties", path: "/dashboard/my-properties" },
  //{ name: "Messages", path: "/dashboard/messages" },
  //{ name: "My Favorites", path: "/dashboard/favorites" },
  //{ name: "Reviews", path: "/dashboard/reviews" },
  //{ name: "My Package", path: "/dashboard/package" },
  { name: "My Profile", path: "/dashboard/profile" },
  { name: "Logout", path: "/login" }, // You can handle logout logic separately
];

const Sidebar = ({ onNavigate, isCollapsed, setIsCollapsed, userType }) => {
  const location = useLocation();

  const filteredNavItems = navItems.filter((item) => {
    if (userType === "buyer") {
      return !["Categories", "Amenities", "My Properties"].includes(item.name);
    }
    return true;
  });
  return (
    <aside className={`h-screen bg-white fixed p-4 flex flex-col items-start shadow transition-all duration-300 z-[100] ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Header with Logo and Toggle */}
      <div className={`mb-8 w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
        {!isCollapsed && (
          <Link to="/">
            <img src={Logo} alt="App Logo" className="w-[100px] h-auto" />
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-[#4960B2] transition-colors cursor-pointer"
        >
          {isCollapsed ? <HiMenuAlt2 size={24} /> : <HiChevronLeft size={24} />}
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex flex-col gap-2 w-full overflow-y-auto hide-scrollbar">
        {filteredNavItems.map(({ name, path }) => {
          const isActive = location.pathname === path;

          return (
            <button
              key={name}
              onClick={() => onNavigate(path)}
              className={`w-full text-left flex items-center text-[14px] cursor-pointer gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive
                ? "bg-[#4960B2] text-white shadow-lg shadow-blue-100"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={isCollapsed ? name : ""}
            >
              {/* Custom Icon wrapper */}
              <div className="flex-shrink-0">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <mask id={`mask-${name}`} maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
                    <rect width="32" height="32" fill="white" />
                  </mask>
                  <g mask={`url(#mask-${name})`}>
                    <path
                      d="M13.6704 7.84582L14.0416 13.3658L14.2259 16.1402C14.2279 16.4255 14.2726 16.709 14.3588 16.9814C14.5814 17.5102 15.1168 17.8462 15.6994 17.8227L24.5756 17.242C24.96 17.2358 25.3312 17.3795 25.6075 17.6418C25.8378 17.8603 25.9864 18.1462 26.0334 18.4536L26.0491 18.6403C25.6818 23.7266 21.9462 27.969 16.8704 29.064C11.7946 30.1591 6.58971 27.8458 4.08151 23.3799C3.35842 22.0824 2.90677 20.6564 2.75307 19.1854C2.68887 18.7499 2.66061 18.31 2.66854 17.87C2.66061 12.417 6.54386 7.70265 11.9797 6.56613C12.6339 6.46425 13.2753 6.8106 13.5376 7.40741C13.6055 7.54562 13.6503 7.69365 13.6704 7.84582Z"
                      fill={isActive ? "#ffffff" : "#64748b"}
                    />
                    <path
                      d="M29.3335 13.083L29.3241 13.1265L29.2972 13.1897L29.3009 13.3632C29.2871 13.5929 29.1983 13.814 29.0455 13.9926C28.8861 14.1786 28.6685 14.3053 28.4289 14.3545L28.2828 14.3745L18.0417 15.0381C17.7011 15.0717 17.3619 14.9618 17.1087 14.736C16.8975 14.5476 16.7625 14.2934 16.7244 14.0196L16.0371 3.79337C16.0251 3.7588 16.0251 3.72132 16.0371 3.68673C16.0464 3.40485 16.1705 3.13841 16.3816 2.94693C16.5925 2.75545 16.8731 2.65489 17.1601 2.66772C23.24 2.8224 28.3499 7.19435 29.3335 13.083Z"
                      fill={isActive ? "#ffffff" : "#64748b"}
                    />
                  </g>
                </svg>
              </div>

              {!isCollapsed && <span>{name}</span>}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
