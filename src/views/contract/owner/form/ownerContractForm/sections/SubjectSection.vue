<template>
  <el-card shadow="never" class="form-card form-card--subject">
    <template #header>
      <div class="card-header">
        <div class="header-inline">
          <span class="card-title">签约房源</span>
          <span class="card-desc card-desc--inline">先确认本次合同按房源还是集中式签约，再打开对应选择器。</span>
        </div>
        <div class="card-header-form">
          <el-tag effect="plain">类型：{{ currentSubjectTypeLabel }}</el-tag>
          <el-tag effect="plain">已选：{{ form.contractSubjectList.length }} {{ currentSubjectUnit }}</el-tag>
          <el-tag effect="plain">已配置：{{ configuredSubjectCount }} {{ currentSubjectUnit }}</el-tag>
          <el-button type="primary" size="small" @click="emit('openPicker')">
            <Plus />
            选择房源
          </el-button>
        </div>
      </div>
    </template>

    <el-form-item label-width="0" prop="contractSubjectList">
      <div class="selected-house-wrapper">
        <div v-if="form.contractSubjectList.length" class="selected-house-panel">
          <div class="selected-house-tags">
            <div v-for="item in form.contractSubjectList" :key="`${item.subjectType}-${item.subjectId}`" class="selected-house-chip">
              <div class="selected-house-chip__body">
                <el-tag size="small" effect="plain" class="selected-house-chip__type">
                  {{ getSubjectTypeShortLabel(item.subjectType) }}
                </el-tag>
                <div class="selected-house-chip__title">{{ item.subjectName || "未命名房源" }}</div>
              </div>
              <el-button link type="danger" @click="emit('removeSubject', item.subjectType, item.subjectId)">移除</el-button>
            </div>
          </div>
        </div>
        <el-empty v-else description="点击右上角“选择房源”，先确认签约类型后再选择具体房源" :image-size="90" />
      </div>
    </el-form-item>
  </el-card>
</template>

<script setup lang="ts">
  import type { OwnerContractSubjectTypeEnum } from "@/types/generated";
  import Plus from "~icons/ep/plus";
  import type { OwnerContractForm } from "../model/ownerContractFormTypes";

  defineProps<{
    form: OwnerContractForm;
    configuredSubjectCount: number;
    selectedSubjectType: OwnerContractSubjectTypeEnum;
    currentSubjectTypeLabel: string;
    currentSubjectTypeDesc: string;
    currentSubjectUnit: string;
    getSubjectTypeShortLabel: (type?: OwnerContractSubjectTypeEnum) => string;
  }>();

  const emit = defineEmits<{
    openPicker: [];
    clearSelection: [];
    removeSubject: [subjectType: OwnerContractSubjectTypeEnum, subjectId: string];
  }>();
</script>
