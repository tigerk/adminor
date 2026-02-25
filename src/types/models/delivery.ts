// src/types/delivery.ts

/**
 * 交割单数据结构定义
 */

import type { DeliveryVo } from "@/types";

/** 交割单信息 */
export interface DeliveryProps extends DeliveryVo {
  /** 房间信息（用于展示） */
  roomInfo?: {
    houseName?: string;
    roomNumber?: string;
    communityName?: string;
  };
}
