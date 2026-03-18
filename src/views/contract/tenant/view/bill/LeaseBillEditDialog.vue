<template>
  <div class="bill-edit-dialog">
    <div class="hero-card">
      <div class="hero-main">
        <div class="hero-label">编辑账单</div>
        <div class="hero-title">第{{ form.sortOrder || "-" }}期 · {{ billTypeText }}</div>
        <div class="hero-meta">
          <span>账单ID：{{ form.id || "-" }}</span>
          <span>账期：{{ form.billStart || "-" }} ~ {{ form.billEnd || "-" }}</span>
        </div>
      </div>
      <div class="hero-summary">
        <div class="summary-chip">
          <span class="summary-chip__label">费用项</span>
          <span class="summary-chip__value">{{ feeList.length }}</span>
        </div>
        <div class="summary-chip summary-chip--primary">
          <span class="summary-chip__label">应收总额</span>
          <span class="summary-chip__value">¥{{ moneyText(form.totalAmount) }}</span>
        </div>
      </div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="bill-form">
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">账单基础信息</div>
          <div class="section-subtitle">仅允许调整账期、账单类型、期数、备注与费用项</div>
        </div>

        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="账单编号">
              <el-input :model-value="form.id" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="账单期数" prop="sortOrder">
              <el-input-number v-model="form.sortOrder" :min="1" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="账单类型" prop="billType">
              <el-select v-model="form.billType" class="w-full" placeholder="请选择">
                <el-option v-for="item in billTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="备注">
              <el-input v-model="form.remark" placeholder="请输入账单备注" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="账期开始" prop="billStart">
              <el-date-picker v-model="form.billStart" type="date" value-format="YYYY-MM-DD" class="w-full" placeholder="选择日期" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="账期结束" prop="billEnd">
              <el-date-picker v-model="form.billEnd" type="date" value-format="YYYY-MM-DD" class="w-full" placeholder="选择日期" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="应收日期" prop="dueDate">
              <el-date-picker v-model="form.dueDate" type="date" value-format="YYYY-MM-DD" class="w-full" placeholder="选择日期" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="应收总额">
              <el-input :model-value="`¥${moneyText(form.totalAmount)}`" disabled />
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-form>

    <div class="section-card section-card--muted section-card--compact">
      <div class="section-header">
        <div class="section-title">支付信息</div>
        <div class="section-subtitle">支付状态和支付信息仅展示，不在账单编辑中修改</div>
      </div>

      <div class="payment-grid">
        <div class="payment-item">
          <div class="payment-item__label">支付状态</div>
          <div class="payment-item__value">
            <span class="payment-badge" :class="paymentBadgeClass">{{ payStatusText }}</span>
          </div>
        </div>
        <div class="payment-item">
          <div class="payment-item__label">累计已收</div>
          <div class="payment-item__value">{{ form.paidAmount != null ? `¥${moneyText(form.paidAmount)}` : "-" }}</div>
        </div>
        <div class="payment-item">
          <div class="payment-item__label">当前待收</div>
          <div class="payment-item__value">{{ form.unpaidAmount != null ? `¥${moneyText(form.unpaidAmount)}` : "-" }}</div>
        </div>
        <div class="payment-item">
          <div class="payment-item__label">最近支付方式</div>
          <div class="payment-item__value">{{ latestPaymentChannelText }}</div>
        </div>
        <div class="payment-item">
          <div class="payment-item__label">最近支付时间</div>
          <div class="payment-item__value">{{ latestPaymentTimeText }}</div>
        </div>
      </div>
    </div>

    <div class="section-card">
      <div class="section-header section-header--inline">
        <div>
          <div class="section-title">账单费用列表</div>
          <div class="section-subtitle">可新增、删除、调整费用项；总额会根据费用明细自动计算</div>
        </div>
        <div class="table-tools">
          <el-button text type="primary" @click="syncPeriodToFees">同步账期到空白费用周期</el-button>
        </div>
      </div>

      <div class="fee-table-wrapper">
        <table class="fee-table">
          <thead>
            <tr>
              <th style="width: 200px">
                费用类型
                <span class="required">*</span>
              </th>
              <th style="width: 160px">费用名称</th>
              <th style="width: 150px">
                金额(元)
                <span class="required">*</span>
              </th>
              <th style="width: 280px">
                费用周期
                <span class="required">*</span>
              </th>
              <th>备注</th>
              <th style="width: 48px" />
            </tr>
          </thead>
          <tbody>
            <tr v-if="feeList.length === 0" class="empty-row">
              <td colspan="6">
                <div class="empty-state">
                  <el-icon :size="28"><Tickets /></el-icon>
                  <span>暂无费用明细，点击下方“添加费用”新增</span>
                </div>
              </td>
            </tr>
            <tr v-for="(fee, index) in feeList" :key="fee.uid" class="fee-row">
              <td>
                <el-cascader
                  v-model="fee.feeTypeCascade"
                  :options="feeTypeCascadeOptions"
                  :props="{ expandTrigger: 'hover', emitPath: true }"
                  placeholder="请选择费用类型"
                  clearable
                  class="w-full"
                  @change="value => handleFeeTypeCascadeChange(value as string[] | undefined, fee)"
                />
              </td>
              <td>
                <el-input v-model="fee.feeName" :disabled="fee.feeType !== 'OTHER_FEE'" placeholder="费用名称" />
              </td>
              <td>
                <el-input-number v-model="fee.amount" :min="0" :precision="2" controls-position="right" placeholder="0.00" class="w-full">
                  <template #prefix>
                    <span>￥</span>
                  </template>
                </el-input-number>
              </td>
              <td>
                <div class="period-picker">
                  <el-date-picker v-model="fee.feeStart" type="date" value-format="YYYY-MM-DD" format="YYYY-MM-DD" placeholder="开始日期" style="width: 130px" />
                  <span class="period-sep">至</span>
                  <el-date-picker v-model="fee.feeEnd" type="date" value-format="YYYY-MM-DD" format="YYYY-MM-DD" placeholder="结束日期" style="width: 130px" />
                </div>
              </td>
              <td>
                <el-input v-model="fee.remark" placeholder="选填" />
              </td>
              <td class="text-center">
                <el-button type="danger" link :icon="Delete" size="small" @click="removeFee(index)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="add-fee-bar">
        <el-button type="primary" text size="small" @click="addFee">
          <el-icon class="mr-1"><CirclePlus /></el-icon>
          添加费用
        </el-button>
      </div>

      <div class="summary-card">
        <div class="summary-item">
          <span class="summary-label">费用项数量</span>
          <span class="summary-value">{{ feeList.length }}</span>
        </div>
        <div class="summary-divider" />
        <div class="summary-item">
          <span class="summary-label">自动汇总金额</span>
          <span class="summary-value summary-value--primary">¥{{ moneyText(form.totalAmount) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, watch } from "vue";
  import { ElMessage } from "element-plus";
  import type { CascaderOption, FormInstance, FormRules } from "element-plus";
  import { CirclePlus, Delete, Tickets } from "@element-plus/icons-vue";
  import type { LeaseBillFeeDto, LeaseBillListVo, LeaseBillUpdateDto } from "@/types";
  import { getDictDataByParentCode } from "@/api/sys/dict";

  interface Props {
    bill: LeaseBillListVo;
  }

  interface DictDataItem {
    id: string;
    feeName?: string;
    name?: string;
  }

  interface DictGroup {
    dictCode: string;
    dictName: string;
    dictDataList: DictDataItem[];
  }

  interface EditableFeeItem extends LeaseBillFeeDto {
    uid: string;
    feeTypeCascade?: string[];
  }

  const props = defineProps<Props>();

  const formRef = ref<FormInstance>();
  const form = reactive<LeaseBillUpdateDto>({} as LeaseBillUpdateDto);
  const feeList = ref<EditableFeeItem[]>([]);
  const feeTypeDictList = ref<DictGroup[]>([]);

  const billTypeOptions = [
    { label: "租金", value: 1 },
    { label: "押金", value: 2 },
    { label: "其他费用", value: 3 },
    { label: "退租结算", value: 4 },
    { label: "押金结转入", value: 5 },
    { label: "押金结转出", value: 6 }
  ];

  const rules = reactive<FormRules>({
    sortOrder: [{ required: true, message: "请输入账单期数", trigger: "blur" }],
    billType: [{ required: true, message: "请选择账单类型", trigger: "change" }],
    billStart: [{ required: true, message: "请选择账期开始", trigger: "change" }],
    billEnd: [{ required: true, message: "请选择账期结束", trigger: "change" }],
    dueDate: [{ required: true, message: "请选择应收日期", trigger: "change" }]
  });

  const billTypeText = computed(() => {
    const current = billTypeOptions.find(item => item.value === form.billType);
    return current?.label || "账单";
  });

  const payStatusText = computed(() => {
    if (form.payStatus === 0) return "未支付";
    if (form.payStatus === 1) return "部分支付";
    if (form.payStatus === 2) return "已支付";
    return "-";
  });

  const latestPaymentFlow = computed(() => {
    const list = (props.bill?.paymentFlowList || []).slice();
    list.sort((a, b) => {
      const aTime = a.payTime ? new Date(a.payTime).getTime() : 0;
      const bTime = b.payTime ? new Date(b.payTime).getTime() : 0;
      return bTime - aTime;
    });
    return list[0];
  });

  const latestPaymentChannelText = computed(() => {
    const channel = latestPaymentFlow.value?.channel?.toUpperCase();
    if (channel === "CASH") return "现金";
    if (channel === "TRANSFER") return "转账";
    if (channel === "ALIPAY") return "支付宝";
    if (channel === "WECHAT") return "微信";
    if (channel === "POS") return "POS";
    if (channel === "OTHER") return "其他";
    return "-";
  });

  const latestPaymentTimeText = computed(() => latestPaymentFlow.value?.payTime || "-");

  const paymentBadgeClass = computed(() => {
    if (payStatusText.value === "已支付") return "payment-badge--paid";
    if (payStatusText.value === "部分支付") return "payment-badge--partial";
    return "payment-badge--unpaid";
  });

  const feeTypeCascadeOptions = computed<CascaderOption[]>(() => {
    const otherFeeChildren = feeTypeDictList.value.map(group => ({
      label: group.dictName,
      value: group.dictCode,
      children: group.dictDataList.map(item => ({
        label: item.feeName || item.name || "",
        value: item.id
      }))
    }));

    return [
      { label: "租金", value: "RENTAL" },
      { label: "押金", value: "DEPOSIT" },
      { label: "其他费用", value: "OTHER_FEE", children: otherFeeChildren }
    ];
  });

  const createUid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const resolveFeeCascadeValue = (fee: LeaseBillFeeDto) => {
    if (fee.feeType === "RENTAL") return ["RENTAL"];
    if (fee.feeType === "DEPOSIT") return ["DEPOSIT"];
    if (fee.feeType === "OTHER_FEE" && fee.dictDataId) {
      for (const group of feeTypeDictList.value) {
        const matched = group.dictDataList.find(item => item.id === fee.dictDataId);
        if (matched) return ["OTHER_FEE", group.dictCode, matched.id];
      }
      return ["OTHER_FEE"];
    }
    return undefined;
  };

  const toEditableFee = (fee?: LeaseBillFeeDto): EditableFeeItem => ({
    uid: createUid(),
    id: fee?.id,
    feeType: fee?.feeType || "OTHER_FEE",
    dictDataId: fee?.dictDataId,
    feeName: fee?.feeName || "",
    amount: fee?.amount ?? 0,
    paidAmount: fee?.paidAmount,
    unpaidAmount: fee?.unpaidAmount,
    payStatus: fee?.payStatus,
    feeStart: fee?.feeStart || form.billStart,
    feeEnd: fee?.feeEnd || form.billEnd,
    remark: fee?.remark || "",
    feeTypeCascade: undefined
  });

  const syncFromProps = () => {
    Object.assign(form, props.bill || {});
    feeList.value = (props.bill?.feeList || []).map(item =>
      toEditableFee({
        id: item.id,
        feeType: item.feeType,
        dictDataId: item.dictDataId,
        feeName: item.feeName,
        amount: item.amount,
        paidAmount: item.paidAmount,
        unpaidAmount: item.unpaidAmount,
        payStatus: item.payStatus,
        feeStart: item.feeStart,
        feeEnd: item.feeEnd,
        remark: item.remark
      })
    );
    nextTickResolveCascade();
  };

  const nextTickResolveCascade = () => {
    feeList.value.forEach(fee => {
      fee.feeTypeCascade = resolveFeeCascadeValue(fee);
    });
  };

  watch(
    () => props.bill,
    () => syncFromProps(),
    { immediate: true, deep: true }
  );

  const loadFeeTypeDict = async () => {
    const res = await getDictDataByParentCode({ dictCode: "fee_type" });
    if (res?.code === 0 && Array.isArray(res.data)) {
      feeTypeDictList.value = res.data;
      nextTickResolveCascade();
    }
  };

  onMounted(() => {
    loadFeeTypeDict();
  });

  const syncPeriodToFees = () => {
    feeList.value.forEach(fee => {
      if (!fee.feeStart) fee.feeStart = form.billStart;
      if (!fee.feeEnd) fee.feeEnd = form.billEnd;
    });
  };

  watch([() => form.billStart, () => form.billEnd], () => syncPeriodToFees());

  const addFee = () => {
    const fee = toEditableFee();
    fee.feeTypeCascade = ["OTHER_FEE"];
    feeList.value.push(fee);
  };

  const removeFee = (index: number) => {
    feeList.value.splice(index, 1);
  };

  const handleFeeTypeCascadeChange = (value: string[] | undefined, fee: EditableFeeItem) => {
    if (!value || value.length === 0) {
      fee.feeType = undefined;
      fee.dictDataId = undefined;
      fee.feeName = "";
      return;
    }

    const [feeType, dictCode, dictDataId] = value;
    fee.feeType = feeType;

    if (feeType === "RENTAL") {
      fee.dictDataId = undefined;
      fee.feeName = "租金";
      return;
    }

    if (feeType === "DEPOSIT") {
      fee.dictDataId = undefined;
      fee.feeName = "押金";
      return;
    }

    if (feeType === "OTHER_FEE") {
      fee.dictDataId = undefined;
      fee.feeName = "";
      if (!dictCode || !dictDataId) return;
      const group = feeTypeDictList.value.find(item => item.dictCode === dictCode);
      const matched = group?.dictDataList.find(item => item.id === dictDataId);
      if (!matched) return;
      fee.dictDataId = matched.id;
      fee.feeName = matched.feeName || matched.name || "";
    }
  };

  const totalAmount = computed(() => {
    return feeList.value.reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0);
  });

  watch(
    totalAmount,
    value => {
      form.totalAmount = Number(value.toFixed(2));
    },
    { immediate: true }
  );

  const moneyText = (value?: number) => Number(value || 0).toFixed(2);

  const validateFeeList = () => {
    if (!feeList.value.length) {
      ElMessage.warning("请至少添加一条费用明细");
      return false;
    }

    for (const fee of feeList.value) {
      if (!fee.feeType) {
        ElMessage.warning("请选择费用类型");
        return false;
      }
      if (fee.feeType === "OTHER_FEE" && !fee.dictDataId) {
        ElMessage.warning("请选择其他费用类型");
        return false;
      }
      if (fee.amount == null || Number(fee.amount) <= 0) {
        ElMessage.warning("费用金额必须大于0");
        return false;
      }
      if (!fee.feeStart || !fee.feeEnd) {
        ElMessage.warning("请完善费用周期");
        return false;
      }
    }

    return true;
  };

  const validate = async () => {
    if (!formRef.value) return false;
    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) return false;
    return validateFeeList();
  };

  const getFormData = (): LeaseBillUpdateDto => ({
    id: form.id,
    sortOrder: form.sortOrder,
    billType: form.billType,
    carryOverFromBillId: form.carryOverFromBillId,
    carryOverToBillId: form.carryOverToBillId,
    billStart: form.billStart,
    billEnd: form.billEnd,
    totalAmount: form.totalAmount,
    dueDate: form.dueDate,
    remark: form.remark,
    valid: form.valid,
    feeList: feeList.value.map(({ uid, feeTypeCascade, ...fee }) => fee)
  });

  defineExpose({
    validate,
    getFormData
  });
