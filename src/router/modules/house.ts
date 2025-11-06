export default {
  path: "/house",
  name: "House",
  meta: {
    title: "房源管理",
    icon: "IF-icon-house",
    rank: 1,
    showLink: true
  },
  children: [
    {
      path: "/house/focus",
      name: "HouseFocus",
      meta: {
        title: "集中式",
        icon: "IF-icon-focus",
        showParent: true
      },
      children: [
        {
          path: "/house/focus/room/index",
          name: "HouseFocusRoom",
          component: () => import("@/views/house/focus/focusRoom/index.vue"),
          meta: {
            title: "房间列表",
            icon: "IF-icon-focus-rooms",
            showParent: true
          }
        },
        {
          path: "/house/focus/house/index",
          name: "HouseFocusHouse",
          component: () => import("@/views/house/focus/focusHouse/index.vue"),
          meta: {
            title: "项目列表",
            icon: "IF-icon-focus-project",
            showParent: true
          }
        }
      ]
    },
    {
      path: "/house/scatter",
      name: "HouseScatter",
      meta: {
        title: "整/合租",
        icon: "IF-icon-scatter",
        showParent: true
      },
      component: () => import("@/views/house/scatter/scatterRoom/index.vue")
    }
  ]
} satisfies RouteConfigsTable;
