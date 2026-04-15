import { $t } from "@/plugins/i18n";
const Layout = () => import("@/layout/index.vue");

export default [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      title: $t("menus.pureLogin"),
      showLink: false
    }
  },
  // 全屏403（无权访问）页面
  {
    path: "/access-denied",
    name: "AccessDenied",
    component: () => import("@/views/error/403.vue"),
    meta: {
      title: $t("menus.pureAccessDenied"),
      showLink: false
    }
  },
  // 全屏500（服务器出错）页面
  {
    path: "/server-error",
    name: "ServerError",
    component: () => import("@/views/error/500.vue"),
    meta: {
      title: $t("menus.pureServerError"),
      showLink: false
    }
  },
  {
    path: "/redirect",
    component: Layout,
    meta: {
      title: $t("status.pureLoad"),
      showLink: false
    },
    children: [
      {
        path: "/redirect/:path(.*)",
        name: "Redirect",
        component: () => import("@/layout/redirect.vue")
      }
    ]
  },
  {
    path: "/account-settings",
    name: "AccountSettings",
    component: () => import("@/views/account-settings/index.vue"),
    meta: {
      title: $t("buttons.pureAccountSettings"),
      showLink: false
    }
  },
  {
    path: "/finance/owner-bill",
    component: Layout,
    meta: {
      title: "业主结算单",
      showLink: false
    },
    children: [
      {
        path: "",
        name: "OwnerSettlementBillEntry",
        component: () => import("@/views/finance/owner-bill/index.vue"),
        meta: {
          title: "业主结算单",
          showLink: false
        }
      }
    ]
  },
  {
    path: "/finance/owner-payable-bill",
    component: Layout,
    meta: {
      title: "包租应付单",
      showLink: false
    },
    children: [
      {
        path: "",
        name: "OwnerPayableBillEntry",
        component: () => import("@/views/finance/owner-payable-bill/index.vue"),
        meta: {
          title: "包租应付单",
          showLink: false
        }
      }
    ]
  },
  {
    path: "/finance/owner-withdraw",
    component: Layout,
    meta: {
      title: "业主提现",
      showLink: false
    },
    children: [
      {
        path: "",
        name: "OwnerWithdrawEntry",
        component: () => import("@/views/finance/owner-withdraw/index.vue"),
        meta: {
          title: "业主提现",
          showLink: false
        }
      }
    ]
  },
  // 下面是一个无layout菜单的例子（一个全屏空白页面），因为这种情况极少发生，所以只需要在前端配置即可（配置路径：src/router/modules/remaining.ts）
  {
    path: "/empty",
    name: "Empty",
    component: () => import("@/views/empty/index.vue"),
    meta: {
      title: $t("menus.pureEmpty"),
      showLink: false
    }
  }
] satisfies Array<RouteConfigsTable>;
