import { apiClient } from "./client";

// GET /auctions -> AuctionResponse[] (public)
export function listPublicAuctions() {
  return apiClient.get("/auctions").then((r) => r.data);
}

// GET /auctions/{id} -> AuctionResponse (public)
export function getAuction(id) {
  return apiClient.get(`/auctions/${id}`).then((r) => r.data);
}

// GET /auctioneer/auctions/my -> AuctionResponse[] (auctioneer)
export function getMyAuctions() {
  return apiClient.get("/auctioneer/auctions/my").then((r) => r.data);
}

// POST /auctioneer/auctions -> AuctionResponse (auctioneer)
export function createAuction(payload) {
  return apiClient.post("/auctioneer/auctions", payload).then((r) => r.data);
}

// DELETE /auctioneer/auctions/{id} (auctioneer, own SCHEDULED auction only)
export function deleteAuction(id) {
  return apiClient.delete(`/auctioneer/auctions/${id}`).then((r) => r.data);
}
