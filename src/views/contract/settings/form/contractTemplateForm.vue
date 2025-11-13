<template>
  <el-form ref="ruleFormRef" :model="formInline" :rules="rules" label-width="100px" class="contract-form">
    <el-row :gutter="20" class="form-row">
      <!-- 左侧：基本信息 -->
      <el-col :span="4" class="left-col">
        <div class="left-panel">
          <el-form-item label="模板名称" prop="templateName" label-position="top">
            <el-input v-model="formInline.templateName" placeholder="请输入模板名称" clearable />
          </el-form-item>

          <el-form-item label="合同类型" prop="contractType" label-position="top">
            <el-select v-model="formInline.contractType" placeholder="请选择合同类型" class="w-full">
              <el-option v-for="item in contractTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item label="归属部门" prop="deptIds" label-position="top">
            <el-tree-select
              v-model="formInline.deptIds"
              class="w-full"
              :data="deptOptions"
              node-key="id"
              :props="{
                label: 'name',
                children: 'children'
              }"
              :loading="deptLoading"
              clearable
              filterable
              :filter-node-method="filterDeptNode"
              placeholder="请选择归属部门"
              show-checkbox
              multiple
              check-strictly
              collapse-tags
              collapse-tags-tooltip
              default-expand-all
              :render-after-expand="false"
            >
              <template #default="{ data }">
                <span>{{ data.name }}</span>
                <span v-if="data.children && data.children.length > 0" class="ml-1 text-gray-400">({{ data.children.length }})</span>
              </template>
            </el-tree-select>
          </el-form-item>
        </div>
      </el-col>

      <!-- 中间：富文本编辑器 -->
      <el-col :span="15" class="editor-col">
        <el-form-item prop="templateContent" class="editor-form-item">
          <Editor v-e="formInline.templateContent" license-key="gpl" :init="editorConfig" tinymce-script-src="/tinymce/tinymce.min.js" />
        </el-form-item>
      </el-col>

      <!-- 右侧：参数信息 -->
      <el-col :span="5" class="params-col">
        <div class="params-panel">
          <div class="panel-header">
            <h3>合同参数信息</h3>
            <el-text type="info" size="small">参数复制到模板后，签约时自动填充信息</el-text>
          </div>

          <el-input v-model="paramSearch" placeholder="搜索参数" clearable class="search-input" size="small">
            <template #suffix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <div class="params-list">
            <div v-for="param in filteredParams" :key="param.key" class="param-item" @click="copyParam(param)">
              <div class="param-label">{{ param.label }}</div>
              <el-button link type="primary" size="small">复制</el-button>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </el-form>

  <!-- 预览对话框 -->
  <el-dialog v-model="previewVisible" title="预览合同模板" width="80%" top="5vh" :close-on-click-modal="false" destroy-on-close>
    <div class="preview-container" v-html="formInline.templateContent" />
    <template #footer>
      <el-button @click="previewVisible = false">关闭</el-button>
      <el-button type="primary" @click="handleExportPdf">导出PDF</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from "vue";
  import type { FormInstance, FormRules } from "element-plus";
  import { ElMessage } from "element-plus";
  import { Search } from "@element-plus/icons-vue";
  import { CONTRACT_TYPE_OPTIONS } from "@/constants";
  import { uploadFile } from "@/api/upload";
  import { getDeptList } from "@/api/sys/dept.js";
  import { handleTree } from  "@/utils/tree.ts";
  import Editor from "@tinymce/tinymce-vue";
  import type { ContractTemplateProps } from "@/types";

  // 导入 TinyMCE
  import "tinymce/tinymce";
  import "tinymce/themes/silver";
  import "tinymce/icons/default";
  import "tinymce/models/dom";
  import "tinymce/plugins/advlist";
  import "tinymce/plugins/autolink";
  import "tinymce/plugins/lists";
  import "tinymce/plugins/link";
  import "tinymce/plugins/image";
  import "tinymce/plugins/charmap";
  import "tinymce/plugins/preview";
  import "tinymce/plugins/searchreplace";
  import "tinymce/plugins/visualblocks";
  import "tinymce/plugins/code";
  import "tinymce/plugins/fullscreen";
  import "tinymce/plugins/insertdatetime";
  import "tinymce/plugins/media";
  import "tinymce/plugins/table";
  import "tinymce/plugins/help";
  import "tinymce/plugins/wordcount";

  interface FormProps {
    formInline: ContractTemplateProps;
  }

  const props = defineProps<FormProps>();

  // 表单引用
  const ruleFormRef = ref<FormInstance>();

  // 表单数据
  const formInline = reactive<ContractTemplateProps>({
    templateName: props.formInline?.templateName || "",
    contractType: props.formInline?.contractType || 1,
    templateContent: props.formInline?.templateContent || "",
    status: props.formInline?.status ?? 1,
    deptIds: props.formInline?.deptIds || [],
    ...props.formInline
  });

  // 验证规则
  const rules = reactive<FormRules>({
    templateName: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
    contractType: [{ required: true, message: "请选择合同类型", trigger: "change" }],
    templateContent: [{ required: true, message: "请填写合同模板内容", trigger: "blur" }],
    deptIds: [{ required: true, message: "请选择归属部门", trigger: "change", type: "array" }]
  });

  // 合同类型选项
  const contractTypeOptions = CONTRACT_TYPE_OPTIONS;

  // 部门相关
  const deptOptions = ref([]);
  const deptLoading = ref(false);

  // 参数搜索
  const paramSearch = ref("");

  // 预览对话框
  const previewVisible = ref(false);

  // 合同参数列表
  const contractParams = [
    { key: "合同编号", label: "合同编号" },
    { key: "业主委托合同编号", label: "业主委托合同编号" },
    { key: "房屋地址", label: "房屋地址" },
    { key: "小区/项目名称", label: "小区/项目名称" },
    { key: "楼栋号", label: "楼栋号" },
    { key: "单元号", label: "单元号" },
    { key: "门牌号", label: "门牌号" },
    { key: "合租字间号", label: "合租字间号" },
    { key: "签约房源列表", label: "签约房源列表" },
    { key: "房屋产权编号", label: "房屋产权编号" },
    { key: "房屋类型", label: "房屋类型" },
    { key: "产权类型", label: "产权类型" },
    { key: "房屋总面积", label: "房屋总面积" },
    { key: "签约面积数", label: "签约面积数" },
    { key: "租客姓名", label: "租客姓名" },
    { key: "租客小区", label: "租客小区" },
    { key: "租客项目名称", label: "租客项目名称" },
    { key: "租客楼栋号", label: "租客楼栋号" }
  ];

  // 过滤参数
  const filteredParams = computed(() => {
    if (!paramSearch.value) return contractParams;
    return contractParams.filter(param => param.label.includes(paramSearch.value));
  });

  // 获取部门数据
  async function fetchDeptData() {
    deptLoading.value = true;
    try {
      const { data } = await getDeptList({});
      deptOptions.value = handleTree(data);
      console.log("部门数据加载成功:", deptOptions.value);
    } catch (error) {
      console.error("获取部门数据失败:", error);
      ElMessage.error("获取部门数据失败");
    } finally {
      deptLoading.value = false;
    }
  }

  // 部门节点过滤方法
  const filterDeptNode = (value: string, data: any) => {
    if (!value) return true;
    return data.name.includes(value);
  };

  // TinyMCE 编辑器配置
  const editorConfig = {
    height: "100%",
    menubar: false,
    license_key: "gpl",
    base_url: "/tinymce",
    suffix: ".min",
    language: "zh_CN",
    branding: false,
    resize: false,
    plugins: [
      "advlist",
      "autolink",
      "lists",
      "link",
      "image",
      "charmap",
      "preview",
      "searchreplace",
      "visualblocks",
      "code",
      "fullscreen",
      "insertdatetime",
      "media",
      "table",
      "help",
      "wordcount"
    ],
    toolbar:
      "undo redo | formatselect fontsize | bold italic underline strikethrough | \
    alignleft aligncenter alignright alignjustify | \
    bullist numlist outdent indent | forecolor backcolor | \
    image link table | removeformat | code fullscreen preview",
    toolbar_mode: "sliding",
    font_size_formats: "12px 14px 16px 18px 20px 24px 28px 32px 36px",
    content_style: `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft YaHei', sans-serif;
        font-size: 14px;
        line-height: 1.8;
        padding: 20px;
        color: #333;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 16px 0;
      }
      table td, table th {
        border: 1px solid #ddd;
        padding: 8px 12px;
        text-align: left;
      }
      table th {
        background-color: #f5f7fa;
        font-weight: 500;
      }
      p {
        margin: 8px 0;
      }
      h1, h2, h3, h4, h5, h6 {
        margin: 16px 0 8px;
        font-weight: 500;
      }
    `,
    images_upload_handler: async (blobInfo: any, progress: any) => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", blobInfo.blob(), blobInfo.filename());

        uploadFile(formData, progress)
          .then((resp: any) => {
            if (resp.code === 0) {
              resolve(resp.data);
            } else {
              reject(resp.message || "上传失败");
            }
          })
          .catch((error: any) => {
            reject("图片上传失败: " + error.message);
          });
      });
    },
    paste_data_images: true,
    paste_as_text: false,
    readonly: false,
    setup: (editor: any) => {
      editor.on("init", () => {
        console.log("TinyMCE 初始化完成");
      });
    }
  };

  // 复制参数
  const copyParam = (param: { key: string; label: string }) => {
    const paramText = `\${${param.key}}`;

    navigator.clipboard
      .writeText(paramText)
      .then(() => {
        ElMessage.success(`已复制参数: ${paramText}`);
      })
      .catch(() => {
        const textarea = document.createElement("textarea");
        textarea.value = paramText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        ElMessage.success(`已复制参数: ${paramText}`);
      });
  };

  // 预览模板
  const handlePreview = () => {
    if (!formInline.templateContent) {
      ElMessage.warning("请先填写合同模板内容");
      return;
    }
    previewVisible.value = true;
  };

  // 导出PDF
  const handleExportPdf = () => {
    ElMessage.info("PDF导出功能需要对接后端接口");
  };

  // 暴露方法和预览功能给父组件
  const getRef = () => {
    return ruleFormRef.value;
  };

  defineExpose({
    getRef,
    handlePreview
  });

  onMounted(async () => {
    await fetchDeptData();
  });
