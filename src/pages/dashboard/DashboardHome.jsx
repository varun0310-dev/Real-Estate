import { useState } from "react";
import Sidebar from "../../components/dashboard/Sidebar";
import DashboardAllComp from "./dashboardAllComp";
import Messages from "../../components/dashboard/Messages";
import MyFavorites from "../../components/dashboard/MyFav";
import Reviews from "../../components/dashboard/Reviews";
import MyPackage from "../../components/dashboard/MyPackage";
import Navbar from "../../components/dashboard/Navbar";
import MyPropertiesAllcomp from "./MyPropertiesAllcomp";
import MyProfileComp from "./MyProfileComp";

const DashboardHome = () => {
    const [activeComponent, setActiveComponent] = useState("Dashboard");

    const renderComponent = () => {
        switch (activeComponent) {
            case "Dashboard":
                return <DashboardAllComp />;
            case "My Properties":
                return <MyPropertiesAllcomp />;
            case "Messages":
                return <Messages />;
            case "My Favorites":
                return <MyFavorites />;
            case "Reviews":
                return <Reviews />;
            case "My Package":
                return <MyPackage />;
            case "My Profile":
                return <MyProfileComp />;
            default:
                return <DashboardAllComp />;
        }
    };

    return (
        <div className="flex">
            {/* Sidebar */}
            <Sidebar
                activeComponent={activeComponent}
                setActiveComponent={setActiveComponent}
            />

            {/* Right content */}
            <div className="ml-64 w-full bg-gray-100 h-screen overflow-hidden">
                {/* Fixed Navbar */}
                <div className="fixed top-0 left-64 right-0 z-50">
                    <Navbar
                        title={activeComponent}
                        onProfileClick={() => setActiveComponent("My Profile")}
                    />
                </div>

                {/* Scrollable content */}
                <div className="mt-16 p-3 h-[calc(100vh-4rem)] overflow-y-auto">
                    {renderComponent()}
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
