"use client";
import {periodSlug} from "@/lib/academic-structure";
import {NeoCodeBaseCard} from "@/components/neocodebase-card";
import { useCatalog } from "@/components/catalog-provider";

import {parseSubjectTabs} from "@/lib/subject-tab-settings";
import { normalizeStudyTab, type StudyTab } from "@/lib/study-tabs";


import { semesterLabel } from "@/lib/semester-label";
import { useStudentPreferences } from "@/components/student-preferences-provider";
import dynamic from "next/dynamic";
import { StudyContentSkeleton } from "@/components/loading/StudySkeletons";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FileText, Code, FileQuestion, BookMarked, Video, Layers, Sparkles, Eye, User } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CourseDetail, PDFDocument, PYQSolution, VideoLecture } from "@/data/courses-db";
const TextbooksView = dynamic(() => import("./TextbooksView").then(module => module.TextbooksView), { loading: () => <StudyContentSkeleton tab="textbooks" /> });
const CourseUnitsSection = dynamic(() => import("./CourseUnitsSection").then(module => module.CourseUnitsSection), { loading: () => <StudyContentSkeleton tab="syllabus" /> });
const VideoLecturesSection=dynamic(()=>import("./VideoLecturesSection").then(module=>module.VideoLecturesSection),{loading:()=> <StudyContentSkeleton tab="videos"/>});
const PDFViewerModal = dynamic(() => import("./PDFViewerModal").then(module => module.PDFViewerModal), { ssr: false });
const ImportantQuestionsView = dynamic(() => import("./ImportantQuestionsView").then(module => module.ImportantQuestionsView), { loading: () => <StudyContentSkeleton tab="important" /> });
import { StudyMetadata, StudyMetadataProvider } from "./StudyMetadata";
import { SubjectExamInfo } from "./SubjectExamInfo";
const NotesStudyView = dynamic(() => import("./NotesStudyView").then(module => module.NotesStudyView), { loading: () => <StudyContentSkeleton tab="notes" /> });
const PastPapersView = dynamic(() => import("./PastPapersView").then(module => module.PastPapersView), { loading: () => <StudyContentSkeleton tab="pyqs" /> });
const SubjectDiscussions = dynamic(() => import("./SubjectDiscussions").then(module => module.SubjectDiscussions), { loading: () => <StudyContentSkeleton tab="discussions" /> });

interface SubjectClientViewProps {
  courseSlug: string;
  slug: string;
  subjectName: string;
  subjectCode?: string;
  subjectCreditHours?: number;
  semesterInfo: { id: number; name: string };
  courseDetail?: CourseDetail;
  pyqs: PYQSolution[];
  pdfDocs: PDFDocument[];
  videos: VideoLecture[];
  dbResources: any[];
  initialTab?: "chapters" | StudyTab;
}

