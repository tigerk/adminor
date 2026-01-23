<script setup lang="ts">
  import { ref } from "vue";
  import { message } from "@/utils/message";

  defineOptions({
    name: "Preferences"
  });

  interface PreferenceItem {
    icon: string;
    title: string;
    description: string;
    checked: boolean;
    category: string;
  }

  const notificationSettings = ref<PreferenceItem[]>([
    {
      icon: "ri-message-3-line",
      title: "系统消息",
      description: "接收系统通知、公告等重要消息",
      checked: true,
      category: "notification"
    },
    {
      icon: "ri-chat-3-line",
      title: "用户消息",
      description: "接收其他用户发送的站内消息",
      checked: true,
      category: "notification"
    },
    {
      icon: "ri-task-line",
      title: "待办任务",
      description: "接收待办任务提醒和截止日期通知",
      checked: true,
      category: "notification"
    }
  ]);

  const displaySettings = ref<PreferenceItem[]>([
    {
      icon: "ri-layout-line",
      title: "紧凑模式",
      description: "使用更紧凑的界面布局，显示更多内容",
      checked: false,
      category: "display"
    },
    {
      icon: "ri-side-bar-line",
      title: "显示侧边栏",
      description: "始终显示左侧导航栏",
      checked: true,
      category: "display"
    }
  ]);

  const privacySettings = ref<PreferenceItem[]>([
    {
      icon: "ri-eye-line",
      title: "在线状态",
      description: "向其他用户显示您的在线状态",
      checked: true,
      category: "privacy"
    },
    {
      icon: "ri-history-line",
      title: "活动记录",
      description: "允许系统记录您的操作日志",
      checked: true,
      category: "privacy"
    }
  ]);

  function onChange(val: boolean, item: PreferenceItem) {
    const statusText = val ? "已开启" : "已关闭";
    message(`${item.title}${statusText}`, { type: "success" });
    // TODO: 调用后端接口保存设置
  }
</script>

<template>
  <div class="preferences-container">
    <div class="page-header">
      <h3>偏好设置</h3>
      <p class="description">自定义您的使用体验，设置通知和显示偏好</p>
    </div>

    <!-- 通知设置 -->
    <div class="settings-section">
      <div class="section-header">
        <el-icon class="section-icon"><i class="ri-notification-3-line" /></el-icon>
        <div>
          <h4>通知设置</h4>
          <p>管理您接收的通知类型</p>
        </div>
      </div>
      <div class="settings-list">
        <el-card v-for="(item, index) in notificationSettings" :key="index" class="setting-item" shadow="hover">
          <div class="item-content">
            <div class="item-left">
              <div class="item-icon">
                <el-icon><i :class="item.icon" /></el-icon>
              </div>
              <div class="item-info">
                <h5>{{ item.title }}</h5>
                <p>{{ item.description }}</p>
              </div>
            </div>
            <div class="item-action">
              <el-switch
                v-model="item.checked"
                inline-prompt
                active-text="开"
                inactive-text="关"
                :active-value="true"
                :inactive-value="false"
                @change="val => onChange(val, item)"
              />
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 显示设置 -->
    <div class="settings-section">
      <div class="section-header">
        <el-icon class="section-icon"><i class="ri-brush-line" /></el-icon>
        <div>
          <h4>显示设置</h4>
          <p>自定义界面显示方式</p>
        </div>
      </div>
      <div class="settings-list">
        <el-card v-for="(item, index) in displaySettings" :key="index" class="setting-item" shadow="hover">
          <div class="item-content">
            <div class="item-left">
              <div class="item-icon">
                <el-icon><i :class="item.icon" /></el-icon>
              </div>
              <div class="item-info">
                <h5>{{ item.title }}</h5>
                <p>{{ item.description }}</p>
              </div>
            </div>
            <div class="item-action">
              <el-switch
                v-model="item.checked"
                inline-prompt
                active-text="开"
                inactive-text="关"
                :active-value="true"
                :inactive-value="false"
                @change="val => onChange(val, item)"
              />
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 隐私设置 -->
    <div class="settings-section">
      <div class="section-header">
        <el-icon class="section-icon"><i class="ri-shield-check-line" /></el-icon>
        <div>
          <h4>隐私设置</h4>
          <p>控制您的隐私和数据使用</p>
        </div>
      </div>
      <div class="settings-list">
        <el-card v-for="(item, index) in privacySettings" :key="index" class="setting-item" shadow="hover">
          <div class="item-content">
            <div class="item-left">
              <div class="item-icon">
                <el-icon><i :class="item.icon" /></el-icon>
              </div>
              <div class="item-info">
                <h5>{{ item.title }}</h5>
                <p>{{ item.description }}</p>
              </div>
            </div>
            <div class="item-action">
              <el-switch
                v-model="item.checked"
                inline-prompt
                active-text="开"
                inactive-text="关"
                :active-value="true"
                :inactive-value="false"
                @change="val => onChange(val, item)"
              />
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .preferences-container {
    max-width: 900px;
    margin: 0 auto;

    .page-header {
      margin-bottom: 32px;

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

    .settings-section {
      margin-bottom: 32px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 2px solid var(--el-border-color-lighter);

        .section-icon {
          font-size: 24px;
          color: var(--el-color-primary);
        }

        h4 {
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin: 0 0 4px 0;
        }

        p {
          font-size: 13px;
          color: var(--el-text-color-secondary);
          margin: 0;
        }
      }

      .settings-list {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .setting-item {
          border-radius: 8px;
          border: 1px solid var(--el-card-border-color);
          transition: all 0.3s ease;

          &:hover {
            box-shadow: var(--el-box-shadow);
          }

          .item-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;

            @media (max-width: 768px) {
              flex-direction: column;
              align-items: flex-start;
            }

            .item-left {
              display: flex;
              align-items: center;
              gap: 16px;
              flex: 1;

              .item-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 48px;
                height: 48px;
                border-radius: 10px;
                background: var(--el-fill-color-light);
                color: var(--el-color-primary);
                flex-shrink: 0;

                .el-icon {
                  font-size: 24px;
                }
              }

              .item-info {
                flex: 1;
                min-width: 0;

                h5 {
                  font-size: 15px;
                  font-weight: 500;
                  color: var(--el-text-color-primary);
                  margin: 0 0 4px 0;
                }

                p {
                  font-size: 13px;
                  color: var(--el-text-color-secondary);
                  margin: 0;
                  line-height: 1.5;
                }
              }
            }

            .item-action {
              flex-shrink: 0;

              @media (max-width: 768px) {
                width: 100%;
                display: flex;
                justify-content: flex-end;
                padding-left: 64px;
              }
            }
          }
        }
      }
    }
  }
</style>
