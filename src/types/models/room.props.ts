export interface RoomLockRecordProps {
  id: string | number;
  roomId: string | number;
  lockReason?: number;
  lockReasonName?: string;
  startTime?: string;
  endTime?: string;
  remark?: string;
  lockStatus?: number;
  lockStatusName?: string;
  createBy?: string | number;
  createByName?: string;
  createTime?: string;
  updateBy?: string | number;
  updateByName?: string;
  updateTime?: string;
}
