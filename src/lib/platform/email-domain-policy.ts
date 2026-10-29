export const DEFAULT_EMAIL_DOMAINS = ["neopathshala.com", "gmail.com", "icloud.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com", "proton.me", "protonmail.com", "aol.com", "me.com", "mac.com"];

export function parseEmailDomains(value: unknown): string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 200) throw new Error("Add between 1 and 200 email domains.");
  const domains = value.map(item => {
    if (typeof item !== "string") throw new Error("Enter valid domains only.");
    const domain = item.trim().toLowerCase();
    if (domain.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) throw new Error("Use domains such as gmail.com without @, URLs, or wildcards.");
    return domain;
  });
  return [...new Set(domains)];
}

export function emailDomainAllowed(email: string, domains: string[]) {
  if (!/^[^\s@<>]+@[^\s@<>]+$/.test(email)) return false;
  const domain = email.slice(email.indexOf("@") + 1).toLowerCase();
  return domains.includes(domain);
}

export function parseEmailDomainSettings(input:unknown):{domains:string[];disabled:string[]}{
 const value=input as {domains?:unknown;disabled?:unknown};const domains=parseEmailDomains(value?.domains??DEFAULT_EMAIL_DOMAINS);
 const raw=value?.disabled??[];if(!Array.isArray(raw)||raw.length>200)throw new Error('Choose valid disabled email domains.');const disabled=raw.length?parseEmailDomains(raw):[];
 if(disabled.some(domain=>!domains.includes(domain)))throw new Error('Choose disabled domains from the allowed list.');return {domains,disabled};
}
export function enabledEmailDomains(config:{domains:string[];disabled:string[]}){return config.domains.filter(domain=>!config.disabled.includes(domain));}
