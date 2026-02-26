import type { LeaseDto, RoomListVo, TenantCreateDto, BookingListVo } from "@/types";

export interface LeaseProps extends LeaseDto {
  leaseDate?: string[];
  checkDate?: string[];
  roomList?: Array<RoomListVo>;
}

/** 租客创建表单 */
export interface TenantsCreateFormProps extends TenantCreateDto {
  lease: LeaseProps;
  booking?: BookingListVo;
  isEdit?: boolean; // 是否为编辑模式
}
