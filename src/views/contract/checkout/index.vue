<script setup lang="ts">
  import { ref } from "vue";
  import { useCheckout } from "./utils/hook";
  import type { FormInstance } from "element-plus";
  import { CHECKOUT_TYPE_OPTIONS, DEDUCTION_FEE_TYPE_OPTIONS, FEE_DIRECTION_ENUM, REFUND_FEE_TYPE_OPTIONS } from "@/constants";
  import { checkoutFormRules } from "./utils/rule";

  defineOptions({
    name: "TenantCheckout"
  });

  const formRef = ref<FormInstance>();

  const { loading, submitting, isEdit, initData, form, deductionTotal, refundTotal, finalAmount, canEdit, canSubmit, addFee, removeFee, handleSave, handleSubmit, handleBack } =
    useCheckout();

  /** 提交前验证 */
  async function onSubmit() {
    const valid = await formRef.value?.validate();
    if (valid) {
      handleSubmit();
    }
  }

  /** 保存 */
  async function onSave() {
    const valid = await formRef.value?.validate();
    if (valid) {
      handleSave();
    }
  }

  /** 获取费用类型选项 */
  function getFeeTypeOptions(direction: number) {
    return direction === FEE_DIRECTION_ENUM.DEDUCTION ? DEDUCTION_FEE_TYPE_OPTIONS : REFUND_FEE_TYPE_OPTIONS;
  }
</script>

