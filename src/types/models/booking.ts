/**
 * 预定数据结构定义
 */

import type { RoomListProps } from "@/types";

/** 预定查询参数 */
export interface BookingQueryParams {
  currentPage: number; /** 当前页码 */
  pageSize: number; /** 分页大小 */
  tenantName: string; /** 客户姓名 */
  tenantPhone: string; /** 联系电话 */
  bookingStatus: number; /**  预定状态 */
}

/** 预定列表项 */
export interface BookingListProps {
  id?: bigint; // 预定 ID
  roomIds: bigint[]; /** 预定房间 ids */
  roomList: RoomListProps[];
  tenantType?: number; /** 租客类型：0=个人，1=企业 */
  tenantName?: string; /** 客户姓名 */
  tenantPhone?: string; /** 联系电话 */
  bookingAmount?: number; /** 预定金金额 */
  bookingTime?: Date; /** 预定时间 */
  expiryTime?: Date; /** 预定到期时间（超过此时间未签合同可视为违约/过期） */
  expectedLeaseStart?: Date; /** 预计租赁开始时间 */
  expectedLeaseEnd?: Date; /** 预计租赁结束时间 */
  expectedRentPrice?: number; /** 谈定的意向租金 */
  companyId?: bigint; /** 公司ID */
  salesmanId?: bigint; /** 业务人员ID */
  salesmanName?: string; /** 业务人员名称 */
  bookingStatus?: number; /** 预定状态：1=预定中，2=已转合同，3=客户违约（没收定金），4=业主违约（退还定金），5=已取消/过期 */
  bookingStatusName?: string; /** 预定状态名称 */
  tenantId?: bigint; /** 转合同后关联的租客表 ID */
  remark?: string; /** 备注 */
  createBy?: bigint; /** 创建人ID */
  createTime?: Date; /** 创建时间 */
  updateBy?: bigint; /** 修改人ID */
  updateTime?: Date; /** 修改时间 */
}

/** 预定创建 */
export interface BookingCreateProps {
  id: bigint; // 预定 ID
  roomIds: bigint[]; /** 预定房间 ids */
  roomList: RoomListProps[];
  tenantType: number; /** 租客类型：0=个人，1=企业 */
  tenantName: string; /** 客户姓名 */
  tenantPhone: string; /** 联系电话 */
  bookingAmount: number; /** 预定金金额 */
  bookingTime?: Date; /** 预定时间 */
  expiryTime: Date; /** 预定到期时间（超过此时间未签合同可视为违约/过期） */
  expectedLeaseStart: Date; /** 预计租赁开始时间 */
  expectedLeaseEnd: Date; /** 预计租赁结束时间 */
  expectedRentPrice: number; /** 谈定的意向租金 */
  companyId: bigint; /** 公司ID */
  salesmanId: bigint; /** 业务人员ID */
  bookingStatus: number; /** 预定状态：1=预定中，2=已转合同，3=客户违约（没收定金），4=业主违约（退还定金），5=已取消/过期 */
  bookingStatusName: string; /** 预定状态名称 */
  tenantId: bigint; /** 转合同后关联的租客表 ID */
  remark: string; /** 备注 */
  createBy: bigint; /** 创建人ID */
  createTime: Date; /** 创建时间 */
  updateBy: bigint; /** 修改人ID */
  updateTime: Date; /** 修改时间 */
}

export interface BookingCancelProps {
  id: bigint; /** 预定 ID */
  cancelReason: string; /** 取消/过期原因备注 */
}

export interface BookingTotalProps {
  statusList: BookingTotalItemProps[]; /** 状态项列表 */
}

export interface BookingTotalItemProps {
  status: number; /** 租客合同状态 */
  statusName: string; /** 租客合同状态名称 */
  statusColor: string; /** 租客合同状态颜色 */
  sortOrder: number; /** 排序顺序 */
  total: number; /** 数量 */
}
