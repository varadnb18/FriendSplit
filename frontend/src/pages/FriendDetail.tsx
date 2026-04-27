import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import {
  HiOutlinePlus,
  HiOutlineArrowLeft,
  HiOutlineX,
  HiOutlineTrash,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineCash,
  HiOutlineClock,
} from "react-icons/hi";

interface Transaction {
  _id: string;
  amount: number;
  type: "given" | "received";
  date: string;
  note: string;
  settled: boolean;
}

interface FriendDetail {
  _id: string;
  name: string;
}

interface Summary {
  totalGiven: number;
  totalReceived: number;
  netBalance: number;
}

export default function FriendDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [friend, setFriend] = useState<FriendDetail | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalGiven: 0, totalReceived: 0, netBalance: 0 });
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"given" | "received">("given");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/transactions/${id}`);
      setFriend(res.data.friend);
      setTransactions(res.data.transactions);
      setSummary(res.data.summary);
    } catch (err) {
      toast.error("Failed to load data");
      navigate("/friends");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setAdding(true);
    try {
      await api.post("/transactions", {
        friendId: id,
        amount: numAmount,
        type,
        date,
        note,
      });
      toast.success("Transaction added! ✅");
      setAmount("");
      setNote("");
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add");
    } finally {
      setAdding(false);
    }
  };

  const handleSettle = async (transactionId: string) => {
    try {
      await api.patch(`/transactions/${transactionId}/settle`);
      toast.success("Updated!");
      fetchData();
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await api.delete(`/transactions/${transactionId}`);
      toast.success("Deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysAgo = (dateStr: string) => {
    const days = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: "var(--space-xl)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate("/friends")}
          >
            <HiOutlineArrowLeft />
          </button>
          <div>
            <h1 style={{
              fontSize: "var(--font-size-2xl)",
              fontWeight: 800,
              background: "var(--accent-gradient)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              {friend?.name}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-sm)" }}>
              {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="add-transaction-btn">
          <HiOutlinePlus /> Add Transaction
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card positive">
          <div className="icon-wrapper">
            <HiOutlineTrendingUp />
          </div>
          <div className="label">You Gave</div>
          <div className="value text-positive">₹{summary.totalGiven.toLocaleString()}</div>
        </div>

        <div className="summary-card negative">
          <div className="icon-wrapper">
            <HiOutlineTrendingDown />
          </div>
          <div className="label">You Received</div>
          <div className="value text-negative">₹{summary.totalReceived.toLocaleString()}</div>
        </div>

        <div className="summary-card accent">
          <div className="icon-wrapper">
            <HiOutlineCash />
          </div>
          <div className="label">Net Balance</div>
          <div className={`value ${summary.netBalance >= 0 ? "text-positive" : "text-negative"}`}>
            {summary.netBalance >= 0
              ? `+₹${summary.netBalance.toLocaleString()}`
              : `-₹${Math.abs(summary.netBalance).toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* Net Balance Status */}
      {summary.netBalance !== 0 && (
        <div
          className="card"
          style={{
            marginBottom: "var(--space-xl)",
            borderColor:
              summary.netBalance > 0
                ? "rgba(0, 214, 143, 0.2)"
                : "rgba(255, 92, 124, 0.2)",
            background:
              summary.netBalance > 0
                ? "rgba(0, 214, 143, 0.05)"
                : "rgba(255, 92, 124, 0.05)",
            textAlign: "center",
            padding: "var(--space-lg)",
          }}
        >
          <p style={{ fontSize: "var(--font-size-lg)", fontWeight: 600 }}>
            {summary.netBalance > 0 ? (
              <span className="text-positive">
                {friend?.name} owes you ₹{summary.netBalance.toLocaleString()}
              </span>
            ) : (
              <span className="text-negative">
                You owe {friend?.name} ₹{Math.abs(summary.netBalance).toLocaleString()}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Transaction History */}
      <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, marginBottom: "var(--space-md)" }}>
        Transaction History
      </h2>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <div className="icon">💸</div>
          <h3>No transactions yet</h3>
          <p>Start by adding your first transaction</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <HiOutlinePlus /> Add Transaction
          </button>
        </div>
      ) : (
        <div className="timeline">
          {transactions.map((t, index) => (
            <div
              key={t._id}
              className={`timeline-item ${t.type} animate-in`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="t-type" style={{ color: t.type === "given" ? "var(--color-negative)" : "var(--color-positive)" }}>
                {t.type === "given" ? "💸 You gave" : "💰 You received"}
              </div>
              <div className="t-header">
                <div className="t-amount" style={{ color: t.type === "given" ? "var(--color-negative)" : "var(--color-positive)" }}>
                  {t.type === "given" ? "-" : "+"}₹{t.amount.toLocaleString()}
                </div>
                <div className="flex-gap">
                  {!t.settled && (
                    <span className="badge badge-warning" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <HiOutlineClock size={12} /> {getDaysAgo(t.date)}
                    </span>
                  )}
                  {t.settled && <span className="badge badge-positive">✓ Settled</span>}
                </div>
              </div>
              <div className="t-date">{formatDate(t.date)}</div>
              {t.note && <div className="t-note" style={{ marginTop: "4px" }}>📝 {t.note}</div>}

              <div className="flex-gap" style={{ marginTop: "var(--space-sm)" }}>
                <button
                  className={`btn btn-sm ${t.settled ? "btn-secondary" : "btn-primary"}`}
                  onClick={() => handleSettle(t._id)}
                  style={{ fontSize: "11px" }}
                >
                  {t.settled ? "Mark Unsettled" : "Mark Settled"}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(t._id)}
                  style={{ fontSize: "11px" }}
                >
                  <HiOutlineTrash size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Transaction</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <HiOutlineX size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTransaction}>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  autoFocus
                  id="transaction-amount"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Type</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-sm)" }}>
                  <button
                    type="button"
                    className={`btn ${type === "given" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setType("given")}
                    id="type-given"
                  >
                    💸 I Gave Money
                  </button>
                  <button
                    type="button"
                    className={`btn ${type === "received" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setType("received")}
                    id="type-received"
                  >
                    💰 I Received
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  id="transaction-date"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Note (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Lunch at cafe, Movie tickets..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  id="transaction-note"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full mt-md"
                disabled={adding}
                id="submit-transaction"
              >
                {adding ? "Adding..." : "Add Transaction"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
