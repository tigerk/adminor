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
  import ArrowRight from "~icons/ri/arrow-right-line";

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
  const { isDisabled, text, start } = useVerifyCode();

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
    <el-form ref="ruleFormRef" :model="ruleForm" :rules="phoneRules" class="phone-form">
      <Motion>
        <el-form-item prop="phone">
          <div class="form-group">
            <label class="form-label">手机号</label>
            <el-input v-model="ruleForm.phone" class="auth-input" clearable :placeholder="t('login.purePhone')">
              <template #prefix>
                <el-icon class="input-icon"><Phone /></el-icon>
              </template>
            </el-input>
          </div>
        </el-form-item>
      </Motion>

      <Motion :delay="100">
        <el-form-item prop="verifyCode">
          <div class="form-group">
            <label class="form-label">验证码</label>
            <div class="verify-row">
              <el-input v-model="ruleForm.verifyCode" class="auth-input" clearable :placeholder="t('login.pureSmsVerifyCode')">
                <template #prefix>
                  <el-icon class="input-icon"><Shield /></el-icon>
                </template>
              </el-input>
              <button type="button" class="verify-btn" :disabled="isDisabled" @click="start(ruleFormRef, 'phone')">
                {{ text.length > 0 ? `${text}s 后重发` : t("login.pureGetVerifyCode") }}
              </button>
            </div>
          </div>
        </el-form-item>
      </Motion>

      <Motion :delay="140">
        <div class="phone-login__meta">
          <div class="phone-login__tips">验证码登录后自动绑定当前设备的安全记录。</div>
          <button type="button" class="minor-link" @click="emit('openForgot')">无法接收短信？</button>
        </div>
      </Motion>

      <Motion :delay="180">
        <button type="button" class="submit-btn" :disabled="loading" @click="onLogin(ruleFormRef)">
          <span>{{ loading ? "验证中…" : "验证登录" }}</span>
          <el-icon v-if="!loading"><ArrowRight /></el-icon>
        </button>
      </Motion>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
  .phone-login {
    color: var(--text, #241f1b);
  }

  .phone-form {
    :deep(.el-form-item) {
      margin-bottom: 0;
    }

    :deep(.el-form-item__content) {
      display: block;
      width: 100%;
    }

    :deep(.el-form-item__error) {
      position: static;
      padding-top: 6px;
      font-size: 11px;
    }
  }

  .form-group {
    width: 100%;
    margin-bottom: 18px;
  }

  .form-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.03em;
    color: var(--text-soft, #827873);
    text-transform: uppercase;
    font-family: var(--mono, "JetBrains Mono", ui-monospace, monospace);
  }

  .auth-input {
    width: 100%;

    :deep(.el-input__wrapper) {
      height: 52px;
      padding: 0 16px;
      background: var(--bg, #f7f3ec);
      border: 1.5px solid var(--border, rgb(145 89 39 / 12%)) !important;
      border-radius: 14px !important;
      box-shadow: none !important;
      transition: 0.2s ease;
    }

    :deep(.el-input__wrapper:hover) {
      border-color: var(--border-strong, rgb(145 89 39 / 22%)) !important;
    }

    :deep(.el-input__wrapper.is-focus) {
      border-color: var(--accent, #c76e00) !important;
      box-shadow: 0 0 0 3px var(--accent-bg, rgb(199 110 0 / 8%)) !important;
      background: var(--surface-solid, #fff);
    }

    :deep(.el-input__inner) {
      font-size: 15px;
      color: var(--text, #241f1b);

      &::placeholder {
        color: var(--text-faint, #ab9f98);
      }
    }
  }

  .input-icon {
    color: var(--text-faint, #ab9f98);
  }

  .verify-row {
    display: grid;
    grid-template-columns: 1fr 140px;
    gap: 10px;
    width: 100%;
  }

  .verify-btn {
    height: 50px;
    color: var(--accent, #c76e00);
    background: var(--accent-bg, rgb(199 110 0 / 8%));
    border: 1px solid var(--accent-border, rgb(199 110 0 / 18%));
    border-radius: 14px;
    font-size: 13px;
    font-weight: 700;
    transition: 0.2s ease;
  }

  .verify-btn:hover:not(:disabled) {
    color: #fff;
    background: var(--accent, #c76e00);
    border-color: var(--accent, #c76e00);
  }

  .verify-btn:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  .phone-login__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 4px 0 18px;
  }

  .phone-login__tips {
    font-size: 12px;
    line-height: 1.6;
    color: var(--text-faint, #ab9f98);
    font-family: var(--mono, "JetBrains Mono", ui-monospace, monospace);
  }

  .minor-link {
    padding: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--accent, #c76e00);
    white-space: nowrap;
    background: none;
    border: none;
  }

  .submit-btn {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 52px;
    color: #fff;
    background: var(--accent, #c76e00);
    border: none;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 700;
    transition: 0.25s ease;
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 12px 28px rgb(199 110 0 / 30%);
  }

  .submit-btn:disabled {
    cursor: not-allowed;
    opacity: 0.72;
  }

  @media (width <= 768px) {
    .phone-login__meta {
      flex-direction: column;
      align-items: stretch;
    }

    .verify-row {
      grid-template-columns: 1fr;
    }
  }
</style>
