<script setup lang="ts">
  import { computed, onMounted, ref } from "vue";
  import dayjs from "dayjs";
  import { useRouter } from "vue-router";
  import type { WelcomeDashboardVo, WelcomeOverdueBucketVo, WelcomePeriodAmountVo, WelcomeRoomOverviewVo, WelcomeTenantStatsVo } from "@/types";
  import { getWelcomeDashboard } from "@/api/welcome";

  defineOptions({ name: "Welcome" });

  const router = useRouter();
  const loading = ref(false);
  const dashboard = ref<WelcomeDashboardVo>({});
  const currentLeaseMode = ref(2);

  const greeting = computed(() => {
    const h = dayjs().hour();
    if (h < 6) return "夜深了";
    if (h < 12) return "早上好";
    if (h < 14) return "中午好";
    if (h < 18) return "下午好";
    return "晚上好";
  });

  const todayStr = computed(() => dayjs().format("YYYY年MM月DD日"));

  const roomOverview = computed<WelcomeRoomOverviewVo | undefined>(() => {
    const list = dashboard.value.roomOverviewList || [];
    return list.find(i => i.leaseMode === currentLeaseMode.value) || list[0];
  });

  const financePeriods = computed(() => buildPeriodItems(dashboard.value.financeSummary));
  const paymentPeriods = computed(() => buildPeriodItems(dashboard.value.paymentSummary));
  const overdueBuckets = computed<WelcomeOverdueBucketVo[]>(() => dashboard.value.overdueBuckets || []);
  const tenantStats = computed<WelcomeTenantStatsVo>(() => dashboard.value.tenantStats || {});
  const notices = computed(() => dashboard.value.notices || []);

  const roomPercentages = computed(() => {
    const o = roomOverview.value;
    const total = Number(o?.total || 0);
    if (!total) return { leased: 0, available: 0, preparing: 0 };
    return {
      leased: +(((o?.leasedCount || 0) / total) * 100).toFixed(1),
      available: +(((o?.availableCount || 0) / total) * 100).toFixed(1),
      preparing: +(((o?.preparingCount || 0) / total) * 100).toFixed(1)
    };
  });

  const donutGradient = computed(() => {
    const { leased, available, preparing } = roomPercentages.value;
    const a2 = leased + available;
    const a3 = a2 + preparing;
    return `conic-gradient(
      var(--el-color-primary) 0 ${leased}%,
      var(--el-text-color-placeholder) ${leased}% ${a2}%,
      var(--el-border-color) ${a2}% ${a3}%,
      var(--el-fill-color) ${a3}% 100%
    )`;
  });

  const roomMetrics = computed(() => {
    const o = roomOverview.value || {};
    return [
      { label: "空置", value: o.availableCount ?? 0, danger: false },
      { label: "配置中", value: o.preparingCount ?? 0, danger: false },
      { label: "已租", value: o.leasedCount ?? 0, primary: true },
      { label: "即将搬入", sub: "30天内", value: o.upcomingCheckInCount ?? 0, danger: false },
      { label: "即将搬出", sub: "30天内", value: o.upcomingCheckOutCount ?? 0, danger: false },
      { label: "到期未退", value: o.overdueCheckOutCount ?? 0, danger: true }
    ];
  });

  const tenantStatRows = computed(() => [
    { label: "定金租客", today: tenantStats.value.todayDepositCount || 0, month: tenantStats.value.monthDepositCount || 0 },
    { label: "新签", today: tenantStats.value.todayNewSignCount || 0, month: tenantStats.value.monthNewSignCount || 0 },
    { label: "续签", today: tenantStats.value.todayRenewCount || 0, month: tenantStats.value.monthRenewCount || 0 }
  ]);

  const legendItems = computed(() => [
    { label: "已租", value: roomPercentages.value.leased, cls: "dot-primary" },
    { label: "空置", value: roomPercentages.value.available, cls: "dot-muted" },
    { label: "配置", value: roomPercentages.value.preparing, cls: "dot-light" }
  ]);

  async function fetchDashboard() {
    loading.value = true;
    try {
      const { data } = await getWelcomeDashboard();
      dashboard.value = data || {};
      if (!dashboard.value.roomOverviewList?.find(i => i.leaseMode === currentLeaseMode.value)) {
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
      { key: "total", label: "累计", value: period?.totalAmount || 0 }
    ];
  }

  function moneyText(value?: number) {
    const n = Number(value || 0);
    return `¥${n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function compactMoney(value?: number) {
    const n = Number(value || 0);
    if (n >= 1e8) return `¥${(n / 1e8).toFixed(2)}亿`;
    if (n >= 1e4) return `¥${(n / 1e4).toFixed(2)}万`;
    return moneyText(n);
  }

  function formatTime(value?: string) {
    return value ? dayjs(value).format("MM-DD HH:mm") : "—";
  }

  onMounted(fetchDashboard);
</script>

<template>
  <div v-loading="loading" class="wd" element-loading-background="transparent">
    <!-- ① Banner -->
    <div class="wd-banner">
      <div>
        <p class="wd-banner__date">{{ todayStr }}</p>
        <h1 class="wd-banner__title">{{ greeting }}，欢迎回来 👋</h1>
      </div>
      <div class="wd-banner__kpis">
        <div class="wd-kpi">
          <span class="wd-kpi__label">财务流水（累计）</span>
          <span class="wd-kpi__val">{{ compactMoney(dashboard.financeSummary?.totalAmount) }}</span>
        </div>
        <div class="wd-kpi wd-kpi--em">
          <span class="wd-kpi__label">支付（累计）</span>
          <span class="wd-kpi__val">{{ compactMoney(dashboard.paymentSummary?.totalAmount) }}</span>
        </div>
      </div>
    </div>

    <!-- ② 主体 -->
    <div class="wd-body">
      <!-- 左栏 -->
      <div class="wd-left">
        <!-- 财务流水 -->
        <div class="wd-card">
          <div class="wd-card-head">
            <div class="wd-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            </div>
            <div class="wd-card-titles">
              <span class="wd-card-title">财务流水</span>
              <span class="wd-card-caption">按入账成功口径统计</span>
            </div>
            <span class="wd-badge">实时</span>
          </div>
          <div class="wd-period-grid">
            <div v-for="item in financePeriods" :key="item.key" class="wd-period-cell">
              <span class="wd-period-label">{{ item.label }}</span>
              <strong class="wd-period-val">{{ moneyText(item.value) }}</strong>
            </div>
          </div>
        </div>

        <!-- 支付 -->
        <div class="wd-card">
          <div class="wd-card-head">
            <div class="wd-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <div class="wd-card-titles">
              <span class="wd-card-title">支付</span>
              <span class="wd-card-caption">按支付成功口径统计</span>
            </div>
            <span class="wd-badge">实时</span>
          </div>
          <div class="wd-period-grid">
            <div v-for="item in paymentPeriods" :key="item.key" class="wd-period-cell">
              <span class="wd-period-label">{{ item.label }}</span>
              <strong class="wd-period-val">{{ moneyText(item.value) }}</strong>
            </div>
          </div>
        </div>

        <!-- 房源概况 -->
        <div class="wd-card">
          <div class="wd-card-head">
            <div class="wd-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div class="wd-card-titles">
              <span class="wd-card-title">房源概况</span>
              <span class="wd-card-caption">
                共
                <b>{{ roomOverview?.total || 0 }}</b>
                间 &nbsp;·&nbsp; 出租率
                <b>{{ Number(roomOverview?.occupancyRate || 0).toFixed(1) }}%</b>
              </span>
            </div>
            <!-- 模式 tab -->
            <div class="wd-tabs">
              <button
                v-for="item in dashboard.roomOverviewList || []"
                :key="item.leaseMode"
                class="wd-tab"
                :class="{ 'is-active': currentLeaseMode === item.leaseMode }"
                @click="currentLeaseMode = item.leaseMode || 2"
              >
                {{ item.leaseModeName }}
              </button>
            </div>
          </div>

          <div class="wd-room-body">
            <!-- 指标格 -->
            <div class="wd-metrics">
              <div v-for="m in roomMetrics" :key="m.label" class="wd-metric">
                <span class="wd-metric-val" :class="{ 'is-primary': m.primary, 'is-danger': m.danger }">{{ m.value }}</span>
                <span class="wd-metric-label">
                  {{ m.label }}
                  <em v-if="m.sub">{{ m.sub }}</em>
                </span>
              </div>
            </div>

            <!-- 饼图 -->
            <div class="wd-donut-wrap">
              <div class="wd-donut" :style="{ background: donutGradient }">
                <div class="wd-donut-hole">
                  <span class="wd-donut-pct">{{ Number(roomOverview?.occupancyRate || 0).toFixed(1) }}%</span>
                  <span class="wd-donut-sub">出租率</span>
                </div>
              </div>
              <!-- 图例：竖排，永不换行 -->
              <div class="wd-legend">
                <div v-for="leg in legendItems" :key="leg.label" class="wd-legend-row">
                  <span class="wd-legend-dot" :class="leg.cls" />
                  <span class="wd-legend-label">{{ leg.label }}</span>
                  <span class="wd-legend-val">{{ leg.value }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- /left -->

      <!-- 右栏 -->
      <div class="wd-right">
        <!-- 最新公告 -->
        <div class="wd-card">
          <div class="wd-card-head">
            <div class="wd-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div class="wd-card-titles">
              <span class="wd-card-title">最新公告</span>
              <span class="wd-card-caption">近期系统公告</span>
            </div>
            <el-button link type="primary" size="small" class="wd-more-btn" @click="router.push('/my-notice/notice/index')">全部 →</el-button>
          </div>
          <div v-if="notices.length" class="wd-notice-list">
            <div v-for="notice in notices" :key="notice.id" class="wd-notice-row" @click="router.push('/my-notice/notice/index')">
              <span class="wd-notice-dot" />
              <div class="wd-notice-content">
                <p class="wd-notice-title">{{ notice.title || "未命名公告" }}</p>
                <p class="wd-notice-meta">{{ notice.createByName || "系统" }} · {{ formatTime(notice.publishTime) }}</p>
              </div>
              <svg class="wd-notice-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
          <el-empty v-else description="暂无公告" :image-size="60" />
        </div>

        <!-- 逾期欠款 -->
        <div class="wd-card">
          <div class="wd-card-head">
            <div class="wd-icon wd-icon--danger">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div class="wd-card-titles">
              <span class="wd-card-title">逾期欠款</span>
              <span class="wd-card-caption">按逾期天数分桶统计</span>
            </div>
            <el-button link type="danger" size="small" class="wd-more-btn" @click="router.push({ path: '/finance/lease-bill', query: { overdueOnly: 'true' } })">查看 →</el-button>
          </div>
          <div v-if="overdueBuckets.length" class="wd-overdue-grid">
            <div v-for="item in overdueBuckets" :key="item.key" class="wd-overdue-cell" @click="router.push({ path: '/finance/lease-bill', query: { overdueOnly: 'true' } })">
              <span class="wd-overdue-label">{{ item.label }}</span>
              <span class="wd-overdue-val">{{ compactMoney(item.amount) }}</span>
            </div>
          </div>
          <el-empty v-else description="暂无逾期欠款" :image-size="56" />
        </div>

        <!-- 租客统计 -->
        <div class="wd-card">
          <div class="wd-card-head">
            <div class="wd-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div class="wd-card-titles">
              <span class="wd-card-title">租客统计</span>
              <span class="wd-card-caption">今日 / 本月新增业务</span>
            </div>
          </div>
          <table class="wd-tenant-table">
            <thead>
              <tr>
                <th />
                <th>今日</th>
                <th>本月</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in tenantStatRows" :key="row.label">
                <td class="wd-tenant-name">{{ row.label }}</td>
                <td class="wd-tenant-num">{{ row.today }}</td>
                <td class="wd-tenant-num">{{ row.month }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- /right -->
    </div>
  </div>
</template>

<style scoped lang="scss">
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   全部颜色均使用 Element Plus CSS 变量
   深色模式由 html.dark 自动切换 EP 变量，
   无需再写任何 html.dark 覆盖规则
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

  .wd {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 6px 0 24px;
  }

  /* ── Banner ── */
  .wd-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 24px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    box-shadow: var(--el-box-shadow-lighter);
    flex-wrap: wrap;
  }

  .wd-banner__date {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    margin-bottom: 4px;
  }
  .wd-banner__title {
    font-size: 22px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    line-height: 1.25;
  }

  .wd-banner__kpis {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .wd-kpi {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 18px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    min-width: 160px;
  }

  .wd-kpi--em {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-7);
  }

  .wd-kpi__label {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
  .wd-kpi__val {
    font-size: 20px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  /* ── 双栏布局 ── */
  .wd-body {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(0, 0.7fr);
    gap: 14px;
    align-items: start;
  }

  .wd-left,
  .wd-right {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* ── 卡片 ── */
  .wd-card {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    padding: 18px 20px;
    box-shadow: var(--el-box-shadow-lighter);
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: var(--el-box-shadow-light);
    }
  }

  /* ── 卡片头部 ── */
  .wd-card-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }

  .wd-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--el-fill-color);
    color: var(--el-text-color-secondary);
  }

  .wd-icon--danger {
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
  }

  .wd-card-titles {
    flex: 1;
    min-width: 0;
  }
  .wd-card-title {
    display: block;
    font-size: 14px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    line-height: 1.3;
  }
  .wd-card-caption {
    display: block;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    margin-top: 2px;
    b {
      color: var(--el-text-color-secondary);
      font-weight: 600;
    }
  }

  .wd-badge {
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 9px;
    border-radius: 999px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    border: 1px solid var(--el-color-primary-light-7);
  }

  .wd-more-btn {
    margin-left: auto;
    flex-shrink: 0;
  }

  /* ── 期间数据格 ── */
  .wd-period-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .wd-period-cell {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 13px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    transition: border-color 0.15s;

    &:hover {
      border-color: var(--el-color-primary-light-5);
    }
  }

  .wd-period-label {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
  .wd-period-val {
    font-size: 14px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    word-break: break-all;
    line-height: 1.3;
  }

  /* ── 房源模式 Tab ── */
  .wd-tabs {
    display: flex;
    gap: 2px;
    padding: 3px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 9px;
    margin-left: auto;
    flex-shrink: 0;
  }

  .wd-tab {
    border: none;
    background: transparent;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    transition:
      background 0.15s,
      color 0.15s;
    white-space: nowrap;

    &.is-active {
      background: var(--el-color-primary);
      color: #fff;
    }

    &:not(.is-active):hover {
      color: var(--el-text-color-primary);
    }
  }

  /* ── 房源 body ── */
  .wd-room-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 196px;
    gap: 16px;
    align-items: center;
  }

  .wd-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .wd-metric {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 13px 13px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
  }

  .wd-metric-val {
    font-size: 26px;
    font-weight: 800;
    line-height: 1;
    color: var(--el-text-color-primary);

    &.is-primary {
      color: var(--el-color-primary);
    }
    &.is-danger {
      color: var(--el-color-danger);
    }
  }

  .wd-metric-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.3;
    em {
      display: block;
      font-style: normal;
      color: var(--el-text-color-placeholder);
      font-size: 11px;
    }
  }

  /* ── 甜甜圈 ── */
  .wd-donut-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }

  .wd-donut {
    width: 144px;
    height: 144px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .wd-donut-hole {
    width: 88px;
    height: 88px;
    background: var(--el-bg-color);
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .wd-donut-pct {
    font-size: 17px;
    font-weight: 800;
    color: var(--el-text-color-primary);
    line-height: 1;
  }
  .wd-donut-sub {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    margin-top: 4px;
  }

  /* ── 图例：竖排 grid，三列对齐，不换行 ── */
  .wd-legend {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .wd-legend-row {
    display: grid;
    grid-template-columns: 8px 1fr auto;
    align-items: center;
    gap: 7px;
    white-space: nowrap;
  }

  .wd-legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;

    &.dot-primary {
      background: var(--el-color-primary);
    }
    &.dot-muted {
      background: var(--el-text-color-placeholder);
    }
    &.dot-light {
      background: var(--el-border-color);
    }
  }

  .wd-legend-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  .wd-legend-val {
    font-size: 12px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  /* ── 公告 ── */
  .wd-notice-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .wd-notice-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 10px;
    border-radius: 8px;
    border: 1px solid transparent;
    cursor: pointer;
    transition:
      background 0.15s,
      border-color 0.15s;

    &:hover {
      background: var(--el-fill-color-light);
      border-color: var(--el-border-color-lighter);
    }
  }

  .wd-notice-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--el-color-primary);
    flex-shrink: 0;
  }

  .wd-notice-content {
    flex: 1;
    min-width: 0;
  }
  .wd-notice-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .wd-notice-meta {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    margin-top: 2px;
  }
  .wd-notice-chevron {
    color: var(--el-text-color-placeholder);
    flex-shrink: 0;
  }

  /* ── 逾期欠款 ── */
  .wd-overdue-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .wd-overdue-cell {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 13px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    cursor: pointer;
    transition:
      border-color 0.15s,
      background 0.15s;

    &:hover {
      border-color: var(--el-color-danger-light-5);
      background: var(--el-color-danger-light-9);
    }
  }

  .wd-overdue-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
  }
  .wd-overdue-val {
    font-size: 20px;
    font-weight: 800;
    color: var(--el-color-danger);
    line-height: 1;
    word-break: break-all;
  }

  /* ── 租客统计 table ── */
  .wd-tenant-table {
    width: 100%;
    border-collapse: collapse;
    border-spacing: 0;
    font-size: 13px;

    thead tr {
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    th {
      padding: 0 12px 10px;
      font-size: 12px;
      font-weight: 600;
      color: var(--el-text-color-placeholder);
      text-align: center;

      &:first-child {
        text-align: left;
        padding-left: 0;
      }
    }

    tbody tr {
      border-bottom: 1px solid var(--el-border-color-extra-light);

      &:last-child {
        border-bottom: none;
      }
    }
  }

  .wd-tenant-name {
    padding: 11px 12px 11px 0;
    font-weight: 600;
    color: var(--el-text-color-primary);
    white-space: nowrap;
  }

  .wd-tenant-num {
    padding: 11px 12px;
    text-align: center;
    font-size: 20px;
    font-weight: 800;
    color: var(--el-text-color-primary);
  }

  /* ── 响应式 ── */
  @media (max-width: 1280px) {
    .wd-body {
      grid-template-columns: 1fr;
    }
    .wd-room-body {
      grid-template-columns: 1fr;
    }
    .wd-donut-wrap {
      flex-direction: row;
      justify-content: center;
      padding: 8px 0;
    }
    .wd-legend {
      width: auto;
      min-width: 120px;
    }
  }

  @media (max-width: 860px) {
    .wd-banner {
      flex-direction: column;
      align-items: flex-start;
    }
    .wd-banner__kpis {
      width: 100%;
    }
    .wd-kpi {
      flex: 1;
      min-width: unset;
    }
    .wd-period-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .wd-metrics {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .wd-overdue-grid {
      grid-template-columns: 1fr;
    }
    .wd-card-head {
      flex-wrap: wrap;
    }
    .wd-tabs {
      margin-left: 0;
    }
  }
</style>
