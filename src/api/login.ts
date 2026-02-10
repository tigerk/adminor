import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";
import type { ApiResponse, PaginationResponse } from "@/types";

export type UserResult = {
  code: number;
  message: string;
  data: {
    /** 头像 */
    avatar: string;
    /** 用户名 */
    username: string;
    /** 昵称 */
    nickname: string;
    /** 当前登录用户的角色 */
    roles: Array<string>;
    /** 按钮级别权限 */
    permissions: Array<string>;
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: number;
    /** 当前公司 */
    curCompanyId: number;
    /** 公司列表 */
    companyList: Array<any>;
  };
};

export type RefreshTokenResult = {
  code: number;
  data: {
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: number;
    /** 当前公司 */
    curCompanyId: number;
  };
};

export type UserInfoProps = {
  /** 头像 */
  avatar: string;
  /** 用户名 */
  username: string;
  /** 昵称 */
  nickname: string;
  /** 邮箱 */
  email: string;
  /** 联系电话 */
  phone: string;
  /** 简介 */
  remark: string;
};

/** 登录 */
export const getLogin = (data?: object) => {
  return http.request<UserResult>("post", baseUrlApi("login"), { data });
};

/** 校验登录 */
export const verifyLogin = (data?: object) => {
  return http.request<UserResult>("post", baseUrlApi("auth/verify"), { data });
};

/** 刷新`token` */
export const refreshTokenApi = (data?: object) => {
  return http.request<RefreshTokenResult>("post", baseUrlApi("token/refresh"), { data });
};

export const switchCompany = (data?: object) => {
  return http.request<UserResult>("post", baseUrlApi("switchCompany"), { params: data });
};

export const sendSmsCode = (data?: object) => {
  return http.request<UserResult>("post", baseUrlApi("login/sms/send"), { params: data });
};

export const loginUpdate = (data?: object) => {
  return http.request<UserResult>("post", baseUrlApi("login/update"), { data });
};

export const sendAccountOldPhoneSms = () => {
  return http.request<ApiResponse>("post", baseUrlApi("account/phone/old/sms/send"));
};

export const sendAccountNewPhoneSms = (data?: { phone: string }) => {
  return http.request<ApiResponse>("post", baseUrlApi("account/phone/new/sms/send"), { data });
};

export const sendAccountEmailSms = (data?: { email: string }) => {
  return http.request<ApiResponse>("post", baseUrlApi("account/email/code/send"), { data });
};

export const updateAccountPassword = (data?: { oldPassword: string; newPassword: string }) => {
  return http.request<ApiResponse>("post", baseUrlApi("account/password/update"), { data });
};

export const updateAccountPhone = (data?: { oldVerifyCode: string; newPhone: string; newVerifyCode: string }) => {
  return http.request<ApiResponse>("post", baseUrlApi("account/phone/update"), { data });
};

export const updateAccountEmail = (data?: { email: string; verifyCode: string }) => {
  return http.request<ApiResponse>("post", baseUrlApi("account/email/update"), { data });
};

/** 获取当前账户的个人信息 */
export const getUserProfile = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("login/profile/get"), { data });
};

/** 更新当前账户的个人信息 */
export const updateUserProfile = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("login/profile/update"), { data });
};

/** 账户设置-个人安全日志 */
export const getMineLogs = (data?: object) => {
  return http.request<ApiResponse<PaginationResponse>>("get", "/mine-logs", { data });
};
