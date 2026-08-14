import {loadSettings,loadLegacyState} from '../shared/db.js';

const iframe=document.getElementById('legacy');
function inject(doc,settings,state){
  const style=doc.createElement('style');
  style.textContent=`
    #home,#report,#help,#client,#admin{display:none!important}
    #topNav{grid-template-columns:repeat(3,1fr)!important}
    #topNav a[data-page="report"],#topNav a[data-page="admin"]{display:none!important}
    header .header-actions .home-btn{display:none!important}
  `;
  doc.head.appendChild(style);
  if(state) try{localStorage.setItem('goldBuyer_vFinalTrial_2026',JSON.stringify(state));}catch{}
  if(settings){
    const key='goldBuyer_remoteSettingsV1'; localStorage.setItem(key,JSON.stringify(settings));
    const s=JSON.parse(localStorage.getItem('goldBuyer_vFinalTrial_2026')||'null')||{};
    if(settings.prices) s.prices={...(s.prices||{}),...settings.prices};
    if(settings.tests) s.tests={...(s.tests||{}),...settings.tests};
    if(settings.neg) s.neg={...(s.neg||{}),...settings.neg};
    localStorage.setItem('goldBuyer_vFinalTrial_2026',JSON.stringify(s));
  }
  doc.defaultView.location.hash='#test';
  doc.defaultView.location.reload();
}
iframe.addEventListener('load',async()=>{
  try{const [settings,state]=await Promise.all([loadSettings(),loadLegacyState()]); inject(iframe.contentDocument,settings,state);}catch(e){console.error(e);}
},{once:true});
