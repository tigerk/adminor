import { type RouterHistory, type RouteRecordRaw, type RouteComponent, createWebHistory, createWebHashHistory } from "vue-router";
import { router } from "./index";
import { isProxy, toRaw } from "vue";
import { useTimeoutFn } from "@vueuse/core";
import { isString, cloneDeep, isAllEmpty, intersection, storageLocal, isIncludeAllChildren } from "@pureadmin/utils";
import { getConfig } from "@/config";
import { buildHierarchyTree } from "@/utils/tree";
import { userKey, type DataInfo } from "@/utils/auth";
import { type menuType, routerArrays } from "@/layout/types";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { usePermissionStoreHook } from "@/store/modules/permission";

const IFrame = () => import("@/layout/frame.vue");
// https://cn.vitejs.dev/guide/features.html#glob-import
const modulesRoutes = import.meta.glob("/src/views/**/*.{vue,tsx}");

// 动态路由
import { getAsyncRoutes } from "@/api/routes";

function handRank(routeInfo: any) {
  const { name, path, parentId, meta } = routeInfo;
  return isAllEmpty(parentId) ? !!(isAllEmpty(meta?.rank) || (meta?.rank === 0 && name !== "Home" && path !== "/")) : false;
}

/** 按照路由中meta下的rank等级升序来排序路由 */
function ascending(arr: any[]) {
  arr.forEach((v, index) => {
    // 当rank不存在时，根据顺序自动创建，首页路由永远在第一位
    if (handRank(v)) v.meta.rank = index + 2;
  });
  return arr.sort((a: { meta: { rank: number } }, b: { meta: { rank: number } }) => {
    return a?.meta.rank - b?.meta.rank;
  });
}

/** 过滤meta中showLink为false的菜单 */
function filterTree(data: RouteComponent[]) {
  const newTree = cloneDeep(data).filter((v: { meta: { showLink: boolean } }) => v.meta?.showLink !== false);
  newTree.forEach((v: { children }) => v.children && (v.children = filterTree(v.children)));
  return newTree;
}

/** 过滤children长度为0的的目录，当目录下没有菜单时，会过滤此目录，目录没有赋予roles权限，当目录下只要有一个菜单有显示权限，那么此目录就会显示 */
function filterChildrenTree(data: RouteComponent[]) {
  const newTree = cloneDeep(data).filter((v: any) => v?.children?.length !== 0);
  newTree.forEach((v: { children }) => v.children && (v.children = filterTree(v.children)));
  return newTree;
}

/** 判断两个数组彼此是否存在相同值 */
function isOneOfArray(a: Array<string>, b: Array<string>) {
  return Array.isArray(a) && Array.isArray(b) ? (intersection(a, b).length > 0 ? true : false) : true;
}

/** 从localStorage里取出当前登录用户的角色roles，过滤无权限的菜单 */
function filterNoPermissionTree(data: RouteComponent[]) {
  const currentRoles = storageLocal().getItem<DataInfo<number>>(userKey)?.roles ?? [];
  const newTree = cloneDeep(data).filter((v: any) => isOneOfArray(v.meta?.roles, currentRoles));
  newTree.forEach((v: any) => v.children && (v.children = filterNoPermissionTree(v.children)));
  return filterChildrenTree(newTree);
}

/** 通过指定 `key` 获取父级路径集合，默认 `key` 为 `path` */
function getParentPaths(value: string, routes: RouteRecordRaw[], key = "path") {
  // 深度遍历查找
  function dfs(routes: RouteRecordRaw[], value: string, parents: string[]) {
    for (const element of routes) {
      const item = element;
      // 返回父级path
      if (item[key] === value) return parents;
      // children不存在或为空则不递归
      if (!item.children?.length) continue;
      // 往下查找时将当前path入栈
      parents.push(item.path);

      if (dfs(item.children, value, parents).length) return parents;
      // 深度遍历查找未找到时当前path 出栈
      parents.pop();
    }
    // 未找到时返回空数组
    return [];
  }

  return dfs(routes, value, []);
}

