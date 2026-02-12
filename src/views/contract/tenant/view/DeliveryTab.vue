<template>
  <div class="delivery-tab">
    <div v-if="deliveryList.length > 0" class="delivery-grid">
      <el-card v-for="delivery in deliveryList" :key="delivery.roomId.toString()" class="delivery-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="room-info">
              <el-icon class="room-icon"><House /></el-icon>
              <span class="room-name">
                {{ delivery.roomInfo?.communityName }}
                {{ delivery.roomInfo?.houseName }}-{{ delivery.roomInfo?.roomNumber }}
              </span>
            </div>
            <el-tag :type="getStatusTagType(delivery.status)" size="small">
              {{ getStatusText(delivery.status) }}
            </el-tag>
          </div>
        </template>

        <div class="delivery-content">
          <div v-if="delivery.id" class="delivery-info">
            <el-descriptions :column="2" size="small">
              <el-descriptions-item label="交割类型">
                <el-tag :type="delivery.handoverType === 'CHECK_IN' ? 'success' : 'warning'" size="small">
                  {{ getOptionByCode([...DELIVERY_TYPE_OPTIONS], delivery.handoverType)?.label }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="交割日期">
                {{ delivery.handoverDate }}
              </el-descriptions-item>
              <el-descriptions-item label="验收人">
                {{ delivery.inspectorName }}
              </el-descriptions-item>
              <el-descriptions-item label="物品数量">{{ delivery.items?.length || 0 }} 项</el-descriptions-item>
            </el-descriptions>

            <div v-if="delivery.remark" class="delivery-remark">
              <el-text type="info" size="small">备注:{{ delivery.remark }}</el-text>
            </div>
          </div>

          <div v-else class="no-delivery">
            <el-empty description="暂未创建交割单" :image-size="80" />
          </div>
        </div>

        <template #footer>
          <div class="card-footer">
            <el-button v-if="delivery.id" type="primary" link :icon="View" @click="handleViewDelivery(delivery)">查看详情</el-button>
            <el-button v-if="delivery.id" type="primary" link :icon="Edit" @click="handleEditDelivery(delivery)">编辑</el-button>
            <el-button v-if="!delivery.id" type="primary" :icon="Plus" @click="handleCreateDelivery(delivery.roomId)">创建交割单</el-button>
          </div>
        </template>
      </el-card>
    </div>

    <el-empty v-else description="暂无房间信息" :image-size="150" />
  </div>
</template>

<script setup lang="ts">
  import { h, onMounted, ref } from "vue";
  import { Edit, House, Plus, View } from "@element-plus/icons-vue";
  import { message } from "@/utils/message";
  import { addDialog } from "@/components/ReDialog";
  import { deviceDetection } from "@/store/utils";
  import DeliveryCreateForm from "@/views/contract/tenant/form/deliveryCreateForm.vue";
  import type { DeliveryProps, RoomListProps } from "@/types";
  import { createDelivery, getDeliveryList, updateDelivery } from "@/api/delivery";
  import { convertImage2string } from "@/utils/image";
  import { DELIVERY_TYPE_OPTIONS, getOptionByCode } from "@/constants";

  interface DeliveryTabProps {
    roomList: RoomListProps[];
    subjectTypeId: string;
  }

  const props = defineProps<DeliveryTabProps>();
  const deliveryList = ref<DeliveryProps[]>([]);
  const deliveryFormRef = ref();

  // 获取状态标签类型
  const getStatusTagType = (status?: number) => {
    switch (status) {
      case 0:
        return "info"; // 待填写
      case 1:
        return "success"; // 已完成
      case 2:
        return "warning"; // 待审核
      default:
        return "info";
    }
  };

  // 获取状态文本
  const getStatusText = (status?: number) => {
    switch (status) {
      case -1:
        return "作废";
      case 1:
        return "已填写";
      case 2:
        return "已签署";
      default:
        return "待填写";
    }
  };

  // 初始化交割单列表
  const initDeliveryList = () => {
    if (!props.roomList) return;

    // 为每个房间创建交割单记录（如果已有交割单则显示，否则显示待创建状态）
    deliveryList.value = props.roomList.map(room => ({
      roomId: room.roomId,
      roomInfo: {
        communityName: room.communityName,
        houseName: room.houseName,
        roomNumber: room.roomNumber
      },
      id: null, // 实际应从后端获取
      status: 0,
      handoverType: null,
      handoverDate: null,
      inspectorName: null,
      items: [],
      remark: null
    }));

    // TODO: 实际项目中应该调用API获取交割单列表
    getDeliveryList({
      subjectType: "tenant",
      subjectTypeId: props.subjectTypeId
    }).then(resp => {
      if (resp.code === 0) {
        // 合并交割单数据
        deliveryList.value = deliveryList.value.map(item => {
          const delivery = resp.data.find(d => d.roomId === item.roomId);
          return delivery ? { ...item, ...delivery } : item;
        });
      }
    });
  };

  // 创建交割单
  const handleCreateDelivery = (roomId: string) => {
    const room = props.roomList.find(r => r.roomId === roomId);

    if (!room) {
      message("房间信息不存在", { type: "error" });
      return;
    }

    addDialog({
      title: `创建交割单 - ${room.houseName}-${room.roomNumber}`,
      props: {
        formInline: {
          subjectType: "tenant",
          subjectTypeId: props.subjectTypeId,
          roomId: roomId,
          handoverType: "CHECK_IN",
          status: 0,
          items: [],
          facilities: room.facilities || [],
          imageList: []
        },
        isViewMode: false
      },
      top: "2vh",
      width: "60vw",
      lockScroll: true,
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () =>
        h(DeliveryCreateForm, {
          ref: deliveryFormRef,
          formInline: null,
          isViewMode: false
        }),
      beforeSure: (done, { options }) => {
        const FormInstance = deliveryFormRef.value;
        const formRuleRef = FormInstance?.getRef?.();
        const formData = FormInstance?.getFormData?.();

        if (!formRuleRef) {
          message("表单引用获取失败", { type: "error" });
          return;
        }

        formRuleRef.validate((valid: boolean) => {
          if (valid) {
            formData.imageList = convertImage2string(formData.imageList || []);

            createDelivery(formData).then(resp => {
              if (resp.code === 0) {
                message("交割单创建成功", { type: "success" });
                initDeliveryList();
                done();
              } else {
                message(resp.message || "创建失败", { type: "error" });
              }
            });
          } else {
            message("请完善必填信息", { type: "warning" });
          }
        });
      }
    });
  };

  // 编辑交割单
  const handleEditDelivery = (delivery: DeliveryProps) => {
    const room = props.roomList.find(r => r.roomId === delivery.roomId);

    if (!room) {
      message("房间信息不存在", { type: "error" });
      return;
    }

    addDialog({
      title: `编辑交割单 - ${room.houseName}-${room.roomNumber}`,
      props: {
        formInline: {
          ...delivery,
          facilities: room.facilities || []
        },
        isViewMode: false
      },
      top: "2vh",
      width: "60vw",
      lockScroll: true,
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () =>
        h(DeliveryCreateForm, {
          ref: deliveryFormRef,
          formInline: null,
          isViewMode: false
        }),
      beforeSure: (done, { options }) => {
        const FormInstance = deliveryFormRef.value;
        const formRuleRef = FormInstance?.getRef?.();
        const formData = FormInstance?.getFormData?.();

        if (!formRuleRef) {
          message("表单引用获取失败", { type: "error" });
          return;
        }

        formRuleRef.validate((valid: boolean) => {
          if (valid) {
            formData.imageList = convertImage2string(formData.imageList || []);
            // TODO: 调用API更新交割单
            updateDelivery(formData).then(resp => {
              if (resp.code === 0) {
                message("交割单更新成功", { type: "success" });
                initDeliveryList();
                done();
              } else {
                message(resp.message || "更新失败", { type: "error" });
              }
            });
          } else {
            message("请完善必填信息", { type: "warning" });
          }
        });
      }
    });
  };

  // 查看交割单详情
  const handleViewDelivery = (delivery: DeliveryProps) => {
    const room = props.roomList.find(r => r.roomId === delivery.roomId);

    if (!room) {
      message("房间信息不存在", { type: "error" });
      return;
    }

    addDialog({
      title: `查看交割单 - ${room.houseName}-${room.roomNumber}`,
      props: {
        formInline: {
          ...delivery,
          facilities: room.facilities || []
        },
        isViewMode: true
      },
      top: "2vh",
      width: "60vw",
      lockScroll: true,
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      hideFooter: true,
      contentRenderer: () =>
        h(DeliveryCreateForm, {
          ref: deliveryFormRef,
          formInline: null,
          isViewMode: true
        })
    });
  };

  onMounted(() => {
    initDeliveryList();
  });

  // 暴露刷新方法给父组件
  defineExpose({
    refresh: initDeliveryList
  });
</script>

<style scoped lang="scss">
  .delivery-tab {
    .delivery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100%, 1fr));
      gap: 20px;
      padding: 0;

      .delivery-card {
        border: 1px solid var(--el-border-color-light);
        transition: all 0.3s ease;

        &:hover {
          border-color: var(--el-color-primary-light-5);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .room-info {
            display: flex;
            align-items: center;
            gap: 8px;

            .room-icon {
              font-size: 18px;
              color: var(--el-color-primary);
            }

            .room-name {
              font-weight: 600;
              color: var(--el-text-color-primary);
            }
          }
        }

        .delivery-content {
          min-height: 120px;

          .delivery-info {
            .delivery-remark {
              margin-top: 12px;
              padding: 8px 12px;
              background: var(--el-fill-color-light);
              border-radius: 4px;
            }
          }

          .no-delivery {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 120px;
          }
        }

        .card-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
      }
    }

    @media (max-width: 768px) {
      .delivery-grid {
        grid-template-columns: 1fr;
      }
    }
  }

  html.dark {
    .delivery-card {
      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
    }
  }
</style>
