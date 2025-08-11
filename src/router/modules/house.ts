export default {
  path: "/house",
  redirect: "/house/index",
  name: "House",
  meta: {
    icon: "ep/set-up",
    title: "房源管理",
    rank: 1,
    showLink: true
  },
  children: [
    {
      path: "/house/focus",
      name: "HouseFocus",
      meta: {
        title: "集中式",
        showParent: true
      },
      children: [
        {
          path: "/house/focus/room/index",
          name: "HouseFocusRoom",
          component: () => import("@/views/house/focus/focusRoom/index.vue"),
          meta: {
            title: "房间列表",
            showParent: true
          }
        },
        {
          path: "/house/focus/house/index",
          name: "HouseFocusHouse",
          component: () => import("@/views/house/focus/focusHouse/index.vue"),
          meta: {
            title: "项目列表",
            showParent: true
          }
        }
      ]
    }
  ]
} satisfies RouteConfigsTable;
