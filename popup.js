document.addEventListener('DOMContentLoaded', () => {
  const downloadBtn = document.getElementById('downloadBtn');
  
  if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.url || !tab.url.includes('vatandas.uyap.gov.tr')) {
        document.getElementById('status').innerText = 'Lütfen UYAP portalında bir dosya açın!';
        return;
      }

      document.getElementById('status').innerText = 'İndirme kuyruğu başlatılıyor... 🚀';

      // Doğrudan content.js ve kütüphaneyi sayfaya enjekte edip çalıştırıyoruz
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['jszip.min.js', 'content.js']
      }, () => {
        if (chrome.runtime.lastError) {
          document.getElementById('status').innerText = 'Hata: Sayfayı yenileyip tekrar deneyin!';
          console.error(chrome.runtime.lastError.message);
          return;
        }
        
        document.getElementById('status').innerText = 'Evraklar sırayla indiriliyor... 🍺';
        
        // Kod enjekte edildikten sonra indirme fonksiyonunu tetikle
        chrome.tabs.sendMessage(tab.id, { action: "start_download" }).catch(() => {});
      });
    });
  }
});