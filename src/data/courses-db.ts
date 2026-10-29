export interface CourseUnit {
  slug?: string;
  id: number;
  unitNumber: number;
  title: string;
  hours: number;
  weightage: number; // TU board marks weightage (e.g. 10, 12, 14)
  topics: string[];
  summary?: string;
  tags?: string[];
  hiddenResourceTypes?: string[];
}

export interface SolutionImage {
  id: string;
  url: string;
  caption: string;
  type?: "handwritten" | "diagram" | "circuit" | "flowchart" | "graph" | "screenshot" | "kmap";
  width?: number;
  height?: number;
}

export interface PYQSolution {
  paperSection?: string;
  id: string;
  subjectSlug: string;
  year: number; // 2080, 2079, 2078, 2076, 2075
  examType: "Regular" | "Back" | "Model";
  questionNo: string; // "Q1", "Q2 (a)", "Q3"
  marks: number; // 5, 8, 10
  unitId?: number;
  unitName: string;
  questionText: string;
  questionImages?: string[];
  unitIds?: number[];

  // Step-by-step Text Solution
  textSolution: {
    overview: string;
    steps?: { title: string; content: string }[];
    codeSnippet?: {
      language: string;
      code: string;
      explanation: string;
    };
    diagramOrFormula?: string;
    examTips: string;
  };

  // Video Solution
  videoSolution?: {
    videoUrl: string;
    youtubeId?: string;
    title: string;
    instructor: string;
    duration: string;
    timestamps?: { time: string; label: string }[];
    keyTakeaways?: string[];
  };

  // Image Solutions (Diagrams, Circuit schematics, K-Maps, Handwritten workings)
  imageSolutions?: SolutionImage[];

  pdfUrl?: string;
  solutionVideos?: string[];
  solutionPdfs?: string[];
  referenceLinks?: string[];
}

export interface VideoLecture {
  thumbnailUrl?:string;
  estimatedMarks?:number;
  unitId?: number;
  tags?: string[];
  kind?: string;
  description?: string;
  id: string;
  subjectSlug: string;
  title: string;
  videoUrl: string;
  youtubeId?: string;
  duration: string;
  instructor: string;
  unitName: string;
  order: number;
}

export interface PDFDocument {
  unitId?: number;
  unitName?: string;
  description?: string;
  id: string;
  subjectSlug: string;
  title: string;
  type: "notes" | "papers" | "syllabus" | "practical" | "viva" | "books";
  author: string;
  pages: number;
  fileSize: string;
  downloadUrl: string;
  previewUrl?: string;
  formattedContent?: {
    subtitle: string;
    institution: string;
    academicYear: string;
    sections: {
      heading: string;
      body: string;
      subsections?: { title: string; content: string; code?: string }[];
    }[];
  };
}

export interface ChapterMCQ {
  id: string;
  subjectSlug: string;
  unitId: number;
  unitName: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tuFrequency?: "High" | "Medium" | "Expected" | "TU Board Frequent";
  examYear?: number;
  tags?: string[];
}

export interface ChapterNote {
  id: string;
  subjectSlug: string;
  unitId: number;
  unitName: string;
  title: string;
  author: string;
  pages: number;
  fileSize: string;
  downloadUrl: string;
  previewUrl?: string;
  summary?: string;
  keyTopics?: string[];
}

export interface ChapterVideo {
  id: string;
  subjectSlug: string;
  unitId: number;
  unitName: string;
  title: string;
  videoUrl: string;
  youtubeId?: string;
  duration: string;
  instructor: string;
  keyTakeaways?: string[];
  order?: number;
}

export interface ChapterSolution {
  id: string;
  subjectSlug: string;
  unitId: number;
  unitName: string;
  year: number;
  questionNo: string;
  marks: number;
  questionText: string;
  textSolution: {
    overview: string;
    steps?: { title: string; content: string }[];
    codeSnippet?: {
      language: string;
      code: string;
      explanation: string;
    };
    diagramOrFormula?: string;
    examTips: string;
  };
  videoSolution?: {
    videoUrl: string;
    youtubeId?: string;
    title: string;
    instructor: string;
    duration: string;
    timestamps?: { time: string; label: string }[];
    keyTakeaways?: string[];
  };
  imageSolutions?: SolutionImage[];
}

