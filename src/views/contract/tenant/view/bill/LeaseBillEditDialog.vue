<template>
  <div class="bill-edit-dialog">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="bill-form">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-form-item label="账单ID">
            <el-input v-model="form.id" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="期数" prop="sortOrder">
            <el-input-number v-model="form.sortOrder" :min="1" controls-position="right" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="账单类型" prop="billType">
            <el-select v-model="form.billType" class="w-full" placeholder="请选择">
              <el-option label="租金" :value="1" />
              <el-option label="押金" :value="2" />
              <el-option label="其他费用" :value="3" />
              <el-option label="退租结算" :value="4" />
              <el-option label="押金结转入" :value="5" />
              <el-option label="押金结转出" :value="6" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="支付状态" prop="payStatus">
            <el-select v-model="form.payStatus" class="w-full" placeholder="请选择">
              <el-option label="未支付" :value="0" />
              <el-option label="部分支付" :value="1" />
              <el-option label="已支付" :value="2" />
              <el-option label="逾期" :value="3" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="6">
          <el-form-item label="账期开始" prop="rentPeriodStart">
            <el-date-picker v-model="form.rentPeriodStart" type="date" value-format="YYYY-MM-DD" class="w-full" placeholder="选择日期" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="账期结束" prop="rentPeriodEnd">
            <el-date-picker v-model="form.rentPeriodEnd" type="date" value-format="YYYY-MM-DD" class="w-full" placeholder="选择日期" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="应收日期" prop="dueDate">
            <el-date-picker v-model="form.dueDate" type="date" value-format="YYYY-MM-DD" class="w-full" placeholder="选择日期" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="支付时间">
            <el-date-picker v-model="form.payTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" class="w-full" placeholder="选择时间" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="6">
          <el-form-item label="租金" prop="rentalAmount">
            <el-input-number v-model="form.rentalAmount" :min="0" :precision="2" controls-position="right" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="押金" prop="depositAmount">
            <el-input-number v-model="form.depositAmount" :min="0" :precision="2" controls-position="right" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="其他费用">
            <el-input-number v-model="form.otherFeeAmount" :min="0" :precision="2" controls-position="right" class="w-full" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="应收总额">
            <el-input-number v-model="form.totalAmount" :min="0" :precision="2" controls-position="right" class="w-full" disabled />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="6">
          <el-form-item label="支付金额">
            <el-input-number v-model="form.payAmount" :min="0" :precision="2" controls-position="right" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="支付方式">
            <el-select v-model="form.payChannel" class="w-full" placeholder="请选择">
              <el-option label="现金" :value="1" />
              <el-option label="转账" :value="2" />
              <el-option label="支付宝" :value="3" />
              <el-option label="微信" :value="4" />
              <el-option label="其他" :value="5" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="备注">
            <el-input v-model="form.remark" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <div class="fee-table-wrapper">
      <table class="fee-table">
        <thead>
          <tr>
            <th style="width: 220px">费用名称</th>
            <th style="width: 160px">金额(元)</th>
            <th>备注</th>
            <th style="width: 40px" />
          </tr>
        </thead>
        <tbody>
          <tr v-if="feeList.length === 0" class="empty-row">
            <td colspan="4">
              <div class="empty-state">
                <el-icon :size="26"><Tickets /></el-icon>
                <span>暂无费用明细，点击下方"添加费用"新增</span>
              </div>
            </td>
          </tr>
          <tr v-for="(fee, index) in feeList" :key="index" class="fee-row">
            <td>
              <el-select v-model="fee.dictDataId" class="w-full" placeholder="选择费用" filterable @change="val => handleFeeDictChange(val, fee)">
                <el-option-group v-for="group in feeTypeDictList" :key="group.dictCode" :label="group.dictName">
                  <el-option v-for="item in group.dictDataList" :key="item.id" :label="item.name" :value="item.id" />
                </el-option-group>
              </el-select>
            </td>
            <td>
              <el-input-number v-model="fee.amount" :min="0" :precision="2" controls-position="right" class="w-full">
                <template #prefix>
                  <span>￥</span>
                </template>
              </el-input-number>
            </td>
            <td>
              <el-input v-model="fee.remark" placeholder="备注" />
            </td>
            <td class="text-center">
              <el-button type="danger" link :icon="Delete" size="small" @click="removeFee(index)" />
            </td>
          </tr>
        </tbody>
      </table>

      <div class="add-fee-bar">
        <el-button type="primary" text size="small" @click="addFee">
          <el-icon class="mr-1"><CirclePlus /></el-icon>
          添加费用
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, watch } from "vue";
  import type { FormInstance, FormRules } from "element-plus";
  import { CirclePlus, Delete, Tickets } from "@element-plus/icons-vue";
  import type { LeaseBillListVo, LeaseBillOtherFeeDto, LeaseBillUpdateDto } from "@/types";
  import { getDictDataByParentCode } from "@/api/sys/dict";

  interface Props {
    bill: LeaseBillListVo;
  }

  const props = defineProps<Props>();

  const formRef = ref<FormInstance>();
  const form = reactive<LeaseBillUpdateDto>({} as LeaseBillUpdateDto);
  const feeList = ref<LeaseBillOtherFeeDto[]>([]);

  interface DictDataItem {
    id: string;
    name: string;
    value: string;
  }
  interface DictGroup {
    dictCode: string;
    dictName: string;
    dictDataList: DictDataItem[];
  }
  const feeTypeDictList = ref<DictGroup[]>([]);

  const rules = reactive<FormRules>({
    sortOrder: [{ required: true, message: "请输入期数", trigger: "blur" }],
    billType: [{ required: true, message: "请选择账单类型", trigger: "change" }],
    rentPeriodStart: [{ required: true, message: "请选择账期开始", trigger: "change" }],
    rentPeriodEnd: [{ required: true, message: "请选择账期结束", trigger: "change" }],
    dueDate: [{ required: true, message: "请选择应收日期", trigger: "change" }]
  });

  const syncFromProps = () => {
    Object.assign(form, props.bill || {});
    feeList.value = (props.bill?.otherFees || []).map(item => ({
      dictDataId: item.dictDataId,
      name: item.name,
      amount: item.amount,
      remark: item.remark
    }));
  };

  watch(
    () => props.bill,
    () => syncFromProps(),
    { immediate: true, deep: true }
  );

  const loadFeeTypeDict = async () => {
    try {
      const res = await getDictDataByParentCode({ dictCode: "fee_type" });
      if (res?.code === 0 && Array.isArray(res.data)) {
        feeTypeDictList.value = res.data;
      }
    } catch (err) {
      console.error("加载费用类型字典失败", err);
    }
  };

  onMounted(() => {
    loadFeeTypeDict();
  });

  const addFee = () => {
    feeList.value.push({
      dictDataId: "",
      name: "",
      amount: 0,
      remark: ""
    });
  };

  const removeFee = (index: number) => {
    feeList.value.splice(index, 1);
  };

  const validate = async () => {
    if (!formRef.value) return false;
    return await formRef.value.validate().catch(() => false);
  };

  const getFormData = () => {
    const payload: LeaseBillUpdateDto = {
      id: form.id,
      sortOrder: form.sortOrder,
      billType: form.billType,
      carryOverFromBillId: form.carryOverFromBillId,
      carryOverToBillId: form.carryOverToBillId,
      rentPeriodStart: form.rentPeriodStart,
      rentPeriodEnd: form.rentPeriodEnd,
      rentalAmount: form.rentalAmount,
      depositAmount: form.depositAmount,
      otherFeeAmount: form.otherFeeAmount,
      totalAmount: form.totalAmount,
      dueDate: form.dueDate,
      payTime: form.payTime,
      payAmount: form.payAmount,
      payStatus: form.payStatus,
      payChannel: form.payChannel,
      remark: form.remark,
      valid: form.valid,
      otherFees: feeList.value.filter(f => f.name || f.amount || f.remark || f.dictDataId)
    };
    return payload;
  };

  defineExpose({
    validate,
    getFormData
  });
