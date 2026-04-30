<template>
  <div v-loading="loading" class="owner-detail-finance-tab">
    <div class="owner-detail-finance-toolbar">
      <div class="owner-detail-finance-toolbar__title">
        <span class="owner-detail-finance-toolbar__main">包租应付账单</span>
        <span class="owner-detail-finance-toolbar__sub">展示当前包租合同下应付业主的账期、付款进度、费用明细和付款记录。</span>
      </div>
      <el-button :disabled="!ownerIdText" @click="fetchData">刷新</el-button>
    </div>

    <div class="owner-detail-finance-summary">
      <div class="owner-detail-finance-summary__card">
        <div class="owner-detail-finance-summary__label">应付单数</div>
        <div class="owner-detail-finance-summary__value">{{ summary.billCount || 0 }}</div>
      </div>
      <div class="owner-detail-finance-summary__card">
        <div class="owner-detail-finance-summary__label">应付总额</div>
        <div class="owner-detail-finance-summary__value">{{ moneyText(summary.totalPayableAmount) }}</div>
      </div>
      <div class="owner-detail-finance-summary__card">
        <div class="owner-detail-finance-summary__label">已付总额</div>
        <div class="owner-detail-finance-summary__value is-income">{{ moneyText(summary.totalPaidAmount) }}</div>
      </div>
      <div class="owner-detail-finance-summary__card">
        <div class="owner-detail-finance-summary__label">未付总额</div>
        <div class="owner-detail-finance-summary__value is-warning">{{ moneyText(summary.totalUnpaidAmount) }}</div>
      </div>
      <div class="owner-detail-finance-summary__card">
        <div class="owner-detail-finance-summary__label">作废单数</div>
        <div class="owner-detail-finance-summary__value">{{ summary.voidedCount || 0 }}</div>
      </div>
    </div>

    <div v-if="detailList.length" class="owner-detail-finance-list">
      <div v-for="bill in detailList" :key="bill.billId || bill.billNo" class="owner-detail-finance-card">
        <div class="owner-detail-finance-card__header">
          <div>
            <div class="owner-detail-finance-card__title">
              <span class="owner-detail-finance-card__no">{{ bill.billNo || "未生成单号" }}</span>
              <el-tag :type="paymentStatusTagType(bill.paymentStatus)" effect="light">{{ paymentStatusText(bill.paymentStatus) }}</el-tag>
              <el-tag :type="billStatusTagType(bill.billStatus)" effect="light">{{ billStatusText(bill.billStatus) }}</el-tag>
            </div>
            <div class="owner-detail-finance-card__meta">
              <span>{{ bill.subjectName || "未关联房源" }}</span>
              <span>账期：{{ dateRangeText(bill.billStartDate, bill.billEndDate) }}</span>
              <span>应付日期：{{ bill.dueDate || "-" }}</span>
              <span>生成：{{ bill.generatedAt || "-" }}</span>
            </div>
          </div>
        </div>

        <div class="owner-detail-finance-card__body">
          <div class="owner-detail-finance-metrics">
            <div class="owner-detail-finance-metric">
              <div class="owner-detail-finance-metric__label">应付金额</div>
              <div class="owner-detail-finance-metric__value">{{ moneyText(bill.payableAmount) }}</div>
            </div>
            <div class="owner-detail-finance-metric">
              <div class="owner-detail-finance-metric__label">已付金额</div>
              <div class="owner-detail-finance-metric__value is-income">{{ moneyText(bill.paidAmount) }}</div>
            </div>
            <div class="owner-detail-finance-metric">
              <div class="owner-detail-finance-metric__label">未付金额</div>
              <div class="owner-detail-finance-metric__value is-warning">{{ moneyText(bill.unpaidAmount) }}</div>
            </div>
            <div class="owner-detail-finance-metric">
              <div class="owner-detail-finance-metric__label">调整金额</div>
              <div class="owner-detail-finance-metric__value">{{ moneyText(bill.adjustAmount) }}</div>
            </div>
          </div>

          <div v-if="bill.billStatus === 2" class="owner-detail-finance-info-grid">
            <div class="owner-detail-finance-info">
              <span class="owner-detail-finance-info__label">作废原因</span>
              <span class="owner-detail-finance-info__value">{{ bill.voidReason || "-" }}</span>
            </div>
            <div class="owner-detail-finance-info">
              <span class="owner-detail-finance-info__label">作废人</span>
              <span class="owner-detail-finance-info__value">{{ bill.voidByName || bill.voidBy || "-" }}</span>
            </div>
            <div class="owner-detail-finance-info">
              <span class="owner-detail-finance-info__label">作废时间</span>
              <span class="owner-detail-finance-info__value">{{ bill.voidAt || "-" }}</span>
            </div>
          </div>

          <div class="owner-detail-finance-section">
            <div class="owner-detail-finance-section__title">
              <span>费用明细</span>
              <el-tag size="small" type="info" effect="plain">{{ bill.feeList?.length || 0 }} 项</el-tag>
            </div>
            <el-table :data="bill.feeList || []" border stripe empty-text="暂无费用明细">
              <el-table-column prop="feeName" label="费用名称" min-width="160" />
              <el-table-column label="收支" width="90">
                <template #default="{ row }">
                  <el-tag :type="directionTagType(row.direction)" effect="light">{{ directionText(row.direction) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="金额" width="130" align="right">
                <template #default="{ row }">{{ moneyText(row.amount) }}</template>
              </el-table-column>
              <el-table-column prop="bizDate" label="业务日期" width="120" />
              <el-table-column prop="formulaSnapshot" label="计算说明" min-width="220" show-overflow-tooltip />
              <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
            </el-table>
          </div>

          <div class="owner-detail-finance-section">
            <div class="owner-detail-finance-section__title">
              <span>付款记录</span>
              <el-tag size="small" type="info" effect="plain">{{ bill.paymentList?.length || 0 }} 笔</el-tag>
            </div>
            <el-table :data="bill.paymentList || []" border stripe empty-text="暂无付款记录">
              <el-table-column prop="paymentNo" label="付款单号" min-width="180" />
              <el-table-column label="付款金额" width="130" align="right">
                <template #default="{ row }">{{ moneyText(row.payAmount) }}</template>
              </el-table-column>
              <el-table-column prop="payChannel" label="付款渠道" width="120" />
              <el-table-column prop="payAt" label="付款时间" min-width="160" />
              <el-table-column prop="thirdTradeNo" label="交易流水号" min-width="180" show-overflow-tooltip />
              <el-table-column label="凭证" min-width="150">
                <template #default="{ row }">
                  <div v-if="row.voucherUrls?.length" class="voucher-list">
                    <el-image
                      v-for="(url, index) in row.voucherUrls"
                      :key="`${row.paymentId}-${url}`"
                      class="voucher-list__image"
                      :src="url"
                      :preview-src-list="row.voucherUrls"
                      :initial-index="Number(index)"
                      fit="cover"
                      preview-teleported
                    />
                  </div>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
            </el-table>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="owner-detail-finance-empty">
      <el-empty description="当前业主合同暂无包租应付账单" :image-size="90" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from "vue";
  import { getOwnerPayableBillDetail, getOwnerPayableBillPage, getOwnerPayableBillSummary } from "@/api/owner/owner";
  import { OwnerPayableBillPaymentStatusEnumMeta, OwnerPayableBillStatusEnumMeta } from "@/types/generated/enum.meta";
  import type { OwnerPayableBillDetailVo, OwnerPayableBillListVo, OwnerPayableBillQueryDto, OwnerPayableBillSummaryVo } from "@/types/generated";
  import "./ownerDetailFinanceTab.scss";

  defineOptions({ name: "OwnerPayableBillTab" });

  const props = defineProps<{ ownerId?: string | number; contractId?: string | number }>();

  const loading = ref(false);
  const summary = ref<OwnerPayableBillSummaryVo>({});
  const detailList = ref<OwnerPayableBillDetailVo[]>([]);
  const ownerIdText = computed(() => (props.ownerId ? String(props.ownerId) : ""));
  const contractIdText = computed(() => (props.contractId ? String(props.contractId) : ""));

  function buildQuery(): OwnerPayableBillQueryDto {
    return {
      currentPage: "1",
      pageSize: "10",
      ownerId: ownerIdText.value,
      contractId: contractIdText.value || undefined
    };
  }

  async function fetchData() {
    if (!ownerIdText.value) {
      summary.value = {};
      detailList.value = [];
      return;
    }

    loading.value = true;
    try {
      const query = buildQuery();
      const [pageResp, summaryResp] = await Promise.all([getOwnerPayableBillPage(query), getOwnerPayableBillSummary(query)]);
      summary.value = summaryResp.data || {};
      detailList.value = await fetchDetailList(pageResp.data?.list || []);
    } finally {
      loading.value = false;
    }
  }

  async function fetchDetailList(list: OwnerPayableBillListVo[]) {
    return Promise.all(
      list.map(async item => {
        if (!item.billId) return item as OwnerPayableBillDetailVo;
        const resp = await getOwnerPayableBillDetail({ billId: item.billId });
        return resp.data || (item as OwnerPayableBillDetailVo);
      })
    );
  }

  function moneyText(value?: number | string | null) {
    const amount = Number(value ?? 0);
    return `¥${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}`;
  }

  function dateRangeText(start?: string, end?: string) {
    return `${start || "-"} 至 ${end || "-"}`;
  }

  function metaName(meta: Record<string, { code?: unknown; name?: string }>, code?: unknown) {
    return Object.values(meta).find(item => item.code === code)?.name || "-";
  }

  function paymentStatusText(code?: number) {
    return metaName(OwnerPayableBillPaymentStatusEnumMeta, code);
  }

  function billStatusText(code?: number) {
    return metaName(OwnerPayableBillStatusEnumMeta, code);
  }

  function paymentStatusTagType(code?: number) {
    if (code === OwnerPayableBillPaymentStatusEnumMeta.PAID.code) return "success";
    if (code === OwnerPayableBillPaymentStatusEnumMeta.PART_PAID.code) return "warning";
    return "danger";
  }

  function billStatusTagType(code?: number) {
    return code === OwnerPayableBillStatusEnumMeta.VOIDED.code ? "info" : "success";
  }

  function directionText(direction?: string) {
    if (direction === "IN") return "收入";
    if (direction === "OUT") return "支出";
    return direction || "-";
  }

  function directionTagType(direction?: string) {
    return direction === "IN" ? "success" : direction === "OUT" ? "danger" : "info";
  }

  watch(() => [props.ownerId, props.contractId], fetchData, { immediate: true });
</script>

<style scoped lang="scss">
  .voucher-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .voucher-list__image {
    width: 38px;
    height: 38px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
  }
</style>
