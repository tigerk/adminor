import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { ResponseResultWelcomeDashboardVo } from "@/types";

export const getWelcomeDashboard = () => {
  return http.request<ResponseResultWelcomeDashboardVo>("post", baseUrlApi("dashboard/welcome/summary"));
};
