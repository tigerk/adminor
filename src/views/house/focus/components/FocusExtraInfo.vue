<template>
  <div class="project-info-form">
    <el-form ref="ruleFormRef" label-position="top" :rules="focusBasicInfoRules">
      <!-- 项目信息 -->
      <div class="section">
        <h3 class="section-title">项目信息</h3>
        <el-row :gutter="20" class="form-row">
          <el-col :span="5">
            <el-form-item class="el-form-item" label="联系电话" required>
              <el-input v-model="formData.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="用水" required class="el-form-item">
              <el-select v-model="formData.water" placeholder="请选择">
                <el-option label="商业用水" value="commercial" />
                <el-option label="民用水" value="residential" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="用电" required>
              <el-select v-model="formData.electricity" placeholder="请选择">
                <el-option label="商业用电" value="commercial" />
                <el-option label="民用电" value="residential" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="供暖信息" required>
              <el-select v-model="formData.heating" placeholder="请选择">
                <el-option label="集中供暖" value="central" />
                <el-option label="独立供暖" value="independent" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="&nbsp;">
              <el-checkbox v-model="formData.hasGas">有燃气</el-checkbox>
              <el-checkbox v-model="formData.hasElevator">有电梯</el-checkbox>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20" class="form-row">
          <el-col :span="24">
            <el-form-item label="项目配置" required>
              <el-space wrap size="large" class="items-start">
                <el-checkbox v-model="formData.facilities.laundry" border>洗衣房</el-checkbox>
                <el-checkbox v-model="formData.facilities.hotWater" border>热水器</el-checkbox>
                <el-checkbox v-model="formData.facilities.drinkingWater" border>饮水机</el-checkbox>
                <el-checkbox v-model="formData.facilities.kitchen" border>厨房</el-checkbox>
                <el-checkbox v-model="formData.facilities.parking" border>停车位</el-checkbox>
                <el-checkbox v-model="formData.facilities.coffee" border>咖啡厅</el-checkbox>
                <el-checkbox v-model="formData.facilities.tv" border>电视</el-checkbox>
                <el-checkbox v-model="formData.facilities.fridge" border>冰箱</el-checkbox>
                <el-checkbox v-model="formData.facilities.microwave" border>微波炉</el-checkbox>
                <el-checkbox v-model="formData.facilities.washingMachine" border>洗衣机</el-checkbox>
                <el-checkbox v-model="formData.facilities.airCondition" border>空调</el-checkbox>
                <el-checkbox v-model="formData.facilities.oven" border>烤箱</el-checkbox>
                <el-checkbox v-model="formData.facilities.security24" border>24小时保安</el-checkbox>
                <el-checkbox v-model="formData.facilities.regularCleaning" border>常规保洁</el-checkbox>
                <el-checkbox v-model="formData.facilities.gym" border>健身房</el-checkbox>
                <el-checkbox v-model="formData.facilities.reception" border>前台</el-checkbox>
                <el-checkbox v-model="formData.facilities.garbageDisposal" border>代收快递</el-checkbox>
                <el-checkbox v-model="formData.facilities.swimmingPool" border>游泳池</el-checkbox>
                <el-checkbox v-model="formData.facilities.publicWifi" border>公共WIFI</el-checkbox>
                <el-checkbox v-model="formData.facilities.supermarket" border>超市</el-checkbox>
                <el-checkbox v-model="formData.facilities.elevator" border>电梯</el-checkbox>
              </el-space>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 项目介绍 -->
      <div class="section">
        <el-form-item label="项目介绍">
          <el-input v-model="formData.projectDescription" type="text" placeholder="请输入项目介绍" :rows="4" maxlength="500" show-word-limit />
        </el-form-item>
      </div>

      <!-- 商圈介绍 -->
      <div class="section">
        <el-form-item label="商圈介绍">
          <el-input v-model="formData.businessDescription" type="text" placeholder="请输入商圈介绍" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
      </div>

      <!-- 项目标签 -->
      <div class="section">
        <el-form-item label="项目标签 (方案二)">
          <div class="tag-section">
            <el-select v-model="formData.tags" multiple filterable allow-create default-first-option :reserve-keyword="false" placeholder="输入标签后按回车添加" class="full-width">
              <el-option v-for="item in tagOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </div>
        </el-form-item>
      </div>

      <!-- 备注 -->
      <div class="section">
        <el-form-item label="备注">
          <div class="note-section">
            <el-input v-model="formData.notes" type="textarea" placeholder="请输入备注信息" :rows="3" maxlength="500" show-word-limit />
          </div>
        </el-form-item>
      </div>

      <!-- 项目图片 -->
      <div class="section">
        <h3 class="section-title">项目图片</h3>
        <el-upload
          v-model:file-list="fileList"
          drag
          multiple
          class="pure-upload"
          list-type="picture-card"
          accept="image/jpeg,image/png,image/gif"
          action="https://run.mocky.io/v3/3aa761d7-b0b3-4a03-96b3-6168d4f7467b"
          :limit="3"
          :headers="{ Authorization: 'eyJhbGciOiJIUzUxMiJ9.admin' }"
          :on-exceed="onExceed"
          :before-upload="onBefore"
        >
          <EpPlus class="m-auto mt-4" />
          <template #file="{ file }">
            <div v-if="file.status == 'ready' || file.status == 'uploading'" class="mt-[35%]! m-auto">
              <p class="font-medium">文件上传中</p>
              <el-progress class="mt-2!" :stroke-width="2" :text-inside="true" :show-text="false" :percentage="file.percentage" />
            </div>
            <div v-else @mouseenter.stop="imgDrop(file.uid)">
              <img class="el-upload-list__item-thumbnail select-none" :src="file.url" alt="" />
              <span id="pure-upload-item" :class="['el-upload-list__item-actions', fileList.length > 1 && 'cursor-move!']">
                <span title="查看" class="hover:text-primary" @click="handlePictureCardPreview(file)">
                  <IconifyIconOffline :icon="Eye" class="hover:scale-125 duration-100" />
                </span>
                <span class="el-upload-list__item-delete" @click="handleRemove(file)">
                  <span title="移除" class="hover:text-[var(--el-color-danger)]">
                    <IconifyIconOffline :icon="Delete" class="hover:scale-125 duration-100" />
                  </span>
                </span>
              </span>
            </div>
          </template>
        </el-upload>
        <!-- 有时文档没写并不代表没有，多看源码好处多多😝 https://github.com/element-plus/element-plus/tree/dev/packages/components/image-viewer/src （emm...这让我想起刚开始写这个项目时，很多东西只有英文或者没有文档，需要看源码时，想笑🥹。那些美好时光都给这些坑了，giao） -->
        <el-image-viewer
          v-if="dialogVisible"
          :initialIndex="curOpenImgIndex"
          :url-list="urlList"
          :zoom-rate="1.2"
          :max-scale="7"
          :min-scale="0.2"
          @close="dialogVisible = false"
          @switch="index => (curOpenImgIndex = index)"
        />
        <!-- 将自定义内容插入到body里，有了它在图片预览的时候，想插入个分页器或者别的东东在预览区某个位置就很方便咯（用户需求可以很灵活，开源组件库几乎不可能尽善尽美，很多时候寻找别的解决途径或许更好） -->
        <teleport to="body">
          <div v-if="fileList[curOpenImgIndex] && dialogVisible" effect="dark" round size="large" type="info" class="img-name">
            <p class="text-[#fff] dark:text-black">
              {{ fileList[curOpenImgIndex].name }}
            </p>
          </div>
        </teleport>
        <p class="el-upload__tip">可拖拽上传最多3张单个不超过2MB且格式为jpeg/png/gif的图片</p>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref } from "vue";
  import type { UploadFile } from "element-plus";
  import { useRouter } from "vue-router";
  import { downloadByData, extractFields, getKeyList } from "@pureadmin/utils";
  import { message } from "@/utils/message";
  import Sortable from "sortablejs";
  import axios from "axios";
  import EpPlus from "~icons/ep/plus?width=30&height=30";
  import Eye from "~icons/ri/eye-line";
  import Delete from "~icons/ri/delete-bin-7-line";
  import { focusBasicInfoRules } from "@/views/house/focus/components/utils/rule";

  // 预设标签选项
  const tagOptions = ref([
    { label: "精装修", value: "精装修" },
    { label: "近地铁", value: "近地铁" },
    { label: "商圈核心", value: "商圈核心" },
    { label: "拎包入住", value: "拎包入住" },
    { label: "高性价比", value: "高性价比" }
  ]);

  interface FormData {
    phone: string;
    water: string;
    electricity: string;
    heating: string;
    hasGas: boolean;
    hasElevator: boolean;
    facilities: {
      laundry: boolean;
      hotWater: boolean;
      drinkingWater: boolean;
      kitchen: boolean;
      parking: boolean;
      coffee: boolean;
      tv: boolean;
      fridge: boolean;
      microwave: boolean;
      washingMachine: boolean;
      airCondition: boolean;
      oven: boolean;
      security24: boolean;
      regularCleaning: boolean;
      gym: boolean;
      reception: boolean;
      garbageDisposal: boolean;
      swimmingPool: boolean;
      publicWifi: boolean;
      supermarket: boolean;
      elevator: boolean;
    };
    projectDescription: string;
    businessDescription: string;
    tags: string[];
    notes: string;
  }

  const formData = reactive<FormData>({
    phone: "",
    water: "commercial",
    electricity: "commercial",
    heating: "central",
    hasGas: true,
    hasElevator: true,
    facilities: {
      laundry: true,
      hotWater: true,
      drinkingWater: false,
      kitchen: true,
      parking: true,
      coffee: false,
      tv: true,
      fridge: true,
      microwave: true,
      washingMachine: false,
      airCondition: true,
      oven: false,
      security24: true,
      regularCleaning: true,
      gym: true,
      reception: true,
      garbageDisposal: true,
      swimmingPool: false,
      publicWifi: false,
      supermarket: false,
      elevator: true
    },
    projectDescription: "",
    businessDescription: "",
    tags: [],
    notes: ""
  });

  const handleImageChange = (file: UploadFile) => {
    console.log("上传文件:", file);
  };

  // 导出表单数据，供父组件使用
  defineExpose({
    formData
  });

  const fileList = ref([]);
  const router = useRouter();
  const curOpenImgIndex = ref(0);
  const dialogVisible = ref(false);

  const urlList = computed(() => getKeyList(fileList.value, "url"));
  const imgInfos = computed(() => extractFields(fileList.value, "name", "size"));

  const getImgUrl = name => new URL(`./imgs/${name}.jpg`, import.meta.url).href;
  const srcList = Array.from({ length: 3 }).map((_, index) => {
    return getImgUrl(index + 1);
  });

  /** 上传文件前校验 */
  const onBefore = file => {
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      message("只能上传图片");
      return false;
    }
    const isExceed = file.size / 1024 / 1024 > 2;
    if (isExceed) {
      message(`单个图片大小不能超过2MB`);
      return false;
    }
  };

  /** 超出最大上传数时触发 */
  const onExceed = () => {
    message("最多上传3张图片，请先删除在上传");
  };

  /** 移除上传的文件 */
  const handleRemove = (file: UploadFile) => {
    fileList.value.splice(fileList.value.indexOf(file), 1);
  };

  /** 大图预览 */
  const handlePictureCardPreview = (file: UploadFile) => {
    curOpenImgIndex.value = fileList.value.findIndex(img => img.uid === file.uid);
    dialogVisible.value = true;
  };

  const getUploadItem = () => document.querySelectorAll("#pure-upload-item");

  /** 缩略图拖拽排序 */
  const imgDrop = uid => {
    const CLASSNAME = "el-upload-list";
    const _curIndex = fileList.value.findIndex(img => img.uid === uid);
    getUploadItem()?.[_curIndex]?.classList?.add(`${CLASSNAME}__item-actions`);
    const wrapper: HTMLElement = document.querySelector(`.${CLASSNAME}`);
    Sortable.create(wrapper, {
      handle: `.${CLASSNAME}__item`,
      onEnd: ({ newIndex, oldIndex }) => {
        const oldFile = fileList.value[oldIndex];
        fileList.value.splice(oldIndex, 1);
        fileList.value.splice(newIndex, 0, oldFile);
        // fix: https://github.com/SortableJS/Sortable/issues/232 (firefox is ok, but chromium is bad. see https://bugs.chromium.org/p/chromium/issues/detail?id=410328)
        getUploadItem().forEach(ele => {
          ele.classList.remove(`${CLASSNAME}__item-actions`);
        });
      }
    });
  };

  /** 下载图片 */
  const onDownload = () => {
    [
      { name: "巴旦木.jpeg", type: "img" },
      { name: "恭喜发财.png", type: "img" },
      { name: "可爱动物.gif", type: "gif" },
      { name: "pure-upload.csv", type: "other" },
      { name: "pure-upload.txt", type: "other" }
    ].forEach(img => {
      axios
        .get(`https://xiaoxian521.github.io/hyperlink/${img.type}/${img.name}`, {
          responseType: "blob"
        })
        .then(({ data }) => {
          downloadByData(data, img.name);
        });
    });
  };
