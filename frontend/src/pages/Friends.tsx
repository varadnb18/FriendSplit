import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import { HiOutlinePlus, HiOutlineTrash, HiOutlineX } from "react-icons/hi";

interface FriendData {
  _id: string;
  name: string;
  totalGiven: number;
  totalReceived: number;
  netBalance: number;
}

export default function Friends() {
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [friendName, setFriendName] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await api.get("/friends");
      setFriends(res.data);
    } catch (err) {
      toast.error("Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendName.trim()) {
      toast.error("Please enter a name");
      return;
    }

    setAddingFriend(true);
    try {
      await api.post("/friends", { name: friendName.trim() });
      toast.success(`${friendName} added! 🎉`);
      setFriendName("");
      setShowModal(false);
      fetchFriends();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add friend");
    } finally {
      setAddingFriend(false);
    }
  };

  const handleDeleteFriend = async (e: React.MouseEvent, friendId: string, friendNameStr: string) => {
    e.stopPropagation();
    if (!confirm(`Delete ${friendNameStr} and all their transactions?`)) return;

    try {
      await api.delete(`/friends/${friendId}`);
      toast.success(`${friendNameStr} removed`);
      fetchFriends();
    } catch (err) {
      toast.error("Failed to delete friend");
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="spinner"></div>
      </div>
    );
  }

  // Color palette for avatars
  const avatarColors = [
    "linear-gradient(135deg, #7c5cfc, #c05cfc)",
    "linear-gradient(135deg, #00d68f, #00b8d4)",
    "linear-gradient(135deg, #fc5c8a, #ff8a5c)",
    "linear-gradient(135deg, #5ca8fc, #5cfcb8)",
    "linear-gradient(135deg, #ffb84d, #ff5c7c)",
    "linear-gradient(135deg, #a855f7, #ec4899)",
  ];

  return (
    <div className="main-content">
      <div className="flex-between page-header">
        <div>
          <h1>Friends</h1>
          <p>{friends.length} friend{friends.length !== 1 ? "s" : ""} tracked</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="add-friend-btn">
          <HiOutlinePlus /> Add Friend
        </button>
      </div>

      {friends.length === 0 ? (
        <div className="empty-state">
          <div className="icon">👥</div>
          <h3>No friends yet</h3>
          <p>Add a friend to start tracking who owes what!</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <HiOutlinePlus /> Add Your First Friend
          </button>
        </div>
      ) : (
        <div className="list-grid">
          {friends.map((friend, index) => (
            <div
              key={friend._id}
              className="list-item animate-in"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => navigate(`/friends/${friend._id}`)}
            >
              <div
                className="avatar"
                style={{
                  background: avatarColors[index % avatarColors.length],
                  color: "white",
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
              <button
                className="btn btn-danger btn-sm"
                onClick={(e) => handleDeleteFriend(e, friend._id, friend.name)}
                title="Delete friend"
              >
                <HiOutlineTrash />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Friend Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Friend</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <HiOutlineX size={20} />
              </button>
            </div>
            <form onSubmit={handleAddFriend}>
              <div className="form-group">
                <label className="form-label">Friend's Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rahul, Priya..."
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  autoFocus
                  id="friend-name-input"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={addingFriend}
                id="submit-friend"
              >
                {addingFriend ? "Adding..." : "Add Friend"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
