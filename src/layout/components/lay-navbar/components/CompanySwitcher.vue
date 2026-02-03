<script setup lang="ts">
  import { ref, computed } from "vue";
  import { ArrowDown, OfficeBuilding } from "@element-plus/icons-vue";
  import Check from "~icons/ep/check";
  import { ElMessage } from "element-plus";
  import { setToken } from "@/utils/auth";
  import { switchCompany } from "@/api/login";
  import { message } from "@/utils/message";
  import { useNav } from "@/layout/hooks/useNav";

  const { getCurCompanyId, getCompanyList } = useNav();

  const selectedCompanyId = ref<any>(getCurCompanyId);

  const currentCompanyName = computed(() => {
    return getCompanyList.value.find(item => item.companyId === selectedCompanyId.value)?.companyName || "";
  });

  // 处理公司切换事件
  const handleCompanyChange = (companyId: string) => {
    if (companyId && companyId !== selectedCompanyId.value) {
      console.log("Switching to company:", companyId);
      switchCompany({ companyId: companyId }).then(r => {
        if (r.code == 0) {
          setToken(r.data);
          message("正在切换公司，请稍后...", {
            duration: 2000
          });
          window.location.reload();
        } else {
          ElMessage.error(r.message);
        }
      });
    }
  };
</script>

<template>
  <el-dropdown trigger="click" class="company-dropdown" popper-class="company-dropdown-popper">
    <div class="company-trigger">
      <div class="company-icon">
        <el-icon :size="16"><OfficeBuilding /></el-icon>
      </div>
      <span class="company-text">{{ currentCompanyName }}</span>
      <el-icon class="arrow-icon" :size="12"><ArrowDown /></el-icon>
    </div>
    <template #dropdown>
      <el-dropdown-menu class="company-menu">
        <div class="menu-header">切换公司</div>
        <el-dropdown-item
          v-for="item in getCompanyList"
          :key="item.companyId"
          :class="['company-option', { 'is-active': item.companyId === selectedCompanyId }]"
          @click="handleCompanyChange(item.companyId)"
        >
          <div class="company-item">
            <div class="company-avatar">
              {{ item.companyName?.charAt(0) }}
            </div>
            <span class="company-name">{{ item.companyName }}</span>
            <el-icon v-if="item.companyId === selectedCompanyId" class="check-icon">
              <Check />
            </el-icon>
          </div>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style lang="scss" scoped>
  .company-dropdown {
    margin-right: 8px;

    .company-trigger {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      &:active {
        transform: translateY(0);
      }

      .company-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 6px;
      }

      .company-text {
        font-size: 13px;
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .arrow-icon {
        transition: transform 0.3s ease;
        opacity: 0.8;
      }
    }

    &:focus-within .company-trigger .arrow-icon,
    &:hover .company-trigger .arrow-icon {
      transform: rotate(180deg);
    }
  }
</style>

<!-- 全局样式 - 用于下拉菜单弹出层 -->
<style lang="scss">
  .company-dropdown-popper {
    &.el-dropdown__popper {
      border-radius: 12px !important;
      box-shadow:
        0 10px 40px rgba(0, 0, 0, 0.15),
        0 2px 10px rgba(0, 0, 0, 0.1) !important;
      border: none !important;
      overflow: hidden;
      margin-top: 8px !important;

      .el-dropdown-menu {
        padding: 0 !important;
        border: none !important;
        background: #fff;
      }
    }

    .menu-header {
      padding: 12px 16px 8px;
      font-size: 12px;
      font-weight: 600;
      color: #8c8c8c;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #f0f0f0;
      background: #fafafa;
    }

    .company-option {
      padding: 0 !important;
      margin: 4px 8px;
      border-radius: 8px;
      transition: all 0.2s ease;

      &:first-of-type {
        margin-top: 8px;
      }

      &:last-child {
        margin-bottom: 8px;
      }

      &:hover {
        background: #f5f7ff !important;
      }

      &.is-active {
        background: linear-gradient(135deg, #e8ecff 0%, #f3e8ff 100%) !important;

        .company-name {
          color: #667eea;
          font-weight: 600;
        }

        .company-avatar {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
        }
      }

      .company-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        width: 100%;

        .company-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #e8ecff;
          color: #667eea;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .company-name {
          flex: 1;
          font-size: 14px;
          color: #333;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .check-icon {
          color: #667eea;
          font-size: 16px;
          flex-shrink: 0;
          animation: checkIn 0.3s ease;
        }
      }
    }
  }

  @keyframes checkIn {
    from {
      opacity: 0;
      transform: scale(0.5);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* 暗黑模式适配 */
  html.dark {
    .company-dropdown {
      .company-trigger {
        background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
      }
    }

    .company-dropdown-popper {
      &.el-dropdown__popper {
        .el-dropdown-menu {
          background: #1f1f1f;
        }
      }

      .menu-header {
        background: #262626;
        border-bottom-color: #333;
        color: #8c8c8c;
      }

      .company-option {
        &:hover {
          background: #2a2a3d !important;
        }

        &.is-active {
          background: linear-gradient(135deg, #2d2d4a 0%, #352d4a 100%) !important;

          .company-avatar {
            background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
          }
        }

        .company-item {
          .company-avatar {
            background: #2d2d4a;
            color: #818cf8;
          }

          .company-name {
            color: #e5e5e5;
          }
        }
      }
    }
  }
</style>
