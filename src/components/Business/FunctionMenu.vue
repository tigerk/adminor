<template>
  <div class="function-menu-container">
    <!-- 触发按钮 -->
    <el-dropdown trigger="click" @visible-change="handleVisibleChange">
      <el-button class="function-menu-trigger">
        <el-icon class="mr-1">
          <Plus />
        </el-icon>
        创建
        <el-icon class="ml-1">
          <ArrowDown />
        </el-icon>
      </el-button>

      <!-- 下拉菜单 -->
      <template #dropdown>
        <el-dropdown-menu class="function-dropdown-menu">
          <!-- 租客合同 -->
          <el-dropdown-item class="menu-item" @click="handleMenuClick('tenant-contract')">
            <div class="menu-content">
              <div class="icon-wrapper orange">
                <el-icon>
                  <Document />
                </el-icon>
              </div>
              <span class="menu-text">租客合同</span>
            </div>
          </el-dropdown-item>

          <!-- 房东合同 -->
          <el-dropdown-item class="menu-item" @click="handleMenuClick('owner-contract')">
            <div class="menu-content">
              <div class="icon-wrapper blue">
                <el-icon>
                  <DocumentChecked />
                </el-icon>
              </div>
              <span class="menu-text">房东合同</span>
            </div>
          </el-dropdown-item>

          <!-- 合租房源 -->
          <el-dropdown-item class="menu-item" @click="handleMenuClick('shared-rental')">
            <div class="menu-content">
              <div class="icon-wrapper orange">
                <el-icon>
                  <Calendar />
                </el-icon>
              </div>
              <span class="menu-text">合租房源</span>
            </div>
          </el-dropdown-item>

          <!-- 整租房源 -->
          <el-dropdown-item class="menu-item" @click="handleMenuClick('whole-rental')">
            <div class="menu-content">
              <div class="icon-wrapper blue">
                <el-icon>
                  <House />
                </el-icon>
              </div>
              <span class="menu-text">整租房源</span>
            </div>
          </el-dropdown-item>

          <!-- 潜在客户 -->
          <el-dropdown-item class="menu-item" @click="handleMenuClick('potential-customer')">
            <div class="menu-content">
              <div class="icon-wrapper blue">
                <el-icon>
                  <User />
                </el-icon>
              </div>
              <span class="menu-text">潜在客户</span>
            </div>
          </el-dropdown-item>

          <!-- 集中式项目 -->
          <el-dropdown-item class="menu-item" @click="handleMenuClick('standalone-project')">
            <div class="menu-content">
              <div class="icon-wrapper green">
                <el-icon>
                  <OfficeBuilding />
                </el-icon>
              </div>
              <span class="menu-text">集中式项目</span>
            </div>
          </el-dropdown-item>

          <!-- 潜在业主 -->
          <el-dropdown-item class="menu-item" @click="handleMenuClick('potential-owner')">
            <div class="menu-content">
              <div class="icon-wrapper orange">
                <el-icon>
                  <UserFilled />
                </el-icon>
              </div>
              <span class="menu-text">潜在业主</span>
            </div>
          </el-dropdown-item>

          <!-- 办预定 -->
          <el-dropdown-item class="menu-item" @click="handleMenuClick('reservation')">
            <div class="menu-content">
              <div class="icon-wrapper cyan">
                <el-icon>
                  <Edit />
                </el-icon>
              </div>
              <span class="menu-text">办预定</span>
            </div>
          </el-dropdown-item>

          <!-- 账单 -->
          <el-dropdown-item class="menu-item" @click="handleMenuClick('billing')">
            <div class="menu-content">
              <div class="icon-wrapper green">
                <el-icon>
                  <Tickets />
                </el-icon>
              </div>
              <span class="menu-text">账单</span>
            </div>
          </el-dropdown-item>

          <!-- 维修 -->
          <el-dropdown-item class="menu-item" @click="handleMenuClick('maintenance')">
            <div class="menu-content">
              <div class="icon-wrapper orange">
                <el-icon>
                  <Tools />
                </el-icon>
              </div>
              <span class="menu-text">维修</span>
            </div>
          </el-dropdown-item>

          <!-- 保洁 -->
          <el-dropdown-item class="menu-item" @click="handleMenuClick('cleaning')">
            <div class="menu-content">
              <div class="icon-wrapper cyan">
                <el-icon>
                  <Brush />
                </el-icon>
              </div>
              <span class="menu-text">保洁</span>
            </div>
          </el-dropdown-item>

          <!-- 配货 -->
          <el-dropdown-item class="menu-item" @click="handleMenuClick('delivery')">
            <div class="menu-content">
              <div class="icon-wrapper blue">
                <el-icon>
                  <Van />
                </el-icon>
              </div>
              <span class="menu-text">配货</span>
            </div>
          </el-dropdown-item>

          <!-- 其他工单 -->
          <el-dropdown-item class="menu-item" @click="handleMenuClick('other-work-order')">
            <div class="menu-content">
              <div class="icon-wrapper orange">
                <el-icon>
                  <List />
                </el-icon>
              </div>
              <span class="menu-text">其他工单</span>
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
  import { Plus, ArrowDown, Document, DocumentChecked, Calendar, House, User, OfficeBuilding, UserFilled, Edit, Tickets, Tools, Brush, Van, List } from "@element-plus/icons-vue";
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

    // 根据菜单类型执行不同操作
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

  // 各个功能的处理函数 - 这里可以调用具体的组件或路由跳转
  const handleTenantContract = () => {
    ElMessage.success("打开租客合同模块");
    // 示例：跳转到路由或打开弹窗
    // router.push('/tenant-contract')
    // 或者调用具体的组件方法
  };

  const handleOwnerContract = () => {
    ElMessage.success("打开房东合同模块");
    // 可以在这里调用对应模块的组件
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
    margin-right: 12px;
  }

  .function-menu-trigger {
    display: flex;
    align-items: center;
    height: 32px;
    padding: 6px 16px;
    font-size: 14px;
    font-weight: 500;
    color: white;
    background: linear-gradient(135deg, #e13c39 0%, #764ba2 100%);
    border: none;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgb(102 126 234 / 30%);
    transition: all 0.3s ease;

    &:hover {
      background: linear-gradient(135deg, #e13c39 0%, #6a4190 100%);
      box-shadow: 0 4px 12px rgb(102 126 234 / 40%);
      transform: translateY(-1px);
    }

    &:focus {
      background: linear-gradient(135deg, #e13c39 0%, #764ba2 100%);
      box-shadow:
        0 2px 8px rgb(102 126 234 / 30%),
        0 0 0 2px rgb(102 126 234 / 20%);
    }

    .el-icon {
      font-size: 14px;
    }
  }

  .function-dropdown-menu {
    min-width: 150px;
    max-height: 400px;
    overflow-y: auto;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgb(0 0 0 / 12%);

    // 重置Element Plus的默认样式
    :deep(.el-dropdown-menu__item) {
      height: auto;
      padding: 0;
      line-height: normal;

      &:hover {
        background-color: #f5f7fa;
      }
    }
  }

  .menu-item {
    .menu-content {
      display: flex;
      gap: 12px;
      align-items: center;
      width: 100%;
      padding: 10px 16px;

      .icon-wrapper {
        position: relative;
        display: flex;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 4px;

        .el-icon {
          position: absolute;
          top: 0;
          left: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          font-size: 12px;
          line-height: 1;
          color: white;

          svg {
            display: block;
            width: 12px;
            height: 12px;
          }
        }

        &.orange {
          background-color: #ff9500;
        }

        &.blue {
          background-color: #007aff;
        }

        &.green {
          background-color: #34c759;
        }

        &.cyan {
          background-color: #5ac8fa;
        }
      }

      .menu-text {
        font-size: 14px;
        color: #303133;
        white-space: nowrap;
      }
    }
  }

  // 滚动条样式
  .function-dropdown-menu::-webkit-scrollbar {
    width: 4px;
  }

  .function-dropdown-menu::-webkit-scrollbar-thumb {
    background-color: #dcdfe6;
    border-radius: 2px;
  }

  .function-dropdown-menu::-webkit-scrollbar-thumb:hover {
    background-color: #c0c4cc;
  }
</style>
