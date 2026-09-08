// content.js - UYAP Sayfasında Çalışacak Ana Otomasyon Scripti

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start_download") {
    sendResponse({ status: "started" });
    runMassiveExtensionDownloader();
  }
});

async function runMassiveExtensionDownloader() {
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const blockedKeywords = [
    'Kastamonu', 'Mahkemesi', 'Dosyaya', 'Tüm Evraklar', 'İşlerim', 'Ödeme', 
    'Gizleme', 'Doğrulama', 'Hesaplama', 'Programları', 'SMS', 'Özgeçmiş', 
    'Noterlik', 'Tazminat', 'Bilirkişilik', 'Dava Aç', 'Tamamlanmayan', 
    'Duyurular', 'Oturum', 'İletişim', 'Fotoğraf', 'Tebligat', 'Adres', 'Gönder', 
    'İtiraz', 'Araç', 'Başvuru', 'Taraf Bilgileri', 'Evrak', 'Safahat', 
    'Ön İzlemeyi Aktifleştir', 'Önceki', 'Sonraki', '2026/', 
    'Toplam', 'sayfadan', 'gösteriliyor'
  ];

  let downloadedSet = [];
  try {
    downloadedSet = JSON.parse(localStorage.getItem('uyap_massive_downloaded') || '[]');
  } catch (e) {
    downloadedSet = [];
  }

  let batchCount = 0;
  let totalProcessed = downloadedSet.length;

  console.log(`🚀 [EKLENTİ ARŞİV MODU]: Başlatıldı. Hafızadaki indirilenler: ${totalProcessed}`);

  while (true) {
    const bodyText = document.body ? document.body.innerText : "";
    if (bodyText.includes("Giriş Yap") || bodyText.includes("Oturumunuz sona ermiştir")) {
      console.error("❌ [OTURUM DÜŞTÜ]: UYAP oturumu kapandı! 20 saniye bekleniyor...");
      await delay(20000);
      continue;
    }

    if (batchCount >= 200) {
      console.warn("🛑 [MOLA]: 200 dosya tamamlandı, 45 saniye dinleniliyor...");
      await delay(45000);
      batchCount = 0;
    }

    const container = document.querySelector('.ui-dialog, .ui-dialog-content') || document.body;

    // Kapalı klasörleri aç
    const closedFolders = container.querySelectorAll('li.dynatree-closed span.dynatree-expander, li.closed span.folder, .dynatree-expander');
    let openedAny = false;
    
    for (let folder of closedFolders) {
      const parentLi = folder.closest('li');
      if (parentLi && parentLi.classList.contains('dynatree-closed')) {
        folder.scrollIntoView({ behavior: 'smooth', block: 'center' });
        folder.click();
        if (window.jQuery) {
          window.jQuery(folder).trigger('click');
        }
        openedAny = true;
        await delay(400);
      }
    }

    if (openedAny) {
      console.log("📂 [KLASÖR]: Kapalı klasörler açıldı, içerik yükleniyor...");
      await delay(800);
      continue;
    }

    // Evrak elementlerini tara
    const elements = Array.from(container.querySelectorAll('span.dynatree-title, a, span.file'));

    let targetItem = null;
    let targetText = "";

    for (let el of elements) {
      const text = el.textContent ? el.textContent.trim() : '';
      if (text.length < 5) continue;

      const isBlocked = blockedKeywords.some(kw => text.includes(kw));
      const hasDate = /\d{2}\/\d{2}\/\d{4}/.test(text);
      const isDocument = hasDate || text.includes('Makbuzu') || text.includes('Tebligat') || text.includes('Dilekçesi') || text.includes('Zaptı') || text.includes('Fişi') || text.includes('Mazbatası') || text.startsWith('Ek ');

      if (!isBlocked && isDocument && !downloadedSet.includes(text)) {
        targetItem = el;
        targetText = text;
        break;
      }
    }

    if (!targetItem) {
      console.log("🎉 [BİTTİ]: Taranacak yeni evrak kalmadı.");
      break;
    }

    try {
      targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await delay(400);

      console.log(`📥 [İşleniyor] Toplam: ${totalProcessed + 1} | ${targetText}`);

      const rect = targetItem.getBoundingClientRect();
      const clientX = rect.x + (rect.width / 2);
      const clientY = rect.y + (rect.height / 2);

      ['mousedown', 'contextmenu'].forEach(eventType => {
        const event = new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 2,
          buttons: 2,
          clientX: clientX,
          clientY: clientY
        });
        targetItem.dispatchEvent(event);
      });

      await delay(1000);

      const menuItems = Array.from(document.querySelectorAll('.context-menu-item, li.context-menu-item'));
      let saveOption = menuItems.find(el => {
        const inner = el.querySelector('.context-menu-item-inner');
        const txt = inner ? inner.textContent.trim() : el.textContent.trim();
        return txt === 'Kaydet';
      });

      if (!saveOption) {
        const allDivs = Array.from(document.querySelectorAll('div, span, a'));
        saveOption = allDivs.find(el => el.textContent.trim() === 'Kaydet' && el.offsetParent !== null);
      }

      if (saveOption) {
        saveOption.click();
        if (window.jQuery) {
          window.jQuery(saveOption).trigger('click');
        }

        downloadedSet.push(targetText);
        localStorage.setItem('uyap_massive_downloaded', JSON.stringify(downloadedSet));

        totalProcessed++;
        batchCount++;
        console.log(`✅ [BAŞARILI]: ${targetText}`);
      } else {
        console.warn(`⚠️ [ATLANDI]: "Kaydet" seçeneği menüde bulunamadı -> ${targetText}`);
        downloadedSet.push(targetText);
        localStorage.setItem('uyap_massive_downloaded', JSON.stringify(downloadedSet));
      }
      
      await delay(4000);

    } catch (err) {
      console.error("❌ Hata oluştu:", err);
      await delay(3000);
    }
  }

  console.log(`✨ Tüm arşiv taraması tamamlandı. Toplam işlenen dosya: ${totalProcessed}`);
}