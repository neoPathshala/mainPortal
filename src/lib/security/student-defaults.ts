
import { getNavigationCatalog } from "@/lib/catalog.server";
import "server-only";
import { cache } from "react";
import { getSession } from "./auth";

export const getStudentDefaults = cache(async () => {
  try {
    const auth = await getSession();
    if (auth) {
      let courseSlug:string|null=null;
      if(auth.user.bio){
        try{const {resolveStudentCourse}=await getNavigationCatalog();courseSlug=resolveStudentCourse(auth.user.bio)?.slug||null;}catch{ /* A catalogue outage does not invalidate the session. */ }
      }
      return { authenticated: true, courseSlug, semester: auth.user.semester && auth.user.semester >= 1 && auth.user.semester <= 8 ? auth.user.semester : null };
    }
  } catch {}
  return { authenticated: false, courseSlug: null, semester: null };
});
