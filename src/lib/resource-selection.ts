type Course={slug:string;name:string;shortName:string;university:string;totalSemesters:number};
type University={id:string;name:string;shortName:string};
const normal=(value:string)=>value.trim().toLowerCase();
export function parentUniversity(course:Course|undefined,universities:University[]){return course?universities.find(university=>[university.id,university.name,university.shortName].some(value=>normal(value)===normal(course.university))):undefined;}
export function resourceCourse(courses:Course[],requested:string,enrolled?:string|null){
 const match=(value:string)=>courses.find(course=>[course.slug,course.name,course.shortName].some(name=>normal(name)===normal(value)));
 return (enrolled?match(enrolled):undefined)||match(requested)||courses[0];
}
