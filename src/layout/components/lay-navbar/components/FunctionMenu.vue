<template>
  <div class="function-menu-container">
    <!-- 触发按钮 -->
    <el-dropdown trigger="click" popper-class="function-menu-popper" @visible-change="handleVisibleChange">
      <el-button class="function-menu-trigger">
        <el-icon class="trigger-icon add-icon">
          <Plus />
        </el-icon>
        <span class="trigger-text">添加</span>
        <el-icon class="trigger-icon arrow-icon">
          <ArrowDown />
        </el-icon>
      </el-button>

      <!-- 下拉菜单 -->
      <template #dropdown>
        <el-dropdown-menu class="function-dropdown-menu">
          <!-- 分组：合同管理 -->
          <div class="menu-group">
            <div class="group-title">合同管理</div>
            <el-dropdown-item class="menu-item" @click="handleMenuClick('tenant-contract')">
              <div class="menu-content">
                <div class="icon-wrapper orange">
                  <el-icon><Document /></el-icon>
                </div>
                <span class="menu-text">租客合同</span>
              </div>
            </el-dropdown-item>
            <el-dropdown-item class="menu-item" @click="handleMenuClick('owner-contract')">
              <div class="menu-content">
                <div class="icon-wrapper blue">
                  <el-icon><DocumentChecked /></el-icon>
                </div>
                <span class="menu-text">房东合同</span>
              </div>
            </el-dropdown-item>
          </div>

          <!-- 分组：房源管理 -->
          <div class="menu-group">
            <div class="group-title">房源管理</div>
            <el-dropdown-item class="menu-item" @click="handleMenuClick('shared-rental')">
              <div class="menu-content">
                <div class="icon-wrapper purple">
                  <el-icon><Calendar /></el-icon>
                </div>
                <span class="menu-text">合租房源</span>
              </div>
            </el-dropdown-item>
            <el-dropdown-item class="menu-item" @click="handleMenuClick('whole-rental')">
              <div class="menu-content">
                <div class="icon-wrapper blue">
                  <el-icon><House /></el-icon>
                </div>
                <span class="menu-text">整租房源</span>
              </div>
            </el-dropdown-item>
            <el-dropdown-item class="menu-item" @click="handleMenuClick('standalone-project')">
              <div class="menu-content">
                <div class="icon-wrapper green">
                  <el-icon><OfficeBuilding /></el-icon>
                </div>
                <span class="menu-text">集中式项目</span>
              </div>
            </el-dropdown-item>
          </div>

          <!-- 分组：客户管理 -->
          <div class="menu-group">
            <div class="group-title">客户管理</div>
            <el-dropdown-item class="menu-item" @click="handleMenuClick('potential-customer')">
              <div class="menu-content">
                <div class="icon-wrapper cyan">
                  <el-icon><User /></el-icon>
                </div>
                <span class="menu-text">潜在客户</span>
              </div>
            </el-dropdown-item>
            <el-dropdown-item class="menu-item" @click="handleMenuClick('potential-owner')">
              <div class="menu-content">
                <div class="icon-wrapper orange">
                  <el-icon><UserFilled /></el-icon>
                </div>
                <span class="menu-text">潜在业主</span>
              </div>
            </el-dropdown-item>
            <el-dropdown-item class="menu-item" @click="handleMenuClick('reservation')">
              <div class="menu-content">
                <div class="icon-wrapper pink">
                  <el-icon><Edit /></el-icon>
                </div>
                <span class="menu-text">办预定</span>
              </div>
            </el-dropdown-item>
          </div>

          <!-- 分组：工单服务 -->
          <div class="menu-group">
            <div class="group-title">工单服务</div>
            <el-dropdown-item class="menu-item" @click="handleMenuClick('billing')">
              <div class="menu-content">
                <div class="icon-wrapper green">
                  <el-icon><Tickets /></el-icon>
                </div>
                <span class="menu-text">账单</span>
              </div>
            </el-dropdown-item>
            <el-dropdown-item class="menu-item" @click="handleMenuClick('maintenance')">
              <div class="menu-content">
                <div class="icon-wrapper orange">
                  <el-icon><Tools /></el-icon>
                </div>
                <span class="menu-text">维修</span>
              </div>
            </el-dropdown-item>
            <el-dropdown-item class="menu-item" @click="handleMenuClick('cleaning')">
              <div class="menu-content">
                <div class="icon-wrapper cyan">
                  <el-icon><Brush /></el-icon>
                </div>
                <span class="menu-text">保洁</span>
              </div>
            </el-dropdown-item>
            <el-dropdown-item class="menu-item" @click="handleMenuClick('delivery')">
              <div class="menu-content">
                <div class="icon-wrapper blue">
                  <el-icon><Van /></el-icon>
                </div>
                <span class="menu-text">配货</span>
              </div>
            </el-dropdown-item>
            <el-dropdown-item class="menu-item" @click="handleMenuClick('other-work-order')">
              <div class="menu-content">
                <div class="icon-wrapper gray">
                  <el-icon><List /></el-icon>
                </div>
                <span class="menu-text">其他工单</span>
              </div>
            </el-dropdown-item>
          </div>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
  import { ArrowDown, Brush, Calendar, Document, DocumentChecked, Edit, House, List, OfficeBuilding, Plus, Tickets, Tools, User, UserFilled, Van } from "@element-plus/icons-vue";
  import { ElMessage } from "element-plus";
  import { useFocusEdit } from "@/views/house/components/FocusCreate/utils/hook";

  const { openFocusEditDialog } = useFocusEdit();

  // 处理下拉菜单显示状态变化
  const handleVisibleChange = (visible: boolean) => {
    if (visible) {
      console.log("菜单打开");
    } else {
      console.log("菜单关闭");
    }
  };

  // 处理菜单项点击事件
  const handleMenuClick = (menuType: string) => {
    console.log(`点击了菜单: ${menuType}`);

    switch (menuType) {
      case "tenant-contract":
        handleTenantContract();
        break;
      case "owner-contract":
        handleOwnerContract();
        break;
      case "shared-rental":
        handleSharedRental();
        break;
      case "whole-rental":
        handleWholeRental();
        break;
      case "potential-customer":
        handlePotentialCustomer();
        break;
      case "standalone-project":
        handleStandaloneProject();
        break;
      case "potential-owner":
        handlePotentialOwner();
        break;
      case "reservation":
        handleReservation();
        break;
      case "billing":
        handleBilling();
        break;
      case "maintenance":
        handleMaintenance();
        break;
      case "cleaning":
        handleCleaning();
        break;
      case "delivery":
        handleDelivery();
        break;
      case "other-work-order":
        handleOtherWorkOrder();
        break;
      default:
        ElMessage.warning("未知的菜单类型");
    }
  };

  const handleTenantContract = () => {
    ElMessage.success("打开租客合同模块");
  };

  const handleOwnerContract = () => {
    ElMessage.success("打开房东合同模块");
  };

  const handleSharedRental = () => {
    ElMessage.success("打开合租房源模块");
  };

  const handleWholeRental = () => {
    ElMessage.success("打开整租房源模块");
  };

  const handlePotentialCustomer = () => {
    ElMessage.success("打开潜在客户模块");
  };

  const handleStandaloneProject = () => {
    openFocusEditDialog();
  };

  const handlePotentialOwner = () => {
    ElMessage.success("打开潜在业主模块");
  };

  const handleReservation = () => {
    ElMessage.success("打开办预定模块");
  };

  const handleBilling = () => {
    ElMessage.success("打开账单模块");
  };

  const handleMaintenance = () => {
    ElMessage.success("打开维修模块");
  };

  const handleCleaning = () => {
    ElMessage.success("打开保洁模块");
  };

  const handleDelivery = () => {
    ElMessage.success("打开配货模块");
  };

  const handleOtherWorkOrder = () => {
    ElMessage.success("打开其他工单模块");
  };
