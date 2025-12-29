<template>
  <div class="tenant-detail-view">
    <!-- 房源信息展示 -->
    <div class="room-info-section">
      <div class="mb-4">
        <el-space spacer=" ">
          <div class="room-header">
            <el-icon class="header-icon"><House /></el-icon>
            <span class="header-title">房源地址</span>
          </div>
          <div class="room-content">
            <el-space wrap :size="10">
              <el-tag v-for="room in formInline.roomList" :key="room.roomId" type="primary" size="large" effect="light" class="room-tag">
                <span class="room-info">{{ room.communityName }} {{ room.doorNumber }}-{{ room.roomNumber }}</span>
                <el-divider direction="vertical" />
                <span class="room-area">{{ room.area }}m²</span>
              </el-tag>
              <el-tag type="primary" size="large" effect="light" class="room-tag">
                <span class="stat-label">房间数量：共</span>
                <span class="stat-value">{{ formInline.roomList?.length || 0 }}</span>
                <span class="stat-unit">间</span>
              </el-tag>
              <el-tag type="primary" size="large" effect="light" class="room-tag">
                <span class="stat-label">总建筑面积：</span>
                <span class="stat-value">{{ getTotalArea() }}</span>
                <span class="stat-unit">m²</span>
              </el-tag>
            </el-space>
          </div>
        </el-space>
      </div>
      <div>
        <el-space spacer=" ">
          <div class="room-header">
            <el-icon class="header-icon"><User /></el-icon>
            <span class="header-title">租约信息</span>
          </div>
          <div class="room-content">
            <div class="room-stats">
              <div class="stat-item">
                <span class="stat-label">租客：</span>
                <span class="stat-value">{{ formInline.tenantName }}</span>
              </div>
              <el-divider direction="vertical" />
              <div class="stat-item">
                <span class="stat-label">月租金总额：</span>
                <span class="stat-value primary">¥{{ formInline.rentPrice }}</span>
                <span class="stat-unit">元/月</span>
              </div>
              <el-divider direction="vertical" />
              <div class="stat-item">
                <span class="stat-label">收款方式：</span>
                <span class="stat-value">押 {{ formInline.depositMonths }} 付 {{ formInline.paymentMonths }}</span>
              </div>
              <el-divider direction="vertical" />
              <div class="stat-item">
                <span class="stat-label">租期：</span>
                <span class="stat-value">
                  <el-space :size="8">
                    {{ formInline.leaseStart }}
                    <span>至</span>
                    {{ formInline.leaseEnd }}
                  </el-space>
                </span>
              </div>
            </div>
          </div>
        </el-space>
      </div>
    </div>
    <!-- 标签页内容 -->
    <el-tabs v-model="activeTab" class="modern-tabs">
      <!-- 租客信息 Tab -->
      <el-tab-pane name="tenant">
        <template #label>
          <el-space>
            <el-icon><User /></el-icon>
            <span>租客信息</span>
            <el-tag :type="formInline.status === 0 ? 'danger' : 'success'" size="default">
              {{ tenantStatusOptions.find(item => item.value === formInline.status)?.label || "未知" }}
            </el-tag>
          </el-space>
        </template>
        <div class="tab-content">
          <!-- 基本信息 -->
          <div class="info-section mt-4">
            <el-descriptions title="基本信息" :column="3" class="info-descriptions" size="default">
              <template #title>
                <el-space>
                  <span>基本信息</span>
                  <el-tag :type="formInline.tenantType === 0 ? 'success' : 'warning'" size="default">
                    {{ formInline.tenantType === 0 ? "个人" : "企业" }}
                  </el-tag>
                </el-space>
              </template>
              <el-descriptions-item label="姓名" label-align="right">
                <el-space>
                  <span class="text-value">{{ formInline.tenantName }}</span>
                  <el-tag type="info" size="small">{{ formInline.tenantPersonal?.gender === 0 ? "男" : "女" }}</el-tag>
                </el-space>
              </el-descriptions-item>
              <el-descriptions-item label="联系电话" label-align="right">
                <span class="text-value">{{ formInline.tenantPhone }}</span>
              </el-descriptions-item>

              <template v-if="formInline.tenantType === 0">
                <el-descriptions-item label="证件类型" label-align="right">
                  <span class="text-value">{{ getIdTypeName(formInline.tenantPersonal?.idType) }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="证件号码" label-align="right">
                  <span class="text-value">{{ formInline.tenantPersonal?.idNo }}</span>
                </el-descriptions-item>
              </template>
              <template v-else>
                <el-descriptions-item label="统一社会信用代码" label-align="right" :span="2">
                  <span class="text-value">{{ formInline.tenantCompany?.uscc }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="法定代表人" label-align="right">
                  <span class="text-value">{{ formInline.tenantCompany?.legalPerson }}</span>
                </el-descriptions-item>
              </template>
              <el-descriptions-item label="签约时间" label-align="right" :span="2">
                <span class="text-value">{{ formInline.createTime }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 租约信息 -->
          <div class="info-section">
            <el-descriptions title="租约信息" :column="3" class="info-descriptions" size="default">
              <el-descriptions-item label="合同周期" label-align="right">
                <el-space :size="8">
                  <el-tag type="primary">{{ formInline.leaseStart }}</el-tag>
                  <span>至</span>
                  <el-tag type="primary">{{ formInline.leaseEnd }}</el-tag>
                </el-space>
              </el-descriptions-item>
              <el-descriptions-item label="月租金" label-align="right">
                <span class="rent-price">¥ {{ formInline.rentPrice }}</span>
                <span class="rent-unit">元/月</span>
              </el-descriptions-item>

              <el-descriptions-item label="押付方式" label-align="right">
                <span class="text-value">押 {{ formInline.depositMonths }} 付 {{ formInline.paymentMonths }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="收租设置" label-align="right">
                <span class="text-value">{{ getRentDueTypeText(formInline.rentDueType, formInline.rentDueDay) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="签约类型" label-align="right">
                <span class="text-value">{{ getContractNatureName(formInline.contractNature) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="入住时间" label-align="right">
                <el-space :size="8">
                  <el-tag type="info">{{ formInline.checkInTime }}</el-tag>
                  <span>至</span>
                  <el-tag type="info">{{ formInline.checkOutTime }}</el-tag>
                </el-space>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 同住人信息 -->

          <!-- 负责人信息 -->
          <div class="info-section">
            <el-descriptions title="负责人信息" :column="3" class="info-descriptions" size="default">
              <el-descriptions-item label="签约部门" label-align="right">
                <span class="text-value">{{ formInline.deptName }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="签约人" label-align="right">
                <span class="text-value">{{ formInline.salesmanName }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="成交渠道" label-align="right">
                <span class="text-value">{{ formInline.dealChannelName }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 同住人信息 -->
          <div v-if="formInline.tenantMateList && formInline.tenantMateList.length > 0" class="info-section">
            <div class="section-header">
              <div class="section-title">
                <span class="title-icon" />
                <span class="title-text">同住人信息</span>
                <el-tag type="info" size="small" class="ml-2">{{ formInline.tenantMateList.length }}人</el-tag>
              </div>
            </div>
            <el-table :data="formInline.tenantMateList" border stripe class="mate-table">
              <el-table-column type="index" label="序号" width="70" align="center" />
              <el-table-column prop="name" label="姓名" align="center" min-width="120" />
              <el-table-column prop="gender" label="性别" align="center" width="80">
                <template #default="{ row }">
                  {{ row.gender === 0 ? "男" : "女" }}
                </template>
              </el-table-column>
              <el-table-column prop="phone" label="联系电话" align="center" min-width="140" />
              <el-table-column prop="idNo" label="证件号码" align="center" min-width="180" />
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <!-- 账单信息 Tab -->
      <el-tab-pane name="bill">
        <template #label>
          <el-space class="tab-label">
            <el-icon><Money /></el-icon>
            <span>账单信息</span>
          </el-space>
        </template>
        <div class="tab-content">
          <el-empty description="暂无账单信息" :image-size="180">
            <el-button type="primary" size="default">生成账单</el-button>
          </el-empty>
        </div>
      </el-tab-pane>

      <!-- 合同信息 Tab -->
      <el-tab-pane name="contract">
        <template #label>
          <el-space class="tab-label">
            <el-icon><Document /></el-icon>
            <span>合同信息</span>
            <el-tag :type="formInline.tenantContract?.signStatus === 0 ? 'danger' : 'success'" size="default">
              {{ TENANT_SIGN_STATUS_OPTIONS.find(item => item.value === formInline?.tenantContract?.signStatus)?.label || "未知" }}
            </el-tag>
          </el-space>
        </template>
        <div class="tab-content">
          <div class="info-section">
            <el-descriptions :column="2" border class="info-descriptions" size="default">
              <el-descriptions-item label="合同模板ID" label-align="right">
                <span class="text-value">{{ formInline.contractTemplateId || "未设置" }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="合同状态" label-align="right">
                <el-tag type="warning">待生成</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="action-bar">
            <el-button type="primary" :icon="Document">生成合同</el-button>
            <el-button type="success" :icon="View">预览合同</el-button>
          </div>
        </div>
      </el-tab-pane>

      <!-- 其他费用 Tab -->
      <el-tab-pane name="fees">
        <template #label>
          <el-space class="tab-label">
            <el-icon><Coin /></el-icon>
            <span>其他费用</span>
          </el-space>
        </template>
        <div class="tab-content">
          <el-table v-if="formInline.otherFees && formInline.otherFees.length > 0" :data="formInline.otherFees" border stripe class="fees-table">
            <el-table-column type="index" label="序号" width="70" align="center" />
            <el-table-column prop="feeName" label="费用名称" align="center" min-width="150" />
            <el-table-column prop="feeAmount" label="费用金额" align="center" min-width="120">
              <template #default="{ row }">
                <span class="fee-amount">¥{{ row.feeAmount }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="feeType" label="计费方式" align="center" min-width="120" />
            <el-table-column prop="remark" label="备注" align="center" min-width="200" show-overflow-tooltip />
          </el-table>
          <el-empty v-else description="暂无其他费用" :image-size="150" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
  import { ref } from "vue";
  import type { TenantDetailProps } from "@/types";
  import { ID_TYPE_OPTIONS, TENANT_CONTRACT_NATURE_OPTIONS, TENANT_SIGN_STATUS_OPTIONS, TENANT_STATUS_OPTIONS } from "@/constants";
  import { Coin, Document, House, Money, User, View } from "@element-plus/icons-vue";

  interface FormProps {
    formInline: TenantDetailProps;
  }

  const tenantStatusOptions = [...TENANT_STATUS_OPTIONS];

  const props = defineProps<FormProps>();

  // 当前激活的标签页
  const activeTab = ref("tenant");

  // 计算总面积
  const getTotalArea = () => {
    if (!props.formInline.roomList) return 0;
    return props.formInline.roomList.reduce((sum, room) => sum + (room.area || 0), 0);
  };

  // 获取证件类型名称
  const getIdTypeName = (idType: number) => {
    const option = ID_TYPE_OPTIONS.find(item => item.value === idType);
    return option?.label || "未知";
  };

  // 获取签约状态名称
  const getStatusName = (status: number) => {
    const option = TENANT_SIGN_STATUS_OPTIONS.find(item => item.value === status);
    return option?.label || "未知";
  };

  // 获取签约状态类型
  const getStatusType = (status: number) => {
    const typeMap: Record<number, string> = {
      0: "info",
      1: "warning",
      2: "success",
      3: "danger"
    };
    return typeMap[status] || "info";
  };

  // 获取收租设置文本
  const getRentDueTypeText = (type: number, day: number) => {
    if (type === 1) {
      return `提前${day}天收租`;
    } else if (type === 2) {
      return `每月${day}号收租`;
    }
    return "未设置";
  };

  // 获取签约类型名称
  const getContractNatureName = (nature: number) => {
    const option = TENANT_CONTRACT_NATURE_OPTIONS.find(item => item.value === nature);
    return option?.label || "未知";
  };
</script>

<style scoped lang="scss">
  .tenant-detail-view {
    margin-bottom: 20px;
    margin-left: 10px;
    margin-right: 10px;

    .room-rent-section {
      padding: 5px 10px;
    }

    // 房源信息展示
    .room-info-section {
      margin-bottom: 20px;
      background: #fff;
      border-radius: 4px;
      overflow: hidden;

      .room-header {
        min-width: 100px;
        display: flex;
        align-items: center;

        .header-icon {
          font-size: 16px;
          color: #000000;
          margin-right: 10px;
        }

        .header-title {
          font-size: 14px;
          color: #000000;
          letter-spacing: 0.5px;
        }
      }

      .room-content {
        .room-tag {
          padding: 10px 16px;
          font-size: 14px;
          border: 1px solid #d9ecff;
          background: #ecf5ff;

          .tag-icon {
            margin-right: 6px;
            font-size: 16px;
          }

          .room-info {
            font-weight: 500;
            color: #409eff;
          }

          .room-area {
            color: #909399;
            font-size: 13px;
            margin-left: 4px;
          }

          .el-divider {
            margin: 0 8px;
          }
        }
      }

      .room-stats {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;

        .stat-item {
          display: flex;
          align-items: baseline;
          gap: 4px;

          .stat-label {
            color: #606266;
            font-size: 14px;
          }

          .stat-value {
            color: #303133;
            font-size: 18px;
            font-weight: 600;

            &.primary {
              color: #f56c6c;
            }
          }

          .stat-unit {
            color: #909399;
            font-size: 13px;
          }
        }

        .el-divider {
          height: 20px;
          margin: 0 12px;
        }
      }
    }

    :deep(.room-descriptions) {
      .el-descriptions__label {
        margin-bottom: 12px;
      }
    }

    // 标签页卡片
    .tabs-card {
      :deep(.el-card__body) {
        padding: 0;
      }
    }

    // 现代化标签页样式（参考截图）
    :deep(.modern-tabs) {
    }

    // Tab 内容区域
    .tab-content {
      min-height: 500px;
    }

    // 信息区块
    .info-section {
      margin-bottom: 28px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-header {
        margin-bottom: 16px;

        .section-title {
          display: flex;
          align-items: center;
          font-size: 15px;
          font-weight: 600;
          color: #303133;

          .title-text {
            letter-spacing: 0.5px;
          }
        }
      }

      // 表格样式
      .mate-table,
      .fees-table {
        :deep(.el-table__header) {
          th {
            background: #fafafa;
            font-weight: 600;
            color: #303133;
          }
        }

        .fee-amount {
          color: #f56c6c;
          font-weight: 600;
          font-size: 15px;
        }
      }
    }

    // 操作按钮区域
    .action-bar {
      margin-top: 24px;
      text-align: center;
      padding: 20px;
      background: #fafafa;
      border-radius: 4px;

      .el-button {
        min-width: 120px;
      }
    }

    // 空状态优化
    :deep(.el-empty) {
      padding: 60px 0;

      .el-empty__image {
        width: 180px;
      }

      .el-empty__description {
        margin-top: 16px;
        font-size: 14px;
        color: #909399;
      }
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    .tenant-detail-view {
      padding: 12px;

      .room-info-card {
        margin-bottom: 12px;
      }

      .tab-content {
        padding: 16px;
      }

      :deep(.modern-tabs) {
        .el-tabs__item {
          padding: 0 16px;
          font-size: 13px;
        }
      }

      :deep(.info-descriptions) {
        .el-descriptions__label {
          width: 100px;
        }
      }
    }
  }
</style>
