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

export const getRoomList = (data?: object) => {
  return http.request<ResultTable>("post", baseUrlApi("room/list"), { data });
};

export const getRoomTotal = (data?: object) => {
  return http.request<RoomTotal>("post", baseUrlApi("room/total"), { data });
};
