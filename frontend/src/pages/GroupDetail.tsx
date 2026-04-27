import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  HiOutlinePlus,
  HiOutlineArrowLeft,
  HiOutlineX,
  HiOutlineArrowRight,
  HiOutlineLightningBolt,
} from "react-icons/hi";

interface Member {
  _id: string;
  name: string;
  email: string;
}

interface Split {
  userId: Member;
  amount: number;
}

interface Expense {
  _id: string;
  paidBy: Member;
  amount: number;
  description: string;
  splitType: string;
  splits: Split[];
  date: string;
}

interface SimplifiedDebt {
  from: { userId: string; name: string };
  to: { userId: string; name: string };
  amount: number;
}

interface Balance {
  userId: string;
  name: string;
  email: string;
  amount: number;
}

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState<{ _id: string; name: string; members: Member[] } | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [simplifiedDebts, setSimplifiedDebts] = useState<SimplifiedDebt[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);

  // Add expense modal
  const [showModal, setShowModal] = useState(false);
  const [expAmount, setExpAmount] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expSplitType, setExpSplitType] = useState<"equal" | "custom">("equal");
  const [adding, setAdding] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<"expenses" | "debts">("expenses");

  useEffect(() => {
    fetchGroupDetail();
    fetchSimplifiedDebts();
  }, [id]);

  const fetchGroupDetail = async () => {
    try {
      const res = await api.get(`/groups/${id}`);
      setGroup(res.data.group);
      setExpenses(res.data.expenses);
    } catch (err) {
      toast.error("Failed to load group");
      navigate("/groups");
    } finally {
      setLoading(false);
    }
  };

  const fetchSimplifiedDebts = async () => {
    try {
      const res = await api.get(`/expenses/simplified/${id}`);
      setSimplifiedDebts(res.data.simplifiedDebts);
      setBalances(res.data.balances);
    } catch (err) {
      console.error("Failed to load simplified debts");
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(expAmount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!expDesc.trim()) {
      toast.error("Enter a description");
      return;
    }

    setAdding(true);
    try {
      await api.post("/expenses", {
        groupId: id,
        amount: numAmount,
        description: expDesc.trim(),
        splitType: expSplitType,
      });
      toast.success("Expense added! ✅");
      setExpAmount("");
      setExpDesc("");
      setShowModal(false);
      fetchGroupDetail();
      fetchSimplifiedDebts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add expense");
    } finally {
      setAdding(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="spinner"></div>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="main-content">
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: "var(--space-xl)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate("/groups")}>
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
              {group?.name}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-sm)" }}>
              {group?.members.length} members • ₹{totalExpenses.toLocaleString()} total
            </p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="add-expense-btn">
          <HiOutlinePlus /> Add Expense
        </button>
      </div>

      {/* Members Avatars */}
      <div className="card" style={{ marginBottom: "var(--space-xl)" }}>
        <h3 style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: "var(--space-md)", color: "var(--text-secondary)" }}>
          Members
        </h3>
        <div style={{ display: "flex", gap: "var(--space-md)", flexWrap: "wrap" }}>
          {group?.members.map((member) => (
            <div
              key={member._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                padding: "6px 12px",
                background: "var(--bg-input)",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--font-size-sm)",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--accent-gradient)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "white",
                }}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
              <span>{member.name}</span>
              {member._id === user?.id && (
                <span className="badge badge-info" style={{ fontSize: "10px" }}>You</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: "var(--space-xs)",
        marginBottom: "var(--space-lg)",
        background: "var(--bg-input)",
        borderRadius: "var(--radius-md)",
        padding: "4px",
      }}>
        <button
          className={`btn btn-sm ${activeTab === "expenses" ? "btn-primary" : ""}`}
          onClick={() => setActiveTab("expenses")}
          style={{ flex: 1 }}
        >
          Expenses ({expenses.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === "debts" ? "btn-primary" : ""}`}
          onClick={() => setActiveTab("debts")}
          style={{ flex: 1 }}
        >
          <HiOutlineLightningBolt /> Simplified Debts
        </button>
      </div>

      {/* Expenses Tab */}
      {activeTab === "expenses" && (
        <>
          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🧾</div>
              <h3>No expenses yet</h3>
              <p>Add the first expense for this group</p>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <HiOutlinePlus /> Add Expense
              </button>
            </div>
          ) : (
            <div className="list-grid">
              {expenses.map((expense, index) => (
                <div
                  key={expense._id}
                  className="card animate-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex-between" style={{ marginBottom: "var(--space-sm)" }}>
                    <h3 style={{ fontWeight: 600 }}>{expense.description}</h3>
                    <span style={{ fontWeight: 700, fontSize: "var(--font-size-lg)", color: "var(--accent-primary)" }}>
                      ₹{expense.amount.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: "var(--space-sm)" }}>
                    <span className="badge badge-info">
                      Paid by {expense.paidBy._id === user?.id ? "You" : expense.paidBy.name}
                    </span>
                    <span className="badge badge-neutral">{expense.splitType} split</span>
                    <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", marginLeft: "auto" }}>
                      {formatDate(expense.date)}
                    </span>
                  </div>
                  <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>
                    Split: {expense.splits.map((s) => (
                      <span key={s.userId._id} style={{ marginRight: "var(--space-sm)" }}>
                        {s.userId._id === user?.id ? "You" : s.userId.name}: ₹{s.amount.toLocaleString()}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Simplified Debts Tab */}
      {activeTab === "debts" && (
        <>
          {/* Individual Balances */}
          <div style={{ marginBottom: "var(--space-lg)" }}>
            <h3 style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: "var(--space-md)", color: "var(--text-secondary)" }}>
              Individual Balances
            </h3>
            <div className="list-grid">
              {balances.map((b) => (
                <div
                  key={b.userId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-md)",
                    background: "var(--bg-card)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>
                    {b.userId === user?.id ? "You" : b.name}
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      color:
                        b.amount > 0
                          ? "var(--color-positive)"
                          : b.amount < 0
                          ? "var(--color-negative)"
                          : "var(--text-secondary)",
                    }}
                  >
                    {b.amount > 0
                      ? `gets back ₹${b.amount.toLocaleString()}`
                      : b.amount < 0
                      ? `owes ₹${Math.abs(b.amount).toLocaleString()}`
                      : "settled ✓"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Simplified Flows */}
          <h3 style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: "var(--space-md)", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            <HiOutlineLightningBolt style={{ color: "var(--color-warning)" }} />
            Minimum Transactions to Settle
          </h3>

          {simplifiedDebts.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "var(--space-xl)", color: "var(--color-positive)" }}>
              ✅ All debts are settled!
            </div>
          ) : (
            simplifiedDebts.map((debt, i) => (
              <div className="debt-flow animate-in" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="person" style={{ color: "var(--color-negative)" }}>
                  {debt.from.userId === user?.id ? "You" : debt.from.name}
                </span>
                <HiOutlineArrowRight className="arrow" />
                <span className="person" style={{ color: "var(--color-positive)" }}>
                  {debt.to.userId === user?.id ? "You" : debt.to.name}
                </span>
                <span className="debt-amount">₹{debt.amount.toLocaleString()}</span>
              </div>
            ))
          )}
        </>
      )}

      {/* Add Expense Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Expense</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <HiOutlineX size={20} />
              </button>
            </div>
            <form onSubmit={handleAddExpense}>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dinner, Cab fare..."
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  autoFocus
                  id="expense-desc"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Enter total amount"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  id="expense-amount"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Split Type</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-sm)" }}>
                  <button
                    type="button"
                    className={`btn ${expSplitType === "equal" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setExpSplitType("equal")}
                    id="split-equal"
                  >
                    ⚖️ Equal Split
                  </button>
                  <button
                    type="button"
                    className={`btn ${expSplitType === "custom" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setExpSplitType("custom")}
                    id="split-custom"
                  >
                    ✏️ Custom Split
                  </button>
                </div>
              </div>

              <p style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", marginBottom: "var(--space-md)" }}>
                💡 You are recorded as the person who paid. Equal split divides among all {group?.members.length} members.
              </p>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={adding}
                id="submit-expense"
              >
                {adding ? "Adding..." : "Add Expense"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
