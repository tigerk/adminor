<template>
  <el-form ref="ruleFormRef" :model="formInline" :rules="rules" label-width="120px" label-position="top">
    <!-- 房源信息 -->
    <div class="section-booking-info mb-2">
      <div class="mb-4 house-selector-info">
        <div class="flex justify-between items-center mb-2">
          <el-text type="primary" size="large" tag="b">房源信息</el-text>
          <el-button type="primary" link :icon="Plus" @click="roomPickerRef.show(roomSelection)">选择房源</el-button>
        </div>

        <div v-if="roomSelection.length > 0" class="room-tags-box p-3 border rounded-md">
          <el-tag v-for="(room, index) in roomSelection" :key="room.value" closable class="m-1" size="large" @close="handleRemoveRoom(index)">
            {{ room.label }} |
            <span class="text-orange-500">¥{{ room.extra?.price }}</span>
          </el-tag>
        </div>
        <el-empty v-else description="请点击上方选择房源" :image-size="60" />

        <el-form-item prop="roomIds" label-width="0" class="!m-0" />
      </div>
      <RoomPicker ref="roomPickerRef" @confirm="handleRoomConfirmed" />
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
          <el-form-item label="到期时间" prop="expiryAt" required>
            <el-date-picker
              v-model="formInline.expiryAt"
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
      <!-- 快速租期选项 -->
      <el-row :gutter="20">
        <el-col :span="16">
          <div class="quick-lease-options">
            <span class="quick-label">快捷方式</span>
            <el-button
              v-for="option in quickLeaseOptions"
              :key="option.months"
              size="small"
              :type="activeQuickOption === option.months ? 'primary' : 'default'"
              round
              @click="applyQuickLease(option.months)"
            >
              {{ option.label }}
            </el-button>
          </div>
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
  import { computed, onMounted, reactive, ref, watch } from "vue";
  import type { FormInstance, FormRules } from "element-plus";
  import type { BookingCreateDto, RoomListVo } from "@/types";
  import { getOptionByCode, RENTAL_TYPE_OPTIONS, TENANT_TYPE_OPTIONS } from "@/constants";
  import RoomPicker from "@/shared/house/RoomPicker.vue";
  import { Plus } from "@element-plus/icons-vue";
  import { formatDate } from "@/utils/date";

  interface BookingCreateProps extends BookingCreateDto {
    roomList: RoomListVo[];
  }

  interface FormProps {
    formInline: BookingCreateProps;
  }

  const props = defineProps<FormProps>();

  const ruleFormRef = ref<FormInstance>();
  const roomPickerRef = ref();
  const roomSelection = ref([]);

  const formInline = reactive<BookingCreateProps>({
    id: props.formInline?.id || null,
    roomIds: props.formInline?.roomIds || [],
    roomList: props.formInline?.roomList || [],
    tenantType: props.formInline?.tenantType ?? 0,
    tenantName: props.formInline?.tenantName || "",
    tenantPhone: props.formInline?.tenantPhone || "",
    bookingAmount: props.formInline?.bookingAmount || null,
    expiryAt: props.formInline?.expiryAt || null,
    expectedLeaseStart: props.formInline?.expectedLeaseStart || null,
    expectedLeaseEnd: props.formInline?.expectedLeaseEnd || null,
    expectedRentPrice: props.formInline?.expectedRentPrice || null,
    bookingStatus: props.formInline?.bookingStatus ?? 1,
    remark: props.formInline?.remark || ""
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
    expiryAt: [{ required: true, message: "请选择到期时间", trigger: "change" }],
    expectedLeaseStart: [{ required: true, message: "请选择预计开始时间", trigger: "change" }],
    expectedLeaseEnd: [{ required: true, message: "请选择预计结束时间", trigger: "change" }],
    expectedRentPrice: [
      { required: true, message: "请输入意向租金", trigger: "blur" },
      { type: "number", min: 0, message: "租金不能小于0", trigger: "blur" }
    ]
  });

  const tenantTypeOptions = [...TENANT_TYPE_OPTIONS];

  const formatRoomSelectName = (item: RoomListVo) => {
    const rentalTypeName = getOptionByCode([...RENTAL_TYPE_OPTIONS], item.rentalType) || "";
    if (item.rentalType === 1) {
      return "【" + rentalTypeName.label + "】" + item.houseName;
    } else {
      return "【" + rentalTypeName.label + "】" + item.houseName + " -【" + item.roomNumber + "】";
    }
  };

  // 处理弹窗确认选择
  const handleRoomConfirmed = (rooms: any[]) => {
    // 转换成需要的格式
    roomSelection.value = rooms.map(item => ({
      label: formatRoomSelectName(item),
      value: item.roomId,
      extra: item
    }));

    // 同步更新表单数据，触发表单验证
    formInline.roomIds = rooms.map(item => item.roomId);

    // 触发价格计算
    calculateTotalRent();
  };

  // 移除房源
  const handleRemoveRoom = (index: number) => {
    roomSelection.value.splice(index, 1);
    // 同步更新表单数据
    formInline.roomIds = roomSelection.value.map(item => item.value);
    calculateTotalRent();
  };

  // 统一计算租金
  const calculateTotalRent = () => {
    let totalPrice = 0;
    roomSelection.value.forEach(item => {
      totalPrice += Number(item.extra?.price || 0);
    });
    // 自动设置意向租金为房间价格总和
    if (totalPrice > 0 && !formInline.expectedRentPrice) {
      formInline.expectedRentPrice = totalPrice;
    }
  };

  // 快速租期选项
  const quickLeaseOptions = [
    { label: "3 个月", months: 3 },
    { label: "6 个月", months: 6 },
    { label: "12 个月", months: 12 }
  ];

  // 当前激活的快速选项（用于高亮）
  const activeQuickOption = ref<number | null>(null);

  // 点击快速租期
  const applyQuickLease = (months: number) => {
    // 开始时间：明天
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(0, 0, 0, 0);

    // 结束时间：开始时间往后加 N 个月，再减一天（整租期）
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    end.setDate(end.getDate() - 1);

    formInline.expectedLeaseStart = formatDate(start);
    formInline.expectedLeaseEnd = formatDate(end);
    activeQuickOption.value = months;
  };

  // 手动修改日期时取消快速选项高亮
  watch(
    () => [formInline.expectedLeaseStart, formInline.expectedLeaseEnd],
    () => {
      if (activeQuickOption.value === null) return;
      // 重新计算当前快速选项对应的结束日期，若不匹配则取消高亮
      const option = quickLeaseOptions.find(o => o.months === activeQuickOption.value);
      if (!option) return;
      const start = new Date(formInline.expectedLeaseStart + "T00:00:00");
      const expectedEnd = new Date(start);
      expectedEnd.setMonth(expectedEnd.getMonth() + option.months);
      expectedEnd.setDate(expectedEnd.getDate() - 1);
      if (formInline.expectedLeaseEnd !== formatDate(expectedEnd) || formInline.expectedLeaseStart !== formatDate(start)) {
        activeQuickOption.value = null;
      }
    }
  );

  const getRef = () => {
    return ruleFormRef.value;
  };

  defineExpose({
    getRef,
    formInline,
    roomSelection
  });

  onMounted(() => {
    // 如果有初始房间列表，加载房间信息
    if (props.formInline?.roomList && props.formInline.roomList.length > 0) {
      const defaultOptions = props.formInline.roomList.map(item => ({
        label: formatRoomSelectName(item),
        value: item.roomId,
        extra: item
      }));
      roomSelection.value = defaultOptions;
    }
  });
</script>

<style scoped lang="scss">
  :deep(.el-form-item__label) {
    font-weight: 500;
  }

  /* 修复 type="number" 时 prefix 插槽间距异常 */
  :deep(.el-input__prefix) {
    .el-input__prefix-inner {
      padding-right: 8px;
    }
  }

  /* 去除 number 类型输入框的原生 spin 按钮（可选，更美观） */
  :deep(input[type="number"]) {
    -moz-appearance: textfield;
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }

  .quick-lease-options {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: -8px;
    margin-bottom: 16px;
    flex-wrap: wrap;

    .quick-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      white-space: nowrap;
    }
  }
</style>