</script>

<style scoped lang="scss">
  .bill-edit-dialog {
    display: grid;
    gap: 16px;
    padding-bottom: 20px;
  }

  .hero-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px;
    border-radius: 14px;
    background: linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%);
    border: 1px solid #dbeafe;
  }

  .hero-label {
    color: #2563eb;
    font-size: 13px;
    font-weight: 600;
  }

  .hero-title {
    margin-top: 6px;
    color: #111827;
    font-size: 22px;
    font-weight: 700;
  }

  .hero-meta {
    display: flex;
    gap: 18px;
    margin-top: 8px;
    color: #6b7280;
    font-size: 13px;
    flex-wrap: wrap;
  }

  .hero-summary {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .summary-chip {
    min-width: 110px;
    padding: 12px 14px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid #e5e7eb;
  }

  .summary-chip--primary {
    border-color: #bfdbfe;
    background: #eff6ff;
  }

  .summary-chip__label {
    display: block;
    color: #6b7280;
    font-size: 12px;
    margin-bottom: 6px;
  }

  .summary-chip__value {
    color: #111827;
    font-size: 18px;
    font-weight: 700;
  }

  .section-card {
    padding: 18px 20px;
    border-radius: 14px;
    border: 1px solid #e5e7eb;
    background: #fff;
  }

  .section-card--muted {
    background: #fbfdff;
    border-color: #dbe7f5;
  }

  .section-card--compact {
    padding: 14px 16px;
  }

  .section-header {
    margin-bottom: 16px;
  }

  .section-header--inline {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .section-title {
    color: #111827;
    font-size: 18px;
    font-weight: 700;
  }

  .section-subtitle {
    margin-top: 4px;
    color: #6b7280;
    font-size: 13px;
  }

  .section-card--compact .section-header {
    margin-bottom: 12px;
  }

  .section-card--compact .section-title {
    font-size: 16px;
  }

  .section-card--compact .section-subtitle {
    margin-top: 2px;
    font-size: 12px;
  }

  .table-tools {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .payment-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .payment-item {
    padding: 10px 12px;
    border-radius: 10px;
    background: #fff;
    border: 1px solid #e5edf8;
  }

  .payment-item__label {
    color: #6b7280;
    font-size: 11px;
    line-height: 1.2;
  }

  .payment-item__value {
    margin-top: 6px;
    color: #111827;
    font-size: 14px;
    font-weight: 600;
    word-break: break-all;
    line-height: 1.35;
  }

  .payment-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
  }

  .payment-badge--paid {
    color: #16a34a;
    background: #dcfce7;
  }

  .payment-badge--partial {
    color: #d97706;
    background: #fef3c7;
  }

  .payment-badge--overdue {
    color: #e11d48;
    background: #ffe4e6;
  }

  .payment-badge--unpaid {
    color: #dc2626;
    background: #fee2e2;
  }

  .fee-table-wrapper {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
  }

  .fee-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .fee-table th,
  .fee-table td {
    padding: 10px 12px;
    border-bottom: 1px solid #eef2f7;
    vertical-align: middle;
    text-align: left;
  }

  .fee-table th {
    background: #f8fafc;
    color: #4b5563;
    font-weight: 600;
  }

  .required {
    margin-left: 2px;
    color: #ef4444;
  }

  .empty-row td {
    padding: 26px 12px;
    text-align: center;
  }

  .empty-state {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #6b7280;
  }

  .period-picker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .period-sep {
    color: #9ca3af;
  }

  .add-fee-bar {
    margin-top: 8px;
  }

  .summary-card {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-top: 14px;
    padding: 14px 16px;
    border-radius: 12px;
    background: #f8fafc;
  }

  .summary-item {
    display: grid;
    gap: 6px;
  }

  .summary-label {
    color: #6b7280;
    font-size: 12px;
  }

  .summary-value {
    color: #111827;
    font-size: 18px;
    font-weight: 700;
  }

  .summary-value--primary {
    color: #2563eb;
  }

  .summary-divider {
    width: 1px;
    align-self: stretch;
    background: #dbe3ef;
  }

  @media (max-width: 1200px) {
    .hero-card,
    .section-header--inline {
      flex-direction: column;
      align-items: flex-start;
    }

    .payment-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
