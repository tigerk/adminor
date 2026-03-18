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

/** 租客账单收款分摊项 */
export interface LeaseBillCollectItemDto {
  leaseBillFeeId?: string;
  amount?: number;
}
