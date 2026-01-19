/**
 * 交割单数据结构定义
 */

/** 交割单信息 */
export interface DeliveryProps {
  id?: bigint;
  subject_type?: string;
  subject_type_id?: bigint;
  room_id?: bigint;
  handover_type?: string;
  status?: number;
  handover_date?: Date;
  inspector_id?: bigint;
  remarks?: string;
  /** 交割单明细 */
  items?: DeliveryItemProps[];
}

/** 交割单项目信息 */
export interface DeliveryItemProps {
  id?: bigint;
  delivery_id?: bigint;
  category?: string;
  item_id?: bigint;
  item_name: string;
  item_unit?: string;
  pre_value?: string;
  current_value: string;
  damaged?: number;
  remarks?: string;
  sort_order?: number;
}

/** 交割单创建表单数据结构定义 */
export interface DeliveryCreateFormProps {
  id?: bigint;
  subject_type?: string;
  subject_type_id?: bigint;
  room_id?: bigint;
  handover_type?: string;
  status?: number;
  handover_date?: Date;
  inspector_id?: bigint;
  remarks?: string;
  /** 交割单明细 */
  items: DeliveryItemProps[];
}
