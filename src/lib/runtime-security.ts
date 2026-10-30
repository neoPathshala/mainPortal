import {constants} from 'node:zlib';

// Node.js October 21, 2026 security releases (CVE-2026-111497).
const minimum:Record<number,readonly [number,number]>={22:[23,4],24:[22,1],26:[12,1]};
export function patchedNodeVersion(version:string){
 const match=/^v?(\d+)\.(\d+)\.(\d+)$/.exec(version);
 if(!match)return false;
 const [,major,minor,patch]=match.map(Number),floor=minimum[major];
 return Boolean(floor&&(minor>floor[0]||(minor===floor[0]&&patch>=floor[1])));
}
const decoderConstants=constants as typeof constants&{BROTLI_DECODER_ERROR_FORMAT_BLOCK_SWITCH?:number};
export function assertSecureRuntime(version=process.versions.node,hasDecoderFix=typeof decoderConstants.BROTLI_DECODER_ERROR_FORMAT_BLOCK_SWITCH==='number'){
 if(!patchedNodeVersion(version)||!hasDecoderFix){
  throw Object.assign(new Error(`Node.js ${version} does not meet the platform security baseline for CVE-2026-111497. Install Node.js 26.12.1 or a newer patched 26.x release, then restart this process.`),{code:'INSECURE_NODE_RUNTIME'});
 }
}
