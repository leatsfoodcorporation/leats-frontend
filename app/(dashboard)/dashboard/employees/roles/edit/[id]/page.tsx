"use client";
import RoleForm from "@/components/Dashboard/employees/roles/role-form";
import { useParams } from "next/navigation";
export default function EditRolePage() {
  const params = useParams();
  return <RoleForm roleId={params.id as string} />;
}
