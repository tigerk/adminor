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

/** 获取系统监控-在线用户列表 */
export const getOnlineUsers = (data?: object) => {
  return http.request<Result>("get", baseUrlApi("monitor/online/users"), {
    data
  });
};

export const offlineUser = (data?: object) => {
  return http.request<Result>("post", baseUrlApi("monitor/online/offline"), {
    data
  });
};

/** 获取系统监控-登录日志列表 */
export const getLoginLogsList = (data?: object) => {
  return http.request<ResultTable>(
    "post",
    baseUrlApi("monitor/login/log/list"),
    { data }
  );
};

/** 获取系统监控-登录日志-清空所有 */
export const clearAllLoginLogs = (data?: object) => {
  return http.request<ResultTable>(
    "post",
    baseUrlApi("monitor/login/log/clear/all"),
    { data }
  );
};

/** 获取系统监控-登录日志-批量删除 */
export const batchDeleteLoginLogs = (data?: object) => {
  return http.request<ResultTable>(
    "post",
    baseUrlApi("monitor/login/log/batch/delete"),
    { data }
  );
};

/** 获取系统监控-操作日志列表 */
export const getOperationLogList = (data?: object) => {
  return http.request<ResultTable>(
    "post",
    baseUrlApi("monitor/operation/log/list"),
    {
      data
    }
  );
};

/** 获取系统监控-操作日志-根据 id 查日志详情 */
export const getOperationLogDetail = (data?: object) => {
  return http.request<ResultTable>(
    "post",
    baseUrlApi("monitor/operation/log/detail"),
    {
      data
    }
  );
};

/** 获取系统监控-操作日志-清空所有 */
export const clearAllOperationLogs = (data?: object) => {
  return http.request<ResultTable>(
    "post",
    baseUrlApi("monitor/operation/log/clear/all"),
    { data }
  );
};

/** 获取系统监控-操作日志-批量删除 */
export const batchDeleteOperationLogs = (data?: object) => {
  return http.request<ResultTable>(
    "post",
    baseUrlApi("monitor/operation/log/batch/delete"),
    { data }
  );
};
