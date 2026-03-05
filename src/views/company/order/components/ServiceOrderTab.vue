<script setup lang="ts">
  import { onMounted, ref } from "vue";
  import { RefreshRight, ShoppingCart } from "@element-plus/icons-vue";
  import { createCompanyOrder, getCompanyProductList } from "@/api/company-order";
  import type { CompanyProductOrderVo } from "@/types";
  import { message } from "@/utils/message";

  const loading = ref(false);
  const dataList = ref<CompanyProductOrderVo[]>([]);
  const orderingId = ref<string | null>(null);

  /**
   * 每张卡片的色彩主题——浅色背景用于 icon 区域，
   * color 为主色（按钮、数字高亮），darkBg 用于深色模式下 icon 背景
   */
  const themeList = [
    { emoji: "🏠", color: "#4080ff", lightBg: "#e8f0fe", darkBg: "rgba(64,128,255,0.15)" },
    { emoji: "📄", color: "#00b96b", lightBg: "#e6f9f0", darkBg: "rgba(0,185,107,0.15)" },
    { emoji: "🔐", color: "#7c3aed", lightBg: "#f3ecff", darkBg: "rgba(124,58,237,0.15)" },
    { emoji: "💬", color: "#f97316", lightBg: "#fff4e6", darkBg: "rgba(249,115,22,0.15)" },
    { emoji: "⬆️", color: "#e11d48", lightBg: "#fff0f3", darkBg: "rgba(225,29,72,0.15)" },
    { emoji: "🏢", color: "#0891b2", lightBg: "#e0f7fa", darkBg: "rgba(8,145,178,0.15)" },
    { emoji: "💳", color: "#1677ff", lightBg: "#e6f4ff", darkBg: "rgba(22,119,255,0.15)" },
    { emoji: "✅", color: "#16a34a", lightBg: "#f0fdf4", darkBg: "rgba(22,163,74,0.15)" }
  ];

  function getTheme(index: number) {
    return themeList[index % themeList.length];
  }

  function getUsagePercent(item: CompanyProductOrderVo): number {
    const total = Number(item.totalQuota) || 0;
    const used = Number(item.usedQuota) || 0;
    if (total === 0) return 0;
    return Math.min(Math.round((used / total) * 100), 100);
  }

  function getProgressColor(percent: number): string {
    if (percent >= 90) return "#ef4444";
    if (percent >= 70) return "#f59e0b";
    return "#4080ff";
  }

  async function fetchList() {
    loading.value = true;
    try {
      const { data } = await getCompanyProductList();
      dataList.value = data ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function handleOrder(row: CompanyProductOrderVo) {
    if (!row?.id) return;
    orderingId.value = row.id;
    try {
      const quantity = Number(row.minQuantity || 1);
      const res = await createCompanyOrder({ productId: row.id, quantity });
      if (res.code === 0) {
        message("下单成功", { type: "success" });
        fetchList();
      } else {
        message(res.message || "下单失败", { type: "error" });
      }
    } finally {
      orderingId.value = null;
    }
  }

  onMounted(fetchList);

  defineExpose({ refresh: fetchList });
</script>

<template>
  <div v-loading="loading" class="service-order-tab">
    <!-- 页面标题栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">服务订购</h2>
        <span class="page-subtitle">管理和购买企业所需的各类服务配额</span>
      </div>
      <el-tooltip content="刷新" placement="top">
        <el-button class="refresh-btn" :icon="RefreshRight" circle @click="fetchList" />
      </el-tooltip>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && dataList.length === 0" class="empty-wrap">
      <el-empty description="暂无可用服务" />
    </div>

    <!-- 卡片网格 -->
    <div v-else class="cards-grid">
      <div v-for="(item, index) in dataList" :key="item.id" class="service-card">
        <!-- 顶部：图标 + 名称 + 剩余配额 -->
        <div class="card-top">
          <div
            class="product-icon"
            :style="{
              '--icon-bg-light': getTheme(index).lightBg,
              '--icon-bg-dark': getTheme(index).darkBg
            }"
          >
            <span>{{ getTheme(index).emoji }}</span>
          </div>
          <div class="product-meta">
            <p class="product-name" :title="item.productName">{{ item.productName }}</p>
            <p class="product-code">{{ item.productCode }}</p>
          </div>
          <div class="remain-block">
            <span class="remain-label">剩余</span>
            <span class="remain-value" :style="{ color: Number(item.remainQuota) > 0 ? getTheme(index).color : 'var(--el-text-color-disabled)' }">
              {{ Number(item.remainQuota || 0).toLocaleString() }}
            </span>
            <span class="remain-unit">{{ item.unit }}</span>
          </div>
        </div>

        <!-- 分割线 -->
        <el-divider class="card-divider" />

        <!-- 配额进度 -->
        <div class="quota-block">
          <div class="quota-row">
            <div class="quota-item">
              <span class="ql">总配额</span>
              <span class="qv">{{ Number(item.totalQuota || 0).toLocaleString() }}</span>
            </div>
            <div class="quota-item text-right">
              <span class="ql">已使用</span>
              <span class="qv" :style="{ color: getTheme(index).color }">
                {{ Number(item.usedQuota || 0).toLocaleString() }}
              </span>
            </div>
          </div>
          <div class="progress-row">
            <el-progress :percentage="getUsagePercent(item)" :color="getProgressColor(getUsagePercent(item))" :stroke-width="5" :show-text="false" />
            <span class="progress-pct">{{ getUsagePercent(item) }}% 已使用</span>
          </div>
        </div>

        <!-- 价格 -->
        <div class="price-block">
          <span class="price-prefix">单价</span>
          <span class="price-num" :style="{ color: getTheme(index).color }">¥{{ item.unitPrice }}</span>
          <span class="price-suffix">/ {{ item.unit || "次" }}</span>
          <span class="price-divider" />
          <span class="min-qty">最低购买：{{ item.minQuantity }}{{ item.unit }}</span>
        </div>

        <!-- 描述（可选） -->
        <p v-if="item.description" class="card-desc" :title="item.description">
          {{ item.description }}
        </p>

        <!-- 购买按钮 -->
        <el-button
          class="buy-btn"
          :loading="orderingId === item.id"
          :style="{
            '--btn-color': getTheme(index).color,
            '--btn-color-alpha': getTheme(index).darkBg
          }"
          @click="handleOrder(item)"
        >
          <el-icon v-if="orderingId !== item.id" style="margin-right: 4px"><ShoppingCart /></el-icon>
          立即购买
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  /* ─── 整体容器 ─────────────────────────────────────── */
  .service-order-tab {
    min-height: 300px;
    /* 减小内容区域 padding，解决间距过大的问题 */
    padding: 16px 20px;
  }

  /* ─── 页面标题 ─────────────────────────────────────── */
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .header-left {
      display: flex;
      align-items: baseline;
      gap: 10px;
      flex-wrap: wrap;
    }

    .page-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      line-height: 1;
    }

    .page-subtitle {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }

    .refresh-btn {
      color: var(--el-text-color-secondary);
      border-color: var(--el-border-color);
      background: transparent;

      &:hover {
        color: var(--el-color-primary);
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }
    }
  }

  /* ─── 卡片网格 ─────────────────────────────────────── */
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    gap: 14px;
  }

  /* ─── 单张卡片 ─────────────────────────────────────── */
  .service-card {
    /* 浅色：白底 + 明显边框；深色：略亮于背景的填充色 */
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 10px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition:
      box-shadow 0.22s ease,
      transform 0.22s ease,
      border-color 0.22s ease;

    /* 浅色模式：悬浮时加投影 + 上浮 */
    &:hover {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
      border-color: var(--el-border-color-darker);
    }

    /* 深色模式下用更亮的边框让卡片与背景区分 */
    html.dark & {
      background: var(--el-bg-color-overlay);
      border-color: var(--el-border-color-light);

      &:hover {
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
        border-color: var(--el-border-color);
      }
    }
  }

  /* ─── 卡片顶部 ─────────────────────────────────────── */
  .card-top {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .product-icon {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 20px;
    /* 浅色 / 深色自动切换背景 */
    background-color: var(--icon-bg-light);

    html.dark & {
      background-color: var(--icon-bg-dark);
    }
  }

  .product-meta {
    flex: 1;
    min-width: 0;

    .product-name {
      margin: 0 0 2px;
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4;
    }

    .product-code {
      margin: 0;
      font-size: 11px;
      color: var(--el-text-color-placeholder);
      font-family: monospace;
    }
  }

  .remain-block {
    text-align: right;
    flex-shrink: 0;

    .remain-label {
      display: block;
      font-size: 11px;
      color: var(--el-text-color-placeholder);
      margin-bottom: 2px;
    }

    .remain-value {
      font-size: 22px;
      font-weight: 700;
      line-height: 1;
      transition: color 0.2s;
    }

    .remain-unit {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
      margin-left: 2px;
    }
  }

  /* ─── 分割线 ─────────────────────────────────────────── */
  .card-divider {
    margin: 0 !important;
    border-color: var(--el-border-color-lighter) !important;
  }

  /* ─── 配额 ─────────────────────────────────────────── */
  .quota-block {
    .quota-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .quota-item {
      display: flex;
      flex-direction: column;
      gap: 2px;

      &.text-right {
        text-align: right;
      }

      .ql {
        font-size: 11px;
        color: var(--el-text-color-placeholder);
      }

      .qv {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }

    .progress-row {
      position: relative;
      padding-top: 18px;

      .progress-pct {
        position: absolute;
        top: 0;
        right: 0;
        font-size: 11px;
        color: var(--el-text-color-placeholder);
      }
    }
  }

  /* ─── 价格 ─────────────────────────────────────────── */
  .price-block {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 10px;
    border-radius: 6px;
    background: var(--el-fill-color-light);

    .price-prefix {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .price-num {
      font-size: 15px;
      font-weight: 700;
    }

    .price-suffix {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }

    .price-divider {
      flex: 1;
    }

    .min-qty {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      white-space: nowrap;
    }
  }

  /* ─── 描述 ─────────────────────────────────────────── */
  .card-desc {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* ─── 购买按钮 ─────────────────────────────────────── */
  .buy-btn {
    width: 100%;
    height: 36px;
    border-radius: 7px;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.5px;
    margin-top: auto;

    /* 使用主题色作为按钮背景 */
    background: var(--btn-color) !important;
    border-color: var(--btn-color) !important;
    color: #fff !important;

    &:hover {
      filter: brightness(1.1);
    }

    &:active {
      filter: brightness(0.95);
    }

    /* 深色模式下降低亮度避免太刺眼 */
    html.dark & {
      filter: brightness(0.9);

      &:hover {
        filter: brightness(1);
      }
    }
  }

  /* ─── 空状态 ─────────────────────────────────────────── */
  .empty-wrap {
    display: flex;
    justify-content: center;
    padding: 60px 0;
  }
</style>
