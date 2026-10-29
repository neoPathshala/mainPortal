import { redirect } from "next/navigation";
import { ENTRANCE_PORTAL_URL } from "@/lib/entrance-portal";

export default function EntranceRedirect() {
  redirect(ENTRANCE_PORTAL_URL);
}
