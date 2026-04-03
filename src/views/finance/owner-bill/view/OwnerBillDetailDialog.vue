<template>
  <div>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="账单编号">{{ formInline.billNo || "-" }}</el-descriptions-item>
      <el-descriptions-item label="业主">{{ formInline.ownerName || "-" }}</el-descriptions-item>
      <el-descriptions-item label="联系电话">{{ formInline.ownerPhone || "-" }}</el-descriptions-item>
      <el-descriptions-item label="合同编号">{{ formInline.contractNo || "-" }}</el-descriptions-item>
      <el-descriptions-item label="合作模式">{{ cooperationModeLabelMap[formInline.cooperationMode || "LIGHT_MANAGED"] }}</el-descriptions-item>
      <el-descriptions-item label="账期">{{ formInline.billStart || "-" }} 至 {{ formInline.billEnd || "-" }}</el-descriptions-item>
      <el-descriptions-item label="收入金额">{{ moneyText(formInline.incomeAmount) }}</el-descriptions-item>
      <el-descriptions-item label="减免金额">{{ moneyText(formInline.reductionAmount) }}</el-descriptions-item>
      <el-descriptions-item label="费用金额">{{ moneyText(formInline.expenseAmount) }}</el-descriptions-item>
      <el-descriptions-item label="调账金额">{{ moneyText(formInline.adjustAmount) }}</el-descriptions-item>
      <el-descriptions-item label="应付金额">{{ moneyText(formInline.payableAmount) }}</el-descriptions-item>
      <el-descriptions-item label="可提现金额">{{ moneyText(formInline.withdrawableAmount) }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ formInline.createTime || "-" }}</el-descriptions-item>
      <el-descriptions-item label="更新时间">{{ formInline.updateTime || "-" }}</el-descriptions-item>
      <el-descriptions-item label="备注" :span="2">{{ formInline.remark || "-" }}</el-descriptions-item>
    </el-descriptions>

    <div class="section-title">账单明细</div>
    <el-table :data="formInline.lineList || []" border>
      <el-table-column prop="itemName" label="项目" min-width="160" />
      <el-table-column prop="itemType" label="类型" min-width="120" />
      <el-table-column prop="direction" label="方向" width="90" align="center" />
      <el-table-column label="金额" min-width="120" align="right">
        <template #default="{ row }">{{ moneyText(row.amount) }}</template>
      </el-table-column>
      <el-table-column prop="bizDate" label="业务日期" min-width="120" />
      <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
    </el-table>

    <div class="section-title">减免明细</div>
    <el-table :data="formInline.reductionList || []" border>
      <el-table-column prop="reductionName" label="减免项目" min-width="160" />
      <el-table-column prop="reductionType" label="减免类型" min-width="140" />
      <el-table-column label="金额" min-width="120" align="right">
        <template #default="{ row }">{{ moneyText(row.amount) }}</template>
      </el-table-column>
      <el-table-column prop="bizDate" label="业务日期" min-width="120" />
      <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
    </el-table>

    <div class="footer-row">
      <el-button @click="$emit('close', { command: 'cancel' })">关闭</el-button>
      <el-button type="primary" :disabled="!canWithdraw(formInline)" @click="goWithdraw(formInline)">去提现</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from "vue-router";
  import type { OwnerBillDetailVo } from "@/types/generated";

  defineOptions({ name: "OwnerBillDetailDialog" });

  const props = defineProps<{ formInline: OwnerBillDetailVo }>();
  defineEmits(["close"]);
  const router = useRouter();
  const cooperationModeLabelMap = { LIGHT_MANAGED: "轻托管", MASTER_LEASE: "包租" } as const;
  const moneyText = (value?: number) => `¥${Number(value || 0).toFixed(2)}`;
  const canWithdraw = (data?: OwnerBillDetailVo) => Number(data?.withdrawableAmount || 0) > 0 && !!data?.ownerId;
  const goWithdraw = (data?: OwnerBillDetailVo) => {
    if (!data?.ownerId) return;
    router.push({ path: "/finance/owner-withdraw", query: { ownerId: data.ownerId, contractId: data.contractId, applyAmount: String(data.withdrawableAmount || 0), openCreate: "1" } });
  };
</script>

<style scoped lang="scss">
  .section-title {
    margin: 20px 0 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .footer-row {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;
  }
</style>
