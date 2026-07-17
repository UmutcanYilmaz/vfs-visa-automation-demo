"use client";

import { useState } from 'react';

export default function Home() {
  const [logs, setLogs] = useState<string[]>([
    "[SYSTEM] Demo Kontrol Paneli Hazır.",
    "[SYSTEM] VFS Global yerel demo botunu tetiklemeyi bekliyor..."
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const startDemo = async () => {
    setIsRunning(true);
    addLog("[WEB] Bot başlatma sinyali gönderiliyor...");
    try {
      const res = await fetch('/api/run-bot', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        addLog(`[SUCCESS] ${data.message}`);
      } else {
        addLog(`[ERROR] ${data.error}`);
      }
    } catch (err) {
      addLog(`[ERROR] İstek başarısız: ${err}`);
    } finally {
      setIsRunning(false);
    }
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-bold text-emerald-400">VFS Global Demo Panel</h1>
          <p className="text-slate-500 mt-2">Yerel (Local) Otomasyon - Firefox Playwright Modülü</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h2 className="text-lg font-semibold text-slate-100 border-b border-slate-800 pb-2">Kontrol Merkezi</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Bu demo sürümü, yerel makinenizde Firefox tarayıcısını <strong>görünür modda (headless: false)</strong> başlatır.
              <br/><br/>
              CAPTCHA adımlarında tarayıcı açık kalacak ve <strong>sizin manuel olarak doğrulama yapmanızı bekleyecektir</strong>.
            </p>
            <button 
              onClick={startDemo}
              disabled={isRunning}
              className={`w-full py-3 px-4 rounded-lg font-bold text-sm transition-colors ${
                isRunning 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50'
              }`}
            >
              {isRunning ? 'Bot Çalışıyor...' : 'VFS Demo Botunu Başlat'}
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 flex flex-col">
            <h2 className="text-lg font-semibold text-slate-100 border-b border-slate-800 pb-2">Canlı Log Çıktısı</h2>
            <div className="bg-black flex-1 rounded-lg p-4 font-mono text-xs overflow-y-auto space-y-2 max-h-64 border border-slate-800">
              {logs.map((log, i) => (
                <div key={i} className={
                  log.includes('[ERROR]') ? 'text-red-400' : 
                  log.includes('[SUCCESS]') ? 'text-emerald-400' : 
                  'text-slate-400'
                }>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
