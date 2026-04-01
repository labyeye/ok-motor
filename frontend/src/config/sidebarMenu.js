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
        { name: "Add Vehicle", path: "/vehicle/create", icon: "PlusCircle" },
        { name: "Vehicle List", path: "/vehicle/history", icon: "List" },
      ],
    },
    {
      name: "Buy",
      icon: "ShoppingCart",
      submenu: [
        {
          name: "Create Buy Letter",
          path: "/buy/create",
          icon: "FilePlus",
        },
        {
          name: "Buy Letter History",
          path: "/buy/history",
          icon: "History",
        },
      ],
    },
    {
      name: "Sell",
      icon: "TrendingUp",
      submenu: [
        {
          name: "Create Sell Letter",
          path: "/sell/create",
          icon: "FilePlus",
        },
        {
          name: "Sell Letter History",
          path: "/sell/history",
          icon: "History",
        },
        {
          name: "Sell Requests",
          path: "/sell/requests",
          icon: "GitPullRequest",
        },
      ],
    },
    {
      name: "Insurance",
      icon: "Shield",
      submenu: [
        {
          name: "Add Insurance",
          path: "/insurance/create",
          icon: "ShieldPlus",
        },
        {
          name: "Insurance List",
          path: "/insurance/history",
          icon: "ShieldCheck",
        },
      ],
    },
    {
      name: "PUC",
      icon: "FileText",
      submenu: [
        { name: "Add PUC", path: "/puc/create", icon: "FilePlus" },
        { name: "PUC List", path: "/puc/history", icon: "History" },
      ],
    },
    {
      name: "Updates",
      icon: "RefreshCw",
      submenu: [
        { name: "Create Update", path: "/updates/create", icon: "PlusCircle" },
        { name: "Updates List", path: "/updates", icon: "List" },
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
        {
          name: "Create Service Bill",
          path: "/service/create",
          icon: "FilePlus",
        },
        {
          name: "Service History",
          path: "/service/history",
          icon: "History",
        },
      ],
    },
    {
      name: "Payment",
      icon: "Wallet",
      submenu: [
        {
          name: "Create Advance Bill",
          path: "/advance/create",
          icon: "FilePlus",
        },
        {
          name: "Advance History",
          path: "/advance/history",
          icon: "History",
        },
      ],
    },
    {
      name: "Staff",
      icon: "Users",
      submenu: [
        { name: "Create Staff ID", path: "/staff/create", icon: "UserPlus" },
        { name: "Staff List", path: "/staff/list", icon: "UsersIcon" },
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
