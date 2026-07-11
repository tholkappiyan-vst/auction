import { apiClient } from "./client";

// POST /bidder/auctions/{id}/register -> AuctionRegistrationResponse
export function registerForAuction(auctionId) {
  return apiClient.post(`/bidder/auctions/${auctionId}/register`).then((r) => r.data);
}

// DELETE /bidder/auctions/{id}/unregister
export function unregisterFromAuction(auctionId) {
  return apiClient.delete(`/bidder/auctions/${auctionId}/unregister`).then((r) => r.data);
}

// GET /bidder/registrations -> AuctionRegistrationResponse[]
export function getMyRegistrations() {
  return apiClient.get("/bidder/registrations").then((r) => r.data);
}
