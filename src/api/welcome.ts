import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { ApiResponse } from "@/types/common";
import type { WelcomeDashboard } from "@/types";

export const getWelcomeDashboard = () => {
  return http.request<ApiResponse<WelcomeDashboard>>("post", baseUrlApi("dashboard/welcome/summary"));
};
