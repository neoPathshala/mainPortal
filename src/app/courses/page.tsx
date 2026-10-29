import { CourseCatalog } from "@/components/courses/CourseCatalog";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Undergraduate Courses & Syllabi | TU neoPathshala Academic Portal",
  description:
    "Explore Tribhuvan University undergraduate degree courses including B.Sc. CSIT, BCA, BIM, BIT, BBM, and BBA. Complete 8-semester syllabi, notes, and past question papers.",
  keywords: [
    "TU BSc CSIT",
    "Tribhuvan University courses",
    "BCA TU syllabus",
    "BIM notes",
    "BIT TU past papers",
    "neoPathshala academic portal",
  ],
};

export default function CoursesPage() {
  return <CourseCatalog />;
}
