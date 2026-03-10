import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import { IdNameVo, ResponseResultListIdNameVo, ResponseResultUserVo, UserVo } from "@/types/generated";
import { ApiResponse } from "@/types";

type Result = {
  code: number;
  message: string;
  data?: any;
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

/** 获取所有用户下拉数据 */
export const getCompanyUserOptions = () => {
  return http.request<ApiResponse<Array<IdNameVo>>>("get", baseUrlApi("company/userOptions"), {});
};

/** 获取公司用户详情 */
export const getCompanyUserDetail = (userId: string) => {
  return http.request<ApiResponse<UserVo>>("get", baseUrlApi(`company/user/detail/${userId}`), {});
};

/** 获取公司管理-公司列表 */
export const getCompanyList = (data?: object) => {
  return http.request<ResultTable>("post", baseUrlApi("company/list"), { data });
};

/** 获取公司管理-公司列表 */
export const createCompany = (data?: object) => {
  return http.request<ResultTable>("post", baseUrlApi("company/create"), { data });
};

/** 修改公司的启用状态 */
export const changeCompanyStatus = (data?: object) => {
  return http.request<ResultTable>("post", baseUrlApi("company/status/change"), { data });
};

/**
 * 获取公司管理-套餐列表
 * @param data 可选参数，包含以下字段：
 * - companyId: 公司 ID，可选
 * - pageNum: 页码，可选
 * - pageSize: 每页显示的数量，可选
 * @returns 返回包含公司套餐列表的结果对象，包含以下字段：
 * - code: 状态码
 * - data: 包含以下字段的对象：
 *   - list: 公司套餐列表
 *   - total: 总条目数
 *   - pageSize: 每页显示的数量
 *   - currentPage: 当前页码
 * - msg: 消息
 */
export const getCompanyPackageList = (data?: object) => {
  return http.request<ResultTable>("post", baseUrlApi("company/package/list"), { data });
};

export const changeCompanyPackageStatus = (data?: object) => {
  return http.request<ResultTable>("post", baseUrlApi("company/package/status/change"), { data });
};

export const createCompanyPackage = (data?: object) => {
  return http.request<ResultTable>("post", baseUrlApi("company/package/create"), { data });
};

/** 获取租户套餐-权限-菜单权限 */
export const getCompanyPackageMenuList = (data?: object) => {
  return http.request<Result>("post", baseUrlApi("/company/package/menus/list"), { data });
};

/** 获取租户套餐-权限-菜单权限-根据角色 id 查对应菜单 */
export const getCompanyPackageMenus = (data?: object) => {
  return http.request<Result>("post", baseUrlApi("/company/package/menus/get"), { data });
};

export const saveCompanyPackageMenus = (data?: object) => {
  return http.request<Result>("post", baseUrlApi("/company/package/menus/save"), { data });
};

/** 获取租户套餐列表（用于下拉选择） */
export const getCompanyPackageSimple = () => {
  return http.request<Result>("post", baseUrlApi("/company/package/list/simple"));
};
