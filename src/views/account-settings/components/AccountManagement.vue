<script setup lang="ts">
  import { computed, onMounted, ref } from "vue";
  import { message } from "@/utils/message";
  import { getUserProfile, sendAccountEmailSms, sendAccountNewPhoneSms, sendAccountOldPhoneSms, updateAccountEmail, updateAccountPassword, updateAccountPhone } from "@/api/login";
  import { useUserStoreHook } from "@/store/modules/user";

  defineOptions({
    name: "AccountManagement"
  });

  interface AccountItem {
    icon: string;
    title: string;
    description: string;
    value: string;
    action: string;
    type: "password" | "phone" | "email";
  }

  const profile = ref({
    phone: "",
    email: ""
  });

  const accountList = computed<AccountItem[]>(() => [
    {
      icon: "ri-lock-password-line",
      title: "账户密码",
      description: "定期更换密码可以提高账户安全性",
      value: "修改后需重新登录",
      action: "修改密码",
      type: "password"
    },
    {
      icon: "ri-phone-line",
      title: "登录手机号码",
      description: "用于登录验证和重要通知",
      value: profile.value.phone ? `已绑定手机：${maskPhone(profile.value.phone)}` : "未绑定手机",
      action: "更换手机",
      type: "phone"
    },
    {
      icon: "ri-mail-line",
      title: "邮箱地址",
      description: "用于接收系统通知和找回密码",
      value: profile.value.email ? `已绑定邮箱：${maskEmail(profile.value.email)}` : "未绑定邮箱",
      action: "更换邮箱",
      type: "email"
    }
  ]);

  const passwordDialogVisible = ref(false);
  const phoneDialogVisible = ref(false);
  const emailDialogVisible = ref(false);

  const passwordFormRef = ref();
  const phoneFormRef = ref();
  const emailFormRef = ref();

  const passwordForm = ref({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const phoneForm = ref({
    oldVerifyCode: "",
    newPhone: "",
    newVerifyCode: ""
  });

  const emailForm = ref({
    email: "",
    verifyCode: ""
  });

  const oldPhoneCodeCountdown = ref(0);
  const newPhoneCodeCountdown = ref(0);
  const emailCodeCountdown = ref(0);
  let oldPhoneTimer: number | undefined;
  let newPhoneTimer: number | undefined;
  let emailTimer: number | undefined;

  const passwordRules = {
    oldPassword: [{ required: true, message: "请输入原密码", trigger: "blur" }],
    newPassword: [{ required: true, message: "请输入新密码", trigger: "blur" }],
    confirmPassword: [
      { required: true, message: "请确认新密码", trigger: "blur" },
      {
        validator: (_rule, value, callback) => {
          if (value !== passwordForm.value.newPassword) {
            callback(new Error("两次输入的密码不一致"));
            return;
          }
          callback();
        },
        trigger: "blur"
      }
    ]
  };

  const phoneRules = {
    oldVerifyCode: [{ required: true, message: "请输入原手机号验证码", trigger: "blur" }],
    newPhone: [{ required: true, message: "请输入新手机号", trigger: "blur" }],
    newVerifyCode: [{ required: true, message: "请输入新手机号验证码", trigger: "blur" }]
  };

  const emailRules = {
    email: [{ required: true, message: "请输入邮箱", trigger: "blur" }],
    verifyCode: [{ required: true, message: "请输入验证码", trigger: "blur" }]
  };

  function maskPhone(phone: string) {
    if (!phone || phone.length < 7) return phone || "-";
    return phone.slice(0, 3) + "****" + phone.slice(-4);
  }

  function maskEmail(email: string) {
    if (!email || !email.includes("@")) return email || "-";
    const [name, domain] = email.split("@");
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name.slice(0, 2)}***@${domain}`;
  }

  function handleClick(item: AccountItem) {
    if (item.type === "password") passwordDialogVisible.value = true;
    if (item.type === "phone") phoneDialogVisible.value = true;
    if (item.type === "email") emailDialogVisible.value = true;
  }

  function startCountdown(type: "oldPhone" | "newPhone" | "email") {
    if (type === "oldPhone") {
      oldPhoneCodeCountdown.value = 60;
      oldPhoneTimer = window.setInterval(() => {
        oldPhoneCodeCountdown.value -= 1;
        if (oldPhoneCodeCountdown.value <= 0) {
          window.clearInterval(oldPhoneTimer);
        }
      }, 1000);
    } else if (type === "newPhone") {
      newPhoneCodeCountdown.value = 60;
      newPhoneTimer = window.setInterval(() => {
        newPhoneCodeCountdown.value -= 1;
        if (newPhoneCodeCountdown.value <= 0) {
          window.clearInterval(newPhoneTimer);
        }
      }, 1000);
    } else {
      emailCodeCountdown.value = 60;
      emailTimer = window.setInterval(() => {
        emailCodeCountdown.value -= 1;
        if (emailCodeCountdown.value <= 0) {
          window.clearInterval(emailTimer);
        }
      }, 1000);
    }
  }

  async function sendOldPhoneCode() {
    const { code } = await sendAccountOldPhoneSms();
    if (code === 0) {
      message("验证码已发送到原手机号", { type: "success" });
      startCountdown("oldPhone");
    }
  }

  async function sendNewPhoneCode() {
    if (!phoneForm.value.newPhone) {
      message("请输入新手机号", { type: "warning" });
      return;
    }
    const { code } = await sendAccountNewPhoneSms({ phone: phoneForm.value.newPhone });
    if (code === 0) {
      message("验证码已发送到新手机号", { type: "success" });
      startCountdown("newPhone");
    }
  }

  async function sendEmailCode() {
    if (!emailForm.value.email) {
      message("请输入新邮箱", { type: "warning" });
      return;
    }
    const { code } = await sendAccountEmailSms({ email: emailForm.value.email });
    if (code === 0) {
      message("验证码已发送至新邮箱", { type: "success" });
      startCountdown("email");
    }
  }

  async function submitPassword() {
    await passwordFormRef.value.validate();
    const { code, message: errMsg } = await updateAccountPassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    });
    if (code === 0) {
      message("密码修改成功，请重新登录", { type: "success" });
      passwordDialogVisible.value = false;
      useUserStoreHook().logOut();
    } else {
      message(errMsg || "密码修改失败", { type: "error" });
    }
  }

  async function submitPhone() {
    await phoneFormRef.value.validate();
    const { code, message: errMsg } = await updateAccountPhone({
      oldVerifyCode: phoneForm.value.oldVerifyCode,
      newPhone: phoneForm.value.newPhone,
      newVerifyCode: phoneForm.value.newVerifyCode
    });
    if (code === 0) {
      message("手机号修改成功，请重新登录", { type: "success" });
      phoneDialogVisible.value = false;
      useUserStoreHook().logOut();
    } else {
      message(errMsg || "手机号修改失败", { type: "error" });
    }
  }

  async function submitEmail() {
    await emailFormRef.value.validate();
    const { code, message: errMsg } = await updateAccountEmail({
      email: emailForm.value.email,
      verifyCode: emailForm.value.verifyCode
    });
    if (code === 0) {
      message("邮箱修改成功", { type: "success" });
      emailDialogVisible.value = false;
      profile.value.email = emailForm.value.email;
    } else {
      message(errMsg || "邮箱修改失败", { type: "error" });
    }
  }

  function resetPasswordDialog() {
    passwordFormRef.value?.resetFields();
  }

  function resetPhoneDialog() {
    phoneFormRef.value?.resetFields();
  }

  function resetEmailDialog() {
    emailFormRef.value?.resetFields();
  }

  onMounted(() => {
    getUserProfile().then(({ data }) => {
      profile.value.phone = data?.phone ?? "";
      profile.value.email = data?.email ?? "";
    });
  });
</script>

<template>
  <div class="account-management-container">
    <div class="page-header">
      <h3>账户管理</h3>
      <p class="description">管理您的账户安全设置，确保账户信息安全</p>
    </div>

    <div class="account-list">
      <el-card v-for="(item, index) in accountList" :key="index" class="account-item" shadow="hover">
        <div class="item-content">
          <div class="item-icon">
            <el-icon :size="32">
              <IconifyIconOnline :icon="item.icon" />
            </el-icon>
          </div>
          <div class="item-info">
            <div class="info-header">
              <h4>{{ item.title }}</h4>
              <el-tag v-if="item.type === 'password'" type="success" size="small" effect="plain">安全</el-tag>
            </div>
            <p class="info-description">{{ item.description }}</p>
            <p class="info-value">
              <el-icon><IconifyIconOnline icon="ri-checkbox-circle-line" /></el-icon>
              {{ item.value }}
            </p>
          </div>
          <div class="item-action">
            <el-button type="primary" link @click="handleClick(item)">
              {{ item.action }}
              <el-icon class="ml-1"><IconifyIconOnline icon="ri-arrow-right-s-line" /></el-icon>
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 安全提示 -->
    <el-alert title="安全提示" type="warning" :closable="false" show-icon class="security-tip">
      <template #default>
        <ul class="tip-list">
          <li>定期更换密码，建议使用字母、数字、符号组合的强密码</li>
          <li>不要在公共场合透露您的账户信息</li>
          <li>发现账户异常请及时联系客服处理</li>
        </ul>
      </template>
    </el-alert>

    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="520px" @closed="resetPasswordDialog">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="90px" label-position="top">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入原密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请确认新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPassword">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="phoneDialogVisible" title="更换手机号" width="520px" @closed="resetPhoneDialog">
      <el-form ref="phoneFormRef" :model="phoneForm" :rules="phoneRules" label-width="90px" label-position="top">
        <el-form-item label="原手机号验证码" prop="oldVerifyCode">
          <el-input v-model="phoneForm.oldVerifyCode" placeholder="请输入原手机号验证码">
            <template #append>
              <el-button :disabled="oldPhoneCodeCountdown > 0" @click="sendOldPhoneCode">
                {{ oldPhoneCodeCountdown > 0 ? `${oldPhoneCodeCountdown}s` : "发送验证码" }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="新手机号" prop="newPhone">
          <el-input v-model="phoneForm.newPhone" placeholder="请输入新手机号" />
        </el-form-item>
        <el-form-item label="新手机号验证码" prop="newVerifyCode">
          <el-input v-model="phoneForm.newVerifyCode" placeholder="请输入新手机号验证码">
            <template #append>
              <el-button :disabled="newPhoneCodeCountdown > 0" @click="sendNewPhoneCode">
                {{ newPhoneCodeCountdown > 0 ? `${newPhoneCodeCountdown}s` : "发送验证码" }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="phoneDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPhone">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="emailDialogVisible" title="更换邮箱" width="520px" @closed="resetEmailDialog">
      <el-form ref="emailFormRef" :model="emailForm" :rules="emailRules" label-width="90px" label-position="top">
        <el-form-item label="新邮箱" prop="email">
          <el-input v-model="emailForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="验证码" prop="verifyCode">
          <el-input v-model="emailForm.verifyCode" placeholder="请输入验证码">
            <template #append>
              <el-button :disabled="emailCodeCountdown > 0" @click="sendEmailCode">
                {{ emailCodeCountdown > 0 ? `${emailCodeCountdown}s` : "发送验证码" }}
              </el-button>
            </template>
          </el-input>
          <div class="text-xs text-[var(--el-text-color-secondary)] mt-1">验证码将发送至新邮箱</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="emailDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEmail">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
  .account-management-container {
    max-width: 900px;
    margin: 0 auto;

    .page-header {
      margin-bottom: 24px;

      h3 {
        font-size: 20px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin: 0 0 8px 0;
      }

      .description {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin: 0;
      }
    }

    .account-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;

      .account-item {
        border-radius: 8px;
        border: 1px solid var(--el-card-border-color);
        transition: all 0.3s ease;

        &:hover {
          box-shadow: var(--el-box-shadow);
          transform: translateY(-2px);
        }

        .item-content {
          display: flex;
          align-items: center;
          gap: 20px;

          @media (max-width: 768px) {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .item-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 64px;
            height: 64px;
            border-radius: 12px;
            background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
            color: var(--el-color-primary);
            flex-shrink: 0;

            @media (max-width: 768px) {
              width: 56px;
              height: 56px;
            }
          }

          .item-info {
            flex: 1;
            min-width: 0;

            .info-header {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 6px;

              h4 {
                font-size: 16px;
                font-weight: 600;
                color: var(--el-text-color-primary);
                margin: 0;
              }
            }

            .info-description {
              font-size: 13px;
              color: var(--el-text-color-secondary);
              margin: 0 0 8px 0;
              line-height: 1.5;
            }

            .info-value {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 14px;
              color: var(--el-text-color-regular);
              margin: 0;

              .el-icon {
                color: var(--el-color-success);
              }
            }
          }

          .item-action {
            flex-shrink: 0;

            @media (max-width: 768px) {
              width: 100%;

              .el-button {
                width: 100%;
                justify-content: center;
              }
            }

            .el-button {
              font-size: 14px;
              padding: 8px 16px;

              &:hover {
                transform: translateX(2px);
              }
            }
          }
        }
      }
    }

    .security-tip {
      border-radius: 8px;

      :deep(.el-alert__content) {
        flex: 1;
      }

      .tip-list {
        margin: 8px 0 0 0;
        padding-left: 20px;

        li {
          font-size: 13px;
          line-height: 1.8;
          color: var(--el-text-color-regular);

          &:not(:last-child) {
            margin-bottom: 4px;
          }
        }
      }
    }
  }
</style>