</script>

<style scoped lang="scss">
  .contract-form {
    height: 80vh;
    margin-bottom: 20px;
    overflow: auto;
    display: flex;
    flex-direction: column;

    :deep(.el-form-item__label) {
      font-weight: 500;
    }
  }

  .form-row {
    flex: 1;
    height: 100%;
    margin: 0 !important;
    overflow: hidden;
  }

  // 列高度统一
  .left-col,
  .editor-col,
  .params-col {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  // 左侧面板
  .left-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-right: 8px;

    :deep(.el-form-item) {
      margin-bottom: 0;
    }

    :deep(.el-form-item__content) {
      flex: 1;
    }
  }

  // 编辑器列
  .editor-col {
    padding: 0 10px;
  }

  // 编辑器表单项
  .editor-form-item {
    flex: 1;
    height: 100%;
    margin-bottom: 0 !important;

    :deep(.el-form-item__content) {
      height: 100%;
      line-height: 1;
    }

    :deep(.tox-tinymce) {
      height: 100% !important;
      border-radius: 4px;
      border: 1px solid #dcdfe6;
    }

    :deep(.tox-editor-container) {
      height: calc(100% - 39px) !important;
    }

    :deep(.tox-sidebar-wrap) {
      height: 100% !important;
    }
  }

  // 右侧参数面板
  .params-col {
    padding-left: 8px;
  }

  .params-panel {
    height: 100%;
    padding: 16px;
    overflow: hidden;
    background: #f5f7fa;
    border-radius: 4px;
    display: flex;
    flex-direction: column;

    .panel-header {
      margin-bottom: 12px;
      flex-shrink: 0;

      h3 {
        margin: 0 0 8px;
        font-size: 15px;
        font-weight: 500;
        color: #303133;
      }

      .el-text {
        display: block;
        line-height: 1.5;
        font-size: 12px;
      }
    }

    .search-input {
      margin-bottom: 12px;
      flex-shrink: 0;
    }

    .params-list {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;

      .param-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        margin-bottom: 8px;
        background: #fff;
        border: 1px solid #e4e7ed;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          border-color: #409eff;
          background: #ecf5ff;
          transform: translateX(2px);
        }

        .param-label {
          font-size: 13px;
          color: #606266;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .el-button {
          flex-shrink: 0;
          margin-left: 8px;
        }
      }
    }
  }

  // 预览容器
  .preview-container {
    min-height: 400px;
    max-height: 75vh;
    padding: 40px;
    overflow-y: auto;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 4px;

    :deep(img) {
      max-width: 100%;
      height: auto;
    }

    :deep(table) {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;

      td,
      th {
        padding: 8px;
        border: 1px solid #ddd;
      }
    }
  }

  // 滚动条样式
  .params-list::-webkit-scrollbar,
  .preview-container::-webkit-scrollbar {
    width: 6px;
  }

  .params-list::-webkit-scrollbar-thumb,
  .preview-container::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 3px;

    &:hover {
      background: #c0c4cc;
    }
  }

  .params-list::-webkit-scrollbar-track {
    background: transparent;
  }

  // 隐藏 TinyMCE 的升级提示
  :deep(.tox-notification--warn),
  :deep(.tox-notification--warning),
  :deep(.tox-notification--info) {
    display: none !important;
  }

  // 工具类
  .w-full {
    width: 100%;
  }

  .ml-1 {
    margin-left: 0.25rem;
  }

  .text-gray-400 {
    color: #9ca3af;
  }

  // 部门选择器样式优化
  :deep(.el-tree-select) {
    width: 100%;
  }

  :deep(.el-select__tags) {
    max-width: 100%;
    flex-wrap: wrap;
  }
</style>
