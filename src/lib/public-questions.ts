import { cache } from "react";
import { getCatalog } from "./catalog.server";
export const publicQuestions=cache(async(subjectSlug?:string)=>({questions:(await getCatalog(subjectSlug)).PYQ_DATABASE,partial:false}));
