import { ref, watch } from "vue";
import type { OtherFeeDto } from "@/types";

export interface RoomSelectionItem {
  label: string;
  value: string | number;
  description?: string;
  extra?: any;
}

export type RoomScopedOtherFee = OtherFeeDto & {
  roomId?: string | number;
};

export interface RoomConfigItem {
  roomId: string;
  roomLabel: string;
  rentPrice: number;
  feeList: RoomScopedOtherFee[];
}

export function useTenantCreateForm(formInline: any, roomSelection: { value: RoomSelectionItem[] }) {
  const roomConfigs = ref<RoomConfigItem[]>([]);
  const sharedOtherFees = ref<RoomScopedOtherFee[]>([]);
  const expandedRoomId = ref<string>("");

  const cloneFeeItem = (fee?: RoomScopedOtherFee | null): RoomScopedOtherFee => ({
    roomId: fee?.roomId ?? undefined,
    dictDataId: fee?.dictDataId ?? undefined,
    name: fee?.name ?? "",
    paymentMethod: fee?.paymentMethod ?? 0,
    priceMethod: fee?.priceMethod ?? 1,
    priceInput: fee?.priceInput ?? undefined
  });

  const cloneFeeList = (list?: RoomScopedOtherFee[] | null) => (list || []).map(item => cloneFeeItem(item));

  const normalizeMoney = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const syncRoomSelectionPrices = () => {
    roomSelection.value.forEach(item => {
      const matched = roomConfigs.value.find(config => config.roomId === String(item.value));
      if (!matched) return;
      item.extra = {
        ...(item.extra || {}),
        price: matched.rentPrice
      };
    });
  };

  const syncOtherFeesToForm = () => {
    const roomFeeList = roomConfigs.value.flatMap(config =>
      config.feeList
        .filter(fee => fee.dictDataId || fee.name)
        .map(fee => ({
          ...cloneFeeItem(fee),
          roomId: config.roomId
        }))
    );
    formInline.otherFees = [...cloneFeeList(sharedOtherFees.value).filter(fee => fee.dictDataId || fee.name), ...roomFeeList] as OtherFeeDto[];
  };

  const syncRoomRentListToForm = () => {
    formInline.lease.roomRentList = roomConfigs.value.map(item => ({
      roomId: item.roomId,
      rentPrice: item.rentPrice
    }));
  };

  const calculateTotalRent = () => {
    formInline.lease.rentPrice = roomConfigs.value.reduce((sum, item) => sum + normalizeMoney(item.rentPrice), 0);
  };

  const buildRoomConfigs = () => {
    const feeBucket = new Map<string, RoomScopedOtherFee[]>();
    const sharedFees: RoomScopedOtherFee[] = [];

    ((formInline.otherFees as RoomScopedOtherFee[]) || []).forEach(fee => {
      if (!fee.roomId) {
        sharedFees.push(cloneFeeItem(fee));
        return;
      }
      const roomId = String(fee.roomId);
      const list = feeBucket.get(roomId) || [];
      list.push(cloneFeeItem(fee));
      feeBucket.set(roomId, list);
    });

    const previousConfigMap = new Map(roomConfigs.value.map(item => [item.roomId, item]));
    const roomRentMap = new Map((formInline.lease.roomRentList || []).map(item => [String(item.roomId || ""), normalizeMoney(item.rentPrice)]));
    roomConfigs.value = roomSelection.value.map(room => {
      const roomId = String(room.value);
      const previous = previousConfigMap.get(roomId);
      return {
        roomId,
        roomLabel: room.label,
        rentPrice: normalizeMoney(previous?.rentPrice ?? roomRentMap.get(roomId) ?? room.extra?.price),
        feeList: cloneFeeList(feeBucket.get(roomId) || previous?.feeList || [])
      };
    });
    sharedOtherFees.value = sharedFees;
    if (roomConfigs.value.length === 0) {
      expandedRoomId.value = "";
    } else if (!roomConfigs.value.some(item => item.roomId === expandedRoomId.value)) {
      expandedRoomId.value = roomConfigs.value[0].roomId;
    }
  };

  const handleRoomRentChange = (roomId: string, value: number | string) => {
    const target = roomConfigs.value.find(item => item.roomId === roomId);
    if (!target) return;
    target.rentPrice = normalizeMoney(value);
  };

  const toggleRoomExpand = (roomId: string) => {
    expandedRoomId.value = expandedRoomId.value === roomId ? "" : roomId;
  };

  const calculateRoomFeeTotal = (config: RoomConfigItem) =>
    config.feeList.reduce((sum, fee) => {
      const feeValue = normalizeMoney(fee.priceInput);
      if (fee.priceMethod === 2) {
        return sum + (config.rentPrice * feeValue) / 100;
      }
      return sum + feeValue;
    }, 0);

  watch(
    roomConfigs,
    () => {
      syncRoomSelectionPrices();
      calculateTotalRent();
      syncRoomRentListToForm();
      syncOtherFeesToForm();
    },
    { deep: true }
  );

  watch(
    sharedOtherFees,
    () => {
      syncOtherFeesToForm();
    },
    { deep: true }
  );

  return {
    roomConfigs,
    sharedOtherFees,
    expandedRoomId,
    buildRoomConfigs,
    handleRoomRentChange,
    toggleRoomExpand,
    calculateRoomFeeTotal
  };
}
