import { apiClient } from "./client";

// POST /auth/login  -> AuthResponse { token, username, role, userId }
export function login(username, password) {
  return apiClient.post("/auth/login", { username, password }).then((r) => r.data);
}

// POST /auth/register -> AuthResponse
// userType: "ADMIN" | "AUCTIONEER" | "BIDDER"
export function register(payload) {
  return apiClient.post("/auth/register", payload).then((r) => r.data);
}
