import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";

import type { ApiResponse, HouseViewDetailProps } from "@/types";

/**
 * Sends a POST request to retrieve detailed information about a house.
 * @param {object} [data] - Optional data object to be sent with the request. This can include parameters necessary for the API to fetch the correct house details.
 * @returns {Promise<ApiResponse<HouseViewDetailProps>>} A promise that resolves to an ApiResponse object, which contains the detailed properties of the house as defined in HouseViewDetailProps.
 */
export const getHouseDetail = (data?: object) => {
  return http.request<ApiResponse<HouseViewDetailProps>>("post", baseUrlApi("house/detail"), { data });
};
