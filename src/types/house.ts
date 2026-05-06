import type { OptionItem } from "./common";

export type DirectionValue = "东" | "南" | "西" | "北" | "东南" | "西南" | "东北" | "西北" | "南北" | "东西";

export const DIRECTION_OPTIONS = [
  { label: "东", value: "东" },
  { label: "南", value: "南" },
  { label: "西", value: "西" },
  { label: "北", value: "北" },
  { label: "东南", value: "东南" },
  { label: "西南", value: "西南" },
  { label: "东北", value: "东北" },
  { label: "西北", value: "西北" },
  { label: "南北", value: "南北" },
  { label: "东西", value: "东西" }
] as const satisfies readonly OptionItem<DirectionValue>[];
