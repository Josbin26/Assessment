const BASE=(import.meta.env.VITE_API_URL||'/api').replace(/\/$/,'');
async function req(path,opts={}){let r;try{r=await fetch(BASE+path,{...opts,headers:{'Content-Type':'application/json',...(opts.headers||{})}})}catch{throw Error('Cannot reach API. Start the backend and check MongoDB connection.')}const b=await r.json().catch(()=>null);if(!r.ok||!b?.success)throw Error(b?.message||`Request failed (${r.status})`);return b.data}
export const getApplications=f=>{const p=new URLSearchParams();if(f?.status&&f.status!=='All')p.set('status',f.status);if(f?.search)p.set('search',f.search);return req('/applications'+(p.size?'?'+p:''))};
export const getStats=()=>req('/applications/stats');
export const getApplication=id=>req('/applications/'+id);
export const createApplication=data=>req('/applications',{method:'POST',body:JSON.stringify(data)});
export const updateApplication=(id,data)=>req('/applications/'+id,{method:'PUT',body:JSON.stringify(data)});
export const changeStatus=(id,status)=>req('/applications/'+id+'/status',{method:'PATCH',body:JSON.stringify({status})});
export const deleteApplication=id=>req('/applications/'+id,{method:'DELETE'});
