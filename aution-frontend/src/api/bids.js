import { apiClient } from "./client";

// POST /bids/{auctionId} -> BidResponse
export function placeBid(auctionId, bidAmount) {
  return apiClient.post(`/bids/${auctionId}`, { bidAmount }).then((r) => r.data);
}

// GET /bids/{auctionId}/current -> BidUpdateMessage
export function getCurrentBidState(auctionId) {
  return apiClient.get(`/bids/${auctionId}/current`).then((r) => r.data);
}
