// 模拟后端动态生成路由
import { defineFakeRoute } from "vite-plugin-fake-server/client";

/**
 * roles：页面级别权限，这里模拟二种 "admin"、"common"
 * admin：管理员角色
 * common：普通角色
 */

const houseRouter = {
  path: "/house",
  name: "House",
  component: null,
  meta: {
    title: "房源管理",
    icon: "ep:house",
    showLink: true,
    showParent: true,
    sortOrder: 1,
    roles: null,
    auths: [""],
    keepAlive: false,
    frameSrc: "",
    frameLoading: true
  },
  children: [
    {
      path: "/house/focus",
      name: "HouseFocus",
      redirect: null,
      component: null,

      meta: {
        title: "集中式",
        icon: "ri:building-line",
        showLink: true,
        showParent: false,
        roles: null,
        auths: [""],
        keepAlive: false,
        frameSrc: "",
        frameLoading: true
      },
      children: [
        {
          path: "/house/focus/room",
          name: "HouseFocusRoom",
          redirect: null,
          component: "/house/focus/focusRoom/index",

          meta: {
            title: "房间列表",
            icon: "ri:door-closed-line",
            showLink: true,
            showParent: true,
            roles: null,
            auths: [""],
            keepAlive: false,
            frameSrc: "",
            frameLoading: true
          },
          children: []
        },
        {
          path: "/house/focus/house",
          name: "HouseFocusHouse",
          redirect: null,
          component: "/house/focus/focusHouse/index",

          meta: {
            title: "项目列表",
            icon: "ri:profile-line",
            showLink: true,
            showParent: true,
            roles: null,
            auths: [""],
            keepAlive: false,
            frameSrc: "",
            frameLoading: true
          },
          children: []
        }
      ]
    },
    {
      path: "/house/scatter",
      name: "HouseScatter",
      component: "/house/scatter/scatterRoom/index",
      meta: {
        title: "整/合租",
        icon: "IF-icon-scatter",
        showParent: true
      }
    }
  ]
};

const sysRouter = {
  path: "/sys",
  name: "Sys",
  redirect: null,
  component: null,
  type: 0,
  meta: {
    title: "系统管理",
    icon: "ri:settings-3-line",
    showLink: true,
    showParent: false,
    // sortOrder: null,
    roles: null,
    auths: [""],
    keepAlive: false,
    frameSrc: "",
    frameLoading: true
  },
  children: [
    {
      path: "/sys/user/index",
      name: "SysUser",
      redirect: null,
      component: null,
      type: 0,
      meta: {
        title: "用户管理",
        icon: "ri:admin-line",
        showLink: true,
        showParent: true,
        // sortOrder: null,
        roles: null,
        auths: [""],
        keepAlive: false,
        frameSrc: "",
        frameLoading: true
      },
      children: []
    },
    {
      path: "/sys/role/index",
      name: "SysRole",
      redirect: null,
      component: null,
      type: 0,
      meta: {
        title: "角色管理",
        icon: "ri:admin-fill",
        showLink: true,
        showParent: true,
        // sortOrder: null,
        roles: null,
        auths: [""],
        keepAlive: false,
        frameSrc: "",
        frameLoading: true
      },
      children: []
    },
    {
      path: "/sys/dept/index",
      name: "SysDept",
      redirect: null,
      component: null,
      type: 0,
      meta: {
        title: "部门管理",
        icon: "ri:git-branch-line",
        showLink: true,
        showParent: true,
        // sortOrder: null,
        roles: null,
        auths: [""],
        keepAlive: false,
        frameSrc: "",
        frameLoading: true
      },
      children: []
    },
    {
      path: "/sys/dict/index",
      name: "SysDict",
      redirect: null,
      component: null,
      type: 0,
      meta: {
        title: "字典管理",
        icon: "ri:book-2-line",
        showLink: true,
        showParent: true,
        // sortOrder: null,
        roles: null,
        auths: [""],
        keepAlive: false,
        frameSrc: "",
        frameLoading: true
      },
      children: []
    }
  ]
};

const monitorRouter = {
  path: "/monitor",
  name: "SysMonitor",
  redirect: null,
  component: null,

  meta: {
    title: "menus.pureSysMonitor",
    icon: "ep:monitor",
    showLink: true,
    showParent: true,
    sortOrder: 99,
    roles: null,
    auths: [""],
    keepAlive: false,
    frameSrc: "",
    frameLoading: true
  },
  children: [
    {
      path: "/monitor/online-user",
      name: "OnlineUser",
      redirect: null,
      component: "monitor/online/index",

      meta: {
        title: "menus.pureOnlineUser",
        icon: "ri:user-voice-line",
        sortOrder: 99,
        showLink: true,
        showParent: true,
        roles: null,
        auths: [""],
        keepAlive: false,
        frameSrc: "",
        frameLoading: true
      },
      children: []
    },
    {
      path: "/monitor/login-logs",
      name: "LoginLog",
      redirect: null,
      component: "monitor/logs/login/index",

      meta: {
        title: "menus.pureLoginLog",
        icon: "ri:window-line",
        showLink: true,
        sortOrder: 99,
        showParent: true,
        roles: null,
        auths: [""],
        keepAlive: false,
        frameSrc: "",
        frameLoading: true
      },
      children: []
    },
    {
      path: "/monitor/operation-logs",
      name: "OperationLog",
      redirect: null,
      component: "monitor/logs/operation/index",

      meta: {
        title: "menus.pureOperationLog",
        icon: "ri:history-fill",
        showLink: true,
        sortOrder: 99,
        showParent: true,
        roles: null,
        auths: [""],
        keepAlive: false,
        frameSrc: "",
        frameLoading: true
      },
      children: []
    }
  ]
};

export default defineFakeRoute([
  {
    url: "/saas/get-async-routes",
    method: "get",
    response: () => {
      return {
        code: 0,
        msg: "success",
        data: [houseRouter, sysRouter, monitorRouter]
      };
    }
  }
]);