export interface ChapterFormula {
  id: string;
  subjectSlug: string;
  unitId: number;
  unitName: string;
  title: string;
  category: "Formula" | "Theorem" | "Syntax Rule" | "Time Complexity" | "High-Yield Summary" | "Exam Tip";
  formulaOrKeyPoint: string;
  explanation?: string;
}

export interface ChapterResourceBundle {
  notes: ChapterNote[];
  mcqs: ChapterMCQ[];
  videos: ChapterVideo[];
  solutions: ChapterSolution[];
  formulae: ChapterFormula[];
}

export interface CourseDetail {
  studySystem?:import("@/lib/academic-structure").StudySystem;
  syllabus?: import("@/lib/syllabus").SyllabusDocument;
  paperFormat?: "bit"|"csit";
  paperHeaders?: Record<string,Record<string,string>>;
  universityName?:string;
  programName?:string;
  faculty?:string;
  optionalTabs?: {practical:boolean;viva:boolean};
  studyTabs?: import("@/lib/subject-tab-settings").SubjectTabSettings;
  slug: string;
  name: string;
  code: string;
  creditHours: number;
  lectureHours: number;
  semester: number;
  nature: "Theory + Practical" | "Theory Only" | "Project";
  fullMarks: {
    theory: number;
    practical: number;
    passMarks: number;
  };
  description: string;
  objectives: string[];
  units: CourseUnit[];
  textbooks: { title: string; author: string; edition?: string }[];
  references: { title: string; author: string }[];
}


export const COURSES_DATABASE: Record<string,CourseDetail> = {};
export const PYQ_DATABASE: PYQSolution[] = [];
export const PDF_DOCUMENTS_DATABASE: PDFDocument[] = [];
export const VIDEO_LECTURES_DATABASE: VideoLecture[] = [];
export function getCourseDetail(slug: string): CourseDetail | undefined {
  return COURSES_DATABASE[slug];
}

export function getSubjectPYQs(subjectSlug: string, yearFilter?: number, unitFilter?: number): PYQSolution[] {
  let list = PYQ_DATABASE.filter((p) => p.subjectSlug === subjectSlug);
  if (yearFilter && yearFilter > 0) {
    list = list.filter((p) => p.year === yearFilter);
  }
  if (unitFilter && unitFilter > 0) {
    list = list.filter((p) => p.unitId === unitFilter);
  }
  return list;
}

export function getSubjectPDFs(subjectSlug: string, typeFilter?: string): PDFDocument[] {
  let list = PDF_DOCUMENTS_DATABASE.filter((d) => d.subjectSlug === subjectSlug);
  if (typeFilter && typeFilter !== "all") {
    list = list.filter((d) => d.type === typeFilter);
  }
  return list;
}

export function getSubjectVideos(subjectSlug: string): VideoLecture[] {
  return VIDEO_LECTURES_DATABASE.filter((v) => v.subjectSlug === subjectSlug).sort((a, b) => a.order - b.order);
}

export function getChapterResources(subjectSlug: string, unitId?: number): ChapterResourceBundle {
  const store: ChapterResourceBundle = {notes:[],mcqs:[],videos:[],solutions:[],formulae:[]};
  const filterBySubAndUnit = <T extends { subjectSlug: string; unitId: number }>(items: T[] = []) => {
    return (items || []).filter((item) => {
      const matchSub = item.subjectSlug.toLowerCase() === subjectSlug.toLowerCase();
      if (!matchSub) return false;
      if (unitId !== undefined && unitId > 0) {
        return item.unitId === unitId;
      }
      return true;
    });
  };

  return {
    notes: filterBySubAndUnit(store.notes),
    mcqs: filterBySubAndUnit(store.mcqs),
    videos: filterBySubAndUnit(store.videos),
    solutions: filterBySubAndUnit(store.solutions),
    formulae: filterBySubAndUnit(store.formulae),
  };
}

