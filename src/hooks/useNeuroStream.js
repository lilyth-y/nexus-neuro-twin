import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for WebSocket connection to Neuro-Twin backend
 * @param {string} endpoint - WebSocket endpoint ('/ws/simulation' or '/ws/stream')
 * @param {boolean} autoConnect - Whether to connect automatically on mount
 */
export const useNeuroStream = (endpoint = '/ws/simulation', autoConnect = true) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(`${WS_URL}${endpoint}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[NeuroStream] Connected to', endpoint);
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setData(parsed);
        } catch (e) {
          console.error('[NeuroStream] Parse error:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('[NeuroStream] Error:', err);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('[NeuroStream] Disconnected');
        setIsConnected(false);
        
        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[NeuroStream] Attempting reconnect...');
          connect();
        }, 3000);
      };

    } catch (err) {
      console.error('[NeuroStream] Connection failed:', err);
      setError(err.message);
    }
  }, [endpoint, WS_URL]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const send = useCallback((params) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(params));
    } else {
      console.warn('[NeuroStream] Cannot send: not connected');
    }
  }, []);

  // Send EEG parameters
  const sendEEG = useCallback((theta, beta) => {
    send({ theta, beta });
  }, [send]);

  // Send action command
  const sendAction = useCallback((action) => {
    send({ action });
  }, [send]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => disconnect();
  }, [autoConnect, connect, disconnect]);

  return {
    data,
    isConnected,
    error,
    connect,
    disconnect,
    send,
    sendEEG,
    sendAction,
  };
};

export default useNeuroStream;
