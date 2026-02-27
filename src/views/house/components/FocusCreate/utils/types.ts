// src/views/house/components/FocusCreate/utils/types.ts

import type { FocusBuildingDto, FocusCreateDto, FocusHouseDto } from "@/types";

export interface FormProps {
  formInline: FocusCreateDto;
}

/**
 * FocusBuildingDto 在后端类型中 housesStatusOfFloors 为 { [key: string]: Array<FocusHouseDto> }，
 * 前端运行时用 Map 结构操作更高效，同时需要额外的 UI 状态字段（selectedFloor、isNew）。
 * 用 Omit 剔除原字段后重新声明，避免类型冲突。
 */
export type LocalFocusBuildingDto = Omit<FocusBuildingDto, "housesStatusOfFloors"> & {
  /** 当前选中楼层（纯前端 UI 状态） */
  selectedFloor?: number;
  /** 是否为新增楼栋（纯前端 UI 状态） */
  isNew?: boolean;
  /**
   * 运行时使用 Map 结构操作；序列化提交前再还原为后端格式
   * { [floor: string]: Array<FocusHouseDto> }
   */
  housesStatusOfFloors?: Map<number, Map<string, FocusHouseDto>>;
};
