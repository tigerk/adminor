<template>
  <div v-if="props.isEdit" class="mb-3">
    <el-alert title="！！！修改租金、合同起止时间、费用项等等时，会重新生成账单、并且使用最新信息重新生成合同，请谨慎修改！" type="error" />
  </div>
  <el-form ref="ruleFormRef" :model="formInline" :rules="rules" label-width="100px" label-position="top">
    <div class="section-tenant-info">
      <!-- 房源选择器 - 仅在非编辑模式下显示 -->
      <RoomPicker v-if="!props.isEdit" ref="roomPickerRef" @confirm="handleRoomConfirmed" />
      <div class="section-header">
        <el-row :gutter="20">
          <el-col :span="16">
            <el-space spacer=" | ">
              <el-tooltip content="请选择租客类型" placement="right">
                <el-segmented v-model="formInline.lease.tenantType" :options="tenantTypeOptions" />
              </el-tooltip>
            </el-space>
          </el-col>
          <el-col :span="8" class="text-right">
            <el-space spacer=" ">
              <el-text v-if="formInline.tenantMateList != null">同住人 {{ formInline.tenantMateList.length }} 人</el-text>
              <el-button type="primary" :icon="Plus" @click="handleAddTenantMate">添加同住人</el-button>
            </el-space>
          </el-col>
        </el-row>
      </div>
      <div class="mt-4">
        <div class="mb-2"><el-text type="primary" size="large" tag="b">租客信息</el-text></div>
        <div v-if="formInline.lease.tenantType === 0">
          <el-row :gutter="20">
            <el-col :span="5">
              <el-form-item label="姓名" prop="tenantPersonal.name">
                <el-input v-model="formInline.tenantPersonal.name" placeholder="请输入租客姓名" clearable maxlength="20" show-word-limit />
              </el-form-item>
            </el-col>

            <el-col :span="2">
              <el-form-item label="&nbsp;" prop="gender">
                <el-segmented v-model="formInline.tenantPersonal.gender" :options="genderOptions" />
              </el-form-item>
            </el-col>

            <el-col :span="4">
              <el-form-item label="联系电话" prop="tenantPersonal.phone">
                <el-input v-model="formInline.tenantPersonal.phone" placeholder="请输入联系电话" clearable maxlength="30" />
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="证件信息" prop="tenantPersonal.idNo">
                <el-input v-model="formInline.tenantPersonal.idNo" placeholder="请输入证件号码" clearable maxlength="20">
                  <template #prepend>
                    <el-select v-model="formInline.tenantPersonal.idType" placeholder="证件类型" style="width: 120px">
                      <el-option v-for="item in idTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item prop="tenantPersonal.idType" class="hidden-form-item" />
            </el-col>
            <el-col :span="5">
              <el-form-item label="租客标签" prop="tags">
                <el-select v-model="formInline.tenantPersonal.tags" placeholder="租客标签" class="w-full" multiple collapse-tags collapse-tags-tooltip :max-collapse-tags="1">
                  <el-option v-for="item in tenantTagOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <div class="section-block mb-4">
            <div class="upload-section">
              <div class="upload-group">
                <div class="upload-group-title">
                  <el-icon><Picture /></el-icon>
                  证件照片
                </div>
                <div class="upload-items">
                  <div class="upload-item">
                    <UploadImage v-model="formInline.tenantPersonal.idCardFrontList" :limit="1" :width="120" :height="76">
                      <template #tip="">
                        <div class="upload-tip">
                          <el-icon><CreditCard /></el-icon>
                          身份证国徽面
                        </div>
                      </template>
                    </UploadImage>
                  </div>
                  <div class="upload-item">
                    <UploadImage v-model="formInline.tenantPersonal.idCardBackList" :limit="1" :width="120" :height="76">
                      <template #tip="">
                        <div class="upload-tip">
                          <el-icon><Avatar /></el-icon>
                          身份证人像面
                        </div>
                      </template>
                    </UploadImage>
                  </div>
                  <div class="upload-item">
                    <UploadImage v-model="formInline.tenantPersonal.idCardInHandList" :limit="1" :width="120" :height="76">
                      <template #tip="">
                        <div class="upload-tip">
                          <el-icon><Postcard /></el-icon>
                          手持身份证照片
                        </div>
                      </template>
                    </UploadImage>
                  </div>
                  <div class="upload-divider" />
                  <div class="upload-item">
                    <UploadImage v-model="formInline.tenantPersonal.otherImageList" :limit="3" :width="120" :height="76">
                      <template #tip="">
                        <div class="upload-tip">
                          <el-icon><Files /></el-icon>
                          其他照片（最多3张）
                        </div>
                      </template>
                    </UploadImage>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="formInline.lease.tenantType === 1">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="企业名称" prop="tenantCompany.companyName">
                <el-input v-model="formInline.tenantCompany.companyName" placeholder="请输入企业名称" clearable maxlength="20" show-word-limit />
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="统一社会信用代码" prop="tenantCompany.uscc">
                <el-input v-model="formInline.tenantCompany.uscc" placeholder="请输入统一社会信用代码" clearable maxlength="20" />
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="法定代表人" prop="tenantCompany.legalPerson">
                <el-input v-model="formInline.tenantCompany.legalPerson" placeholder="请输入法定代表人" clearable maxlength="30" />
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="联系电话" prop="tenantCompany.contactPhone">
                <el-input v-model="formInline.tenantCompany.contactPhone" placeholder="请输入联系电话" clearable maxlength="30" />
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="租客标签" prop="tags">
                <el-select v-model="formInline.tenantCompany.tags" placeholder="租客标签" class="w-full" multiple collapse-tags collapse-tags-tooltip :max-collapse-tags="1">
                  <el-option v-for="item in tenantTagOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <div class="section-block mb-4">
            <div class="upload-section">
              <div class="upload-group">
                <div class="upload-group-title">
                  <el-icon><Picture /></el-icon>
                  证件信息
                </div>
                <div class="upload-items">
                  <div class="upload-item">
                    <UploadImage v-model="formInline.tenantCompany.businessLicenseUrls" :limit="1" :width="120" :height="76">
                      <template #tip="">
                        <div class="upload-tip">
                          <el-icon><Files /></el-icon>
                          营业执照
                        </div>
                      </template>
                    </UploadImage>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mb-2 tenant-contract-info">
      <div class="mb-4">
        <el-space spacer="|">
          <el-text type="primary" size="large" tag="b">租约信息</el-text>
        </el-space>
      </div>
      <div>
        <el-row class="mb-4">
          <el-col :span="24">
            <el-form-item label="租金与费用配置" required>
              <RoomConfigSection
                :is-edit="props.isEdit"
                :room-selection="roomSelection"
                :room-configs="roomConfigs"
                :expanded-room-id="expandedRoomId"
                :total-rent="formInline.lease.rentPrice"
                :deposit-months="formInline.lease.depositMonths"
                :payment-months="formInline.lease.paymentMonths"
                :deposit-amount="depositAmount"
                :total-first-payment="totalFirstPayment || '0.00'"
                :deposit-months-options="depositMonthsOptions"
                :payment-months-options="paymentMonthsOptions"
                @pick-rooms="roomPickerRef.show(roomSelection)"
                @remove-room="handleRemoveRoom"
                @change-room-rent="handleRoomRentChange"
                @toggle-room="toggleRoomExpand"
                @update:deposit-months="value => (formInline.lease.depositMonths = value)"
                @update:payment-months="value => (formInline.lease.paymentMonths = value)"
              />
              <el-form-item prop="lease.roomIds" label-width="0" class="!m-0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="签约类型" prop="lease.contractNature">
              <el-select v-model="formInline.lease.contractNature" default-first-option placeholder="签约类型" class="w-full" clearable>
                <el-option v-for="item in LEASE_CONTRACT_NATURE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="合同周期" prop="lease.leaseDate">
              <el-date-picker
                v-model="formInline.lease.leaseDate"
                type="daterange"
                class="w-[240px]!"
                unlink-panels
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                :shortcuts="leaseDateShortCut"
                :popper-options="{
                  placement: 'bottom-start' // 下拉面板出现的位置，或 'top-start'、'bottom-end'、'top-end' 等，具体看 https://popper.js.org/docs/v2/constructors/#options
                }"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="入离日期" prop="lease.checkDate">
              <el-date-picker
                v-model="formInline.lease.checkDate"
                type="daterange"
                class="w-[240px]!"
                unlink-panels
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                :shortcuts="leaseDateShortCut"
                :popper-options="{
                  placement: 'bottom-start' // 下拉面板出现的位置，或 'top-start'、'bottom-end'、'top-end' 等，具体看 https://popper.js.org/docs/v2/constructors/#options
                }"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="合同模板" prop="lease.contractTemplateId" required>
              <el-select v-model="formInline.lease.contractTemplateId" placeholder="请选择合同模板">
                <el-option v-for="item in contractTemplateList" :key="item.id" :label="item.templateName" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="收租设置" prop="lease.rentDueType" required>
              <el-input v-model.number="formInline.lease.rentDueDay" :min="0" placeholder="" type="number" class="text-center rent-due-day-input">
                <template #prepend>
                  <el-select v-model="formInline.lease.rentDueType" placeholder="选择" style="width: 80px">
                    <el-option v-for="item in RENT_DUE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </template>
                <template #append>
                  {{ formInline.lease.rentDueType == 2 ? "号收租" : "天" }}
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="首期账单收租日" prop="lease.firstBillDay">
              <el-select v-model="formInline.lease.firstBillDay" placeholder="请选择">
                <el-option v-for="item in FIRST_BILL_DAY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </div>
    <div class="mb-1">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="合同补充说明" prop="formInline.lease.remark">
            <el-input v-model="formInline.lease.remark" type="textarea" :rows="4" placeholder="请输入备注信息" maxlength="500" show-word-limit />
          </el-form-item>
        </el-col>
      </el-row>
    </div>
    <div>
      <div class="mb-2"><el-text type="primary" size="large" tag="b">负责人信息</el-text></div>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="签约部门" prop="lease.deptId" required>
            <DeptTreeSelect v-model="formInline.lease.deptId" :emit-on-default="true" @dept-selected="handleDeptSelected" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="签约人" prop="lease.salesmanId" required>
            <el-select v-model="formInline.lease.salesmanId" filterable placeholder="请选择签约人" clearable>
              <el-option v-for="item in salesmanList" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="成交渠道" prop="lease.dealChannel">
            <el-select v-model="formInline.lease.dealChannel" placeholder="请选择成交渠道" class="w-full" clearable>
              <el-option v-for="item in dealChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="租客来源" prop="lease.tenantSource">
            <el-select v-model="formInline.lease.tenantSource" placeholder="请选择租客来源" class="w-full" clearable collapse-tags collapse-tags-tooltip>
              <el-option v-for="item in tenantSourceOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </div>
  </el-form>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from "vue";
  import type { FormInstance } from "element-plus";
  import {
    FIRST_BILL_DAY_OPTIONS,
    GENDER_OPTIONS,
    getOptionByCode,
    ID_TYPE_OPTIONS,
    RENT_DUE_TYPE_OPTIONS,
    RENTAL_TYPE_OPTIONS,
    LEASE_CONTRACT_NATURE_OPTIONS,
    TENANT_TYPE_OPTIONS
  } from "@/constants";
  import type { TenantsCreateFormProps } from "@/types";
  import useTenant from "@/views/contract/tenant/utils/hook";
  import UploadImage from "@/components/upload/UploadImage.vue";
  import { Avatar, CreditCard, Files, Picture, Plus, Postcard } from "@element-plus/icons-vue";
  import DeptTreeSelect from "@/components/org/DeptTreeSelect.vue";
  import { getCompanyUserOptions } from "@/api/company";
  import { getMyAvailableContractTemplates } from "@/api/contract/template";
  import RoomPicker from "@/shared/house/RoomPicker.vue";
  import RoomConfigSection from "@/views/contract/tenant/form/tenantCreateForm/sections/RoomConfigSection.vue";
  import { tenantCompanyFormRules, tenantFormRules } from "@/views/contract/tenant/form/tenantCreateForm/model/rules";
  import { useTenantCreateForm, type RoomSelectionItem } from "@/views/contract/tenant/form/tenantCreateForm/composables/useTenantCreateForm";

  const { tenantSourceOptions, dealChannelOptions, tenantTagOptions, openTenantMateDialog } = useTenant();

  interface FormProps {
    formInline: TenantsCreateFormProps;
    isEdit?: boolean; // 新增：标识是否为编辑模式
  }

  const props = defineProps<FormProps>();

  // 表单引用
  const ruleFormRef = ref<FormInstance>();

  const roomSelection = ref<RoomSelectionItem[]>([]);

  // 表单数据 - 确保正确初始化
  const formInline = reactive<TenantsCreateFormProps>({
    booking: props.formInline?.booking || null,
    tenantPersonal: {
      id: props.formInline?.tenantPersonal?.id,
      name: props.formInline?.tenantPersonal?.name || "",
      gender: props.formInline?.tenantPersonal?.gender,
      idType: props.formInline?.tenantPersonal?.idType ?? 0,
      idNo: props.formInline?.tenantPersonal?.idNo || "",
      phone: props.formInline?.tenantPersonal?.phone || "",
      tags: props.formInline?.tenantPersonal?.tags || [],
      remark: props.formInline?.tenantPersonal?.remark || "",
      idCardBackList: props.formInline?.tenantPersonal?.idCardBackList || [],
      idCardFrontList: props.formInline?.tenantPersonal?.idCardFrontList || [],
      idCardInHandList: props.formInline?.tenantPersonal?.idCardInHandList || [],
      otherImageList: props.formInline?.tenantPersonal?.otherImageList || []
    },
    tenantCompany: {
      id: props.formInline?.tenantCompany?.id,
      companyName: props.formInline?.tenantCompany?.companyName || "",
      uscc: props.formInline?.tenantCompany?.uscc || "",
      legalPerson: props.formInline?.tenantCompany?.legalPerson || "",
      legalPersonIdType: props.formInline?.tenantCompany?.legalPersonIdType ?? 0,
      legalPersonIdNo: props.formInline?.tenantCompany?.legalPersonIdNo || "",
      contactName: props.formInline?.tenantCompany?.contactName || "",
      contactPhone: props.formInline?.tenantCompany?.contactPhone || "",
      registeredAddress: props.formInline?.tenantCompany?.registeredAddress || "",
      businessLicenseUrls: props.formInline?.tenantCompany?.businessLicenseUrls || [],
      tags: props.formInline?.tenantCompany?.tags || [],
      remark: props.formInline?.tenantCompany?.remark || ""
    },
    tenantMateList: props.formInline?.tenantMateList ?? null,
    lease: props.formInline?.lease || {
      contractTemplateId: props.formInline?.lease?.contractTemplateId || null,
      roomIds: props.formInline?.lease?.roomIds || [],
      roomRentList: props.formInline?.lease?.roomRentList || [],
      tenantType: props.formInline?.lease?.tenantType ?? 0,
      leaseStart: props.formInline?.lease?.leaseStart || new Date().toISOString().split("T")[0],
      leaseEnd: props.formInline?.lease?.leaseEnd || new Date().toISOString().split("T")[0],
      leaseDate: props.formInline?.lease?.leaseDate || [],
      checkInAt: props.formInline?.lease?.checkInAt || null,
      checkOutAt: props.formInline?.lease?.checkOutAt || null,
      checkDate: props.formInline?.lease?.checkDate || [],
      contractNature: props.formInline?.lease?.contractNature ?? 1,
      depositMonths: props.formInline?.lease?.depositMonths || 1,
      paymentMonths: props.formInline?.lease?.paymentMonths || 1,
      rentDueType: props.formInline?.lease?.rentDueType ?? 1,
      rentDueDay: props.formInline?.lease?.rentDueDay || 15,
      rentDueOffsetDays: props.formInline?.lease?.rentDueOffsetDays || 15,
      firstBillDay: props.formInline?.lease?.firstBillDay || 0,
      rentPrice: props.formInline?.lease?.rentPrice || 0,
      deptId: props.formInline?.lease?.deptId || null,
      salesmanId: props.formInline?.lease?.salesmanId || null,
      dealChannel: props.formInline?.lease?.dealChannel || null,
      tenantSource: props.formInline?.lease?.tenantSource || null,
      remark: props.formInline?.lease?.remark || ""
    },
    otherFees: props.formInline?.otherFees || []
  });

  const { roomConfigs, expandedRoomId, buildRoomConfigs, handleRoomRentChange, toggleRoomExpand } = useTenantCreateForm(formInline, roomSelection);

  const salesmanList = ref<any[]>([]);
  const contractTemplateList = ref<any[]>([]);

  // 常量选项
  const genderOptions = [...GENDER_OPTIONS];
  const idTypeOptions = [...ID_TYPE_OPTIONS];
  const tenantTypeOptions = [...TENANT_TYPE_OPTIONS];

  // 初始化 roomSelection
  const initRoomSelection = () => {
    let roomList = [];

    // 优先从 formInline 中获取 roomList（编辑模式）
    if (props.formInline?.lease?.roomList && props.formInline.lease?.roomList.length > 0) {
      roomList = props.formInline?.lease.roomList;
    }
    // 其次从 booking 中获取（新建模式）
    else if (props.formInline?.booking?.roomList && props.formInline.booking.roomList.length > 0) {
      roomList = props.formInline.booking.roomList;
    }

    if (roomList.length > 0) {
      roomSelection.value = roomList.map(item => ({
        label: formatRoomSelectName(item),
        value: item.roomId,
        description: formatRoomSelectDescription(item),
        extra: item
      }));
    }
    buildRoomConfigs();
  };

  // 组件挂载时执行
  onMounted(() => {
    // 初始化房源选择
    initRoomSelection();

    // 初始化日期范围
    if (props.formInline?.lease) {
      const { leaseStart, leaseEnd, checkInAt, checkOutAt } = props.formInline.lease;

      if (leaseStart && leaseEnd) {
        formInline.lease.leaseDate = [leaseStart, leaseEnd];
      }

      if (checkInAt && checkOutAt) {
        formInline.lease.checkDate = [checkInAt, checkOutAt];
      }
    }

    // 获取所有用户
    getCompanyUserOptions().then(resp => {
      salesmanList.value = resp.data;
    });

    // 获取租客的可用的合同模板
    getMyAvailableContractTemplates({
      contractType: 1
    }).then(resp => {
      if (resp.code == 0) {
        contractTemplateList.value = resp.data;
      }
    });
  });

  // 验证规则
  const rules = computed(() => {
    if (formInline.lease.tenantType === 0) {
      return tenantFormRules(formInline);
    } else {
      return tenantCompanyFormRules(formInline);
    }
  });

  // 计算首次支付总额（押金 + 首付）
  function generateMonthsOptions(start, end) {
    const monthsOptions = [];
    for (let i = start; i <= end; i++) {
      monthsOptions.push({
        value: i,
        label: i + "个月"
      });
    }
    return monthsOptions;
  }

  // 使用提取的函数生成 depositMonthsOptions 和 paymentMonthsOptions
  const depositMonthsOptions = computed(() => generateMonthsOptions(0, 12));
  const paymentMonthsOptions = computed(() => generateMonthsOptions(1, 12));

  // 暴露方法给父组件
  const getRef = () => {
    return ruleFormRef.value;
  };

  const formatRoomSelectName = (item: any) => {
    const rentalTypeName = getOptionByCode([...RENTAL_TYPE_OPTIONS], item.rentalType) || "";
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

  // 计算押金金额
  const depositAmount = computed(() => {
    const price = Number(formInline.lease.rentPrice) || 0;
    const months = formInline.lease.depositMonths || 0;
    return (price * months).toFixed(2);
  });

  // 计算首次支付总额（押金 + 首付）
  const totalFirstPayment = computed(() => {
    const price = Number(formInline.lease.rentPrice) || 0;
    const depositMonths = formInline.lease.depositMonths || 0;
    const paymentMonths = formInline.lease.paymentMonths || 0;
    const total = price * (depositMonths + paymentMonths);
    return total > 0 ? total.toFixed(2) : "";
  });

  function handleDeptSelected(deptId: number) {
    return;
  }

  // 修改按钮点击事件
  const handleAddTenantMate = () => {
    openTenantMateDialog("添加", formInline.tenantMateList, mates => {
      // 将返回的同住人数据更新到formInline中
      formInline.tenantMateList = mates;
    });
  };

  const roomPickerRef = ref();

  // 处理弹窗确认选择
  const handleRoomConfirmed = (rooms: any[]) => {
    // 转换成你需要的格式
    roomSelection.value = rooms.map(item => ({
      label: formatRoomSelectName(item),
      value: item.roomId,
      description: formatRoomSelectDescription(item),
      extra: item
    }));
    buildRoomConfigs();
  };

  // 移除房源
  const handleRemoveRoom = (index: number) => {
    // 编辑模式下不允许删除
    if (props.isEdit) {
      return;
    }

    const removedRoomId = String(roomSelection.value[index]?.value || "");
    roomSelection.value.splice(index, 1);
    if (expandedRoomId.value === removedRoomId) {
      expandedRoomId.value = "";
    }
    buildRoomConfigs();
  };

  defineExpose({
    getRef,
    formInline,
    roomSelection
  });
</script>

<style scoped lang="scss">
  .house-selector-info {
    position: relative;

    // 编辑模式样式
    &.edit-mode {
      .room-tags-box {
        background-color: var(--el-fill-color-lighter);
        border-color: var(--el-border-color-lighter);
        position: relative;

        // 改为 all 完全阻止所有鼠标事件
        &.disabled-box::after {
          pointer-events: all; // 拦截所有鼠标事件
          cursor: not-allowed;
        }

        .el-tag {
          &.disabled-tag {
            cursor: not-allowed;
            opacity: 0.8;

            // 禁用状态下的悬停效果
            &:hover {
              opacity: 0.8;
            }
          }
        }
      }
    }
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
    padding: 5px;
    margin-left: 10px;
    background: var(--el-fill-color-light);
    border-radius: 4px;

    .amount {
      color: var(--el-color-primary);
      font-weight: 600;
      font-size: 14px;
    }
  }

  .room-config-panel {
    width: 100%;
    border: 1px solid var(--el-border-color);
    border-radius: 10px;
    background: var(--el-bg-color);
    overflow: hidden;
  }

  .room-config-panel__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--el-border-color-light);
    background: var(--el-fill-color-light);
    position: relative;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 12px;
      bottom: 12px;
      width: 3px;
      background: var(--el-color-primary);
      border-radius: 0 2px 2px 0;
    }
  }

  .room-config-panel__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    padding-left: 10px;
    flex-shrink: 0;
  }

  .room-config-panel__desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    padding-left: 10px;
    flex: 1;
    text-align: right;
  }

  .room-config-panel__selector {
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);
  }

  .room-config-panel__selector-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .room-config-panel__selector-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .room-config-panel__selector-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .room-config-panel__selector-list {
    padding: 4px;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    background: var(--el-fill-color-blank);
  }

  .room-config-panel__selector-empty {
    padding: 18px 0 6px;
    color: var(--el-text-color-secondary);
    text-align: center;
  }

  .room-config-section-hint {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .room-config-empty {
    padding: 28px 0;
    text-align: center;
    color: var(--el-text-color-secondary);
  }

  .room-config-table {
    width: 100%;
    overflow-x: auto;

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th,
    td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--el-border-color-light);
      text-align: left;
      vertical-align: middle;
    }

    th {
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-regular);
      background: var(--el-fill-color-light);
    }

    tbody tr:last-child td {
      border-bottom: none;
    }
  }

  .room-config-table__summary-row--expanded {
    background: color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color));
  }

  .room-config-table__room {
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .room-rent-input {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .room-rent-input__prefix {
    flex: 0 0 auto;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-regular);
  }

  .room-rent-input :deep(.el-input__inner) {
    text-align: center;
  }

  .room-config-table__meta {
    color: var(--el-text-color-regular);
  }

  .room-config-table__amount {
    font-weight: 600;
    color: var(--el-color-primary);
  }

  .room-config-table__detail-row td {
    padding: 0;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  .room-config-table__detail-cell {
    padding: 0 !important;
  }

  .room-config-detail {
    padding: 16px;
    background: color-mix(in srgb, var(--el-color-primary) 4%, var(--el-fill-color-blank));
    border-left: 3px solid var(--el-color-primary);
  }

  .room-config-detail__title {
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-color-primary);
  }

  .room-config-summary-bar {
    display: grid;
    grid-template-columns: 1.5fr repeat(4, minmax(0, 1fr));
    gap: 0;
    border-top: 1px solid var(--el-border-color-light);
    background: var(--el-fill-color-lighter);
  }

  .room-config-summary-bar__item {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 64px;
    padding: 0 16px;
    border-right: 1px solid var(--el-border-color-light);
  }

  .room-config-summary-bar__item:last-child {
    border-right: none;
  }

  .room-config-summary-bar__label {
    color: var(--el-text-color-regular);
    white-space: nowrap;
  }

  .room-config-summary-bar__value {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .room-config-summary-bar__value--accent {
    color: var(--el-color-danger);
  }

  .room-config-summary-bar__suffix {
    color: var(--el-text-color-secondary);
  }

  .room-config-summary-bar__select {
    width: 120px;
  }

  .hidden-form-item {
    margin: 0;

    :deep(.el-form-item__content) {
      min-height: 0;
    }
  }

  .upload-section {
    margin-top: 4px;
  }

  .upload-group {
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 10px;
    padding: 16px;
  }

  .upload-group-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #555;
    margin-bottom: 14px;

    .el-icon {
      color: var(--el-color-primary);
    }
  }

  .upload-items {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 16px;
  }

  .upload-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .upload-divider {
    width: 1px;
    height: 80px;
    background: #e8e8e8;
    margin: 0 4px;
    align-self: center;
  }

  .upload-tip {
    display: flex;
    align-items: center;
    gap: 4px;
    justify-content: center;
    font-size: 12px;
    font-weight: 500;
    color: #666;
    margin-top: 6px;

    .el-icon {
      font-size: 13px;
      color: var(--el-color-primary);
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

  .rent-due-day-input {
    :deep(.el-input__inner) {
      text-align: center;
    }
  }

  // 深色模式适配
  html.dark {
    .house-selector-info.edit-mode {
      .room-tags-box.disabled-box::after {
        background-color: rgba(0, 0, 0, 0.2);
      }
    }

    .room-config-panel {
      border-color: var(--el-border-color);
    }

    .room-config-panel__selector-list {
      background: rgba(255, 255, 255, 0.01);
    }

    .room-config-table__summary-row--expanded {
      background: rgba(230, 125, 52, 0.08);
    }

    .room-config-detail {
      background: rgba(255, 255, 255, 0.02);
    }
  }
</style>
