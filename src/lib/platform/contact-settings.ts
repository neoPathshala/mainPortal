export const CONTACT_SETTINGS_KEY = "neopathshala-contact-page";
export interface ContactLink { id:string; label:string; value:string; detail:string; href:string; enabled:boolean }
export interface ContactSettings { links:ContactLink[]; showForm:boolean; showHelp:boolean; showPrivacy:boolean; showDescriptions:boolean; showIntro:boolean }
export const DEFAULT_CONTACT_SETTINGS:ContactSettings = {
  showForm:true,showHelp:true,showPrivacy:true,showDescriptions:true,showIntro:true,
  links:[
    {id:"email",label:"Email Us",value:"contact@neopathshala.com",detail:"Account help, feedback, and general enquiries",href:"mailto:contact@neopathshala.com",enabled:true},
    {id:"whatsapp",label:"WhatsApp",value:"+977 9765882829",detail:"Start a conversation on WhatsApp",href:"https://wa.me/9779765882829",enabled:true},
    {id:"phone",label:"Text/Call Us",value:"+977 9765882829",detail:"Get in touch directly by phone",href:"tel:+9779765882829",enabled:true},
    {id:"sms",label:"Text Us",value:"+977 9765882829",detail:"Prefer a message? Send us an SMS",href:"sms:+9779765882829",enabled:true},
    {id:"support",label:"Support",value:"24/7 Support",detail:"Reach out whenever you need a hand",href:"mailto:contact@neopathshala.com?subject=Support%20request",enabled:true},
    ...["Instagram","Facebook","YouTube","TikTok","LinkedIn"].map(label => ({id:label.toLowerCase(),label,value:"",detail:"",href:"",enabled:false})),
  ],
};
export function validContactHref(value:string) {
  if (!value || /[\x00-\x20\x7f]/.test(value)) return false;
  try { const url=new URL(value); return ["https:","mailto:","tel:","sms:"].includes(url.protocol) && !url.username && !url.password && !/%(?:0a|0d)/i.test(value); } catch { return false; }
}
export function parseContactSettings(value:unknown):ContactSettings {
  if (!value || typeof value!=="object") throw new Error("Invalid contact settings.");
  const input=value as Record<string,unknown>;
  const result=structuredClone(DEFAULT_CONTACT_SETTINGS);
  for (const key of ["showForm","showHelp","showPrivacy","showDescriptions","showIntro"] as const) {
    if (typeof input[key]!=="boolean") throw new Error("Choose visibility for every section.");
    result[key]=input[key];
  }
  if (!Array.isArray(input.links) || input.links.length!==result.links.length) throw new Error("Invalid contact links.");
  const ids=new Set<string>();
  result.links=result.links.map(defaultLink => {
    const item=(input.links as Record<string,unknown>[]).find(link => link && link.id===defaultLink.id);
    if (!item || ids.has(defaultLink.id) || typeof item.enabled!=="boolean") throw new Error("Invalid link visibility.");
    ids.add(defaultLink.id);
    const fields={} as Record<"label"|"value"|"detail"|"href",string>;
    for (const key of ["label","value","detail","href"] as const) {
      const text=item[key];
      if(typeof text!=="string" || text.length>(key==="href"?500:200) || /[\x00-\x1f\x7f]/.test(text)) throw new Error("Check the contact text and links.");
      fields[key]=text.trim().replace(/(?:csit|info|support)@neopathshala\.com/gi,'contact@neopathshala.com');
    }
    if (!fields.label || (fields.href && !validContactHref(fields.href)) || (item.enabled && (!fields.value || !fields.href))) throw new Error(`Add valid text and a safe URL for ${defaultLink.label}.`);
    if (["instagram","facebook","youtube","tiktok","linkedin","whatsapp"].includes(defaultLink.id) && fields.href && !fields.href.startsWith("https://")) throw new Error("Social links must use HTTPS.");
    return {id:defaultLink.id,enabled:item.enabled,...fields};
  });
  return result;
}
