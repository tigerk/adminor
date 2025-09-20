import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { FocusFormItemProps } from "@/views/house/focus/components/FocusCreate/utils/types";

type ResultList = {
  code: number;
  message: string;
  data?: Array<any>;
};

type Result<T> = {
  code: number;
  message: string;
  data?: T;
};

export const createFocusHouse = (data?: object) => {
  return http.request<Result<any>>("post", baseUrlApi("focus/create"), { data });
};

export const getFocusHouseOptions = (data?: object) => {
  return http.request<ResultList>("post", baseUrlApi("focus/options"), { data });
};

export const getFocusById = (data?: object) => {
  return http.request<Result<FocusFormItemProps>>("get", baseUrlApi("focus/get"), { params: data });
};
