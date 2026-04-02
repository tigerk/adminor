<template>
  <div class="main">
    <el-row class="bg-bg_color w-full px-4 pb-3 pt-[12px]">
      <el-col :span="24">
        <el-form :inline="true" :model="queryForm" class="search-form">
          <el-form-item>
            <el-input v-model="queryForm.ownerName" placeholder="业主姓名/企业名称" clearable class="!w-[180px]" @keyup.enter="loadList" @clear="loadList">
              <template #prefix><IconifyIconOffline :icon="User" /></template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="queryForm.ownerPhone" placeholder="联系电话" clearable class="!w-[180px]" @keyup.enter="loadList" @clear="loadList">
              <template #prefix><IconifyIconOffline :icon="Phone" /></template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryForm.ownerType" placeholder="业主类型" clearable class="!w-[140px]" @change="loadList">
              <el-option v-for="item in ownerTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button :icon="useRenderIcon(Search)" type="primary" @click="loadList">搜索</el-button>
            <el-button :icon="useRenderIcon(Refresh)" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>

    <el-row class="bg-bg_color w-full px-4 pb-3">
      <el-col :span="24" class="text-right">
        <el-button type="primary" :icon="useRenderIcon(Plus)" @click="openDialog">添加业主合同</el-button>
      </el-col>
    </el-row>

    <el-row class="bg-bg_color w-full px-4 pb-4">
      <el-col :span="24">
        <el-table v-loading="loading" :data="tableData" border>
          <el-table-column prop="ownerName" label="业主" min-width="180" />
          <el-table-column label="类型" width="100" align="center">
            <template #default="{ row }">{{ ownerTypeLabelMap[row.ownerType || "PERSONAL"] }}</template>
          </el-table-column>
          <el-table-column prop="ownerPhone" label="联系电话" min-width="140" />
          <el-table-column prop="contractNo" label="合同编号" min-width="180" />
          <el-table-column label="合作模式" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="row.cooperationMode === 'MASTER_LEASE' ? 'warning' : 'success'">
                {{ cooperationModeLabelMap[row.cooperationMode || "LIGHT_MANAGED"] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="contractTemplateName" label="模板" min-width="140" />
          <el-table-column prop="houseNames" label="签约房源" min-width="260" show-overflow-tooltip />
          <el-table-column label="合同周期" min-width="220">
            <template #default="{ row }">{{ row.contractStart || "-" }} 至 {{ row.contractEnd || "-" }}</template>
          </el-table-column>
          <el-table-column label="签署状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.signStatus === 'SIGNED' ? 'success' : 'info'">{{ signStatusLabelMap[row.signStatus || "PENDING"] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">{{ statusLabelMap[row.status || "ACTIVE"] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row.contractId)">详情</el-button>
              <el-button link type="primary" @click="openEdit(row.contractId)">编辑</el-button>
              <el-button link :type="row.status === 'ACTIVE' ? 'warning' : 'success'" @click="handleToggleStatus(row)">
                {{ row.status === "ACTIVE" ? "停用" : "启用" }}
              </el-button>
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="mt-4 flex justify-end">
          <el-pagination
            v-model:current-page="queryForm.currentPage"
            v-model:page-size="queryForm.pageSize"
            :page-sizes="[10, 20, 30, 50]"
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @current-change="loadList"
            @size-change="loadList"
          />
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="1100px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" :disabled="isViewMode" label-width="110px">
        <div class="section-title">业主信息</div>
        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="业主类型" prop="ownerType">
              <el-segmented v-model="form.ownerType" :options="ownerTypeOptions" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="合作模式" prop="ownerContract.cooperationMode">
              <el-segmented v-model="form.ownerContract.cooperationMode" :options="cooperationModeOptions" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row v-if="form.ownerType === 'PERSONAL'" :gutter="16">
          <el-col :span="8"><el-form-item label="姓名" prop="ownerPersonal.name"><el-input v-model="form.ownerPersonal.name" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="联系电话" prop="ownerPersonal.phone"><el-input v-model="form.ownerPersonal.phone" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="证件号码" prop="ownerPersonal.idNo"><el-input v-model="form.ownerPersonal.idNo" /></el-form-item></el-col>
        </el-row>
        <el-row v-else :gutter="16">
          <el-col :span="8"><el-form-item label="企业名称" prop="ownerCompany.name"><el-input v-model="form.ownerCompany.name" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="联系电话" prop="ownerCompany.contactPhone"><el-input v-model="form.ownerCompany.contactPhone" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="统一信用代码" prop="ownerCompany.uscc"><el-input v-model="form.ownerCompany.uscc" /></el-form-item></el-col>
        </el-row>

        <div class="section-title">合同信息</div>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="合同模板" prop="ownerContract.contractTemplateId">
              <el-select v-model="form.ownerContract.contractTemplateId" class="w-full" placeholder="请选择业主合同模板">
                <el-option v-for="item in contractTemplates" :key="item.id" :label="item.templateName" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="合同周期" prop="contractDateRange">
              <el-date-picker v-model="contractDateRange" type="daterange" value-format="YYYY-MM-DD" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="签署状态" prop="ownerContract.signStatus">
              <el-select v-model="form.ownerContract.signStatus" class="w-full">
                <el-option v-for="item in signStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <div v-if="isViewMode" class="meta-panel">
          <div class="meta-panel__header">
            <span class="meta-panel__title">合同操作</span>
            <div class="meta-panel__actions">
              <el-button type="primary" plain @click="goOwnerBills">查看业主账单</el-button>
              <el-button type="warning" plain @click="goOwnerWithdraws">查看提现入口</el-button>
            </div>
          </div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="创建人">{{ form.ownerContract.createBy || detailMeta.createBy || "-" }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ form.ownerContract.createTime || detailMeta.createTime || "-" }}</el-descriptions-item>
            <el-descriptions-item label="更新人">{{ form.ownerContract.updateBy || detailMeta.updateBy || "-" }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ form.ownerContract.updateTime || detailMeta.updateTime || "-" }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <el-form-item label="签约房源" prop="contractHouseList">
          <div class="w-full">
            <el-button v-if="!isViewMode" type="primary" link @click="roomPickerRef?.show(selectedRooms)">选择房源</el-button>
            <div v-if="selectedHouses.length" class="selected-box">
              <el-tag
                v-for="item in selectedHouses"
                :key="item.houseId"
                class="m-1"
                :closable="!isViewMode"
                @close="removeHouse(item.houseId)"
              >
                {{ item.houseName }}
              </el-tag>
            </div>
            <div v-else class="text-gray-400">请选择一个或多个房源</div>
          </div>
        </el-form-item>

        <div v-if="form.ownerContract.cooperationMode === 'LIGHT_MANAGED'">
          <div class="section-title">轻托管房源条款</div>
          <el-collapse>
            <el-collapse-item v-for="(item, index) in form.contractHouseList" :key="item.houseId" :title="item.houseName || `房源${index + 1}`" :name="item.houseId">
              <el-row :gutter="16">
                <el-col :span="6">
                  <el-form-item label="结算模式">
                    <el-select v-model="item.settlementRule.settlementMode" class="w-full">
                      <el-option v-for="option in settlementModeOptions" :key="option.value" :label="option.label" :value="option.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="收入口径">
                    <el-select v-model="item.settlementRule.incomeBasis" class="w-full">
                      <el-option v-for="option in incomeBasisOptions" :key="option.value" :label="option.label" :value="option.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="保底租金">
                    <el-input-number v-model="item.settlementRule.guaranteedRentAmount" :min="0" :precision="2" class="w-full" />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="佣金值">
                    <el-input-number v-model="item.settlementRule.commissionValue" :min="0" :precision="2" class="w-full" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="16">
                <el-col :span="6">
                  <el-form-item label="佣金方式">
                    <el-select v-model="item.settlementRule.commissionMode" class="w-full">
                      <el-option v-for="option in feeModeOptions" :key="option.value" :label="option.label" :value="option.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="服务费方式">
                    <el-select v-model="item.settlementRule.serviceFeeMode" class="w-full">
                      <el-option v-for="option in feeModeOptions" :key="option.value" :label="option.label" :value="option.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="服务费值">
                    <el-input-number v-model="item.settlementRule.serviceFeeValue" :min="0" :precision="2" class="w-full" />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="免租承担">
                    <el-select v-model="item.rentFreeRule.bearType" class="w-full">
                      <el-option v-for="option in bearTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="16">
                <el-col :span="6">
                  <el-form-item label="免租类型">
                    <el-select v-model="item.rentFreeRule.freeType" class="w-full">
                      <el-option v-for="option in freeTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="开始日期">
                    <el-date-picker v-model="item.rentFreeRule.startDate" type="date" value-format="YYYY-MM-DD" class="w-full" />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="结束日期">
                    <el-date-picker v-model="item.rentFreeRule.endDate" type="date" value-format="YYYY-MM-DD" class="w-full" />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="计算方式">
                    <el-select v-model="item.rentFreeRule.calcMode" class="w-full">
                      <el-option v-for="option in lightManagedCalcModeOptions" :key="option.value" :label="option.label" :value="option.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-collapse-item>
          </el-collapse>
        </div>

        <div v-else>
          <div class="section-title">包租条款</div>
          <el-row :gutter="16">
            <el-col :span="6"><el-form-item label="总月租金"><el-input-number v-model="form.ownerLeaseRule.rentAmount" :min="0" :precision="2" class="w-full" /></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="总押金"><el-input-number v-model="form.ownerLeaseRule.depositAmount" :min="0" :precision="2" class="w-full" /></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="押金月数"><el-input-number v-model="form.ownerLeaseRule.depositMonths" :min="0" class="w-full" /></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="付款月数"><el-input-number v-model="form.ownerLeaseRule.paymentMonths" :min="1" class="w-full" /></el-form-item></el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="6"><el-form-item label="付款方式"><el-input v-model="form.ownerLeaseRule.payWay" placeholder="如 押一付三" /></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="收租类型"><el-select v-model="form.ownerLeaseRule.rentDueType" class="w-full"><el-option v-for="item in rentDueTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="收租日"><el-input-number v-model="form.ownerLeaseRule.rentDueDay" :min="1" :max="31" class="w-full" /></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="首付日期"><el-date-picker v-model="form.ownerLeaseRule.firstPayDate" type="date" value-format="YYYY-MM-DD" class="w-full" /></el-form-item></el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="6"><el-form-item label="折算方式"><el-select v-model="form.ownerLeaseRule.prorateType" class="w-full"><el-option v-for="item in prorateTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          </el-row>

          <div class="sub-title flex items-center justify-between">
            <span>包租免租规则</span>
            <el-button v-if="!isViewMode" type="primary" link @click="addLeaseFreeRule">新增规则</el-button>
          </div>
          <el-table :data="form.ownerLeaseFreeRuleList" border>
            <el-table-column label="类型" width="120">
              <template #default="{ row }"><el-select v-model="row.freeType"><el-option v-for="item in freeTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></template>
            </el-table-column>
            <el-table-column label="开始日期" width="160">
              <template #default="{ row }"><el-date-picker v-model="row.startDate" type="date" value-format="YYYY-MM-DD" /></template>
            </el-table-column>
            <el-table-column label="结束日期" width="160">
              <template #default="{ row }"><el-date-picker v-model="row.endDate" type="date" value-format="YYYY-MM-DD" /></template>
            </el-table-column>
            <el-table-column label="计算方式" width="140">
              <template #default="{ row }"><el-select v-model="row.calcMode"><el-option v-for="item in leaseFreeCalcModeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></template>
            </el-table-column>
            <el-table-column label="金额" width="120">
              <template #default="{ row }"><el-input-number v-model="row.freeAmount" :min="0" :precision="2" /></template>
            </el-table-column>
            <el-table-column label="比例" width="120">
              <template #default="{ row }"><el-input-number v-model="row.freeRatio" :min="0" :max="1" :step="0.1" :precision="2" /></template>
            </el-table-column>
            <el-table-column label="操作" width="90">
              <template #default="{ $index }">
                <el-button v-if="!isViewMode" link type="danger" @click="form.ownerLeaseFreeRuleList.splice($index, 1)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form>

      <RoomPicker ref="roomPickerRef" @confirm="handleRoomConfirm" />
      <template #footer>
        <el-button @click="dialogVisible = false">{{ isViewMode ? "关闭" : "取消" }}</el-button>
        <el-button v-if="!isViewMode" type="primary" :loading="submitLoading" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, nextTick, onMounted, reactive, ref } from "vue";
  import { ElMessageBox } from "element-plus";
  import type { FormInstance, FormRules } from "element-plus";
  import { useRouter } from "vue-router";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import { message } from "@/utils/message";
  import { getMyAvailableContractTemplates } from "@/api/contract/template";
  import {
    createOwnerContract,
    deleteOwnerContract,
    getOwnerContractDetail,
    getOwnerContractList,
    updateOwnerContract,
    updateOwnerContractStatus
  } from "@/api/contract/owner";
  import RoomPicker from "@/components/Business/RoomPicker.vue";
  import Search from "~icons/ri/search-line";
  import Refresh from "~icons/ep/refresh";
  import Plus from "~icons/ep/plus";
  import User from "~icons/ep/user";
  import Phone from "~icons/ep/phone";
  import type {
    ContractTemplateListVo,
    OwnerBearTypeEnum,
    OwnerCompanyDto,
    OwnerContractDto,
    OwnerContractIdDto,
    OwnerContractStatusDto,
    OwnerContractHouseDto,
    OwnerCooperationModeEnum,
    OwnerCreateDto,
    OwnerDetailVo,
    OwnerFeeModeEnum,
    OwnerFreeCalcModeEnum,
    OwnerFreeTypeEnum,
    OwnerIncomeBasisEnum,
    OwnerLeaseFreeRuleDto,
    OwnerLeaseRuleDto,
    OwnerListVo,
    OwnerPersonalDto,
    OwnerProrateTypeEnum,
    OwnerQueryDto,
    OwnerRentFreeRuleDto,
    OwnerSettlementModeEnum,
    OwnerSettlementRuleDto,
    OwnerSignStatusEnum,
    OwnerTypeEnum,
    OwnerUpdateDto
  } from "@/types/generated";
  import {
    OwnerBearTypeEnumMeta,
    OwnerCooperationModeEnumMeta,
    OwnerFeeModeEnumMeta,
    OwnerFreeCalcModeEnumMeta,
    OwnerFreeTypeEnumMeta,
    OwnerIncomeBasisEnumMeta,
    OwnerProrateTypeEnumMeta,
    OwnerSettlementModeEnumMeta,
    OwnerSignStatusEnumMeta,
    OwnerTypeEnumMeta
  } from "@/types/generated/enum.meta";

  defineOptions({ name: "ContractOwner" });

  type QueryForm = Omit<OwnerQueryDto, "currentPage" | "pageSize"> & {
    currentPage: number;
    pageSize: number;
  };

  type PickedRoom = {
    houseId?: string | number;
    houseName?: string;
  };

  type ContractHouseFormItem = OwnerContractHouseDto & {
    houseId: string;
    houseName: string;
    settlementRule: OwnerSettlementRuleDto;
    rentFreeRule: OwnerRentFreeRuleDto;
  };

  type OwnerContractForm = {
    ownerType: OwnerTypeEnum;
    ownerPersonal: OwnerPersonalDto;
    ownerCompany: OwnerCompanyDto;
    ownerContract: OwnerContractDto;
    contractHouseList: ContractHouseFormItem[];
    ownerLeaseRule: OwnerLeaseRuleDto;
    ownerLeaseFreeRuleList: OwnerLeaseFreeRuleDto[];
  };

  type DialogMode = "create" | "edit" | "view";
  type ContractStatus = "ACTIVE" | "DISABLED";

  const loading = ref(false);
  const submitLoading = ref(false);
  const dialogVisible = ref(false);
  const dialogMode = ref<DialogMode>("create");
  const total = ref(0);
  const tableData = ref<OwnerListVo[]>([]);
  const formRef = ref<FormInstance>();
  const roomPickerRef = ref<InstanceType<typeof RoomPicker>>();
  const contractTemplates = ref<ContractTemplateListVo[]>([]);
  const contractDateRange = ref<string[]>([]);
  const selectedRooms = ref<PickedRoom[]>([]);
  const router = useRouter();
  const detailMeta = reactive({
    createBy: "",
    createTime: "",
    updateBy: "",
    updateTime: ""
  });

  const ownerTypeLabelMap: Record<OwnerTypeEnum, string> = {
    PERSONAL: "个人",
    COMPANY: "企业"
  };
  const cooperationModeLabelMap: Record<OwnerCooperationModeEnum, string> = {
    LIGHT_MANAGED: "轻托管",
    MASTER_LEASE: "包租"
  };
  const signStatusLabelMap: Record<OwnerSignStatusEnum, string> = {
    PENDING: "待签字",
    SIGNED: "已签字"
  };
  const statusLabelMap: Record<ContractStatus, string> = {
    ACTIVE: "启用",
    DISABLED: "停用"
  };
  const settlementModeLabelMap: Record<OwnerSettlementModeEnum, string> = {
    FIXED: "固定保底",
    SHARE_GROSS: "毛收分成",
    SHARE_NET: "净收分成",
    GUARANTEE_PLUS_SHARE: "保底加分成",
    AGENCY: "代收代付"
  };
  const incomeBasisLabelMap: Record<OwnerIncomeBasisEnum, string> = {
    RECEIVED: "按实收",
    RECEIVABLE: "按应收"
  };
  const feeModeLabelMap: Record<OwnerFeeModeEnum, string> = {
    RATIO: "按比例",
    FIXED: "固定金额"
  };
  const bearTypeLabelMap: Record<OwnerBearTypeEnum, string> = {
    PLATFORM: "平台承担",
    OWNER: "业主承担",
    SHARED: "共同承担"
  };
  const freeTypeLabelMap: Record<OwnerFreeTypeEnum, string> = {
    BUILT_IN: "内置免租",
    OUTSIDE: "外置免租"
  };
  const freeCalcModeLabelMap: Record<OwnerFreeCalcModeEnum, string> = {
    BY_DAYS: "按天分摊",
    FIXED: "固定金额",
    RATIO: "按比例"
  };
  const prorateTypeLabelMap: Record<OwnerProrateTypeEnum, string> = {
    BY_DAYS: "按天折算",
    FULL_PERIOD: "整期计费"
  };
  const rentDueTypeLabelMap = {
    EARLY: "提前",
    FIXED: "固定",
    LATE: "延后"
  } as const;

  const ownerTypeOptions = [
    { label: ownerTypeLabelMap.PERSONAL, value: OwnerTypeEnumMeta.PERSONAL.value as OwnerTypeEnum },
    { label: ownerTypeLabelMap.COMPANY, value: OwnerTypeEnumMeta.COMPANY.value as OwnerTypeEnum }
  ];
  const cooperationModeOptions = [
    { label: cooperationModeLabelMap.LIGHT_MANAGED, value: OwnerCooperationModeEnumMeta.LIGHT_MANAGED.value as OwnerCooperationModeEnum },
    { label: cooperationModeLabelMap.MASTER_LEASE, value: OwnerCooperationModeEnumMeta.MASTER_LEASE.value as OwnerCooperationModeEnum }
  ];
  const signStatusOptions = [
    { label: signStatusLabelMap.PENDING, value: OwnerSignStatusEnumMeta.PENDING.value as OwnerSignStatusEnum },
    { label: signStatusLabelMap.SIGNED, value: OwnerSignStatusEnumMeta.SIGNED.value as OwnerSignStatusEnum }
  ];
  const settlementModeOptions = Object.values(OwnerSettlementModeEnumMeta).map(item => ({
    label: settlementModeLabelMap[item.value as OwnerSettlementModeEnum],
    value: item.value as OwnerSettlementModeEnum
  }));
  const incomeBasisOptions = Object.values(OwnerIncomeBasisEnumMeta).map(item => ({
    label: incomeBasisLabelMap[item.value as OwnerIncomeBasisEnum],
    value: item.value as OwnerIncomeBasisEnum
  }));
  const feeModeOptions = Object.values(OwnerFeeModeEnumMeta).map(item => ({
    label: feeModeLabelMap[item.value as OwnerFeeModeEnum],
    value: item.value as OwnerFeeModeEnum
  }));
  const bearTypeOptions = Object.values(OwnerBearTypeEnumMeta).map(item => ({
    label: bearTypeLabelMap[item.value as OwnerBearTypeEnum],
    value: item.value as OwnerBearTypeEnum
  }));
  const freeTypeOptions = Object.values(OwnerFreeTypeEnumMeta).map(item => ({
    label: freeTypeLabelMap[item.value as OwnerFreeTypeEnum],
    value: item.value as OwnerFreeTypeEnum
  }));
  const lightManagedCalcModeOptions = Object.values(OwnerFreeCalcModeEnumMeta)
    .filter(item => item.value !== "RATIO")
    .map(item => ({
      label: freeCalcModeLabelMap[item.value as OwnerFreeCalcModeEnum],
      value: item.value as OwnerFreeCalcModeEnum
    }));
  const leaseFreeCalcModeOptions = Object.values(OwnerFreeCalcModeEnumMeta)
    .filter(item => item.value !== "BY_DAYS")
    .map(item => ({
      label: freeCalcModeLabelMap[item.value as OwnerFreeCalcModeEnum],
      value: item.value as OwnerFreeCalcModeEnum
    }));
  const prorateTypeOptions = Object.values(OwnerProrateTypeEnumMeta).map(item => ({
    label: prorateTypeLabelMap[item.value as OwnerProrateTypeEnum],
    value: item.value as OwnerProrateTypeEnum
  }));
  const rentDueTypeOptions = [
    { label: rentDueTypeLabelMap.EARLY, value: "EARLY" as const },
    { label: rentDueTypeLabelMap.FIXED, value: "FIXED" as const },
    { label: rentDueTypeLabelMap.LATE, value: "LATE" as const }
  ];

  const queryForm = reactive<QueryForm>({
    currentPage: 1,
    pageSize: 10,
    ownerName: "",
    ownerPhone: "",
    ownerType: undefined
  });

  const createDefaultSettlementRule = (): OwnerSettlementRuleDto => ({
    incomeBasis: "RECEIVED",
    settlementMode: "FIXED",
    guaranteedRentAmount: 0,
    commissionMode: "RATIO",
    commissionValue: 0,
    serviceFeeMode: "FIXED",
    serviceFeeValue: 0,
    bearTaxType: "PLATFORM",
    status: "ACTIVE"
  });

  const createDefaultRentFreeRule = (): OwnerRentFreeRuleDto => ({
    freeType: "BUILT_IN",
    bearType: "PLATFORM",
    ownerRatio: 0,
    platformRatio: 1,
    calcMode: "BY_DAYS",
    status: "ACTIVE"
  });

  const createDefaultLeaseFreeRule = (): OwnerLeaseFreeRuleDto => ({
    freeType: "BUILT_IN",
    calcMode: "FIXED",
    freeAmount: 0,
    freeRatio: 0,
    status: "ACTIVE"
  });

  const createHouseRule = (houseId: string, houseName: string): ContractHouseFormItem => ({
    houseId,
    houseName,
    remark: "",
    settlementRule: createDefaultSettlementRule(),
    rentFreeRule: createDefaultRentFreeRule()
  });

  const createDefaultForm = (): OwnerContractForm => ({
    ownerType: "PERSONAL",
    ownerPersonal: {
      name: "",
      phone: "",
      idType: "ID_CARD",
      idNo: "",
      gender: "MALE",
      tags: [],
      status: "ACTIVE"
    },
    ownerCompany: {
      name: "",
      contactPhone: "",
      uscc: "",
      contactName: "",
      legalPerson: "",
      legalPersonIdType: "ID_CARD",
      legalPersonIdNo: "",
      registeredAddress: "",
      tags: [],
      status: "ACTIVE"
    },
    ownerContract: {
      cooperationMode: "LIGHT_MANAGED",
      contractTemplateId: undefined,
      signStatus: "PENDING",
      status: "ACTIVE",
      approvalStatus: "APPROVED",
      contractStart: "",
      contractEnd: "",
      remark: ""
    },
    contractHouseList: [],
    ownerLeaseRule: {
      rentAmount: 0,
      depositAmount: 0,
      depositMonths: 1,
      paymentMonths: 1,
      payWay: "",
      rentDueType: "FIXED",
      rentDueDay: 5,
      rentDueOffsetDays: 0,
      firstPayDate: "",
      billingStart: "",
      billingEnd: "",
      prorateType: "BY_DAYS",
      status: "ACTIVE"
    },
    ownerLeaseFreeRuleList: []
  });

  const form = reactive<OwnerContractForm>(createDefaultForm());

  const selectedHouses = computed(() => form.contractHouseList);
  const isViewMode = computed(() => dialogMode.value === "view");
  const dialogTitle = computed(() => {
    if (dialogMode.value === "edit") return "编辑业主合同";
    if (dialogMode.value === "view") return "业主合同详情";
    return "添加业主合同";
  });

  const rules: FormRules = {
    ownerType: [{ required: true, message: "请选择业主类型", trigger: "change" }],
    "ownerContract.cooperationMode": [{ required: true, message: "请选择合作模式", trigger: "change" }],
    "ownerPersonal.name": [{ required: true, message: "请输入业主姓名", trigger: "blur" }],
    "ownerPersonal.phone": [{ required: true, message: "请输入联系电话", trigger: "blur" }],
    "ownerCompany.name": [{ required: true, message: "请输入企业名称", trigger: "blur" }],
    "ownerCompany.contactPhone": [{ required: true, message: "请输入联系电话", trigger: "blur" }],
    "ownerContract.contractTemplateId": [{ required: true, message: "请选择合同模板", trigger: "change" }],
    contractHouseList: [{ required: true, validator: (_, value, callback) => (value?.length ? callback() : callback(new Error("请选择房源"))), trigger: "change" }]
  };

  async function loadTemplates() {
    const resp = await getMyAvailableContractTemplates({ contractType: 2 });
    contractTemplates.value = (resp.data || []) as ContractTemplateListVo[];
  }

  async function loadList() {
    loading.value = true;
    try {
      const resp = await getOwnerContractList({
        ...queryForm,
        currentPage: String(queryForm.currentPage),
        pageSize: String(queryForm.pageSize)
      });
      tableData.value = resp.data?.list || [];
      total.value = Number(resp.data?.total || 0);
    } finally {
      loading.value = false;
    }
  }

  function resetQuery() {
    queryForm.currentPage = 1;
    queryForm.pageSize = 10;
    queryForm.ownerName = "";
    queryForm.ownerPhone = "";
    queryForm.ownerType = undefined;
    loadList();
  }

  function resetForm() {
    Object.assign(form, createDefaultForm());
    contractDateRange.value = [];
    selectedRooms.value = [];
    detailMeta.createBy = "";
    detailMeta.createTime = "";
    detailMeta.updateBy = "";
    detailMeta.updateTime = "";
  }

  async function openDialog() {
    resetForm();
    dialogMode.value = "create";
    dialogVisible.value = true;
    await nextTick();
    formRef.value?.clearValidate();
    await loadTemplates();
  }

  function mapDetailToForm(detail?: OwnerDetailVo) {
    resetForm();
    if (!detail) return;
    form.ownerType = detail.ownerType || "PERSONAL";
    form.ownerPersonal = {
      ...createDefaultForm().ownerPersonal,
      ...(detail.ownerPersonal || {})
    };
    form.ownerCompany = {
      ...createDefaultForm().ownerCompany,
      ...(detail.ownerCompany || {})
    };
    form.ownerContract = {
      ...createDefaultForm().ownerContract,
      ...(detail.ownerContract || {})
    };
    contractDateRange.value = [detail.ownerContract?.contractStart || "", detail.ownerContract?.contractEnd || ""].filter(Boolean);
    form.contractHouseList = (detail.contractHouseList || []).map(item => ({
      ...item,
      id: item.id,
      houseId: String(item.houseId || ""),
      houseName: item.houseName || "",
      remark: item.remark || "",
      settlementRule: {
        ...createDefaultSettlementRule(),
        ...(item.settlementRule || {})
      },
      rentFreeRule: {
        ...createDefaultRentFreeRule(),
        ...(item.rentFreeRule || {})
      }
    }));
    selectedRooms.value = form.contractHouseList.map(item => ({
      houseId: item.houseId,
      houseName: item.houseName
    }));
    form.ownerLeaseRule = {
      ...createDefaultForm().ownerLeaseRule,
      ...(detail.ownerLeaseRule || {})
    };
    form.ownerLeaseFreeRuleList = (detail.ownerLeaseFreeRuleList || []).map(item => ({
      ...createDefaultLeaseFreeRule(),
      ...item
    }));
    detailMeta.createBy = detail.createBy || "";
    detailMeta.createTime = detail.createTime || "";
    detailMeta.updateBy = detail.updateBy || "";
    detailMeta.updateTime = detail.updateTime || "";
  }

  async function openContractDialog(contractId: string | undefined, mode: DialogMode) {
    if (!contractId) return;
    resetForm();
    dialogMode.value = mode;
    dialogVisible.value = true;
    await nextTick();
    formRef.value?.clearValidate();
    await loadTemplates();
    const resp = await getOwnerContractDetail({ contractId } as OwnerContractIdDto);
    if (resp.code !== 0) {
      message(resp.message || "获取业主合同详情失败", { type: "error" });
      dialogVisible.value = false;
      return;
    }
    mapDetailToForm(resp.data);
  }

  function openDetail(contractId: string | undefined) {
    return openContractDialog(contractId, "view");
  }

  function openEdit(contractId: string | undefined) {
    return openContractDialog(contractId, "edit");
  }

  async function handleToggleStatus(row: OwnerListVo) {
    if (!row.contractId) return;
    const nextStatus: ContractStatus = row.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const nextLabel = statusLabelMap[nextStatus];
    await ElMessageBox.confirm(`确认将合同状态调整为“${nextLabel}”吗？`, "更新状态", {
      type: "warning"
    });
    const resp = await updateOwnerContractStatus({
      contractId: row.contractId,
      status: nextStatus
    } as OwnerContractStatusDto);
    if (resp.code === 0) {
      message(`业主合同已${nextLabel}`, { type: "success" });
      loadList();
      return;
    }
    message(resp.message || "更新合同状态失败", { type: "error" });
  }

  async function handleDelete(row: OwnerListVo) {
    if (!row.contractId) return;
    await ElMessageBox.confirm("删除后合同将不再出现在列表中，确认继续吗？", "删除业主合同", {
      type: "warning",
      confirmButtonText: "删除",
      confirmButtonClass: "el-button--danger"
    });
    const resp = await deleteOwnerContract({ contractId: row.contractId } as OwnerContractIdDto);
    if (resp.code === 0) {
      message("业主合同已删除", { type: "success" });
      loadList();
      return;
    }
    message(resp.message || "删除业主合同失败", { type: "error" });
  }

  function goOwnerBills() {
    router.push({
      path: "/finance/owner-bill",
      query: {
        ownerId: String(form.ownerContract.ownerId || ""),
        contractId: String(form.ownerContract.id || "")
      }
    });
  }

  function goOwnerWithdraws() {
    router.push({
      path: "/finance/owner-withdraw",
      query: {
        ownerId: String(form.ownerContract.ownerId || ""),
        contractId: String(form.ownerContract.id || "")
      }
    });
  }

  function handleRoomConfirm(rows: PickedRoom[]) {
    selectedRooms.value = rows || [];
    const houseMap = new Map<string, ContractHouseFormItem>();
    for (const row of rows || []) {
      const houseId = String(row.houseId || "");
      if (!houseId) continue;
      if (!houseMap.has(houseId)) {
        const existing = form.contractHouseList.find(item => item.houseId === houseId);
        houseMap.set(houseId, existing || createHouseRule(houseId, row.houseName || ""));
      }
    }
    form.contractHouseList = Array.from(houseMap.values());
  }

  function removeHouse(houseId: string) {
    form.contractHouseList = form.contractHouseList.filter(item => item.houseId !== houseId);
    selectedRooms.value = selectedRooms.value.filter(item => String(item.houseId || "") !== houseId);
  }

  function addLeaseFreeRule() {
    form.ownerLeaseFreeRuleList.push(createDefaultLeaseFreeRule());
  }

  function buildBasePayload(): OwnerCreateDto {
    const ownerContract: OwnerContractDto = {
      ...form.ownerContract,
      contractStart: contractDateRange.value[0],
      contractEnd: contractDateRange.value[1]
    };

    const payload: OwnerCreateDto = {
      ownerType: form.ownerType,
      ownerContract,
      contractHouseList: form.contractHouseList.map(item => ({
        id: item.id,
        houseId: item.houseId,
        houseName: item.houseName,
        remark: item.remark,
        settlementRule: form.ownerContract.cooperationMode === "LIGHT_MANAGED" ? item.settlementRule : undefined,
        rentFreeRule: form.ownerContract.cooperationMode === "LIGHT_MANAGED" ? item.rentFreeRule : undefined
      }))
    };

    if (form.ownerType === "PERSONAL") {
      payload.ownerPersonal = form.ownerPersonal;
    } else {
      payload.ownerCompany = form.ownerCompany;
    }

    if (form.ownerContract.cooperationMode === "MASTER_LEASE") {
      payload.ownerLeaseRule = {
        ...form.ownerLeaseRule,
        billingStart: contractDateRange.value[0],
        billingEnd: contractDateRange.value[1]
      };
      payload.ownerLeaseFreeRuleList = form.ownerLeaseFreeRuleList;
    } else {
      payload.ownerLeaseFreeRuleList = [];
    }

    return payload;
  }

  function buildCreatePayload(): OwnerCreateDto {
    return buildBasePayload() as OwnerCreateDto;
  }

  function buildUpdatePayload(): OwnerUpdateDto {
    return buildBasePayload() as OwnerUpdateDto;
  }

  async function handleSubmit() {
    if (!formRef.value) return;
    await formRef.value.validate();
    if (contractDateRange.value.length !== 2) {
      message("请选择合同周期", { type: "warning" });
      return;
    }

    submitLoading.value = true;
    try {
      const resp =
        dialogMode.value === "edit"
          ? await updateOwnerContract(buildUpdatePayload())
          : await createOwnerContract(buildCreatePayload());
      if (resp.code === 0) {
        message(dialogMode.value === "edit" ? "业主合同更新成功" : "业主合同创建成功", { type: "success" });
        dialogVisible.value = false;
        loadList();
      } else {
        message(resp.message || (dialogMode.value === "edit" ? "业主合同更新失败" : "业主合同创建失败"), { type: "error" });
      }
    } finally {
      submitLoading.value = false;
    }
  }

  onMounted(() => {
    loadList();
  });
</script>

<style lang="scss" scoped>
  .search-form {
    :deep(.el-form-item) {
      margin-bottom: 12px;
    }
  }

  .section-title {
    margin: 12px 0 16px;
    font-size: 15px;
    font-weight: 700;
    color: var(--el-color-primary);
  }

  .sub-title {
    margin: 12px 0;
    font-size: 14px;
    font-weight: 600;
  }

  .meta-panel {
    margin: 12px 0 16px;
  }

  .meta-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .meta-panel__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .meta-panel__actions {
    display: flex;
    gap: 12px;
  }

  .selected-box {
    margin-top: 8px;
    padding: 8px 12px;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    background: var(--el-fill-color-light);
  }
</style>
