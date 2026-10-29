import "server-only";
import {getStudentNotices} from "@/lib/student-notices.server";
import { UrgentNoticeTicker } from "./UrgentNoticeTicker";
export async function PinnedNoticeBanner(){const notices=(await getStudentNotices().then(feed=>feed.notices).catch(()=>[])).filter(n=>n.isPinned||n.showInTicker);return notices.length?<UrgentNoticeTicker notices={notices}/>:null;}
