import type {ComponentProps} from 'react';
import {cn} from '@/lib/utils';

/** Desktop sidebar stays below navigation and stops at the end of its section. */
export function StickySidebar({className,...props}:ComponentProps<'aside'>){
 return <aside {...props} className={cn('min-w-0 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto lg:[scrollbar-width:thin]',className)}/>;
}
