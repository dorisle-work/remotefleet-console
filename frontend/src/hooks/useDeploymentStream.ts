import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

export function useDeploymentStream(
  deploymentId: string | null,
  serverId: string | null,
): { connected: boolean; lastChunk: string } {
  const [connected, setConnected] = useState(false);
  const [lastChunk, setLastChunk] = useState('');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!deploymentId || !serverId) {
      return;
    }

    const socket = io(WS_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    const channel = `deployment:${deploymentId}:${serverId}`;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('subscribe', { channel });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('log', (chunk: string) => {
      setLastChunk(chunk);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [deploymentId, serverId]);

  return { connected, lastChunk };
}
