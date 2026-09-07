# UYAP-Bulk-Document-Downloader

UYAP Vatandaş ve Avukat Portalındaki büyük hacimli dava dosyalarını (binlerce evrakı) manuel işlem yapmadan, tarayıcı oturumu içerisinde güvenli, sıralı ve kesintisiz bir şekilde indirmek için geliştirilmiş yerel tarayıcı otomasyon aracıdır.
-----------------------------------------------------------------------------------------------------------------------------------------
Özellikler

Oturum İçi Çalışma (In-Context Execution): WAF (Güvenlik Duvarı), iframe yapıları ve çerez kısıtlamalarını aşmak için harici istekler yerine doğrudan tarayıcı oturumu içinde çalışır.

Dinamik DOM Okuma: Statik listeler yerine anlık DOM taraması yaparak taze ve güncel evrakId değerlerini yakalar, böylece bayat veya geçersiz ID sorunlarını ortadan kaldırır.

Orijinal Akış Entegrasyonu: Evrakları dışarıdan zorlama yöntemlerle değil, UYAP'ın kendi orijinal form/AJAX tetikleme mekanizmaları (downloadDoc) üzerinden diske kaydeder.

Akıllı Kuyruk ve İnsani Gecikme (Throttle): Sunucuyu ve tarayıcıyı yormamak, güvenlik duvarlarına takılmamak için istekleri paketler halinde işler ve araya rastgele insani bekleme süreleri koyar.
