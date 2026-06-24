"use client";
import EmployeeProfile from "@/components/Dashboard/employees/employee-profile";
import { useParams } from "next/navigation";
export default function EmployeeProfilePage() {
  const params = useParams();
  return <EmployeeProfile employeeId={params.id as string} />;
}
