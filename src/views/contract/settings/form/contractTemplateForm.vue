<template>
  <div v-loading="contractParamsLoading">
    <el-form ref="ruleFormRef" :model="formInline" :rules="rules" class="contract-template-form" label-width="100px" label-position="top">
      <el-row :gutter="20">
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
        <!-- 右侧：表单内容 -->
        <el-col :span="15">
          <el-form-item label="" prop="templateContent">
            <div class="editor-container">
              <Editor v-model="formInline.templateContent" class="contract-editor" license-key="gpl" :init="editorConfig" tinymce-script-src="/tinymce/tinymce.min.js" />
            </div>
          </el-form-item>
        </el-col>
        <!-- 左侧：参数信息 -->
        <el-col :span="4">
          <el-form-item label="模板名称" prop="templateName">
            <el-input v-model="formInline.templateName" placeholder="请输入模板名称" clearable />
          </el-form-item>

          <el-form-item label="合同类型" prop="contractType">
            <el-select v-model="formInline.contractType" placeholder="请选择合同类型" class="w-full" @change="loadContractParams">
              <el-option v-for="item in contractTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="生效部门" prop="deptIds">
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
              check-strictly
              :filter-node-method="filterDeptNode"
              placeholder="请选择归属部门"
              show-checkbox
              multiple
              default-expand-all
              :render-after-expand="false"
            >
              <template #default="{ data }">
                <span>{{ data.name }}</span>
                <span v-if="data.children && data.children.length > 0" class="ml-1 text-gray-400">({{ data.children.length }})</span>
              </template>
            </el-tree-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" :top="`1%`" title="预览合同模板" width="60%" :close-on-click-modal="false" destroy-on-close align-center lockScroll>
      <div class="preview-container" v-html="formInline.templateContent" />
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from "vue";
  import type { FormInstance, FormRules } from "element-plus";
  import { ElMessage } from "element-plus";
  import { Search } from "@element-plus/icons-vue";
  import { CONTRACT_TYPE_OPTIONS } from "@/constants";
  import { uploadFile } from "@/api/upload";
  import Editor from "@tinymce/tinymce-vue";
  import type { ContractTemplateFormProps } from "@/types"; // 如果使用本地部署，需要导入这些
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
  import { getDeptList } from "@/api/sys/dept";
  import { handleTree } from "@/utils/tree";
  import { getContractTemplateParams } from "@/api/contract/template";

  interface FormProps {
    formInline: ContractTemplateFormProps;
  }

  const props = defineProps<FormProps>();

  // 表单引用
  const ruleFormRef = ref<FormInstance>();

  // 表单数据
  const formInline = reactive<ContractTemplateFormProps>({
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

  // 参数搜索
  const paramSearch = ref("");

  // 部门相关
  const deptOptions = ref([]);
  const deptLoading = ref(false);
  const contractParamsLoading = ref(false);

  // 预览对话框
  const previewVisible = ref(false);

  // 合同参数列表
  const contractParams = ref([]);

  // 过滤参数
  const filteredParams = computed(() => {
    if (!paramSearch.value) return contractParams.value;
    return contractParams.value.filter(param => param.label.includes(paramSearch.value));
  });

  // 加载合同参数
  async function loadContractParams() {
    contractParamsLoading.value = true;
    try {
      const { data } = await getContractTemplateParams({ contractType: formInline.contractType });
      // 列表返回参数格式：{ key: "参数名称", value: "参数值" } 转成 { label: "参数名称", value: "参数值" }
      contractParams.value = data?.map(item => ({ key: item.key, label: item.value })) || [];
      console.log("合同参数加载成功:", contractParams.value);
    } catch (error) {
      console.error("加载合同参数失败:", error);
      ElMessage.error("加载合同参数失败");
    } finally {
      contractParamsLoading.value = false;
    }
  }

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
    height: "82vh", // 改为与 params-panel 一致的 82vh
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
    toolbar: [
      "customPreview | undo redo | formatselect fontsize | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify",
      "bullist numlist outdent indent | forecolor backcolor | image link table | removeformat | code fullscreen"
    ],
    toolbar_mode: "wrap",
    font_size_formats: "12px 14px 16px 18px 20px 24px 28px 32px 36px",
    content_style: `
      body {
        margin: 0;
        padding: 4px 8px; /* 可根据需要调整 */
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft YaHei', sans-serif;
        font-size: 14px;
        line-height: 1.8;
        color: #333;
      }
    `,
    // 图片上传处理
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
    // 粘贴处理
    paste_data_images: true,
    paste_as_text: false,

    // 确保编辑器可编辑
    readonly: false,

    // 初始化完成回调
    setup: (editor: any) => {
      // 添加一个自定义按钮
      editor.ui.registry.addButton("customPreview", {
        text: "预览",
        icon: "preview", // TinyMCE 自带的 preview 图标
        tooltip: "内容预览",
        onAction: () => {
          handlePreview();
        }
      });

      editor.on("init", () => {
        console.log("TinyMCE 初始化完成");
      });
    }
  };

  // 复制参数
  const copyParam = (param: { key: string; label: string }) => {
    const paramText = `${param.key}`;

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

  // 暴露方法给父组件
  const getRef = () => {
    return ruleFormRef.value;
  };

  defineExpose({
    getRef,
    formInline
  });

  onMounted(async () => {
    await fetchDeptData();
    loadContractParams();
  });
</script>

<style scoped lang="scss">
  .contract-template-form {
    margin-bottom: 11px;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
  }

  .params-panel {
    height: 82vh;
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
    min-height: 77vh;
    padding: 40px;
    margin-bottom: 10px;
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
