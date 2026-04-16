import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

// Public Pages
import Home from "@pages/Home";
import Properties from "../pages/Properties";
import Login from "@pages/Login";
import Register from "@pages/Register";
import ForgotPassword from "@pages/ForgotPassword";
import ResetPassword from "@pages/ResetPassword";
import VerifyOTP from "@pages/ResetOTP";
import ContactForm from "../pages/ContactForm";

// Dashboard Layout & Pages
import DashboardLayout from "@layouts/DashboardLayout";
import DashboardHome from "../pages/dashboard/DashboardHome";
import DashboardAllComp from "../pages/dashboard/dashboardAllComp";
import MyPropertiesAllcomp from "../pages/dashboard/MyPropertiesAllcomp";
import CategoriesAllComp from "../pages/dashboard/CategoriesAllComp";
import AmenitiesAllComp from "../pages/dashboard/AmenitiesAllComp";
import Messages from "../components/dashboard/Messages";
import MyFavorites from "../components/dashboard/MyFav";
import Reviews from "../components/dashboard/Reviews";
import MyPackage from "../components/dashboard/MyPackage";
import MyProfileComp from "../pages/dashboard/MyProfileComp";
import Settings from "../pages/dashboard/Settings";
import ManageUsers from "../pages/dashboard/ManageUsers";
import ManageRoles from "../pages/dashboard/ManageRoles";
import About from "../pages/About";

function LayoutWrapper({ children }) {
  const location = useLocation();
  const hideLayoutPaths = ["/login", "/register", "/forgot-password"];
  const shouldHideLayout = hideLayoutPaths.includes(location.pathname);

  return (
    <>
      {!shouldHideLayout && <Header />}
      {children}
      {!shouldHideLayout && <Footer />}
    </>
  );
}

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LayoutWrapper> <Home /></LayoutWrapper>} />
        <Route path="/about-us" element={<LayoutWrapper> <About /></LayoutWrapper>} />
        <Route path="/login" element={<LayoutWrapper><Login /></LayoutWrapper>} />
        <Route path="/register" element={<LayoutWrapper><Register /></LayoutWrapper>} />
        <Route path="/forgot-password" element={<LayoutWrapper><ForgotPassword /></LayoutWrapper>} />
        <Route path="/reset-password/:token" element={<LayoutWrapper><ResetPassword /></LayoutWrapper>} />
        <Route path="/contact-us" element={<LayoutWrapper><ContactForm /></LayoutWrapper>} />
        <Route path="/properties" element={<LayoutWrapper><Properties /></LayoutWrapper>} />
        <Route path="/verify-otp" element={<LayoutWrapper><VerifyOTP /></LayoutWrapper>} />

        {/* Dashboard Routes with Nested Navigation */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardAllComp />} />
          <Route path="my-properties" element={<MyPropertiesAllcomp />} />
          <Route path="categories" element={<CategoriesAllComp />} />
          <Route path="amenities" element={<AmenitiesAllComp />} />
          <Route path="messages" element={<Messages />} />
          <Route path="favorites" element={<MyFavorites />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="package" element={<MyPackage />} />
          <Route path="profile" element={<MyProfileComp />} />
          <Route path="settings" element={<Settings />} />
          <Route path="manage-users" element={<ManageUsers />} />
          <Route path="manage-roles" element={<ManageRoles />} />
        </Route>
      </Routes>
    </Router>
  );
}
