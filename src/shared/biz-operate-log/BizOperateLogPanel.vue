<template>
  <section class="info-section operate-log-section">
    <div class="section-title">
      操作记录
      <el-tag type="info" size="small">{{ operateLogList.length }}条</el-tag>
    </div>
    <div v-loading="loading" class="operate-log-panel">
      <div v-if="operateLogList.length" class="operate-log-list">
        <div v-for="item in operateLogList" :key="item.id" class="operate-record">
          <div class="operate-record__side">
            <div class="operate-record__title">
              <span>{{ item.operateDesc || "业务操作" }}</span>
              <el-tag size="small" effect="light">{{ operateTypeText(item.operateType) }}</el-tag>
            </div>
            <div class="operate-record__meta">
              <span>{{ item.createAt || "—" }}</span>
              <span>操作人：{{ item.operatorName || "—" }}</span>
            </div>
            <div v-if="item.remark" class="operate-record__remark">{{ item.remark }}</div>
          </div>
          <div class="snapshot-diff">
            <template v-if="snapshotDiffList(item).length">
              <div class="snapshot-diff__head">
                <span>变更字段</span>
                <span>修改前</span>
                <span />
                <span>修改后</span>
              </div>
              <div v-for="diff in snapshotDiffList(item)" :key="diff.key" class="snapshot-diff__row">
                <div class="snapshot-diff__field">{{ diff.label }}</div>
                <div class="snapshot-diff__value snapshot-diff__value--before">{{ diff.beforeText }}</div>
                <div class="snapshot-diff__arrow">→</div>
                <div class="snapshot-diff__value snapshot-diff__value--after">{{ diff.afterText }}</div>
              </div>
            </template>
            <div v-else class="snapshot-diff__empty">暂无可展示的字段变更</div>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无操作记录" :image-size="100" />
    </div>
  </section>
</template>

<script setup lang="ts">
  import { ref, watch } from "vue";
  import type { BizOperateLogVo } from "@/types";
  import { getBizOperateLogList, type BizOperateLogQuery } from "@/api/common/biz-operate-log";
  import { BizOperateTypeEnumMeta } from "@/types/generated/enum.meta";

  interface BizOperateLogFieldConfig {
    path: string;
    label: string;
    formatter?: (value: unknown) => string;
  }

  type BizOperateLogWithSnapshot = BizOperateLogVo & {
    beforeSnapshot?: string;
    afterSnapshot?: string;
  };

  const props = withDefaults(
    defineProps<{
      query?: BizOperateLogQuery;
      fieldConfig?: BizOperateLogFieldConfig[];
      fallbackLabelMap?: Record<string, string>;
    }>(),
    {
      fieldConfig: () => [],
      fallbackLabelMap: () => ({})
    }
  );

  const operateLogList = ref<BizOperateLogWithSnapshot[]>([]);
  const loading = ref(false);

  function hasQuery() {
    return Boolean(props.query?.bizId || props.query?.sourceId);
  }

  async function reload() {
    if (!hasQuery()) {
      operateLogList.value = [];
      return;
    }
    loading.value = true;
    try {
      const res = await getBizOperateLogList(props.query);
      operateLogList.value = res.code === 0 ? ((res.data || []) as BizOperateLogWithSnapshot[]) : [];
    } catch {
      operateLogList.value = [];
    } finally {
      loading.value = false;
    }
  }

  const operateTypeText = (type?: string) => {
    if (!type) return "操作";
    return Object.values(BizOperateTypeEnumMeta).find(item => item.code === type)?.name || type;
  };

  function parseSnapshot(snapshot?: string) {
    if (!snapshot) return null;
    try {
      return JSON.parse(snapshot);
    } catch {
      return null;
    }
  }

  function getByPath(data: unknown, path: string) {
    if (!data || typeof data !== "object") return undefined;
    return path.split(".").reduce<unknown>((current, key) => {
      if (!current || typeof current !== "object") return undefined;
      return (current as Record<string, unknown>)[key];
    }, data);
  }

  function stableValue(value: unknown) {
    if (value === undefined || value === null || value === "") return "";
    if (Array.isArray(value)) return JSON.stringify(value.map(item => stableValue(item)));
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  function formatSnapshotValue(value: unknown) {
    if (value === undefined || value === null || value === "") return "—";
    if (Array.isArray(value)) {
      if (!value.length) return "—";
      if (value.every(item => ["string", "number", "boolean"].includes(typeof item))) return value.join("、");
      return `${value.length} 项`;
    }
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  function flattenSnapshot(data: unknown, prefix = "", depth = 0, result: Record<string, unknown> = {}) {
    if (!data || typeof data !== "object" || Array.isArray(data) || depth > 2) return result;
    Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      if (["id", "companyId", "createAt", "updateAt", "createBy", "updateBy"].includes(key)) return;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        flattenSnapshot(value, path, depth + 1, result);
        return;
      }
      result[path] = value;
    });
    return result;
  }

  function fieldLabelFromPath(path: string) {
    const key = path.split(".").at(-1) || path;
    return props.fallbackLabelMap[key] || key;
  }

  const snapshotDiffList = (item: BizOperateLogWithSnapshot) => {
    const before = parseSnapshot(item.beforeSnapshot);
    const after = parseSnapshot(item.afterSnapshot);
    if (!before && !after) return [];

    const configuredDiffList = props.fieldConfig
      .map(field => {
        const beforeValue = getByPath(before, field.path);
        const afterValue = getByPath(after, field.path);
        const beforeStable = stableValue(beforeValue);
        const afterStable = stableValue(afterValue);
        if (beforeStable === afterStable) return null;
        if (!beforeStable && !afterStable) return null;

        return {
          key: field.path,
          label: field.label,
          beforeText: field.formatter ? field.formatter(beforeValue) : formatSnapshotValue(beforeValue),
          afterText: field.formatter ? field.formatter(afterValue) : formatSnapshotValue(afterValue)
        };
      })
      .filter(Boolean)
      .slice(0, 12) as Array<{ key: string; label: string; beforeText: string; afterText: string }>;
    if (configuredDiffList.length) return configuredDiffList;

    const beforeFlat = flattenSnapshot(before);
    const afterFlat = flattenSnapshot(after);
    return Array.from(new Set([...Object.keys(beforeFlat), ...Object.keys(afterFlat)]))
      .map(path => {
        const beforeValue = beforeFlat[path];
        const afterValue = afterFlat[path];
        const beforeStable = stableValue(beforeValue);
        const afterStable = stableValue(afterValue);
        if (beforeStable === afterStable) return null;
        if (!beforeStable && !afterStable) return null;

        return {
          key: path,
          label: fieldLabelFromPath(path),
          beforeText: formatSnapshotValue(beforeValue),
          afterText: formatSnapshotValue(afterValue)
        };
      })
      .filter(Boolean)
      .slice(0, 12) as Array<{ key: string; label: string; beforeText: string; afterText: string }>;
  };

  watch(
    () => [props.query?.bizType, props.query?.bizId, props.query?.sourceType, props.query?.sourceId],
    () => reload(),
    { immediate: true }
  );

  defineExpose({ reload });
