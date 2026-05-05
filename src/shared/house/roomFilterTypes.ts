import type { CommunityDto, RoomTotalItemVo } from "@/types";

export type RentalTypeFilterItem = {
  label: string;
  value?: number;
};

export type RoomStatusFilterItem = RoomTotalItemVo & {
  filterType?: number;
  roomStatus?: number;
};

export type RoomAdvancedFilterValue = {
  rentalType?: number;
  communityId?: string;
  communityName?: string;
  roomNumber?: string;
  vacancyDaysMin?: number;
  vacancyDaysMax?: number;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  direction?: string;
  hasImage?: boolean;
};

export type CommunityOption = CommunityDto & {
  communityId?: string;
};