export function SubjectClientView({
  courseSlug,
  slug,
  subjectName,
  subjectCode,
  subjectCreditHours,
  semesterInfo,
  courseDetail,
  pyqs,
  pdfDocs,
  videos,
  dbResources,
  initialTab,
}: SubjectClientViewProps) {
  const { getCourseBySlug,getCurriculumSubjects, resolveSubjectRoute } = useCatalog();
  const curriculumSubject = getCurriculumSubjects(courseSlug,semesterInfo.id).find(item => item.slug === slug || resolveSubjectRoute(courseSlug,semesterInfo.id,item.slug)?.contentSlug === slug);
  const displayCode = subjectCode || courseDetail?.code || curriculumSubject?.code;
  const displayCredits = subjectCreditHours || courseDetail?.creditHours || curriculumSubject?.creditHours || 3;
  const preferences = useStudentPreferences();
  const backHref = `/${courseSlug || preferences.courseSlug || "csit"}/${periodSlug(semesterInfo.id,getCourseBySlug(courseSlug))}`;
  const pathname = usePathname();
  const routeParts = pathname.split('/').filter(Boolean);
  const subjectPath = routeParts[0] === 'subject'
    ? `${backHref}/${encodeURIComponent(slug)}`
    : '/' + routeParts.slice(0, routeParts[0] === 'courses' ? 4 : 3).join('/');
  const tabs=courseDetail?.studyTabs||parseSubjectTabs(courseDetail?.optionalTabs);
  const enabledTabs=tabs.order.filter(tab=>tabs.visible[tab]);
  const requestedTab:StudyTab=normalizeStudyTab(pathname===subjectPath?initialTab:pathname.startsWith(subjectPath+'/')?pathname.slice(subjectPath.length+1).split('/')[0]:initialTab);
  const activeTab=enabledTabs.includes(requestedTab)?requestedTab:enabledTabs[0];
  const [visitedVideo,setVisitedVideo]=useState(activeTab==='videos');
  useEffect(()=>{if(activeTab==='videos')setVisitedVideo(true);},[activeTab]);
  function preloadTab(tab:StudyTab){

    if(tab==='discussions')void import('./SubjectDiscussions').catch(()=>{});
    if(tab==='important')void import('./ImportantQuestionsView').catch(()=>{});
    if(tab==='notes')void import('./NotesStudyView').catch(()=>{});
    if(tab==='videos')void import('./VideoLecturesSection').catch(()=>{});
    if(tab==='pyqs')void import('./PastPapersView').catch(()=>{});
    if(tab==='syllabus')void import('./CourseUnitsSection').catch(()=>{});
    if(tab==='textbooks')void import('./TextbooksView').catch(()=>{});
  }
  const [selectedPDF, setSelectedPDF] = useState<PDFDocument | null>(null);
  const [isPDFViewerOpen, setIsPDFViewerOpen] = useState(false);

  const chapterResources = useMemo(() => ({
    notes: pdfDocs.filter(doc => doc.type === "notes" && doc.unitId !== undefined).map(doc => ({...doc, unitId: doc.unitId!, unitName: doc.unitName || ""})),
    videos: videos.filter(video => video.unitId !== undefined).map(video => ({...video, unitId: video.unitId!})),
    mcqs: [], solutions: [], formulae: [],
  }), [pdfDocs, videos]);

  // Combine static PDF docs with DB resources of type 'notes', 'papers', 'syllabus', etc.
  const allNotesDocs = Array.from(new Map([
    ...pdfDocs,
    ...dbResources.filter(r=>r.type!=="videos").map((r) => ({
      id: r.id,
      subjectSlug: slug,
      title: r.title,
      type: r.type as any,
      author: r.author || "",
      pages: 0,
      fileSize: "",
      downloadUrl: r.url || "#",
      unitId:r.unitId,
    })),
  ].reverse().map(doc=>[doc.id,doc])).values());

  const handleOpenPDF = (doc: PDFDocument) => {
    setSelectedPDF(doc);
    setIsPDFViewerOpen(true);
  };

  const handleOpenViewerFromTitle = (title: string) => {
    const found = allNotesDocs.find((d) => d.title.toLowerCase().includes(title.toLowerCase()));
    if (found) {
      handleOpenPDF(found);
    } else {
      handleOpenPDF(allNotesDocs[0] || {
        id: "temp",
        subjectSlug: slug,
        title: title || `${subjectName} Examination Solution`,
        type: "papers",
        author: "Aashish Adhikari",
        pages: 6,
        fileSize: "1.8 MB",
        downloadUrl: "#",
      });
    }
  };

  return (
    <StudyMetadataProvider subject={slug}><div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* ── Breadcrumb & Top Links ────────────────────────────────────── */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            href={backHref}
            className="hover:text-primary transition-colors"
          >
            {semesterLabel(semesterInfo.id,getCourseBySlug(courseSlug))}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{subjectName}</span>
        </div>

        {/* ── Hero Card ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="grid min-w-0 items-center gap-x-6 gap-y-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:col-span-2">
              {displayCode && (
                <><span className="font-mono font-medium text-primary">
                  {displayCode}
                </span><span aria-hidden="true">•</span></>
              )}
              <span>{semesterLabel(semesterInfo.id,getCourseBySlug(courseSlug))}</span><span aria-hidden="true">•</span>
              <span>{displayCredits} credits</span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{subjectName}</h1>

            <div className="flex sm:col-start-2 sm:row-start-2 sm:justify-end">
            {allNotesDocs[0] && (
              <Button
                onClick={() => handleOpenPDF(allNotesDocs[0])}
                size="sm"
                className="gap-2 text-xs"
              >
                <Eye className="h-4 w-4" />
                <span>Open notes</span>
              </Button>
            )}

            </div>
            <div className="sm:col-span-2"><StudyMetadata entity="subject" showUnset /><SubjectExamInfo slug={slug} /></div>
          </div>
        </div>
      </div>

      <div role="tablist" aria-label="Subject resources" className="sticky top-[72px] z-20 flex items-center gap-1 overflow-x-auto border-b border-border bg-background/95 px-1 py-2 text-sm backdrop-blur tab-scrollbar">
        {([
          ["notes", "Notes", BookOpen],
          ["videos", "Videos", Video],
          ["syllabus", "Syllabus", Layers],
          ["pyqs", "Question Banks", FileQuestion],
          ["textbooks", "Textbooks", BookMarked],
          ["important", "Important Questions", Sparkles],
          ["discussions", "Discussions", User],
          ["viva", "Viva", FileQuestion],
          ["practical", "Practicals", Code],
        ] as const).filter(([id]) => enabledTabs.includes(id)).sort((a,b)=>enabledTabs.indexOf(a[0])-enabledTabs.indexOf(b[0])).map(([id, label, Icon]) => <Link key={id} href={`${subjectPath}/${id === "important" ? "important-questions" : id}`} scroll={false} onPointerEnter={()=>preloadTab(id)} onFocus={()=>preloadTab(id)} onClick={event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();const href=`${subjectPath}/${id==='important'?'important-questions':id}`;if(window.location.pathname!==href)window.history.pushState(null,'',href);}} role="tab" aria-selected={activeTab === id} className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2.5 font-medium transition-colors ${activeTab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="h-4 w-4" />{label}</Link>)}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      <div className="w-full">
        {(activeTab === "practical"||activeTab === "viva")&&courseDetail?.optionalTabs?.[activeTab]===true&&<section className="rounded-xl border border-border bg-card p-5"><h2 className="text-lg font-semibold">{activeTab==='viva'?'Viva':'Practicals'}</h2><div className="mt-5 divide-y divide-border">{allNotesDocs.filter(doc=>doc.type===activeTab).map(doc=><button key={doc.id} type="button" onClick={()=>handleOpenPDF(doc)} className="flex w-full items-center gap-3 py-4 text-left text-sm hover:text-primary"><FileText className="size-4"/>{doc.title}</button>)}{!allNotesDocs.some(doc=>doc.type===activeTab)&&<p className="py-8 text-sm text-muted-foreground">No resources added yet.</p>}</div></section>}
        {activeTab === "discussions" && <SubjectDiscussions subject={slug} />}
        {activeTab === "textbooks" && <TextbooksView courseDetail={courseDetail} allNotesDocs={allNotesDocs} handleOpenPDF={handleOpenPDF} />}
        {activeTab === "important" && <ImportantQuestionsView course={courseDetail} questions={pyqs} />}

        {/* 1. PYQS TAB */}
        {activeTab === "pyqs" && (
          <PastPapersView
            basePath={`${subjectPath}/pyqs`}
            pyqs={pyqs}
            subjectName={subjectName}
            course={courseDetail}
            onOpenPDFViewer={handleOpenViewerFromTitle}
          />
        )}

        {/* Chapter notes workspace */}
        {activeTab === "notes" && <><NeoCodeBaseCard subjectName={subjectName} subjectSlug={slug}/><NotesStudyView basePath={`${subjectPath}/notes`} course={courseDetail} docs={allNotesDocs} resources={chapterResources} pyqs={pyqs} onOpenPDF={handleOpenPDF} /></>}

        {/* 3. SYLLABUS & UNITS TAB */}
        {activeTab === "syllabus" && courseDetail && (
          <CourseUnitsSection course={courseDetail} />
        )}

        {/* 4. VIDEOS TAB */}
        {enabledTabs.includes("videos")&&(visitedVideo||activeTab==="videos")&&<div hidden={activeTab !== "videos"}><VideoLecturesSection videos={videos} subjectName={subjectName} /></div>}
      </div>

      {/* ── In-Browser PDF Viewer Modal ─────────────────────────────────── */}
      {isPDFViewerOpen && <PDFViewerModal
        isOpen={isPDFViewerOpen}
        onClose={() => setIsPDFViewerOpen(false)}
        document={selectedPDF}
        subjectName={subjectName}
      />}
    </div></StudyMetadataProvider>
  );
}
