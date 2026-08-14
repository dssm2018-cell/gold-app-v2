document.addEventListener("DOMContentLoaded",()=>{
  const b=document.getElementById("toTopBtn");
  if(!b)return;
  const update=()=>b.classList.toggle("show",window.scrollY>350);
  window.addEventListener("scroll",update,{passive:true});
  b.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
  update();
});

/* =========================
   V6-2 — البيع الفعلي والبيع الجماعي
   إصلاحات V6-1 + طبقة البيع الفعلي دون تعديل بيانات الشراء الأصلية.
========================= */
(function(){
  const prevRenderV4 = window.renderV4;
  const prevLoadPostEdit = window.loadPostEdit;

  state.v6 = state.v6 && typeof state.v6 === 'object' ? state.v6 : {};
  state.v6.sales = Array.isArray(state.v6.sales) ? state.v6.sales : [];
  state.v6.sales = state.v6.sales.filter(x=>x && x.id && Array.isArray(x.dealIds));

  function n(v,f=0){const x=Number(v);return Number.isFinite(x)?x:f;}
  function money(v){return fmt(v,0);}
  function esc2(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function dealCost(d){
    const pc=n(d.purchaseCost,NaN);
    if(Number.isFinite(pc) && pc>0)return pc;
    return Math.max(0,n(d.finalTotal,0)+n(d.processCost,0)+n(d.otherCost,0));
  }
  function expected(d){
    if(typeof window.v6ExpectedForDeal==='function')return window.v6ExpectedForDeal(d);
    const w=n(d.air), k=n(d.carat), market=n(state.prices?.[24]);
    const w24=w>0&&k>0?w*k/24:null;
    const dis=d.expectedDiscount===''||d.expectedDiscount==null?null:n(d.expectedDiscount,NaN);
    if(!w24 || !market || !Number.isFinite(dis))return {w24,market,discount:null,salePrice:null,saleValue:null,profit:null,cost:dealCost(d)};
    const salePrice=Math.max(0,market-dis), saleValue=salePrice*w24, cost=dealCost(d);
    return {w24,market,discount:dis,salePrice,saleValue,profit:saleValue-cost,cost};
  }
  function soldSaleId(d){return d.v6SaleId||null;}
  function isSold(d){return !!soldSaleId(d) || !!d.v6SoldAt;}
  function availableDeals(){return (state.deals||[]).filter(d=>d && d.no && !isSold(d));}
  function saleById(id){return state.v6.sales.find(s=>s.id===id)||null;}
  function newSaleId(){return 'S-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase();}

  function actualSummary(){
    const sales=state.v6.sales;
    const totalSales=sales.reduce((a,s)=>a+n(s.saleAmount),0);
    const totalCost=sales.reduce((a,s)=>a+n(s.totalCost),0);
    return {sales,totalSales,totalCost,profit:totalSales-totalCost};
  }

  window.openV6Sale=function(){
    const box=document.getElementById('v6SaleBox');
    if(!box)return;
    const deals=availableDeals();
    if(!deals.length){alert('لا توجد صفقات غير مباعة يمكن إدخالها في عملية بيع.');return;}
    box.classList.remove('hidden');
    const list=document.getElementById('v6SaleDeals');
    if(list)list.innerHTML=deals.map(d=>`<label class="listitem" style="display:block;cursor:pointer"><input type="checkbox" data-v6-sale-deal value="${esc2(d.no)}"> <b>${esc2(d.no)}</b> — ${d.carat?d.carat+'K':'—'} — ${money(d.air||0)} جم — تكلفة ${money(dealCost(d))} ريال</label>`).join('');
    const w=document.getElementById('v6ActualWeight'); if(w)w.value='';
    const a=document.getElementById('v6ActualAmount'); if(a)a.value='';
    const notes=document.getElementById('v6ActualNotes'); if(notes)notes.value='';
    updateV6SalePreview();
  };
  window.closeV6Sale=function(){document.getElementById('v6SaleBox')?.classList.add('hidden');};
  window.updateV6SalePreview=function(){
    const ids=[...document.querySelectorAll('[data-v6-sale-deal]:checked')].map(x=>x.value);
    const deals=ids.map(id=>(state.deals||[]).find(d=>d.no===id)).filter(Boolean);
    const cost=deals.reduce((a,d)=>a+dealCost(d),0);
    const exp=deals.reduce((a,d)=>a+(expected(d).profit??0),0);
    const box=document.getElementById('v6SalePreview');
    if(box)box.innerHTML=`<div class="metrics"><div class="metric"><span>الصفقات المختارة</span><strong>${deals.length}</strong></div><div class="metric"><span>إجمالي التكلفة</span><strong>${money(cost)} ريال</strong></div><div class="metric"><span>مجموع الربح المتوقع للقطع</span><strong>${money(exp)} ريال</strong></div></div>`;
  };
  window.saveV6Sale=function(){
    const ids=[...document.querySelectorAll('[data-v6-sale-deal]:checked')].map(x=>x.value);
    if(!ids.length){alert('اختر صفقة واحدة على الأقل.');return;}
    const weight=n(document.getElementById('v6ActualWeight')?.value,0);
    const amount=n(document.getElementById('v6ActualAmount')?.value,0);
    if(weight<=0){alert('أدخل الوزن الفعلي المباع.');return;}
    if(amount<=0){alert('أدخل قيمة البيع الفعلية.');return;}
    const deals=ids.map(id=>(state.deals||[]).find(d=>d.no===id)).filter(d=>d && !isSold(d));
    if(deals.length!==ids.length){alert('إحدى الصفقات المختارة تم بيعها مسبقًا. حدّث الصفحة ثم أعد الاختيار.');return;}
    const totalCost=deals.reduce((a,d)=>a+dealCost(d),0);
    const sale={id:newSaleId(),createdAt:Date.now(),dealIds:deals.map(d=>d.no),actualWeight:weight,saleAmount:amount,totalCost,actualProfit:amount-totalCost,notes:document.getElementById('v6ActualNotes')?.value||''};
    state.v6.sales.unshift(sale);
    deals.forEach(d=>{d.v6SaleId=sale.id;d.v6SoldAt=sale.createdAt;d.v6ActualWeight=weight;d.v6ActualSaleAmount=amount;});
    saveState();
    closeV6Sale();
    if(typeof window.renderV4==='function')window.renderV4();
    alert(`تم حفظ عملية البيع. الربح الفعلي: ${money(sale.actualProfit)} ريال`);
  };

  function injectSaleUI(){
    const page=document.getElementById('v4dashboard');
    if(!page)return;
    if(!document.getElementById('v6ActualCard')){
      const card=document.createElement('div');card.id='v6ActualCard';card.className='card';
      card.innerHTML=`<div class="row"><h3>🟢 البيع الفعلي</h3><span class="badge">بعد البيع</span></div>
        <div id="v6ActualStats" class="metrics" style="margin-top:10px"></div>
        <button class="btn primary" type="button" onclick="openV6Sale()">+ تسجيل عملية بيع</button>
        <div id="v6SalesTable" style="margin-top:12px"></div>
        <div id="v6SaleBox" class="card hidden" style="margin-top:14px;background:#fafafa">
          <h3>تسجيل بيع جماعي</h3><div class="muted">اختر عدة صفقات جمعتها وصهرتها ثم أدخل الوزن الفعلي المباع وقيمة البيع الفعلية. لن تتغير بيانات الشراء الأصلية.</div>
          <div id="v6SaleDeals" style="margin-top:10px"></div>
          <div id="v6SalePreview" style="margin-top:10px"></div>
          <label>الوزن الفعلي المباع (جم)</label><input id="v6ActualWeight" type="number" min="0" step="0.01" oninput="updateV6SalePreview()">
          <label>قيمة البيع الفعلية (ريال)</label><input id="v6ActualAmount" type="number" min="0" step="0.01">
          <label>ملاحظات البيع (اختياري)</label><textarea id="v6ActualNotes"></textarea>
          <div class="grid"><button class="btn primary" type="button" onclick="saveV6Sale()">💾 حفظ البيع</button><button class="btn" type="button" onclick="closeV6Sale()">إلغاء</button></div>
        </div>`;
      page.appendChild(card);
    }
  }

  function renderV6Actual(){
    injectSaleUI();
    const deals=(state.deals||[]).filter(d=>d&&d.no);
    const summary=actualSummary();
    const expectedProfit=deals.filter(d=>expected(d).profit!==null).reduce((a,d)=>a+n(expected(d).profit),0);
    const stats=document.getElementById('v6ActualStats');
    if(stats)stats.innerHTML=`<div class="metric"><span>إجمالي البيع المحقق</span><strong>${money(summary.totalSales)} ريال</strong></div><div class="metric"><span>الربح المحقق</span><strong>${money(summary.profit)} ريال</strong></div><div class="metric"><span>عمليات البيع</span><strong>${summary.sales.length}</strong></div><div class="metric"><span>الربح المتوقع للصفقات</span><strong>${money(expectedProfit)} ريال</strong></div>`;
    const table=document.getElementById('v6SalesTable');
    if(table) table.innerHTML=summary.sales.length?`<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;min-width:760px"><thead><tr><th>البيع</th><th>الصفقات</th><th>الوزن الفعلي</th><th>قيمة البيع</th><th>التكلفة</th><th>الربح الفعلي</th><th>التاريخ</th></tr></thead><tbody>${summary.sales.map(s=>`<tr><td>${esc2(s.id)}</td><td>${s.dealIds.length}</td><td>${money(s.actualWeight)} جم</td><td>${money(s.saleAmount)} ريال</td><td>${money(s.totalCost)} ريال</td><td>${money(s.actualProfit)} ريال</td><td>${new Date(s.createdAt).toLocaleDateString('ar-SA')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="muted">لا توجد عمليات بيع فعلية مسجلة بعد.</div>';
  }

  // نعيد حساب ملخص V6-1 دون فقد أي بيانات، ثم نضيف الملخص الفعلي.
  window.renderV4=function(){
    if(typeof prevRenderV4==='function')prevRenderV4();
    const deals=(state.deals||[]).filter(d=>d&&d.no);
    deals.forEach(d=>{
      if(typeof window.v6ExpectedForDeal==='function')window.v6ExpectedForDeal(d);
    });
    renderV6Actual();
    const summary=actualSummary();
    const stats=document.getElementById('v4Stats');
    if(stats){
      stats.innerHTML=stats.innerHTML.replace(/<div class="metric"><span>V6 — البيع المحقق<\/span>.*?<\/div><div class="metric"><span>V6 — الربح المحقق<\/span>.*?<\/div>/s,'')+`<div class="metric"><span>البيع المحقق</span><strong>${money(summary.totalSales)} ريال</strong></div><div class="metric"><span>الربح المحقق</span><strong>${money(summary.profit)} ريال</strong></div>`;
    }
  };

  // فتح الصفقة يستمر كما هو، مع إظهار حالتها وبيانات البيع الفعلي إن وجدت.
  window.loadPostEdit=function(){
    if(typeof prevLoadPostEdit==='function')prevLoadPostEdit();
    const d=state.deals.find(x=>x.no===state.v4.editDealNo);
    if(!d)return;
    const old=document.getElementById('v6ActualDealInfo');
    if(old)old.remove();
    const host=document.getElementById('v6ExpectedBox')?.parentElement || document.getElementById('v4edit')?.querySelector('.card');
    if(!host)return;
    const info=document.createElement('div');info.id='v6ActualDealInfo';info.className='card';info.style.marginTop='14px';
    if(isSold(d)){
      const sale=saleById(d.v6SaleId);
      info.innerHTML=`<h3>🟢 البيع الفعلي</h3><div class="alert ok">هذه الصفقة مباعة ضمن عملية ${esc2(sale?.id||d.v6SaleId)}.</div><div class="metrics"><div class="metric"><span>الوزن الفعلي للعملية</span><strong>${sale?money(sale.actualWeight)+' جم':'—'}</strong></div><div class="metric"><span>قيمة البيع الفعلية للعملية</span><strong>${sale?money(sale.saleAmount)+' ريال':'—'}</strong></div><div class="metric"><span>الربح الفعلي للعملية</span><strong>${sale?money(sale.actualProfit)+' ريال':'—'}</strong></div></div>`;
    }else{
      info.innerHTML='<div class="muted">لم تبع هذه الصفقة بعد. عند جمعها مع صفقات أخرى، استخدم «تسجيل عملية بيع» من صفحة التحليلات.</div>';
    }
    host.appendChild(info);
  };

  // يحدّث قائمة البيع عند العودة للتحليلات.
  if(!window.__v62ChangeHook){
    window.__v62ChangeHook=true;
    document.addEventListener('change',e=>{if(e.target.matches('[data-v6-sale-deal]'))updateV6SalePreview();});
  }

  window.V6_2=true;
  setTimeout(()=>{injectSaleUI();if(typeof window.renderV4==='function')window.renderV4();},0);
})();
