import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bike,
  ChevronDown,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  RefreshCw,
  Settings,
  Shield,
  ShipWheel,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
  X,
  PlusCircle,
  List,
  FilePlus,
  History,
  GitPullRequest,
  ShieldPlus,
  ShieldCheck,
  UserPlus,
  Users as UsersIcon,
} from "lucide-react";
import { getSidebarMenu } from "../../config/sidebarMenu";
import { sidebarStyles } from "../../styles/sidebarStyles";
import sidebarLogo from "../../images/okmotorback.png";
import mobileLogo from "../../images/okmotor.png";

const ICONS = {
  LayoutDashboard,
  ShipWheel,
  ShoppingCart,
  TrendingUp,
  Shield,
  FileText,
  RefreshCw,
  Megaphone,
  Wrench,
  Wallet,
  Users,
  ImageIcon,
  Bike,
  Settings,
  PlusCircle,
  List,
  FilePlus,
  History,
  GitPullRequest,
  ShieldPlus,
  ShieldCheck,
  UserPlus,
  UsersIcon,
};

const resolvePath = (path, userRole) => {
  if (typeof path === "function") {
    return path(userRole);
  }
  return path;
};

const isActivePath = (pathname, targetPath) => {
  if (!targetPath) return false;
  if (pathname === targetPath) return true;
  if (targetPath !== "/" && pathname.startsWith(`${targetPath}/`)) return true;
  return false;
};

const AppSidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const menuItems = useMemo(() => getSidebarMenu(user?.role), [user?.role]);

  const handleNavigate = (path) => {
    const target = resolvePath(path, user?.role);
    if (target) {
      navigate(target);
      setIsSidebarOpen(false);
    }
  };

  const isMenuItemActive = (item) => {
    if (item.path) {
      return isActivePath(pathname, resolvePath(item.path, user?.role));
    }
    if (item.submenu) {
      return item.submenu.some((subItem) =>
        isActivePath(pathname, subItem.path),
      );
    }
    return false;
  };

  const isSubmenuOpen = (item) => {
    if (expandedMenus[item.name] !== undefined) {
      return expandedMenus[item.name];
    }
    return item.submenu?.some((subItem) =>
      isActivePath(pathname, subItem.path),
    );
  };

  const toggleMenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  return (
    <>
      <div
        style={{
          ...sidebarStyles.mobileTopBar,
          display: isMobile ? "flex" : "none",
        }}
      >
        <button
          type="button"
          style={{
            ...sidebarStyles.hamburgerButton,
            background: "transparent",
            border: "none",
          }}
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? (
            <X size={30} color="#ffffff" />
          ) : (
            <Menu size={30} color="#ffffff" />
          )}
        </button>
        <img src={mobileLogo} alt="OK Motor" style={sidebarStyles.mobileLogo} />
      </div>

      {isMobile && isSidebarOpen && (
        <div
          style={sidebarStyles.overlay}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        style={{
          ...sidebarStyles.shell,
          ...(isMobile
            ? {
                position: "fixed",
                top: 0,
                left: 0,
                transform: isSidebarOpen
                  ? "translateX(0)"
                  : "translateX(-100%)",
              }
            : {
                transform: "translateX(0)",
              }),
        }}
      >
        <div style={sidebarStyles.header}>
          <img src={sidebarLogo} alt="OK Motor" style={sidebarStyles.logo} />
          <p style={sidebarStyles.welcomeText}>
            Welcome, {user?.name || "User"}
          </p>
        </div>

        <nav style={sidebarStyles.nav}>
          {menuItems.map((item) => {
            const IconComponent = ICONS[item.icon] || FileText;
            const active = isMenuItemActive(item);
            const submenuOpen = !!item.submenu && isSubmenuOpen(item);

            return (
              <div key={item.name}>
                <div
                  style={{
                    ...sidebarStyles.menuItem,
                    ...(active ? sidebarStyles.menuItemActive : {}),
                  }}
                  onClick={() => {
                    if (item.submenu) {
                      toggleMenu(item.name);
                    } else {
                      handleNavigate(item.path);
                    }
                  }}
                >
                  <div style={sidebarStyles.menuItemContent}>
                    <IconComponent
                      size={19}
                      style={{
                        ...sidebarStyles.menuIcon,
                        ...(active ? { color: "#0E0F3B" } : {}),
                      }}
                    />
                    <span style={sidebarStyles.menuText}>{item.name}</span>
                  </div>
                  {item.submenu ? (
                    submenuOpen ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )
                  ) : null}
                </div>

                {item.submenu && (
                  <div
                    style={{
                      ...sidebarStyles.submenu,
                      maxHeight: submenuOpen
                        ? `${item.submenu.length * 46}px`
                        : "0px",
                      opacity: submenuOpen ? 1 : 0,
                      transition: "max-height 0.35s ease, opacity 0.25s ease",
                    }}
                  >
                    {item.submenu.map((subItem) => {
                      const subActive = isActivePath(pathname, subItem.path);
                      const SubIcon = ICONS[subItem.icon] || ChevronRight;
                      return (
                        <div
                          key={subItem.name}
                          style={{
                            ...sidebarStyles.submenuItem,
                            ...(subActive
                              ? sidebarStyles.submenuItemActive
                              : {}),
                          }}
                          onClick={() => handleNavigate(subItem.path)}
                        >
                          <SubIcon
                            size={16}
                            style={{
                              ...sidebarStyles.menuIcon,
                              ...(subActive ? { color: "#ffffff" } : {}),
                            }}
                          />
                          <span style={sidebarStyles.menuText}>
                            {subItem.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div
            style={sidebarStyles.logoutButton}
            onClick={() => {
              if (onLogout) {
                onLogout();
              } else {
                navigate("/login");
              }
            }}
          >
            <LogOut size={19} style={sidebarStyles.menuIcon} />
            <span style={sidebarStyles.menuText}>Logout</span>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default AppSidebar;
