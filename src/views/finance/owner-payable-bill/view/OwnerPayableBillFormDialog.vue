<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item label="业主ID" prop="ownerId">
          <el-input v-model="form.ownerId" placeholder="请输入业主ID" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="合同ID" prop="contractId">
          <el-input v-model="form.contractId" placeholder="请输入合同ID" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="账期开始" prop="billStartDate">
          <el-date-picker v-model="form.billStartDate" type="date" value-format="YYYY-MM-DD" class="w-full" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="账期结束" prop="billEndDate">
          <el-date-picker v-model="form.billEndDate" type="date" value-format="YYYY-MM-DD" class="w-full" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="应付日期" prop="dueDate">
          <el-date-picker v-model="form.dueDate" type="date" value-format="YYYY-MM-DD" class="w-full" />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <div class="line-header">
          <span>费用明细</span>
          <el-button link type="primary" @click="addFee">新增费用</el-button>
        </div>
        <div v-for="(item, index) in form.feeList" :key="item.uid" class="line-row">
          <el-row :gutter="12">
            <el-col :span="7">
              <el-cascader
                v-model="item.feeTypeCascade"
                :options="feeTypeCascadeOptions"
                :props="{ expandTrigger: 'hover', emitPath: true }"
                clearable
                class="w-full"
                placeholder="请选择费用类型"
                @change="value => handleFeeTypeCascadeChange(value as string[] | undefined, item)"
              />
            </el-col>
            <el-col :span="4">
              <el-select v-model="item.direction" class="w-full">
                <el-option label="收" value="IN" />
                <el-option label="支" value="OUT" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-input-number v-model="item.amount" :min="0" :precision="2" class="w-full" />
            </el-col>
            <el-col :span="4">
              <el-date-picker v-model="item.bizDate" type="date" value-format="YYYY-MM-DD" class="w-full" />
            </el-col>
            <el-col :span="4">
              <el-input v-model="item.remark" placeholder="备注" />
            </el-col>
            <el-col :span="1">
              <el-button link type="danger" @click="removeFee(index)">删</el-button>
            </el-col>
          </el-row>
          <div class="line-meta">
            <span>费用快照：{{ item.feeName || "-" }}</span>
            <span>业务分类：{{ item.feeType || "-" }}</span>
            <span>字典项ID：{{ item.dictDataId || "-" }}</span>
          </div>
        </div>
      </el-col>
      <el-col :span="24">
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup lang="ts">
  import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
  import type { FormInstance, FormRules } from "element-plus";
  import { getDictDataByParentCode } from "@/api/sys/dict";
  import { getOwnerPayableBillDetail } from "@/api/owner/owner";
  import type {
    OwnerPayableBillCreateDto,
    OwnerPayableBillDetailVo,
    OwnerPayableBillFeeDto,
    OwnerPayableBillFeeVo,
    OwnerPayableBillListVo,
    OwnerPayableBillUpdateDto
  } from "@/types/generated";
  import { message } from "@/utils/message";

  defineOptions({ name: "OwnerPayableBillFormDialog" });

  type EditableFeeItem = OwnerPayableBillFeeDto & {
    uid: string;
    feeTypeCascade?: Array<string | number>;
  };

  type OwnerPayableBillFormState = Omit<OwnerPayableBillUpdateDto, "feeList"> & {
    feeList: EditableFeeItem[];
  };

  const props = defineProps<{ bill?: OwnerPayableBillListVo }>();
  const formRef = ref<FormInstance>();
  const loading = ref(false);
  const feeTypeDictList = ref<any[]>([]);

  const form = reactive<OwnerPayableBillFormState>({
    billId: props.bill?.billId,
    ownerId: props.bill?.ownerId,
    contractId: props.bill?.contractId,
    billStartDate: props.bill?.billStartDate || "",
    billEndDate: props.bill?.billEndDate || "",
    dueDate: props.bill?.dueDate || "",
    remark: "",
    feeList: []
  });

  const rules: FormRules = {
    ownerId: [{ required: true, message: "请输入业主ID", trigger: "blur" }],
    contractId: [{ required: true, message: "请输入合同ID", trigger: "blur" }],
    billStartDate: [{ required: true, message: "请选择账期开始", trigger: "change" }],
    billEndDate: [{ required: true, message: "请选择账期结束", trigger: "change" }],
    dueDate: [{ required: true, message: "请选择应付日期", trigger: "change" }]
  };

  const feeList = ref<EditableFeeItem[]>([]);

  const feeTypeCascadeOptions = computed(() =>
    feeTypeDictList.value.map(group => ({
      label: group.name,
      value: group.dictCode,
      children: (group.dictDataList || []).map(item => ({
        label: item.feeName || item.name,
        value: item.id
      }))
    }))
  );

  const toEditableFee = (fee?: OwnerPayableBillFeeDto | OwnerPayableBillFeeVo): EditableFeeItem => ({
    uid: `${Date.now()}-${Math.random()}`,
    id: fee?.id,
    sourceType: fee?.sourceType,
    sourceId: fee?.sourceId,
    dictDataId: fee?.dictDataId,
    feeType: fee?.feeType,
    feeName: fee?.feeName,
    direction: fee?.direction || "OUT",
    amount: fee?.amount || 0,
    bizDate: fee?.bizDate || "",
    formulaSnapshot: fee?.formulaSnapshot,
    remark: fee?.remark || "",
    feeTypeCascade: undefined
  });

  const resetForm = () => {
    form.billId = props.bill?.billId;
    form.ownerId = props.bill?.ownerId;
    form.contractId = props.bill?.contractId;
    form.billStartDate = props.bill?.billStartDate || "";
    form.billEndDate = props.bill?.billEndDate || "";
    form.dueDate = props.bill?.dueDate || "";
    form.remark = "";
    feeList.value = [toEditableFee()];
  };

  const resolveFeeCascadeValue = (fee: EditableFeeItem) => {
    if (!fee.dictDataId) return undefined;
    const group = feeTypeDictList.value.find(item =>
      (item.dictDataList || []).some(dictItem => String(dictItem.id) === String(fee.dictDataId))
    );
    return group ? [group.dictCode, fee.dictDataId] : undefined;
  };

  const syncFeeCascade = () => {
    feeList.value.forEach(fee => {
      fee.feeTypeCascade = resolveFeeCascadeValue(fee);
    });
  };

  const loadFeeTypeDict = async () => {
    const res = await getDictDataByParentCode({ dictCode: "fee_type" });
    if (res?.code === 0 && Array.isArray(res.data)) {
      feeTypeDictList.value = res.data;
      syncFeeCascade();
    }
  };

  const loadDetail = async () => {
    if (!props.bill?.billId) {
      resetForm();
      return;
    }
    loading.value = true;
    try {
      const res = await getOwnerPayableBillDetail({ billId: props.bill.billId });
      if (res.code !== 0 || !res.data) {
        message(res.message || "获取应付单详情失败", { type: "error" });
        resetForm();
        return;
      }
      const detail: OwnerPayableBillDetailVo = res.data;
      form.billId = detail.billId;
      form.ownerId = detail.ownerId;
      form.contractId = detail.contractId;
      form.billStartDate = detail.billStartDate || "";
      form.billEndDate = detail.billEndDate || "";
      form.dueDate = detail.dueDate || "";
      form.remark = detail.remark || "";
      feeList.value = (detail.feeList || []).map(item => toEditableFee(item));
      if (!feeList.value.length) feeList.value = [toEditableFee()];
      nextTick(syncFeeCascade);
    } finally {
      loading.value = false;
    }
  };

  const addFee = () => {
    feeList.value.push(toEditableFee());
  };

  const removeFee = (index: number) => {
    feeList.value.splice(index, 1);
  };

  const handleFeeTypeCascadeChange = (value: Array<string | number> | undefined, fee: EditableFeeItem) => {
    if (!value?.length) {
      fee.feeType = undefined;
      fee.dictDataId = undefined;
      fee.feeName = "";
      return;
    }
    const [dictCode, dictDataId] = value;
    fee.dictDataId = String(dictDataId);

    const group = feeTypeDictList.value.find(item => item.dictCode === dictCode);
    const dictItem = group?.dictDataList?.find(item => String(item.id) === String(dictDataId));
    fee.feeType = "OTHER_FEE";
    fee.feeName = dictItem?.feeName || dictItem?.name || "";
  };

  watch(
    () => props.bill?.billId,
    () => {
      loadDetail();
    },
    { immediate: true }
  );

  onMounted(loadFeeTypeDict);

  async function validateAndBuildPayload() {
    await formRef.value?.validate();
    if (!feeList.value.length) throw new Error("请至少添加一条费用明细");
    const invalidFee = feeList.value.find(item => !item.feeType || !item.feeName || item.amount == null);
    if (invalidFee) {
      throw new Error("请完整填写费用类型、金额等信息");
    }
    const payload = {
      ...form,
      feeList: feeList.value.map(({ uid, feeTypeCascade, ...item }) => item)
    };
    return payload as OwnerPayableBillCreateDto | OwnerPayableBillUpdateDto;
  }

  defineExpose({ validateAndBuildPayload });
</script>

<style scoped lang="scss">
  .line-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    font-weight: 600;
  }

  .line-row {
    margin-bottom: 12px;
    padding: 12px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;
  }

  .line-meta {
    display: flex;
    gap: 16px;
    margin-top: 8px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
</style>
