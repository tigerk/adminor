<script setup lang="ts">
  import { useI18n } from "vue-i18n";
  import { ref, reactive, onBeforeUnmount, computed, watch } from "vue";
  import Motion from "../utils/motion";
  import { message } from "@/utils/message";
  import { updateRules } from "../utils/rule";
  import type { FormInstance } from "element-plus";
  import { useVerifyCode } from "../utils/verifyCode";
  import { $t, transformI18n } from "@/plugins/i18n";
  import { baseUrlApi } from "@/api/utils";
  import Lock from "~icons/ri/lock-fill";
  import Phone from "~icons/ri/phone-fill";
  import Shield from "~icons/ri/shield-keyhole-line";
  import { loginUpdate, sendSmsCode } from "@/api/login";

  const { t } = useI18n();
  const emit = defineEmits<{
    (e: "switchPage", page: string): void;
  }>();

  const loading = ref(false);
  const ruleFormRef = ref<FormInstance>();
  const imageVerifyCode = ref("");
  const captchaImageUrl = ref("");
  const { isDisabled, text } = useVerifyCode();

  // 忘记密码表单
  const forgotForm = reactive({
    phone: "",
    verifyCode: "",
    password: "",
    confirmPassword: ""
  });

  const hasValidPhone = computed(() => /^1\d{10}$/.test(forgotForm.phone));

  const refreshCaptcha = () => {
    if (!hasValidPhone.value) {
      captchaImageUrl.value = "";
      return;
    }
    captchaImageUrl.value = `${baseUrlApi(`captcha/${forgotForm.phone}`)}?t=${Date.now()}`;
  };

  watch(
    () => forgotForm.phone,
    (phone, prevPhone) => {
      if (phone === prevPhone) return;
      forgotForm.verifyCode = "";
      imageVerifyCode.value = "";
      if (phone.length === 11 && hasValidPhone.value) {
        refreshCaptcha();
        return;
      }
      captchaImageUrl.value = "";
    }
  );

  // 确认密码验证规则
  const repeatPasswordRule = [
    {
      validator: (rule, value, callback) => {
        if (value === "") {
          callback(new Error(transformI18n($t("login.purePassWordSureReg"))));
        } else if (forgotForm.password !== value) {
          callback(new Error(transformI18n($t("login.purePassWordDifferentReg"))));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ];

  // 重置密码处理
  const onUpdate = async (formEl: FormInstance | undefined) => {
    loading.value = true;
    if (!formEl) return;
    await formEl.validate(valid => {
      if (valid) {
        // 模拟重置密码请求
        loginUpdate({ phone: forgotForm.phone, verifyCode: forgotForm.verifyCode, password: forgotForm.password }).then(resp => {
          message(transformI18n($t("login.purePassWordUpdateReg")), {
            type: "success"
          });
          emit("switchPage", "login");
          loading.value = false;
        });
      } else {
        loading.value = false;
      }
    });
  };

  const sendVerificationCode = async (formEl: FormInstance | undefined, field: string) => {
    if (!formEl) return;
    await formEl.validateField(field, async valid => {
      if (!valid) {
        return;
      }
      if (!imageVerifyCode.value) {
        message("请输入图形验证码", { type: "warning" });
        if (!captchaImageUrl.value) refreshCaptcha();
        return;
      }

      sendSmsCode({
        phone: forgotForm.phone,
        captcha: imageVerifyCode.value
      })
        .then(() => {
          useVerifyCode().start(ruleFormRef.value, "phone", 60);
          message("验证码已发送", { type: "success" });
        })
        .catch(() => {
          refreshCaptcha();
        });
    });
  };

  // 组件销毁时清理定时器
  onBeforeUnmount(() => {
    useVerifyCode().end();
  });
</script>

<template>
  <Motion key="forgot">
    <div class="form-header">
      <h1 class="form-title">重置密码</h1>
      <p class="form-subtitle">输入您的手机号重置密码</p>
    </div>

    <el-form ref="ruleFormRef" :model="forgotForm" :rules="updateRules" class="auth-form">
      <el-form-item prop="phone">
        <el-input v-model="forgotForm.phone" size="large" clearable placeholder="手机号">
          <template #prefix>
            <el-icon>
              <Phone />
            </el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item v-if="hasValidPhone" class="inline-captcha-item">
        <div class="verify-code-wrapper captcha-wrapper">
          <el-input v-model="imageVerifyCode" size="large" clearable maxlength="4" placeholder="图形验证码">
            <template #prefix>
              <el-icon>
                <Shield />
              </el-icon>
            </template>
          </el-input>
          <button type="button" class="captcha-box" @click="refreshCaptcha">
            <img v-if="captchaImageUrl" :src="captchaImageUrl" alt="图形验证码" class="captcha-image" />
            <span v-else>加载验证码</span>
          </button>
        </div>
        <p class="captcha-tip">手机号输入完成后自动显示，点击图片可刷新</p>
      </el-form-item>

      <el-form-item prop="verifyCode">
        <div class="verify-code-wrapper">
          <el-input v-model="forgotForm.verifyCode" size="large" clearable placeholder="验证码">
            <template #prefix>
              <el-icon>
                <Shield />
              </el-icon>
            </template>
          </el-input>
          <el-button class="verify-btn" :disabled="isDisabled" @click="sendVerificationCode(ruleFormRef, 'phone')">
            {{ text.length > 0 ? text + t("login.pureInfo") : "获取验证码" }}
          </el-button>
        </div>
      </el-form-item>

      <el-form-item prop="password">
        <el-input v-model="forgotForm.password" size="large" type="password" placeholder="新密码">
          <template #prefix>
            <el-icon>
              <Lock />
            </el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item :rules="repeatPasswordRule" prop="confirmPassword">
        <el-input v-model="forgotForm.confirmPassword" size="large" type="password" placeholder="确认新密码">
          <template #prefix>
            <el-icon>
              <Lock />
            </el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="onUpdate(ruleFormRef)">重置密码</el-button>

      <div class="switch-page">
        <el-space>
          <span>想起密码了？</span>
          <el-button link type="primary" @click="emit('switchPage', 'login')">返回登录</el-button>
        </el-space>
      </div>
    </el-form>
  </Motion>
</template>

<style scoped lang="scss">
  .form-header,
  .auth-form,
  .verify-code-wrapper,
  .captcha-box,
  .submit-btn,
  .switch-page {
    --login-title: #10233d;
    --login-text: #47607b;
    --login-muted: #6f8197;
    --login-primary: #2364ff;
    --login-primary-strong: #0b4ddd;
    --login-border: rgba(134, 156, 184, 0.18);
    --login-input-bg: rgba(255, 255, 255, 0.72);
    --login-dark-title: #f5f8ff;
    --login-dark-text: #b0bfd5;
    --login-dark-muted: #89a0bd;
    --login-dark-border: rgba(255, 255, 255, 0.08);
    --login-dark-input-bg: rgba(7, 16, 28, 0.88);
  }

  .form-header {
    margin-bottom: 36px;
    text-align: center;
  }

  .form-title {
    margin-bottom: 8px;
    font-size: 28px;
    font-weight: 700;
    color: var(--login-title);
    transition: color 0.3s ease;
  }

  .form-subtitle {
    font-size: 14px;
    color: var(--login-text);
    transition: color 0.3s ease;
  }

  .auth-form {
    :deep(.el-form-item) {
      margin-bottom: 18px;
    }

    :deep(.el-input__wrapper) {
      min-height: 54px;
      padding: 0 16px;
      background: var(--login-input-bg);
      border: 1px solid var(--login-border);
      border-radius: 18px;
      box-shadow: none !important;
      transition: all 0.3s;

      &:hover {
        border-color: rgba(134, 156, 184, 0.32);
      }

      &.is-focus {
        border-color: var(--login-primary);
        box-shadow: 0 0 0 3px rgba(35, 100, 255, 0.14) !important;
      }
    }

    :deep(.el-input__inner) {
      height: 46px;
      font-size: 15px;
      color: var(--login-title);

      &::placeholder {
        color: var(--login-muted);
      }
    }

    :deep(.el-input__prefix) {
      color: var(--login-muted);
    }
  }

  .verify-code-wrapper {
    display: flex;
    gap: 12px;

    .verify-btn {
      flex-shrink: 0;
      height: 54px;
      padding: 0 20px;
      border-radius: 18px;
    }
  }

  .captcha-wrapper {
    align-items: stretch;
  }

  .inline-captcha-item {
    margin-top: -6px;
  }

  .captcha-box {
    flex-shrink: 0;
    width: 140px;
    height: 54px;
    padding: 0;
    overflow: hidden;
    color: var(--login-muted);
    background: var(--login-input-bg);
    border: 1px solid var(--login-border);
    border-radius: 18px;
    transition: all 0.3s;
  }

  .captcha-box:hover {
    border-color: rgba(134, 156, 184, 0.32);
  }

  .captcha-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .captcha-tip {
    margin: 8px 0 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--login-muted);
  }

  .submit-btn {
    width: 100%;
    height: 52px;
    margin-bottom: 24px;
    font-size: 15px;
    font-weight: 700;
    background: linear-gradient(135deg, var(--login-primary) 0%, var(--login-primary-strong) 100%);
    border: none;
    border-radius: 16px;
    box-shadow: 0 18px 36px rgba(35, 100, 255, 0.26);
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 18px 36px rgba(35, 100, 255, 0.3);
      transform: translateY(-1px);
    }
  }

  .switch-page {
    font-size: 14px;
    color: var(--login-text);
    text-align: center;
    transition: color 0.3s ease;

    .el-button {
      font-size: 14px;
    }
  }

  /* Dark mode support - using :global to target parent dark class */
  .login-wrapper.dark {
    .form-title {
      color: var(--login-dark-title) !important;
    }

    .form-subtitle {
      color: var(--login-dark-text);
    }

    .auth-form {
      :deep(.el-form-item__label) {
        color: var(--login-dark-title);
      }

      :deep(.el-input__wrapper) {
        background: var(--login-dark-input-bg);
        border-color: var(--login-dark-border);

        &:hover {
          border-color: rgba(255, 255, 255, 0.16);
        }

        &.is-focus {
          border-color: var(--login-primary);
        }
      }

      :deep(.el-input__inner) {
        color: var(--login-dark-title);

        &::placeholder {
          color: var(--login-dark-muted);
        }
      }

      :deep(.el-input__prefix),
      :deep(.el-input__suffix) {
        color: var(--login-dark-muted);
      }
    }

    .verify-code-wrapper {
      .verify-btn {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.1);
        color: var(--login-dark-title);

        &:hover:not(:disabled) {
          background: rgba(92, 147, 255, 0.16);
          border-color: rgba(92, 147, 255, 0.28);
        }

        &:disabled {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.38);
        }
      }
    }

    .captcha-box {
      color: var(--login-dark-muted);
      background: var(--login-dark-input-bg);
      border-color: var(--login-dark-border);

      &:hover {
        border-color: rgba(255, 255, 255, 0.16);
      }
    }

    .captcha-tip {
      color: var(--login-dark-muted);
    }

    .switch-page {
      color: var(--login-dark-text);

      span {
        color: var(--login-dark-text);
      }

      .el-button {
        color: var(--login-primary);

        &:hover {
          color: #82a8ff;
        }
      }
    }
  }
</style>
