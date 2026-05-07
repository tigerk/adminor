import { defineStore } from "pinia";
import { type userType, store, router, resetRouter, routerArrays } from "../utils";
import { type UserResult, type RefreshTokenResult, getLogin, refreshTokenApi } from "@/api/login";
import { useMultiTagsStoreHook } from "./multiTags";
import { getUserInfo, setToken, removeToken, setUserInfo } from "@/utils/auth";
import { message } from "@/utils/message";

export const useUserStore = defineStore("pure-user", {
  state: (): userType => {
    const userInfo = getUserInfo();
    return {
      // 头像
      avatar: userInfo?.avatar ?? "",
      // 用户名
      username: userInfo?.username ?? "",
      // 昵称
      nickname: userInfo?.nickname ?? "",
      // 页面级别权限
      roles: userInfo?.roles ?? [],
      // 按钮级别权限
      permissions: userInfo?.permissions ?? [],
      // 前端生成的验证码（按实际需求替换）
      verifyCode: "",
      // 判断登录页面显示哪个组件（0：登录（默认）、1：手机登录、2：二维码登录、3：注册、4：忘记密码）
      currentPage: 0,
      // 是否勾选了登录页的免登录
      isRemembered: false,
      // 登录页的免登录存储几天，默认7天
      loginDay: 7,
      // 当前公司
      curCompanyId: userInfo?.curCompanyId ?? 0,
      // 用户关联的公司列表
      companyList: userInfo?.companyList ?? []
    };
  },
  actions: {
    /** 存储头像 */
    SET_AVATAR(avatar: string) {
      this.avatar = avatar;
      // 同步当前标签页会话，刷新页面后仍保持最新资料。
      setUserInfo({ avatar });
    },
    /** 存储用户名 */
    SET_USERNAME(username: string) {
      this.username = username;
      setUserInfo({ username });
    },
    /** 存储昵称 */
    SET_NICKNAME(nickname: string) {
      this.nickname = nickname;
      setUserInfo({ nickname });
    },
    /** 存储角色 */
    SET_ROLES(roles: Array<string>) {
      this.roles = roles;
    },
    /** 存储按钮级别权限 */
    SET_PERMS(permissions: Array<string>) {
      this.permissions = permissions;
    },
    /** 存储前端生成的验证码 */
    SET_VERIFYCODE(verifyCode: string) {
      this.verifyCode = verifyCode;
    },
    /** 存储登录页面显示哪个组件 */
    SET_CURRENTPAGE(value: number) {
      this.currentPage = value;
    },
    /** 存储是否勾选了登录页的免登录 */
    SET_ISREMEMBERED(bool: boolean) {
      this.isRemembered = bool;
    },
    /** 设置登录页的免登录存储几天 */
    SET_LOGINDAY(value: number) {
      this.loginDay = Number(value);
    },
    /** 存储头像 */
    SET_CUR_COMPANY_ID(curCompanyId: number) {
      this.curCompanyId = curCompanyId;
    },
    SET_COMPANY_LIST(companyList: any) {
      this.companyList = companyList;
    },
    /** 登入 */
    async loginByUsername(data) {
      return new Promise<UserResult>((resolve, reject) => {
        getLogin(data)
          .then(data => {
            if (data?.code === 0) {
              setToken(data.data);
            }
            resolve(data);
          })
          .catch(error => {
            message("登录失败，请稍后再试！", { type: "error" });
            reject(error);
          });
      });
    },
    /** 前端登出（不调用接口） */
    logOut() {
      this.username = "";
      this.roles = [];
      this.permissions = [];
      removeToken();
      useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
      resetRouter();
      router.push("/login");
    },
    /** 刷新`token` */
    async handRefreshToken(data) {
      return new Promise<RefreshTokenResult>((resolve, reject) => {
        refreshTokenApi(data)
          .then(data => {
            if (data) {
              setToken(data.data);
              resolve(data);
            }
          })
          .catch(error => {
            reject(error);
          });
      });
    }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}
