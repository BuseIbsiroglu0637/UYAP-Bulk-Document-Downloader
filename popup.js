document.addEventListener('DOMContentLoaded', () => {
  const downloadBtn = document.getElementById('downloadBtn');
  const stopBtn = document.getElementById('stopBtn');
  const resetBtn = document.getElementById('resetBtn');
  const statusDiv = document.getElementById('status');

  // 1. BAŞLAT / DEVAM ET BUTONU
  if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.url || !tab.url.includes('vatandas.uyap.gov.tr')) {
        statusDiv.innerText = 'Lütfen UYAP portalında bir dosya açın!';
        statusDiv.style.color = '#e74c3c';
        return;
      }

      statusDiv.innerText = 'İndirme kuyruğu başlatılıyor... 🚀';
      statusDiv.style.color = '#4f46e5';

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['jszip.min.js', 'content.js']
      }, () => {
        if (chrome.runtime.lastError) {
          statusDiv.innerText = 'Hata: Sayfayı yenileyip tekrar deneyin!';
          statusDiv.style.color = '#e74c3c';
          console.error(chrome.runtime.lastError.message);
          return;
        }
        
        statusDiv.innerText = 'Evraklar sırayla indiriliyor... 🍺';
        
        chrome.tabs.sendMessage(tab.id, { action: "start_download" }).catch(() => {});
      });
    });
  }

  // 2. DURDUR BUTONU
  if (stopBtn) {
    stopBtn.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      chrome.tabs.sendMessage(tab.id, { action: "stop_download" }).catch(() => {});
      statusDiv.innerText = '🛑 Otomasyon durduruldu.';
      statusDiv.style.color = '#ef4444';
    });
  }

  // 3. HAFIZAYI SIFIRLA BUTONU
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      chrome.tabs.sendMessage(tab.id, { action: "reset_storage" }).catch(() => {});
      statusDiv.innerText = '🔄 İndirme hafızası tamamen temizlendi!';
      statusDiv.style.color = '#f59e0b';
    });
  }
});