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

/** 获取系统管理-菜单管理列表 */
export const getMenuList = (data?: object) => {
  return http.request<Result>("post", baseUrlApi("sys/menu/list"), { data });
};
