import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AuctionList from "./pages/AuctionList";
import AuctionDetail from "./pages/AuctionDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateAuction from "./pages/CreateAuction";
import MyAuctions from "./pages/MyAuctions";
import MyRegistrations from "./pages/MyRegistrations";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<AuctionList />} />
          <Route path="/auctions/:id" element={<AuctionDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/create-auction"
            element={
              <ProtectedRoute role="AUCTIONEER">
                <CreateAuction />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-auctions"
            element={
              <ProtectedRoute role="AUCTIONEER">
                <MyAuctions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-registrations"
            element={
              <ProtectedRoute role="BIDDER">
                <MyRegistrations />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
