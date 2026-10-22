
import React, { useState } from "react";
import "./FriendSearch.css";

const initialFriends = [
  { id: 1, name: "John Doe", username: "@johndoe" },
  { id: 2, name: "Jane Smith", username: "@janesmith" },
  { id: 3, name: "Alex Johnson", username: "@alexj" },
  { id: 4, name: "Emily Davis", username: "@emilyd" },
  { id: 5, name: "Michael Brown", username: "@mikebrown" },
];

export default function FriendSearch() {
  const [search, setSearch] = useState("");
  const [addedFriends, setAddedFriends] = useState([]);

  const filteredFriends = initialFriends.filter((friend) =>
    `${friend.name} ${friend.username}`
      .toLowerCase()
      .includes(search.toLowerCase().trim())
  );

  const handleAddFriend = (id) => {
    setAddedFriends((prev) =>
      prev.includes(id) ? prev : [...prev, id]
    );
  };

  return (
    <div className="friend-page">
      <div className="friend-card">
        <h2>Find Friends</h2>
        <p className="friend-subtitle">
          Search for people and connect with them.
        </p>

        <div className="friend-search">
          <span className="search-icon" aria-hidden="true">
            &#128269;
          </span>
          <input
            type="text"
            placeholder="Search by name or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search friends"
          />
          {search && (
            <button
              className="clear-search"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>

        <div className="friend-list">
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => {
              const isAdded = addedFriends.includes(friend.id);

              return (
                <div className="friend-item" key={friend.id}>
                  <div className="friend-avatar">
                    {friend.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="friend-info">
                    <h3>{friend.name}</h3>
                    <p>{friend.username}</p>
                  </div>

                  <button
                    className={`add-friend-btn ${
                      isAdded ? "added" : ""
                    }`}
                    onClick={() => handleAddFriend(friend.id)}
                    disabled={isAdded}
                  >
                    {isAdded ? "✓ Added" : "+ Add"}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="no-friends">
              <p>No friends found.</p>
              <span>Try searching with another name.</span>
            </div>
          )}
        </div>

        <div className="friend-footer">
          {addedFriends.length} friend
          {addedFriends.length !== 1 ? "s" : ""} added
        </div>
      </div>
    </div>
  );
}
