export function youtubeDuration(value:unknown){
 if(typeof value!=='string')return '';
 const match=/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(value);
 if(!match)return '';
 const total=Math.floor(Number(match[1]||0)*86400+Number(match[2]||0)*3600+Number(match[3]||0)*60+Number(match[4]||0));
 if(!total)return '';
 const hours=Math.floor(total/3600),minutes=Math.floor(total%3600/60),seconds=String(total%60).padStart(2,'0');
 return hours?`${hours}:${String(minutes).padStart(2,'0')}:${seconds}`:`${minutes}:${seconds}`;
}
