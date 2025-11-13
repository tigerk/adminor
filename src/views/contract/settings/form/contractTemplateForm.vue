<template>
  <el-form ref="ruleFormRef" :model="formInline" :rules="rules" label-width="100px">
    <el-row :gutter="20">
      <el-col :span="4">
        <el-form-item label="模板名称" prop="templateName" label-position="top">
          <el-input v-model="formInline.templateName" placeholder="请输入模板名称" clearable />
        </el-form-item>

        <el-form-item label="合同类型" prop="contractType" label-position="top">
          <el-select v-model="formInline.contractType" placeholder="请选择合同类型" class="w-full">
            <el-option v-for="item in contractTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <div class="editor-toolbar">
          <el-button type="primary" :icon="View" @click="handlePreview">预览模板</el-button>
        </div>
      </el-col>
      <!-- 右侧：表单内容 -->
      <el-col :span="15">
        <el-form-item label="" prop="templateContent" label-position="top">
          <div class="editor-container">
            <Editor height="700px" v-model="formInline.templateContent" license-key="gpl" :init="editorConfig" tinymce-script-src="/tinymce/tinymce.min.js" />
          </div>
        </el-form-item>
      </el-col>
      <!-- 左侧：参数信息 -->
      <el-col :span="5">
        <div class="params-panel">
          <div class="panel-header">
            <h3>合同参数信息</h3>
            <el-text type="info" size="small">参数复制到模板后，即可根据上签约时所填写的信息自动生成相应的信息值并补充</el-text>
          </div>

          <el-input v-model="paramSearch" placeholder="输入合同配置字段信息回车搜索" clearable class="search-input">
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
  <el-dialog v-model="previewVisible" title="预览合同模板" width="80%" :close-on-click-modal="false" destroy-on-close>
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
  import { Search, View } from "@element-plus/icons-vue";
  import { CONTRACT_TYPE_OPTIONS } from "@/constants";
  import { uploadFile } from "@/api/upload";
  import Editor from "@tinymce/tinymce-vue";
  import type { ContractTemplateProps } from "@/types";

  // 如果使用本地部署，需要导入这些
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
    ...props.formInline
  });

  // 验证规则
  const rules = reactive<FormRules>({
    templateName: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
    contractType: [{ required: true, message: "请选择合同类型", trigger: "change" }],
    templateContent: [{ required: true, message: "请填写合同模板内容", trigger: "blur" }]
  });

  // 合同类型选项
  const contractTypeOptions = CONTRACT_TYPE_OPTIONS;

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

  // TinyMCE 编辑器配置
  const editorConfig = {
    height: 500,
    menubar: false,

    // 设置基础路径，避免路径错误
    base_url: "/tinymce",
    suffix: ".min",

    // 中文语言配置（如果没有语言包就注释掉）
    language: "zh_CN",

    // 隐藏升级提示
    branding: false,

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
      "undo redo | formatselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | forecolor backcolor | image link table | removeformat | fullscreen preview",
    content_style: `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      font-size: 14px;
      line-height: 1.6;
      padding: 20px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    table td, table th {
      border: 1px solid #ddd;
      padding: 8px;
    }
  `,
    // 图片上传处理
    images_upload_handler: async (blobInfo, progress) => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", blobInfo.blob(), blobInfo.filename());

        uploadFile(formData, progress)
          .then(resp => {
            if (resp.code === 0) {
              resolve(resp.data); // 返回图片URL
            } else {
              reject(resp.message || "上传失败");
            }
          })
          .catch(error => {
            reject("图片上传失败: " + error.message);
          });
      });
    },
    // 粘贴处理
    paste_data_images: true,
    paste_as_text: false,

    // 确保编辑器可编辑
    readonly: false,

    // 初始化完成回调
    setup: editor => {
      editor.on("init", () => {
        console.log("TinyMCE 初始化完成");
      });
    }
  };

  // 复制参数
  const copyParam = (param: { key: string; label: string }) => {
    const paramText = `\${${param.key}}`;

    // 复制到剪贴板
    navigator.clipboard
      .writeText(paramText)
      .then(() => {
        ElMessage.success(`已复制参数: ${paramText}`);
      })
      .catch(() => {
        // 降级方案
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

  // 导出PDF（调用后端接口）
  const handleExportPdf = () => {
    ElMessage.info("PDF导出功能需要对接后端接口");
    // TODO: 实现PDF导出功能
    // previewContractTemplate(formInline.id).then(...)
  };

  // 暴露方法给父组件
  const getRef = () => {
    return ruleFormRef.value;
  };

  defineExpose({
    getRef
  });

  onMounted(() => {
    // 初始化时的逻辑
  });
</script>

<style scoped lang="scss">
  :deep(.el-form-item__label) {
    font-weight: 500;
  }

  .params-panel {
    height: calc(100vh - 200px);
    padding: 16px;
    overflow: hidden;
    background: #f5f7fa;
    border-radius: 4px;
    display: flex;
    flex-direction: column;

    .panel-header {
      margin-bottom: 16px;

      h3 {
        margin: 0 0 8px;
        font-size: 16px;
        font-weight: 500;
        color: #303133;
      }

      .el-text {
        display: block;
        line-height: 1.5;
      }
    }

    .search-input {
      margin-bottom: 16px;
    }

    .params-list {
      flex: 1;
      overflow-y: auto;

      .param-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        margin-bottom: 8px;
        background: #fff;
        border: 1px solid #e4e7ed;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          border-color: #409eff;
          background: #ecf5ff;
        }

        .param-label {
          font-size: 14px;
          color: #606266;
        }
      }
    }
  }

  .editor-container {
    width: 100%;

    .editor-toolbar {
      margin-bottom: 12px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .preview-container {
    min-height: 400px;
    max-height: 70vh;
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
  :deep(.params-list)::-webkit-scrollbar,
  .preview-container::-webkit-scrollbar {
    width: 6px;
  }

  :deep(.params-list)::-webkit-scrollbar-thumb,
  .preview-container::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 3px;

    &:hover {
      background: #c0c4cc;
    }
  }
</style>
