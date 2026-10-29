"use client";

import {SyllabusContent} from "@/components/syllabus-content";
import { semesterLabel } from "@/lib/semester-label";
import type { CourseDetail } from "@/data/courses-db";

export function CourseUnitsSection({ course }: { course: CourseDetail }) {
  if(course.syllabus)return <article aria-label="Syllabus" className="rounded-xl border border-border bg-card px-5 py-7 sm:px-9 sm:py-9"><SyllabusContent document={course.syllabus}/></article>;
  return <article className="rounded-xl border border-border bg-card px-5 py-7 sm:px-9 sm:py-9">
    <header className="border-b border-border pb-6">
      <p className="text-xs text-muted-foreground">Tribhuvan University · Institute of Science and Technology</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{course.name} Syllabus</h2>
      <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-5 text-sm sm:grid-cols-4">
        {[["Course code", course.code], ["Credit hours", course.creditHours], ["Course nature", course.nature], [course.studySystem==='year'?"Year":"Semester", semesterLabel(course.semester,course)], ["Theory marks", course.fullMarks.theory], ["Practical marks", course.fullMarks.practical], ["Pass marks", course.fullMarks.passMarks], ["Lecture hours", course.lectureHours]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}
      </dl>
    </header>
    <div className="max-w-4xl space-y-8 pt-7 text-sm leading-7">
      <section><h3 className="mb-2 text-base font-semibold">Course description</h3><p className="text-muted-foreground">{course.description}</p></section>
      {!!course.objectives.length && <section><h3 className="mb-2 text-base font-semibold">Course objectives</h3><ul className="list-disc space-y-1 pl-5 text-muted-foreground">{course.objectives.map((item, index) => <li key={index}>{item}</li>)}</ul></section>}
      <section>
        <h3 className="mb-5 text-base font-semibold">Course contents</h3>
        <div className="space-y-6">{course.units.filter(unit=>!unit.hiddenResourceTypes?.includes("syllabus")).map(unit => <section key={unit.id} id={`syllabus-unit-${unit.unitNumber}`} className="border-b border-border pb-6 last:border-0 last:pb-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2"><h4 className="font-semibold">Unit {unit.unitNumber}: {unit.title}</h4><span className="text-xs text-muted-foreground">{unit.hours} hours</span></div>
          <ol className="mt-2 space-y-1 text-muted-foreground">{unit.topics.map((topic, index) => <li key={index} className="flex gap-3"><span className="shrink-0 text-xs tabular-nums leading-7">{unit.unitNumber}.{index + 1}</span><span>{topic}</span></li>)}</ol>
        </section>)}</div>
      </section>
      {!!course.textbooks.length && <section className="border-t border-border pt-6"><h3 className="mb-2 text-base font-semibold">Textbooks</h3><ol className="list-decimal space-y-2 pl-5 text-muted-foreground">{course.textbooks.map((book, index) => <li key={index}><span className="text-foreground">{book.title}</span> — {book.author}{book.edition ? `, ${book.edition}` : ""}</li>)}</ol></section>}
      {!!course.references.length && <section><h3 className="mb-2 text-base font-semibold">Reference books</h3><ol className="list-decimal space-y-2 pl-5 text-muted-foreground">{course.references.map((book, index) => <li key={index}><span className="text-foreground">{book.title}</span> — {book.author}</li>)}</ol></section>}
    </div>
  </article>;
}
