<template>
  <el-form ref="ruleFormRef" :model="formInline" :rules="rules" label-width="100px" label-position="top">
    <div class="section-tenant-info">
      <div class="mb-4 house-selector-info">
        <div class="flex justify-between items-center mb-2">
          <el-text type="primary" size="large" tag="b">房源信息</el-text>
          <el-button type="primary" link :icon="Plus" @click="roomPickerRef.show()">选择房源</el-button>
        </div>

        <div v-if="roomSelection.length > 0" class="room-tags-box p-3 border rounded-md">
          <el-tag v-for="(room, index) in roomSelection" :key="room.value" closable class="m-1" size="large" @close="handleRemoveRoom(index)">
            {{ room.label }} |
            <span class="text-orange-500">¥{{ room.extra?.price }}</span>
          </el-tag>
        </div>
        <el-empty v-else description="请点击上方选择房源" :image-size="60" />

        <el-form-item prop="tenant.roomIds" label-width="0" class="!m-0" />
      </div>
      <RoomPicker ref="roomPickerRef" @confirm="handleRoomConfirmed" />
      <div class="section-header">
        <el-row :gutter="20">
          <el-col :span="16">
            <el-space spacer=" | ">
              <el-tooltip content="请选择租客类型" placement="right">
                <el-segmented v-model="formInline.tenant.tenantType" :options="tenantTypeOptions" />
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
        <div v-if="formInline.tenant.tenantType === 0">
          <el-row :gutter="20">
            <el-col :span="5">
              <el-form-item label="姓名" prop="tenant.name">
                <el-input v-model="formInline.tenantPersonal.name" placeholder="请输入租客姓名" clearable maxlength="20" show-word-limit />
              </el-form-item>
            </el-col>

            <el-col :span="2">
              <el-form-item label="&nbsp;" prop="gender">
                <el-segmented v-model="formInline.tenantPersonal.gender" :options="genderOptions" />
              </el-form-item>
            </el-col>

            <el-col :span="4">
              <el-form-item label="联系电话" prop="tenant.phone">
                <el-input v-model="formInline.tenantPersonal.phone" placeholder="请输入联系电话" clearable maxlength="30" />
              </el-form-item>
            </el-col>

            <el-col :span="3">
              <el-form-item label="证件类型" prop="tenant.idType">
                <el-select v-model="formInline.tenantPersonal.idType" placeholder="请选择证件类型" class="w-full">
                  <el-option v-for="item in idTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="证件号码" prop="tenant.idNo">
                <el-input v-model="formInline.tenantPersonal.idNo" placeholder="请输入证件号码" clearable maxlength="20" />
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="租客标签" prop="tags">
                <el-select v-model="formInline.tenantPersonal.tags" placeholder="租客标签" class="w-full" multiple collapse-tags collapse-tags-tooltip :max-collapse-tags="1">
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
                    <UploadImage v-model="formInline.tenantPersonal.idCardFrontList" :limit="1" :width="120" :height="72">
                      <!-- 使用自定义提示 -->
                      <template #tip="">
                        <div class="text-center font-bold text-sm">身份证国徽面</div>
                      </template>
                    </UploadImage>
                    <UploadImage v-model="formInline.tenantPersonal.idCardBackList" :limit="1" :width="120" :height="72">
                      <!-- 使用自定义提示 -->
                      <template #tip="">
                        <div class="text-center font-bold text-sm">身份证人像面</div>
                      </template>
                    </UploadImage>
                    <UploadImage v-model="formInline.tenantPersonal.idCardInHandList" :limit="1" :width="120" :height="72">
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
                  <UploadImage v-model="formInline.tenantPersonal.otherImageList" :limit="3" :width="120" :height="72">
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
          <el-row :gutter="1" class="mb-4">
            <el-col :span="24">
              <div class="mb-2">
                <span class="font-bold">证件信息</span>
              </div>
              <el-space>
                <UploadImage v-model="formInline.tenantCompany.businessLicenseUrls" :limit="1" :width="120" :height="72">
                  <!-- 使用自定义提示 -->
                  <template #tip="">
                    <div class="text-center font-bold text-sm">营业执照</div>
                  </template>
                </UploadImage>
              </el-space>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>
    <div class="mb-4 tenant-contract-info">
      <div class="mb-4">
        <el-space spacer="|">
          <el-text type="primary" size="large" tag="b">租约信息</el-text>
        </el-space>
      </div>
      <div>
        <el-row :gutter="20">
          <el-col :span="3">
            <el-form-item label="签约类型" prop="tenant.contractNature">
              <el-select v-model="formInline.tenant.contractNature" placeholder="签约类型" class="w-full" clearable>
                <el-option v-for="item in TENANT_CONTRACT_NATURE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="合同周期" prop="tenant.leaseDate">
              <el-date-picker
                v-model="formInline.tenant.leaseDate"
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
          <el-col :span="5">
            <el-form-item label="入离日期" prop="tenant.checkDate">
              <el-date-picker
                v-model="formInline.tenant.checkDate"
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
          <el-col :span="5">
            <el-form-item label="租金信息">
              <div class="rent-info-container">
                <!-- 押付方式 -->
                <div class="payment-method">
                  <el-select v-model="formInline.tenant.depositMonths" class="deposit-select" placeholder="押金">
                    <template #prefix>押</template>
                    <el-option v-for="item in depositMonthsOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                  <el-select v-model="formInline.tenant.paymentMonths" class="payment-select" placeholder="付款">
                    <template #prefix>付</template>
                    <el-option v-for="item in paymentMonthsOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="月租金" prop="tenant.rentPrice" required>
              <div>
                <!-- 月租金输入 -->
                <div class="rent-input">
                  <el-input v-model="formInline.tenant.rentPrice" type="number" placeholder="请输入月租金" class="rent-price-input">
                    <template #prefix>
                      <span class="currency-symbol">¥</span>
                    </template>
                    <template #append>元/月</template>
                  </el-input>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row class="mb-4">
          <el-col :span="13">&nbsp;</el-col>
          <el-col :span="11">
            <!-- 计算提示 -->
            <div v-if="depositAmount || totalFirstPayment" class="rent-summary">
              <el-text type="info" size="small">
                押金：
                <span class="amount">¥{{ depositAmount }} 元</span>
                {{ totalFirstPayment ? `，首次支付：` : "" }}
                <span v-if="totalFirstPayment" class="amount">¥{{ totalFirstPayment }} 元</span>
              </el-text>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="合同模板" prop="tenant.contractTemplateId" required>
              <el-select v-model="formInline.tenant.contractTemplateId" placeholder="请选择合同模板">
                <el-option v-for="item in contractTemplateList" :key="item.id" :label="item.templateName" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="收租设置" prop="tenant.rentDueType" required>
              <el-input v-model.number="formInline.tenant.rentDueDay" :min="0" placeholder="请输入" type="number" class="text-center rent-due-day-input">
                <template #prepend>
                  <el-select v-model="formInline.tenant.rentDueType" placeholder="请选择" style="width: 80px">
                    <el-option v-for="item in RENT_DUE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </template>
                <template #append>
                  {{ formInline.tenant.rentDueType == 2 ? "号收租" : "天" }}
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="首期账单收租日" prop="tenant.firstBillDay">
              <el-select v-model="formInline.tenant.firstBillDay" placeholder="请选择">
                <el-option v-for="item in FIRST_BILL_DAY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </div>
    <div>
      <!-- 其他费用配置 -->
      <OtherFeeSelect v-model="formInline.otherFees" />
    </div>
    <div class="mb-1">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="合同补充说明" prop="formInline.tenant.remark">
            <el-input v-model="formInline.tenant.remark" type="textarea" :rows="4" placeholder="请输入备注信息" maxlength="500" show-word-limit />
          </el-form-item>
        </el-col>
      </el-row>
    </div>
    <div>
      <div class="mb-2"><el-text type="primary" size="large" tag="b">负责人信息</el-text></div>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="签约部门" prop="tenant.deptId" required>
            <DeptTreeSelect v-model="formInline.tenant.deptId" :emit-on-default="true" @dept-selected="handleDeptSelected" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="签约人" prop="tenant.salesmanId" required>
            <el-select v-model="formInline.tenant.salesmanId" filterable placeholder="请选择签约人" clearable>
              <el-option v-for="item in salesmanList" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="成交渠道" prop="tenant.dealChannel">
            <el-select v-model="formInline.tenant.dealChannel" placeholder="请选择成交渠道" class="w-full" clearable>
              <el-option v-for="item in dealChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="租客来源" prop="tenant.tenantSource">
            <el-select v-model="formInline.tenant.tenantSource" placeholder="请选择租客来源" class="w-full" multiple clearable collapse-tags collapse-tags-tooltip>
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
    TENANT_CONTRACT_NATURE_OPTIONS,
    TENANT_TYPE_OPTIONS
  } from "@/constants";
  import type { TenantsCreateFormProps } from "@/types";
  import { tenantCompanyFormRules, tenantFormRules } from "@/views/contract/tenant/utils/rule";
  import useTenant from "@/views/contract/tenant/utils/hook";
  import UploadImage from "@/components/Business/UploadImage.vue";
  import { Plus } from "@element-plus/icons-vue";
  import OtherFeeSelect from "@/components/Business/OtherFeeSelect.vue";
  import DeptTreeSelect from "@/components/Business/DeptTreeSelect.vue";
  import { getCompanyUserOptions } from "@/api/company";
  import { getMyAvailableContractTemplates } from "@/api/contract/template";
  import RoomPicker from "@/components/Business/RoomPicker.vue";

  const { tenantSourceOptions, dealChannelOptions, tenantTagOptions, openTenantMateDialog } = useTenant();

  interface FormProps {
    formInline: TenantsCreateFormProps;
  }

  const props = defineProps<FormProps>();

  // 表单引用
  const ruleFormRef = ref<FormInstance>();

  const roomSelection = ref([]);

  // 表单数据
  const formInline = reactive<TenantsCreateFormProps>({
    booking: props.formInline.booking,
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
    // 确保 tenant 为 null 时不会抛出错误
    tenant: props.formInline?.tenant || {
      contractTemplateId: props.formInline?.tenant?.contractTemplateId || null,
      roomIds: props.formInline?.tenant?.roomIds || [],
      tenantName: props.formInline?.tenant?.tenantName || "",
      tenantPhone: props.formInline?.tenant?.tenantPhone || "",
      tenantType: props.formInline?.tenant?.tenantType ?? 0,
      leaseDate: props.formInline?.tenant?.leaseDate || [],
      leaseStart: props.formInline?.tenant?.leaseStart || new Date(),
      leaseEnd: props.formInline?.tenant?.leaseEnd || new Date(),
      checkDate: props.formInline?.tenant?.checkDate || [],
      checkInTime: props.formInline?.tenant?.checkInTime || null, // 实际入住时间
      checkOutTime: props.formInline?.tenant?.checkOutTime || null, // 实际搬离时间
      contractNature: props.formInline?.tenant?.contractNature ?? 1,
      depositMonths: props.formInline?.tenant?.depositMonths || 1,
      paymentMonths: props.formInline?.tenant?.paymentMonths || 1,
      rentDueType: props.formInline?.tenant?.rentDueType ?? 1,
      rentDueDay: props.formInline?.tenant?.rentDueDay || 15,
      rentDueOffsetDays: props.formInline?.tenant?.rentDueOffsetDays || 15,
      firstBillDay: props.formInline?.tenant?.firstBillDay || 0,
      rentPrice: props.formInline?.tenant?.rentPrice || 0,
      deptId: props.formInline?.tenant?.deptId || null,
      salesmanId: props.formInline?.tenant?.salesmanId || null,
      dealChannel: props.formInline?.tenant?.dealChannel || null,
      tenantSource: props.formInline?.tenant?.tenantSource || null,
      remark: props.formInline?.tenant?.remark || ""
    },
    otherFees: props.formInline?.otherFees || []
  });

  // 验证规则
  const rules = computed(() => {
    if (formInline.tenant.tenantType === 0) {
      return tenantFormRules(formInline);
    } else {
      return tenantCompanyFormRules(formInline);
    }
  });

  // 选择的房源 ID 列表
  const selectedRooms = ref<any[]>([]);

  // 常量选项
  const genderOptions = [...GENDER_OPTIONS];
  const idTypeOptions = [...ID_TYPE_OPTIONS];
  const tenantTypeOptions = [...TENANT_TYPE_OPTIONS];

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
    const price = Number(formInline.tenant.rentPrice) || 0;
    const months = formInline.tenant.depositMonths || 0;
    return (price * months).toFixed(2);
  });

  // 计算首次支付总额（押金 + 首付）
  const totalFirstPayment = computed(() => {
    const price = Number(formInline.tenant.rentPrice) || 0;
    const depositMonths = formInline.tenant.depositMonths || 0;
    const paymentMonths = formInline.tenant.paymentMonths || 0;
    const total = price * (depositMonths + paymentMonths);
    return total > 0 ? total.toFixed(2) : "";
  });

  function handleDeptSelected(deptId: number) {
    return;
  }

  const salesmanList = ref<any[]>([]);
  const contractTemplateList = ref<any[]>([]);
  onMounted(() => {
    // 获取所有用户
    getCompanyUserOptions().then(resp => {
      salesmanList.value = resp.data;
    });

    // 如果有默认房源 ID
    const roomList = formInline.booking.roomList;
    if (roomList && roomList.length > 0) {
      const defaultOptions = roomList.map(item => ({
        label: formatRoomSelectName(item),
        value: item.roomId, // 注意：这里的 value 要和 v-model 绑定的类型一致
        description: formatRoomSelectDescription(item),
        extra: item
      }));

      // 关键：将默认选项放入 roomOptions 数组，下拉框才能找到 Label
      roomSelection.value = defaultOptions;
    }
  });

  // 获取租客的可用的合同模板
  getMyAvailableContractTemplates({
    contractType: 1
  }).then(resp => {
    if (resp.code == 0) {
      contractTemplateList.value = resp.data;
    }
  });

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
      extra: item
    }));

    // 触发价格计算
    calculateTotalRent();
  };

  // 移除房源
  const handleRemoveRoom = (index: number) => {
    roomSelection.value.splice(index, 1);
    calculateTotalRent();
  };

  // 统一计算租金
  const calculateTotalRent = () => {
    let rentPrice = 0;
    roomSelection.value.forEach(item => {
      rentPrice += Number(item.extra?.price || 0);
    });
    formInline.tenant.rentPrice = rentPrice;
  };

  defineExpose({
    getRef,
    formInline,
    roomSelection
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
</style>
