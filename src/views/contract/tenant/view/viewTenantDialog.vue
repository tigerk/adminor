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
              <el-tag v-for="room in localFormInline.roomList" :key="room.roomId.toString()" type="primary" size="large" effect="light" class="room-tag">
                <span class="room-info">{{ room.communityName }} {{ room.doorNumber }}-{{ room.roomNumber }}</span>
                <el-divider direction="vertical" />
                <span class="room-area">{{ room.price ? room.price + "元/月" : "未设置" }}</span>
              </el-tag>
              <el-tag type="primary" size="large" effect="light" class="room-tag">
                <span class="stat-label">房间数量：共</span>
                <span class="stat-value">{{ localFormInline.roomList?.length || 0 }}</span>
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
                <span class="stat-value">{{ localFormInline.tenantName }}</span>
              </div>
              <el-divider direction="vertical" />
              <div class="stat-item">
                <span class="stat-label">月租金总额：</span>
                <span class="stat-value primary">¥{{ localFormInline.rentPrice }}</span>
                <span class="stat-unit">元/月</span>
              </div>
              <el-divider direction="vertical" />
              <div class="stat-item">
                <span class="stat-label">收款方式：</span>
                <span class="stat-value">押 {{ localFormInline.depositMonths }} 付 {{ localFormInline.paymentMonths }}</span>
              </div>
              <el-divider direction="vertical" />
              <div class="stat-item">
                <span class="stat-label">租期：</span>
                <span class="stat-value">
                  <el-space :size="8">
                    {{ localFormInline.leaseStart }}
                    <span>至</span>
                    {{ localFormInline.leaseEnd }}
                  </el-space>
                </span>
              </div>
            </div>
          </div>
        </el-space>
      </div>
    </div>

    <div class="tabs-wrapper">
      <!-- 标签页内容 -->
      <el-tabs v-model="activeTab" class="modern-tabs">
        <!-- 租客信息 Tab -->
        <el-tab-pane name="tenant">
          <template #label>
            <el-space>
              <el-icon><User /></el-icon>
              <span>租客信息</span>
            </el-space>
          </template>
          <div class="tab-content">
            <!-- 基本信息 -->
            <div class="info-section mt-4">
              <el-descriptions title="基本信息" :column="3" class="info-descriptions" size="default">
                <template #title>
                  <el-space>
                    <span>基本信息</span>
                    <el-tag :type="localFormInline.tenantType === 0 ? 'success' : 'warning'" size="default">
                      {{ localFormInline.tenantType === 0 ? "个人" : "企业" }}
                    </el-tag>
                  </el-space>
                </template>
                <template #extra>
                  <el-tooltip class="box-item" effect="dark" content="修改租客信息，包括姓名、联系电话、证件类型、证件号码等。" placement="top">
                    <el-button type="primary" size="small" :icon="Edit" :disabled="!allowEdit(localFormInline.status)" @click="editTenant(localFormInline)">修改租约</el-button>
                  </el-tooltip>
                </template>
                <el-descriptions-item label="姓名" label-align="right">
                  <el-space>
                    <span class="text-value">{{ localFormInline.tenantName }}</span>
                    <el-tag type="info" size="small">{{ localFormInline.tenantPersonal?.gender === 0 ? "男" : "女" }}</el-tag>
                  </el-space>
                </el-descriptions-item>
                <el-descriptions-item label="联系电话" label-align="right">
                  <span class="text-value">{{ localFormInline.tenantPhone }}</span>
                </el-descriptions-item>

                <template v-if="localFormInline.tenantType === 0">
                  <el-descriptions-item label="证件类型" label-align="right">
                    <span class="text-value">{{ getIdTypeName(localFormInline.tenantPersonal?.idType) }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="证件号码" label-align="right">
                    <span class="text-value">{{ localFormInline.tenantPersonal?.idNo }}</span>
                  </el-descriptions-item>
                </template>
                <template v-else>
                  <el-descriptions-item label="统一社会信用代码" label-align="right" :span="2">
                    <span class="text-value">{{ localFormInline.tenantCompany?.uscc }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="法定代表人" label-align="right">
                    <span class="text-value">{{ localFormInline.tenantCompany?.legalPerson }}</span>
                  </el-descriptions-item>
                </template>
                <el-descriptions-item label="签约时间" label-align="right" :span="2">
                  <span class="text-value">{{ localFormInline.createTime }}</span>
                </el-descriptions-item>
              </el-descriptions>
              <div class="photo-wall">
                <div
                  v-for="(url, index) in [
                    ...localFormInline.tenantPersonal?.idCardBackList,
                    ...localFormInline.tenantPersonal?.idCardFrontList,
                    ...localFormInline.tenantPersonal?.idCardInHandList,
                    ...localFormInline.tenantPersonal?.otherImageList
                  ]"
                  :key="index"
                  class="photo-item"
                >
                  <el-image
                    style="width: 100px; height: 100px; border-radius: 8px"
                    :src="url"
                    :zoom-rate="1.2"
                    :max-scale="7"
                    :min-scale="0.2"
                    :preview-src-list="[url]"
                    :initial-index="index"
                    fit="cover"
                    loading="lazy"
                    preview-teleported
                  />
                </div>
              </div>
            </div>

            <!-- 租约信息 -->
            <div class="info-section">
              <el-descriptions title="租约信息" :column="3" class="info-descriptions" size="default">
                <el-descriptions-item label="合同周期" label-align="right">
                  <el-space :size="8">
                    <el-tag type="primary">{{ localFormInline.leaseStart }}</el-tag>
                    <span>至</span>
                    <el-tag type="primary">{{ localFormInline.leaseEnd }}</el-tag>
                  </el-space>
                </el-descriptions-item>
                <el-descriptions-item label="月租金" label-align="right">
                  <span class="rent-price">¥ {{ localFormInline.rentPrice }}</span>
                  <span class="rent-unit">元/月</span>
                </el-descriptions-item>

                <el-descriptions-item label="押付方式" label-align="right">
                  <span class="text-value">押 {{ localFormInline.depositMonths }} 付 {{ localFormInline.paymentMonths }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="收租设置" label-align="right">
                  <span class="text-value">{{ getRentDueTypeText(localFormInline.rentDueType, localFormInline.rentDueDay) }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="签约类型" label-align="right">
                  <span class="text-value">{{ getContractNatureName(localFormInline.contractNature) }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="入住时间" label-align="right">
                  <el-space :size="8">
                    <el-tag type="info">{{ localFormInline.checkInTime }}</el-tag>
                    <span>至</span>
                    <el-tag type="info">{{ localFormInline.checkOutTime }}</el-tag>
                  </el-space>
                </el-descriptions-item>
              </el-descriptions>
              <div class="info-section">
                <div class="section-header mt-3">
                  <div class="section-title">
                    <span class="title-icon" />
                    <span class="title-text">其他费用</span>
                  </div>
                </div>
                <el-table v-if="localFormInline.otherFees && localFormInline.otherFees.length > 0" :data="localFormInline.otherFees" border stripe class="fees-table">
                  <el-table-column type="index" label="序号" width="70" align="center" />
                  <el-table-column prop="name" label="费用名称" align="center" min-width="150" />
                  <el-table-column prop="paymentMethod" label="付款方式" align="center" min-width="120">
                    <template #default="{ row }">
                      <span class="payment-method">{{ getOptionByCode([...PAYMENT_METHOD_OPTIONS], row.paymentMethod)?.label }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="priceMethod" label="计费方式" align="center" min-width="120">
                    <template #default="{ row }">
                      <span class="price-method">{{ getOptionByCode([...PRICE_METHOD_OPTIONS], row.priceMethod)?.label }}</span>
                    </template>
                  </el-table-column>

                  <el-table-column prop="priceInput" label="输入值" align="center" min-width="200" show-overflow-tooltip>
                    <template #default="{ row }">
                      <span class="price-method">{{ row.priceInput }}</span>
                    </template>
                  </el-table-column>
                </el-table>
                <el-empty v-else description="暂无其他费用" :image-size="150" />
              </div>
            </div>

            <!-- 负责人信息 -->
            <div class="info-section">
              <el-descriptions title="负责人信息" :column="3" class="info-descriptions" size="default">
                <el-descriptions-item label="签约部门" label-align="right">
                  <span class="text-value">{{ localFormInline.deptName }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="签约人" label-align="right">
                  <span class="text-value">{{ localFormInline.salesmanName }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="成交渠道" label-align="right">
                  <span class="text-value">{{ localFormInline.dealChannelName }}</span>
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <!-- 同住人信息 -->
            <div class="info-section">
              <div class="section-header">
                <div class="section-title">
                  <span class="title-icon" />
                  <span class="title-text">同住人信息</span>
                  <el-tag type="info" size="small" class="ml-2">{{ localFormInline.tenantMateList.length }}人</el-tag>
                </div>
              </div>
              <el-table :data="localFormInline.tenantMateList" border class="mate-table" stripe default-expand-all>
                <el-table-column type="expand">
                  <template #default="props">
                    <div class="photo-wall">
                      <div
                        v-for="(url, index) in [...props.row?.idCardBackList, ...props.row?.idCardFrontList, ...props.row?.idCardInHandList, ...props.row?.otherImageList]"
                        :key="index"
                        class="photo-item"
                      >
                        <el-image
                          style="width: 100px; height: 100px; border-radius: 8px"
                          :src="url"
                          :zoom-rate="1.2"
                          :max-scale="7"
                          :min-scale="0.2"
                          :preview-src-list="[url]"
                          :initial-index="index"
                          fit="cover"
                          loading="lazy"
                          preview-teleported
                        />
                      </div>
                      <el-text
                        v-if="[...props.row?.idCardBackList, ...props.row?.idCardFrontList, ...props.row?.idCardInHandList, ...props.row?.otherImageList].length === 0"
                        class="mx-1"
                      >
                        没有证件照片
                      </el-text>
                    </div>
                  </template>
                </el-table-column>
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
            <LeaseBillTab :lease-id="localFormInline.leaseId" />
          </div>
        </el-tab-pane>

        <!-- 合同信息 Tab -->
        <el-tab-pane name="contract">
          <template #label>
            <el-space class="tab-label">
              <el-icon><Document /></el-icon>
              <span>合同信息</span>
              <el-tag :type="localFormInline.leaseContract?.signStatus === 0 ? 'danger' : 'success'" size="default">
                {{ TENANT_SIGN_STATUS_OPTIONS.find(item => item.value === localFormInline?.leaseContract?.signStatus)?.label || "未知" }}
              </el-tag>
            </el-space>
          </template>
          <LeaseContractTab
            :lease-contract="localFormInline.leaseContract"
            :lease-id="localFormInline.leaseId"
            :tenant-status="localFormInline.status"
            :create-time="localFormInline.createTime"
            :readonly="readonly"
            @contract-signed="leaseId => emit('contract-signed', leaseId)"
            @contract-updated="contract => (localFormInline.leaseContract = contract)"
          />
        </el-tab-pane>

        <!-- 物业交割单 Tab - 使用独立组件 -->
        <el-tab-pane name="delivery">
          <template #label>
            <el-space>
              <el-icon><Files /></el-icon>
              <span>物业交割单</span>
              <el-tag type="info" size="default">{{ localFormInline.roomList?.length || 0 }}间</el-tag>
            </el-space>
          </template>
          <div class="tab-content">
            <DeliveryTab :room-list="localFormInline.roomList" :subject-type-id="localFormInline.leaseId" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { h, ref, watch } from "vue";
  import { TenantDetailProps, TenantsCreateFormProps } from "@/types";
  import {
    getOptionByCode,
    ID_TYPE_OPTIONS,
    PAYMENT_METHOD_OPTIONS,
    PRICE_METHOD_OPTIONS,
    LEASE_CONTRACT_NATURE_OPTIONS,
    TENANT_SIGN_STATUS_OPTIONS,
    TENANT_STATUS_ENUM
  } from "@/constants";
  import { Document, Edit, Files, House, Money, User } from "@element-plus/icons-vue";
  import { message } from "@/utils/message";
  import { downloadLeaseContract, generateLeaseContract, updateLeaseContractSignStatus } from "@/api/contract/tenant";
  import { addDialog } from "@/components/ReDialog";
  import { deviceDetection } from "@/store/utils";
  import SelectContractTemplateDialog from "@/views/contract/tenant/view/selectContractTemplateDialog.vue";
  import useTenant from "@/views/contract/tenant/utils/hook";
  import DeliveryTab from "@/views/contract/tenant/view/DeliveryTab.vue";
  import LeaseContractTab from "@/views/contract/tenant/view/LeaseContractTab.vue";
  import LeaseBillTab from "@/views/contract/tenant/view/LeaseBillTab.vue";

  const { openTenantDialog } = useTenant();

  interface FormProps {
    formInline: TenantDetailProps;
    readonly?: boolean; // 新增：是否只读模式
  }

  const expandedBillRows = ref<string[]>([]);
  const props = withDefaults(defineProps<FormProps>(), {
    readonly: false
  });
  const localFormInline = ref({ ...props.formInline });

  watch(
    () => props.formInline,
    newVal => {
      localFormInline.value = { ...newVal };
    },
    { deep: true }
  );

  const emit = defineEmits<{
    "contract-signed": [leaseId: string];
    "contract-updated": [];
  }>();

  const activeTab = ref("tenant");

  const getTotalArea = () => {
    if (!props.formInline.roomList) return 0;
    return props.formInline.roomList.reduce((sum, room) => sum + (room.area || 0), 0);
  };

  const getIdTypeName = (idType: number) => {
    const option = ID_TYPE_OPTIONS.find(item => item.value === idType);
    return option?.label || "未知";
  };

  const getRentDueTypeText = (type: number, day: number) => {
    if (type === 1) return `提前${day}天收租`;
    else if (type === 2) return `每月${day}号收租`;
    return "未设置";
  };

  const getContractNatureName = (nature: number) => {
    const option = LEASE_CONTRACT_NATURE_OPTIONS.find(item => item.value === nature);
    return option?.label || "未知";
  };

  const handleDownloadContract = () => {
    if (!props.formInline.leaseContract?.contractContent) {
      message("合同内容为空，无法下载", { type: "warning" });
      return;
    }
    downloadLeaseContract({
      leaseId: props.formInline.leaseContract.leaseId
    }).then(res => {
      const blob = new Blob([res], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `租客合同_${props.formInline.leaseContract.leaseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  };

  const handleGenerateContract = () => {
    const formRef = ref();

    addDialog({
      title: `重新生成合同，请选择合同模板`,
      props: {
        formInline: {
          leaseId: props.formInline.leaseContract.leaseId
        }
      },
      top: "8%",
      width: "400px",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(SelectContractTemplateDialog, { ref: formRef, leaseId: props.formInline.leaseContract.leaseId }),
      beforeSure: (done, { options }) => {
        const selectedTemplate = formRef.value.getSelectedTemplate();
        if (!selectedTemplate) {
          message("请选择合同模板", { type: "warning" });
          return;
        }
        generateLeaseContract({
          leaseContractId: localFormInline.value.leaseContract.id,
          leaseId: localFormInline.value.leaseContract.leaseId,
          contractTemplateId: selectedTemplate
        }).then(resp => {
          if (resp.code == 0) {
            localFormInline.value.leaseContract = resp.data;
            message("合同生成成功", { type: "success" });
            done();
          }
        });
      }
    });
  };

  const handleSignContract = () => {
    if (localFormInline.value.leaseContract?.signStatus === 1) {
      message("合同已签约，无需重复操作", { type: "warning" });
      return;
    }
    updateLeaseContractSignStatus({
      leaseContractId: localFormInline.value.leaseContract.id,
      signStatus: 1
    }).then(resp => {
      if (resp.code == 0) {
        message("合同签约成功", { type: "success" });
        localFormInline.value.leaseContract.signStatus = 1;
        emit("contract-signed", localFormInline.value.leaseId);
      } else {
        message(resp.message || "合同签约修改失败", { type: "warning" });
      }
    });
  };

  const allowEdit = (status: number) => {
    // 如果是只读模式，直接返回 false
    if (props.readonly) {
      return false;
    }
    return !(status === TENANT_STATUS_ENUM.TERMINATED.code || status === TENANT_STATUS_ENUM.EFFECTIVE.code);
  };

  const allowChangeSignStatus = (status: number) => {
    // 如果是只读模式，直接返回 false
    if (props.readonly) {
      return false;
    }
    return status === TENANT_STATUS_ENUM.TO_SIGN.code;
  };

  const editTenant = (row: TenantDetailProps) => {
    if (!allowEdit(row.status)) {
      message("已退租或作废租客不能修改", { type: "warning" });
      return;
    }
    const tenantCreateFormInline: TenantsCreateFormProps = {
      lease: {
        ...row,
        id: row.leaseId,
        tenantId: row.tenantId,
        contractTemplateId: row.leaseContract?.contractTemplateId
      },
      tenantPersonal: { ...row.tenantPersonal },
      tenantCompany: { ...row.tenantCompany },
      tenantMateList: row.tenantMateList,
      otherFees: row.otherFees,
      isEdit: true
    };
    openTenantDialog("修改租客 " + row.tenantName, tenantCreateFormInline);
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
      background: var(--el-bg-color); // 支持主题切换
      border-radius: 4px;
      overflow: hidden;

      .room-header {
        min-width: 100px;
        display: flex;
        align-items: center;

        .header-icon {
          font-size: 16px;
          color: var(--el-text-color-primary); // 支持主题切换
          margin-right: 10px;
        }

        .header-title {
          font-size: 14px;
          color: var(--el-text-color-primary); // 支持主题切换
          letter-spacing: 0.5px;
        }
      }

      .room-content {
        .room-tag {
          padding: 10px 16px;
          font-size: 14px;
          border: 1px solid var(--el-color-primary-light-7); // 支持主题切换
          background: var(--el-color-primary-light-9); // 支持主题切换

          .tag-icon {
            margin-right: 6px;
            font-size: 16px;
          }

          .room-info {
            font-weight: 500;
            color: var(--el-color-primary); // 支持主题切换
          }

          .room-area {
            color: var(--el-text-color-secondary); // 支持主题切换
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
            color: var(--el-text-color-regular); // 支持主题切换
            font-size: 14px;
          }

          .stat-value {
            color: var(--el-text-color-primary); // 支持主题切换
            font-size: 18px;
            font-weight: 600;

            &.primary {
              color: #f56c6c; // 保持原来的红色
            }
          }

          .stat-unit {
            color: var(--el-text-color-secondary); // 支持主题切换
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
          color: var(--el-text-color-primary); // 支持主题切换

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
            background: var(--el-fill-color-light); // 支持主题切换
            font-weight: 600;
            color: var(--el-text-color-primary); // 支持主题切换
          }
        }

        .fee-amount {
          color: #f56c6c; // 保持原来的红色
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
      background: var(--el-fill-color-light); // 支持主题切换
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
        color: var(--el-text-color-secondary); // 支持主题切换
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

  // 合同部分样式
  .contract-section {
    .contract-action-bar {
      margin-bottom: 20px;
      padding: 8px 5px;
      background: var(--el-fill-color-light); // 支持主题切换
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .action-left {
        flex: 0 0 auto;
      }

      .action-right {
        flex: 0 0 auto;
        text-align: right;

        .info-item {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          font-size: 14px;

          .info-label {
            color: var(--el-text-color-secondary); // 支持主题切换
            margin-right: 8px;
            font-weight: 500;
          }

          .info-value {
            color: var(--el-text-color-regular); // 支持主题切换
            font-weight: 600;
          }
        }
      }
    }

    .contract-content-section {
      .contract-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 2px solid var(--el-border-color); // 支持主题切换

        .contract-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary); // 支持主题切换
        }
      }

      .contract-preview-wrapper {
        background: var(--el-bg-color); // 支持主题切换
        border: 1px solid var(--el-border-color); // 支持主题切换
        border-radius: 4px;
        overflow: hidden;

        .contract-preview {
          overflow-y: auto;
          padding: 30px;
          line-height: 1.8;

          /* 自定义滚动条 */
          &::-webkit-scrollbar {
            width: 8px;
          }

          &::-webkit-scrollbar-track {
            background: var(--el-fill-color-light); // 支持主题切换
            border-radius: 4px;
          }

          &::-webkit-scrollbar-thumb {
            background: var(--el-text-color-disabled); // 支持主题切换
            border-radius: 4px;

            &:hover {
              background: var(--el-text-color-secondary); // 支持主题切换
            }
          }

          :deep(h1),
          :deep(h2),
          :deep(h3),
          :deep(h4),
          :deep(h5),
          :deep(h6) {
            margin-top: 20px;
            margin-bottom: 12px;
            color: var(--el-text-color-primary); // 支持主题切换
            font-weight: 600;
          }

          :deep(h3) {
            font-size: 18px;
            text-align: center;
          }

          :deep(p) {
            margin-bottom: 12px;
            text-indent: 2em;
            color: var(--el-text-color-regular); // 支持主题切换
          }

          :deep(table) {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;

            th,
            td {
              border: 1px solid var(--el-border-color); // 支持主题切换
              padding: 8px 12px;
              text-align: left;
            }

            th {
              background: var(--el-fill-color-light); // 支持主题切换
              font-weight: 600;
              color: var(--el-text-color-primary); // 支持主题切换
            }
          }

          :deep(strong) {
            color: var(--el-text-color-primary); // 支持主题切换
            font-weight: 600;
          }

          :deep(code) {
            background: var(--el-fill-color-light); // 支持主题切换
            padding: 2px 6px;
            border-radius: 3px;
            font-family: "Courier New", monospace;
          }
        }
      }
    }

    .no-content {
      padding: 40px 0;
    }
  }

  .text-value {
    color: var(--el-text-color-regular); // 支持主题切换
  }

  .modern-tabs .el-tabs__extra {
    display: flex;
    align-items: center;
  }

  .tabs-wrapper {
    position: relative;

    .tabs-action-container {
      position: absolute;
      top: 8px;
      right: 0;
      z-index: 10;
      display: flex;
      gap: 8px;
      align-items: center;
    }
  }

  :deep(.el-tabs__nav-wrap) {
    padding-right: 180px;
  }

  .modern-tabs {
    margin-top: 10px;
  }

  .photo-wall {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    padding: 10px 20px;
  }

  .photo-item {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
    cursor: pointer;
    border-radius: 8px;
    overflow: hidden;
  }

  .photo-item:hover {
    transform: translateY(-5px);
  }

  // 深色模式下特殊处理阴影
  html.dark {
    .photo-item {
      box-shadow: 0 4px 12px rgba(255, 255, 255, 0.05);
    }
  }

  .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
  }

  // 区块标题样式 - 支持主题切换
  .section-header-wrapper {
    margin-bottom: 0; // 去掉底部间距，让表格紧贴

    .section-header-content {
      background: var(--el-fill-color-light); // 使用 Element Plus 的背景色变量
      border-radius: 8px 8px 0 0; // 上圆角，下方与表格连接
      border-bottom: 2px solid var(--el-color-primary); // 使用主题色
      transition: all 0.3s ease;

      .section-title {
        color: var(--el-text-color-primary); // 使用文本主色
      }

      .count-badge {
        background: var(--el-bg-color); // 使用背景色
        border: 1px solid var(--el-border-color); // 使用边框色
        border-radius: 6px;
        transition: all 0.3s ease;

        .el-icon {
          color: var(--el-text-color-secondary); // 图标颜色
        }

        span {
          color: var(--el-text-color-regular); // 文字颜色
        }

        &:hover {
          background: var(--el-fill-color-light);
          border-color: var(--el-color-primary-light-7);
        }
      }
    }
  }

  // 深色模式下的特殊优化（可选）
  html.dark {
    .section-header-wrapper {
      .section-header-content {
        // 深色模式下可以添加微妙的阴影
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }
    }
  }
</style>
