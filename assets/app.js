// Public website settings. Change ONLY the Worker URL and chat links; no API secrets here.
const CFG={api:'https://sensulu-api.sagaliyevsauron.workers.dev',turnstileSiteKey:'0x4AAAAAAFT_KWwveCwY_agP',telegramBot:'',whatsappNumber:''};
// Turnstile: wait for the external script and cleanly handle reopening forms.
const captchaIds = {};
const captchaTimers = {};
function removeCaptcha(name) {
  clearTimeout(captchaTimers[name]);
  delete captchaTimers[name];
  if (window.turnstile && captchaIds[name] !== undefined) {
    try { window.turnstile.remove(captchaIds[name]); } catch (e) { console.warn('Turnstile cleanup:', e); }
  }
  delete captchaIds[name];
}
function mountCaptcha(name) {
  if (CFG.turnstileSiteKey.includes('REPLACE_WITH')) return;
  removeCaptcha(name);
  const el = document.getElementById(name);
  if (!el) return;
  const started = Date.now();
  const attempt = () => {
    // A modal can be closed while the library is loading.
    if (!el.isConnected) return;
    if (window.turnstile && typeof window.turnstile.render === 'function') {
      try {
        captchaIds[name] = window.turnstile.render(el, {
          sitekey: CFG.turnstileSiteKey,
          'error-callback': (code) => {
            console.warn('Turnstile challenge error:', code);
          },
          'expired-callback': () => console.info('Turnstile token expired; retry verification')
        });
      } catch (e) {
        console.error('Turnstile render failed:', e);
        el.textContent = 'Не удалось загрузить проверку. Обновите страницу и попробуйте ещё раз.';
      }
    } else if (Date.now() - started < 15000) {
      captchaTimers[name] = setTimeout(attempt, 350);
    } else {
      el.textContent = 'Сервис проверки недоступен. Проверьте подключение к Cloudflare и обновите страницу.';
    }
  };
  attempt();
}
function token(name) {
  if (!window.turnstile || captchaIds[name] === undefined) {
    throw Error('Проверка защиты ещё загружается или недоступна. Обновите страницу и попробуйте снова.');
  }
  const value = window.turnstile.getResponse(captchaIds[name]);
  if (!value) throw Error('Дождитесь завершения проверки Cloudflare Turnstile.');
  return value;
}
function resetCaptcha(name) {
  if (window.turnstile && captchaIds[name] !== undefined) {
    try { window.turnstile.reset(captchaIds[name]); } catch(e) { console.warn('Turnstile reset:', e); }
  }
}

