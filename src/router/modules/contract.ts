export default {
  path: "/contract",
  redirect: "/contract/index",
  name: "contract",
  meta: {
    icon: "ep/set-up",
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
        showParent: true
      }
    },
    {
      path: "/contract/landlord",
      name: "contractLandlord",
      meta: {
        title: "业主合同",
        showParent: true
      }
    },
    {
      path: "/contract/booking",
      name: "contractBooking",
      meta: {
        title: "租客预定",
        showParent: true
      }
    },
    {
      path: "/contract/setup",
      name: "contractSetup",
      meta: {
        title: "合同设置",
        showParent: true
      }
    }
  ]
} satisfies RouteConfigsTable;
