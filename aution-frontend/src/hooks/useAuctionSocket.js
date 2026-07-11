import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import { getToken } from "../api/client";

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8080";

/**
 * Subscribes to /topic/auction/{auctionId} for live BidUpdateMessage pushes.
 * Falls back gracefully if the socket can't connect -- callers should still
 * poll GET /bids/{auctionId}/current once on mount for the initial state.
 */
export function useAuctionSocket(auctionId) {
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const clientRef = useRef(null);

  useEffect(() => {
    if (!auctionId) return;

    const client = new Client({
      brokerURL: `${WS_BASE_URL}/ws`,
      connectHeaders: {
        Authorization: `Bearer ${getToken() || ""}`,
      },
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/auction/${auctionId}`, (message) => {
          try {
            setLastUpdate(JSON.parse(message.body));
          } catch {
            // ignore malformed frames
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [auctionId]);

  return { connected, lastUpdate };
}
