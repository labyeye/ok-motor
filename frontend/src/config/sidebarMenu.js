export function getSidebarMenu(userRole) {
  const baseMenu = [
    {
      name: "Dashboard",
      icon: "LayoutDashboard",
      path: (role) => (role === "admin" ? "/admin" : "/staff"),
    },
    {
      name: "Vehicle",
      icon: "ShipWheel",
      submenu: [
        { name: "Add Vehicle", path: "/vehicle/create" },
        { name: "Vehicle List", path: "/vehicle/history" },
      ],
    },
    {
      name: "Buy",
      icon: "ShoppingCart",
      submenu: [
        { name: "Create Buy Letter", path: "/buy/create" },
        { name: "Buy Letter History", path: "/buy/history" },
      ],
    },
    {
      name: "Sell",
      icon: "TrendingUp",
      submenu: [
        { name: "Create Sell Letter", path: "/sell/create" },
        { name: "Sell Letter History", path: "/sell/history" },
        { name: "Sell Requests", path: "/sell/requests" },
      ],
    },
    {
      name: "Insurance",
      icon: "Shield",
      submenu: [
        { name: "Add Insurance", path: "/insurance/create" },
        { name: "Insurance List", path: "/insurance/history" },
      ],
    },
    {
      name: "PUC",
      icon: "FileText",
      submenu: [
        { name: "Add PUC", path: "/puc/create" },
        { name: "PUC List", path: "/puc/history" },
      ],
    },
    {
      name: "Updates",
      icon: "RefreshCw",
      submenu: [
        { name: "Create Update", path: "/updates/create" },
        { name: "Updates List", path: "/updates" },
      ],
    },
    {
      name: "Announcements",
      icon: "Megaphone",
      path: "/announcements",
    },
    {
      name: "Service",
      icon: "Wrench",
      submenu: [
        { name: "Create Service Bill", path: "/service/create" },
        { name: "Service History", path: "/service/history" },
      ],
    },
    {
      name: "Payment",
      icon: "Wallet",
      submenu: [
        { name: "Create Advance Bill", path: "/advance/create" },
        { name: "Advance History", path: "/advance/history" },
      ],
    },
    {
      name: "Staff",
      icon: "Users",
      submenu: [
        { name: "Create Staff ID", path: "/staff/create" },
        { name: "Staff List", path: "/staff/list" },
      ],
    },
    {
      name: "Gallery",
      icon: "ImageIcon",
      path: "/gallery/manage",
    },
    {
      name: "Letter Head",
      icon: "FileText",
      path: "/letter-head/create",
    },
    {
      name: "Vehicle History",
      icon: "Bike",
      path: "/bike-history",
    },
    {
      name: "Settings",
      icon: "Settings",
      path: "/settings",
    },
  ];

  if (userRole === "staff") {
    return baseMenu.filter((item) => item.name !== "Staff");
  }

  return baseMenu;
}
