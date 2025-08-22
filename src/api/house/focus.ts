import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { FocusFormItemProps } from "@/views/house/focus/components/utils/types";

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
  return http.request<Result<any>>("post", baseUrlApi("house/focus/create"), { data });
};

export const getFocusHouseOptions = (data?: object) => {
  return http.request<ResultList>("post", baseUrlApi("house/focus/house/options"), { data });
};

export const getFocusHouseById = (data?: object) => {
  return http.request<Result<FocusFormItemProps>>("get", baseUrlApi("house/focus/get"), { params: data });
};
