"use client";
import EmployeeForm from "@/components/Dashboard/employees/employee-form";
import { useParams } from "next/navigation";
export default function EditEmployeePage() {
  const params = useParams();
  return <EmployeeForm employeeId={params.id as string} />;
}
