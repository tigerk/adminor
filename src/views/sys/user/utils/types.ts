interface UserFormItemProps {
  /** 用于判断是`新增`还是`修改` */
  title: string;
  /** 公司用户id */
  companyUserId?: number;
  /** 用户id */
  userId?: number;
  higherDeptOptions: Record<string, unknown>[];
  deptId?: number;
  nickname: string;
  username: string;
  realName: string;
  idType?: number;
  idNo: string;
  password: string;
  phone: string | number;
  email: string;
  gender: string | number;
  status: number;
  dept?: {
    id?: number;
    name?: string;
  };
  remark: string;
}
interface UserFormProps {
  formInline: UserFormItemProps;
}

interface RoleFormItemProps {
  username: string;
  nickname: string;
  /** 角色列表 */
  roleOptions: any[];
  /** 选中的角色列表 */
  ids: Record<number, unknown>[];
}
interface RoleFormProps {
  formInline: RoleFormItemProps;
}

export type { UserFormItemProps, UserFormProps, RoleFormItemProps, RoleFormProps };
