export const SUBJECT_TABS=['notes','videos','syllabus','pyqs','textbooks','important','discussions','viva','practical'] as const;
export type SubjectTab=typeof SUBJECT_TABS[number];
export type SubjectTabSettings={order:SubjectTab[];visible:Record<SubjectTab,boolean>};
export function parseSubjectTabs(input:unknown):SubjectTabSettings{
 const value=(input&&typeof input==='object'?input:{}) as Record<string,unknown>;
 const order=value.order===undefined?[...SUBJECT_TABS]:value.order;
 if(!Array.isArray(order)||order.length!==SUBJECT_TABS.length||new Set(order).size!==SUBJECT_TABS.length||order.some(tab=>!SUBJECT_TABS.includes(tab)))throw Error('Choose a valid tab order.');
 const visible={} as Record<SubjectTab,boolean>;
 for(const tab of SUBJECT_TABS){if(value[tab]!==undefined&&typeof value[tab]!=='boolean')throw Error('Choose valid tab visibility.');visible[tab]=value[tab]===undefined?!['practical','viva'].includes(tab):value[tab]===true;}
 if(!Object.values(visible).some(Boolean))throw Error('Keep at least one tab enabled.');
 return {order:order as SubjectTab[],visible};
}
