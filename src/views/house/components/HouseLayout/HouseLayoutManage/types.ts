// 定义 props 接口 - layout 可以是字符串或 HouseLayoutDto 对象
import type { FacilityItemDto, HouseLayoutDto } from "@/types";

export interface HouseLayoutManageFormProps {
  formInline?: {
    id?: string;
    name?: string;
    layout?: HouseLayoutDto;
    tags?: Array<string>;
    facilities?: Array<FacilityItemDto>;
  };
}
