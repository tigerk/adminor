import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";

type ResultList = {
  code: number;
  message: string;
  data?: Array<any>;
};

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

export const createFocusHouse = (data?: object) => {
  return http.request<Result>("post", baseUrlApi("house/focus/create"), { data });
};

export const getFocusHouseOptions = (data?: object) => {
  return http.request<ResultList>("post", baseUrlApi("house/focus/house/options"), { data });
};
