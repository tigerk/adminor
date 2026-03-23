import type { SysNotice } from "@/types/generated/types.gen";

export type WelcomePeriodAmount = {
  todayAmount?: number;
  yesterdayAmount?: number;
  thisMonthAmount?: number;
  lastMonthAmount?: number;
  thisYearAmount?: number;
  totalAmount?: number;
};

export type WelcomeRoomOverview = {
  leaseMode?: number;
  leaseModeName?: string;
  total?: number;
  availableCount?: number;
  preparingCount?: number;
  leasedCount?: number;
  upcomingCheckInCount?: number;
  upcomingCheckOutCount?: number;
  overdueCheckOutCount?: number;
  occupancyRate?: number;
};

export type WelcomeOverdueBucket = {
  key?: string;
  label?: string;
  amount?: number;
};

export type WelcomeTenantStats = {
  todayDepositCount?: number;
  monthDepositCount?: number;
  todayNewSignCount?: number;
  monthNewSignCount?: number;
  todayRenewCount?: number;
  monthRenewCount?: number;
};

export type WelcomeNotice = Pick<SysNotice, "id" | "title" | "noticeType" | "publishTime"> & {
  createByName?: string;
};

export type WelcomeDashboard = {
  financeSummary?: WelcomePeriodAmount;
  paymentSummary?: WelcomePeriodAmount;
  notices?: WelcomeNotice[];
  roomOverviewList?: WelcomeRoomOverview[];
  overdueBuckets?: WelcomeOverdueBucket[];
  tenantStats?: WelcomeTenantStats;
};
