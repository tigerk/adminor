<script setup lang="ts">
  import { reactive, ref } from "vue";
  import { useI18n } from "vue-i18n";
  import type { FormInstance } from "element-plus";
  import { $t, transformI18n } from "@/plugins/i18n";
  import { message } from "@/utils/message";
  import { phoneRules } from "../utils/rule";
  import { useVerifyCode } from "../utils/verifyCode";
  import Motion from "../utils/motion";
  import Phone from "~icons/ri/smartphone-line";
  import Shield from "~icons/ri/shield-keyhole-line";
  import ArrowLeft from "~icons/ri/arrow-left-line";
  import QrCode from "~icons/ri/qr-code-line";

  const emit = defineEmits<{
    (e: "switchMode", mode: "account" | "phone" | "qrcode"): void;
    (e: "openForgot"): void;
  }>();

  const { t } = useI18n();
  const loading = ref(false);
  const ruleFormRef = ref<FormInstance>();
  const ruleForm = reactive({
    phone: "",
    verifyCode: ""
  });
  const { isDisabled, text } = useVerifyCode();

  const onLogin = async (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    loading.value = true;
    await formEl.validate(valid => {
      if (!valid) {
        loading.value = false;
        return;
      }

      setTimeout(() => {
        message(transformI18n($t("login.pureLoginSuccess")), {
          type: "success"
        });
        loading.value = false;
      }, 800);
    });
  };
</script>

<template>
  <div class="phone-login">
    <div class="phone-login__head">
      <div>
        <h3>手机验证码登录</h3>
        <p>适合现场签约、移动巡检和临时设备登录，输入手机号即可验证身份。</p>
      </div>
      <button type="button" class="ghost-link" @click="emit('switchMode', 'account')">
        <el-icon><ArrowLeft /></el-icon>
        返回账号登录
      </button>
    </div>

    <el-form ref="ruleFormRef" :model="ruleForm" :rules="phoneRules" class="phone-form">
      <Motion>
        <el-form-item prop="phone">
          <el-input v-model="ruleForm.phone" clearable size="large" :placeholder="t('login.purePhone')">
            <template #prefix>
              <el-icon><Phone /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </Motion>

      <Motion :delay="100">
        <el-form-item prop="verifyCode">
          <div class="verify-row">
            <el-input v-model="ruleForm.verifyCode" clearable size="large" :placeholder="t('login.pureSmsVerifyCode')">
              <template #prefix>
                <el-icon><Shield /></el-icon>
              </template>
            </el-input>
            <el-button class="verify-btn" :disabled="isDisabled" @click="useVerifyCode().start(ruleFormRef, 'phone')">
              {{ text.length > 0 ? `${text}s 后重发` : t("login.pureGetVerifyCode") }}
            </el-button>
          </div>
        </el-form-item>
      </Motion>

      <Motion :delay="140">
        <div class="phone-login__tips">
          <span>验证码登录后自动绑定当前设备的安全记录。</span>
          <button type="button" @click="emit('openForgot')">无法接收短信？</button>
        </div>
      </Motion>

      <Motion :delay="180">
        <el-button class="submit-btn" size="large" type="primary" :loading="loading" @click="onLogin(ruleFormRef)">
          {{ t("login.pureLogin") }}
        </el-button>
      </Motion>
    </el-form>

    <Motion :delay="220">
      <div class="switch-card">
        <div>
          <strong>在电脑端继续？</strong>
          <span>也可以切换成二维码登录，用企业微信或移动端直接扫码。</span>
        </div>
        <button type="button" class="ghost-action" @click="emit('switchMode', 'qrcode')">
          <el-icon><QrCode /></el-icon>
          切换二维码
        </button>
      </div>
    </Motion>
  </div>
</template>

<style scoped lang="scss">
  .phone-login {
    color: var(--shell-text, #0f172a);
  }

  .phone-login__head {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 18px;

    h3 {
      margin: 0 0 8px;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.03em;
    }

    p {
      margin: 0;
      font-size: 14px;
      line-height: 1.7;
      color: var(--shell-text-soft, #52637a);
    }
  }

  .ghost-link,
  .ghost-action {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
    height: 40px;
    padding: 0 14px;
    font-size: 13px;
    font-weight: 700;
    color: var(--shell-primary, #2563eb);
    background: var(--shell-primary-soft, rgb(37 99 235 / 10%));
    border: 1px solid rgb(37 99 235 / 16%);
    border-radius: 14px;
    transition: 0.2s ease;
  }

  .phone-form {
    :deep(.el-form-item) {
      margin-bottom: 16px;
    }

    :deep(.el-form-item__label) {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-family: "JetBrains Mono", ui-monospace, monospace;
    }
  }

  .verify-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 132px;
    gap: 12px;
    width: 100%;
  }

  .verify-btn,
  .submit-btn {
    height: 56px;
    border-radius: 18px;
  }

  .phone-login__tips {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 4px 0 18px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--shell-text-soft, #52637a);

    button {
      font-weight: 700;
      color: var(--shell-primary, #2563eb);
      white-space: nowrap;
    }
  }

  .submit-btn {
    width: 100%;
    font-size: 15px;
    font-weight: 800;
  }

  .switch-card {
    display: flex;
    gap: 14px;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px;
    margin-top: 18px;
    background: rgb(148 163 184 / 7%);
    border: 1px solid rgb(148 163 184 / 14%);
    border-radius: 20px;

    strong,
    span {
      display: block;
    }

    strong {
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 800;
    }

    span {
      font-size: 13px;
      line-height: 1.6;
      color: var(--shell-text-soft, #52637a);
    }
  }

  @media (width <= 768px) {
    .phone-login__head,
    .phone-login__tips,
    .switch-card {
      flex-direction: column;
      align-items: stretch;
    }

    .verify-row {
      grid-template-columns: 1fr;
    }
  }
</style>
