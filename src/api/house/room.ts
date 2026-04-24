import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type {
  ApiResponse,
  PaginationResponse,
  PriceConfigDto,
  RoomDetailVo,
  RoomGridDto,
  RoomIdDto,
  RoomListVo,
  RoomLockDto,
  RoomQueryDto,
  RoomSaveRemarkDto,
  RoomLockRecordProps,
  RoomTotalVo,
  RoomTrackDto
} from "@/types";

export const getRoomList = (data?: RoomQueryDto) => {
  return http.request<ApiResponse<PaginationResponse<RoomListVo>>>("post", baseUrlApi("room/list"), { data });
};

/**
 * 获取房间网格数据
 * @param data
 */
export const getRoomGrid = (data?: RoomQueryDto) => {
  return http.request<ApiResponse<RoomGridDto>>("post", baseUrlApi("room/grid"), { data });
};

export const getRoomDetail = (data?: RoomIdDto) => {
  return http.request<ApiResponse<RoomDetailVo>>("post", baseUrlApi("room/detail"), { data });
};

export const getRoomTotalVo = (data?: RoomQueryDto) => {
  return http.request<ApiResponse<RoomTotalVo>>("post", baseUrlApi("room/total"), { data });
};

/**
 * 锁定房间
 * @param data
 */
export const lockRoom = (data?: RoomLockDto) => {
  return http.request<ApiResponse>("post", baseUrlApi("room/lock"), { data });
};

export const unlockRoom = (data?: RoomIdDto) => {
  return http.request<ApiResponse>("post", baseUrlApi("room/unlock"), { data });
};

export const getRoomLockRecords = (data?: RoomIdDto) => {
  return http.request<ApiResponse<RoomLockRecordProps[]>>("post", baseUrlApi("room/lock/records"), { data });
};

export const closeRoom = (data?: RoomIdDto) => {
  return http.request<ApiResponse>("post", baseUrlApi("room/close"), { data });
};

export const openRoom = (data?: RoomIdDto) => {
  return http.request<ApiResponse>("post", baseUrlApi("room/open"), { data });
};

/**
 * 保存单个房间的租金配置方案
 * POST /saas/room/price-config/save
 *
 * 入参: PriceConfigDTO { roomId, price, floorPriceMethod, floorPriceInput, floorPrice, otherFees[], pricePlans[] }
 * 出参: Boolean
 */
export const saveRoomPriceConfig = (data?: PriceConfigDto) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("room/price-config/save"), { data });
};

/**
 * 获取单个房间的租金配置方案
 * POST /saas/room/price-config/get
 *
 * 入参: { roomId: number }
 * 出参: PriceConfigDTO
 */
export const getRoomPriceConfig = (data?: RoomIdDto) => {
  return http.request<ApiResponse<PriceConfigDto>>("post", baseUrlApi("room/price-config/get"), { data });
};

export const addRoomTrack = (data?: RoomTrackDto) => {
  return http.request<ApiResponse<string>>("post", baseUrlApi("room/track/add"), { data });
};

/**
 * 保存房间备注
 * POST /saas/room/remark/save
 *
 * 入参: RoomSaveRemarkDto { roomId, remark }
 * 出参: string
 */
export const addRoomRemark = (data?: RoomSaveRemarkDto) => {
  return http.request<ApiResponse<string>>("post", baseUrlApi("room/remark/save"), { data });
};
