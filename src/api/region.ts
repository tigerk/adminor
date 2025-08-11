import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";

type Result = {
  success: boolean;
  data?: Array<any>;
};

/** 卡片列表 */
export const getRegionList = (data?: object) => {
  return http.request<Result>("get", baseUrlApi("region/list/three"), {
    data
  });
};