<template>
  <div v-loading="loading" class="checkout-page">
    <!-- 头部信息 -->
    <el-card class="mb-4" shadow="never">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg font-bold">{{ isEdit ? "编辑退租单" : "新建退租单" }}</span>
          <el-button link @click="handleBack">返回</el-button>
        </div>
      </template>
      <el-descriptions v-if="initData" :column="4" border>
        <el-descriptions-item label="租客姓名">{{ initData.tenantName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ initData.tenantPhone }}</el-descriptions-item>
        <el-descriptions-item label="房间信息" :span="2">{{ initData.roomInfo }}</el-descriptions-item>
        <el-descriptions-item label="合同到期日">{{ initData.leaseEnd }}</el-descriptions-item>
        <el-descriptions-item label="押金金额">
          <span class="text-primary font-bold">¥{{ initData.depositAmount }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="未付账单">
          <span class="text-danger font-bold">¥{{ initData.unpaidAmount }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 退租表单 -->
    <el-card shadow="never">
      <template #header>
        <span class="font-bold">退租信息</span>
      </template>

      <el-form ref="formRef" :model="form" :rules="checkoutFormRules" label-width="100px" :disabled="!canEdit">
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="退租类型" prop="checkoutType">
              <el-select v-model="form.checkoutType" placeholder="请选择退租类型" class="w-full">
                <el-option v-for="item in CHECKOUT_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="实际退租日" prop="actualCheckoutDate">
              <el-date-picker v-model="form.actualCheckoutDate" type="date" placeholder="请选择实际退租日" value-format="YYYY-MM-DD" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="押金金额" prop="depositAmount">
              <el-input-number v-model="form.depositAmount" :min="0" :precision="2" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="退租原因" prop="checkoutReason">
              <el-input v-model="form.checkoutReason" type="textarea" :rows="2" placeholder="请输入退租原因" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 费用明细 -->
        <el-divider content-position="left">费用明细</el-divider>

        <!-- 扣款项 -->
        <div class="mb-4">
          <div class="flex justify-between items-center mb-2">
            <span class="text-danger font-bold">扣款项（租客应付）</span>
            <el-button type="primary" size="small" :disabled="!canEdit" @click="addFee({ feeDirection: FEE_DIRECTION_ENUM.DEDUCTION })">添加扣款</el-button>
          </div>
          <el-table :data="form.feeList.filter(f => f.feeDirection === FEE_DIRECTION_ENUM.DEDUCTION)" border size="small">
            <el-table-column label="费用类型" width="180">
              <template #default="{ row }">
                <el-select v-model="row.feeType" placeholder="请选择" size="small" :disabled="!canEdit">
                  <el-option v-for="item in DEDUCTION_FEE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="费用名称" min-width="200">
              <template #default="{ row }">
                <el-input v-model="row.feeName" placeholder="请输入" size="small" :disabled="!canEdit" />
              </template>
            </el-table-column>
            <el-table-column label="金额" width="150">
              <template #default="{ row }">
                <el-input-number v-model="row.feeAmount" :min="0" :precision="2" controls-position="right" size="small" class="w-full" :disabled="!canEdit" />
              </template>
            </el-table-column>
            <el-table-column label="备注" width="200">
              <template #default="{ row }">
                <el-input v-model="row.remark" placeholder="请输入" size="small" :disabled="!canEdit" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ $index }">
                <el-button
                  type="danger"
                  link
                  size="small"
                  :disabled="!canEdit"
                  @click="
                    removeFee(
                      form.feeList.findIndex(
                        (f, i) =>
                          f.feeDirection === FEE_DIRECTION_ENUM.DEDUCTION && form.feeList.filter(ff => ff.feeDirection === FEE_DIRECTION_ENUM.DEDUCTION).indexOf(f) === $index
                      )
                    )
                  "
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="text-right mt-2">
            <span>扣款合计：</span>
            <span class="text-danger text-lg font-bold">¥{{ deductionTotal.toFixed(2) }}</span>
          </div>
        </div>

        <!-- 退款项 -->
        <div class="mb-4">
          <div class="flex justify-between items-center mb-2">
            <span class="text-success font-bold">退款项（退还租客）</span>
            <el-button type="success" size="small" :disabled="!canEdit" @click="addFee({ feeDirection: FEE_DIRECTION_ENUM.REFUND })">添加退款</el-button>
          </div>
          <el-table :data="form.feeList.filter(f => f.feeDirection === FEE_DIRECTION_ENUM.REFUND)" border size="small">
            <el-table-column label="费用类型" width="180">
              <template #default="{ row }">
                <el-select v-model="row.feeType" placeholder="请选择" size="small" :disabled="!canEdit">
                  <el-option v-for="item in REFUND_FEE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="费用名称" min-width="200">
              <template #default="{ row }">
                <el-input v-model="row.feeName" placeholder="请输入" size="small" :disabled="!canEdit" />
              </template>
            </el-table-column>
            <el-table-column label="金额" width="150">
              <template #default="{ row }">
                <el-input-number v-model="row.feeAmount" :min="0" :precision="2" controls-position="right" size="small" class="w-full" :disabled="!canEdit" />
              </template>
            </el-table-column>
            <el-table-column label="备注" width="200">
              <template #default="{ row }">
                <el-input v-model="row.remark" placeholder="请输入" size="small" :disabled="!canEdit" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ $index }">
                <el-button
                  type="danger"
                  link
                  size="small"
                  :disabled="!canEdit"
                  @click="
                    removeFee(
                      form.feeList.findIndex(
                        (f, i) => f.feeDirection === FEE_DIRECTION_ENUM.REFUND && form.feeList.filter(ff => ff.feeDirection === FEE_DIRECTION_ENUM.REFUND).indexOf(f) === $index
                      )
                    )
                  "
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="text-right mt-2">
            <span>退款合计：</span>
            <span class="text-success text-lg font-bold">¥{{ refundTotal.toFixed(2) }}</span>
          </div>
        </div>

        <!-- 结算汇总 -->
        <el-card class="settlement-card" shadow="never">
          <div class="flex justify-between items-center">
            <div>
              <span class="text-gray-500">最终结算：</span>
              <span class="text-2xl font-bold" :class="finalAmount >= 0 ? 'text-danger' : 'text-success'">{{ finalAmount >= 0 ? "+" : "" }}¥{{ finalAmount.toFixed(2) }}</span>
            </div>
            <div class="text-gray-500 text-sm">
              {{ finalAmount >= 0 ? "租客需补缴" : "退还租客" }}
            </div>
          </div>
        </el-card>

        <!-- 备注 -->
        <el-row :gutter="24" class="mt-4">
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 底部操作栏 -->
    <div class="footer-bar">
      <el-button @click="handleBack">取消</el-button>
<!--      <el-button type="info" :loading="submitting" :disabled="!canEdit" @click="onSave">保存草稿</el-button>-->
      <el-button type="primary" :loading="submitting" :disabled="!canSubmit" @click="onSubmit">提交审批</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .checkout-page {
    padding: 16px;
    padding-bottom: 80px;
  }

  .settlement-card {
    background: var(--el-fill-color-light);

    :deep(.el-card__body) {
      padding: 16px 24px;
    }
  }

  .footer-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 24px;
    background: var(--el-bg-color);
    border-top: 1px solid var(--el-border-color-light);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    z-index: 100;
  }

  .text-primary {
    color: var(--el-color-primary);
  }

  .text-danger {
    color: var(--el-color-danger);
  }

  .text-success {
    color: var(--el-color-success);
  }

  .text-gray-500 {
    color: var(--el-text-color-secondary);
  }
</style>
