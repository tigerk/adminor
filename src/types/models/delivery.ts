/**
 * 交割单数据结构定义
 */

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
}

/** 交割单项目信息 */
export interface DeliveryItemProps {
  id?: bigint;
  deliveryId?: bigint;
  category?: string;
  itemId?: bigint;
  itemName: string;
  itemUnit?: string;
  preValue?: string;
  currentValue: string;
  damaged?: number;
  remarks?: string;
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
  remarks?: string;
  /** 交割单明细 */
  items: DeliveryItemProps[];
}
