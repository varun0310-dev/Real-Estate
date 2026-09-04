import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import DefaultLogo from "@assets/logo.svg";
import { HiMenuAlt2, HiChevronLeft, HiChevronDown, HiChevronRight } from "react-icons/hi";
import axios from "axios";
import { API_URL } from "../../config";

// Icons for different nav items
const NavIcon = ({ name, isActive }) => {
  const color = isActive ? "#ffffff" : "#64748b";

  const icons = {
    Dashboard: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="9" rx="1.5" fill={color} />
        <rect x="14" y="3" width="7" height="5" rx="1.5" fill={color} />
        <rect x="3" y="15" width="7" height="6" rx="1.5" fill={color} />
        <rect x="14" y="11" width="7" height="10" rx="1.5" fill={color} />
      </svg>
    ),
    Categories: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="8" rx="2" fill={color} />
        <rect x="13" y="3" width="8" height="8" rx="2" fill={color} />
        <rect x="3" y="13" width="8" height="8" rx="2" fill={color} />
        <rect x="13" y="13" width="8" height="8" rx="2" fill={color} />
      </svg>
    ),
    Amenities: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={color} />
      </svg>
    ),
    "My Properties": (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    "My Profile": (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" fill={color} />
        <path d="M5 20C5 17.2386 8.13401 15 12 15C15.866 15 19 17.2386 19 20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    Settings: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill={color} />
        <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    "Users & Roles": (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
        <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    "Manage Users": (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      </svg>
    ),
    "Manage Roles": (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L3 7V12C3 17.25 6.75 21.75 12 23C17.25 21.75 21 17.25 21 12V7L12 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 12L11 14L15 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    Logout: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M9 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 17L21 12L16 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  };

  // Fallback icon (pie chart)
  const fallback = (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.67 7.85L14.04 13.37L14.23 16.14C14.23 16.43 14.27 16.71 14.36 16.98C14.58 17.51 15.12 17.85 15.7 17.82L24.58 17.24C24.96 17.24 25.33 17.38 25.61 17.64C25.84 17.86 25.99 18.15 26.03 18.45L26.05 18.64C25.68 23.73 21.95 27.97 16.87 29.06C11.79 30.16 6.59 27.85 4.08 23.38C3.36 22.08 2.91 20.66 2.75 19.19C2.69 18.75 2.66 18.31 2.67 17.87C2.66 12.42 6.54 7.7 11.98 6.57C12.63 6.46 13.28 6.81 13.54 7.41C13.61 7.55 13.65 7.69 13.67 7.85Z" fill={color} />
      <path d="M29.33 13.08L29.32 13.13L29.3 13.19L29.3 13.36C29.29 13.59 29.2 13.81 29.05 13.99C28.89 14.18 28.67 14.31 28.43 14.35L28.28 14.37L18.04 15.04C17.7 15.07 17.36 14.96 17.11 14.74C16.9 14.55 16.76 14.29 16.72 14.02L16.04 3.79C16.03 3.76 16.03 3.72 16.04 3.69C16.05 3.4 16.17 3.14 16.38 2.95C16.59 2.76 16.87 2.65 17.16 2.67C23.24 2.82 28.35 7.19 29.33 13.08Z" fill={color} />
    </svg>
  );

  return icons[name] || fallback;
};

// Define navigation structure with sub-items support
const navItems = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Categories", path: "/dashboard/categories" },
  { name: "Amenities", path: "/dashboard/amenities" },
  { name: "My Properties", path: "/dashboard/my-properties" },
  { name: "Conversations", path: "/dashboard/conversations" },
  {
    name: "Users & Roles",
    children: [
      { name: "Manage Users", path: "/dashboard/manage-users" },
      { name: "Manage Roles", path: "/dashboard/manage-roles" },
    ],
  },
  { name: "My Profile", path: "/dashboard/profile" },
  { name: "Settings", path: "/dashboard/settings" },
  { name: "Logout", path: "/login" },
];

const Sidebar = ({ onNavigate, isCollapsed, setIsCollapsed, userType }) => {
  const location = useLocation();
  const [customLogo, setCustomLogo] = useState(null);
  const [openMenus, setOpenMenus] = useState({});

  // Fetch custom logo
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/settings/logo`);
        if (res.data.logoUrl) {
          setCustomLogo(`${API_URL}${res.data.logoUrl}`);
        }
      } catch (err) {
        console.error('Failed to fetch logo:', err);
      }
    };
    fetchLogo();

    const handleLogoUpdate = () => fetchLogo();
    window.addEventListener('logoUpdated', handleLogoUpdate);
    return () => window.removeEventListener('logoUpdated', handleLogoUpdate);
  }, []);

  // Auto-expand parent menu if child is active
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some((child) => location.pathname === child.path);
        if (isChildActive) {
          setOpenMenus((prev) => ({ ...prev, [item.name]: true }));
        }
      }
    });
  }, [location.pathname]);

  const toggleMenu = (name) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const filteredNavItems = navItems.filter((item) => {
    if (userType === "buyer") {
      return !["Categories", "Amenities", "My Properties", "Settings", "Users & Roles", "Conversations"].includes(item.name);
    }
    // Users & Roles, Settings, Conversations only visible to superadmin
    if ((item.name === "Settings" || item.name === "Users & Roles" || item.name === "Conversations") && userType !== "superadmin") {
      return false;
    }
    return true;
  });

  const isItemActive = (item) => {
    if (item.path) return location.pathname === item.path;
    if (item.children) return item.children.some((child) => location.pathname === child.path);
    return false;
  };

  return (
    <aside className={`h-screen bg-white fixed p-4 flex flex-col items-start shadow transition-all duration-300 z-[100] ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Header with Logo and Toggle */}
      <div className={`mb-8 w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
        {!isCollapsed && (
          <Link to="/">
            <img src={customLogo || DefaultLogo} alt="App Logo" className="w-[100px] h-auto" onError={(e) => { e.target.src = DefaultLogo; }} />
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
      <div className="flex flex-col gap-1 w-full overflow-y-auto hide-scrollbar">
        {filteredNavItems.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isOpen = openMenus[item.name];
          const isActive = isItemActive(item);
          const isParentOfActive = hasChildren && item.children.some((c) => location.pathname === c.path);

          if (hasChildren) {
            return (
              <div key={item.name}>
                {/* Parent button */}
                <button
                  onClick={() => {
                    if (isCollapsed) {
                      setIsCollapsed(false);
                      setOpenMenus((prev) => ({ ...prev, [item.name]: true }));
                    } else {
                      toggleMenu(item.name);
                    }
                  }}
                  className={`w-full text-left flex items-center text-[14px] cursor-pointer gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isParentOfActive
                      ? "bg-[#4960B2]/10 text-[#4960B2]"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={isCollapsed ? item.name : ""}
                >
                  <div className="flex-shrink-0">
                    <NavIcon name={item.name} isActive={isParentOfActive} />
                  </div>
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                        <HiChevronDown size={16} />
                      </div>
                    </>
                  )}
                </button>

                {/* Sub-menu items */}
                {!isCollapsed && (
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                  >
                    <div className="ml-4 pl-4 border-l-2 border-gray-100 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const isChildActive = location.pathname === child.path;
                        return (
                          <button
                            key={child.name}
                            onClick={() => onNavigate(child.path)}
                            className={`w-full text-left flex items-center text-[13px] cursor-pointer gap-2.5 px-3 py-2.5 rounded-lg font-semibold transition-all ${isChildActive
                                ? "bg-[#4960B2] text-white shadow-md shadow-blue-100"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                              }`}
                          >
                            <div className="flex-shrink-0">
                              <NavIcon name={child.name} isActive={isChildActive} />
                            </div>
                            <span>{child.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // Regular nav item (no children)
          return (
            <button
              key={item.name}
              onClick={() => onNavigate(item.path)}
              className={`w-full text-left flex items-center text-[14px] cursor-pointer gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive
                  ? "bg-[#4960B2] text-white shadow-lg shadow-blue-100"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={isCollapsed ? item.name : ""}
            >
              <div className="flex-shrink-0">
                <NavIcon name={item.name} isActive={isActive} />
              </div>
              {!isCollapsed && <span>{item.name}</span>}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
