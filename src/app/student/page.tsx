import { redirect } from "next/navigation";

export default function StudentPage() {
  // Administrative student management is restricted to Admin Panel (admin.neopathshala.com)
  redirect("/student/profile");
}
