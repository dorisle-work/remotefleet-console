import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { io } from 'socket.io-client';

interface TerminalStreamProps {
  deploymentId: string;
  serverId: string;
  serverName: string;
}

export function TerminalStream({
  deploymentId,
  serverId,
  serverName,
}: TerminalStreamProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      theme: {
        background: '#1c1f26',
        foreground: '#f5f6f8',
        cursor: '#3ddc97',
        selectionBackground: '#334155',
      },
      fontFamily: 'Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif',
      fontSize: 13,
      lineHeight: 1.45,
      cursorBlink: true,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3001');
    const channel = `deployment:${deploymentId}:${serverId}`;

    socket.emit('subscribe', { channel });
    socket.on('log', (chunk: string) => {
      term.write(chunk);
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.disconnect();
      term.dispose();
    };
  }, [deploymentId, serverId]);

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-white shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-tide step-pulse" />
          <span className="text-[13px] font-semibold text-ink">{serverName}</span>
        </div>
        <span className="text-[11px] font-medium text-slate-400">
          SSHv2 PTY Session
        </span>
      </div>
      <div className="bg-ink px-3 pb-3 pt-1">
        <div ref={terminalRef} className="h-80 w-full overflow-hidden rounded-xl" />
      </div>
    </div>
  );
}
