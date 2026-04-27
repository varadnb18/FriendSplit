import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import { HiOutlinePlus, HiOutlineX, HiOutlineUserGroup } from "react-icons/hi";

interface GroupData {
  _id: string;
  name: string;
  members: { _id: string; name: string; email: string }[];
  createdBy: { _id: string; name: string };
  totalExpenses: number;
  expenseCount: number;
  createdAt: string;
}

export default function Groups() {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [memberEmails, setMemberEmails] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await api.get("/groups");
      setGroups(res.data);
    } catch (err) {
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("Enter a group name");
      return;
    }

    setCreating(true);
    try {
      const emails = memberEmails
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      await api.post("/groups", {
        name: groupName.trim(),
        memberEmails: emails,
      });

      toast.success("Group created! 🎉");
      setGroupName("");
      setMemberEmails("");
      setShowModal(false);
      fetchGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  const groupColors = [
    "linear-gradient(135deg, #7c5cfc, #c05cfc)",
    "linear-gradient(135deg, #00d68f, #00b8d4)",
    "linear-gradient(135deg, #fc5c8a, #ff8a5c)",
    "linear-gradient(135deg, #5ca8fc, #5cfcb8)",
    "linear-gradient(135deg, #ffb84d, #ff5c7c)",
  ];

  if (loading) {
    return (
      <div className="main-content">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="flex-between page-header">
        <div>
          <h1>Groups</h1>
          <p>{groups.length} group{groups.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="create-group-btn">
          <HiOutlinePlus /> Create Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="empty-state">
          <div className="icon">👨‍👩‍👧‍👦</div>
          <h3>No groups yet</h3>
          <p>Create a group to split expenses with friends</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <HiOutlinePlus /> Create Your First Group
          </button>
        </div>
      ) : (
        <div className="list-grid">
          {groups.map((group, index) => (
            <div
              key={group._id}
              className="list-item animate-in"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => navigate(`/groups/${group._id}`)}
            >
              <div
                className="avatar"
                style={{
                  background: groupColors[index % groupColors.length],
                  color: "white",
                }}
              >
                <HiOutlineUserGroup size={22} />
              </div>
              <div className="info">
                <h3>{group.name}</h3>
                <p>
                  {group.members.length} member{group.members.length !== 1 ? "s" : ""} •{" "}
                  {group.expenseCount} expense{group.expenseCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="balance">
                <div className="amount" style={{ color: "var(--accent-primary)" }}>
                  ₹{group.totalExpenses.toLocaleString()}
                </div>
                <div className="label">total</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Group</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <HiOutlineX size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label className="form-label">Group Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Weekend Trip, Office Lunch..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  autoFocus
                  id="group-name-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Member Emails (comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="friend1@email.com, friend2@email.com"
                  value={memberEmails}
                  onChange={(e) => setMemberEmails(e.target.value)}
                  id="member-emails-input"
                />
                <p style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", marginTop: "var(--space-xs)" }}>
                  Members must have a FriendSplit account. You're automatically added.
                </p>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full mt-md"
                disabled={creating}
                id="submit-group"
              >
                {creating ? "Creating..." : "Create Group"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
