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

/** 字典管理-左侧树 */
export const getDictTree = () => {
  return http.request<Result>("get", baseUrlApi("sys/dict/list"));
};

/** 字典管理-根据字典 dictId 查字典详情 */
export const getDictData = (data?: object) => {
  return http.request<ResultTable>("get", baseUrlApi("sys/dict/data/list"), { params: data });
};

/** 新增字典数据 */
export const createDictData = (data?: object) => {
  return http.request<Result>("post", baseUrlApi("sys/dict/data/create"), { data });
};
