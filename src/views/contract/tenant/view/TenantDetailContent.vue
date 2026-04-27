<template>
  <div class="tenant-detail-view">
    <div class="overview-bar">
      <div class="overview-bar__section overview-bar__section--rooms">
        <div class="overview-bar__label">
          <el-icon><House /></el-icon>
          <span>房源地址</span>
        </div>
        <div class="room-chip-list">
          <el-tag v-for="room in localFormInline.roomList" :key="room.roomId?.toString()" type="primary" effect="light" class="room-chip">
            <span class="room-chip__name">{{ room.communityName }} {{ room.doorNumber }}-{{ room.roomNumber }}</span>
            <el-divider direction="vertical" />
            <span class="room-chip__rent">{{ room.price ? `${room.price}元/月` : "未设置租金" }}</span>
          </el-tag>
          <el-tag type="info" effect="plain" class="room-chip room-chip--meta">房间数量：共{{ localFormInline.roomList?.length || 0 }}间</el-tag>
          <el-tag type="info" effect="plain" class="room-chip room-chip--meta">总建筑面积：{{ getTotalArea() }}m²</el-tag>
        </div>
      </div>

      <div class="overview-bar__section overview-bar__section--summary">
        <div class="overview-bar__label">
          <el-icon><User /></el-icon>
          <span>租约摘要</span>
        </div>
        <div class="summary-strip">
          <div class="summary-strip__item">
            <span class="summary-strip__label">租客</span>
            <span class="summary-strip__value">{{ localFormInline.tenantName }}</span>
          </div>
          <div class="summary-strip__item">
            <span class="summary-strip__label">月租金总额</span>
            <span class="summary-strip__value summary-strip__value--danger">¥{{ localFormInline.rentPrice }}</span>
            <span class="summary-strip__unit">元/月</span>
          </div>
          <div class="summary-strip__item">
            <span class="summary-strip__label">收款方式</span>
            <span class="summary-strip__value">押 {{ localFormInline.depositMonths }} 付 {{ localFormInline.paymentMonths }}</span>
          </div>
          <div class="summary-strip__item">
            <span class="summary-strip__label">租期</span>
            <span class="summary-strip__value">{{ localFormInline.leaseStart }} 至 {{ localFormInline.leaseEnd }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="tabs-wrapper">
      <el-tabs v-model="activeTab" class="modern-tabs">
        <el-tab-pane name="tenant">
          <template #label>
            <el-space>
              <el-icon><User /></el-icon>
              <span>租客信息</span>
            </el-space>
          </template>
          <div class="tab-content">
            <section class="info-section">
              <el-descriptions title="基本信息" :column="5" class="info-descriptions" size="default">
                <template #title>
                  <el-space>
                    <span>基本信息</span>
                    <el-tag :type="localFormInline.tenantType === 0 ? 'success' : 'warning'" size="default">
                      {{ localFormInline.tenantType === 0 ? "个人" : "企业" }}
                    </el-tag>
                  </el-space>
                </template>
                <el-descriptions-item label="姓名" label-align="right">
                  <span class="text-value">{{ localFormInline.tenantName }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="性别" label-align="right">
                  {{ localFormInline.tenantPersonal?.gender === 1 ? "男" : "女" }}
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
                    style="width: 100px; height: 100px; border-radius: 10px"
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
            </section>

            <section class="info-section">
              <el-descriptions title="租约信息" :column="5" class="info-descriptions" size="default">
                <el-descriptions-item label="合同周期" label-align="right">
                  <el-space :size="8">
                    <el-tag type="primary">{{ localFormInline.leaseStart }}</el-tag>
                    <span>至</span>
                    <el-tag type="primary">{{ localFormInline.leaseEnd }}</el-tag>
                  </el-space>
                </el-descriptions-item>
                <el-descriptions-item label="入住时间" label-align="right">
                  <el-space :size="8">{{ localFormInline.checkInAt }} 至 {{ localFormInline.checkOutAt }}</el-space>
                </el-descriptions-item>
                <el-descriptions-item label="月租金" label-align="right">
                  <span class="text-value text-value--danger">¥ {{ localFormInline.rentPrice }}</span>
                  <span class="text-subtle">元/月</span>
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
                <el-descriptions-item label="签约时间" label-align="right" :span="2">
                  <span class="text-value">{{ localFormInline.createAt }}</span>
                </el-descriptions-item>
              </el-descriptions>
            </section>

            <section class="info-section">
              <div class="section-title">房间租金与费用明细</div>
              <div class="room-fee-list">
                <div v-for="room in roomFeeGroups" :key="room.roomId" class="room-fee-card">
                  <div class="room-fee-card__head">
                    <div class="room-fee-card__title">{{ room.roomName }}</div>
                    <div class="room-fee-card__summary">
                      <span>
                        月租金
                        <strong>¥{{ room.rentPriceText }}</strong>
                      </span>
                      <span>
                        其他费用
                        <strong>¥{{ room.feeTotalText }}</strong>
                      </span>
                    </div>
                  </div>
                  <el-table v-if="room.fees.length > 0" :data="room.fees" border stripe class="fees-table">
                    <el-table-column type="index" label="序号" width="70" align="center" />
                    <el-table-column prop="name" label="费用名称" align="center" min-width="160" />
                    <el-table-column label="付款方式" align="center" min-width="120">
                      <template #default="{ row }">
                        {{ getOptionByCode([...PAYMENT_METHOD_OPTIONS], row.paymentMethod)?.label || "—" }}
                      </template>
                    </el-table-column>
                    <el-table-column label="计费方式" align="center" min-width="120">
                      <template #default="{ row }">
                        {{ getOptionByCode([...PRICE_METHOD_OPTIONS], row.priceMethod)?.label || "—" }}
                      </template>
                    </el-table-column>
                    <el-table-column label="费用配置" align="center" min-width="220">
                      <template #default="{ row }">
                        {{ formatFeeConfig(row) }}
                      </template>
                    </el-table-column>
                    <el-table-column label="折算金额" align="center" min-width="120">
                      <template #default="{ row }">
                        <span class="fee-amount">¥{{ calculateFeeAmount(row, room.rentPrice).toFixed(2) }}</span>
                      </template>
                    </el-table-column>
                  </el-table>
                  <el-empty v-else description="该房间暂无其他费用" :image-size="96" />
                </div>
              </div>
              <div class="room-fee-total">
                <div class="room-fee-total__item">
                  <span>月租金总计</span>
                  <strong>¥{{ totalRentPriceText }}</strong>
                </div>
                <div class="room-fee-total__item">
                  <span>其他费用总计</span>
                  <strong>¥{{ totalOtherFeeText }}</strong>
                </div>
              </div>
            </section>

            <section class="info-section">
              <el-descriptions title="负责人信息" :column="4" class="info-descriptions" size="default">
                <el-descriptions-item label="签约部门" label-align="right">
                  <span class="text-value">{{ deptNameText }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="签约人" label-align="right">
                  <span class="text-value">{{ salesmanNameText }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="租客来源" label-align="right">
                  <span class="text-value">{{ tenantSourceText }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="成交渠道" label-align="right">
                  <span class="text-value">{{ dealChannelText }}</span>
                </el-descriptions-item>
              </el-descriptions>
            </section>

            <section class="info-section">
              <div class="section-title">
                同住人信息
                <el-tag type="info" size="small">{{ localFormInline.tenantMateList.length }}人</el-tag>
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
                          style="width: 100px; height: 100px; border-radius: 10px"
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
            </section>
          </div>
        </el-tab-pane>

        <el-tab-pane name="bill">
          <template #label>
            <el-space class="tab-label">
              <el-icon><Money /></el-icon>
              <span>账单信息</span>
            </el-space>
          </template>
          <div class="tab-content">
            <LeaseBillTab :lease-id="localFormInline.leaseId" :tenant-name="localFormInline.tenantName" :tenant-phone="localFormInline.tenantPhone" />
          </div>
        </el-tab-pane>

        <el-tab-pane name="contract">
          <template #label>
            <el-space class="tab-label">
              <el-icon><Document /></el-icon>
              <span>合同信息</span>
              <el-tag :type="localFormInline.leaseContract?.signStatus === 0 ? 'danger' : 'success'" size="default">
                {{ LEASE_SIGN_STATUS_OPTIONS.find(item => item.value === localFormInline?.leaseContract?.signStatus)?.label || "未知" }}
              </el-tag>
            </el-space>
          </template>
          <LeaseContractTab
            :lease-contract="localFormInline.leaseContract"
            :lease-id="localFormInline.leaseId"
            :tenant-status="localFormInline.status"
            :create-time="localFormInline.createAt"
            :readonly="readonly"
            @contract-signed="leaseId => emit('contract-signed', leaseId)"
            @contract-updated="contract => (localFormInline.leaseContract = contract)"
          />
        </el-tab-pane>

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

        <el-tab-pane name="checkout" :disabled="checkoutTabDisabled">
          <template #label>
            <el-space class="tab-label">
              <el-icon><Money /></el-icon>
              <span>退租单 {{checkoutTabDisabled? "（暂无）": ""}}</span>
            </el-space>
          </template>
          <ViewCheckoutTab :loading="checkoutLoading" :checkout-detail="checkoutDetail" @updated="handleCheckoutUpdated" />
        </el-tab-pane>

        <el-tab-pane name="operateLog">
          <template #label>
            <el-space class="tab-label">
              <el-icon><Clock /></el-icon>
              <span>操作记录</span>
            </el-space>
          </template>
          <div class="tab-content">
            <div v-loading="operateLogLoading" class="operate-log-panel">
              <el-timeline v-if="operateLogList.length" class="operate-log-timeline">
                <el-timeline-item v-for="item in operateLogList" :key="item.id" :timestamp="item.createAt || '—'" placement="top">
                  <div class="operate-log-card">
                    <div class="operate-log-card__main">
                      <div class="operate-log-card__title">
                        <span>{{ item.operateDesc || "业务操作" }}</span>
                        <el-tag size="small" effect="light">{{ operateTypeText(item.operateType) }}</el-tag>
                      </div>
                      <div v-if="item.remark" class="operate-log-card__remark">{{ item.remark }}</div>
                    </div>
                    <div class="operate-log-card__operator">
                      <span>操作人</span>
                      <strong>{{ item.operatorName || "—" }}</strong>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
              <el-empty v-else description="暂无操作记录" :image-size="100" />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, h, ref, watch } from "vue";
  import { BizOperateLogVo, LeaseCheckoutVo, LeaseDetailVo, TenantsCreateFormProps } from "@/types";
  import {
    getOptionByCode,
    ID_TYPE_OPTIONS,
    LEASE_CONTRACT_NATURE_OPTIONS,
    PAYMENT_METHOD_OPTIONS,
    PRICE_METHOD_OPTIONS,
    LEASE_SIGN_STATUS_OPTIONS,
    LEASE_STATUS_MAP
  } from "@/constants";
  import { Clock, Document, Files, House, Money, User } from "@element-plus/icons-vue";
  import { message } from "@/utils/message";
  import { downloadLeaseContract, generateLeaseContract, updateLeaseContractSignStatus } from "@/api/contract/tenant";
  import { getLeaseOperateLogList, updateTenantInfo } from "@/api/contract/tenant";
  import { getCheckoutByLeaseId } from "@/api/contract/checkout";
  import { addDialog } from "@/components/ReDialog";
  import { deviceDetection } from "@/store/utils";
  import SelectContractTemplateDialog from "@/views/contract/tenant/view/SelectContractTemplateDialog.vue";
  import useTenant from "@/views/contract/tenant/utils/hook";
  import DeliveryTab from "@/views/contract/tenant/view/DeliveryTab.vue";
  import ViewCheckoutTab from "@/views/contract/checkout/view/ViewCheckoutTab.vue";
  import LeaseContractTab from "@/views/contract/tenant/view/LeaseContractTab.vue";
  import LeaseBillTab from "@/views/contract/tenant/view/LeaseBillTab.vue";
  import TenantInfoEditDialog from "@/views/contract/tenant/view/TenantInfoEditDialog.vue";
  import { convertImage2string } from "@/utils/image";

  const { openTenantDialog } = useTenant();

  interface FormProps {
    formInline: LeaseDetailVo;
    readonly?: boolean;
  }

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
    "lease-updated": [leaseId: string];
  }>();

  const activeTab = ref("tenant");
  const isTerminated = computed(() => localFormInline.value.status === LEASE_STATUS_MAP.TERMINATED.code);
  const checkoutDetail = ref<LeaseCheckoutVo | null>(null);
  const checkoutLoading = ref(false);
  const checkoutTabDisabled = computed(() => !checkoutLoading.value && !checkoutDetail.value);
  const operateLogList = ref<BizOperateLogVo[]>([]);
  const operateLogLoading = ref(false);

  const fetchCheckoutDetail = async () => {
    const leaseId = localFormInline.value.leaseId;
    if (!leaseId) {
      checkoutDetail.value = null;
      return;
    }
    checkoutLoading.value = true;
    try {
      const res = await getCheckoutByLeaseId(leaseId);
      checkoutDetail.value = res.code === 0 ? res.data || null : null;
    } catch {
      checkoutDetail.value = null;
    } finally {
      checkoutLoading.value = false;
    }
  };

  const fetchOperateLogs = async () => {
    const leaseId = localFormInline.value.leaseId;
    if (!leaseId) {
      operateLogList.value = [];
      return;
    }
    operateLogLoading.value = true;
    try {
      const res = await getLeaseOperateLogList(leaseId);
      operateLogList.value = res.code === 0 ? res.data || [] : [];
    } catch {
      operateLogList.value = [];
    } finally {
      operateLogLoading.value = false;
    }
  };

  const handleCheckoutUpdated = async () => {
    await fetchCheckoutDetail();
    if (activeTab.value === "operateLog") {
      await fetchOperateLogs();
    }
  };

  watch(
    () => activeTab.value,
    tab => {
      if (tab === "checkout") fetchCheckoutDetail();
      if (tab === "operateLog") fetchOperateLogs();
    }
  );

  watch(
    () => localFormInline.value.leaseId,
    () => {
      fetchCheckoutDetail();
      if (activeTab.value === "operateLog") {
        fetchOperateLogs();
      } else {
        operateLogList.value = [];
      }
    },
    { immediate: true }
  );

  const operateTypeText = (type?: string) => {
    const map: Record<string, string> = {
      CREATE: "新增",
      SAVE: "保存",
      UPDATE: "修改",
      CANCEL: "取消",
      PAY: "付款"
    };
    return type ? map[type] || type : "操作";
  };

  const getTotalArea = () => {
    if (!localFormInline.value.roomList) return 0;
    return localFormInline.value.roomList.reduce((sum, room) => sum + (room.area || 0), 0);
  };

  const calculateFeeAmount = (fee: any, roomRentPrice = 0) => {
    const input = Number(fee?.priceInput || 0);
    if (fee?.priceMethod === 2) {
      return (Number(roomRentPrice || 0) * input) / 100;
    }
    return input;
  };

  const formatFeeConfig = (fee: any) => {
    const input = Number(fee?.priceInput || 0);
    return fee?.priceMethod === 2 ? `${input}%` : `¥${input.toFixed(2)}`;
  };

  const roomFeeGroups = computed(() =>
    (localFormInline.value.roomList || []).map(room => {
      const roomId = String(room.roomId || "");
      const rentPrice = Number(room.price || 0);
      const fees = (localFormInline.value.otherFees || []).filter(fee => String(fee.roomId || "") === roomId);
      const feeTotal = fees.reduce((sum, fee) => sum + calculateFeeAmount(fee, rentPrice), 0);

      return {
        roomId,
        roomName: `${room.communityName || ""} ${room.doorNumber || ""}-${room.roomNumber || ""}`.trim(),
        rentPrice,
        rentPriceText: rentPrice.toFixed(2),
        fees,
        feeTotal,
        feeTotalText: feeTotal.toFixed(2)
      };
    })
  );

  const totalRentPriceText = computed(() => roomFeeGroups.value.reduce((sum, room) => sum + room.rentPrice, 0).toFixed(2));
  const totalOtherFeeText = computed(() => roomFeeGroups.value.reduce((sum, room) => sum + room.feeTotal, 0).toFixed(2));
  const deptNameText = computed(() => localFormInline.value.deptName || "—");
  const salesmanNameText = computed(
    () => localFormInline.value.salesmanName || (localFormInline.value as any).salesman?.realName || (localFormInline.value as any).salesman?.name || "—"
  );
  const tenantSourceText = computed(() => localFormInline.value.tenantSourceName || "—");
  const dealChannelText = computed(() => localFormInline.value.dealChannelName || "—");

  const getIdTypeName = (idType: number) => {
    const option = ID_TYPE_OPTIONS.find(item => item.value === idType);
    return option?.label || "未知";
  };

  const getRentDueTypeText = (type: number, day: number) => {
    if (type === 1) return `提前${day}天收租`;
    if (type === 2) return `每月${day}号收租`;
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
      title: "重新生成合同，请选择合同模板",
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
      beforeSure: done => {
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
            emit("contract-updated");
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
    if (props.readonly) return false;
    return !(status === LEASE_STATUS_MAP.TERMINATED.code || status === LEASE_STATUS_MAP.EFFECTIVE.code);
  };

  const editLease = (row: LeaseDetailVo) => {
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
      tenantPersonal: row.tenantPersonal
        ? {
            ...row.tenantPersonal,
            companyId: row.tenantPersonal.companyId ? String(row.tenantPersonal.companyId) : undefined
          }
        : undefined,
      tenantCompany: row.tenantCompany ? { ...row.tenantCompany } : undefined,
      tenantMateList: row.tenantMateList,
      otherFees: row.otherFees,
      isEdit: true
    };
    openTenantDialog("修改租客 " + row.tenantName, tenantCreateFormInline, leaseId => {
      emit("lease-updated", leaseId);
    });
  };

  const editTenantInfo = (row: LeaseDetailVo) => {
    if (!allowEdit(row.status)) {
      message("已退租或作废租客不能修改", { type: "warning" });
      return;
    }

    const formRef = ref();
    addDialog({
      title: `修改租客信息 - ${row.tenantName}`,
      props: {
        formInline: row
      },
      top: "5vh",
      width: "600px",
      lockScroll: true,
      alignCenter: true,
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(TenantInfoEditDialog, { ref: formRef, formInline: row }),
      beforeSure: async done => {
        const formInstance = formRef.value;
        const formRuleRef = formInstance?.getRef?.();
        const payload = formInstance?.getFormData?.();
        if (!formRuleRef || !payload) return;

        await formRuleRef.validate(async (valid: boolean) => {
          if (!valid) return;

          if (payload.tenantType === 0) {
            payload.tenantPersonal.idCardBackList = convertImage2string(payload.tenantPersonal.idCardBackList || []);
            payload.tenantPersonal.idCardFrontList = convertImage2string(payload.tenantPersonal.idCardFrontList || []);
            payload.tenantPersonal.idCardInHandList = convertImage2string(payload.tenantPersonal.idCardInHandList || []);
            payload.tenantPersonal.otherImageList = convertImage2string(payload.tenantPersonal.otherImageList || []);
          } else {
            payload.tenantCompany.businessLicenseUrls = convertImage2string(payload.tenantCompany.businessLicenseUrls || []);
            payload.tenantCompany.otherImageList = convertImage2string(payload.tenantCompany.otherImageList || []);
          }

          const resp = await updateTenantInfo(payload);
          if (resp.code === 0) {
            message("租客信息修改成功", { type: "success" });
            if (activeTab.value === "operateLog") {
              await fetchOperateLogs();
            }
            emit("lease-updated", row.leaseId);
            done();
          } else {
            message(resp.message || "租客信息修改失败", { type: "error" });
          }
        });
      }
    });
  };

  defineExpose({
    editLease,
    editTenantInfo
  });
</script>

<style scoped lang="scss">
  .tenant-detail-view {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .overview-bar,
    .tabs-wrapper {
      padding: 14px 16px;
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-light);
      border-radius: 10px;
    }

    .overview-bar {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .overview-bar__section {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      min-width: 0;

      & + .overview-bar__section {
        padding-top: 10px;
        border-top: 1px solid var(--el-border-color-lighter);
      }
    }

    .overview-bar__label {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      min-width: 76px;
      color: var(--el-text-color-primary);
      font-size: 14px;
      font-weight: 600;

      .el-icon {
        font-size: 16px;
        color: var(--el-text-color-primary);
      }
    }

    .room-chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      min-width: 0;
    }

    .room-chip {
      padding: 8px 12px;
      font-size: 13px;

      &__name {
        font-weight: 500;
      }

      &__rent {
        color: var(--el-text-color-secondary);
      }

      &--meta {
        background: var(--el-fill-color-light);
      }
    }

    .summary-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 10px 16px;
      min-width: 0;

      &__item {
        display: flex;
        align-items: baseline;
        gap: 4px;
      }

      &__label {
        font-size: 13px;
        color: var(--el-text-color-regular);
      }

      &__value {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);

        &--danger {
          color: #f56c6c;
        }
      }

      &__unit {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    :deep(.el-tabs__header) {
      margin-bottom: 14px;
    }

    .tab-content {
      min-height: 510px;
    }

    .info-section {
      margin-bottom: 12px;
      padding: 14px 16px;
      background: var(--el-fill-color-blank);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 10px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
        font-size: 15px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      :deep(.el-descriptions__header) {
        margin-bottom: 12px;
      }

      :deep(.el-descriptions__body) {
        background: transparent;
      }

      :deep(.el-descriptions__table) {
        --el-descriptions-table-border: transparent;
      }

      :deep(.el-descriptions__cell) {
        padding-bottom: 10px;
      }

      .text-value {
        color: var(--el-text-color-primary);
        font-weight: 500;

        &--danger {
          color: #f56c6c;
        }
      }

      .text-subtle {
        margin-left: 4px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }

      .photo-wall {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 4px;
      }

      .photo-item {
        padding: 6px;
        background: var(--el-fill-color-light);
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 10px;
      }

      .mate-table,
      .fees-table {
        margin-top: 10px;

        :deep(.el-table__header) th {
          background: var(--el-fill-color-light);
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        .fee-amount {
          font-size: 15px;
          font-weight: 600;
          color: #f56c6c;
        }
      }

      .room-fee-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 12px;
      }

      .room-fee-card {
        padding: 12px 14px;
        background: var(--el-bg-color);
        border: 1px solid var(--el-border-color-light);
        border-radius: 10px;

        &__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        &__title {
          font-size: 15px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        &__summary {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 13px;
          color: var(--el-text-color-secondary);

          strong {
            font-size: 16px;
            color: var(--el-text-color-primary);
          }
        }
      }

      .room-fee-total {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin-top: 12px;

        &__item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: var(--el-fill-color-light);
          border-radius: 10px;
          color: var(--el-text-color-regular);

          strong {
            font-size: 18px;
            font-weight: 600;
            color: #f56c6c;
          }
        }
      }

      .operate-log-panel {
        min-height: 220px;
        padding: 4px 2px;
      }

      .operate-log-timeline {
        padding: 8px 4px 0;

        :deep(.el-timeline-item__timestamp) {
          color: var(--el-text-color-secondary);
          font-size: 12px;
        }
      }

      .operate-log-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 12px 14px;
        background: var(--el-bg-color);
        border: 1px solid var(--el-border-color-light);
        border-radius: 10px;

        &__main {
          min-width: 0;
        }

        &__title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--el-text-color-primary);
          font-size: 14px;
          font-weight: 600;
        }

        &__remark {
          margin-top: 6px;
          color: var(--el-text-color-secondary);
          font-size: 13px;
          line-height: 1.5;
        }

        &__operator {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          color: var(--el-text-color-secondary);
          font-size: 13px;

          strong {
            color: var(--el-text-color-primary);
            font-weight: 600;
          }
        }
      }
    }

    :deep(.el-empty) {
      padding: 36px 0;

      .el-empty__description {
        margin-top: 10px;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  @media (max-width: 960px) {
    .tenant-detail-view {
      .overview-bar__section {
        flex-direction: column;
        gap: 12px;
      }

      .overview-bar__label {
        min-width: 0;
      }

      .room-fee-total {
        grid-template-columns: 1fr;
      }

      .room-fee-card__head {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  }
</style>
