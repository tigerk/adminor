import { useUserStoreHook } from "@/store/modules/user";
import { isIncludeAllChildren, isString } from "@pureadmin/utils";
import { useLockStoreHook } from "@/store/modules/lock";

/** 定义有效时长 */
export const ACTIVE_TIMEOUT = 1800000;

/** 封装一个专门更新过期时间的方法 */
export function updateExpires() {
  const data = getToken();
  if (data) {
    data.expires = Date.now() + ACTIVE_TIMEOUT;
    setToken(data);

    // 重置锁屏定时器
    const lockStore = useLockStoreHook();
    lockStore.resetLockTimer();
  }
}

export interface DataInfo<T> {
  /** token */
  accessToken: string;
  /** `accessToken`的过期时间（时间戳） */
  expires: T;
  /** 用于调用刷新accessToken的接口时所需的token */
  refreshToken: string;
  /** 头像 */
  avatar?: string;
  /** 用户名 */
  username?: string;
  /** 昵称 */
  nickname?: string;
  /** 当前登录用户的角色 */
  roles?: Array<string>;
  /** 当前登录用户的按钮级别权限 */
  permissions?: Array<string>;
  curCompanyId: number;
  companyList?: Array<any>;
}

export const userKey = "user-info";
export const TokenKey = "saas-token";
/**
 * 当前标签页登录会话标记。
 * 登录态只保存在 sessionStorage 中，刷新页面保留，关闭标签页或浏览器后自动失效。
 * */
export const multipleTabsKey = "multiple-tabs";

function getSessionItem<T>(key: string): T | null {
  const value = window.sessionStorage.getItem(key);
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

function setSessionItem<T>(key: string, value: T) {
  window.sessionStorage.setItem(key, JSON.stringify(value));
}

/** 获取当前标签页会话中的用户信息 */
export function getUserInfo(): DataInfo<number> | null {
  return getSessionItem<DataInfo<number>>(userKey);
}

/** 更新当前标签页会话中的用户信息 */
export function setUserInfo(data: Partial<DataInfo<number>>) {
  const current = getUserInfo();
  if (!current) return;
  setSessionItem(userKey, { ...current, ...data });
}

/** 判断当前标签页是否存在有效登录会话 */
export function hasLoginSession() {
  return window.sessionStorage.getItem(multipleTabsKey) === "true" && !!getUserInfo();
}

/** 获取当前标签页会话中的 token */
export function getToken(): DataInfo<number> | null {
  return getSessionItem<DataInfo<number>>(TokenKey) || getUserInfo();
}

/**
 * @description 设置`token`以及一些必要信息并采用无感刷新`token`方案
 * 无感刷新：后端返回`accessToken`（访问接口使用的`token`）、`refreshToken`（用于调用刷新`accessToken`的接口时所需的`token`，`refreshToken`的过期时间（比如30天）应大于`accessToken`的过期时间（比如2小时））、`expires`（`accessToken`的过期时间）
 * 将`accessToken`、`expires`、`refreshToken`和用户信息保存到 sessionStorage。
 * sessionStorage 会在标签页或浏览器关闭后自动清空，避免下次打开页面复用上一位用户登录态。
 */
export function setToken(data: DataInfo<number>) {
  let expires = 0;
  const { accessToken, refreshToken } = data;
  expires = data.expires; // 如果后端直接设置时间戳，将此处代码改为expires = data.expires，然后把上面的DataInfo<Date>改成DataInfo<number>即可
  const tokenInfo = { accessToken, expires, refreshToken };

  setSessionItem(TokenKey, tokenInfo);
  setSessionItem(multipleTabsKey, true);

  function setUserKey({ avatar, username, nickname, roles, permissions, curCompanyId, companyList }) {
    useUserStoreHook().SET_AVATAR(avatar);
    useUserStoreHook().SET_USERNAME(username);
    useUserStoreHook().SET_NICKNAME(nickname);
    useUserStoreHook().SET_ROLES(roles);
    useUserStoreHook().SET_PERMS(permissions);
    useUserStoreHook().SET_CUR_COMPANY_ID(curCompanyId);
    useUserStoreHook().SET_COMPANY_LIST(companyList);
    setSessionItem(userKey, {
      refreshToken,
      expires,
      avatar,
      username,
      nickname,
      roles,
      permissions,
      curCompanyId,
      companyList
    });
  }

  if (data.username && data.roles) {
    const { username, roles } = data;
    setUserKey({
      avatar: data?.avatar ?? "",
      username,
      nickname: data?.nickname ?? "",
      roles,
      permissions: data?.permissions ?? [],
      curCompanyId: data?.curCompanyId ?? 0,
      companyList: data?.companyList ?? []
    });
  } else {
    const userInfo = getUserInfo();
    const avatar = userInfo?.avatar ?? "";
    const username = userInfo?.username ?? "";
    const nickname = userInfo?.nickname ?? "";
    const roles = userInfo?.roles ?? [];
    const permissions = userInfo?.permissions ?? [];
    const curCompanyId = userInfo?.curCompanyId ?? 0;
    const companyList = userInfo?.companyList ?? [];
    setUserKey({
      avatar,
      username,
      nickname,
      roles,
      permissions,
      curCompanyId,
      companyList
    });
  }
}

/** 删除 token 和当前标签页登录会话 */
export function removeToken() {
  window.sessionStorage.removeItem(TokenKey);
  window.sessionStorage.removeItem(multipleTabsKey);
  window.sessionStorage.removeItem(userKey);
}

/** 格式化token（jwt格式） */
export const formatToken = (token: string): string => {
  return token;
};

/** 是否有按钮级别的权限（根据登录接口返回的`permissions`字段进行判断）*/
export const hasPerms = (value: string | Array<string>): boolean => {
  if (!value) return false;
  const allPerms = "*:*:*";
  const { permissions } = useUserStoreHook();
  if (!permissions) return false;
  if (permissions.length === 1 && permissions[0] === allPerms) return true;
  const isAuths = isString(value) ? permissions.includes(value) : isIncludeAllChildren(value, permissions);
  return isAuths ? true : false;
};
