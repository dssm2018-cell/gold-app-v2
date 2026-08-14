import {loadSettings,saveSection,defaultSettings} from '../shared/db.js';
const K=[24,22,21,19,18,16,14,10]; const $=id=>document.getElementById(id); let s=defaultSettings();
function render(){
 $('prices').innerHTML=K.map(k=>`<div><label>${k}K</label><input id="p${k}" type="number" step="0.01" value="${s.prices[k]||0}"></div>`).join('');
 $('tests').innerHTML=['21','18','14','10'].map(k=>`<label><input id="t${k}" type="checkbox" ${s.tests[k]?'checked':''}> اختبار ${k}K</label>`).join('')+`<label><input id="tcolor" type="checkbox" ${s.tests.color?'checked':''}> اللون</label><label><input id="tshape" type="checkbox" ${s.tests.shape?'checked':''}> الشكل/المظهر</label>`;
 $('neg').innerHTML=K.map(k=>{const n=s.neg[k]||{startDiscount:120,stage1DiscountEnd:90,stage2DiscountEnd:70,step:5};return `<div class="card"><b>${k}K</b><div class="grid"><div><label>خصم البداية</label><input id="n${k}a" type="number" value="${n.startDiscount}"></div><div><label>نهاية المرحلة 1</label><input id="n${k}b" type="number" value="${n.stage1DiscountEnd}"></div><div><label>نهاية المرحلة 2</label><input id="n${k}c" type="number" value="${n.stage2DiscountEnd}"></div><div><label>خطوة الرفع</label><input id="n${k}d" type="number" value="${n.step}"></div></div></div>`}).join('');
 $('primary').value=s.theme.primary||'#b78b2e'; $('themeName').value=s.theme.name||'gold'; $('welcome').value=s.content.welcome||''; $('help').value=s.content.help||'';
}
async function refresh(){try{s=await loadSettings();render();$('status').textContent='تم تحميل الإعدادات.'}catch(e){$('status').textContent='تعذر تحميل الإعدادات: '+e.message}}
async function save(section,data){try{s=await saveSection(section,data);$('status').textContent='تم الحفظ بنجاح.'}catch(e){$('status').textContent='تعذر الحفظ: '+e.message}}
$('savePrices').onclick=()=>save('prices',Object.fromEntries(K.map(k=>[k,Number($('p'+k).value)||0])));
$('saveTests').onclick=()=>save('tests',{21:$('t21').checked,18:$('t18').checked,14:$('t14').checked,10:$('t10').checked,color:$('tcolor').checked,shape:$('tshape').checked});
$('saveNeg').onclick=()=>save('neg',Object.fromEntries(K.map(k=>[k,{mode:'amount',startDiscount:Number($('n'+k+'a').value)||0,stage1DiscountEnd:Number($('n'+k+'b').value)||0,stage2DiscountEnd:Number($('n'+k+'c').value)||0,step:Number($('n'+k+'d').value)||1}])));
$('saveTheme').onclick=()=>save('theme',{name:$('themeName').value,primary:$('primary').value,background:'#f6f7f8'});
$('saveContent').onclick=()=>save('content',{welcome:$('welcome').value,help:$('help').value});
refresh();
