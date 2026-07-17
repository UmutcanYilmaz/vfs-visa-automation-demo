import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function POST() {
  try {
    // Determine the path to the bot directory
    const botEngineDir = path.resolve(process.cwd(), '../bot');
    
    // Execute the bot script using pnpm
    // This will spawn a new process running the playwright script
    exec('pnpm start', { cwd: botEngineDir }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Bot execution error: ${error}`);
        return;
      }
      console.log(`Bot stdout: ${stdout}`);
      if (stderr) console.error(`Bot stderr: ${stderr}`);
    });

    return NextResponse.json({ message: 'Bot tetiklendi. Tarayıcı penceresi birazdan açılacaktır.' }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Bot başlatılamadı.' }, { status: 500 });
  }
}
