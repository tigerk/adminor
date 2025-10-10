import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { FocusFormItemProps } from "@/views/house/components/FocusCreate/utils/types";

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
  return http.request<ResultList>("get", baseUrlApi("focus/options"), { params: data });
};

export const getFocusById = (data?: object) => {
  return http.request<Result<FocusFormItemProps>>("get", baseUrlApi("focus/get"), { params: data });
};

export const checkFocusCodeExist = (data?: object) => {
  return http.request<Result<boolean>>("get", baseUrlApi("focus/code/check"), { params: data });
};
