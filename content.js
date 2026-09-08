// content.js - Sol Alt Köşe Kompakt Takip Arayüzü

if (!window.uyapDownloaderState) {
  window.uyapDownloaderState = { isRunning: false };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start_download") {
    if (!window.uyapDownloaderState.isRunning) {
      window.uyapDownloaderState.isRunning = true;
      sendResponse({ status: "started" });
      runRealClickDownloader();
    }
  } else if (request.action === "stop_download") {
    window.uyapDownloaderState.isRunning = false;
    console.warn("🛑 [KULLANICI KOMUTU]: Otomasyon durduruldu.");
    sendResponse({ status: "stopped" });
  } else if (request.action === "reset_storage") {
    localStorage.removeItem('uyap_massive_downloaded');
    console.log("🧹 [HAFIZA TEMİZLENDİ]: İndirilenler listesi sıfırlandı.");
    sendResponse({ status: "reset" });
  }
});

async function runRealClickDownloader() {
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  let downloadedSet = [];
  try {
    downloadedSet = JSON.parse(localStorage.getItem('uyap_massive_downloaded') || '[]');
  } catch (e) {
    downloadedSet = [];
  }

  let retryCountMap = {}; 
  let failedList = [];    
  let batchCount = 0;

  console.log(`🚀 [UYAP İNDİRİCİ]: Başlatıldı. Hafızadaki önceki indirilenler: ${downloadedSet.length}`);

  const container = document.querySelector('.ui-dialog, .ui-dialog-content') || document.body;

  if (window.jQuery) {
    window.jQuery('.dynatree-expander, .dynatree-closed, li.closed, span.dynatree-node, .dynatree-folder').each(function() {
      const $el = window.jQuery(this);
      const $expander = $el.find('.dynatree-expander').first();
      if ($expander.length) { 
        $expander.click(); 
      } else if ($el.hasClass('dynatree-closed') || $el.hasClass('closed')) {
        $el.click(); 
      }
      $el.removeClass('dynatree-closed closed').addClass('dynatree-opened opened');
    });
    await delay(800);
  }

  let allFileElements = Array.from(container.querySelectorAll('span.file'));
  let uniqueTargetMap = new Map();
  let indexCounter = 0;

  allFileElements.forEach(el => {
    const text = el.textContent ? el.textContent.trim() : '';
    if (text.length < 2) return;

    let hierarchicalName = text;
    let parentLi = el.closest('li');
    if (parentLi) {
      let parentUl = parentLi.parentElement;
      if (parentUl) {
        let grandparentLi = parentUl.closest('li');
        if (grandparentLi) {
          let mainTitleEl = grandparentLi.querySelector('span.dynatree-title, a, span.folder');
          if (mainTitleEl) {
            let mainTitle = mainTitleEl.textContent.trim();
            if (mainTitle.includes('Son 20 Evrak')) {
              hierarchicalName = `Son 20 Evrak -> ${text}`;
            } else {
              hierarchicalName = `${mainTitle} -> ${text}`;
            }
          }
        }
      }
    }

    if (!hierarchicalName.includes('->')) {
      indexCounter++;
      hierarchicalName = `${text} [Dosya #${indexCounter}]`;
    }

    uniqueTargetMap.set(hierarchicalName, el);
  });

  let totalUniqueCount = uniqueTargetMap.size;
  console.log(`🎯 [HESAPLANDI]: Net Gerçek Hedef Sayısı: ${totalUniqueCount}`);

  let existingReport = document.getElementById('uyap-final-report-box');
  if (existingReport) existingReport.remove();

  // SOL ALT KÖŞE (Bottom-Left) Konumlandırması
  let liveBox = document.createElement('div');
  liveBox.id = 'uyap-final-report-box';
  liveBox.style.cssText = 'position: fixed; bottom: 20px; left: 20px; background: #0f172a; color: white; padding: 16px 20px; border-radius: 12px; font-family: sans-serif; z-index: 999999; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: left; width: 320px; max-height: 320px; overflow-y: auto; border: 2px solid #3b82f6;';
  
  liveBox.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <span style="font-size: 14px; font-weight: bold; color: #60a5fa;">🚀 Sen Şimdi Emin Olmak İstersin. İzle Canım!</span>
      <button id="closeReportBtn" style="background: rgba(255,255,255,0.2); border: none; color: white; font-weight: bold; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; font-size: 11px; display: flex; align-items: center; justify-content: center;">✕</button>
    </div>
    <div id="liveStatusText" style="text-align: center; font-size: 12px; margin-bottom: 8px; color: #fde047; font-weight: bold;">Kaldığı yerden devam ediliyor...</div>
    <div style="font-size: 10px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 3px; margin-bottom: 4px; color: #a7f3d0;">📥 İndirilenler:</div>
    <ul id="liveListUl" style="margin: 0; padding-left: 15px; font-size: 10px; max-height: 130px; overflow-y: auto;"></ul>
  `;
  document.body.appendChild(liveBox);
  document.getElementById('closeReportBtn').addEventListener('click', () => { liveBox.remove(); });

  let liveListUl = document.getElementById('liveListUl');
  let liveStatusText = document.getElementById('liveStatusText');

  downloadedSet.forEach(item => {
    let li = document.createElement('li');
    li.style.marginBottom = '2px';
    li.innerText = item;
    liveListUl.appendChild(li);
  });

  for (let [hierarchicalName, targetItem] of uniqueTargetMap.entries()) {
    if (!window.uyapDownloaderState.isRunning) break;

    if (downloadedSet.includes(hierarchicalName)) continue;

    const bodyText = document.body ? document.body.innerText : "";
    if (bodyText.includes("Giriş Yap") || bodyText.includes("Oturumunuz sona ermiştir")) {
      console.error("❌ [OTURUM DÜŞTÜ]: UYAP oturumu kapandı! 20 saniye bekleniyor...");
      await delay(20000);
      continue;
    }

    if (batchCount >= 50) {
      console.warn("🛑 [MOLA]: 50 dosya tamamlandı, sunucu dinlendiriliyor (15 sn)...");
      if(liveStatusText) liveStatusText.innerText = `Sunucu dinlendiriliyor (Mola)...`;
      await delay(15000);
      batchCount = 0;
    }

    try {
      targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await delay(300);

      retryCountMap[hierarchicalName] = (retryCountMap[hierarchicalName] || 0) + 1;
      let currentAttempt = retryCountMap[hierarchicalName];

      if (currentAttempt > 3) {
        if (!failedList.includes(hierarchicalName)) failedList.push(hierarchicalName);
        continue;
      }

      const rect = targetItem.getBoundingClientRect();
      const clientX = rect.x + (rect.width / 2);
      const clientY = rect.y + (rect.height / 2);

      ['mousedown', 'contextmenu'].forEach(eventType => {
        const event = new MouseEvent(eventType, {
          bubbles: true, cancelable: true, view: window, button: 2, buttons: 2, clientX, clientY
        });
        targetItem.dispatchEvent(event);
      });

      await delay(600);
      if (!window.uyapDownloaderState.isRunning) break;

      const allDivs = Array.from(document.querySelectorAll('div, span, a, li'));
      let saveBtn = allDivs.find(el => {
        const t = el.textContent ? el.textContent.trim() : '';
        return (t === 'Kaydet' || t.includes('Kaydet')) && el.offsetParent !== null && el.childElementCount === 0;
      });

      if (saveBtn) {
        saveBtn.click();
        if (window.jQuery) { window.jQuery(saveBtn).trigger('click'); }

        downloadedSet.push(hierarchicalName);
        localStorage.setItem('uyap_massive_downloaded', JSON.stringify(downloadedSet));
        batchCount++;

        let progressMsg = `(${downloadedSet.length}/${totalUniqueCount}) İndiriliyor...`;
        if(liveStatusText) liveStatusText.innerText = progressMsg;
        console.log(`✅ [BAŞARILI (${downloadedSet.length}/${totalUniqueCount})]: ${hierarchicalName}`);

        if(liveListUl) {
          let li = document.createElement('li');
          li.style.marginBottom = '2px';
          li.innerText = hierarchicalName;
          liveListUl.appendChild(li);
          liveListUl.scrollTop = liveListUl.scrollHeight;
        }
      } else {
        if (!failedList.includes(hierarchicalName)) failedList.push(hierarchicalName);
      }
      
      await delay(2000);

    } catch (err) {
      console.error("❌ Hata oluştu:", err);
      await delay(1500);
    }
  }

  window.uyapDownloaderState.isRunning = false;
  
  if (liveBox) liveBox.remove();

  // Final Rapor Kutusu da sol altta belirir
  let finalAlert = document.createElement('div');
  finalAlert.id = 'uyap-final-report-box';
  finalAlert.style.cssText = 'position: fixed; bottom: 20px; left: 20px; background: #dc2626; color: white; padding: 18px 22px; border-radius: 12px; font-family: sans-serif; z-index: 999999; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: left; width: 320px; max-height: 320px; overflow-y: auto;';
  
  let listHtml = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <span style="font-size: 16px; font-weight: bold;">🚨 ACİL BOŞAN! 🚨</span>
      <button id="closeReportBtn" style="background: rgba(255,255,255,0.2); border: none; color: white; font-weight: bold; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px;">✕</button>
    </div>
    <div style="text-align: center; font-size: 11px; margin-bottom: 10px; font-style: italic;">Toplam ${downloadedSet.length} evrak indirildi, Buse'nin biraları ısmarlanabilir! 🍺</div>
    <div style="font-size: 10px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 3px; margin-bottom: 4px; color: #a7f3d0;">✅ Başarılı (${downloadedSet.length}/${totalUniqueCount}):</div>
    <ul style="margin: 0 0 10px 0; padding-left: 15px; font-size: 10px; max-height: 100px; overflow-y: auto;">
  `;
  downloadedSet.forEach(item => {
    listHtml += `<li style="margin-bottom: 2px;">${item}</li>`;
  });
  listHtml += `</ul>`;

  if (failedList.length > 0) {
    listHtml += `<div style="font-size: 10px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 3px; margin-bottom: 4px; color: #fde047;">❌ İndirilemeyenler (${failedList.length}):</div>`;
    listHtml += `<ul style="margin: 0; padding-left: 15px; font-size: 10px; max-height: 80px; overflow-y: auto;">`;
    failedList.forEach(item => {
      listHtml += `<li style="margin-bottom: 2px;">${item}</li>`;
    });
    listHtml += `</ul>`;
  }

  finalAlert.innerHTML = listHtml;
  document.body.appendChild(finalAlert);

  document.getElementById('closeReportBtn').addEventListener('click', () => {
    finalAlert.remove();
  });
}