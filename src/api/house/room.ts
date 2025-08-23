import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";

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

type RoomTotal = {
  code: number;
  message: string;
  data?: {
    statusList: any;
  };
};

type ResultList = {
  code: number;
  message: string;
  data?: Array<any>;
};

export const getRoomList = (data?: object) => {
  return http.request<ResultTable>("post", baseUrlApi("room/list"), { data });
};

export const getRoomGrid = (data?: object) => {
  return http.request<ResultList>("post", baseUrlApi("room/grid"), { data });
};

export const getRoomTotal = (data?: object) => {
  return http.request<RoomTotal>("post", baseUrlApi("room/total"), { data });
};
