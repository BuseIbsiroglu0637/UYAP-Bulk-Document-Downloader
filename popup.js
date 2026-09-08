document.getElementById('startBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url.includes('vatandas.uyap.gov.tr')) {
    document.getElementById('status').innerText = 'Lütfen UYAP portalında bir dosya açın!';
    return;
  }

  document.getElementById('status').innerText = 'İndirme kuyruğu başlatılıyor...';

  chrome.tabs.sendMessage(tab.id, { action: "start_download" }, (response) => {
    if (chrome.runtime.lastError) {
      document.getElementById('status').innerText = 'Sayfayı yenileyip tekrar deneyin!';
      return;
    }
    if (response && response.status === "started") {
      document.getElementById('status').innerText = 'Evraklar sırayla indiriliyor...';
    }
  });
});