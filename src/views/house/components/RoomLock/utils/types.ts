import type { RoomLockDto } from "@/types";

interface RoomLockFormItemProps extends RoomLockDto {
  roomNumber?: string;
  houseName?: string;
}

interface RoomLockFormProps {
  formInline: RoomLockFormItemProps;
}

export type { RoomLockFormItemProps, RoomLockFormProps };

