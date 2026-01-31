<script setup lang="ts">
  import { computed, ref, watch } from "vue";
  import { ElMessage, type FormInstance, type FormRules } from "element-plus";
  import { handleApproval } from "@/api/approval";
  import { useUserStoreHook } from "@/store/modules/user";

  interface ApprovalFormData {
    action: number; // 1=通过, 2=驳回
    remark: string;
  }

  interface Props {
    visible: boolean;
    instanceId: number;
  }

  const props = defineProps<Props>();
  const emit = defineEmits(["update:visible", "success"]);

  const userStore = useUserStoreHook();
  const formRef = ref<FormInstance>();
  const loading = ref(false);

  const formData = ref<ApprovalFormData>({
    action: 1,
    remark: ""
  });

  // 动态校验规则：驳回时备注必填
  const formRules = computed<FormRules<ApprovalFormData>>(() => ({
    action: [{ required: true, message: "请选择审批结果", trigger: "change" }],
    remark: [
      {
        required: formData.value.action === 2,
        message: "驳回时必须填写驳回原因",
        trigger: "blur"
      }
    ]
  }));

  // 弹窗标题
  const dialogTitle = computed(() => {
    return formData.value.action === 1 ? "审批通过" : "审批驳回";
  });

  // 确认按钮文本
  const confirmText = computed(() => {
    return formData.value.action === 1 ? "确认通过" : "确认驳回";
  });

  // 确认按钮类型
  const confirmType = computed(() => {
    return formData.value.action === 1 ? "primary" : "danger";
  });

  // 备注输入框提示文本
  const remarkPlaceholder = computed(() => {
    return formData.value.action === 1 ? "请输入审批意见（选填）" : "请输入驳回原因（必填）";
  });

  // 备注标签文本
  const remarkLabel = computed(() => {
    return formData.value.action === 1 ? "审批意见" : "驳回原因";
  });

  // 关闭弹窗
  const handleClose = () => {
    emit("update:visible", false);
    // 延迟重置表单，避免动画时看到表单重置
    setTimeout(() => {
      formRef.value?.resetFields();
      formData.value = {
        action: 1,
        remark: ""
      };
    }, 300);
  };

  // 提交审批
  const handleSubmit = async () => {
    if (!formRef.value) return;

    formRef.value.validate(async valid => {
      if (!valid) return;

      loading.value = true;
      try {
        await handleApproval({
          instanceId: props.instanceId,
          approverId: userStore.id,
          action: formData.value.action,
          remark: formData.value.remark || undefined
        });

        ElMessage.success(formData.value.action === 1 ? "审批通过成功" : "已驳回该审批");
        emit("success");
        handleClose();
      } catch (error: any) {
        ElMessage.error(error?.message || "审批操作失败");
      } finally {
        loading.value = false;
      }
    });
  };

  // 切换审批结果时清空备注并清除校验
  const handleActionChange = () => {
    formData.value.remark = "";
    formRef.value?.clearValidate("remark");
  };

  // 监听弹窗打开，重置表单
  watch(
    () => props.visible,
    newVal => {
      if (newVal) {
        formData.value = {
          action: 1,
          remark: ""
        };
        formRef.value?.clearValidate();
      }
    }
  );
</script>

<template>
  <el-dialog :model-value="visible" :title="dialogTitle" width="520px" :close-on-click-modal="false" @close="handleClose">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px" label-position="top">
      <el-form-item label="审批结果" prop="action">
        <el-radio-group v-model="formData.action" @change="handleActionChange">
          <el-radio :value="1" size="large">
            <span style="color: var(--el-color-success)">✓ 通过</span>
          </el-radio>
          <el-radio :value="2" size="large">
            <span style="color: var(--el-color-danger)">✗ 驳回</span>
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item :label="remarkLabel" prop="remark">
        <el-input v-model="formData.remark" type="textarea" :rows="5" :placeholder="remarkPlaceholder" maxlength="500" show-word-limit />
        <template v-if="formData.action === 2">
          <el-alert type="warning" :closable="false" style="margin-top: 8px">驳回后，申请人可以修改后重新提交</el-alert>
        </template>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="loading" @click="handleClose">取消</el-button>
      <el-button :type="confirmType" :loading="loading" @click="handleSubmit">
        {{ confirmText }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
  :deep(.el-form-item__label) {
    font-weight: 600;
  }

  :deep(.el-radio-group) {
    display: flex;
    gap: 24px;
  }

  :deep(.el-radio) {
    margin-right: 0;
  }
</style>
