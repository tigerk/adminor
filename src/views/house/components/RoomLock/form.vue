<script setup lang="ts">
  import { computed, ref } from "vue";
  import { createRoomLockRules } from "./utils/rule";
  import type { RoomLockFormProps } from "./utils/types";

  const props = withDefaults(defineProps<RoomLockFormProps>(), {
    formInline: () => ({
      roomId: "",
      roomNumber: "",
      houseName: "",
      lockReason: 1,
      startTime: "",
      endTime: "",
      remark: ""
    })
  });

  const ruleFormRef = ref();
  const newFormInline = ref(props.formInline);
  const formRules = createRoomLockRules(newFormInline.value);
  const isTimedLock = computed(() => Number(newFormInline.value.lockReason) === 2);

  function getRef() {
    return ruleFormRef.value;
  }

  defineExpose({ getRef });
</script>

<template>
  <el-form ref="ruleFormRef" :model="newFormInline" :rules="formRules" label-width="92px">
    <el-form-item label="房间">
      <el-input :model-value="`${newFormInline.houseName || ''} ${newFormInline.roomNumber || ''}`.trim()" disabled />
    </el-form-item>

    <el-form-item label="锁房原因" prop="lockReason">
      <el-radio-group v-model="newFormInline.lockReason">
        <el-radio :value="1">永久锁房</el-radio>
        <el-radio :value="2">指定时间</el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item v-if="isTimedLock" label="开始时间" prop="startTime">
      <el-date-picker
        v-model="newFormInline.startTime"
        type="date"
        value-format="YYYY-MM-DD"
        format="YYYY-MM-DD"
        placeholder="请选择开始时间"
        class="w-full!"
      />
    </el-form-item>

    <el-form-item v-if="isTimedLock" label="结束时间" prop="endTime">
      <el-date-picker
        v-model="newFormInline.endTime"
        type="date"
        value-format="YYYY-MM-DD"
        format="YYYY-MM-DD"
        placeholder="请选择结束时间"
        class="w-full!"
      />
    </el-form-item>

    <el-form-item label="备注">
      <el-input v-model="newFormInline.remark" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="请输入锁房备注（可选）" />
    </el-form-item>
  </el-form>
</template>