/** 查找对应 `path` 的路由信息 */
function findRouteByPath(path: string, routes: RouteRecordRaw[]) {
  let res = routes.find((item: { path: string }) => item.path == path);
  if (res) {
    return isProxy(res) ? toRaw(res) : res;
  } else {
    for (const element of routes) {
      if (element.children instanceof Array && element.children.length > 0) {
        res = findRouteByPath(path, element.children);
        if (res) {
          return isProxy(res) ? toRaw(res) : res;
        }
      }
    }
    return null;
  }
}

function addPathMatch() {
  if (!router.hasRoute("pathMatch")) {
    router.addRoute({
      path: "/:pathMatch(.*)",
      name: "pathMatch",
      redirect: "/error/404"
    });
  }
}

/** 处理动态路由（后端返回的路由） */
function handleAsyncRoutes(routeList) {
  if (routeList.length === 0) {
    usePermissionStoreHook().handleWholeMenus(routeList);
  } else {
    formatFlatteningRoutes(addAsyncRoutes(routeList)).map((v: RouteRecordRaw) => {
      // 防止重复添加路由
      if (router.options.routes[0].children.findIndex(value => value.path === v.path) !== -1) {
        return;
      } else {
        // 切记将路由push到routes后还需要使用addRoute，这样路由才能正常跳转
        router.options.routes[0].children.push(v);
        // 最终路由进行升序
        ascending(router.options.routes[0].children);
        if (!router.hasRoute(v?.name)) router.addRoute(v);
        const flattenRouters: any = router.getRoutes().find(n => n.path === "/");
        // 保持router.options.routes[0].children与path为"/"的children一致，防止数据不一致导致异常
        flattenRouters.children = router.options.routes[0].children;
        router.addRoute(flattenRouters);
      }
    });
    usePermissionStoreHook().handleWholeMenus(routeList);
  }
  if (!useMultiTagsStoreHook().getMultiTagsCache) {
    useMultiTagsStoreHook().handleTags("equal", [...routerArrays, ...usePermissionStoreHook().flatteningRoutes.filter(v => v?.meta?.fixedTag)]);
  }
  addPathMatch();
}

/** 初始化路由（`new Promise` 写法防止在异步请求中造成无限循环）*/
function initRouter() {
  if (getConfig()?.CachingAsyncRoutes) {
    // 开启动态路由缓存本地localStorage
    const key = "async-routes";
    const asyncRouteList = storageLocal().getItem(key) as any;
    if (asyncRouteList && asyncRouteList?.length > 0) {
      return new Promise(resolve => {
        handleAsyncRoutes(asyncRouteList);
        resolve(router);
      });
    } else {
      return new Promise(resolve => {
        getAsyncRoutes().then(resp => {
          handleAsyncRoutes(cloneDeep(resp.data));
          storageLocal().setItem(key, resp.data);
          resolve(router);
        });
      });
    }
  } else {
    return new Promise(resolve => {
      getAsyncRoutes().then(resp => {
        handleAsyncRoutes(cloneDeep(resp.data));
        resolve(router);
      });
    });
  }
}

/**
 * 将多级嵌套路由处理成一维数组
 * @param routesList 传入路由
 * @returns 返回处理后的一维路由
 */
function formatFlatteningRoutes(routesList: RouteRecordRaw[]) {
  if (routesList.length === 0) return routesList;
  let hierarchyList = buildHierarchyTree(routesList);
  for (let i = 0; i < hierarchyList.length; i++) {
    if (hierarchyList[i].children) {
      hierarchyList = hierarchyList.slice(0, i + 1).concat(hierarchyList[i].children, hierarchyList.slice(i + 1));
    }
  }
  return hierarchyList;
}

/**
 * 一维数组处理成多级嵌套数组（三级及以上的路由全部拍成二级，keep-alive 只支持到二级缓存）
 * https://github.com/pure-admin/vue-pure-admin/issues/67
 * @param routesList 处理后的一维路由菜单数组
 * @returns 返回将一维数组重新处理成规定路由的格式
 */
function formatTwoStageRoutes(routesList: RouteRecordRaw[]) {
  if (routesList.length === 0) return routesList;
  const newRoutesList: RouteRecordRaw[] = [];
  routesList.forEach((v: RouteRecordRaw) => {
    if (v.path === "/") {
      newRoutesList.push({
        component: v.component,
        name: v.name,
        path: v.path,
        redirect: v.redirect,
        meta: v.meta,
        children: []
      });
    } else {
      newRoutesList[0]?.children.push({ ...v });
    }
  });
  return newRoutesList;
}

