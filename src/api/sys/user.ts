import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { ApiResponse } from "@/types";

type Result = {
  code: number;
  message: string;
  data?: Array<any>;
};

type ResultTable = {
  code: number;
  message: string;
  data?: {
    /** 列表数据 */
    list: Array<any>;
    /** 总条目数 */
    total?: number;
    /** 每页显示条目个数 */
    pageSize?: number;
    /** 当前页数 */
    currentPage?: number;
  };
};

/** 获取系统管理-用户管理列表 */
export const pageUserList = (data?: object) => {
  return http.request<ResultTable>("post", baseUrlApi("company/user/list"), { data });
};

export const createUser = (data?: object) => {
  return http.request<Result>("post", baseUrlApi("company/user/create"), { data });
};

export const deleteUser = (data?: object) => {
  return http.request<Result>("post", baseUrlApi("company/user/delete"), { data });
};

export const updateUserStatus = (data?: object) => {
  return http.request<Result>("post", baseUrlApi("company/user/updateStatus"), { data });
};

/** 系统管理-用户管理-获取所有角色列表 */
export const getSimpleRoleList = () => {
  return http.request<Result>("post", baseUrlApi("sys/role/list/all"));
};

/** 系统管理-用户管理-根据userId，获取对应角色id列表（userId：用户id） */
export const getCompanyUserRoleIds = (data?: object) => {
  return http.request<Result>("post", baseUrlApi("company/user/list-role-ids"), { data });
};

/** 系统管理-用户管理-根据userId，为用户分配角色（userId：用户id） */
export const saveCompanyUserRole = (data?: object) => {
  return http.request<Result>("post", baseUrlApi("company/user/role/assign"), { data });
};

/** 获取系统管理-角色管理列表 */
export const getRoleList = (data?: object) => {
  return http.request<ResultTable>("post", baseUrlApi("sys/role/list"), { data });
};

/** 获取系统管理-角色管理-保存 */
export const createRole = (data?: object) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("sys/role/create"), { data });
};

/** 获取系统管理-角色管理-删除 */
export const deleteRole = (data?: object) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("sys/role/delete"), { data });
};

/** 获取角色管理-权限-菜单权限 */
export const getRoleMenu = (data?: object) => {
  return http.request<Result>("post", "/role-menu", { data });
};

/** 获取角色管理-权限-菜单权限-根据角色 id 查对应菜单 */
export const getRoleMenuIds = (data?: object) => {
  return http.request<Result>("post", baseUrlApi("sys/role/menu-ids"), { data });
};

/** 角色管理-权限-菜单权限-根据角色 id 分配菜单权限 */
export const assignRoleMenu = (data?: object) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("sys/role/menu/assign"), { data });
};

export const getUserByRoleId = (data?: object) => {
  return http.request<ApiResponse<Array<any>>>("post", baseUrlApi("sys/role/user/list"), { data });
};