let products=[],categories=[],cart={};const $=s=>document.querySelector(s),money=n=>new Intl.NumberFormat('ru-RU').format(n)+' ₸';
try{cart=JSON.parse(localStorage.getItem('sensulu_cart_v2')||'{}')}catch{cart={}}
const save=()=>{localStorage.setItem('sensulu_cart_v2',JSON.stringify(cart));renderBag()};
function route(page){if(!$('#'+page))return;if(page!=='collab')removeCaptcha('collabTurnstile');document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id===page));$('#bagBtn').hidden=!['catalog','cart'].includes(page);history.replaceState(null,'','#'+page);window.scrollTo(0,0);if(page==='catalog')renderProducts();if(page==='cart')renderCart();if(page==='collab')mountCaptcha('collabTurnstile')}
const count=()=>Object.values(cart).reduce((a,b)=>a+b,0);const total=()=>products.reduce((a,p)=>a+p.priceKZT*(cart[p.id]||0),0);
function renderBag(){let n=count();$('#bagCount').textContent=n;$('#floatingCart').hidden=!n;$('#floatingInfo').textContent=`${n} шт. · ${money(total())}`}
function renderProducts(){const filter=$('#category').value,q=$('#search').value.toLowerCase().trim();let items=products.filter(p=>(filter==='all'||p.category===filter)&&[p.title,p.shade,p.desc].join(' ').toLowerCase().includes(q));$('#resultCount').textContent=`Найдено товаров: ${items.length}`;$('#products').innerHTML=items.map(p=>`<article class="product"><img src="${p.img}" alt="" loading="lazy" onerror="this.onerror=null;this.src='assets/placeholder.svg'"><div class="product-content"><h3>${escapeHTML(p.title)}</h3><span class="shade">${escapeHTML(p.shade)}</span><div class="desc">${escapeHTML(p.desc||'')}</div><div class="price">${money(p.priceKZT)}</div><button data-add="${p.id}">Добавить в корзину ${cart[p.id]?'('+cart[p.id]+')':''}</button></div></article>`).join('')||'<p>По вашему запросу товаров не найдено.</p>'}
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderCart(){let chosen=products.filter(p=>cart[p.id]>0);$('#cartItems').innerHTML=chosen.map(p=>`<div class="cart-line"><img src="${p.img}" onerror="this.onerror=null;this.src='assets/placeholder.svg'" alt=""><div class="cart-name"><strong>${escapeHTML(p.title)}</strong><small>${escapeHTML(p.shade)}</small><div>${money(p.priceKZT*cart[p.id])}</div></div><div class="qty"><button data-dec="${p.id}" aria-label="Уменьшить">−</button><strong>${cart[p.id]}</strong><button data-add="${p.id}" aria-label="Увеличить">+</button></div><button class="back" data-remove="${p.id}" aria-label="Удалить">×</button></div>`).join('')||'<p class="subtle" style="text-align:center;padding:40px">В корзине пока нет товаров.</p>';$('#cartTotal').textContent=money(total());$('#checkoutBtn').disabled=!chosen.length}
function showModal(html){removeCaptcha('orderTurnstile');$('#modalBody').innerHTML=html;$('#modal').hidden=false;document.body.style.overflow='hidden'}function closeModal(){$('#modal').hidden=true;document.body.style.overflow='';removeCaptcha('orderTurnstile')}
function showSuccess(title,msg){showModal(`<div class="success"><span class="success-icon">✓</span><h2>${title}</h2><p>${msg}</p><button class="primary wide" data-close>На главную</button></div>`)}
function orderModal(){if(!count())return;showModal(`<h2>Оформление заказа</h2><p class="subtle">${count()} шт. · ${money(total())}</p><form class="form" id="orderForm"><label>Ваше имя<input name="name" maxlength="100" required placeholder="Как к Вам обращаться"></label><label>Город<input name="city" maxlength="100" required placeholder="Ваш город"></label><label>Адрес доставки<input name="address" maxlength="250" required placeholder="Улица, дом, квартира"></label><label>Контактный телефон<input name="phone" type="tel" required placeholder="+7 700 000 00 00"></label><div id="orderTurnstile" class="captcha"></div><button class="primary wide" type="submit">Подтвердить заказ · ${money(total())}</button></form>`);mountCaptcha('orderTurnstile')}
async function api(path,payload){if(CFG.api.includes('REPLACE-WITH-YOUR-WORKER'))throw Error('Приём заявок ещё не подключён. Настройте адрес Cloudflare Worker.');const res=await fetch(CFG.api.replace(/\/$/,'')+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});let result=await res.json().catch(()=>({}));if(!res.ok||!result.ok)throw Error(result.error||'Не удалось отправить заявку');return result}
function setBusy(form,busy){let b=form.querySelector('[type=submit]');if(b){b.disabled=busy;b.textContent=busy?'Отправляем...':b.dataset.original||b.textContent;if(!b.dataset.original&&!busy)b.dataset.original=b.textContent}}
async function submitOrder(form){let b=form.querySelector('[type=submit]'),original=b.textContent;b.disabled=true;b.textContent='Оформляем заказ…';try{const customer=Object.fromEntries(new FormData(form));const orderId= sessionStorage.getItem('sensulu_pending_order')||crypto.randomUUID();sessionStorage.setItem('sensulu_pending_order',orderId);let data=await api('/order',{orderId,turnstileToken:token('orderTurnstile'),customer,items:Object.entries(cart).filter(([id,q])=>q>0).map(([id,quantity])=>({id,quantity}))});cart={};save();sessionStorage.removeItem('sensulu_pending_order');showSuccess('Ваш заказ оформлен!',`Номер заказа: ${data.dealId}. Менеджер с Вами свяжется для подтверждения заказа и оплаты.`)}catch(err){alert(err.message);resetCaptcha('orderTurnstile')}finally{b.disabled=false;b.textContent=original}}
async function submitCollab(form){let b=form.querySelector('[type=submit]'),original=b.textContent;b.disabled=true;b.textContent='Отправляем заявку…';try{let obj=Object.fromEntries(new FormData(form));if(!obj.name.trim()||!obj.social.trim()||!obj.phone.trim())throw Error('Заполните все поля');const requestId=sessionStorage.getItem('sensulu_pending_collab')||crypto.randomUUID();sessionStorage.setItem('sensulu_pending_collab',requestId);await api('/collaboration',{requestId,turnstileToken:token('collabTurnstile'),...obj});sessionStorage.removeItem('sensulu_pending_collab');form.reset();showSuccess('Заявка принята!','Ваша заявка на сотрудничество принята, менеджер с Вами свяжется.')}catch(err){alert(err.message);resetCaptcha('collabTurnstile')}finally{b.disabled=false;b.textContent=original}}
function consult(){const q=$('#question').value.trim();if(!q){$('#question').focus();return}if(CFG.whatsappNumber){window.open('https://wa.me/'+CFG.whatsappNumber.replace(/\D/g,'')+'?text='+encodeURIComponent(q),'_blank','noopener');$('#consultHint').textContent='Отправьте подготовленное сообщение в WhatsApp — оно поступит в подключённую открытую линию.';return}if(CFG.telegramBot){const url='https://t.me/'+CFG.telegramBot.replace(/^@/,'');$('#consultHint').textContent='Скопируйте вопрос и отправьте его в открывшемся Telegram-чате.';navigator.clipboard?.writeText(q).catch(()=>{});window.open(url,'_blank','noopener');return}$('#consultHint').textContent='Добавьте ссылку на Telegram-бота или WhatsApp в assets/app.js либо установите виджет онлайн-чата Битрикс24.'}
document.addEventListener('click',e=>{let el=e.target.closest('[data-go],[data-add],[data-dec],[data-remove],[data-close],[data-home]');if(!el)return;if(el.dataset.go)route(el.dataset.go);else if(el.hasAttribute('data-home'))route('landing');else if(el.dataset.add){cart[el.dataset.add]=(cart[el.dataset.add]||0)+1;save();if($('#cart').classList.contains('active'))renderCart();else renderProducts()}else if(el.dataset.dec){cart[el.dataset.dec]=Math.max(0,(cart[el.dataset.dec]||0)-1);if(!cart[el.dataset.dec])delete cart[el.dataset.dec];save();renderCart()}else if(el.dataset.remove){delete cart[el.dataset.remove];save();renderCart()}else if(el.hasAttribute('data-close')){closeModal();route('landing')}});
$('#homeBtn').onclick=()=>route('landing');$('#bagBtn').onclick=()=>route('cart');$('#checkoutBtn').onclick=orderModal;$('#closeModal').onclick=closeModal;$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};$('#search').oninput=renderProducts;$('#category').onchange=renderProducts;$('#askBtn').onclick=consult;
document.addEventListener('submit',e=>{if(e.target.id==='orderForm'){e.preventDefault();submitOrder(e.target)}if(e.target.id==='collabForm'){e.preventDefault();submitCollab(e.target)}});
fetch('assets/products.json').then(r=>{if(!r.ok)throw Error('Каталог недоступен');return r.json()}).then(d=>{products=d.products;categories=d.categories;$('#category').innerHTML=categories.map(c=>`<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('');renderBag();renderProducts();route(['landing','catalog','cart','collab','consult'].includes(location.hash.slice(1))?location.hash.slice(1):'landing')}).catch(err=>{$('#products').textContent='Не удалось загрузить каталог: '+err.message});
