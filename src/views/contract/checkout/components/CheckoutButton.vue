<script setup lang="ts">
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";

interface Props {
  tenantId: number;
  tenantStatus: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
});

const router = useRouter();

/** 可退租的状态：生效中(2)、即将到期(3) */
const canCheckoutStatus = [2, 3];

/** 是否可以退租 */
const canCheckout = canCheckoutStatus.includes(props.tenantStatus);

/** 点击退租 */
function handleCheckout() {
  if (!canCheckout) {
    ElMessage.warning("当前状态不允许退租");
    return;
  }

  router.push({
    path: "/tenant/checkout",
    query: { tenantId: props.tenantId }
  });
}
</script>

<template>
  <el-button
    type="warning"
    link
    :disabled="disabled || !canCheckout"
    @click="handleCheckout"
  >
    退租
  </el-button>
</template>
