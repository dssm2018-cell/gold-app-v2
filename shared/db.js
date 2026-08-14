import {getSupabase} from './supabase.js';

const DEMO_KEY='goldAppDbDemoSettingsV1';

const defaults={
  prices:{24:0,22:0,21:0,19:0,18:0,16:0,14:0,10:0},
  tests:{21:true,18:true,14:true,10:true,color:true,shape:true},
  neg:{},
  theme:{name:'gold',primary:'#b78b2e',background:'#f6f7f8'},
  content:{help:'',welcome:''},
  products:[],
  costs:[]
};

function merge(a,b){return {...a,...(b||{})};}
export function defaultSettings(){return structuredClone(defaults);}

export async function loadSettings(ownerId='owner'){
  const sb=await getSupabase();
  if(!sb){
    try{return merge(defaultSettings(),JSON.parse(localStorage.getItem(DEMO_KEY)||'{}'));}catch{return defaultSettings();}
  }
  const {data,error}=await sb.from('app_settings').select('section,data').eq('owner_id',ownerId);
  if(error) throw error;
  const out=defaultSettings();
  for(const row of data||[]){out[row.section]=merge(out[row.section],row.data);}
  return out;
}

export async function saveSection(section,data,ownerId='owner'){
  const sb=await getSupabase();
  if(!sb){
    const current=await loadSettings(ownerId); current[section]=merge(current[section],data);
    localStorage.setItem(DEMO_KEY,JSON.stringify(current)); return current;
  }
  const {error}=await sb.from('app_settings').upsert({owner_id:ownerId,section,data,updated_at:new Date().toISOString()},{onConflict:'owner_id,section'});
  if(error) throw error;
  return loadSettings(ownerId);
}

export async function saveLegacyState(state,ownerId='owner'){
  const sb=await getSupabase();
  if(!sb){localStorage.setItem('goldBuyer_remoteDemoState',JSON.stringify(state));return;}
  const {error}=await sb.from('app_state').upsert({owner_id:ownerId,state,updated_at:new Date().toISOString()},{onConflict:'owner_id'});
  if(error) throw error;
}

export async function loadLegacyState(ownerId='owner'){
  const sb=await getSupabase();
  if(!sb){try{return JSON.parse(localStorage.getItem('goldBuyer_remoteDemoState')||'null')}catch{return null}}
  const {data,error}=await sb.from('app_state').select('state').eq('owner_id',ownerId).maybeSingle();
  if(error) throw error;
  return data?.state||null;
}
