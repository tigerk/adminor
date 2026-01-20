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
      <!--      <div class="tabs-action-container">-->
      <!--        <el-button type="primary" size="small" :icon="Edit" @click="handleDownloadContract">修改租客</el-button>-->
      <!--      </div>-->
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
                    <el-button type="primary" size="small" :icon="Edit" @click="editTenant(localFormInline)">修改租客</el-button>
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
              <el-tag type="info" size="default">{{ localFormInline.tenantBillList?.length || 0 }}条</el-tag>
            </el-space>
          </template>
          <div class="tab-content">
            <el-table
              v-if="localFormInline.tenantBillList && localFormInline.tenantBillList.length > 0"
              :data="localFormInline.tenantBillList"
              border
              stripe
              class="bill-table"
              :expand-row-keys="expandedBillRows"
              row-key="id"
            >
              <el-table-column type="expand">
                <template #default="{ row }">
                  <div v-if="row.otherFees && row.otherFees.length === 0" class="text-center">没有其他费用</div>
                  <div v-if="row.otherFees && row.otherFees.length > 0" class="expanded-content">
                    <div class="expanded-header m-1">
                      <el-space>
                        <span class="header-title">其他费用明细</span>
                        <el-tag type="info" size="small">共 {{ row.otherFees.length }} 项</el-tag>
                      </el-space>
                    </div>
                    <el-table :data="row.otherFees" border size="small" class="sub-table">
                      <el-table-column type="index" label="序号" width="60" align="center" />
                      <el-table-column prop="name" label="费用名称" align="center" min-width="120" />
                      <el-table-column prop="amount" label="金额" align="center" width="100">
                        <template #default="{ row: fee }">
                          <span class="fee-amount">¥{{ fee.amount }}</span>
                        </template>
                      </el-table-column>
                      <el-table-column prop="remark" label="说明" align="center" min-width="200" show-overflow-tooltip />
                    </el-table>
                  </div>
                </template>
              </el-table-column>
              <el-table-column type="index" label="序号" width="70" align="center" />
              <el-table-column prop="sortOrder" label="期数" align="center" width="80">
                <template #default="{ row }">第{{ row.sortOrder }}期</template>
              </el-table-column>
              <el-table-column prop="dueDate" label="应收日期" align="center" width="110">
                <template #default="{ row }">{{ row.dueDate?.substring(0, 10) }}</template>
              </el-table-column>
              <el-table-column prop="billType" label="账单类型" align="center" width="100">
                <template #default="{ row }">
                  <el-tag v-if="row.billType === 1" type="success">租金</el-tag>
                  <el-tag v-else-if="row.billType === 2" type="warning">押金</el-tag>
                  <el-tag v-else type="info">其他费用</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="rentPeriodStart" label="账期开始" align="center" width="110">
                <template #default="{ row }">{{ row.rentPeriodStart?.substring(0, 10) }}</template>
              </el-table-column>
              <el-table-column prop="rentPeriodEnd" label="账期结束" align="center" width="110">
                <template #default="{ row }">{{ row.rentPeriodEnd?.substring(0, 10) }}</template>
              </el-table-column>
              <el-table-column prop="rentalAmount" label="租金" align="center" width="100">
                <template #default="{ row }">
                  <span v-if="row.rentalAmount > 0" class="amount-text">¥{{ row.rentalAmount }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column prop="depositAmount" label="押金" align="center" width="100">
                <template #default="{ row }">
                  <span v-if="row.depositAmount > 0" class="amount-text">¥{{ row.depositAmount }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column prop="otherFeeAmount" label="其他费用" align="center" width="100">
                <template #default="{ row }">
                  <el-space v-if="row.otherFeeAmount > 0" :size="4">
                    <span class="amount-text">¥{{ row.otherFeeAmount }}</span>
                    <el-tag v-if="row.otherFees && row.otherFees.length > 0" type="info" size="small">{{ row.otherFees.length }}项</el-tag>
                  </el-space>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column prop="totalAmount" label="应收总额" align="center" width="120">
                <template #default="{ row }">
                  <span class="total-amount">¥{{ row.totalAmount }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="payStatus" label="支付状态" align="center" width="100">
                <template #default="{ row }">
                  <el-tag v-if="row.payStatus === 0" type="danger">未支付</el-tag>
                  <el-tag v-else-if="row.payStatus === 1" type="success">已支付</el-tag>
                  <el-tag v-else type="warning">部分支付</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="remark" label="备注" align="center" min-width="250" show-overflow-tooltip />
            </el-table>
            <el-empty v-else description="暂无账单信息" :image-size="180">
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
              <el-tag :type="localFormInline.tenantContract?.signStatus === 0 ? 'danger' : 'success'" size="default">
                {{ TENANT_SIGN_STATUS_OPTIONS.find(item => item.value === localFormInline?.tenantContract?.signStatus)?.label || "未知" }}
              </el-tag>
            </el-space>
          </template>
          <div class="tab-content">
            <!-- 有合同信息时显示 -->
            <div v-if="localFormInline.tenantContract" class="contract-section">
              <!-- 操作按钮栏 -->
              <div class="contract-action-bar">
                <div class="action-left">
                  <el-space :size="12">
                    <el-button type="primary" :icon="Download" @click="handleDownloadContract">下载合同</el-button>
                    <el-button type="primary" :icon="Document" @click="handleGenerateContract">重新生成</el-button>
                    <el-popconfirm title="确认将合同状态改为已签约吗？" @confirm="handleSignContract">
                      <template #reference>
                        <el-button type="primary" :icon="Checked">改为已签约</el-button>
                      </template>
                    </el-popconfirm>
                  </el-space>
                </div>
                <div class="action-right">
                  <el-space :size="16" alignment="flex-end">
                    <div class="info-item">
                      <span class="info-label">合同模板：</span>
                      <span class="info-value">{{ localFormInline.tenantContract.contractTemplateName || "未设置" }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">签约状态：</span>
                      <el-tag :type="localFormInline.tenantContract.signStatus === 0 ? 'danger' : 'success'" size="small">
                        {{ TENANT_SIGN_STATUS_OPTIONS.find(item => item.value === localFormInline.tenantContract.signStatus)?.label || "未知" }}
                      </el-tag>
                    </div>
                    <div class="info-item">
                      <span class="info-label">创建时间：</span>
                      <span class="info-value">{{ localFormInline.createTime }}</span>
                    </div>
                  </el-space>
                </div>
              </div>
              <!-- 合同信息摘要 -->
              <div v-if="localFormInline.tenantContract.remark" class="mb-2">
                <el-descriptions :column="1" size="default">
                  <el-descriptions-item label="合同备注" label-align="right">
                    <span class="text-value">{{ localFormInline.tenantContract.remark }}</span>
                  </el-descriptions-item>
                </el-descriptions>
              </div>

              <!-- 合同内容预览区域 -->
              <div v-if="localFormInline.tenantContract.contractContent" class="contract-content-section">
                <div class="contract-header">
                  <span class="contract-title">合同内容</span>
                  <el-tag type="info" size="small">预览模式</el-tag>
                </div>
                <div class="contract-preview-wrapper">
                  <div class="contract-preview" v-html="localFormInline.tenantContract.contractContent" />
                </div>
              </div>

              <!-- 合同内容为空时 -->
              <div v-else class="no-content">
                <el-empty description="合同内容为空" :image-size="120">
                  <el-button type="primary" :icon="Document" @click="handleGenerateContract">生成合同内容</el-button>
                </el-empty>
              </div>
            </div>

            <!-- 没有合同信息时显示 -->
            <el-empty v-else description="暂无合同信息" :image-size="150">
              <el-button type="primary" :icon="Document">生成合同</el-button>
            </el-empty>
          </div>
        </el-tab-pane>
        <!-- 物业交割单 Tab -->
        <el-tab-pane name="delivery">
          <template #label>
            <el-space>
              <el-icon><Files /></el-icon>
              <span>物业交割单</span>
              <el-tag type="info" size="default">{{ deliveryList.length }}间</el-tag>
            </el-space>
          </template>
          <div class="tab-content">
            <div v-if="deliveryList.length > 0" class="delivery-grid">
              <el-card v-for="delivery in deliveryList" :key="delivery.roomId" class="delivery-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <div class="room-info">
                      <el-icon class="room-icon"><House /></el-icon>
                      <span class="room-name">
                        {{ delivery.roomInfo?.communityName }}
                        {{ delivery.roomInfo?.houseName }}-{{ delivery.roomInfo?.roomNumber }}
                      </span>
                    </div>
                    <el-tag :type="delivery.status === 1 ? 'success' : 'info'" size="small">
                      {{ delivery.status === 1 ? "已完成" : "待填写" }}
                    </el-tag>
                  </div>
                </template>

                <div class="delivery-content">
                  <div v-if="delivery.id" class="delivery-info">
                    <el-descriptions :column="2" size="small">
                      <el-descriptions-item label="交割类型">
                        <el-tag :type="delivery.handoverType === 'check_in' ? 'success' : 'warning'" size="small">
                          {{ delivery.handoverType === "check_in" ? "入住交割" : "退租交割" }}
                        </el-tag>
                      </el-descriptions-item>
                      <el-descriptions-item label="交割日期">
                        {{ delivery.handoverDate }}
                      </el-descriptions-item>
                      <el-descriptions-item label="验收人">
                        {{ delivery.inspectorName }}
                      </el-descriptions-item>
                      <el-descriptions-item label="物品数量">{{ delivery.items?.length || 0 }} 项</el-descriptions-item>
                    </el-descriptions>

                    <div v-if="delivery.remarks" class="delivery-remarks">
                      <el-text type="info" size="small">备注：{{ delivery.remarks }}</el-text>
                    </div>
                  </div>

                  <div v-else class="no-delivery">
                    <el-empty description="暂未创建交割单" :image-size="80" />
                  </div>
                </div>

                <template #footer>
                  <div class="card-footer">
                    <el-button v-if="delivery.id" type="primary" link :icon="View" @click="handleViewDelivery(delivery)">查看详情</el-button>
                    <el-button v-if="delivery.id" type="primary" link :icon="Edit" @click="handleEditDelivery(delivery)">编辑</el-button>
                    <el-button v-if="!delivery.id" type="primary" :icon="Plus" @click="openCreateDeliveryDialog(delivery.roomId)">创建交割单</el-button>
                  </div>
                </template>
              </el-card>
            </div>

            <el-empty v-else description="暂无房间信息" :image-size="150" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { h, onMounted, ref, watch } from "vue";
  import { TenantDetailProps } from "@/types";
  import { getOptionByCode, ID_TYPE_OPTIONS, PAYMENT_METHOD_OPTIONS, PRICE_METHOD_OPTIONS, TENANT_CONTRACT_NATURE_OPTIONS, TENANT_SIGN_STATUS_OPTIONS } from "@/constants";
  import { Checked, Document, Download, Edit, Files, House, Money, Plus, User, View } from "@element-plus/icons-vue";
  import { message } from "@/utils/message";
  import { deleteTenantContract, downloadTenantContract, generateTenantContract, updateTenantContractSignStatus } from "@/api/contract/tenant";
  import { addDialog } from "@/components/ReDialog";
  import { deviceDetection } from "@/store/utils";
  import SelectContractTemplateDialog from "@/views/contract/tenant/view/selectContractTemplateDialog.vue";
  import { useUserStoreHook } from "@/store/modules/user";
  import DeliveryCreateForm from "@/views/contract/tenant/form/deliveryCreateForm.vue";
  import useTenant from "@/views/contract/tenant/utils/hook"; // 检查用户是否有删除合同权限

  const { openTenantDialog } = useTenant();

  // 检查用户是否有删除合同权限
  const { permissions } = useUserStoreHook();
  // const hasContractDeletePermission = computed(() => permissions.includes("tenant:contract:delete"));

  interface FormProps {
    formInline: TenantDetailProps;
  }

  // 账单详情行展开状态
  const expandedBillRows = ref<string[]>([]);

  const props = defineProps<FormProps>();

  // 创建本地响应式副本
  const localFormInline = ref({ ...props.formInline });

  // 监听 props 变化，同步到本地副本
  watch(
    () => props.formInline,
    newVal => {
      localFormInline.value = { ...newVal };
    },
    { deep: true }
  );

  // 定义 emit 事件
  const emit = defineEmits<{
    "contract-signed": [tenantId: bigint]; // 合同签约成功事件
    "contract-updated": []; // 合同更新事件
  }>();

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

  // 下载合同
  const handleDownloadContract = () => {
    if (!props.formInline.tenantContract?.contractContent) {
      message("合同内容为空，无法下载", { type: "warning" });
      return;
    }
    // 调用后端接口下载 PDF 合同。
    downloadTenantContract({
      tenantId: props.formInline.tenantContract.tenantId
    }).then(res => {
      const blob = new Blob([res], { type: "application/pdf" });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `租客合同_${props.formInline.tenantContract.tenantId}.pdf`;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  };

  // 重新生成合同
  const handleGenerateContract = () => {
    const formRef = ref();

    addDialog({
      title: `重新生成合同，请选择合同模板`,
      props: {
        formInline: {
          tenantId: props.formInline.tenantContract.tenantId
        }
      },
      top: "8%",
      width: "400px",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(SelectContractTemplateDialog, { ref: formRef, tenantId: props.formInline.tenantContract.tenantId }),
      beforeSure: (done, { options }) => {
        const selectedTemplate = formRef.value.getSelectedTemplate();

        if (!selectedTemplate) {
          message("请选择合同模板", { type: "warning" });
          return;
        }

        generateTenantContract({
          tenantContractId: localFormInline.value.tenantContract.id,
          tenantId: localFormInline.value.tenantContract.tenantId,
          contractTemplateId: selectedTemplate
        }).then(resp => {
          if (resp.code == 0) {
            console.log(resp.data);
            localFormInline.value.tenantContract = resp.data;
            message("合同生成成功", { type: "success" });
            done();
          }
        });
      }
    });
  };

  const handleSignContract = () => {
    if (localFormInline.value.tenantContract?.signStatus === 1) {
      message("合同已签约，无需重复操作", { type: "warning" });
      return;
    }

    updateTenantContractSignStatus({
      tenantContractId: localFormInline.value.tenantContract.id,
      signStatus: 1
    }).then(resp => {
      if (resp.code == 0) {
        message("合同签约成功", { type: "success" });
        localFormInline.value.tenantContract.signStatus = 1;

        // 通知父组件刷新列表
        emit("contract-signed", localFormInline.value.id);
      } else {
        message(resp.message || "合同签约修改失败", { type: "warning" });
      }
    });
  };

  const handleDeleteContract = () => {
    deleteTenantContract({
      tenantContractId: props.formInline.tenantContract.id
    }).then(resp => {
      if (resp.code == 0) {
        message("合同删除成功", { type: "success" });
        emit("contract-updated");
      }
    });
  };

  // 交割单列表
  const deliveryList = ref([]);
  const deliveryFormRef = ref();

  // 初始化交割单列表
  const initDeliveryList = () => {
    if (!localFormInline.value.roomList) return;

    // 为每个房间创建交割单记录（如果已有交割单则显示，否则显示待创建状态）
    deliveryList.value = localFormInline.value.roomList.map(room => ({
      roomId: room.roomId,
      roomInfo: {
        communityName: room.communityName,
        houseName: room.houseName,
        roomNumber: room.roomNumber
      },
      id: null, // 实际应从后端获取
      status: 0,
      handoverType: null,
      handoverDate: null,
      inspectorName: null,
      items: [],
      remarks: null
    }));

    // 实际项目中应该调用API获取交割单列表
    // getDeliveryList({
    //   subjectType: 'tenant',
    //   subjectTypeId: localFormInline.value.id
    // }).then(resp => {
    //   if (resp.code === 0) {
    //     // 合并交割单数据
    //     deliveryList.value = deliveryList.value.map(item => {
    //       const delivery = resp.data.find(d => d.roomId === item.roomId);
    //       return delivery ? { ...item, ...delivery } : item;
    //     });
    //   }
    // });
  };

  // 创建交割单
  const openCreateDeliveryDialog = (roomId: bigint) => {
    const room = localFormInline.value.roomList.find(r => r.roomId === roomId);

    addDialog({
      title: `创建交割单 - ${room?.houseName}-${room?.roomNumber}`,
      props: {
        formInline: {
          subjectType: "tenant",
          subjectTypeId: localFormInline.value.id,
          roomId: roomId,
          handoverType: "check_in",
          items: [],
          facilities: room?.facilities || [], // 房间设施数据
          imageList: []
        }
      },
      top: "2vh",
      width: "80vw",
      lockScroll: true,
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () =>
        h(DeliveryCreateForm, {
          ref: deliveryFormRef,
          formInline: null
        }),
      beforeSure: (done, { options }) => {
        const FormInstance = deliveryFormRef.value;
        const formRuleRef = FormInstance?.getRef?.();
        const formData = FormInstance?.getFormData?.();

        formRuleRef.validate(valid => {
          if (valid) {
            // 调用API创建交割单
            // createDelivery(formData).then(resp => {
            //   if (resp.code === 0) {
            //     message('交割单创建成功', { type: 'success' });
            //     initDeliveryList(); // 刷新列表
            //     done();
            //   }
            // });

            // 临时代码，实际应调用API
            message("交割单创建成功", { type: "success" });
            initDeliveryList();
            done();
          }
        });
      }
    });
  };

  // 编辑交割单
  const handleEditDelivery = (delivery: any) => {
    const room = localFormInline.value.roomList.find(r => r.roomId === delivery.roomId);

    addDialog({
      title: `编辑交割单 - ${room?.houseName}-${room?.roomNumber}`,
      props: {
        formInline: {
          ...delivery,
          facilities: room?.facilities || []
        }
      },
      top: "2vh",
      width: "80vw",
      lockScroll: true,
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () =>
        h(DeliveryCreateForm, {
          ref: deliveryFormRef,
          formInline: null
        }),
      beforeSure: (done, { options }) => {
        const FormInstance = deliveryFormRef.value;
        const formRuleRef = FormInstance?.getRef?.();
        const formData = FormInstance?.getFormData?.();

        formRuleRef.validate(valid => {
          if (valid) {
            // updateDelivery(formData).then(resp => {
            //   if (resp.code === 0) {
            //     message('交割单更新成功', { type: 'success' });
            //     initDeliveryList();
            //     done();
            //   }
            // });

            message("交割单更新成功", { type: "success" });
            initDeliveryList();
            done();
          }
        });
      }
    });
  };

  // 查看交割单详情
  const handleViewDelivery = (delivery: any) => {
    const room = localFormInline.value.roomList.find(r => r.roomId === delivery.roomId);

    addDialog({
      title: `查看交割单 - ${room?.houseName}-${room?.roomNumber}`,
      props: {
        formInline: delivery
      },
      top: "2vh",
      width: "80vw",
      lockScroll: true,
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      hideFooter: true, // 查看模式不显示底部按钮
      contentRenderer: () =>
        h(DeliveryCreateForm, {
          ref: deliveryFormRef,
          formInline: null
        })
    });
  };

  const editTenant = (row: TenantDetailProps) => {
    openTenantDialog("修改", row);
  };

  /**
   * 初始化交割单列表
   */
  onMounted(() => {
    initDeliveryList();
  });
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
</style>
