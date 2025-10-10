<script setup lang="ts">
  import { ref, reactive, watch } from "vue";
  import { ElMessage } from "element-plus";
  import { useEntireEdit } from "@/views/house/components/EntireCreate/hook";
  import PoiSearch from "@/components/Business/PoiSearch.vue";
  import { EntireFormProps } from "@/views/house/components/EntireCreate/types";

  // 使用hook中的方法
  const { openEntireEditDialog } = useEntireEdit();

  const props = withDefaults(defineProps<EntireFormProps>(), {});

  const entireForm = reactive(props.formInline);

  const handlePoiSelected = (poi: any) => {
    entireForm.community = {
      name: poi.name, // poi名称
      adcode: poi.adcode, // 地区编码
      cityId: poi.cityId, // 区域ID
      address: poi.address, // 地址
      district: poi.district, // 区域
      location: poi.location // 经纬度
    };
  };
</script>

<template>
  <div>
    <el-form ref="ruleFormRef" :model="entireForm" label-position="top">
      <div>
        <!-- 项目信息 -->
        <h3 class="pb-4">项目信息</h3>
        <el-row :gutter="20" class="bor">
          <el-col :span="12">
            <el-form-item label="小区地址" prop="community.name">
              <PoiSearch :cityId="entireForm?.community?.cityId" :name="entireForm?.community?.name" @poi-selected="handlePoiSelected" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>
      <div>
        <h3 class="pb-4">项目信息</h3>
        <el-row :gutter="20" class="form-row">
          <el-col :span="5">
            <el-form-item label="用水" required class="el-form-item">
              <el-select v-model="entireForm.water" placeholder="请选择">
                <el-option label="民用水" value="residential" />
                <el-option label="商业用水" value="commercial" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="用电" required>
              <el-select v-model="entireForm.electricity" placeholder="请选择">
                <el-option label="民用电" value="residential" />
                <el-option label="商业用电" value="commercial" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="供暖信息" required>
              <el-select v-model="entireForm.heating" placeholder="请选择">
                <el-option label="独立供暖" value="independent" />
                <el-option label="集中供暖" value="central" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="&nbsp;">
              <el-checkbox v-model="entireForm.hasGas">有燃气</el-checkbox>
              <el-checkbox v-model="entireForm.hasElevator">有电梯</el-checkbox>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-form>
  </div>
</template>

<style scoped></style>
