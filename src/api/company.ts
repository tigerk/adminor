import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";

type Result = {
  code: number;
  message: string;
  data?: Array<any>;
};

/** 获取所有用户下拉数据 */
export const getCompanyUserOptions = () => {
  return http.request<Result>("get", baseUrlApi("company/userOptions"), {});
};
