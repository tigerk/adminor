<script setup lang="ts">
  import { computed, onMounted, ref } from "vue";
  import { ElMessage } from "element-plus";
  import { getFocusById } from "@/api/house/focus";
  import { getRoomList } from "@/api/house/room";
  import { getDictDataByDictCode } from "@/api/sys/dict";
  import type { DictData, FocusCreateDto, RoomListVo } from "@/types";
  import { OccupancyStatusEnumMeta } from "@/types/generated/enum.meta";
  import { ELECTRICITY_TYPE_OPTIONS, getOptionByCode, HEATING_TYPE_OPTIONS, WATER_TYPE_OPTIONS } from "@/constants";

  const props = defineProps<{
    focusId: string;
  }>();

  const activeTab = ref("basic");
  const loading = ref(false);
  const focusDetail = ref<FocusCreateDto | null>(null);
  const roomList = ref<RoomListVo[]>([]);
  const tagLabelMap = ref<Record<string, string>>({});
  const facilityLabelMap = ref<Record<string, string>>({});

  const buildingRows = computed(() => focusDetail.value?.buildings ?? []);
  const layoutRows = computed(() => focusDetail.value?.houseLayoutList ?? []);
  const imageList = computed(() => focusDetail.value?.imageList?.filter(Boolean) ?? []);
  const projectTags = computed(() => (focusDetail.value?.tags ?? []).map(item => tagLabelMap.value[item] || item));
  const projectFacilities = computed(() => (focusDetail.value?.facilities ?? []).map(item => facilityLabelMap.value[item] || item));

  const getOptionLabel = (options: readonly any[], value?: string) => {
    if (!value) return "-";
    return getOptionByCode([...options], value)?.label || value;
  };

  const getWaterLabel = (value?: string) => getOptionLabel(WATER_TYPE_OPTIONS, value);
  const getElectricityLabel = (value?: string) => getOptionLabel(ELECTRICITY_TYPE_OPTIONS, value);
  const getHeatingLabel = (value?: string) => getOptionLabel(HEATING_TYPE_OPTIONS, value);

  const getOccupancyMeta = (row: RoomListVo) => {
    if (row.closed) {
      return { text: "已关闭", color: "#909399" };
    }
    if (row.locked) {
      return { text: "已锁定", color: "#E6A23C" };
    }

    const enumMeta = Object.values(OccupancyStatusEnumMeta).find(item => item.code === row.occupancyStatus);
    return {
      text: row.occupancyStatusName || enumMeta?.name || "未知",
      color: row.occupancyStatusColor || enumMeta?.color || "#909399"
    };
  };

  const loadDictMap = async (dictCode: string) => {
    const resp = await getDictDataByDictCode({ dictCode });
    if (resp.code !== 0) return {};
    return (resp.data || []).reduce<Record<string, string>>((acc, item: DictData) => {
      acc[String(item.value ?? item.id ?? item.name)] = item.name ?? "";
      return acc;
    }, {});
  };

  const loadDetail = async () => {
    loading.value = true;
    try {
      const [focusResp, roomResp, focusTagMap, facilityMap] = await Promise.all([
        getFocusById({ id: props.focusId }),
        getRoomList({
          leaseMode: 1,
          leaseModeId: props.focusId,
          currentPage: "1",
          pageSize: "1000"
        }),
        loadDictMap("focus_tags"),
        loadDictMap("house_facilities")
      ]);

      if (focusResp.code !== 0) {
        ElMessage.error(focusResp.message || "获取项目详情失败");
        return;
      }

      focusDetail.value = focusResp.data ?? null;
      roomList.value = roomResp.code === 0 ? roomResp.data?.list ?? [] : [];
      tagLabelMap.value = focusTagMap;
      facilityLabelMap.value = facilityMap;
    } catch (error) {
      console.error(error);
      ElMessage.error("获取项目详情失败");
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    loadDetail();
  });
</script>

