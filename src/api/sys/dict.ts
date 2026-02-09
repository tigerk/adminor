import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import { type ApiListResponse } from "@/types";

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

/** 字典管理-左侧树 */
export const getDictTree = () => {
  return http.request<Result>("get", baseUrlApi("sys/dict/list"));
};

/** 字典管理-根据字典 dictId 查字典详情 */
export const getDictData = (data?: object) => {
  return http.request<ResultTable>("post", baseUrlApi("sys/dict/data/list"), { data });
};

/** 新增字典数据 */
export const createDictData = (data?: object) => {
  return http.request<Result>("post", baseUrlApi("sys/dict/data/create"), { data });
};

/** 新增字典数据 */
export const toggleDictDataStatus = (data?: object) => {
  return http.request<Result>("post", baseUrlApi("sys/dict/data/status/toggle"), { data });
};

/** 通过字典编号查询数据项 */
export const getDictDataByDictCode = (data?: object) => {
  return http.request<Result>("post", baseUrlApi("sys/dict/data/listByDictCode"), { data });
};

/** 通过字典编号查询二级数据项 */
export const getDictDataByParentCode = (data?: object) => {
  return http.request<ApiListResponse>("get", baseUrlApi("sys/dict/data/listByParentCode"), { params: data });
};

/** 删除字典数据项 */
export const deleteDictData = (data?: object) => {
  return http.request<Result>("post", baseUrlApi("sys/dict/data/delete"), { data });
};
