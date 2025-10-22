// ==================== 2. src/types/models/community.ts ====================
// 小区相关业务模型

/** 小区基础信息 */
export interface CommunityProps {
  name: string;
  address: string;
  cityId: number;
  adcode: number;
  district: string;
  location: string;
}

/** 小区详细信息（扩展） */
export interface CommunityDetailProps extends CommunityProps {
  id?: number;
  propertyCompany?: string;
  propertyFee?: number;
  buildingCount?: number;
}
