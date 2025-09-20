<template>
  <div style="width: 100%">
    <div style="display: flex; width: 100%; gap: 8px">
      <el-select v-model="selectedCityId" filterable placeholder="选择城市" style="width: 140px; flex-shrink: 0" @change="handleCityChange">
        <el-option v-for="item in cityOptions" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>

      <el-autocomplete
        v-model="searchText"
        :fetch-suggestions="querySearch"
        :placeholder="selectedCityId ? '请输入地址' : '请先选择城市'"
        value-key="name"
        :trigger-on-focus="false"
        clearable
        :debounce="500"
        :disabled="!selectedCityId"
        style="flex: 1; min-width: 0"
        popper-class="custom-autocomplete-popper"
        @select="handleSelectAddress"
      >
        <template #loading>
          <svg class="circular" viewBox="0 0 50 50">
            <circle class="path" cx="25" cy="25" r="20" fill="none" />
          </svg>
        </template>
        <!-- 自定义下拉项 -->
        <template #default="{ item }">
          <div class="custom-item">
            <div class="item-title">{{ item.name }}</div>
            <div class="item-address">
              <EpLocationFilled />
              {{ item.district }}-{{ item.address }}
            </div>
          </div>
        </template>
      </el-autocomplete>
    </div>
    <div v-if="selectedAddress" class="selected-address-simple">
      <div class="address-text">
        <strong>{{ selectedAddress.name }}</strong>
        - {{ selectedAddress.district }} {{ selectedAddress.address }}
      </div>
    </div>
  </div>
</template>

<script setup>
  import { onMounted, ref } from "vue";
  import { getRegionCityList, getRegionPoiTips } from "@/api/region.js";
  import { ElMessage } from "element-plus";
  import EpLocationFilled from "~icons/ep/location-filled";

  const emit = defineEmits(["poi-selected"]);

  const loading = ref(false); // 用于控制加载状态

  const cityOptions = ref(null);
  const selectedCityId = ref(null);
  const selectedCityName = ref("");

  const searchText = ref("");
  const selectedAddress = ref(null);

  // 选中时获取 name
  const handleCityChange = val => {
    const opt = cityOptions.value.find(o => o.id === val);
    selectedCityName.value = opt ? opt.name : "";
  };

  // 选择事件
  const handleSelectAddress = item => {
    selectedAddress.value = item;

    item.cityId = selectedCityId.value;
    emit("poi-selected", item);
  };

  const querySearch = (queryString, cb) => {
    if (!queryString) {
      return;
    }

    getRegionPoiTips({
      r: selectedCityName.value,
      k: queryString
    }).then(res => {
      if (res.data) {
        cb(res.data.filter(item => item.name));
      } else {
        cb([]);
      }
    });
  };

  // 5. 组件挂载后，立即加载数据
  onMounted(() => {
    fetchCityListData();
  });

  async function fetchCityListData() {
    loading.value = true;
    getRegionCityList().then(res => {
      cityOptions.value = res.data;
      loading.value = false;
    });
  }
</script>

<style scoped>
  .circular {
    display: inline;
    height: 42px;
    width: 42px;
    animation: loading-rotate 2s linear infinite;
  }

  .path {
    animation: loading-dash 1.5s ease-in-out infinite;
    stroke: #409eff;
    stroke-linecap: round;
    stroke-dasharray: 90, 150;
    stroke-dashoffset: 0;
    stroke-width: 2;
  }

  @keyframes loading-rotate {
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes loading-dash {
    0% {
      stroke-dasharray: 1, 150;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -35;
    }
    100% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -124;
    }
  }

  .custom-item {
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .custom-item:hover {
    background-color: #f5f7fa;
  }

  .custom-item:last-child {
    border-bottom: none;
  }

  .item-title {
    font-size: 16px;
    font-weight: 500;
    color: #303133;
    line-height: 22px;
  }

  .item-address {
    font-size: 13px;
    color: #909399;
    line-height: 18px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* 新增的地址显示区域样式 */
  .selected-address-simple {
    margin-top: 8px;
    padding: 2px 12px;
    background: #f0f9ff;
    border-left: 3px solid #409eff;
    border-radius: 4px;
  }

  .address-text {
    font-size: 14px;
    color: #303133;
  }
</style>
