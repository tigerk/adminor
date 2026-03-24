<script setup lang="ts">
  import { computed, onMounted, ref } from "vue";
  import dayjs from "dayjs";
  import { useRouter } from "vue-router";
  import type {
    WelcomeCountBucketVo,
    WelcomeContractWarningVo,
    WelcomeDashboardVo,
    WelcomeOverdueBucketVo,
    WelcomeOverdueTenantVo,
    WelcomePeriodAmountVo,
    WelcomeRoomOverviewVo,
    WelcomeTenantStatsVo
  } from "@/types";
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
  const vacancyBuckets = computed<WelcomeCountBucketVo[]>(() => dashboard.value.vacancyBuckets || []);
  const contractWarning = computed<WelcomeContractWarningVo>(() => dashboard.value.contractWarning || {});
  const overdueTenantTopList = computed<WelcomeOverdueTenantVo[]>(() => dashboard.value.overdueTenantTopList || []);
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
    return `conic-gradient(var(--el-color-primary) 0 ${leased}%, var(--el-text-color-placeholder) ${leased}% ${a2}%, var(--el-border-color) ${a2}% ${a3}%, var(--el-fill-color) ${a3}% 100%)`;
  });

  const roomMetrics = computed(() => {
    const o = roomOverview.value || {};
    return [
      { label: "空置", value: o.availableCount ?? 0 },
      { label: "配置中", value: o.preparingCount ?? 0 },
      { label: "已租", value: o.leasedCount ?? 0, primary: true },
      { label: "即将搬入", value: o.upcomingCheckInCount ?? 0, sub: "30天内" },
      { label: "即将搬出", value: o.upcomingCheckOutCount ?? 0, sub: "30天内" },
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

  // 逾期欠款总额
  const overdueTotal = computed(() => overdueBuckets.value.reduce((s, i) => s + Number(i.amount || 0), 0));

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

  function moneyFmt(v?: number, decimals = 2) {
    const n = Number(v || 0);
    return `¥${n.toLocaleString("zh-CN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }
  function compactMoney(v?: number) {
    const n = Number(v || 0);
    if (n >= 1e8) return `¥${(n / 1e8).toFixed(2)}亿`;
    if (n >= 1e4) return `¥${(n / 1e4).toFixed(2)}万`;
    return moneyFmt(n);
  }
  function formatTime(v?: string) {
    return v ? dayjs(v).format("MM-DD HH:mm") : "—";
  }
  function getVacancyQuery(key?: string) {
    if (key === "vacancy_1_7") return { vacancyDaysMin: "1", vacancyDaysMax: "7" };
    if (key === "vacancy_8_15") return { vacancyDaysMin: "8", vacancyDaysMax: "15" };
    return { vacancyDaysMin: "16" };
  }
  function goToVacancyBucket(key?: string) {
    const path = currentLeaseMode.value === 1 ? "/house/focus/room/index" : "/house/scatter";
    router.push({ path, query: { occupancyStatus: "0", ...getVacancyQuery(key) } });
  }
  function goToContractWarning(days: number) {
    router.push({ path: "/contract/tenant", query: { status: "1", expiringDaysWithin: String(days) } });
  }
  function goToUpcomingReceivable() {
    router.push({ path: "/finance/lease-bill", query: { dueWithinDays: "7" } });
  }
  function goToTenantOverdueBills(tenantId?: string) {
    router.push({ path: "/finance/lease-bill", query: { overdueOnly: "true", tenantId } });
  }

  onMounted(fetchDashboard);
</script>

<template>
  <div v-loading="loading" class="db" element-loading-background="transparent">
    <!-- ══════════════════════════════════════
         Banner
    ══════════════════════════════════════ -->
    <div class="db-banner">
      <div>
        <p class="db-banner__date">{{ todayStr }}</p>
        <h1 class="db-banner__title">{{ greeting }}，欢迎回来 👋</h1>
      </div>
      <div class="db-banner__kpis">
        <div class="db-kpi">
          <span class="db-kpi__label">财务流水（累计）</span>
          <span class="db-kpi__val">{{ compactMoney(dashboard.financeSummary?.totalAmount) }}</span>
        </div>
        <div class="db-kpi db-kpi--em">
          <span class="db-kpi__label">支付（累计）</span>
          <span class="db-kpi__val">{{ compactMoney(dashboard.paymentSummary?.totalAmount) }}</span>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════
         第一行：4 个核心指标（大字号）
    ══════════════════════════════════════ -->
    <div class="db-stat4">
      <div class="db-stat" @click="router.push('/finance/lease-bill')">
        <div class="db-stat__icon db-stat__icon--blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
        </div>
        <div class="db-stat__body">
          <p class="db-stat__label">本月财务流水</p>
          <strong class="db-stat__val">{{ compactMoney(dashboard.financeSummary?.thisMonthAmount) }}</strong>
          <p class="db-stat__sub">
            今日
            <em>{{ compactMoney(dashboard.financeSummary?.todayAmount) }}</em>
          </p>
        </div>
      </div>

      <div class="db-stat" @click="router.push('/finance/lease-bill')">
        <div class="db-stat__icon db-stat__icon--teal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="4" width="22" height="16" rx="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        </div>
        <div class="db-stat__body">
          <p class="db-stat__label">本月支付</p>
          <strong class="db-stat__val">{{ compactMoney(dashboard.paymentSummary?.thisMonthAmount) }}</strong>
          <p class="db-stat__sub">
            今日
            <em>{{ compactMoney(dashboard.paymentSummary?.todayAmount) }}</em>
          </p>
        </div>
      </div>

      <div class="db-stat" @click="goToUpcomingReceivable()">
        <div class="db-stat__icon db-stat__icon--amber">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div class="db-stat__body">
          <p class="db-stat__label">7 天内应收</p>
          <strong class="db-stat__val">{{ compactMoney(contractWarning.next7DaysReceivableAmount) }}</strong>
          <p class="db-stat__sub">
            7天到期合同
            <em>{{ contractWarning.expiring7DaysCount || 0 }} 份</em>
          </p>
        </div>
      </div>

      <div class="db-stat db-stat--danger" @click="router.push({ path: '/finance/lease-bill', query: { overdueOnly: 'true' } })">
        <div class="db-stat__icon db-stat__icon--red">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div class="db-stat__body">
          <p class="db-stat__label">逾期欠款总额</p>
          <strong class="db-stat__val db-stat__val--red">{{ compactMoney(overdueTotal) }}</strong>
          <p class="db-stat__sub">
            30天到期合同
            <em>{{ contractWarning.expiring30DaysCount || 0 }} 份</em>
          </p>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════
         主体：左 + 右
    ══════════════════════════════════════ -->
    <div class="db-body">
      <!-- ── 左栏 ── -->
      <div class="db-left">
        <!-- 财务流水 -->
        <div class="db-card">
          <div class="db-head">
            <span class="db-accent db-accent--blue" />
            <span class="db-card-title">财务流水</span>
            <span class="db-card-caption">按入账成功口径统计</span>
            <span class="db-badge db-badge--blue">实时</span>
          </div>
          <div class="db-period-grid">
            <div v-for="item in financePeriods" :key="item.key" class="db-period-cell">
              <span class="db-period-label">{{ item.label }}</span>
              <strong class="db-period-val">{{ moneyFmt(item.value) }}</strong>
            </div>
          </div>
        </div>

        <!-- 支付 -->
        <div class="db-card">
          <div class="db-head">
            <span class="db-accent db-accent--teal" />
            <span class="db-card-title">支付</span>
            <span class="db-card-caption">按支付成功口径统计</span>
            <span class="db-badge db-badge--teal">实时</span>
          </div>
          <div class="db-period-grid">
            <div v-for="item in paymentPeriods" :key="item.key" class="db-period-cell">
              <span class="db-period-label">{{ item.label }}</span>
              <strong class="db-period-val">{{ moneyFmt(item.value) }}</strong>
            </div>
          </div>
        </div>

        <!-- 逾期欠款分桶 -->
        <div class="db-card">
          <div class="db-head">
            <span class="db-accent db-accent--red" />
            <span class="db-card-title">逾期欠款</span>
            <span class="db-card-caption">按逾期天数分桶统计</span>
            <el-button link type="danger" size="small" class="db-more" @click="router.push({ path: '/finance/lease-bill', query: { overdueOnly: 'true' } })">查看 →</el-button>
          </div>
          <div v-if="overdueBuckets.length" class="db-overdue-grid">
            <div v-for="item in overdueBuckets" :key="item.key" class="db-overdue-cell" @click="router.push({ path: '/finance/lease-bill', query: { overdueOnly: 'true' } })">
              <span class="db-overdue-label">{{ item.label }}</span>
              <strong class="db-overdue-val">{{ compactMoney(item.amount) }}</strong>
            </div>
          </div>
          <el-empty v-else description="暂无逾期欠款" :image-size="52" />
        </div>

        <!-- 合同与收款预警 -->
        <div class="db-card">
          <div class="db-head">
            <span class="db-accent db-accent--amber" />
            <span class="db-card-title">合同预警</span>
            <span class="db-card-caption">合同到期 · 近期应收安排</span>
          </div>
          <div class="db-warn3">
            <div class="db-warn-cell db-warn-cell--em" @click="goToUpcomingReceivable()">
              <span class="db-warn-label">未来 7 天应收</span>
              <strong class="db-warn-val">{{ compactMoney(contractWarning.next7DaysReceivableAmount) }}</strong>
            </div>
            <div class="db-warn-cell" @click="goToContractWarning(7)">
              <span class="db-warn-label">7 天内到期合同</span>
              <strong class="db-warn-val">
                {{ contractWarning.expiring7DaysCount || 0 }}
                <em>份</em>
              </strong>
            </div>
            <div class="db-warn-cell" @click="goToContractWarning(30)">
              <span class="db-warn-label">30 天内到期合同</span>
              <strong class="db-warn-val">
                {{ contractWarning.expiring30DaysCount || 0 }}
                <em>份</em>
              </strong>
            </div>
          </div>
        </div>
        <!-- 租客统计 -->
        <div class="db-card">
          <div class="db-head">
            <span class="db-accent db-accent--teal" />
            <span class="db-card-title">租客统计</span>
            <span class="db-card-caption">今日 / 本月新增业务</span>
          </div>
          <table class="db-tenant-tbl">
            <thead>
              <tr>
                <th />
                <th>今日</th>
                <th>本月</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in tenantStatRows" :key="row.label">
                <td class="db-t-name">{{ row.label }}</td>
                <td class="db-t-num">{{ row.today }}</td>
                <td class="db-t-num">{{ row.month }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- /左栏 -->

      <!-- ── 右栏 ── -->
      <div class="db-right">
        <!-- 房源概况 -->
        <div class="db-card">
          <div class="db-head">
            <span class="db-accent db-accent--violet" />
            <span class="db-card-title">房源概况</span>
            <span class="db-card-caption">
              共
              <b>{{ roomOverview?.total || 0 }}</b>
              间&nbsp;·&nbsp; 出租率
              <b>{{ Number(roomOverview?.occupancyRate || 0).toFixed(1) }}%</b>
            </span>
            <div class="db-tabs">
              <button
                v-for="item in dashboard.roomOverviewList || []"
                :key="item.leaseMode"
                class="db-tab"
                :class="{ 'is-active': currentLeaseMode === item.leaseMode }"
                @click="currentLeaseMode = item.leaseMode || 2"
              >
                {{ item.leaseModeName }}
              </button>
            </div>
          </div>

          <!-- 饼图 + 图例 -->
          <div class="db-donut-row">
            <div class="db-donut" :style="{ background: donutGradient }">
              <div class="db-donut__hole">
                <span class="db-donut__pct">{{ Number(roomOverview?.occupancyRate || 0).toFixed(1) }}%</span>
                <span class="db-donut__sub">出租率</span>
              </div>
            </div>
            <div class="db-legend">
              <div v-for="leg in legendItems" :key="leg.label" class="db-legend-row">
                <span class="db-legend-dot" :class="leg.cls" />
                <span class="db-legend-label">{{ leg.label }}</span>
                <span class="db-legend-val">{{ leg.value }}%</span>
              </div>
            </div>
          </div>

          <!-- 6 格指标 -->
          <div class="db-metrics">
            <div v-for="m in roomMetrics" :key="m.label" class="db-metric">
              <strong class="db-metric__val" :class="{ 'is-primary': m.primary, 'is-danger': m.danger }">
                {{ m.value }}
              </strong>
              <span class="db-metric__label">
                {{ m.label }}
                <em v-if="m.sub">{{ m.sub }}</em>
              </span>
            </div>
          </div>

          <!-- 空置时长分布 -->
          <template v-if="vacancyBuckets.length">
            <div class="db-sub-head">
              <span class="db-sub-title">空置时长分布</span>
              <span class="db-sub-caption">空置越久，去化压力越大</span>
            </div>
            <div class="db-vacancy-grid">
              <div v-for="item in vacancyBuckets" :key="item.key" class="db-vacancy-cell" @click="goToVacancyBucket(item.key)">
                <span class="db-vacancy-label">{{ item.label }}</span>
                <strong class="db-vacancy-val">{{ item.count || 0 }}</strong>
              </div>
            </div>
          </template>
        </div>

        <!-- 最新公告 -->
        <div class="db-card">
          <div class="db-head">
            <span class="db-accent" />
            <span class="db-card-title">最新公告</span>
            <el-button link type="primary" size="small" class="db-more" @click="router.push('/my-notice/notice/index')">全部 →</el-button>
          </div>
          <div v-if="notices.length" class="db-notice-list">
            <div v-for="notice in notices" :key="notice.id" class="db-notice-row" @click="router.push('/my-notice/notice/index')">
              <span class="db-notice-dot" />
              <div class="db-notice-body">
                <p class="db-notice-title">{{ notice.title || "未命名公告" }}</p>
                <p class="db-notice-meta">{{ notice.createByName || "系统" }} · {{ formatTime(notice.publishTime) }}</p>
              </div>
              <svg class="db-notice-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
          <el-empty v-else description="暂无公告" :image-size="52" />
        </div>

        <!-- 逾期租客 Top5 -->
        <div class="db-card">
          <div class="db-head">
            <span class="db-accent db-accent--red" />
            <span class="db-card-title">逾期租客 Top5</span>
            <span class="db-card-caption">按欠款总额排序</span>
          </div>
          <div v-if="overdueTenantTopList.length" class="db-rank-list">
            <div v-for="(item, index) in overdueTenantTopList" :key="item.tenantId || index" class="db-rank-row" @click="goToTenantOverdueBills(item.tenantId)">
              <span class="db-rank-no" :class="{ 'is-top': index < 3 }">{{ index + 1 }}</span>
              <div class="db-rank-user">
                <span class="db-rank-name">{{ item.tenantName || "未命名" }}</span>
                <span class="db-rank-phone">{{ item.tenantPhone || "—" }}</span>
              </div>
              <strong class="db-rank-amount">{{ compactMoney(item.unpaidAmount) }}</strong>
            </div>
          </div>
          <el-empty v-else description="暂无逾期租客" :image-size="52" />
        </div>
      </div>
      <!-- /右栏 -->
    </div>
    <!-- /db-body -->
  </div>
</template>

<style scoped lang="scss">
  /* ═══════════════════════════════════════════════
   所有颜色使用 Element Plus CSS 变量
   深色模式由框架自动切换，零额外规则
═══════════════════════════════════════════════ */
  .db {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 4px 0 24px;
  }

  /* ── Banner ── */
  .db-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 22px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    box-shadow: var(--el-box-shadow-lighter);
    flex-wrap: wrap;
  }
  .db-banner__date {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    margin-bottom: 3px;
  }
  .db-banner__title {
    font-size: 20px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    line-height: 1.25;
  }

  .db-banner__kpis {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .db-kpi {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 16px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    min-width: 150px;
  }
  .db-kpi--em {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-7);
  }
  .db-kpi__label {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }
  .db-kpi__val {
    font-size: 18px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  /* ── 4 格核心指标条 ── */
  .db-stat4 {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }
  .db-stat {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    box-shadow: var(--el-box-shadow-lighter);
    cursor: pointer;
    transition:
      box-shadow 0.15s,
      border-color 0.15s,
      transform 0.15s;

    &:hover {
      box-shadow: var(--el-box-shadow-light);
      border-color: var(--el-color-primary-light-5);
      transform: translateY(-1px);
    }
  }
  .db-stat--danger:hover {
    border-color: var(--el-color-danger-light-5);
  }

  .db-stat__icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    svg {
      width: 20px;
      height: 20px;
    }
  }
  .db-stat__icon--blue {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }
  .db-stat__icon--teal {
    background: var(--el-color-success-light-9);
    color: var(--el-color-success);
  }
  .db-stat__icon--amber {
    background: var(--el-color-warning-light-9);
    color: var(--el-color-warning);
  }
  .db-stat__icon--red {
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
  }

  .db-stat__body {
    min-width: 0;
    flex: 1;
  }
  .db-stat__label {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    margin-bottom: 4px;
  }
  .db-stat__val {
    display: block;
    font-size: 22px;
    font-weight: 800;
    color: var(--el-text-color-primary);
    line-height: 1.15;
    word-break: break-all;
  }
  .db-stat__val--red {
    color: var(--el-color-danger);
  }
  .db-stat__sub {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    margin-top: 4px;
    em {
      font-style: normal;
      color: var(--el-text-color-secondary);
      font-weight: 600;
    }
  }

  /* ── 主体两栏 ── */
  .db-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px;
    align-items: start;
  }
  .db-left,
  .db-right {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* ── 卡片 ── */
  .db-card {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    padding: 16px 18px;
    box-shadow: var(--el-box-shadow-lighter);
    transition: box-shadow 0.18s;
    &:hover {
      box-shadow: var(--el-box-shadow-light);
    }
  }

  /* ── 卡头 ── */
  .db-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
    flex-wrap: nowrap;
    min-width: 0;
  }

  /* 左侧色条 */
  .db-accent {
    width: 3px;
    height: 16px;
    border-radius: 2px;
    flex-shrink: 0;
    background: var(--el-text-color-placeholder);
  }
  .db-accent--blue {
    background: var(--el-color-primary);
  }
  .db-accent--teal {
    background: var(--el-color-success);
  }
  .db-accent--amber {
    background: var(--el-color-warning);
  }
  .db-accent--red {
    background: var(--el-color-danger);
  }
  .db-accent--violet {
    background: #8b5cf6;
  }

  .db-card-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    white-space: nowrap;
  }
  .db-card-caption {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    b {
      color: var(--el-text-color-secondary);
      font-weight: 600;
    }
  }
  .db-badge {
    flex-shrink: 0;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    margin-left: auto;
  }
  .db-badge--blue {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    border: 1px solid var(--el-color-primary-light-7);
  }
  .db-badge--teal {
    background: var(--el-color-success-light-9);
    color: var(--el-color-success);
    border: 1px solid var(--el-color-success-light-7);
  }
  .db-more {
    margin-left: auto;
    flex-shrink: 0;
  }

  /* ── 期间数据格（3×2）── */
  .db-period-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 7px;
  }
  .db-period-cell {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 12px 13px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    transition: border-color 0.15s;
    &:hover {
      border-color: var(--el-color-primary-light-5);
    }
  }
  .db-period-label {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }
  /* ★ 金额字号放大 */
  .db-period-val {
    font-size: 15px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    word-break: break-all;
    line-height: 1.3;
  }

  /* ── 逾期欠款格（2列）── */
  .db-overdue-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
  }
  .db-overdue-cell {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 13px 14px;
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
  .db-overdue-label {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
  }
  /* ★ 逾期金额字号放大 */
  .db-overdue-val {
    font-size: 20px;
    font-weight: 800;
    color: var(--el-color-danger);
    line-height: 1;
    word-break: break-all;
  }

  /* ── 合同预警（3列）── */
  .db-warn3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 7px;
  }
  .db-warn-cell {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 13px 13px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    cursor: pointer;
    transition:
      border-color 0.15s,
      background 0.15s;
    &:hover {
      border-color: var(--el-color-warning-light-5);
    }
  }
  .db-warn-cell--em {
    background: var(--el-color-warning-light-9);
    border-color: var(--el-color-warning-light-7);
    &:hover {
      border-color: var(--el-color-warning-light-3);
    }
  }
  .db-warn-label {
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }
  /* ★ 预警金额字号放大 */
  .db-warn-val {
    font-size: 18px;
    font-weight: 800;
    color: var(--el-text-color-primary);
    line-height: 1.2;
    em {
      font-style: normal;
      font-size: 12px;
      font-weight: 500;
      color: var(--el-text-color-secondary);
      margin-left: 2px;
    }
  }

  /* ── 房源概况内部 ── */
  .db-donut-row {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 12px;
  }
  .db-donut {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .db-donut__hole {
    width: 74px;
    height: 74px;
    background: var(--el-bg-color);
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .db-donut__pct {
    font-size: 16px;
    font-weight: 800;
    color: var(--el-text-color-primary);
    line-height: 1;
  }
  .db-donut__sub {
    font-size: 10px;
    color: var(--el-text-color-placeholder);
    margin-top: 4px;
  }

  .db-legend {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }
  .db-legend-row {
    display: grid;
    grid-template-columns: 8px 1fr auto;
    align-items: center;
    gap: 7px;
    white-space: nowrap;
  }
  .db-legend-dot {
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
  .db-legend-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  .db-legend-val {
    font-size: 12px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .db-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 7px;
  }
  .db-metric {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 13px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
  }
  .db-metric__val {
    font-size: 24px;
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
  .db-metric__label {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    line-height: 1.3;
    em {
      display: block;
      font-style: normal;
      color: var(--el-text-color-placeholder);
      font-size: 10px;
    }
  }

  /* 模式 Tab */
  .db-tabs {
    display: flex;
    gap: 2px;
    padding: 2px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 7px;
    margin-left: auto;
    flex-shrink: 0;
  }
  .db-tab {
    border: none;
    background: transparent;
    padding: 3px 11px;
    border-radius: 5px;
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

  /* 空置子区 */
  .db-sub-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin: 14px 0 9px;
    padding-top: 14px;
    border-top: 1px solid var(--el-border-color-extra-light);
    flex-wrap: wrap;
  }
  .db-sub-title {
    font-size: 12px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }
  .db-sub-caption {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }

  .db-vacancy-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 7px;
  }
  .db-vacancy-cell {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 12px 13px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    cursor: pointer;
    transition:
      border-color 0.15s,
      background 0.15s;
    &:hover {
      border-color: var(--el-color-primary-light-5);
      background: var(--el-color-primary-light-9);
    }
  }
  .db-vacancy-label {
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }
  .db-vacancy-val {
    font-size: 22px;
    font-weight: 800;
    line-height: 1;
    color: var(--el-text-color-primary);
  }

  /* ── 公告 ── */
  .db-notice-list {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .db-notice-row {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px 8px;
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
  .db-notice-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--el-color-primary);
    flex-shrink: 0;
  }
  .db-notice-body {
    flex: 1;
    min-width: 0;
  }
  .db-notice-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .db-notice-meta {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    margin-top: 2px;
  }
  .db-notice-chevron {
    color: var(--el-text-color-placeholder);
    flex-shrink: 0;
  }

  /* ── 排行榜 ── */
  .db-rank-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .db-rank-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
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
  .db-rank-no {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
    background: var(--el-fill-color);
    color: var(--el-text-color-secondary);
    &.is-top {
      background: var(--el-color-danger-light-9);
      color: var(--el-color-danger);
    }
  }
  .db-rank-user {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .db-rank-name {
    font-size: 13px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .db-rank-phone {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }
  .db-rank-amount {
    font-size: 14px;
    font-weight: 800;
    color: var(--el-color-danger);
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* ── 租客统计 ── */
  .db-tenant-tbl {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    thead tr {
      border-bottom: 1px solid var(--el-border-color-lighter);
    }
    th {
      padding: 0 10px 9px;
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
  .db-t-name {
    padding: 10px 10px 10px 0;
    font-weight: 600;
    color: var(--el-text-color-primary);
    white-space: nowrap;
  }
  .db-t-num {
    padding: 10px;
    text-align: center;
    font-size: 20px;
    font-weight: 800;
    color: var(--el-text-color-primary);
  }

  /* ── 响应式 ── */
  @media (max-width: 1280px) {
    .db-stat4 {
      grid-template-columns: repeat(2, 1fr);
    }
    .db-body {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 860px) {
    .db-banner {
      flex-direction: column;
      align-items: flex-start;
    }
    .db-banner__kpis {
      width: 100%;
    }
    .db-kpi {
      flex: 1;
      min-width: unset;
    }
    .db-stat4 {
      grid-template-columns: repeat(2, 1fr);
    }
    .db-period-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .db-warn3 {
      grid-template-columns: 1fr;
    }
    .db-overdue-grid {
      grid-template-columns: 1fr;
    }
    .db-metrics {
      grid-template-columns: repeat(2, 1fr);
    }
    .db-vacancy-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
