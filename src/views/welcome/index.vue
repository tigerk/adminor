<script setup lang="ts">
  import { computed, onMounted, ref } from "vue";
  import dayjs from "dayjs";
  import { useRouter } from "vue-router";
  import { Bell, Money, OfficeBuilding, TrendCharts, Warning } from "@element-plus/icons-vue";
  import type { WelcomeDashboardVo, WelcomeOverdueBucketVo, WelcomePeriodAmountVo, WelcomeRoomOverviewVo, WelcomeTenantStatsVo } from "@/types";
  import { getWelcomeDashboard } from "@/api/welcome";

  defineOptions({
    name: "Welcome"
  });

  const router = useRouter();
  const loading = ref(false);
  const dashboard = ref<WelcomeDashboardVo>({});
  const currentLeaseMode = ref(2);

  const roomOverview = computed<WelcomeRoomOverviewVo | undefined>(() => {
    const list = dashboard.value.roomOverviewList || [];
    return list.find(item => item.leaseMode === currentLeaseMode.value) || list[0];
  });

  const financePeriods = computed(() => buildPeriodItems(dashboard.value.financeSummary));
  const paymentPeriods = computed(() => buildPeriodItems(dashboard.value.paymentSummary));
  const overdueBuckets = computed<WelcomeOverdueBucketVo[]>(() => dashboard.value.overdueBuckets || []);
  const tenantStats = computed<WelcomeTenantStatsVo>(() => dashboard.value.tenantStats || {});

  const roomPercentages = computed(() => {
    const overview = roomOverview.value;
    const total = Number(overview?.total || 0);
    if (!total) {
      return { leased: 0, available: 0, preparing: 0 };
    }
    return {
      leased: Number((((overview?.leasedCount || 0) / total) * 100).toFixed(2)),
      available: Number((((overview?.availableCount || 0) / total) * 100).toFixed(2)),
      preparing: Number((((overview?.preparingCount || 0) / total) * 100).toFixed(2))
    };
  });

  const roomDonutStyle = computed(() => {
    const leased = roomPercentages.value.leased;
    const available = roomPercentages.value.available;
    const preparing = roomPercentages.value.preparing;
    const leasedEnd = leased;
    const availableEnd = leased + available;
    const preparingEnd = leased + available + preparing;
    return {
      background: `conic-gradient(#2563eb 0 ${leasedEnd}%, #ff6678 ${leasedEnd}% ${availableEnd}%, #ff8a1a ${availableEnd}% ${preparingEnd}%, #e5e7eb ${preparingEnd}% 100%)`
    };
  });

  const roomMetricCards = computed(() => {
    const overview = roomOverview.value || {};
    return [
      { key: "available", label: "空置", value: overview.availableCount || 0, accent: "text-[#ff5568]" },
      { key: "preparing", label: "配置", value: overview.preparingCount || 0, accent: "text-[#ff8a1a]" },
      { key: "leased", label: "已租", value: overview.leasedCount || 0, accent: "text-[#2563eb]" },
      { key: "checkin", label: "即将搬入(30天内)", value: overview.upcomingCheckInCount || 0, accent: "text-[#10b981]" },
      { key: "checkout", label: "即将搬出(30天内)", value: overview.upcomingCheckOutCount || 0, accent: "text-[#8b5cf6]" },
      { key: "overdue", label: "到期未退", value: overview.overdueCheckOutCount || 0, accent: "text-[#ef4444]" }
    ];
  });

  const tenantStatCards = computed(() => [
    { key: "deposit", label: "定金租客", today: tenantStats.value.todayDepositCount || 0, month: tenantStats.value.monthDepositCount || 0, accent: "bg-amber-50 text-amber-600" },
    { key: "new", label: "新签", today: tenantStats.value.todayNewSignCount || 0, month: tenantStats.value.monthNewSignCount || 0, accent: "bg-blue-50 text-blue-600" },
    { key: "renew", label: "续签", today: tenantStats.value.todayRenewCount || 0, month: tenantStats.value.monthRenewCount || 0, accent: "bg-emerald-50 text-emerald-600" }
  ]);

  async function fetchDashboard() {
    loading.value = true;
    try {
      const { data } = await getWelcomeDashboard();
      dashboard.value = data || {};
      if (!dashboard.value.roomOverviewList?.find(item => item.leaseMode === currentLeaseMode.value)) {
        currentLeaseMode.value = dashboard.value.roomOverviewList?.[0]?.leaseMode || 2;
      }
    } finally {
      loading.value = false;
    }
  }

  function buildPeriodItems(period?: WelcomePeriodAmountVo) {
    return [
      { key: "today", label: "今日", value: period?.todayAmount || 0 },
      { key: "yesterday", label: "昨日", value: period?.yesterdayAmount || 0 },
      { key: "thisMonth", label: "本月", value: period?.thisMonthAmount || 0 },
      { key: "lastMonth", label: "上月", value: period?.lastMonthAmount || 0 },
      { key: "thisYear", label: "本年", value: period?.thisYearAmount || 0 },
      { key: "total", label: "全部", value: period?.totalAmount || 0 }
    ];
  }

  function openNoticeList() {
    router.push("/my-notice/notice/index");
  }

  function openNoticeDetail() {
    router.push("/my-notice/notice/index");
  }

  function openOverdueBills() {
    router.push({
      path: "/finance/lease-bill",
      query: {
        overdueOnly: "true"
      }
    });
  }

  function moneyText(value?: number) {
    const amount = Number(value || 0);
    return `￥${amount.toLocaleString("zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  function compactMoneyText(value?: number) {
    const amount = Number(value || 0);
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(2)}亿+`;
    }
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(2)}万+`;
    }
    return moneyText(amount);
  }

  function formatDateTime(value?: string) {
    return value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "—";
  }

  onMounted(fetchDashboard);
</script>

<template>
  <div v-loading="loading" class="welcome-dashboard">
    <div class="dashboard-grid">
      <section class="hero-card hero-card--finance">
        <div class="hero-card__header">
          <div class="hero-card__title-wrap">
            <div class="hero-card__icon bg-blue-50 text-blue-600">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div>
              <div class="hero-card__title">财务流水</div>
              <div class="hero-card__subtitle">按入账成功口径统计</div>
            </div>
          </div>
          <div class="hero-card__headline">{{ moneyText(dashboard.financeSummary?.totalAmount) }}</div>
        </div>
        <div class="period-grid">
          <div v-for="item in financePeriods" :key="item.key" class="period-grid__item">
            <span class="period-grid__label">{{ item.label }}</span>
            <strong class="period-grid__value">{{ moneyText(item.value) }}</strong>
          </div>
        </div>
      </section>

      <section class="hero-card hero-card--payment">
        <div class="hero-card__header">
          <div class="hero-card__title-wrap">
            <div class="hero-card__icon bg-emerald-50 text-emerald-600">
              <el-icon><Money /></el-icon>
            </div>
            <div>
              <div class="hero-card__title">支付</div>
              <div class="hero-card__subtitle">按支付成功口径统计</div>
            </div>
          </div>
          <div class="hero-card__headline">{{ moneyText(dashboard.paymentSummary?.totalAmount) }}</div>
        </div>
        <div class="period-grid">
          <div v-for="item in paymentPeriods" :key="item.key" class="period-grid__item">
            <span class="period-grid__label">{{ item.label }}</span>
            <strong class="period-grid__value">{{ moneyText(item.value) }}</strong>
          </div>
        </div>
      </section>
    </div>

    <div class="dashboard-grid dashboard-grid--secondary">
      <section class="board-card notices-card">
        <div class="board-card__header">
          <div class="board-card__title-wrap">
            <div class="board-card__icon bg-sky-50 text-sky-600">
              <el-icon><Bell /></el-icon>
            </div>
            <div>
              <h3 class="board-card__title">最新公告</h3>
              <p class="board-card__caption">最近发布的系统公告</p>
            </div>
          </div>
          <el-button link type="primary" @click="openNoticeList">查看全部</el-button>
        </div>

        <div v-if="dashboard.notices?.length" class="notice-list">
          <div v-for="notice in dashboard.notices" :key="notice.id" class="notice-item notice-item--clickable" @click="openNoticeDetail">
            <div class="notice-item__content">
              <div class="notice-item__title">{{ notice.title || "未命名公告" }}</div>
              <div class="notice-item__meta">
                <span>{{ notice.createByName || "系统" }}</span>
                <span>{{ formatDateTime(notice.publishTime) }}</span>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无公告" :image-size="88" />
      </section>

      <section class="board-card tenant-card">
        <div class="board-card__header">
          <div class="board-card__title-wrap">
            <div class="board-card__icon bg-violet-50 text-violet-600">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div>
              <h3 class="board-card__title">租客统计</h3>
              <p class="board-card__caption">按今日和本月统计新增业务</p>
            </div>
          </div>
        </div>
        <div class="tenant-stats-grid">
          <div v-for="item in tenantStatCards" :key="item.key" class="tenant-stat">
            <div class="tenant-stat__badge" :class="item.accent">{{ item.label }}</div>
            <div class="tenant-stat__values">
              <div>
                <span class="tenant-stat__label">今日</span>
                <strong>{{ item.today }}</strong>
              </div>
              <div>
                <span class="tenant-stat__label">本月</span>
                <strong>{{ item.month }}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <section class="board-card room-card">
      <div class="board-card__header board-card__header--room">
        <div class="board-card__title-wrap">
          <div class="board-card__icon bg-blue-50 text-blue-600">
            <el-icon><OfficeBuilding /></el-icon>
          </div>
          <div>
            <h3 class="board-card__title">房源概况</h3>
            <p class="board-card__caption">
              {{ roomOverview?.total || 0 }} 间
              <span class="room-card__divider">|</span>
              出租率 {{ Number(roomOverview?.occupancyRate || 0).toFixed(2) }}%
            </p>
          </div>
        </div>

        <div class="mode-switch">
          <button
            v-for="item in dashboard.roomOverviewList || []"
            :key="item.leaseMode"
            class="mode-switch__item"
            :class="{ 'is-active': currentLeaseMode === item.leaseMode }"
            @click="currentLeaseMode = item.leaseMode || 2"
          >
            {{ item.leaseModeName }}
          </button>
        </div>
      </div>

      <div class="room-card__body">
        <div class="room-card__metrics">
          <div v-for="item in roomMetricCards" :key="item.key" class="room-metric">
            <div class="room-metric__value" :class="item.accent">{{ item.value }}</div>
            <div class="room-metric__label">{{ item.label }}</div>
          </div>
        </div>

        <div class="room-card__chart">
          <div class="donut" :style="roomDonutStyle">
            <div class="donut__inner">
              <div class="donut__value">{{ Number(roomOverview?.occupancyRate || 0).toFixed(2) }}%</div>
              <div class="donut__label">出租率</div>
            </div>
          </div>
          <div class="donut-legend">
            <div class="donut-legend__item">
              <span class="dot dot-blue" />
              <span>已租 {{ roomPercentages.leased.toFixed(2) }}%</span>
            </div>
            <div class="donut-legend__item">
              <span class="dot dot-red" />
              <span>空置 {{ roomPercentages.available.toFixed(2) }}%</span>
            </div>
            <div class="donut-legend__item">
              <span class="dot dot-amber" />
              <span>配置 {{ roomPercentages.preparing.toFixed(2) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="board-card overdue-card">
      <div class="board-card__header">
        <div class="board-card__title-wrap">
          <div class="board-card__icon bg-rose-50 text-rose-600">
            <el-icon><Warning /></el-icon>
          </div>
          <div>
            <h3 class="board-card__title">租客逾期欠款</h3>
            <p class="board-card__caption">按逾期天数对待收金额分桶</p>
          </div>
        </div>
      </div>
      <div class="overdue-grid">
        <div v-for="item in overdueBuckets" :key="item.key" class="overdue-item overdue-item--clickable" @click="openOverdueBills">
          <div class="overdue-item__label">{{ item.label }}</div>
          <div class="overdue-item__amount">{{ compactMoneyText(item.amount) }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
  .welcome-dashboard {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    min-width: 0;
  }

  .dashboard-grid--secondary {
    grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  }

  .hero-card,
  .board-card {
    background: #fff;
    border: 1px solid #edf1f7;
    border-radius: 18px;
    box-shadow: 0 8px 28px rgb(15 23 42 / 0.05);
    min-width: 0;
  }

  .hero-card {
    padding: 20px 22px;
  }

  .hero-card--finance {
    background: linear-gradient(180deg, rgb(59 130 246 / 0.06), #fff 48%);
  }

  .hero-card--payment {
    background: linear-gradient(180deg, rgb(16 185 129 / 0.06), #fff 48%);
  }

  .hero-card__header,
  .board-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .hero-card__title-wrap,
  .board-card__title-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .hero-card__icon,
  .board-card__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 14px;
    font-size: 18px;
    flex-shrink: 0;
  }

  .hero-card__title,
  .board-card__title {
    color: #111827;
    font-size: 18px;
    font-weight: 700;
    line-height: 1.2;
  }

  .hero-card__subtitle,
  .board-card__caption {
    color: #6b7280;
    font-size: 13px;
    line-height: 1.4;
    margin-top: 4px;
  }

  .hero-card__headline {
    color: #111827;
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
    text-align: right;
    white-space: nowrap;
  }

  .period-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-top: 18px;
  }

  .period-grid__item {
    border: 1px solid #edf1f7;
    border-radius: 14px;
    padding: 12px 14px;
    background: rgb(248 250 252 / 0.9);
    min-width: 0;
  }

  .period-grid__label {
    display: block;
    font-size: 12px;
    color: #64748b;
    margin-bottom: 6px;
  }

  .period-grid__value {
    display: block;
    color: #0f172a;
    font-size: 18px;
    line-height: 1.3;
    word-break: break-all;
  }

  .board-card {
    padding: 18px 20px;
  }

  .notice-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 18px;
  }

  .notice-item {
    border: 1px solid #eef2f7;
    background: linear-gradient(180deg, #fff, #f8fbff);
    border-radius: 14px;
    padding: 14px 16px;
  }

  .notice-item--clickable {
    cursor: pointer;
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease;
  }

  .notice-item--clickable:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgb(37 99 235 / 0.08);
    border-color: rgb(147 197 253 / 0.8);
  }

  .notice-item__title {
    color: #111827;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.5;
  }

  .notice-item__meta {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #94a3b8;
    font-size: 12px;
    margin-top: 8px;
  }

  .tenant-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-top: 18px;
  }

  .tenant-stat {
    border: 1px solid #edf1f7;
    border-radius: 16px;
    padding: 16px;
    background: linear-gradient(180deg, #fff, #f8fafc);
  }

  .tenant-stat__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 76px;
    padding: 5px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
  }

  .tenant-stat__values {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-top: 16px;
  }

  .tenant-stat__label {
    display: block;
    color: #94a3b8;
    font-size: 12px;
    margin-bottom: 6px;
  }

  .tenant-stat strong {
    color: #0f172a;
    font-size: 22px;
    line-height: 1;
  }

  .room-card__divider {
    padding: 0 10px;
    color: #cbd5e1;
  }

  .mode-switch {
    display: inline-flex;
    padding: 4px;
    background: #f8fafc;
    border-radius: 999px;
    gap: 4px;
  }

  .mode-switch__item {
    border: 0;
    background: transparent;
    padding: 8px 14px;
    border-radius: 999px;
    color: #475569;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .mode-switch__item.is-active {
    background: #2563eb;
    color: #fff;
    box-shadow: 0 8px 20px rgb(37 99 235 / 0.2);
  }

  .room-card__body {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
    gap: 20px;
    margin-top: 18px;
  }

  .room-card__metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .room-metric {
    border-radius: 18px;
    background: #f8fafc;
    min-height: 134px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 18px 14px;
    border: 1px solid #eef2f7;
  }

  .room-metric__value {
    font-size: 40px;
    line-height: 1;
    font-weight: 700;
  }

  .room-metric__label {
    color: #334155;
    font-size: 15px;
    margin-top: 14px;
    text-align: center;
  }

  .room-card__chart {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18px;
    min-width: 0;
  }

  .donut {
    width: 212px;
    height: 212px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .donut__inner {
    width: 122px;
    height: 122px;
    background: #fff;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 0 0 1px #eef2f7;
  }

  .donut__value {
    color: #0f172a;
    font-size: 26px;
    font-weight: 700;
    line-height: 1;
  }

  .donut__label {
    color: #64748b;
    font-size: 12px;
    margin-top: 8px;
  }

  .donut-legend {
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 14px;
    color: #475569;
  }

  .donut-legend__item {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    flex-shrink: 0;
  }

  .dot-blue {
    background: #2563eb;
  }

  .dot-red {
    background: #ff6678;
  }

  .dot-amber {
    background: #ff8a1a;
  }

  .overdue-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
    margin-top: 18px;
  }

  .overdue-item {
    border: 1px solid #fee2e2;
    background: linear-gradient(180deg, #fff, #fff7f7);
    border-radius: 16px;
    padding: 18px 16px;
  }

  .overdue-item--clickable {
    cursor: pointer;
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease;
  }

  .overdue-item--clickable:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 24px rgb(220 38 38 / 0.08);
    border-color: rgb(252 165 165 / 0.95);
  }

  .overdue-item__label {
    color: #7f1d1d;
    font-size: 13px;
    margin-bottom: 10px;
  }

  .overdue-item__amount {
    color: #dc2626;
    font-size: 26px;
    line-height: 1.1;
    font-weight: 700;
    word-break: break-all;
  }

  @media (max-width: 1440px) {
    .dashboard-grid,
    .dashboard-grid--secondary,
    .room-card__body {
      grid-template-columns: 1fr;
    }

    .room-card__metrics,
    .tenant-stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .overdue-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 960px) {
    .period-grid,
    .room-card__metrics,
    .tenant-stats-grid,
    .overdue-grid {
      grid-template-columns: 1fr;
    }

    .hero-card__header,
    .board-card__header--room {
      flex-direction: column;
      align-items: flex-start;
    }

    .hero-card__headline {
      text-align: left;
      font-size: 24px;
    }

    .donut {
      width: 184px;
      height: 184px;
    }

    .donut__inner {
      width: 106px;
      height: 106px;
    }
  }
</style>
