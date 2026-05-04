import type { HouseDetailVo, RoomDetailVo } from "@/types";

/**
 * room/detail 已经返回房源信息；这里仅做页面组件需要的数据形状适配。
 */
export function buildHouseDetailFromRoom(room: RoomDetailVo): HouseDetailVo {
  const house = ((room.house || {}) as HouseDetailVo) || {};
  const roomList = house.roomList?.length ? house.roomList : [room];

  return {
    ...house,
    id: house.id || room.houseId,
    roomList
  };
}