</script>

<style lang="scss" scoped>
  :deep(.el-form-item--label-top .el-form-item__label) {
    font-size: 12px;
    color: #43464c;
  }

  .section {
    margin-bottom: 24px;
  }

  .section-title {
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .form-row {
    margin-bottom: 5px;
  }

  .tag-section,
  .note-section {
    width: 100%;
  }

  .tag-limit,
  .note-limit {
    margin-right: 8px;
    font-size: 12px;
    color: #909399;
  }

  .upload-demo {
    margin-top: 8px;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #606266;
  }

  :deep(.el-input__wrapper) {
    border-radius: 4px;
  }

  :deep(.el-select) {
    width: 100%;
  }

  :deep(.el-textarea__inner) {
    border-radius: 4px;
  }

  :deep(.el-upload-dragger) {
    border-radius: 6px;
  }

  :deep(.card-header) {
    display: flex;

    .header-right {
      display: flex;
      flex: auto;
      align-items: center;
      justify-content: flex-end;
      font-size: 14px;
    }
  }

  :deep(.pure-upload) {
    .el-upload-dragger {
      background-color: transparent;
      border: none;
    }
  }

  .img-name {
    position: absolute;
    bottom: 80px;
    left: 50%;
    z-index: 4000;
    padding: 5px 23px;
    background-color: var(--el-text-color-regular);
    border-radius: 22px;
    transform: translateX(-50%);
  }
</style>
