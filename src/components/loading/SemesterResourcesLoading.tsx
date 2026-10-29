'use client';
import {useStudentPreferences} from '@/components/student-preferences-provider';
import {ResourcesSkeleton} from './ResourceSkeletons';

export function SemesterResourcesLoading(){
  const {authenticated}=useStudentPreferences();
  return <ResourcesSkeleton exploring={!authenticated}/>;
}
