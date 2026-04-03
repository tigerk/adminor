<template>
  <div>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="提现单号">{{ formInline.applyNo || "-" }}</el-descriptions-item>
      <el-descriptions-item label="业主">{{ formInline.ownerName || "-" }}</el-descriptions-item>
      <el-descriptions-item label="联系电话">{{ formInline.ownerPhone || "-" }}</el-descriptions-item>
      <el-descriptions-item label="收款人">{{ formInline.payeeName || "-" }}</el-descriptions-item>
      <el-descriptions-item label="银行卡号">{{ formInline.payeeAccountNo || "-" }}</el-descriptions-item>
      <el-descriptions-item label="开户行">{{ formInline.payeeBankName || "-" }}</el-descriptions-item>
      <el-descriptions-item label="申请金额">{{ moneyText(formInline.applyAmount) }}</el-descriptions-item>
      <el-descriptions-item label="实际到账">{{ moneyText(formInline.actualAmount) }}</el-descriptions-item>
      <el-descriptions-item label="审批状态">{{ approvalStatusText(formInline.approvalStatus) }}</el-descriptions-item>
      <el-descriptions-item label="打款状态">{{ withdrawStatusText(formInline.withdrawStatus) }}</el-descriptions-item>
      <el-descriptions-item label="三方流水号">{{ formInline.thirdTradeNo || "-" }}</el-descriptions-item>
      <el-descriptions-item label="打款渠道">{{ formInline.channel || "-" }}</el-descriptions-item>
      <el-descriptions-item label="申请时间">{{ formInline.appliedAt || "-" }}</el-descriptions-item>
      <el-descriptions-item label="打款时间">{{ formInline.paidAt || "-" }}</el-descriptions-item>
      <el-descriptions-item label="失败原因" :span="2">{{ formInline.failureReason || "-" }}</el-descriptions-item>
      <el-descriptions-item label="备注" :span="2">{{ formInline.remark || "-" }}</el-descriptions-item>
    </el-descriptions>

    <div class="detail-actions">
      <el-button v-for="action in detailActions" :key="action.type" :type="action.buttonType" plain @click="emit('operate', formInline, action.type)">
        {{ action.label }}
      </el-button>
    </div>

    <div class="section-title">账户流水</div>
    <el-table :data="formInline.flowList || []" border>
      <el-table-column prop="changeType" label="变动类型" min-width="150" />
      <el-table-column prop="flowDirection" label="方向" width="100" align="center" />
      <el-table-column label="金额" min-width="120" align="right">
        <template #default="{ row }">{{ moneyText(row.amount) }}</template>
      </el-table-column>
      <el-table-column label="可用余额" min-width="160" align="right">
        <template #default="{ row }">{{ moneyText(row.availableBefore) }} → {{ moneyText(row.availableAfter) }}</template>
      </el-table-column>
      <el-table-column label="冻结余额" min-width="160" align="right">
        <template #default="{ row }">{{ moneyText(row.frozenBefore) }} → {{ moneyText(row.frozenAfter) }}</template>
      </el-table-column>
      <el-table-column prop="createTime" label="时间" min-width="160" />
      <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
    </el-table>
  </div>
</template>

<script setup lang="ts">
  import { computed } from "vue";
  import type { OwnerWithdrawApplyDetailVo, OwnerWithdrawOperateEnum } from "@/types/generated";

  defineOptions({ name: "OwnerWithdrawDetailDialog" });

  const props = defineProps<{ formInline: OwnerWithdrawApplyDetailVo }>();
  const emit = defineEmits<{
    operate: [row: OwnerWithdrawApplyDetailVo, type: OwnerWithdrawOperateEnum | "CANCEL" | "APPROVE" | "REJECT" | "PAYING" | "SUCCESS" | "FAIL"];
  }>();
  const moneyText = (value?: number) => `¥${Number(value || 0).toFixed(2)}`;
  const approvalStatusMap: Record<number, string> = { 1: "审批中", 2: "已通过", 3: "已驳回", 4: "已撤回" };
  const withdrawStatusMap: Record<number, string> = { 0: "待处理", 1: "打款中", 2: "成功", 3: "失败", 4: "已取消" };
  const approvalStatusText = (value?: number) => approvalStatusMap[value ?? 0] || `状态${value ?? "-"}`;
  const withdrawStatusText = (value?: number) => withdrawStatusMap[value ?? 0] || `状态${value ?? "-"}`;
  const rowActions = (row?: Partial<OwnerWithdrawApplyDetailVo>) => {
    if (!row?.applyId) return [];
    if (row.approvalStatus === 1) return [{ label: "通过", type: "APPROVE", buttonType: "primary" }, { label: "驳回", type: "REJECT", buttonType: "danger" }, { label: "取消", type: "info", buttonType: "info" }] as const;
    if (row.approvalStatus === 2 && row.withdrawStatus === 0) return [{ label: "标记打款中", type: "PAYING", buttonType: "warning" }] as const;
    if (row.approvalStatus === 2 && row.withdrawStatus === 1) return [{ label: "打款成功", type: "success", buttonType: "success" }, { label: "打款失败", type: "FAIL", buttonType: "danger" }] as const;
    return [];
  };
  const detailActions = computed(() => rowActions(props.formInline));
</script>

<style scoped lang="scss">
  .detail-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin: 18px 0 8px;
  }

  .section-title {
    margin: 20px 0 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
</style>
