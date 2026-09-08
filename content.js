chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start_download") {
    sendResponse({ status: "started" });
    runContextSaveDownloader();
  }
});

async function runContextSaveDownloader() {
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const blockedKeywords = [
    'Kastamonu', 'Mahkemesi', 'Dosyaya', 'Tüm Evraklar', 'İşlerim', 'Ödeme', 
    'Gizleme', 'Doğrulama', 'Hesaplama', 'Programları', 'SMS', 'Özgeçmiş', 
    'Noterlik', 'Tazminat', 'Bilirkişilik', 'Dava Aç', 'Tamamlanmayan', 
    'Duyurular', 'Sorgulama', 'Oturum', 'İletişim', 'Fotoğraf', 'Tebligat', 
    'Adres', 'Gönder', 'İtiraz', 'Araç', 'Başvuru', 'Taraf Bilgileri', 
    'Evrak', 'Safahat', 'Ön İzlemeyi Aktifleştir', 'Önceki', 'Sonraki', '2026/', 
    'Toplam', 'sayfadan', 'gösteriliyor'
  ];

  let downloadedCount = 0;

  while (true) {
    const container = document.querySelector('.ui-dialog, .ui-dialog-content') || document.body;
    const elements = Array.from(container.querySelectorAll('span.dynatree-title, a, span'));

    let targetItem = null;

    for (let el of elements) {
      const text = el.textContent ? el.textContent.trim() : '';
      if (text.length < 5) continue;

      const isBlocked = blockedKeywords.some(kw => text.includes(kw));
      const hasDate = /\d{2}\/\d{2}\/\d{4}/.test(text);
      const isDocument = hasDate || text.includes('Makbuzu') || text.includes('Tebligat') || text.includes('Dilekçesi') || text.includes('Zaptı') || text.includes('Fişi') || text.includes('Mazbatası');

      if (!isBlocked && isDocument && !el.getAttribute('data-downloaded')) {
        targetItem = el;
        break;
      }
    }

    if (!targetItem) {
      console.log("İndirilecek başka evrak kalmadı. Tüm liste tamamlandı.");
      break;
    }

    try {
      const docText = targetItem.textContent.trim();
      console.log(`[İşleniyor] ${docText}`);

      targetItem.setAttribute('data-downloaded', 'true');

      // 1. Adım: Sadece sağ tık (contextmenu) olayını tetikle
      const rect = targetItem.getBoundingClientRect();
      const contextEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 2,
        clientX: rect.x + (rect.width / 2),
        clientY: rect.y + (rect.height / 2)
      });
      targetItem.dispatchEvent(contextEvent);

      // Menünün DOM'a düşmesi için bekle
      await delay(1000);

      // 2. Adım: Sayfada açılan context-menu içindeki "Kaydet" öğesini bul
      const menuItems = Array.from(document.querySelectorAll('.context-menu-item'));
      const saveOption = menuItems.find(el => {
        const inner = el.querySelector('.context-menu-item-inner');
        const txt = inner ? inner.textContent.trim() : el.textContent.trim();
        return txt === 'Kaydet';
      });

      if (saveOption) {
        console.log(`[Kaydediliyor] ${docText}`);
        saveOption.click();
        if (window.jQuery) {
          window.jQuery(saveOption).trigger('click');
        }
      } else {
        console.log(`[Uyarı] Kaydet seçeneği menüde bulunamadı: ${docText}`);
      }

      downloadedCount++;
      
      // Dosyanın inmesi ve sıradakine geçiş için süre
      await delay(4500);

    } catch (err) {
      console.error("Hata oluştu:", err);
      await delay(2000);
    }
  }

  console.log(`Toplam ${downloadedCount} evrak işleme alındı.`);
}