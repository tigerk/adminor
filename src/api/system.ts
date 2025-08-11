import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";

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
export const getUserList = (data?: object) => {
  return http.request<ResultTable>("post", baseUrlApi("user/list"), { data });
};

export const createUser = (data?: object) => {
  return http.request<Result>("post", baseUrlApi("user/create"), { data });
};

/** 字典管理-左侧树 */
export const getDictUserTree = () => {
  return http.request<Result>("get", "sys/dept/user/tree");
};

/** 系统管理-用户管理-获取所有角色列表 */
export const getAllRoleList = () => {
  return http.request<Result>("get", "/list-all-role");
};

/** 系统管理-用户管理-根据userId，获取对应角色id列表（userId：用户id） */
export const getRoleIds = (data?: object) => {
  return http.request<Result>("post", "/list-role-ids", { data });
};

/** 获取系统管理-角色管理列表 */
export const getRoleList = (data?: object) => {
  return http.request<ResultTable>("post", "/role", { data });
};

/** 获取角色管理-权限-菜单权限 */
export const getRoleMenu = (data?: object) => {
  return http.request<Result>("post", "/role-menu", { data });
};

/** 获取角色管理-权限-菜单权限-根据角色 id 查对应菜单 */
export const getRoleMenuIds = (data?: object) => {
  return http.request<Result>("post", "/role-menu-ids", { data });
};

/** 字典管理-左侧树 */
export const getDictTree = () => {
  return http.request<Result>("get", "/dict-tree");
};

/** 字典管理-根据字典 dictId 查字典详情 */
export const getDictDetail = (data?: object) => {
  return http.request<ResultTable>("post", "/dict-detail", { data });
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
