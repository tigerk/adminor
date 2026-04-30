<template>
  <div v-loading="loading" class="owner-detail-finance-tab">
    <div class="owner-detail-finance-toolbar">
      <div class="owner-detail-finance-toolbar__title">
        <span class="owner-detail-finance-toolbar__main">业主提现</span>
        <span class="owner-detail-finance-toolbar__sub">展示当前业主账户余额、提现申请、收款信息和账户流水。</span>
      </div>
      <div class="owner-detail-finance-card__actions">
        <el-button :disabled="!ownerIdText" @click="fetchData">刷新</el-button>
        <el-button type="primary" :disabled="!ownerIdText" @click="openWithdrawDialog">发起提现</el-button>
      </div>
    </div>

    <div class="owner-detail-finance-summary">
      <div class="owner-detail-finance-summary__card">
        <div class="owner-detail-finance-summary__label">可提现余额</div>
        <div class="owner-detail-finance-summary__value is-income">{{ moneyText(summary.availableAmount) }}</div>
      </div>
      <div class="owner-detail-finance-summary__card">
        <div class="owner-detail-finance-summary__label">冻结金额</div>
        <div class="owner-detail-finance-summary__value is-warning">{{ moneyText(summary.frozenAmount) }}</div>
      </div>
      <div class="owner-detail-finance-summary__card">
        <div class="owner-detail-finance-summary__label">提现申请数</div>
        <div class="owner-detail-finance-summary__value">{{ summary.applyCount || 0 }}</div>
      </div>
      <div class="owner-detail-finance-summary__card">
        <div class="owner-detail-finance-summary__label">待审批</div>
        <div class="owner-detail-finance-summary__value is-warning">{{ summary.pendingApprovalCount || 0 }}</div>
      </div>
      <div class="owner-detail-finance-summary__card">
        <div class="owner-detail-finance-summary__label">申请总金额</div>
        <div class="owner-detail-finance-summary__value">{{ moneyText(summary.totalApplyAmount) }}</div>
      </div>
      <div class="owner-detail-finance-summary__card">
        <div class="owner-detail-finance-summary__label">实际到账总额</div>
        <div class="owner-detail-finance-summary__value is-income">{{ moneyText(summary.totalActualAmount) }}</div>
      </div>
    </div>

    <div v-if="detailList.length" class="owner-detail-finance-list">
      <div v-for="apply in detailList" :key="apply.applyId || apply.applyNo" class="owner-detail-finance-card">
        <div class="owner-detail-finance-card__header">
          <div>
            <div class="owner-detail-finance-card__title">
              <span class="owner-detail-finance-card__no">{{ apply.applyNo || "未生成单号" }}</span>
              <el-tag :type="approvalStatusTagType(apply.approvalStatus)" effect="light">{{ approvalStatusText(apply.approvalStatus) }}</el-tag>
              <el-tag :type="withdrawStatusTagType(apply.withdrawStatus)" effect="light">{{ withdrawStatusText(apply.withdrawStatus) }}</el-tag>
            </div>
            <div class="owner-detail-finance-card__meta">
              <span>申请时间：{{ apply.appliedAt || apply.createAt || "-" }}</span>
              <span>审批时间：{{ apply.approvedAt || "-" }}</span>
              <span>打款时间：{{ apply.paidAt || "-" }}</span>
            </div>
          </div>
        </div>

        <div class="owner-detail-finance-card__body">
          <div class="owner-detail-finance-metrics">
            <div class="owner-detail-finance-metric">
              <div class="owner-detail-finance-metric__label">申请金额</div>
              <div class="owner-detail-finance-metric__value">{{ moneyText(apply.applyAmount) }}</div>
            </div>
            <div class="owner-detail-finance-metric">
              <div class="owner-detail-finance-metric__label">手续费</div>
              <div class="owner-detail-finance-metric__value is-warning">{{ moneyText(apply.feeAmount) }}</div>
            </div>
            <div class="owner-detail-finance-metric">
              <div class="owner-detail-finance-metric__label">实际到账</div>
              <div class="owner-detail-finance-metric__value is-income">{{ moneyText(apply.actualAmount) }}</div>
            </div>
            <div class="owner-detail-finance-metric">
              <div class="owner-detail-finance-metric__label">打款渠道</div>
              <div class="owner-detail-finance-metric__value">{{ apply.channel || "-" }}</div>
            </div>
          </div>

          <div class="owner-detail-finance-info-grid">
            <div class="owner-detail-finance-info">
              <span class="owner-detail-finance-info__label">收款人</span>
              <span class="owner-detail-finance-info__value">{{ apply.payeeName || "-" }}</span>
            </div>
            <div class="owner-detail-finance-info">
              <span class="owner-detail-finance-info__label">收款账号</span>
              <span class="owner-detail-finance-info__value">{{ apply.payeeAccountNo || "-" }}</span>
            </div>
            <div class="owner-detail-finance-info">
              <span class="owner-detail-finance-info__label">开户行</span>
              <span class="owner-detail-finance-info__value">{{ apply.payeeBankName || "-" }}</span>
            </div>
            <div class="owner-detail-finance-info">
              <span class="owner-detail-finance-info__label">交易流水</span>
              <span class="owner-detail-finance-info__value">{{ apply.thirdTradeNo || "-" }}</span>
            </div>
          </div>

          <div v-if="apply.failureReason" class="owner-detail-finance-info">
            <span class="owner-detail-finance-info__label">失败原因</span>
            <span class="owner-detail-finance-info__value">{{ apply.failureReason }}</span>
          </div>

          <div class="owner-detail-finance-section">
            <div class="owner-detail-finance-section__title">
              <span>账户流水</span>
              <el-tag size="small" type="info" effect="plain">{{ apply.flowList?.length || 0 }} 笔</el-tag>
            </div>
            <el-table :data="apply.flowList || []" border stripe empty-text="暂无账户流水">
              <el-table-column prop="changeType" label="变动类型" min-width="120" />
              <el-table-column prop="flowDirection" label="方向" width="90" />
              <el-table-column label="金额" width="130" align="right">
                <template #default="{ row }">{{ moneyText(row.amount) }}</template>
              </el-table-column>
              <el-table-column label="可用余额变化" min-width="180">
                <template #default="{ row }">{{ moneyText(row.availableBefore) }} → {{ moneyText(row.availableAfter) }}</template>
              </el-table-column>
              <el-table-column label="冻结金额变化" min-width="180">
                <template #default="{ row }">{{ moneyText(row.frozenBefore) }} → {{ moneyText(row.frozenAfter) }}</template>
              </el-table-column>
              <el-table-column prop="createAt" label="时间" min-width="160" />
              <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
            </el-table>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="owner-detail-finance-empty">
      <el-empty description="当前业主暂无提现记录" :image-size="90" />
    </div>

    <el-dialog v-model="withdrawDialogVisible" title="发起业主提现" width="560px" append-to-body>
      <el-form ref="withdrawFormRef" :model="withdrawForm" :rules="withdrawRules" label-width="100px">
        <el-form-item label="申请金额" prop="applyAmount">
          <el-input-number v-model="withdrawForm.applyAmount" class="!w-full" :min="0" :precision="2" :step="100" />
        </el-form-item>
        <el-form-item label="手续费">
          <el-input-number v-model="withdrawForm.feeAmount" class="!w-full" :min="0" :precision="2" :step="10" />
        </el-form-item>
        <el-form-item label="预计到账">
          <el-input :model-value="moneyText(expectedActualAmount)" disabled />
        </el-form-item>
        <el-form-item label="收款人" prop="payeeName">
          <el-input v-model="withdrawForm.payeeName" placeholder="请输入收款人" />
        </el-form-item>
        <el-form-item label="收款账号" prop="payeeAccountNo">
          <el-input v-model="withdrawForm.payeeAccountNo" placeholder="请输入银行卡号或收款账号" />
        </el-form-item>
        <el-form-item label="开户行" prop="payeeBankName">
          <el-input v-model="withdrawForm.payeeBankName" placeholder="请输入开户行" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="withdrawForm.remark" type="textarea" :rows="3" maxlength="300" show-word-limit placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="withdrawDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitWithdraw">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref, watch } from "vue";
  import type { FormInstance, FormRules } from "element-plus";
  import { createOwnerWithdraw, getOwnerWithdrawDetail, getOwnerWithdrawPage, getOwnerWithdrawSummary } from "@/api/owner/owner";
  import { message } from "@/utils/message";
  import { BizApprovalStatusEnumMeta } from "@/types/generated/enum.meta";
  import type { OwnerWithdrawApplyDetailVo, OwnerWithdrawApplyListVo, OwnerWithdrawApplyQueryDto, OwnerWithdrawCreateDto, OwnerWithdrawSummaryVo } from "@/types/generated";
  import "./ownerDetailFinanceTab.scss";

  defineOptions({ name: "OwnerWithdrawTab" });

  const props = defineProps<{
    ownerId?: string | number;
    contractId?: string | number;
    defaultPayeeName?: string;
    defaultPayeeAccountNo?: string;
    defaultPayeeBankName?: string;
  }>();

  const loading = ref(false);
  const submitting = ref(false);
  const withdrawDialogVisible = ref(false);
  const summary = ref<OwnerWithdrawSummaryVo>({});
  const detailList = ref<OwnerWithdrawApplyDetailVo[]>([]);
  const withdrawFormRef = ref<FormInstance>();
  const ownerIdText = computed(() => (props.ownerId ? String(props.ownerId) : ""));
  const contractIdText = computed(() => (props.contractId ? String(props.contractId) : ""));
  const withdrawForm = reactive<OwnerWithdrawCreateDto>({
    ownerId: "",
    applyAmount: undefined,
    feeAmount: 0,
    payeeName: "",
    payeeAccountNo: "",
    payeeBankName: "",
    remark: ""
  });
  const withdrawRules: FormRules<OwnerWithdrawCreateDto> = {
    applyAmount: [{ required: true, message: "请输入申请金额", trigger: "change" }],
    payeeName: [{ required: true, message: "请输入收款人", trigger: "blur" }],
    payeeAccountNo: [{ required: true, message: "请输入收款账号", trigger: "blur" }],
    payeeBankName: [{ required: true, message: "请输入开户行", trigger: "blur" }]
  };
  const expectedActualAmount = computed(() => Math.max(0, Number(withdrawForm.applyAmount || 0) - Number(withdrawForm.feeAmount || 0)));

  function buildQuery(): OwnerWithdrawApplyQueryDto {
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
      const [pageResp, summaryResp] = await Promise.all([getOwnerWithdrawPage(query), getOwnerWithdrawSummary(query)]);
      summary.value = summaryResp.data || {};
      detailList.value = await fetchDetailList(pageResp.data?.list || []);
    } finally {
      loading.value = false;
    }
  }

  async function fetchDetailList(list: OwnerWithdrawApplyListVo[]) {
    return Promise.all(
      list.map(async item => {
        if (!item.applyId) return item as OwnerWithdrawApplyDetailVo;
        const resp = await getOwnerWithdrawDetail({ applyId: item.applyId });
        return resp.data || (item as OwnerWithdrawApplyDetailVo);
      })
    );
  }

  function openWithdrawDialog() {
    withdrawForm.ownerId = ownerIdText.value;
    withdrawForm.applyAmount = undefined;
    withdrawForm.feeAmount = 0;
    withdrawForm.payeeName = props.defaultPayeeName || "";
    withdrawForm.payeeAccountNo = props.defaultPayeeAccountNo || "";
    withdrawForm.payeeBankName = props.defaultPayeeBankName || "";
    withdrawForm.remark = "";
    withdrawDialogVisible.value = true;
  }

  async function submitWithdraw() {
    await withdrawFormRef.value?.validate();
    submitting.value = true;
    try {
      const resp = await createOwnerWithdraw({ ...withdrawForm, ownerId: ownerIdText.value });
      if (resp.code === 0) {
        message("提现申请已提交", { type: "success" });
        withdrawDialogVisible.value = false;
        await fetchData();
      } else {
        message(resp.message || "提现申请提交失败", { type: "error" });
      }
    } finally {
      submitting.value = false;
    }
  }

  function moneyText(value?: number | string | null) {
    const amount = Number(value ?? 0);
    return `¥${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}`;
  }

  function metaName(meta: Record<string, { code?: unknown; name?: string }>, code?: unknown) {
    return Object.values(meta).find(item => item.code === code)?.name || "-";
  }

  function approvalStatusText(code?: number) {
    return metaName(BizApprovalStatusEnumMeta, code);
  }

  function approvalStatusTagType(code?: number) {
    if (code === BizApprovalStatusEnumMeta.APPROVED.code) return "success";
    if (code === BizApprovalStatusEnumMeta.REJECTED.code) return "danger";
    if (code === BizApprovalStatusEnumMeta.WITHDRAWN.code) return "info";
    return "warning";
  }

  function withdrawStatusText(code?: number) {
    return (
      {
        0: "待处理",
        1: "打款中",
        2: "成功",
        3: "失败",
        4: "已取消"
      }[Number(code)] || "-"
    );
  }

  function withdrawStatusTagType(code?: number) {
    if (code === 2) return "success";
    if (code === 3) return "danger";
    if (code === 4) return "info";
    return "warning";
  }

  watch(() => [props.ownerId, props.contractId], fetchData, { immediate: true });
</script>
