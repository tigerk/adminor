import { OccupancyStatusEnumMeta, PaymentMethodEnumMeta, PriceMethodEnumMeta, PricePlanEnumMeta, RoomFilterTypeEnumMeta, RoomTypeEnumMeta } from "@/types/generated/enum.meta";

export const ROOM_TYPE_OPTIONS = Object.values(RoomTypeEnumMeta).map(item => ({ label: item.name, value: item.code }));

export const ROOM_STATUS_OPTIONS = [
  ...Object.values(OccupancyStatusEnumMeta).map(item => ({ label: item.name, value: item.code })),
  { label: "已关闭", value: 4 },
  { label: "锁房", value: 5 }
];

export const PRICE_METHOD_OPTIONS = Object.values(PriceMethodEnumMeta).map(item => ({ label: item.name, value: item.code }));

export const PAYMENT_METHOD_OPTIONS = Object.values(PaymentMethodEnumMeta).map(item => ({ label: item.name, value: item.code }));

export const PRICE_PLAN_OPTIONS = Object.values(PricePlanEnumMeta).map(item => ({ label: item.name, value: item.code }));

export const ROOM_FILTER_TYPE = {
  BY_STATUS: RoomFilterTypeEnumMeta.BY_STATUS.code,
  BY_LOCKED: RoomFilterTypeEnumMeta.BY_LOCKED.code,
  BY_CLOSED: RoomFilterTypeEnumMeta.BY_CLOSED.code
} as const;
