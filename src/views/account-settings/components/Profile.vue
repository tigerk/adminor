<script setup lang="ts">
  import { reactive, ref } from "vue";
  import { message } from "@/utils/message";
  import type { FormInstance, FormRules } from "element-plus";
  import ReCropperPreview from "@/components/ReCropperPreview";
  import { createFormData, deviceDetection } from "@pureadmin/utils";
  import uploadLine from "~icons/ri/upload-line";
  import { getUserProfile } from "@/api/login";
  import { uploadFile } from "@/api/upload";

  defineOptions({
    name: "Profile"
  });

  interface UserInfoProps {
    avatar: string;
    nickname: string;
    email: string;
    phone: string;
    remark: string;
  }

  const imgSrc = ref("");
  const cropperBlob = ref();
  const cropRef = ref();
  const uploadRef = ref();
  const isShow = ref(false);
  const loading = ref(false);
  const userInfoFormRef = ref<FormInstance>();

  const userInfos = reactive<UserInfoProps>({
    avatar: "",
    nickname: "",
    email: "",
    phone: "",
    remark: ""
  });

  const rules = reactive<FormRules<UserInfoProps>>({
    nickname: [
      { required: true, message: "昵称必填", trigger: "blur" },
      { min: 2, max: 20, message: "昵称长度在 2 到 20 个字符", trigger: "blur" }
    ],
    remark: [{ max: 250, message: "简介不能超过 250 个字符", trigger: "blur" }]
  });

  const onChange = uploadFile => {
    const reader = new FileReader();
    reader.onload = e => {
      imgSrc.value = e.target.result as string;
      isShow.value = true;
    };
    reader.readAsDataURL(uploadFile.raw);
  };

  const handleClose = () => {
    cropRef.value.hidePopover();
    uploadRef.value.clearFiles();
    isShow.value = false;
  };

  const onCropper = ({ blob }) => (cropperBlob.value = blob);

  const handleSubmitImage = () => {
    const formData = createFormData({
      files: new File([cropperBlob.value], "avatar")
    });
    uploadFile(formData)
      .then(({ code, data }) => {
        if (code === 0) {
          userInfos.avatar = data;
          message("更新头像成功", { type: "success" });
          handleClose();
        } else {
          message("更新头像失败", { type: "error" });
        }
      })
      .catch(error => {
        message(`提交异常 ${error}`, { type: "error" });
      });
  };

  const onSubmit = async (formEl: FormInstance) => {
    if (!formEl) return;
    await formEl.validate(valid => {
      if (valid) {
        loading.value = true;
        // TODO: 调用更新接口
        setTimeout(() => {
          loading.value = false;
          message("更新信息成功", { type: "success" });
        }, 500);
      }
    });
  };

  const onReset = (formEl: FormInstance) => {
    if (!formEl) return;
    formEl.resetFields();
    message("已重置表单", { type: "info" });
  };

  getUserProfile().then(res => {
    Object.assign(userInfos, res.data);
  });
</script>