<template>
  <div v-loading="loading" class="focus-project-view">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="项目基本信息" name="basic">
        <div class="panel-section">
          <div class="section-title">基础信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="项目名称">{{ focusDetail?.focusName || "-" }}</el-descriptions-item>
            <el-descriptions-item label="项目编号">{{ focusDetail?.focusCode || "-" }}</el-descriptions-item>
            <el-descriptions-item label="小区名称">{{ focusDetail?.community?.name || "-" }}</el-descriptions-item>
            <el-descriptions-item label="项目地址">{{ focusDetail?.community?.address || focusDetail?.address || "-" }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ focusDetail?.storePhone || "-" }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ focusDetail?.updateTime || focusDetail?.createTime || "-" }}</el-descriptions-item>
            <el-descriptions-item label="水费">{{ getWaterLabel(focusDetail?.water) }}</el-descriptions-item>
            <el-descriptions-item label="电费">{{ getElectricityLabel(focusDetail?.electricity) }}</el-descriptions-item>
            <el-descriptions-item label="供暖">{{ getHeatingLabel(focusDetail?.heating) }}</el-descriptions-item>
            <el-descriptions-item label="配套">{{ focusDetail?.hasElevator ? "电梯" : "无电梯" }} / {{ focusDetail?.hasGas ? "燃气" : "无燃气" }}</el-descriptions-item>
            <el-descriptions-item label="项目标签">
              <div class="tag-list">
                <el-tag v-for="tag in projectTags" :key="tag" size="small" effect="plain">{{ tag }}</el-tag>
                <span v-if="projectTags.length === 0">-</span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="项目设施">
              <div class="tag-list">
                <el-tag v-for="facility in projectFacilities" :key="facility" size="small">{{ facility }}</el-tag>
                <span v-if="projectFacilities.length === 0">-</span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="项目介绍" :span="2">{{ focusDetail?.houseDesc || "-" }}</el-descriptions-item>
            <el-descriptions-item label="商圈介绍" :span="2">{{ focusDetail?.businessDesc || "-" }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ focusDetail?.remark || "-" }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="panel-section">
          <div class="section-title">楼栋信息</div>
          <el-table :data="buildingRows" border>
            <el-table-column label="楼栋" prop="building" min-width="100" />
            <el-table-column label="单元" prop="unit" min-width="100" />
            <el-table-column label="总楼层" prop="floorTotal" min-width="100" />
            <el-table-column label="每层房数" prop="houseCountPerFloor" min-width="120" />
            <el-table-column label="门牌前缀" prop="housePrefix" min-width="120" />
            <el-table-column label="编号长度" prop="numberLength" min-width="120" />
            <el-table-column label="去4" min-width="80">
              <template #default="{ row }">
                {{ row.excludeFour ? "是" : "否" }}
              </template>
            </el-table-column>
            <el-table-column label="关闭楼层" min-width="140">
              <template #default="{ row }">
                {{ row.closedFloors?.length ? row.closedFloors.join("、") : "-" }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="panel-section">
          <div class="section-title">户型信息</div>
          <el-table :data="layoutRows" border>
            <el-table-column label="户型名称" prop="layoutName" min-width="140" />
            <el-table-column label="卧室" prop="bedroom" min-width="80" />
            <el-table-column label="客厅" prop="livingRoom" min-width="80" />
            <el-table-column label="厨房" prop="kitchen" min-width="80" />
            <el-table-column label="卫生间" prop="bathroom" min-width="90" />
          </el-table>
        </div>

        <div class="panel-section">
          <div class="section-title">项目图片</div>
          <div v-if="imageList.length" class="image-list">
            <el-image
              v-for="(image, index) in imageList"
              :key="`${image}-${index}`"
              :src="image"
              fit="cover"
              :preview-src-list="imageList"
              :initial-index="index"
              preview-teleported
              class="preview-image"
            />
          </div>
          <el-empty v-else description="暂无项目图片" :image-size="90" />
        </div>
      </el-tab-pane>

      <el-tab-pane :label="`房源列表（${roomList.length}）`" name="houses">
        <el-table :data="roomList" border height="520">
          <el-table-column label="出租状态" min-width="120" fixed="left">
            <template #default="{ row }">
              <el-tag :color="getOccupancyMeta(row).color" effect="light" round>
                {{ getOccupancyMeta(row).text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="楼栋" prop="building" min-width="90" />
          <el-table-column label="单元" prop="unit" min-width="80" />
          <el-table-column label="楼层" prop="floor" min-width="80" />
          <el-table-column label="门牌号" prop="doorNumber" min-width="110" />
          <el-table-column label="房间号" prop="roomNumber" min-width="100" />
          <el-table-column label="房型" min-width="140">
            <template #default="{ row }">
              {{ row.houseLayout?.layoutName || "-" }}
            </template>
          </el-table-column>
          <el-table-column label="面积(㎡)" prop="area" min-width="100" />
          <el-table-column label="价格(元/月)" prop="price" min-width="120" />
          <el-table-column label="朝向" prop="direction" min-width="100" />
          <el-table-column label="负责人" min-width="160">
            <template #default="{ row }">
              {{ row.salesmanName || "-" }}<span v-if="row.salesmanPhone"> / {{ row.salesmanPhone }}</span>
            </template>
          </el-table-column>
          <el-table-column label="可出租日期" prop="availableDate" min-width="120" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
  .focus-project-view {
    min-height: 240px;
  }

  .panel-section + .panel-section {
    margin-top: 20px;
  }

  .section-title {
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .image-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .preview-image {
    width: 100%;
    height: 120px;
    overflow: hidden;
    border-radius: 8px;
  }
</style>
