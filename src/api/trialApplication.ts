import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";
import type { ApiResponse } from "@/types";

export const createTrialApplication = (data?: object) => {
  return http.request<ApiResponse<number>>("post", baseUrlApi("trialApplication/create"), {
    data
  });
};