</script>

<style lang="scss" scoped>
  .function-menu-container {
    display: inline-block;
  }

  .function-menu-trigger {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 33px;
    padding: 0 14px;
    font-size: 13px;
    font-weight: 500;
    color: #fff;
    background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%);
    border: none;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(244, 63, 94, 0.35);
    transition: all 0.25s ease;

    &:hover {
      background: linear-gradient(135deg, #e11d48 0%, #db2777 100%);
      box-shadow: 0 4px 16px rgba(244, 63, 94, 0.45);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(244, 63, 94, 0.35);
    }

    .trigger-icon {
      font-size: 14px;
      transition: transform 0.25s ease;
    }

    .trigger-text {
      margin: 0 2px;
    }
  }

  // 触发器获得焦点或下拉展开时箭头旋转
  .el-dropdown:focus-within,
  .el-dropdown[aria-expanded="true"] {
    .arrow-icon {
      transform: rotate(180deg);
    }
  }
</style>

<!-- 全局样式 - 下拉弹出层 -->
<style lang="scss">
  .function-menu-popper {
    &.el-dropdown__popper {
      padding: 0 !important;
      border: none !important;
      border-radius: 12px !important;
      box-shadow:
        0 12px 40px rgba(0, 0, 0, 0.12),
        0 4px 12px rgba(0, 0, 0, 0.08) !important;
      overflow: hidden;

      .el-dropdown-menu {
        padding: 8px 0 !important;
        border: none !important;
        background: #fff;
        max-height: 580px;
        overflow-y: auto;

        // 自定义滚动条
        &::-webkit-scrollbar {
          width: 5px;
        }

        &::-webkit-scrollbar-track {
          background: transparent;
        }

        &::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 3px;

          &:hover {
            background: #d1d5db;
          }
        }
      }
    }

    // 分组样式
    .menu-group {
      padding: 4px 0;

      &:not(:last-child) {
        border-bottom: 1px solid #f3f4f6;
        margin-bottom: 4px;
      }

      .group-title {
        padding: 8px 16px 6px;
        font-size: 11px;
        font-weight: 600;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    // 菜单项样式
    .menu-item {
      margin: 2px 8px;
      padding: 0 !important;
      border-radius: 8px;
      transition: all 0.2s ease;

      &:hover {
        background: #f8fafc !important;

        .menu-content .menu-text {
          color: #1f2937;
        }
      }

      &:active {
        background: #f1f5f9 !important;
      }

      .menu-content {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        width: 100%;

        .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          flex-shrink: 0;
          transition: transform 0.2s ease;

          .el-icon {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100%;
            height: 100%;
            font-size: 16px;
            color: #fff;

            svg {
              width: 16px;
              height: 16px;
            }
          }

          // 图标颜色
          &.orange {
            background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
            box-shadow: 0 2px 6px rgba(249, 115, 22, 0.3);
          }

          &.blue {
            background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
            box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
          }

          &.green {
            background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
            box-shadow: 0 2px 6px rgba(34, 197, 94, 0.3);
          }

          &.cyan {
            background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
            box-shadow: 0 2px 6px rgba(6, 182, 212, 0.3);
          }

          &.purple {
            background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
            box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
          }

          &.pink {
            background: linear-gradient(135deg, #f472b6 0%, #ec4899 100%);
            box-shadow: 0 2px 6px rgba(236, 72, 153, 0.3);
          }

          &.gray {
            background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
            box-shadow: 0 2px 6px rgba(107, 114, 128, 0.3);
          }
        }

        .menu-text {
          font-size: 14px;
          font-weight: 500;
          color: #4b5563;
          white-space: nowrap;
          transition: color 0.2s ease;
        }
      }

      // hover 时图标微动
      &:hover .icon-wrapper {
        transform: scale(1.05);
      }
    }
  }

  /* ========== 暗黑模式适配 ========== */
  html.dark {
    .function-menu-trigger {
      background: linear-gradient(135deg, #be123c 0%, #be185d 100%);
      box-shadow: 0 2px 8px rgba(190, 18, 60, 0.4);

      &:hover {
        background: linear-gradient(135deg, #9f1239 0%, #9d174d 100%);
        box-shadow: 0 4px 16px rgba(190, 18, 60, 0.5);
      }
    }

    .function-menu-popper {
      &.el-dropdown__popper {
        box-shadow:
          0 12px 40px rgba(0, 0, 0, 0.5),
          0 4px 12px rgba(0, 0, 0, 0.3) !important;

        .el-dropdown-menu {
          background: #1f2937;

          &::-webkit-scrollbar-thumb {
            background: #4b5563;

            &:hover {
              background: #6b7280;
            }
          }
        }
      }

      .menu-group {
        &:not(:last-child) {
          border-bottom-color: #374151;
        }

        .group-title {
          color: #6b7280;
        }
      }

      .menu-item {
        &:hover {
          background: #374151 !important;

          .menu-content .menu-text {
            color: #f9fafb;
          }
        }

        &:active {
          background: #4b5563 !important;
        }

        .menu-content {
          .icon-wrapper {
            // 暗黑模式下图标更亮
            &.orange {
              background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            }

            &.blue {
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            }

            &.green {
              background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            }

            &.cyan {
              background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
            }

            &.purple {
              background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            }

            &.pink {
              background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
            }

            &.gray {
              background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
            }
          }

          .menu-text {
            color: #d1d5db;
          }
        }
      }
    }
  }

  /* ========== 过渡动画 ========== */
  @keyframes menuFadeIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .function-menu-popper {
    &.el-dropdown__popper {
      animation: menuFadeIn 0.2s ease-out;
    }
  }
</style>
