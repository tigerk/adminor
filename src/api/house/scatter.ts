import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";

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

export const createScatterHouse = (data?: object) => {
  return http.request<Result<any>>("post", baseUrlApi("scatter/create"), { data });
};
