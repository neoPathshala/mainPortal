/** Choose a subject symbol by topic; specific topics precede broad matches. */
export function subjectIconName(name:string){
 const text=name.toLowerCase();
 if(/chemistry|chemical/.test(text))return 'chemistry';
 if(/physics|mechanics|electromagnet/.test(text))return 'physics';
 if(/cryptograph|cyber|security/.test(text))return 'security';
 if(/database|data\s*(warehous|mining)|\bdbms\b|\bsql\b/.test(text))return 'database';
 if(/artificial intelligence|machine learning|neural|\bai\b/.test(text))return 'ai';
 if(/e[-\s]?commerce|commerce|business|accounting|management|economics|finance/.test(text))return 'business';
 if(/discrete|graph theory|computer network|networking|telecom/.test(text))return 'network';
 if(/mathematics|\bmath\b|calculus|statistics|algebra|numerical|probability/.test(text))return 'math';
 if(/algorithm|data structure/.test(text))return 'algorithms';
 if(/computer architecture|microprocessor|microcontroller|hardware|electronics/.test(text))return 'hardware';
 if(/digital logic|digital circuit|\blogic\b|\bbinary\b/.test(text))return 'logic';
 if(/theory of computation|automata|formal language|simulation/.test(text))return 'theory';
 if(/operating system|system software|\blinux\b|\bunix\b/.test(text))return 'system';
 if(/software engineering|system analysis|project|internship/.test(text))return 'project';
 if(/information technology|computer fundamental|introduction to computer/.test(text))return 'technology';
 if(/web|internet|cloud|\bhtml\b/.test(text))return 'web';
 if(/programming|object.oriented|\bjava\b|\bpython\b|\bc\+\+/.test(text))return 'programming';
 if(/english|language|communication|writing/.test(text))return 'language';
 return 'book';
}

/** Preserve established symbols on the personal resource page. */
export function legacySubjectIconName(name:string){
 const text=name.toLowerCase();
 if(text.includes('chem'))return 'chemistry';if(text.includes('phys'))return 'physics';
 if(/math|calc|stat|algebra|numerical/.test(text))return 'math';
 if(/logic|digital|binary/.test(text))return 'logic';
 if(/computer|micro|architecture|hardware/.test(text))return 'hardware';
 if(/program|c\+\+|java|python|code|dsa|structure/.test(text))return 'programming';
 if(/english|language|comm|general|writing/.test(text))return 'language';
 if(/data|dbms|sql|warehouse|mining/.test(text))return 'database';
 if(/net|telecom|cloud/.test(text))return 'network';
 if(/security|crypto|cyber/.test(text))return 'security';
 if(/ai|learning/.test(text))return 'ai';if(/web|internet|html/.test(text))return 'web';
 if(/system|os|linux|unix/.test(text))return 'system';
 if(/theory|computation|automata|simulation/.test(text))return 'theory';
 if(/software|engineering|project/.test(text))return 'project';
 return 'book';
}
