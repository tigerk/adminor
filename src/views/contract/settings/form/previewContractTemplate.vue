<template>
  <div>
    <button @click="previewFile">预览合同模板</button>
    <dialog ref="filePreviewDialog" class="modal">
      <iframe :src="fileUrl" width="100%" height="600px" />
      <button @click="closeDialog">关闭</button>
    </dialog>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref } from "vue";
  import { previewContractTemplate } from "@/api/contract/template";

  export default defineComponent({
    name: "FilePreview",
    setup() {
      const fileUrl = ref<string | null>(null);
      const filePreviewDialog = ref<HTMLDialogElement | null>(null);

      const previewFile = async () => {
        try {
          const response = await previewContractTemplate();
          if (response) {
            const blob = new Blob([response], { type: "application/pdf" });

            fileUrl.value = URL.createObjectURL(blob);
            if (filePreviewDialog.value) {
              filePreviewDialog.value.showModal();
            }
          }
        } catch (error) {
          console.error("获取文件流失败:", error);
        }
      };

      const closeDialog = () => {
        if (filePreviewDialog.value) {
          filePreviewDialog.value.close();
        }
        if (fileUrl.value) {
          URL.revokeObjectURL(fileUrl.value);
          fileUrl.value = null;
        }
      };

      return {
        fileUrl,
        filePreviewDialog,
        previewFile,
        closeDialog
      };
    }
  });
</script>

<style scoped>
  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    padding: 20px;
    border: 1px solid #ccc;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }
</style>
