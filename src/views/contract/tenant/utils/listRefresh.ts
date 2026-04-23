import { ref } from "vue";

const tenantListRefreshVersion = ref(0);

export function markTenantListRefresh() {
  tenantListRefreshVersion.value = Date.now();
}

export function useTenantListRefreshVersion() {
  return tenantListRefreshVersion;
}
