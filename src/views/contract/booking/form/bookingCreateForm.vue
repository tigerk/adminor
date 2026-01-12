<template>
  <el-form ref="ruleFormRef" :model="formInline" :rules="rules" label-width="120px" label-position="top">
    <!-- 房源信息 -->
    <div class="section-booking-info mb-2">
      <div class="mb-2">
        <el-text type="primary" size="large" tag="b">房源信息</el-text>
      </div>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="选择房间" prop="roomIds" required>
            <el-select
              v-model="formInline.roomIds"
              size="large"
              filterable
              multiple
              remote
              :remote-method="handleSearchRoom"
              :loading="searchLoading"
              placeholder="请选择房间"
              class="w-full"
              @change="handleRoomChange"
            >
              <el-option v-for="item in roomOptions" :key="item.value" :label="item.label" :value="item">
                <span style="float: left">{{ item.label }}</span>
                <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                  {{ item.description }}
                </span>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- 租客信息 -->
    <div class="section-tenant-info mb-2">
      <div class="mb-2">
        <el-text type="primary" size="large" tag="b">租客信息</el-text>
      </div>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="租客类型" prop="tenantType" required>
            <el-segmented v-model="formInline.tenantType" :options="tenantTypeOptions" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="租客姓名" prop="tenantName" required>
            <el-input v-model="formInline.tenantName" placeholder="请输入租客姓名" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="联系电话" prop="tenantPhone" required>
            <el-input v-model="formInline.tenantPhone" placeholder="请输入联系电话" clearable />
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- 预定信息 -->
    <div class="section-booking-detail mb-2">
      <div class="mb-2">
        <el-text type="primary" size="large" tag="b">预定信息</el-text>
      </div>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="预定金额" prop="bookingAmount" required>
            <el-input v-model.number="formInline.bookingAmount" type="number" placeholder="请输入预定金额">
              <template #prefix>¥</template>
              <template #append>元</template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="到期时间" prop="expiryTime" required>
            <el-date-picker
              v-model="formInline.expiryTime"
              type="datetime"
              placeholder="选择到期时间"
              class="w-full"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- 租期信息 -->
    <div class="section-lease-info mb-2">
      <div class="mb-2">
        <el-text type="primary" size="large" tag="b">预计租期信息</el-text>
      </div>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="预计租赁开始时间" prop="expectedLeaseStart" required>
            <el-date-picker v-model="formInline.expectedLeaseStart" type="date" placeholder="选择开始时间" class="w-full" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="预计租赁结束时间" prop="expectedLeaseEnd" required>
            <el-date-picker v-model="formInline.expectedLeaseEnd" type="date" placeholder="选择结束时间" class="w-full" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="意向租金（元/月）" prop="expectedRentPrice" required>
            <el-input v-model.number="formInline.expectedRentPrice" type="number" placeholder="请输入意向租金">
              <template #prefix>¥</template>
              <template #append>元/月</template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- 备注信息 -->
    <div class="section-remark">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="备注信息" prop="remark">
            <el-input v-model="formInline.remark" type="textarea" :rows="4" placeholder="请输入备注信息" maxlength="500" show-word-limit />
          </el-form-item>
        </el-col>
      </el-row>
    </div>
  </el-form>
</template>

<script setup lang="ts">
  import { reactive, ref, onMounted } from "vue";
  import type { FormInstance, FormRules } from "element-plus";
  import type { BookingCreateProps } from "@/types";
  import { RENTAL_TYPE_OPTIONS, TENANT_TYPE_OPTIONS, getOptionByCode } from "@/constants";
  import { getRoomList } from "@/api/house/room";

  interface FormProps {
    formInline: BookingCreateProps;
  }

  const props = defineProps<FormProps>();

  const ruleFormRef = ref<FormInstance>();

  const formInline = reactive<BookingCreateProps>({
    id: props.formInline?.id || null,
    roomIds: props.formInline?.roomIds || [],
    tenantType: props.formInline?.tenantType ?? 0,
    tenantName: props.formInline?.tenantName || "",
    tenantPhone: props.formInline?.tenantPhone || "",
    bookingAmount: props.formInline?.bookingAmount || null,
    expiryTime: props.formInline?.expiryTime || null,
    expectedLeaseStart: props.formInline?.expectedLeaseStart || null,
    expectedLeaseEnd: props.formInline?.expectedLeaseEnd || null,
    expectedRentPrice: props.formInline?.expectedRentPrice || null,
    companyId: props.formInline?.companyId || null,
    salesmanId: props.formInline?.salesmanId || null,
    bookingStatus: props.formInline?.bookingStatus ?? 1,
    bookingStatusName: props.formInline?.bookingStatusName || "",
    tenantId: props.formInline?.tenantId || null,
    remark: props.formInline?.remark || "",
    createBy: props.formInline?.createBy || null,
    createTime: props.formInline?.createTime || null,
    updateBy: props.formInline?.updateBy || null,
    updateTime: props.formInline?.updateTime || null
  });

  const rules = reactive<FormRules>({
    roomIds: [{ required: true, message: "请选择房间", trigger: "change" }],
    tenantType: [{ required: true, message: "请选择租客类型", trigger: "change" }],
    tenantName: [
      { required: true, message: "请输入租客姓名", trigger: "blur" },
      { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" }
    ],
    tenantPhone: [
      { required: true, message: "请输入联系电话", trigger: "blur" },
      { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号码", trigger: "blur" }
    ],
    bookingAmount: [
      { required: true, message: "请输入预定金额", trigger: "blur" },
      { type: "number", min: 0, message: "金额不能小于0", trigger: "blur" }
    ],
    expiryTime: [{ required: true, message: "请选择到期时间", trigger: "change" }],
    expectedLeaseStart: [{ required: true, message: "请选择预计开始时间", trigger: "change" }],
    expectedLeaseEnd: [{ required: true, message: "请选择预计结束时间", trigger: "change" }],
    expectedRentPrice: [
      { required: true, message: "请输入意向租金", trigger: "blur" },
      { type: "number", min: 0, message: "租金不能小于0", trigger: "blur" }
    ]
  });

  const tenantTypeOptions = [...TENANT_TYPE_OPTIONS];

  // 房源搜索相关
  const roomOptions = ref<any[]>([]);
  const searchLoading = ref<boolean>(false);

  const formatRoomSelectName = (item: any) => {
    const rentalTypeName = getOptionByCode([...RENTAL_TYPE_OPTIONS], item.rentalType) || "";
    if (item.rentalType === 1) {
      return "【" + rentalTypeName.label + "】" + item.houseName;
    } else {
      return "【" + rentalTypeName.label + "】" + item.houseName + " -【" + item.roomNumber + "】";
    }
  };

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

  const handleSearchRoom = (query: string) => {
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
  };

  const handleRoomChange = (values: any[]) => {
    let totalPrice = 0;
    values.forEach(value => {
      if (value.extra?.price) {
        totalPrice += Number(value.extra.price);
      }
    });
    // 自动设置意向租金为房间价格总和
    if (totalPrice > 0 && !formInline.expectedRentPrice) {
      formInline.expectedRentPrice = totalPrice;
    }
  };

  const getRef = () => {
    return ruleFormRef.value;
  };

  defineExpose({
    getRef,
    formInline
  });

  onMounted(() => {
    // 如果有初始房间ID，加载房间信息
    if (formInline.roomIds && formInline.roomIds.length > 0) {
      handleSearchRoom("");
    }
  });
</script>

<style scoped lang="scss">
  :deep(.el-form-item__label) {
    font-weight: 500;
  }
</style>
