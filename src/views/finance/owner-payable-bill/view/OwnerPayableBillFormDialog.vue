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
        <el-form-item label="房源类型" prop="subjectType">
          <el-select v-model="form.subjectType" class="w-full">
            <el-option label="房源" value="HOUSE" />
            <el-option label="集中式项目" value="FOCUS" />
            <el-option label="项目楼栋" value="FOCUS_BUILDING" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="房源ID" prop="subjectId">
          <el-input v-model="form.subjectId" placeholder="请输入房源ID" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="房源名称" prop="subjectName">
          <el-input v-model="form.subjectName" placeholder="请输入房源名称" />
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
          <el-button link type="primary" @click="addLine">新增明细</el-button>
        </div>
        <div v-for="(item, index) in form.lineList" :key="index" class="line-row">
          <el-row :gutter="12">
            <el-col :span="5">
              <el-input v-model="item.itemName" placeholder="项目名称" />
            </el-col>
            <el-col :span="4">
              <el-input v-model="item.itemType" placeholder="项目类型" />
            </el-col>
            <el-col :span="3">
              <el-select v-model="item.direction" class="w-full">
                <el-option label="收" value="IN" />
                <el-option label="支" value="OUT" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-input-number v-model="item.amount" :min="0" :precision="2" class="w-full" />
            </el-col>
            <el-col :span="4">
              <el-date-picker v-model="item.bizTime" type="date" value-format="YYYY-MM-DD" class="w-full" />
            </el-col>
            <el-col :span="3">
              <el-input v-model="item.remark" placeholder="备注" />
            </el-col>
            <el-col :span="1">
              <el-button link type="danger" @click="removeLine(index)">删</el-button>
            </el-col>
          </el-row>
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
  import { reactive, ref } from "vue";
  import type { FormInstance, FormRules } from "element-plus";
  import type { PayableBillCreateDto, PayableBillListVo, PayableBillUpdateDto } from "@/api/owner/owner";

  defineOptions({ name: "OwnerPayableBillFormDialog" });

  const props = defineProps<{ bill?: PayableBillListVo }>();
  const formRef = ref<FormInstance>();

  const form = reactive<PayableBillUpdateDto>({
    billId: props.bill?.billId,
    ownerId: props.bill?.ownerId,
    contractId: props.bill?.contractId,
    subjectType: "HOUSE",
    subjectId: "",
    subjectName: props.bill?.subjectName || "",
    billStartDate: props.bill?.billStartDate || "",
    billEndDate: props.bill?.billEndDate || "",
    dueDate: props.bill?.dueDate || "",
    remark: "",
    lineList: [{ itemName: "", itemType: "", direction: "IN", amount: 0, bizTime: "", remark: "" }]
  });

  const rules: FormRules = {
    ownerId: [{ required: true, message: "请输入业主ID", trigger: "blur" }],
    contractId: [{ required: true, message: "请输入合同ID", trigger: "blur" }],
    subjectType: [{ required: true, message: "请选择房源类型", trigger: "change" }],
    subjectName: [{ required: true, message: "请输入房源名称", trigger: "blur" }],
    billStartDate: [{ required: true, message: "请选择账期开始", trigger: "change" }],
    billEndDate: [{ required: true, message: "请选择账期结束", trigger: "change" }],
    dueDate: [{ required: true, message: "请选择应付日期", trigger: "change" }]
  };

  function addLine() {
    form.lineList = [...(form.lineList || []), { itemName: "", itemType: "", direction: "IN", amount: 0, bizTime: "", remark: "" }];
  }

  function removeLine(index: number) {
    form.lineList?.splice(index, 1);
  }

  async function validateAndBuildPayload() {
    await formRef.value?.validate();
    if (!form.lineList?.length) throw new Error("请至少添加一条费用明细");
    return { ...form } as PayableBillCreateDto | PayableBillUpdateDto;
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
</style>
