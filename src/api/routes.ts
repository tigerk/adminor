import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";

type Result = {
  success: boolean;
  data: Array<any>;
};

/** 获取异步路由 */
export const getAsyncRoutes = () => {
  return http.request<Result>("get", baseUrlApi("get-async-routes"));
};
