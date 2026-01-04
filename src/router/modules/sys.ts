export default {
  path: "/sys",
  name: "Sys",
  meta: {
    title: "系统管理",
    icon: "IF-icon-house",
    sortOrder: 1,
    showLink: true
  },
  children: [
    {
      path: "/sys/user/index",
      component: () => import("@/views/sys/user/index.vue"),
      name: "SysUser",
      meta: {
        title: "用户管理",
        icon: "IF-icon-focus",
        showParent: true
      }
    },
    {
      path: "/sys/role/index",
      name: "SysRole",
      component: () => import("@/views/sys/role/index.vue"),
      meta: {
        title: "角色管理",
        icon: "IF-icon-role",
        showParent: true
      }
    },
    {
      path: "/sys/dept/index",
      name: "SysDept",
      component: () => import("@/views/sys/dept/index.vue"),
      meta: {
        title: "部门管理",
        icon: "IF-icon-dept",
        showParent: true
      }
    },
    {
      path: "/sys/dict/index",
      name: "SysDict",
      component: () => import("@/views/sys/dict/index.vue"),
      meta: {
        title: "字典管理",
        icon: "IF-icon-dict",
        showParent: true
      }
    }
  ]
} satisfies RouteConfigsTable;
