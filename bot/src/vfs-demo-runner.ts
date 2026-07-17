import { chromium, type Page } from 'playwright';
import path from 'path';
import fs from 'fs';

/**
 * VFS Global Türkiye - Avusturya Demo Otomasyon Botu (CDP Attach Sürümü)
 * 
 * 403201 Bypass Stratejisi:
 * 1. Tarayıcıya Dışarıdan Bağlanma (CDP - Chrome DevTools Protocol):
 *    Playwright tarayıcıyı sıfırdan başlatmaz. Bilgisayarınızda 9222 portunda açık olan
 *    GERÇEK Chrome tarayıcısına bağlanır. Bu sayede TLS, JA3/JA4 ağ parmak izleri %100 insan olarak görünür.
 */

const TARGET_URL = 'https://visa.vfsglobal.com/tur/tr/dnk/';

function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function humanType(page: Page, selector: string, text: string) {
  await page.click(selector);
  for (const char of text) {
    await page.keyboard.type(char, { delay: randomDelay(70, 190) });
    if (Math.random() < 0.1) {
      await sleep(randomDelay(150, 400));
    }
  }
}

async function humanMouseMove(page: Page, targetX: number, targetY: number) {
  const mouse = page.mouse;
  const startX = randomDelay(100, 300);
  const startY = randomDelay(100, 300);
  const cp1x = startX + (targetX - startX) * 0.3 + randomDelay(-20, 20);
  const cp1y = startY + (targetY - startY) * 0.1 + randomDelay(-15, 15);
  const cp2x = startX + (targetX - startX) * 0.7 + randomDelay(-20, 20);
  const cp2y = startY + (targetY - startY) * 0.9 + randomDelay(-15, 15);

  const steps = randomDelay(18, 30);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * u * startX + 3 * u * u * t * cp1x + 3 * u * t * t * cp2x + t * t * t * targetX;
    const y = u * u * u * startY + 3 * u * u * t * cp1y + 3 * u * t * t * cp2y + t * t * t * targetY;
    await mouse.move(x, y);
    await sleep(randomDelay(8, 20));
  }
}

async function buildTrust(page: Page) {
  console.log('[BOT] Güvenlik mekanizmaları için doğal hareketler simüle ediliyor...');
  for (let i = 0; i < 3; i++) {
    await humanMouseMove(page, randomDelay(100, 900), randomDelay(100, 700));
    await sleep(randomDelay(300, 800));
  }
  await page.mouse.wheel(0, randomDelay(100, 300));
  await sleep(600);
}

// ── Çerez Onay Kapatma ────────────────────────────────────────────────────

async function handleCookies(page: Page) {
  console.log('[BOT] Çerez onay kutusu kontrol ediliyor...');
  try {
    const cookieSelectors = [
      '#onetrust-accept-btn-handler',
      'button:has-text("Accept All")',
      'button:has-text("Kabul Et")',
      'button:has-text("Tümünü Kabul Et")',
      'button:has-text("Accept All Cookies")',
      'button:has-text("Tüm Çerezleri Kabul Et")',
      '#btn-accept-cookie',
      '.cookie-consent-accept-all'
    ];

    for (const selector of cookieSelectors) {
      const btn = await page.$(selector).catch(() => null);
      if (btn && await btn.isVisible()) {
        console.log(`[BOT] Çerez onay butonu bulundu (${selector}). Tıklanıyor...`);
        const box = await btn.boundingBox();
        if (box) {
          await humanMouseMove(page, box.x + box.width / 2, box.y + box.height / 2);
          await sleep(200);
        }
        await btn.click();
        console.log('[BOT] Çerezler onaylandı.');
        await sleep(1500);
        return;
      }
    }
    console.log('[BOT] Görünür çerez onay butonu bulunamadı veya zaten onaylanmış.');
  } catch (err) {
    console.log('[BOT] Çerez onaylanırken hata oluştu (önemsiz):', (err as Error).message);
  }
}