/** 处理缓存路由（添加、删除、刷新） */
function handleAliveRoute({ name }: ToRouteType, mode?: string) {
  switch (mode) {
    case "add":
      usePermissionStoreHook().cacheOperate({
        mode: "add",
        name
      });
      break;
    case "delete":
      usePermissionStoreHook().cacheOperate({
        mode: "delete",
        name
      });
      break;
    case "refresh":
      usePermissionStoreHook().cacheOperate({
        mode: "refresh",
        name
      });
      break;
    default:
      usePermissionStoreHook().cacheOperate({
        mode: "delete",
        name
      });
      useTimeoutFn(() => {
        usePermissionStoreHook().cacheOperate({
          mode: "add",
          name
        });
      }, 100);
  }
}

/**
 * 类型守卫：检查是否为字符串类型的组件路径
 */
function isStringComponent(component: any): component is string {
  return typeof component === "string";
}

/**
 * 类型守卫：检查是否已经是函数组件
 */
function isFunctionComponent(component: any): component is Function {
  return typeof component === "function";
}

/** 过滤后端传来的动态路由 重新生成规范路由 */
function addAsyncRoutes(arrRoutes: Array<RouteRecordRaw>) {
  if (!arrRoutes || !arrRoutes.length) return;
  const modulesRoutesKeys = Object.keys(modulesRoutes);

  arrRoutes.forEach((v: RouteRecordRaw) => {
    // 将backstage属性加入meta，标识此路由为后端返回路由
    v.meta.backstage = true;

    // 父级的redirect属性取值
    if (v?.children && v.children.length && !v.redirect) {
      v.redirect = v.children[0].path;
    }

    // 父级的name属性取值
    if (v?.children && v.children.length && !v.name) {
      v.name = (v.children[0].name as string) + "Parent";
    }

    // ========== 核心：判断是否需要加载组件 ==========

    // 情况1：iframe 类型
    if (v.meta?.frameSrc) {
      v.component = IFrame;
    }
    // 情况2：纯目录节点（有子节点且没有 component）
    else if (v?.children && v.children.length > 0 && !v.component) {
      // 不设置 component，这样点击时不会加载组件，只展开子菜单
      console.log(`📁 目录节点（无组件）: ${v.path}`);
    }
    // 情况3：叶子节点或明确需要加载组件的节点
    else if (v.component || !v.children || v.children.length === 0) {
      // 提取组件路径字符串（兼容 string | RouteComponent）
      let componentPath = "";

      if (isStringComponent(v.component)) {
        // 后端返回的字符串路径
        componentPath = v.component;
      } else if (isFunctionComponent(v.component)) {
        // 已经是函数组件，无需处理
        console.log(`🔧 组件已是函数: ${v.path}`);
        return; // 跳过此路由
      } else if (!v.component) {
        // 使用 path 推断
        componentPath = v.path;
      }

      if (componentPath) {
        const matchedComponent = findMatchingComponent(componentPath, modulesRoutesKeys);

        if (matchedComponent) {
          v.component = modulesRoutes[matchedComponent];
          console.log(`✅ 组件加载: ${v.path} -> ${matchedComponent}`);
        } else {
          console.warn(`⚠️ 未找到组件: ${v.path}，componentPath: ${componentPath}`);
        }
      }
    }

    // 递归处理子路由
    if (v?.children && v.children.length) {
      addAsyncRoutes(v.children);
    }
  });

  return arrRoutes;
}

/**
 * 精确查找匹配的组件路径
 * @param componentOrPath - 组件路径或路由路径
 * @param availableKeys - 可用的组件模块键列表
 */
