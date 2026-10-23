
import React, { useCallback, useEffect, useState } from "react";
import "./Notifications.css";

const CATEGORIES = [
  { id: "friend_requests", label: "Friend Requests", icon: "👤" },
  { id: "group_add_requests", label: "Group Add Requests", icon: "👥" },
  { id: "splits_requests", label: "Splits Requests", icon: "💸" },
  { id: "other", label: "Other", icon: "🔔" },
];

const API_URL = "/api/notifications";

export default function Notifications() {
  const [activeCategory, setActiveCategory] = useState("friend_requests");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load notifications.");
      }

      const data = await response.json();

      // Expected response: { notifications: [...] }
      setNotifications(data.notifications ?? []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = notifications.filter(
    (notification) => notification.type === activeCategory
  );

  const getCount = (categoryId) =>
    notifications.filter(
      (notification) =>
        notification.type === categoryId && !notification.read
    ).length;

  const formatDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "";

    return parsedDate.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>Stay updated on your requests and activity.</p>
        </div>

        <button
          className="refresh-button"
          onClick={fetchNotifications}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      <div className="notifications-layout">
        {/* Category sidebar */}
        <aside className="notifications-sidebar">
          {CATEGORIES.map((category) => {
            const count = getCount(category.id);
            const isActive = activeCategory === category.id;

            return (
              <button
                key={category.id}
                type="button"
                className={`notification-category ${
                  isActive ? "active" : ""
                }`}
                onClick={() => setActiveCategory(category.id)}
                aria-pressed={isActive}
              >
                <span className="category-icon">{category.icon}</span>

                <span className="category-label">
                  {category.label}
                </span>

                {count > 0 && (
                  <span className="notification-badge">{count}</span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Selected category content */}
        <main className="notifications-content">
          <div className="content-header">
            <h2>
              {CATEGORIES.find((c) => c.id === activeCategory)?.label}
            </h2>

            <span className="total-count">
              {filteredNotifications.length} notifications
            </span>
          </div>

          {loading ? (
            <div className="notification-state">
              <div className="loading-spinner" />
              <p>Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="notification-state error-state">
              <p>{error}</p>
              <button onClick={fetchNotifications}>Try again</button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="notification-state">
              <span className="empty-icon">🔔</span>
              <h3>You're all caught up!</h3>
              <p>No notifications in this category.</p>
            </div>
          ) : (
            <div className="notification-list">
              {filteredNotifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`notification-card ${
                    !notification.read ? "unread" : ""
                  }`}
                >
                  <div className="notification-avatar">
                    {notification.sender?.name
                      ?.charAt(0)
                      ?.toUpperCase() || "N"}
                  </div>

                  <div className="notification-details">
                    <div className="notification-title-row">
                      <h3>{notification.title}</h3>

                      {!notification.read && (
                        <span
                          className="unread-dot"
                          title="Unread"
                        />
                      )}
                    </div>

                    <p>{notification.message}</p>

                    <span className="notification-date">
                      {formatDate(notification.createdAt)}
                    </span>

                    {notification.actionUrl && (
                      <a
                        className="notification-action"
                        href={notification.actionUrl}
                      >
                        View request →
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