// ── Turnstile Bypass ──────────────────────────────────────────────────────

async function tryClickTurnstile(page: Page): Promise<boolean> {
  console.log('[CAPTCHA] Turnstile widget\'ı kontrol ediliyor...');
  try {
    const turnstileIframe = await page.waitForSelector(
      'iframe[src*="challenges.cloudflare.com"], iframe[src*="turnstile"]',
      { timeout: 8000 }
    ).catch(() => null);

    if (!turnstileIframe) {
      console.log('[CAPTCHA] Turnstile iframe bulunamadı.');
      return false;
    }

    const frame = await turnstileIframe.contentFrame();
    if (!frame) return false;

    await sleep(randomDelay(2000, 3500));

    const checkbox = await frame.waitForSelector(
      'input[type="checkbox"], .ctp-checkbox-label, #challenge-stage',
      { timeout: 5000 }
    ).catch(() => null);

    if (checkbox) {
      const box = await checkbox.boundingBox();
      if (box) {
        await humanMouseMove(page, box.x + box.width / 2, box.y + box.height / 2);
        await sleep(randomDelay(200, 500));
        await checkbox.click();
        console.log('[CAPTCHA] Checkbox tıklandı. Doğrulama bekleniyor...');

        await sleep(5000);
        const success = await page.evaluate(() => {
          const response = document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement;
          return response && response.value && response.value.length > 10;
        });
        if (success) {
          console.log('[CAPTCHA] ✅ Turnstile geçildi!');
          return true;
        }
      }
    }
    return false;
  } catch (err) {
    console.log('[CAPTCHA] Hata:', (err as Error).message);
    return false;
  }
}

// ── Ana Demo Akışı ────────────────────────────────────────────────────────

