<script setup lang="ts">
  import { ref } from "vue";
  import ReCol from "@/components/ReCol";
  import { formRules } from "../utils/rule";
  import { UserFormProps } from "../utils/types";
  import { usePublicHooks } from "@/utils/publicHooks";
  import { GENDER_OPTIONS, ID_TYPE_OPTIONS } from "@/constants";

  const props = withDefaults(defineProps<UserFormProps>(), {
    formInline: () => ({
      title: "新增",
      userId: null,
      companyUserId: null,
      higherDeptOptions: [],
      deptId: 0,
      nickname: "",
      username: "",
      password: "",
      realName: "",
      idType: 1,
      idNo: "",
      phone: "",
      email: "",
      gender: 1,
      status: 1,
      remark: ""
    })
  });

  const ruleFormRef = ref();
  const { switchStyle } = usePublicHooks();
  const newFormInline = ref(props.formInline);

  function getRef() {
    return ruleFormRef.value;
  }

  defineExpose({ getRef });
</script>

<template>
  <el-form ref="ruleFormRef" :model="newFormInline" :rules="formRules" label-width="82px" label-position="top">
    <el-row :gutter="30">
      <re-col :value="12" :xs="24" :sm="24">
        <el-tooltip content="登录账号" placement="top">
          <el-form-item label="手机号（登录账号）" prop="phone">
            <el-input v-model="newFormInline.phone" clearable placeholder="登录手机号" />
          </el-form-item>
        </el-tooltip>
      </re-col>
      <re-col v-if="newFormInline.title === '新增'" :value="12" :xs="24" :sm="24">
        <el-form-item label="用户密码" prop="password">
          <el-input v-model="newFormInline.password" clearable placeholder="请输入用户密码" />
        </el-form-item>
      </re-col>
      <re-col v-if="newFormInline.title !== '新增'" :value="12" :xs="24" :sm="24">
        &nbsp;
      </re-col>
      <re-col :value="6" :xs="24" :sm="24">
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="newFormInline.realName" clearable placeholder="请输入真实姓名" />
        </el-form-item>
      </re-col>
      <re-col :value="6" :xs="24" :sm="24">
        <el-form-item label="证件类型" prop="idType">
          <el-select v-model="newFormInline.idType" placeholder="请选择证件类型" class="w-full" clearable>
            <el-option v-for="(item, index) in ID_TYPE_OPTIONS" :key="index" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="证件号" prop="idNo">
          <el-input v-model="newFormInline.idNo" clearable placeholder="请输入证件号" />
        </el-form-item>
      </re-col>
      <re-col :value="6" :xs="24" :sm="24">
        <el-form-item label="用户性别">
          <el-radio-group v-model="newFormInline.gender">
            <el-radio-button v-for="(item, index) in GENDER_OPTIONS" :key="index" :label="item.value">{{ item.label }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </re-col>
      <re-col :value="6" :xs="24" :sm="24">
        <el-form-item label="用户昵称" prop="nickname">
          <el-input v-model="newFormInline.nickname" clearable placeholder="请输入用户昵称" />
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="newFormInline.email" clearable placeholder="请输入邮箱" />
        </el-form-item>
      </re-col>

      <re-col :value="18" :xs="24" :sm="24">
        <el-form-item label="归属部门">
          <el-cascader
            v-model="newFormInline.deptId"
            class="w-full"
            :options="newFormInline.higherDeptOptions"
            :props="{
              value: 'id',
              label: 'name',
              emitPath: false,
              checkStrictly: true
            }"
            clearable
            filterable
            placeholder="请选择归属部门"
          >
            <template #default="{ node, data }">
              <span>{{ data.name }}</span>
              <span v-if="!node.isLeaf">({{ data.children.length }})</span>
            </template>
          </el-cascader>
        </el-form-item>
      </re-col>
      <re-col v-if="newFormInline.title === '新增'" :value="6" :xs="24" :sm="24">
        <el-form-item label="用户状态">
          <el-switch v-model="newFormInline.status" inline-prompt :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" :style="switchStyle" />
        </el-form-item>
      </re-col>

      <re-col>
        <el-form-item label="备注">
          <el-input v-model="newFormInline.remark" placeholder="请输入备注信息" type="textarea" />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>
