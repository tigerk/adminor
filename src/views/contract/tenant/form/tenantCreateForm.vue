<template>
  <div v-if="props.isEdit" class="mb-3">
    <el-alert title="！！！修改租金、合同起止时间、费用项等等时，会重新生成账单、并且使用最新信息重新生成合同，请谨慎修改！" type="error" />
  </div>
  <el-form ref="ruleFormRef" :model="formInline" :rules="rules" label-width="100px" label-position="top">
    <div class="section-tenant-info">
      <!-- 房源选择区域 - 编辑模式完全禁用 -->
      <div class="mb-4 house-selector-info" :class="{ 'edit-mode': props.isEdit }">
        <div class="flex justify-between items-center mb-2">
          <el-text type="primary" size="large" tag="b">房源信息</el-text>

          <!-- 编辑模式：显示提示标签 -->
          <el-tag v-if="props.isEdit" type="info" size="small" effect="plain">
            <el-space>
              <el-icon class="mr-1"><Lock /></el-icon>
              编辑模式下不可修改房源
            </el-space>
          </el-tag>

          <!-- 新增模式：显示选择按钮 -->
          <el-button v-else type="primary" link :icon="Plus" @click="roomPickerRef.show(roomSelection)">选择房源</el-button>
        </div>

        <!-- 房源标签展示区域 -->
        <div v-if="roomSelection.length > 0" class="room-tags-box p-1 border rounded-md" :class="{ 'disabled-box': props.isEdit }">
          <el-tag
            v-for="(room, index) in roomSelection"
            :key="room.value"
            :closable="!props.isEdit"
            :disable-transitions="props.isEdit"
            class="m-1"
            size="large"
            :class="{ 'disabled-tag': props.isEdit }"
            @close="handleRemoveRoom(index)"
          >
            {{ room.label }} |
            <span class="text-orange-500">¥{{ room.extra?.price }}</span>
          </el-tag>
        </div>

        <!-- 空状态 -->
        <div v-else class="text-center">{{ props.isEdit ? "暂无房源信息" : "请点击右上方 选择房源" }}</div>

        <el-form-item prop="lease.roomIds" label-width="0" class="!m-0" />
      </div>
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

            <el-col :span="3">
              <el-form-item label="证件类型" prop="tenantPersonal.idType">
                <el-select v-model="formInline.tenantPersonal.idType" placeholder="请选择证件类型" class="w-full">
                  <el-option v-for="item in idTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="证件号码" prop="tenantPersonal.idNo">
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
            <el-form-item label="签约类型" prop="lease.contractNature">
              <el-select v-model="formInline.lease.contractNature" default-first-option placeholder="签约类型" class="w-full" clearable>
                <el-option v-for="item in LEASE_CONTRACT_NATURE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
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
          <el-col :span="5">
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
        <el-row class="mb-4">
          <el-col :span="24">
            <el-form-item label="房间配置明细" required>
              <div class="room-config-panel">
                <div class="room-config-panel__head">
                  <div class="room-config-panel__title">按房间分别配置租金和费用项</div>
                  <div class="room-config-panel__desc">合同级字段统一维护，房间级租金和费用单独配置，系统会自动汇总到月租金总计。</div>
                </div>
                <div v-if="roomConfigs.length === 0" class="room-config-empty">请先选择房源</div>
                <div v-else class="room-config-table">
                  <table>
                    <thead>
                      <tr>
                        <th style="width: 34%">房间</th>
                        <th style="width: 20%">月租金</th>
                        <th style="width: 16%">费用项</th>
                        <th style="width: 18%">费用合计</th>
                        <th style="width: 12%">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in roomConfigs" :key="item.roomId">
                        <td>
                          <div class="room-config-table__room">{{ item.roomLabel }}</div>
                        </td>
                        <td>
                          <el-input :model-value="item.rentPrice" type="number" placeholder="请输入月租金" @update:model-value="value => handleRoomRentChange(item.roomId, value)">
                            <template #prefix>¥</template>
                            <template #append>元/月</template>
                          </el-input>
                        </td>
                        <td>
                          <span class="room-config-table__meta">{{ item.feeList.length }} 项</span>
                        </td>
                        <td>
                          <span class="room-config-table__amount">¥{{ calculateRoomFeeTotal(item).toFixed(2) }}</span>
                        </td>
                        <td class="text-center">
                          <el-button type="primary" link @click="openRoomFeeDialog(item)">配置费用</el-button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="5">
            <el-form-item label="租金信息">
              <div class="rent-info-container">
                <!-- 押付方式 -->
                <div class="payment-method">
                  <el-select v-model="formInline.lease.depositMonths" class="deposit-select" placeholder="押金">
                    <template #prefix>押</template>
                    <el-option v-for="item in depositMonthsOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                  <el-select v-model="formInline.lease.paymentMonths" class="payment-select" placeholder="付款">
                    <template #prefix>付</template>
                    <el-option v-for="item in paymentMonthsOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="月租金总计" prop="lease.rentPrice" required>
              <div>
                <!-- 月租金输入 -->
                <div class="rent-input">
                  <el-input v-model="formInline.lease.rentPrice" type="number" readonly placeholder="按房间自动汇总" class="rent-price-input">
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
            <el-form-item label="合同模板" prop="lease.contractTemplateId" required>
              <el-select v-model="formInline.lease.contractTemplateId" placeholder="请选择合同模板">
                <el-option v-for="item in contractTemplateList" :key="item.id" :label="item.templateName" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
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
          <el-col :span="5">
            <el-form-item label="首期账单收租日" prop="lease.firstBillDay">
              <el-select v-model="formInline.lease.firstBillDay" placeholder="请选择">
                <el-option v-for="item in FIRST_BILL_DAY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </div>
    <div>
      <div class="mb-2 room-config-section-hint">全局其他费用：作用于整份租约，不区分具体房间。</div>
      <!-- 其他费用配置 -->
      <OtherFeeSelect v-model="sharedOtherFees" />
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
  <el-dialog
    v-model="roomFeeDialogVisible"
    destroy-on-close
    width="960px"
    :title="activeRoomConfig ? `配置房间费用 · ${activeRoomConfig.roomLabel}` : '配置房间费用'"
    @closed="handleRoomFeeDialogClose"
  >
    <div v-if="activeRoomConfig" class="room-fee-dialog">
      <div class="room-fee-dialog__summary">
        <div class="room-fee-dialog__item">
          <span class="room-fee-dialog__label">房间</span>
          <span class="room-fee-dialog__value">{{ activeRoomConfig.roomLabel }}</span>
        </div>
        <div class="room-fee-dialog__item">
          <span class="room-fee-dialog__label">月租金</span>
          <span class="room-fee-dialog__value">¥{{ activeRoomConfig.rentPrice.toFixed(2) }}</span>
        </div>
      </div>
      <OtherFeeSelect v-model="roomFeeDraft" hide-title />
    </div>
    <template #footer>
      <el-button @click="handleRoomFeeDialogClose">取消</el-button>
      <el-button type="primary" @click="handleRoomFeeDialogSave">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, watch } from "vue";
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
  import type { OtherFeeDto, TenantsCreateFormProps } from "@/types";
  import { tenantCompanyFormRules, tenantFormRules } from "@/views/contract/tenant/utils/rule";
  import useTenant from "@/views/contract/tenant/utils/hook";
  import UploadImage from "@/components/upload/UploadImage.vue";
  import { Lock, Plus } from "@element-plus/icons-vue";
  import OtherFeeSelect from "@/shared/contract/OtherFeeSelect.vue";
  import DeptTreeSelect from "@/components/org/DeptTreeSelect.vue";
  import { getCompanyUserOptions } from "@/api/company";
  import { getMyAvailableContractTemplates } from "@/api/contract/template";
  import RoomPicker from "@/shared/house/RoomPicker.vue";

  const { tenantSourceOptions, dealChannelOptions, tenantTagOptions, openTenantMateDialog } = useTenant();

  interface FormProps {
    formInline: TenantsCreateFormProps;
    isEdit?: boolean; // 新增：标识是否为编辑模式
  }

  interface RoomSelectionItem {
    label: string;
    value: string | number;
    description?: string;
    extra?: any;
  }

  interface RoomConfigItem {
    roomId: string;
    roomLabel: string;
    rentPrice: number;
    feeList: RoomScopedOtherFee[];
  }

  type RoomScopedOtherFee = OtherFeeDto & {
    roomId?: string | number;
  };

  const props = defineProps<FormProps>();

  // 表单引用
  const ruleFormRef = ref<FormInstance>();

  const roomSelection = ref<RoomSelectionItem[]>([]);
  const roomConfigs = ref<RoomConfigItem[]>([]);
  const sharedOtherFees = ref<RoomScopedOtherFee[]>([]);
  const roomFeeDialogVisible = ref(false);
  const editingRoomId = ref<string>("");
  const roomFeeDraft = ref<RoomScopedOtherFee[]>([]);

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

  watch(
    roomConfigs,
    () => {
      syncRoomSelectionPrices();
      calculateTotalRent();
      syncRoomRentListToForm();
      syncOtherFeesToForm();
    },
    { deep: true }
  );

  watch(
    sharedOtherFees,
    () => {
      syncOtherFeesToForm();
    },
    { deep: true }
  );

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

    roomSelection.value.splice(index, 1);
    buildRoomConfigs();
  };

  const activeRoomConfig = computed(() => roomConfigs.value.find(item => item.roomId === editingRoomId.value) || null);

  const cloneFeeItem = (fee?: RoomScopedOtherFee | null): RoomScopedOtherFee => ({
    roomId: fee?.roomId ?? undefined,
    dictDataId: fee?.dictDataId ?? undefined,
    name: fee?.name ?? "",
    paymentMethod: fee?.paymentMethod ?? 0,
    priceMethod: fee?.priceMethod ?? 1,
    priceInput: fee?.priceInput ?? undefined
  });

  const cloneFeeList = (list?: RoomScopedOtherFee[] | null) => (list || []).map(item => cloneFeeItem(item));

  const normalizeMoney = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const buildRoomConfigs = () => {
    const feeBucket = new Map<string, RoomScopedOtherFee[]>();
    const sharedFees: RoomScopedOtherFee[] = [];

    ((formInline.otherFees as RoomScopedOtherFee[]) || []).forEach(fee => {
      if (!fee.roomId) {
        sharedFees.push(cloneFeeItem(fee));
        return;
      }
      const roomId = String(fee.roomId);
      const list = feeBucket.get(roomId) || [];
      list.push(cloneFeeItem(fee));
      feeBucket.set(roomId, list);
    });

    const previousConfigMap = new Map(roomConfigs.value.map(item => [item.roomId, item]));
    const roomRentMap = new Map((formInline.lease.roomRentList || []).map(item => [String(item.roomId || ""), normalizeMoney(item.rentPrice)]));
    roomConfigs.value = roomSelection.value.map(room => {
      const roomId = String(room.value);
      const previous = previousConfigMap.get(roomId);
      return {
        roomId,
        roomLabel: room.label,
        rentPrice: normalizeMoney(previous?.rentPrice ?? roomRentMap.get(roomId) ?? room.extra?.price),
        feeList: cloneFeeList(feeBucket.get(roomId) || previous?.feeList || [])
      };
    });
    sharedOtherFees.value = sharedFees;
  };

  const syncRoomSelectionPrices = () => {
    roomSelection.value.forEach(item => {
      const matched = roomConfigs.value.find(config => config.roomId === String(item.value));
      if (!matched) return;
      item.extra = {
        ...(item.extra || {}),
        price: matched.rentPrice
      };
    });
  };

  const syncOtherFeesToForm = () => {
    const roomFeeList = roomConfigs.value.flatMap(config =>
      config.feeList
        .filter(fee => fee.dictDataId || fee.name)
        .map(fee => ({
          ...cloneFeeItem(fee),
          roomId: config.roomId
        }))
    );
    formInline.otherFees = [...cloneFeeList(sharedOtherFees.value).filter(fee => fee.dictDataId || fee.name), ...roomFeeList] as OtherFeeDto[];
  };

  const syncRoomRentListToForm = () => {
    formInline.lease.roomRentList = roomConfigs.value.map(item => ({
      roomId: item.roomId,
      rentPrice: item.rentPrice
    }));
  };

  const calculateRoomFeeTotal = (config: RoomConfigItem) =>
    config.feeList.reduce((sum, fee) => {
      const feeValue = normalizeMoney(fee.priceInput);
      if (fee.priceMethod === 2) {
        return sum + (config.rentPrice * feeValue) / 100;
      }
      return sum + feeValue;
    }, 0);

  const calculateTotalRent = () => {
    formInline.lease.rentPrice = roomConfigs.value.reduce((sum, item) => sum + normalizeMoney(item.rentPrice), 0);
  };

  const handleRoomRentChange = (roomId: string, value: number | string) => {
    const target = roomConfigs.value.find(item => item.roomId === roomId);
    if (!target) return;
    target.rentPrice = normalizeMoney(value);
  };

  const openRoomFeeDialog = (config: RoomConfigItem) => {
    editingRoomId.value = config.roomId;
    roomFeeDraft.value = cloneFeeList(config.feeList);
    roomFeeDialogVisible.value = true;
  };

  const handleRoomFeeDialogSave = () => {
    const target = roomConfigs.value.find(item => item.roomId === editingRoomId.value);
    if (!target) {
      roomFeeDialogVisible.value = false;
      return;
    }
    target.feeList = cloneFeeList(roomFeeDraft.value);
    roomFeeDialogVisible.value = false;
    editingRoomId.value = "";
  };

  const handleRoomFeeDialogClose = () => {
    roomFeeDialogVisible.value = false;
    editingRoomId.value = "";
    roomFeeDraft.value = [];
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
    border-radius: 6px;
    background: var(--el-bg-color);
    overflow: hidden;
  }

  .room-config-panel__head {
    padding: 12px 14px;
    border-bottom: 1px solid var(--el-border-color-light);
    background: var(--el-fill-color-lighter);
  }

  .room-config-panel__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .room-config-panel__desc {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
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

  .room-config-table__room {
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .room-config-table__meta {
    color: var(--el-text-color-regular);
  }

  .room-config-table__amount {
    font-weight: 600;
    color: var(--el-color-primary);
  }

  .room-fee-dialog__summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .room-fee-dialog__item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 6px;
    background: var(--el-fill-color-lighter);
  }

  .room-fee-dialog__label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .room-fee-dialog__value {
    font-weight: 600;
    color: var(--el-text-color-primary);
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
  }
</style>
