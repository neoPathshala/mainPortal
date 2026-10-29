export function noticeBannerActive(notice:{bannerExpiresAt?:string|null;expiresAt?:string|null},now=Date.now()) {
  return [notice.bannerExpiresAt,notice.expiresAt].every(value=>!value || (Number.isFinite(Date.parse(value)) && Date.parse(value)>now));
}
export function bannerExpiryFromHours(value:unknown,now=Date.now()) {
  if(value===undefined || value===null || value==="") return {bannerDurationHours:null,bannerExpiresAt:null};
  if(typeof value!=="number" || !Number.isFinite(value) || value<1/60 || value>8760) throw new Error("Banner duration must be between 1 minute and 8,760 hours.");
  return {bannerDurationHours:value,bannerExpiresAt:new Date(now+value*3600_000).toISOString()};
}
