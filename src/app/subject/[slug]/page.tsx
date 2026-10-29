import {periodSlug} from "@/lib/academic-structure";
import { notFound, redirect } from "next/navigation";
import { getNavigationCatalog } from "@/lib/catalog.server";
export default async function Subject({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const {getSubject,getCourseBySlug}=await getNavigationCatalog();const subject=getSubject(slug);if(!subject)notFound();redirect(`/${subject.courseSlug}/${periodSlug(subject.semester||1,getCourseBySlug(subject.courseSlug))}/${subject.slug}`);}
