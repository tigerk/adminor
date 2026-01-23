<script setup lang="ts">
  import { ref } from "vue";
  import { message } from "@/utils/message";

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

  const accountList = ref<AccountItem[]>([
    {
      icon: "ri-lock-password-line",
      title: "账户密码",
      description: "定期更换密码可以提高账户安全性",
      value: "当前密码强度：强",
      action: "修改密码",
      type: "password"
    },
    {
      icon: "ri-phone-line",
      title: "登录手机号码",
      description: "用于登录验证和重要通知",
      value: "已绑定手机：158****6789",
      action: "更换手机",
      type: "phone"
    },
    {
      icon: "ri-mail-line",
      title: "邮箱地址",
      description: "用于接收系统通知和找回密码",
      value: "已绑定邮箱：pure***@163.com",
      action: "更换邮箱",
      type: "email"
    }
  ]);

  function handleClick(item: AccountItem) {
    message(`${item.action}功能开发中，请根据具体业务自行实现`, { type: "info" });
  }
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
