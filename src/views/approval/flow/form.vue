<script setup lang="ts">
  import { onMounted, ref } from "vue";
  import { formRules } from "./utils/rule";
  import { ArrowDown, ArrowUp, Delete, Plus } from "@element-plus/icons-vue";
  import { getCompanyUserOptions } from "@/api/company";
  import { getSimpleRoleList } from "@/api/sys/user";
  import { ApprovalFormItemProps } from "@/types";

  /**
   * 表单 Props
   */
  export interface ApprovalFormProps {
    formInline?: ApprovalFormItemProps;
    bizTypeOptions?: Array<{ label: string; value: string }>;
  }

  const props = withDefaults(defineProps<ApprovalFormProps>(), {
    formInline: () => ({
      id: null,
      flowName: "",
      bizType: "",
      enabled: true,
      remark: "",
      nodes: []
    }),
    bizTypeOptions: () => []
  });

  const ruleFormRef = ref();
  const newFormInline = ref(props.formInline);

  // 用户和角色选项
  const userOptions = ref([]);
  const roleOptions = ref([]);

  // 审批人类型选项
  const approverTypeOptions = [
    { label: "指定用户", value: 1 },
    { label: "指定角色", value: 2 },
    { label: "部门主管", value: 3 }
    // { label: "发起人自选", value: 4 }
  ];

  // 多人审批方式选项
  const multiApproveOptions = [
    { label: "或签（一人通过即可）", value: 1 },
    { label: "会签（所有人通过）", value: 2 }
  ];

  // 加载用户列表
  async function loadUserOptions() {
    const { data } = await getCompanyUserOptions();
    userOptions.value = (data || []).map(item => ({
      label: item.name,
      value: item.id
    }));
  }

  // 加载角色列表
  async function loadRoleOptions() {
    const { data } = await getSimpleRoleList();
    roleOptions.value = (data || []).map(item => ({
      label: item.name,
      value: item.id
    }));
  }

  // 添加节点
  function addNode() {
    newFormInline.value.nodes.push({
      nodeName: "",
      nodeOrder: newFormInline.value.nodes.length + 1,
      approverType: 1,
      approverIds: [],
      multiApproveType: 1
    });
  }

  // 删除节点
  function removeNode(index: number) {
    newFormInline.value.nodes.splice(index, 1);
    newFormInline.value.nodes.forEach((node, i) => {
      node.nodeOrder = i + 1;
    });
  }

  // 移动节点
  function moveNode(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFormInline.value.nodes.length) return;

    const nodes = newFormInline.value.nodes;
    const temp = nodes[index];
    nodes[index] = nodes[targetIndex];
    nodes[targetIndex] = temp;

    nodes.forEach((node, i) => {
      node.nodeOrder = i + 1;
    });
  }

  // 审批人类型切换时清空已选
  function onApproverTypeChange(node: any) {
    node.approverIds = [];
  }

  function getRef() {
    return ruleFormRef.value;
  }

  defineExpose({ getRef });

  onMounted(() => {
    // 初始化
    loadUserOptions();
    loadRoleOptions();
  });
</script>

<template>
  <el-form ref="ruleFormRef" :model="newFormInline" :rules="formRules" label-position="top">
    <el-form-item label="流程名称" prop="flowName">
      <el-input v-model="newFormInline.flowName" placeholder="请输入流程名称" clearable />
    </el-form-item>

    <el-form-item label="业务类型" prop="bizType">
      <el-select v-model="newFormInline.bizType" placeholder="请选择业务类型" style="width: 100%" :disabled="!!newFormInline.id">
        <el-option v-for="item in bizTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>

    <el-form-item label="审批节点">
      <div class="node-config">
        <div v-for="(node, index) in newFormInline.nodes" :key="index" class="node-item-config">
          <div class="node-header">
            <span class="node-order">第 {{ index + 1 }} 级审批</span>
            <div class="node-actions">
              <el-button :icon="ArrowUp" circle size="small" :disabled="index === 0" @click="moveNode(index, 'up')" />
              <el-button :icon="ArrowDown" circle size="small" :disabled="index === newFormInline.nodes.length - 1" @click="moveNode(index, 'down')" />
              <el-button :icon="Delete" circle size="small" type="danger" @click="removeNode(index)" />
            </div>
          </div>

          <el-form-item label="节点名称" label-width="80px" style="margin-bottom: 12px">
            <el-input v-model="node.nodeName" placeholder="如：部门经理审批" />
          </el-form-item>

          <el-form-item label="审批人" label-width="80px" style="margin-bottom: 12px">
            <el-radio-group v-model="node.approverType" @change="() => onApproverTypeChange(node)">
              <el-radio v-for="item in approverTypeOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="node.approverType === 1" label="选择用户" label-width="80px" style="margin-bottom: 12px">
            <el-select v-model="node.approverIds" multiple placeholder="请选择审批用户" style="width: 100%">
              <el-option v-for="item in userOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item v-if="node.approverType === 2" label="选择角色" label-width="80px" style="margin-bottom: 12px">
            <el-select v-model="node.approverIds" multiple placeholder="请选择审批角色" style="width: 100%">
              <el-option v-for="item in roleOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item label="多人审批" label-width="80px" style="margin-bottom: 0">
            <el-radio-group v-model="node.multiApproveType">
              <el-radio v-for="item in multiApproveOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </div>

        <el-button type="primary" plain :icon="Plus" @click="addNode" style="width: 100%">添加审批节点</el-button>
      </div>
    </el-form-item>

    <el-form-item label="备注">
      <el-input v-model="newFormInline.remark" type="textarea" :rows="2" placeholder="请输入备注" />
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss">
  .node-config {
    width: 100%;

    .node-item-config {
      border: 1px solid var(--el-border-color-light);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      background: var(--el-fill-color-lighter);

      .node-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px dashed var(--el-border-color-light);

        .node-order {
          font-weight: bold;
          color: var(--el-color-primary);
        }

        .node-actions {
          display: flex;
          gap: 4px;
        }
      }
    }
  }
</style>
