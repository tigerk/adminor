<template>
  <el-form ref="ruleFormRef" :model="formInline" :rules="rules" label-width="100px" label-position="top">
    <div class="section-tenant-info">
      <div class="mb-4 house-selector-info">
        <div class="mb-2"><h3>房源信息</h3></div>
        <el-select
          v-model="selectedRooms"
          size="large"
          filterable
          multiple
          remote
          :remote-method="handleSearchRoom"
          :loading="searchLoading"
          placeholder="请选择房源"
          class="w-full"
        >
          <el-option v-for="item in roomOptions" :key="item.value" :label="item.label" :value="item">
            <span style="float: left">{{ item.label }}</span>
            <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
              {{ item.description }}
            </span>
          </el-option>
        </el-select>
      </div>
      <div class="section-header">
        <el-row :gutter="20">
          <el-col :span="19">
            <el-space spacer=" | ">
              <el-tooltip content="请选择租客类型" placement="right">
                <el-segmented v-model="formInline.tenant.tenantType" :options="tenantTypeOptions" />
              </el-tooltip>
            </el-space>
          </el-col>
          <el-col :span="5" class="text-right">
            <el-button type="primary" :icon="Plus" @click="openTenantMateDialog('添加', formInline.tenant.tenantMateList)">添加同住人</el-button>
          </el-col>
        </el-row>
      </div>
      <div class="mt-4">
        <div v-if="formInline.tenant.tenantType === 0">
          <el-row :gutter="20">
            <el-col :span="5">
              <el-form-item label="姓名" prop="name">
                <el-input v-model="formInline.tenant.name" placeholder="请输入租客姓名" clearable maxlength="20" show-word-limit />
              </el-form-item>
            </el-col>

            <el-col :span="2">
              <el-form-item label="&nbsp;" prop="gender">
                <el-segmented v-model="formInline.tenant.gender" :options="genderOptions" />
              </el-form-item>
            </el-col>

            <el-col :span="4">
              <el-form-item label="联系电话" prop="phone">
                <el-input v-model="formInline.tenant.phone" placeholder="请输入联系电话" clearable maxlength="30" />
              </el-form-item>
            </el-col>

            <el-col :span="3">
              <el-form-item label="证件类型" prop="idType">
                <el-select v-model="formInline.tenant.idType" placeholder="请选择证件类型" class="w-full">
                  <el-option v-for="item in idTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="证件号码" prop="idNo">
                <el-input v-model="formInline.tenant.idNo" placeholder="请输入证件号码" clearable maxlength="20" />
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="租客标签" prop="tags">
                <el-select v-model="formInline.tenant.tags" placeholder="租客标签" class="w-full" multiple collapse-tags collapse-tags-tooltip :max-collapse-tags="1">
                  <el-option v-for="item in tenantTagOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="1" class="mb-4">
            <el-col :span="24">
              <el-space spacer="|">
                <div>
                  <div class="mb-2">
                    <span class="font-bold">证件信息</span>
                  </div>
                  <el-space>
                    <UploadImage v-model="formInline.tenant.idCardFrontList" :limit="1" :width="120" :height="72">
                      <!-- 使用自定义提示 -->
                      <template #tip="">
                        <div class="text-center font-bold text-sm">身份证国徽面</div>
                      </template>
                    </UploadImage>
                    <UploadImage v-model="formInline.tenant.idCardBackList" :limit="1" :width="120" :height="72">
                      <!-- 使用自定义提示 -->
                      <template #tip="">
                        <div class="text-center font-bold text-sm">身份证人像面</div>
                      </template>
                    </UploadImage>
                    <UploadImage v-model="formInline.tenant.idCardInHandList" :limit="1" :width="120" :height="72">
                      <!-- 使用自定义提示 -->
                      <template #tip="">
                        <div class="text-center font-bold text-sm">手持身份证照片</div>
                      </template>
                    </UploadImage>
                  </el-space>
                </div>
                <div>
                  <div class="mb-2">
                    <span class="font-bold">其他照片</span>
                  </div>
                  <UploadImage v-model="formInline.tenant.otherImageList" :limit="3" :width="120" :height="72">
                    <!-- 使用自定义提示 -->
                    <template #tip="">
                      <div class="font-bold text-sm">其他照片，最多可上传3张</div>
                    </template>
                  </UploadImage>
                </div>
              </el-space>
            </el-col>
          </el-row>
        </div>

        <div v-if="formInline.tenant.tenantType === 1">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="企业名称" prop="name">
                <el-input v-model="formInline.tenant.name" placeholder="请输入企业名称" clearable maxlength="20" show-word-limit />
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="统一社会信用代码" prop="idNo">
                <el-input v-model="formInline.tenant.idNo" placeholder="请输入统一社会信用代码" clearable maxlength="20" />
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="法定代表人" prop="legalRepresentative">
                <el-input v-model="formInline.tenant.legalRepresentative" placeholder="请输入法定代表人" clearable maxlength="30" />
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="联系电话" prop="phone">
                <el-input v-model="formInline.tenant.phone" placeholder="请输入联系电话" clearable maxlength="30" />
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="租客标签" prop="tags">
                <el-select v-model="formInline.tenant.tags" placeholder="租客标签" class="w-full" multiple collapse-tags collapse-tags-tooltip :max-collapse-tags="1">
                  <el-option v-for="item in tenantTagOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <upload-image v-model="formInline.tenant.avatar" :limit="3" />
            </el-col>
          </el-row>
        </div>
      </div>
    </div>
    <div class="mb-4 tenant-contract-info">
      <div class="mb-2"><h3>租约信息</h3></div>
      <div>
        <el-row :gutter="20">
          <el-col :span="4">
            <el-form-item label="签约类型" prop="contractNature">
              <el-select v-model="formInline.contract.contractNature" placeholder="签约类型" class="w-full" clearable>
                <el-option v-for="item in TENANT_CONTRACT_NATURE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="7">
            <el-form-item label="合同周期" prop="leaseDate">
              <el-date-picker
                v-model="leaseDate"
                type="daterange"
                class="w-[240px]!"
                unlink-panels
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                :shortcuts="leaseDateShortCut"
                :popper-options="{
                  placement: 'bottom-start' // 下拉面板出现的位置，或 'top-start'、'bottom-end'、'top-end' 等，具体看 https://popper.js.org/docs/v2/constructors/#options
                }"
              />
            </el-form-item>
          </el-col>
          <el-col :span="7">
            <el-form-item label="入离日期" prop="leaseDate">
              <el-date-picker
                v-model="checkDate"
                type="daterange"
                class="w-[240px]!"
                unlink-panels
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                :shortcuts="leaseDateShortCut"
                :popper-options="{
                  placement: 'bottom-start' // 下拉面板出现的位置，或 'top-start'、'bottom-end'、'top-end' 等，具体看 https://popper.js.org/docs/v2/constructors/#options
                }"
              />
            </el-form-item>
          </el-col>

        </el-row>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="租金信息" prop="rentInfo">
              <div class="rent-info-container">
                <!-- 押付方式 -->
                <div class="payment-method">
                  <span class="label-text">押</span>
                  <el-select v-model="formInline.contract.depositMonths" class="deposit-select" placeholder="押金">
                    <el-option label="0个月" :value="0" />
                    <el-option label="1个月" :value="1" />
                    <el-option label="2个月" :value="2" />
                    <el-option label="3个月" :value="3" />
                  </el-select>

                  <span class="label-text">付</span>
                  <el-select v-model="formInline.contract.paymentMonths" class="payment-select" placeholder="付款">
                    <el-option label="1个月" :value="1" />
                    <el-option label="2个月" :value="2" />
                    <el-option label="3个月" :value="3" />
                    <el-option label="6个月" :value="6" />
                    <el-option label="12个月" :value="12" />
                  </el-select>
                </div>

                <!-- 月租金输入 -->
                <div class="rent-input">
                  <el-input v-model="formInline.contract.rentalPrice" type="number" placeholder="请输入月租金" class="rent-price-input">
                    <template #prefix>
                      <span class="currency-symbol">¥</span>
                    </template>
                    <template #append>元/月</template>
                  </el-input>
                </div>
              </div>

              <!-- 计算提示 -->
              <div v-if="depositAmount || totalFirstPayment" class="rent-summary w-full">
                <el-text type="info" size="small">
                  押金：
                  <span class="amount">¥{{ depositAmount }}</span>
                  {{ totalFirstPayment ? `，首次支付：` : "" }}
                  <span v-if="totalFirstPayment" class="amount">¥{{ totalFirstPayment }}</span>
                </el-text>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="收租日设置" prop="rentDueType">
              <el-select v-model="formInline.contract.rentDueType" placeholder="请选择">
                <el-option v-for="item in RENT_DUE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="&nbsp;&nbsp;" prop="rentDueType">
              <el-input v-model.number="formInline.contract.rentDueDay" :min="0" placeholder="请输入" type="number">
                <template #prepend>
                  {{ formInline.contract.rentDueType == 1 ? "提前" : formInline.contract.rentDueType == 2 ? "每月" : "延后" }}
                </template>
                <template #append>
                  {{ formInline.contract.rentDueType == 1 ? "天" : formInline.contract.rentDueType == 2 ? "号收租" : "天" }}
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </div>
    <div>
      <!-- 其他费用配置 -->
      <OtherFeeSelect v-model="formInline.otherFees" />
    </div>
    <div class="mb-4">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="合同补充说明" prop="formInline.contract.remark">
            <el-input v-model="formInline.contract.remark" type="textarea" :rows="4" placeholder="请输入备注信息" maxlength="500" show-word-limit />
          </el-form-item>
        </el-col>
      </el-row>
    </div>
    <h3 class="py-3">负责人信息</h3>
    <el-row :gutter="20">
      <el-col :span="6">
        <el-form-item label="签约部门" prop="deptId">
          <DeptTreeSelect v-model="formInline.contract.deptId" :emit-on-default="true" @dept-selected="handleDeptSelected" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="签约人" prop="salesmanId">
          <el-select v-model="formInline.contract.salesmanId" filterable placeholder="请选择签约人" clearable>
            <el-option v-for="item in salesmanList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="成交渠道" prop="dealChannel">
          <el-select v-model="formInline.contract.dealChannel" placeholder="请选择成交渠道" class="w-full" clearable>
            <el-option v-for="item in dealChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="租客来源" prop="tenantSource">
          <el-select v-model="formInline.contract.tenantSource" placeholder="请选择租客来源" class="w-full" multiple clearable collapse-tags collapse-tags-tooltip>
            <el-option v-for="item in tenantSourceOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup lang="ts">
  import { computed, reactive, ref } from "vue";
  import type { FormInstance } from "element-plus";
  import { GENDER_OPTIONS, getOptionByCode, ID_TYPE_OPTIONS, RENT_DUE_TYPE_OPTIONS, RENTAL_TYPE_OPTIONS, TENANT_CONTRACT_NATURE_OPTIONS, TENANT_TYPE_OPTIONS } from "@/constants";
  import type { TenantsCreateFormProps } from "@/types";
  import { tenantFormRules } from "@/views/contract/tenant/utils/rule";
  import useTenant from "@/views/contract/tenant/utils/hook";
  import UploadImage from "@/components/Business/UploadImage.vue";
  import { Plus } from "@element-plus/icons-vue";
  import { getRoomList } from "@/api/house/room";
  import OtherFeeSelect from "@/components/Business/OtherFeeSelect.vue";
  import DeptTreeSelect from "@/components/Business/DeptTreeSelect.vue";

  const { tenantSourceOptions, dealChannelOptions, tenantTagOptions, openTenantMateDialog } = useTenant();

  interface FormProps {
    formInline: TenantsCreateFormProps;
  }

  const props = defineProps<FormProps>();

  // 表单引用
  const ruleFormRef = ref<FormInstance>();

  // 表单数据
  const formInline = reactive<TenantsCreateFormProps>({
    tenant: {
      id: props.formInline?.tenant?.id,
      name: props.formInline?.tenant?.name || "",
      gender: props.formInline?.tenant?.gender,
      tenantType: props.formInline?.tenant?.tenantType ?? 0,
      idType: props.formInline?.tenant?.idType ?? 0,
      idNo: props.formInline?.tenant?.idNo || "",
      phone: props.formInline?.tenant?.phone || "",
      tags: props.formInline?.tenant?.tags || [],
      remark: props.formInline?.tenant?.remark || "",
      status: props.formInline?.tenant?.status ?? 1,
      idCardBackList: props.formInline?.tenant?.idCardBackList || [],
      idCardFrontList: props.formInline?.tenant?.idCardFrontList || [],
      idCardInHandList: props.formInline?.tenant?.idCardInHandList || [],
      otherImageList: props.formInline?.tenant?.otherImageList || []
    },
    tenantMateList: props.formInline?.tenantMateList ?? null,
    // 确保 contract 为 null 时不会抛出错误
    contract: props.formInline?.contract || {
      contractNature: props.formInline?.contract?.contractNature ?? 1,
      depositMonths: props.formInline?.contract?.depositMonths || 1,
      paymentMonths: props.formInline?.contract?.paymentMonths || 1,
      rentalPrice: props.formInline?.contract?.rentalPrice || 0,
      remark: props.formInline?.contract?.remark || "",
      deptId: props.formInline?.contract?.deptId || "",
      salesmanId: props.formInline?.contract?.salesmanId || "",
      dealChannel: props.formInline?.contract?.dealChannel || "",
      tenantSource: props.formInline?.contract?.tenantSource || []
    },
    otherFees: props.formInline?.otherFees || []
  });

  // 验证规则
  const rules = tenantFormRules(formInline);

  // 选择的房源 ID 列表
  const selectedRooms = ref<any[]>([]);

  // 常量选项
  const genderOptions = GENDER_OPTIONS;
  const idTypeOptions = ID_TYPE_OPTIONS;
  const tenantTypeOptions = TENANT_TYPE_OPTIONS;

  // 暴露方法给父组件
  const getRef = () => {
    return ruleFormRef.value;
  };

  const formatRoomSelectName = (item: any) => {
    const rentalTypeName = getOptionByCode(RENTAL_TYPE_OPTIONS, item.rentalType) || "";
    if (item.rentalType === 1) {
      return "【" + rentalTypeName.label + "】" + item.houseName;
    } else {
      return "【" + rentalTypeName.label + "】" + item.houseName + " -【" + item.roomNumber + "】";
    }
  };

  // 拼接户型、面积和朝向
  const formatRoomSelectDescription = (item: any) => {
    let description = "";
    if (item.houseLayout) {
      const { bedroom, livingRoom, kitchen, bathroom } = item.houseLayout;
      description = `${bedroom || 0}室${livingRoom || 0}厅${kitchen || 0}厨${bathroom || 0}卫 `;
    }
    if (item.area) {
      description += item.area + "m² ";
    }
    if (item.direction) {
      description += item.direction;
    }

    if (item.price) {
      description += " ｜ 价格：¥" + item.price + "元/月";
    }

    return description;
  };

  const roomOptions = ref<any[]>([]);
  const searchLoading = ref<boolean>(false);
  const handleSearchRoom = (query: string) => {
    if (query) {
      searchLoading.value = true;
      getRoomList({
        keywords: query,
        page: 1,
        pageSize: 10
      }).then(res => {
        roomOptions.value =
          res.data?.list.map(item => ({
            label: formatRoomSelectName(item),
            value: item.roomId,
            description: formatRoomSelectDescription(item),
            extra: item
          })) || [];
        searchLoading.value = false;
      });
    } else {
      roomOptions.value = [];
    }
  };

  const leaseDate = ref<any[]>([]);
  const checkDate = ref<any[]>([]);

  const leaseDateShortCut = [
    {
      text: "一个月",
      value: () => {
        const start = new Date();
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        end.setDate(end.getDate() - 1);
        return [start, end];
      }
    },
    {
      text: "三个月",
      value: () => {
        const start = new Date();
        const end = new Date(start);
        end.setMonth(end.getMonth() + 3);
        end.setDate(end.getDate() - 1);
        return [start, end];
      }
    },
    {
      text: "六个月",
      value: () => {
        const start = new Date();
        const end = new Date(start);
        end.setMonth(end.getMonth() + 6);
        end.setDate(end.getDate() - 1);
        return [start, end];
      }
    },
    {
      text: "十二个月",
      value: () => {
        const start = new Date();
        const end = new Date(start);
        end.setMonth(end.getMonth() + 12);
        end.setDate(end.getDate() - 1);
        return [start, end];
      }
    }
  ];

  defineExpose({
    getRef,
    formInline
  });

  // 计算押金金额
  const depositAmount = computed(() => {
    const price = Number(formInline.contract.rentalPrice) || 0;
    const months = formInline.contract.depositMonths || 0;
    return (price * months).toFixed(2);
  });

  // 计算首次支付总额（押金 + 首付）
  const totalFirstPayment = computed(() => {
    const price = Number(formInline.contract.rentalPrice) || 0;
    const depositMonths = formInline.contract.depositMonths || 0;
    const paymentMonths = formInline.contract.paymentMonths || 0;
    const total = price * (depositMonths + paymentMonths);
    return total > 0 ? total.toFixed(2) : "";
  });
</script>

<style scoped lang="scss">
  .house-selector-info {
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
  }

  .rent-info-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .payment-method {
    display: flex;
    align-items: center;
    gap: 8px;

    .label-text {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-regular);
      min-width: 24px;
    }

    .deposit-select,
    .payment-select {
      flex: 1;
      min-width: 100px;

      :deep(.el-input__inner) {
        text-align: center;
      }
    }
  }

  .rent-input {
    width: 100%;

    .rent-price-input {
      width: 100%;

      :deep(.el-input__inner) {
        font-size: 16px;
        font-weight: 500;
      }

      .currency-symbol {
        color: var(--el-text-color-regular);
        font-weight: 500;
      }
    }
  }

  .rent-summary {
    margin-top: 8px;
    padding: 5px;
    background: var(--el-fill-color-light);
    border-radius: 4px;

    .amount {
      color: var(--el-color-primary);
      font-weight: 600;
      font-size: 14px;
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    .payment-method {
      flex-wrap: wrap;

      .deposit-select,
      .payment-select {
        min-width: 80px;
      }
    }
  }
</style>