function findMatchingComponent(componentOrPath: string, availableKeys: string[]): string | null {
  if (!componentOrPath) return null;

  // 清理路径：移除开头的斜杠
  const cleanPath = componentOrPath.replace(/^\//, "");

  // 策略1：精确匹配（最优先）
  const exactMatch = availableKeys.find(key => {
    const modulePath = extractModulePath(key);
    return modulePath === cleanPath || modulePath === `${cleanPath}/index` || modulePath.replace(/\/index$/, "") === cleanPath;
  });

  if (exactMatch) {
    return exactMatch;
  }

  // 策略2：路径末尾匹配（次优先）
  const endMatch = availableKeys.find(key => {
    const modulePath = extractModulePath(key);
    return key.endsWith(`${cleanPath}.vue`) || key.endsWith(`${cleanPath}.tsx`) || key.endsWith(`${cleanPath}/index.vue`) || key.endsWith(`${cleanPath}/index.tsx`);
  });

  if (endMatch) {
    console.warn(`⚠️ 使用末尾匹配: ${cleanPath} -> ${endMatch}`);
    return endMatch;
  }

  // 策略3：最短路径匹配（降级方案，谨慎使用）
  const candidates = availableKeys.filter(key => key.includes(cleanPath.split("/").pop() || ""));

  if (candidates.length === 1) {
    console.warn(`⚠️ 使用模糊匹配: ${cleanPath} -> ${candidates[0]}`);
    return candidates[0];
  }

  if (candidates.length > 1) {
    console.error(`❌ 多个候选组件匹配 ${cleanPath}:`, candidates);
  }

  return null;
}

/**
 * 从模块完整路径中提取相对路径
 * @example
 * "/src/views/system/dict/index.vue" -> "system/dict/index"
 */
function extractModulePath(fullPath: string): string {
  return fullPath
    .replace(/^\/src\/views\//, "") // 移除前缀
    .replace(/\.(vue|tsx)$/, ""); // 移除扩展名
}

/** 获取路由历史模式 https://next.router.vuejs.org/zh/guide/essentials/history-mode.html */
function getHistoryMode(routerHistory): RouterHistory {
  // len为1 代表只有历史模式 为2 代表历史模式中存在base参数 https://next.router.vuejs.org/zh/api/#%E5%8F%82%E6%95%B0-1
  const historyMode = routerHistory.split(",");
  const leftMode = historyMode[0];
  const rightMode = historyMode[1];
  // no param
  if (historyMode.length === 1) {
    if (leftMode === "hash") {
      return createWebHashHistory("");
    } else if (leftMode === "h5") {
      return createWebHistory("");
    }
  } //has param
  else if (historyMode.length === 2) {
    if (leftMode === "hash") {
      return createWebHashHistory(rightMode);
    } else if (leftMode === "h5") {
      return createWebHistory(rightMode);
    }
  }
}

/** 获取当前页面按钮级别的权限 */
function getAuths(): Array<string> {
  return router.currentRoute.value.meta.auths as Array<string>;
}

/** 是否有按钮级别的权限（根据路由`meta`中的`auths`字段进行判断）*/
function hasAuth(value: string | Array<string>): boolean {
  if (!value) return false;
  /** 从当前路由的`meta`字段里获取按钮级别的所有自定义`code`值 */
  const metaAuths = getAuths();
  if (!metaAuths) return false;
  const isAuths = isString(value) ? metaAuths.includes(value) : isIncludeAllChildren(value, metaAuths);
  return isAuths ? true : false;
}

function handleTopMenu(route) {
  if (route?.children && route.children.length > 1) {
    if (route.redirect) {
      return route.children.filter(cur => cur.path === route.redirect)[0];
    } else {
      return route.children[0];
    }
  } else {
    return route;
  }
}

/** 获取所有菜单中的第一个菜单（顶级菜单）*/
function getTopMenu(tag = false): menuType {
  const topMenu = handleTopMenu(usePermissionStoreHook().wholeMenus[0]?.children[0]);
  tag && useMultiTagsStoreHook().handleTags("push", topMenu);
  return topMenu;
}

export {
  hasAuth,
  getAuths,
  ascending,
  filterTree,
  initRouter,
  getTopMenu,
  addPathMatch,
  isOneOfArray,
  getHistoryMode,
  addAsyncRoutes,
  getParentPaths,
  findRouteByPath,
  handleAliveRoute,
  formatTwoStageRoutes,
  formatFlatteningRoutes,
  filterNoPermissionTree
};