async function runDemo() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  VFS Global Türkiye - Avusturya Demo Otomasyon Botu      ║');
  console.log('║  Bağlantı Türü: CDP (Port 9222 üzerinden eklenme)        ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  let browser;
  try {
    // Halihazırda açık olan Google Chrome'a bağlanıyoruz
    browser = await chromium.connectOverCDP('http://localhost:9222');
    console.log('[BOT] Hata ayıklama modundaki Chrome tarayıcısına başarıyla bağlandı.');
  } catch (err) {
    console.error('[HATA] Chrome\'a bağlanılamadı. Lütfen terminalden şu komutla Chrome\'u başlattığınızdan emin olun:');
    console.error('google-chrome --remote-debugging-port=9222 --user-data-dir="/home/sezin/Documents/vizetest/bot/.chrome-debug-profile"');
    return;
  }

  // İlk sekmeyi al veya yeni sekme aç
  const context = browser.contexts()[0];
  const page = context.pages()[0] || await context.newPage();

  try {
    // ── ADIM 1: Ana Portala Git ──
    console.log('[BOT] VFS Global Avusturya ana sayfasına gidiliyor...');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 90000 });
    console.log('[BOT] Ana sayfa yüklendi.');
    await sleep(2000);

    // Çerezleri onayla (Ana sayfada)
    await handleCookies(page);

    await buildTrust(page);

    // ── ADIM 2: "Randevu Alın" Butonunu Bul ve Tıkla ──
    console.log('[BOT] Randevu alma yönlendirme butonu aranıyor...');
    const bookButtonSelectors = [
      'a:has-text("Randevu şimdi alın")',
      'a:has-text("Book now")',
      'a[href*="/book-an-appointment"]',
      'a:has-text("Randevu al")'
    ];

    let clicked = false;
    let targetPage = page;

    // Yeni sekme açılırsa yakalamak için dinleyiciyi hazırlıyoruz
    const popupPromise = context.waitForEvent('page', { timeout: 15000 }).catch(() => null);

    for (const selector of bookButtonSelectors) {
      const btn = await page.$(selector);
      if (btn) {
        console.log(`[BOT] Yönlendirme butonu bulundu (${selector}). Tıklanıyor...`);
        const box = await btn.boundingBox();
        if (box) {
          await humanMouseMove(page, box.x + box.width / 2, box.y + box.height / 2);
          await sleep(400);
        }

        await btn.click();
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      console.log('[BOT] Yönlendirme butonu bulunamadı.');
    }

    // Yeni sekme açıldıysa ona geçiş yap, açılmadıysa mevcut sayfadan devam et
    const newPage = await popupPromise;
    if (newPage) {
      console.log('[BOT] Randevu sayfası yeni sekmede açıldı. Yeni sekmeye geçiliyor...');
      targetPage = newPage;
    } else {
      console.log('[BOT] Randevu sayfası aynı sekmede yükleniyor...');
    }

    console.log('[BOT] Yönlendirme sonrası sayfanın yüklenmesi bekleniyor...');
    await targetPage.waitForLoadState('networkidle', { timeout: 60000 });
    await sleep(4000);

    // Çerezleri onayla (Yönlendirilen randevu sayfasında)
    await handleCookies(targetPage);

    // ── ADIM 2.5: "Let's get started" veya "Başlayalım" Butonunu Bul ve Tıkla ──
    console.log("[BOT] 'Let's get started' veya 'Başlayalım' butonu aranıyor...");
    const startButtonSelectors = [
      '.lets-get-started',
      'button.lets-get-started',
      'a.lets-get-started',
      'button:has-text("Şimdi randevu al")',
      'a:has-text("Şimdi randevu al")',
      'span:has-text("Şimdi randevu al")',
      '.btn-brand-orange',
      'button.mat-flat-button'
    ];

    let startClicked = false;
    // 'Let's get started' tıklandığında yeni bir sekme/sayfa açılma olasılığına karşı dinleyici hazırlıyoruz
    const startPopupPromise = context.waitForEvent('page', { timeout: 15000 }).catch(() => null);

    for (const selector of startButtonSelectors) {
      const btn = await targetPage.$(selector).catch(() => null);
      if (btn && await btn.isVisible()) {
        console.log(`[BOT] Başlatma butonu bulundu (${selector}). Tıklanıyor...`);
        const box = await btn.boundingBox();
        if (box) {
          await humanMouseMove(targetPage, box.x + box.width / 2, box.y + box.height / 2);
          await sleep(300);
        }
        await btn.click();
        startClicked = true;
        console.log("[BOT] Başlatma butonuna tıklandı.");
        break;
      }
    }

    if (startClicked) {
      // Eğer tıklamadan sonra yeni bir sekme açıldıysa ona odaklanıyoruz
      const newPageAfterStart = await startPopupPromise;
      if (newPageAfterStart) {
        console.log('[BOT] Login ekranı yeni sekmede açıldı! Yeni sekmeye geçiliyor...');
        targetPage = newPageAfterStart;
      } else {
        console.log('[BOT] Login ekranı aynı sekmede açılıyor...');
      }
      await sleep(4000);
      await targetPage.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => null);
    } else {
      console.log("[BOT] Başlatma butonu bulunamadı veya zaten geçilmiş.");
    }

    // ── ADIM 3: CAPTCHA Kontrolü ──
    let captchaSolved = false;
    const hasTurnstile = await targetPage.evaluate(() => {
      return !!(
        document.querySelector('.cf-turnstile') ||
        document.querySelector('[data-sitekey]') ||
        document.querySelector('iframe[src*="challenges.cloudflare.com"]')
      );
    });

    if (hasTurnstile) {
      console.log('[CAPTCHA] Cloudflare Turnstile tespit edildi!');
      captchaSolved = await tryClickTurnstile(targetPage);

      if (!captchaSolved) {
        console.log('[CAPTCHA] Otomatik tıklama başarısız oldu. Lütfen tarayıcıda manuel olarak çözün.');
      }
    }

    // ── ADIM 4: Giriş Formunu Doldur ──
    console.log('[BOT] Giriş formu bekleniyor...');

    // Genişletilmiş, daha güçlü seçiciler
    const emailSelector = 'input[formcontrolname="username"], input[type="email"], #email, #mat-input-0, input[placeholder*="email" i], input[placeholder*="E-posta" i]';
    const passwordSelector = 'input[formcontrolname="password"], input[type="password"], #password, #mat-input-1, input[placeholder*="şifre" i], input[placeholder*="password" i]';

    await targetPage.waitForSelector(emailSelector, { timeout: 300000 });

    console.log('[BOT] Giriş formu tespit edildi. Bilgiler giriliyor...');
    await sleep(randomDelay(1000, 2000));

    // Çerezleri tekrar kapatma denemesi (form alanını kapatıyor olabilir)
    await handleCookies(targetPage);

    const emailField = await targetPage.$(emailSelector);
    const passwordField = await targetPage.$(passwordSelector);

    if (emailField) {
      await humanType(targetPage, emailSelector, 'REDACTED_EMAIL');
      console.log('[BOT] E-posta adresi girildi.');
    } else {
      console.log('[BOT] E-posta alanı bulunamadı.');
    }

    await sleep(randomDelay(500, 1200));

    if (passwordField) {
      await humanType(targetPage, passwordSelector, 'REDACTED_PASSWORD');
      console.log('[BOT] Şifre girildi.');
    } else {
      console.log('[BOT] Şifre alanı bulunamadı.');
    }

    await sleep(randomDelay(1000, 2000));

    // ── ADIM 5: Oturum Aç Butonuna Tıkla ──
    console.log('[BOT] Oturum Aç butonu aranıyor...');
    const loginButtonSelectors = [
      'span.mdc-button__label:has-text("Oturum Aç")',
      'span.mdc-button__label:has-text("Oturum aç")',
      'button:has-text("Oturum Aç")',
      'button:has-text("Oturum aç")',
      'button.btn-brand-orange',
      'button[type="submit"]'
    ];

    let loginClicked = false;
    for (const selector of loginButtonSelectors) {
      const btn = await targetPage.$(selector).catch(() => null);
      if (btn && await btn.isVisible()) {
        console.log(`[BOT] Oturum Aç butonu bulundu (${selector}). Tıklanıyor...`);
        const box = await btn.boundingBox();
        if (box) {
          await humanMouseMove(targetPage, box.x + box.width / 2, box.y + box.height / 2);
          await sleep(randomDelay(300, 600));
        }
        await btn.click();
        loginClicked = true;
        console.log('[BOT] Oturum Aç butonuna başarıyla tıklandı.');
        break;
      }
    }

    if (!loginClicked) {
      console.log('[BOT] Oturum Aç/Submit butonu bulunamadı.');
    }

    console.log('[BOT] Dashboard ekranının yüklenmesi bekleniyor...');
    // Başarıyla yönlenene kadar bekle
    await targetPage.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => null);
    await sleep(6000); // Ekranın tamamen stabil olmasını bekleyelim

    // ── ADIM 6: "Yeni Rezervasyon Başlat" Butonunu Bul ve Tıkla ──
    console.log('[BOT] "Yeni Rezervasyon Başlat" veya "Start New Booking" butonu bekleniyor...');
    const bookingBtnSelector = 'button:has-text("Yeni Rezervasyon Başlat"), button:has-text("Start New Booking"), span.mdc-button__label:has-text("Yeni Rezervasyon Başlat")';
    await targetPage.waitForSelector(bookingBtnSelector, { timeout: 60000 });

    const bookingBtn = await targetPage.$(bookingBtnSelector);
    if (bookingBtn) {
      console.log('[BOT] "Yeni Rezervasyon Başlat" butonu bulundu. Tıklanıyor...');
      const box = await bookingBtn.boundingBox();
      if (box) {
        await humanMouseMove(targetPage, box.x + box.width / 2, box.y + box.height / 2);
        await sleep(randomDelay(300, 600));
      }
      await bookingBtn.click();
      console.log('[BOT] "Yeni Rezervasyon Başlat" butonuna başarıyla tıklandı.');
      await sleep(4000);
      await targetPage.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => null);
    } else {
      console.log('[BOT] "Yeni Rezervasyon Başlat" butonu bulunamadı.');
      return;
    }

    // ── ADIM 7: Müşteri Vize Başvuru Merkezi Tercihini Seç ──
    // Tercihler (Gelecekte kullanıcıdan alınacak dinamik değer):
    // "DEANK" -> Ankara
    // "DEANT" -> Antalya
    // "DEIT" -> Istanbul-Beyoglu
    // "DEIZ" -> Izmir
    // "GAZ" -> Gaziantep
    const CUSTOMER_CENTER_CHOICE = 'DEIT'; // Müşterinin seçmek istediği merkez ID'si

    console.log(`[BOT] Vize başvuru merkezi dropdown'ı aranıyor (Seçilecek: ${CUSTOMER_CENTER_CHOICE})...`);
    
    // Mat-Select dropdown tetikleyicisini bulup tıkla
    const dropdownSelectors = [
      'mat-select[formcontrolname="vacLocation"]',
      'mat-select[role="combobox"]',
      '.mat-mdc-select-trigger',
      '#mat-select-0'
    ];

    let dropdownClicked = false;
    for (const selector of dropdownSelectors) {
      const dropdown = await targetPage.$(selector).catch(() => null);
      if (dropdown && await dropdown.isVisible()) {
        console.log(`[BOT] Dropdown bulundu (${selector}). Açmak için tıklanıyor...`);
        const box = await dropdown.boundingBox();
        if (box) {
          await humanMouseMove(targetPage, box.x + box.width / 2, box.y + box.height / 2);
          await sleep(randomDelay(300, 600));
        }
        await dropdown.click();
        dropdownClicked = true;
        console.log('[BOT] Dropdown açıldı.');
        await sleep(1500);
        break;
      }
    }

    if (!dropdownClicked) {
      console.log('[BOT] Vize başvuru merkezi dropdown tetikleyicisi bulunamadı.');
      return;
    }

    // Dropdown listesinin (overlay panel) render olmasını bekle
    console.log('[BOT] Dropdown seçenekler paneli bekleniyor...');
    const optionSelector = `mat-option#${CUSTOMER_CENTER_CHOICE}, mat-option[id="${CUSTOMER_CENTER_CHOICE}"]`;
    await targetPage.waitForSelector(optionSelector, { timeout: 15000 });

    const option = await targetPage.$(optionSelector);
    if (option) {
      console.log(`[BOT] Hedef seçenek bulundu (${CUSTOMER_CENTER_CHOICE}). Seçiliyor...`);
      const box = await option.boundingBox();
      if (box) {
        await humanMouseMove(targetPage, box.x + box.width / 2, box.y + box.height / 2);
        await sleep(randomDelay(200, 500));
      }
      await option.click();
      console.log(`[BOT] ✅ Merkez başarıyla seçildi: ${CUSTOMER_CENTER_CHOICE}`);
    } else {
      console.log(`[BOT] Hedef merkez seçeneği bulunamadı: ${CUSTOMER_CENTER_CHOICE}`);
    }

    console.log('');
    console.log('[BOT] ✅ Tüm işlemler ve Danimarka Merkez seçimi başarıyla tamamlandı.');
    console.log('[BOT] Tarayıcıyı kapatmıyorum, kontrol sizde.');

  } catch (error) {
    console.error('[HATA] Bot çalışırken hata oluştu:', (error as Error).message);
  } finally {
    console.log('[BOT] Tarayıcı bağlantısı kesildi (Pencere açık bırakıldı).');
  }
}

runDemo();