<template>
  <div class="profile-container">
    <el-form ref="userInfoFormRef" label-position="top" :rules="rules" :model="userInfos">
      <!-- 头像卡片 -->
      <el-card class="info-card avatar-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="card-title">
              <el-icon class="title-icon"><i class="ri-user-line" /></el-icon>
              <span>个人头像</span>
            </div>
          </div>
        </template>
        <div class="avatar-content">
          <div class="avatar-wrapper">
            <el-avatar :size="100" :src="userInfos.avatar" class="user-avatar">
              <i class="ri-user-3-fill avatar-placeholder" />
            </el-avatar>
            <div class="avatar-overlay">
              <i class="ri-camera-line" />
            </div>
          </div>
          <div class="avatar-actions">
            <p class="avatar-tip">
              <el-icon><i class="ri-information-line" /></el-icon>
              支持 JPG、PNG 格式，建议尺寸 200x200，大小不超过 2MB
            </p>
            <el-upload ref="uploadRef" accept="image/*" action="#" :limit="1" :auto-upload="false" :show-file-list="false" :on-change="onChange">
              <el-button type="primary">
                <el-icon><IconifyIconOffline :icon="uploadLine" /></el-icon>
                <span>更换头像</span>
              </el-button>
            </el-upload>
          </div>
        </div>
      </el-card>

      <!-- 基本信息卡片 -->
      <el-card class="info-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="card-title">
              <el-icon class="title-icon"><i class="ri-information-line" /></el-icon>
              <span>基本信息</span>
            </div>
          </div>
        </template>
        <el-row :gutter="24">
          <el-col :xs="24" :sm="24" :md="12">
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="userInfos.nickname" placeholder="请输入昵称" clearable>
                <template #prefix>
                  <el-icon><i class="ri-user-smile-line" /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="12">
            <el-form-item label="手机号">
              <el-input v-model="userInfos.phone" readonly class="readonly-input">
                <template #prefix>
                  <el-icon><i class="ri-phone-line" /></el-icon>
                </template>
                <template #suffix>
                  <el-tag size="small" type="info" effect="plain">只读</el-tag>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="24">
            <el-form-item label="邮箱">
              <el-input v-model="userInfos.email" readonly class="readonly-input">
                <template #prefix>
                  <el-icon><i class="ri-mail-line" /></el-icon>
                </template>
                <template #suffix>
                  <el-tag size="small" type="info" effect="plain">只读</el-tag>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 个人简介卡片 -->
      <el-card class="info-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="card-title">
              <el-icon class="title-icon"><i class="ri-file-text-line" /></el-icon>
              <span>个人简介</span>
            </div>
          </div>
        </template>
        <el-form-item prop="remark">
          <el-input
            v-model="userInfos.remark"
            placeholder="介绍一下自己吧..."
            type="textarea"
            :autosize="{ minRows: 4, maxRows: 8 }"
            maxlength="250"
            show-word-limit
            resize="none"
          />
        </el-form-item>
      </el-card>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button size="large" @click="onReset(userInfoFormRef)">
          <el-icon><i class="ri-refresh-line" /></el-icon>
          <span>重置</span>
        </el-button>
        <el-button type="primary" size="large" :loading="loading" @click="onSubmit(userInfoFormRef)">
          <el-icon v-if="!loading"><i class="ri-save-line" /></el-icon>
          <span>保存更改</span>
        </el-button>
      </div>
    </el-form>

    <!-- 头像裁剪弹窗 -->
    <el-dialog v-model="isShow" width="600px" title="编辑头像" destroy-on-close :close-on-click-modal="false" :before-close="handleClose" :fullscreen="deviceDetection()">
      <ReCropperPreview ref="cropRef" :imgSrc="imgSrc" @cropper="onCropper" />
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmitImage">
          <el-icon><i class="ri-check-line" /></el-icon>
          <span>确定</span>
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
  .profile-container {
    max-width: 900px;
    margin: 0 auto;

    .info-card {
      margin-bottom: 24px;
      border-radius: 8px;
      transition: all 0.3s ease;
      border: 1px solid var(--el-card-border-color);

      &:hover {
        box-shadow: var(--el-box-shadow);
      }

      .card-header {
        .card-title {
          display: flex;
          align-items: center;
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);

          .title-icon {
            font-size: 20px;
            margin-right: 8px;
            color: var(--el-color-primary);
          }
        }
      }
    }

    .avatar-card {
      .avatar-content {
        display: flex;
        align-items: center;
        gap: 32px;

        @media (max-width: 768px) {
          flex-direction: column;
          gap: 20px;
          text-align: center;
        }

        .avatar-wrapper {
          position: relative;
          cursor: pointer;

          .user-avatar {
            border: 3px solid var(--el-border-color);
            box-shadow: var(--el-box-shadow-light);
            background: var(--el-fill-color-lighter);

            .avatar-placeholder {
              font-size: 50px;
              color: var(--el-text-color-placeholder);
            }
          }

          .avatar-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 50%;
            opacity: 0;
            transition: opacity 0.3s;

            i {
              font-size: 32px;
              color: white;
            }
          }

          &:hover .avatar-overlay {
            opacity: 1;
          }
        }

        .avatar-actions {
          flex: 1;

          .avatar-tip {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: var(--el-text-color-secondary);
            margin: 0 0 16px 0;
            line-height: 1.6;

            .el-icon {
              font-size: 16px;
              color: var(--el-color-info);
            }
          }
        }
      }
    }

    .readonly-input {
      :deep(.el-input__wrapper) {
        background-color: var(--el-fill-color-light);
        cursor: not-allowed;
        box-shadow: 0 0 0 1px var(--el-border-color) inset;
      }

      :deep(.el-input__inner) {
        cursor: not-allowed;
        color: var(--el-text-color-regular);
      }
    }

    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;

      @media (max-width: 768px) {
        flex-direction: column-reverse;

        .el-button {
          width: 100%;
        }
      }
    }

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin-bottom: 8px;
    }

    :deep(.el-textarea__inner) {
      padding: 12px;
      line-height: 1.6;
    }

    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px var(--el-border-color) inset;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 0 0 1px var(--el-border-color-hover) inset;
      }

      &.is-focus {
        box-shadow: 0 0 0 1px var(--el-color-primary) inset;
      }
    }
  }
</style>
