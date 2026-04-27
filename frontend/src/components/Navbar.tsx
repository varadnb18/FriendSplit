import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  HiOutlineViewGrid,
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlineLogout,
} from "react-icons/hi";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="sidebar" id="sidebar">
        <div className="sidebar-header">
          <h1 className="logo">Friend<span>Split</span></h1>
          <p className="logo-subtitle">Expense Manager</p>
        </div>

        <div className="nav-links">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} id="nav-dashboard">
            <HiOutlineViewGrid className="nav-icon" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/friends" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} id="nav-friends">
            <HiOutlineUsers className="nav-icon" />
            <span>Friends</span>
          </NavLink>
          <NavLink to="/groups" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} id="nav-groups">
            <HiOutlineUserGroup className="nav-icon" />
            <span>Groups</span>
          </NavLink>
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <p className="user-name">{user?.name}</p>
              <p className="user-email">{user?.email}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} id="logout-btn">
            <HiOutlineLogout />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav" id="mobile-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}>
          <HiOutlineViewGrid />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/friends" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}>
          <HiOutlineUsers />
          <span>Friends</span>
        </NavLink>
        <NavLink to="/groups" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}>
          <HiOutlineUserGroup />
          <span>Groups</span>
        </NavLink>
        <button className="mobile-nav-item" onClick={handleLogout}>
          <HiOutlineLogout />
          <span>Logout</span>
        </button>
      </nav>
    </>
  );
}
