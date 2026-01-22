// src/types/delivery.ts

/**
 * 交割单数据结构定义
 */

import type { FacilityItemProps } from "@/types";

/** 交割单信息 */
export interface DeliveryProps {
  id?: bigint;
  subjectType?: string;
  subjectTypeId?: bigint;
  roomId?: bigint;
  handoverType?: string;
  status?: number;
  handoverDate?: Date;
  inspectorId?: bigint;
  inspectorName?: string;
  remarks?: string;
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
  id?: bigint;
  deliveryId?: bigint;
  category?: string;
  itemCode?: string;
  itemName: string;
  itemCategory?: string;
  itemUnit?: string;
  valueType?: string;
  preValue?: string;
  currentValue: string;
  unit: string;
  damaged?: boolean;
  remark?: string;
  sortOrder?: number;
}

/** 交割单创建表单数据结构定义 */
export interface DeliveryCreateFormProps {
  id?: bigint;
  subjectType?: string;
  subjectTypeId?: bigint;
  roomId?: bigint;
  handoverType?: string;
  status?: number;
  handoverDate?: Date;
  inspectorId?: bigint;
  remark?: string;
  /** 交割单明细 */
  items: DeliveryItemProps[];
  /** 房间设施信息 */
  facilities?: FacilityItemProps[];
  /** 图片列表 */
  imageList?: string[];
}

/** 交割单查询参数 */
export interface DeliveryQueryProps {
  subjectType?: string;
  subjectTypeId?: bigint;
  roomId?: bigint;
  handoverType?: string;
  status?: number;
}