</script>

<style scoped lang="scss">
  .info-section {
    margin-bottom: 12px;
    padding: 14px 16px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 10px;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .operate-log-panel {
    min-height: 220px;
  }

  .operate-log-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .operate-record {
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr);
    gap: 12px;
    align-items: start;
    padding: 10px 12px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;

    &__side {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
      padding-right: 12px;
      border-right: 1px solid var(--el-border-color-lighter);
    }

    &__title {
      display: flex;
      gap: 10px;
      align-items: center;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    &__meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 13px;
      line-height: 1.5;
      color: var(--el-text-color-secondary);
    }

    &__remark {
      padding: 7px 9px;
      font-size: 13px;
      line-height: 1.6;
      color: var(--el-text-color-secondary);
      background: var(--el-fill-color-lighter);
      border-radius: 8px;
    }
  }

  .snapshot-diff {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;

    &__head {
      display: grid;
      grid-template-columns: 112px minmax(0, 1fr) 24px minmax(0, 1fr);
      gap: 8px;
      padding: 0 10px 2px;
      font-size: 12px;
      line-height: 1.4;
      color: var(--el-text-color-placeholder);
    }

    &__row {
      display: grid;
      grid-template-columns: 112px minmax(0, 1fr) 24px minmax(0, 1fr);
      gap: 8px;
      align-items: center;
      min-width: 0;
      padding: 8px 10px;
      background: var(--el-fill-color-light);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
    }

    &__field {
      font-size: 13px;
      line-height: 1.5;
      color: var(--el-text-color-secondary);
    }

    &__value {
      min-width: 0;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.5;
      word-break: break-all;

      &--before {
        color: var(--el-color-danger);
      }

      &--after {
        color: var(--el-color-success);
      }
    }

    &__arrow {
      flex-shrink: 0;
      color: var(--el-text-color-placeholder);
      text-align: center;
    }

    &__empty {
      padding: 10px 12px;
      font-size: 13px;
      color: var(--el-text-color-secondary);
      background: var(--el-fill-color-light);
      border: 1px dashed var(--el-border-color);
      border-radius: 8px;
    }
  }

  @media (width <= 1200px) {
    .operate-record {
      grid-template-columns: 1fr;

      &__side {
        padding-right: 0;
        padding-bottom: 10px;
        border-right: 0;
        border-bottom: 1px solid var(--el-border-color-lighter);
      }
    }
  }
</style>
