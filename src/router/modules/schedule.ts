import { $t } from "@/plugins/i18n";
import { schedule } from "@/router/enums";

export default {
  path: "/schedule",
  redirect: "/schedule/index",
  meta: {
    icon: "ri/calendar-todo-line",
    title: $t("menus.pureSchedule"),
    rank: schedule
  },
  children: [
    {
      path: "/schedule/index",
      name: "Schedule",
      component: () => import("@/views/schedule/index.vue"),
      meta: {
        title: $t("menus.pureSchedule"),
        extraIcon: "IF-pure-iconfont-new svg"
      }
    }
  ]
} satisfies RouteConfigsTable;
