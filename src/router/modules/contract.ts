export default {
  path: "/contract",
  redirect: "/contract/index",
  name: "contract",
  meta: {
    icon: "IF-icon-contract",
    title: "合同管理",
    rank: 2,
    showLink: true
  },
  children: [
    {
      path: "/contract/tenant",
      name: "contractTenant",
      component: () => import("@/views/contract/tenant/index.vue"),
      meta: {
        title: "租客合同",
        icon: "IF-icon-tenant",
        showParent: true
      }
    },
    {
      path: "/contract/landlord",
      name: "contractLandlord",
      component: () => import("@/views/contract/landlord/index.vue"),
      meta: {
        title: "业主合同",
        icon: "IF-icon-landlord",
        showParent: true
      }
    },
    {
      path: "/contract/booking",
      name: "contractBooking",
      component: () => import("@/views/contract/booking/index.vue"),
      meta: {
        title: "租客预定",
        icon: "IF-icon-booking",
        showParent: true
      }
    },
    {
      path: "/contract/settings",
      name: "contractSettings",
      component: () => import("@/views/contract/settings/index.vue"),
      meta: {
        title: "合同设置",
        icon: "IF-icon-contract-setting",
        showParent: true
      }
    }
  ]
} satisfies RouteConfigsTable;
