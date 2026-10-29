import {periodSlug} from "@/lib/academic-structure";
import { notFound, redirect } from "next/navigation";
import { getNavigationCatalog } from "@/lib/catalog.server";
export default async function Semester({params}:{params:Promise<{id:string}>}){const {id}=await params;const {COURSES,getCourseBySlug}=await getNavigationCatalog();const n=Number(id);if(!COURSES.length||!Number.isInteger(n)||n<1||n>COURSES[0].totalSemesters)notFound();redirect(`/${COURSES[0].slug}/${periodSlug(n,getCourseBySlug(COURSES[0].slug))}`);}
