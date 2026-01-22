// src/types/delivery.ts

/**
 * 交割单数据结构定义
 */

import type { FacilityItemProps } from "@/types";

/** 交割单信息 */
export interface DeliveryProps {
  id?: bigint;
  subjectType?: string; /** 资产类型 */
  subjectTypeId?: bigint; /** 资产类型ID */
  roomId?: bigint; /** 房间ID */
  handoverType?: string; /** 交割类型 */
  status?: number; /** 状态 */
  handoverDate?: Date | string; /** 交割日期 */
  inspectorId?: bigint; /** 操作员/管家ID */
  inspectorName?: string; /** 操作员/管家姓名 */
  remark?: string; /** 备注 */
  /** 交割单明细 */
  items?: DeliveryItemProps[];
  /** 房间信息（用于展示） */
  roomInfo?: {
    houseName?: string;
    roomNumber?: string;
    communityName?: string;
  };
}

/** 交割单项目信息 */
export interface DeliveryItemProps {
  id?: bigint; /** 交割单项目ID */
  deliveryId?: bigint; /** 交割单ID */
  itemCategory?: string; /** 项目分类: UTILITY-水电气, FACILITY-设施 */
  itemCode?: string; /** 物品编码 */
  itemName: string; /** 物品名称 */
  itemUnit?: string; /** 单位(如: 度、m³、元、个) */
  preValue?: string; /** 前值 */
  currentValue: string; /** 当前值 */
  damaged?: boolean; /** 是否损坏 */
  remark?: string; /** 备注 */
  sortOrder?: number; /** 排序序号 */
  isCustom?: boolean; /** 是否自定义项目 */
}

/** 交割单创建表单数据结构定义 */
export interface DeliveryCreateFormProps {
  id?: bigint; /** 交割单ID */
  subjectType?: string; /** 资产类型 */
  subjectTypeId?: bigint; /** 资产类型ID */
  roomId?: bigint; /** 房间ID */
  handoverType?: string; /** 交割类型 */
  status?: number; /** 状态 */
  handoverDate?: Date | string; /** 交割日期 */
  inspectorId?: bigint; /** 操作员/管家ID */
  remark?: string; /** 备注 */
  /** 交割单明细 */
  items: DeliveryItemProps[];
  /** 房间设施信息 */
  facilities?: FacilityItemProps[];
  /** 图片列表 */
  imageList?: string[];
}

/** 交割单查询参数 */
export interface DeliveryQueryProps {
  subjectType?: string; /** 资产类型 */
  subjectTypeId?: bigint; /** 资产类型ID */
  roomId?: bigint; /** 房间ID */
  handoverType?: string; /** 交割类型 */
  status?: number; /** 状态 */
}
