import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineUsers,
  HiOutlineClock,
  HiOutlineExclamation,
} from "react-icons/hi";

interface FriendData {
  _id: string;
  name: string;
  totalGiven: number;
  totalReceived: number;
  netBalance: number;
  recentTransaction: {
    amount: number;
    type: string;
    date: string;
    settled: boolean;
  } | null;
}

export default function Dashboard() {
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await api.get("/friends");
      setFriends(res.data);
    } catch (err) {
      console.error("Failed to load friends:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalYouWillGet = friends.reduce(
    (sum, f) => sum + (f.netBalance > 0 ? f.netBalance : 0),
    0
  );
  const totalYouOwe = friends.reduce(
    (sum, f) => sum + (f.netBalance < 0 ? Math.abs(f.netBalance) : 0),
    0
  );
  const totalFriends = friends.length;

  // Memory Mode: Get recent unsettled transactions
  const memories = friends
    .filter((f) => f.recentTransaction && !f.recentTransaction.settled)
    .map((f) => {
      const t = f.recentTransaction!;
      const daysAgo = Math.floor(
        (Date.now() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24)
      );
      const action = t.type === "given" ? "gave" : "received";
      return {
        friendName: f.name,
        amount: t.amount,
        action,
        daysAgo,
        friendId: f._id,
      };
    })
    .sort((a, b) => b.daysAgo - a.daysAgo)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="main-content">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>Welcome, {user?.name?.split(" ")[0]}! 👋</h1>
        <p>Here's your expense overview</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card positive">
          <div className="icon-wrapper">
            <HiOutlineTrendingUp />
          </div>
          <div className="label">You'll Receive</div>
          <div className="value text-positive">₹{totalYouWillGet.toLocaleString()}</div>
        </div>

        <div className="summary-card negative">
          <div className="icon-wrapper">
            <HiOutlineTrendingDown />
          </div>
          <div className="label">You Owe</div>
          <div className="value text-negative">₹{totalYouOwe.toLocaleString()}</div>
        </div>

        <div className="summary-card accent">
          <div className="icon-wrapper">
            <HiOutlineUsers />
          </div>
          <div className="label">Total Friends</div>
          <div className="value">{totalFriends}</div>
        </div>
      </div>

      {/* Memory Mode */}
      {memories.length > 0 && (
        <div style={{ marginBottom: "var(--space-xl)" }}>
          <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, marginBottom: "var(--space-md)", display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            <HiOutlineClock style={{ color: "var(--color-warning)" }} />
            Memory Mode
          </h2>
          {memories.map((m, i) => (
            <div className="memory-alert" key={i} onClick={() => navigate(`/friends/${m.friendId}`)} style={{ cursor: "pointer" }}>
              <div className="alert-icon">
                <HiOutlineExclamation />
              </div>
              <div className="alert-text">
                You <strong>{m.action} ₹{m.amount.toLocaleString()}</strong>{" "}
                {m.action === "gave" ? "to" : "from"} <strong>{m.friendName}</strong>{" "}
                {m.daysAgo === 0
                  ? "today"
                  : m.daysAgo === 1
                  ? "yesterday"
                  : `${m.daysAgo} days ago`}
                {m.daysAgo > 3 && <span style={{ color: "var(--color-negative)" }}> — Still not settled ❗</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friend-wise Summary */}
      <div>
        <div className="flex-between" style={{ marginBottom: "var(--space-md)" }}>
          <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700 }}>
            Friend-wise Summary
          </h2>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate("/friends")}>
            View All
          </button>
        </div>

        {friends.length === 0 ? (
          <div className="empty-state">
            <div className="icon">👥</div>
            <h3>No friends yet</h3>
            <p>Add friends to start tracking expenses</p>
            <button className="btn btn-primary" onClick={() => navigate("/friends")}>
              Add Friend
            </button>
          </div>
        ) : (
          <div className="list-grid">
            {friends.slice(0, 6).map((friend, index) => (
              <div
                key={friend._id}
                className="list-item animate-in"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => navigate(`/friends/${friend._id}`)}
              >
                <div
                  className="avatar"
                  style={{
                    background:
                      friend.netBalance > 0
                        ? "var(--color-positive-bg)"
                        : friend.netBalance < 0
                        ? "var(--color-negative-bg)"
                        : "var(--bg-input)",
                    color:
                      friend.netBalance > 0
                        ? "var(--color-positive)"
                        : friend.netBalance < 0
                        ? "var(--color-negative)"
                        : "var(--text-secondary)",
                  }}
                >
                  {friend.name.charAt(0).toUpperCase()}
                </div>
                <div className="info">
                  <h3>{friend.name}</h3>
                  <p>
                    Given: ₹{friend.totalGiven.toLocaleString()} | Received: ₹
                    {friend.totalReceived.toLocaleString()}
                  </p>
                </div>
                <div className="balance">
                  <div
                    className={`amount ${
                      friend.netBalance > 0
                        ? "text-positive"
                        : friend.netBalance < 0
                        ? "text-negative"
                        : "text-secondary"
                    }`}
                  >
                    {friend.netBalance > 0
                      ? `+₹${friend.netBalance.toLocaleString()}`
                      : friend.netBalance < 0
                      ? `-₹${Math.abs(friend.netBalance).toLocaleString()}`
                      : "₹0"}
                  </div>
                  <div className="label">
                    {friend.netBalance > 0
                      ? "owes you"
                      : friend.netBalance < 0
                      ? "you owe"
                      : "settled"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
