interface CommunityProps {
  name: string;
  address: string;
  cityId: number;
  // 行政区域
  adcode: number;
  district: string;
  location: string;
}

// 表单定义
interface EntireFormItemProps {
  id: number;
  businessMode: number;
  focusCode: string;
  focusName: string;
  address: string;
  community: CommunityProps;
  water: string;
  electricity: string;
  heating: string;
  hasGas: boolean;
  hasElevator: boolean;
  facilities: string[];
}

// 表单
interface EntireFormProps {
  formInline: EntireFormItemProps;
}

export type { EntireFormItemProps, EntireFormProps };
