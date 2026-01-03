<script setup lang="ts">
  import { useI18n } from "vue-i18n";
  import { ref, reactive, onBeforeUnmount } from "vue";
  import Motion from "../utils/motion";
  import { message } from "@/utils/message";
  import { updateRules } from "../utils/rule";
  import type { FormInstance } from "element-plus";
  import { useVerifyCode } from "../utils/verifyCode";
  import { $t, transformI18n } from "@/plugins/i18n";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import Lock from "~icons/ri/lock-fill";
  import Phone from "~icons/ri/phone-fill";
  import Shield from "~icons/ri/shield-keyhole-line";
  import { loginUpdate, sendSmsCode } from "@/api/login";

  const { t } = useI18n();
  const emit = defineEmits<{
    (e: "switchPage", page: string): void;
    (e: "showImageVerify", callback: () => void): void;
  }>();

  const loading = ref(false);
  const ruleFormRef = ref<FormInstance>();
  const { isDisabled, text } = useVerifyCode();

  // 忘记密码表单
  const forgotForm = reactive({
    phone: "",
    verifyCode: "",
    password: "",
    confirmPassword: ""
  });

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

  // 发送验证码 - 通知父组件显示图形验证码
  const sendVerificationCode = async (formEl: FormInstance | undefined, field: string) => {
    if (!formEl) return;

    // 先验证手机号
    await formEl.validateField(field, async valid => {
      if (!valid) {
        return;
      }

      // 通知父组件显示图形验证码，并传入回调函数
      emit("showImageVerify", () => {
        // 图形验证码验证成功后的回调
        sendSmsCode({
          phone: forgotForm.phone
        }).then(resp => {
          // 模拟发送验证码
          useVerifyCode().start(ruleFormRef.value, "phone", 60);
          message("验证码已发送", { type: "success" });
        });
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
  .form-header {
    margin-bottom: 36px;
    text-align: center;
  }

  .form-title {
    margin-bottom: 8px;
    font-size: 28px;
    font-weight: 700;
    color: #1a1a1a;
  }

  .form-subtitle {
    font-size: 14px;
    color: #666;
  }

  .auth-form {
    :deep(.el-form-item) {
      margin-bottom: 20px;
    }

    :deep(.el-input__wrapper) {
      padding: 4px 16px;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      box-shadow: none !important;
      transition: all 0.3s;

      &:hover {
        border-color: #c0c0c0;
      }

      &.is-focus {
        border-color: #3478f6;
      }
    }

    :deep(.el-input__inner) {
      height: 40px;
      font-size: 15px;

      &::placeholder {
        color: #999;
      }
    }

    :deep(.el-input__prefix) {
      color: #999;
    }
  }

  .verify-code-wrapper {
    display: flex;
    gap: 12px;

    .verify-btn {
      flex-shrink: 0;
      height: 48px;
      padding: 0 20px;
      border-radius: 10px;
    }
  }

  .submit-btn {
    width: 100%;
    height: 48px;
    margin-bottom: 24px;
    font-size: 16px;
    font-weight: 600;
    background: linear-gradient(135deg, #3478f6 0%, #3478f6 100%);
    border: none;
    border-radius: 10px;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 8px 20px rgba(52, 120, 246, 0.3);
      transform: translateY(-2px);
    }
  }

  .switch-page {
    font-size: 14px;
    color: #666;
    text-align: center;

    .el-button {
      font-size: 14px;
    }
  }

  :global(.dark) {
    .form-title {
      color: #f0f0f0;
    }

    .form-subtitle {
      color: #999;
    }

    .auth-form {
      :deep(.el-input__wrapper) {
        background: #2a2a2a;
        border-color: #3a3a3a;

        &:hover {
          border-color: #4a4a4a;
        }
      }

      :deep(.el-input__inner) {
        color: #f0f0f0;
      }
    }
  }
</style>