</script>

<style scoped lang="scss">
  .bill-edit-dialog {
    display: grid;
    gap: 16px;
  }

  .fee-table-wrapper {
    border: 1px solid var(--el-border-color);
    border-radius: 10px;
    padding: 12px;
    background: var(--el-fill-color-blank);
  }

  .fee-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .fee-table th,
  .fee-table td {
    border-bottom: 1px solid var(--el-border-color-light);
    padding: 8px;
    text-align: left;
    vertical-align: middle;
  }

  .fee-table th {
    color: var(--el-text-color-regular);
    background: var(--el-fill-color-light);
    font-weight: 600;
  }

  .empty-row td {
    text-align: center;
    padding: 18px;
  }

  .empty-state {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--el-text-color-secondary);
  }

  .add-fee-bar {
    margin-top: 8px;
  }
</style>
  const handleFeeDictChange = (dictDataId: string, fee: LeaseBillOtherFeeDto) => {
    if (!dictDataId) {
      fee.name = "";
      fee.dictDataId = "";
      return;
    }
    for (const group of feeTypeDictList.value) {
      const found = group.dictDataList.find(item => item.id === dictDataId);
      if (found) {
        fee.name = found.name;
        fee.dictDataId = dictDataId;
        return;
      }
    }
  };

  const otherFeeTotal = computed(() => feeList.value.reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0));
  const totalAmount = computed(() => {
    const rental = Number(form.rentalAmount) || 0;
    const deposit = Number(form.depositAmount) || 0;
    return rental + deposit + otherFeeTotal.value;
  });

  watch(
    [() => form.rentalAmount, () => form.depositAmount, feeList],
    () => {
      form.otherFeeAmount = Number(otherFeeTotal.value.toFixed(2));
      form.totalAmount = Number(totalAmount.value.toFixed(2));
    },
    { deep: true, immediate: true }
  );
