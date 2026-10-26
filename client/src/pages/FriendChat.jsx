
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import "./FriendChat.css";

const API = {
    friends: "/api/friends",
    expenses: (friendId) => `/api/friends/${friendId}/expenses`,
    createExpense: (friendId) => `/api/friends/${friendId}/expenses`,
    requestSettlement: (friendId, expenseId) =>
        `/api/friends/${friendId}/expenses/${expenseId}/settlement-requests`,
    settleExpense: (friendId, expenseId) =>
        `/api/friends/${friendId}/expenses/${expenseId}/settlements`,
    acceptSettlementRequest: (requestId) =>
        `/api/friends/settlement-requests/${requestId}/accept`,
};

const money = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

const initials = (name = "") =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

const getErrorMessage = (error) =>
    error instanceof Error ? error.message : "Something went wrong.";

async function apiRequest(authenticatedFetch, path, options = {}) {
    const token = localStorage.getItem("token");

    const response = await authenticatedFetch(path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const details = Array.isArray(data.details)
            ? data.details.map(({ field, message }) => `${field}: ${message}`).join(" ")
            : "";
        throw new Error(
            [data.message || data.error || `Request failed (${response.status})`, details]
                .filter(Boolean)
                .join(" ")
        );
    }

    return data;
}

function normalizeFriend(friend) {
    const status = friend.status ?? "";
    const amount = Number(friend.amount ?? friend.balance ?? 0);

    return {
        ...friend,
        id: String(friend.friend_id ?? friend.id ?? friend.user_id),
        name: friend.friend_name ?? friend.name ?? friend.username ?? "Friend",
        username: friend.username ?? friend.user_name ?? "",
        initials: friend.initials || initials(friend.friend_name ?? friend.name ?? friend.username),
        amount: status === "You owe" ? -amount : amount,
        lastMessage: friend.lastMessage ?? friend.last_message ?? status ?? "Open conversation",
    };
}

function normalizeExpense(expense, friendId) {
    const createdByFriend = String(expense.paid_by ?? expense.paidBy) === String(friendId);
    const splits = Array.isArray(expense.splits) ? expense.splits : [];
    const friendSplit = splits.find((split) => String(split.user_id) === String(friendId));
    const currentUserSplit = splits.find((split) => String(split.user_id) !== String(friendId));
    const share = createdByFriend ? currentUserSplit : friendSplit;
    const settlements = Array.isArray(expense.settlements) ? expense.settlements : [];
    const isOwedByFriend = createdByFriend
        ? (settlement) => String(settlement.paid_by) !== String(friendId)
        : (settlement) => String(settlement.paid_by) === String(friendId);
    const acceptedAmount = settlements
        .filter((settlement) => settlement.status === "accepted" && isOwedByFriend(settlement))
        .reduce((total, settlement) => total + Number(settlement.amount || 0), 0);
    const requestedAmount = settlements
        .filter((settlement) => settlement.status === "requested" && isOwedByFriend(settlement))
        .reduce((total, settlement) => total + Number(settlement.amount || 0), 0);
    const incomingSettlementRequest = !createdByFriend
        ? settlements.find((settlement) =>
            settlement.status === "requested" &&
            String(settlement.paid_by) === String(friendId)
        )
        : null;
    const myShare = Number(share?.amount ?? 0);

    return {
        ...expense,
        id: String(expense.id ?? expense.expense_id),
        title: expense.description ?? expense.title ?? "Expense",
        amount: Number(expense.amount ?? expense.total_amount ?? 0),
        myShare,
        paidBy: createdByFriend ? "friend" : "me",
        createdAt: expense.created_at ?? expense.createdAt,
        acceptedAmount,
        requestedAmount,
        incomingSettlementRequest,
        actionAmount: Math.max(0, myShare - acceptedAmount - requestedAmount),
        isSettled: acceptedAmount >= myShare,
        settlementRequested: requestedAmount > 0,
    };
}

export default function FriendChat() {
    const navigate = useNavigate();
    const { username: selectedUsername } = useParams();
    const { authenticatedFetch } = useAuth();
    const [friends, setFriends] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loadingFriends, setLoadingFriends] = useState(true);
    const [friendsError, setFriendsError] = useState("");
    const [loadingChat, setLoadingChat] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [friendSearch, setFriendSearch] = useState("");
    const [mobileChatOpen, setMobileChatOpen] = useState(false);
    const [composerOpen, setComposerOpen] = useState(false);
    const [settleTarget, setSettleTarget] = useState(null);
    const chatRequestId = useRef(0);

    const selectedFriend = useMemo(
        () => friends.find(
            (friend) => friend.username.toLowerCase() === (selectedUsername ?? "").toLowerCase()
        ),
        [friends, selectedUsername]
    );

    const loadFriends = useCallback(async () => {
        setLoadingFriends(true);
        try {
            const data = await apiRequest(authenticatedFetch, API.friends);
            const result = data.friends ?? data;
            if (!Array.isArray(result)) {
                throw new Error("The friends response was not a list.");
            }
            setFriends(result.map(normalizeFriend));
            setFriendsError("");
        } catch (err) {
            const message = getErrorMessage(err);
            setFriendsError(message);
            setError(message);
        } finally {
            setLoadingFriends(false);
        }
    }, [authenticatedFetch]);

    const loadChat = useCallback(async (friendId) => {
        const requestId = ++chatRequestId.current;
        if (!friendId) {
            setExpenses([]);
            setLoadingChat(false);
            return;
        }

        setLoadingChat(true);
        setExpenses([]);
        setError("");

        try {
            const data = await apiRequest(
                authenticatedFetch,
                API.expenses(friendId)
            );
            const result = data.expenses ?? data;
            if (!Array.isArray(result)) {
                throw new Error("The expenses response was not a list.");
            }
            if (requestId === chatRequestId.current) {
                setExpenses(result.map((expense) => normalizeExpense(expense, friendId)));
            }
        } catch (err) {
            if (requestId === chatRequestId.current) {
                setError(getErrorMessage(err));
            }
        } finally {
            if (requestId === chatRequestId.current) {
                setLoadingChat(false);
            }
        }
    }, [authenticatedFetch]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadFriends();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadFriends]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadChat(selectedFriend?.id);
            setMobileChatOpen(Boolean(selectedFriend));
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [selectedFriend, loadChat]);

    function selectFriend(friend) {
        setMobileChatOpen(true);
        setComposerOpen(false);
        setSettleTarget(null);
        setError("");
        setNotice("");
        navigate(`/friendchat/${encodeURIComponent(friend.username)}`);
    }

    const balance = useMemo(
        () =>
            expenses.reduce((total, expense) => {
                const outstanding = Math.max(0, expense.myShare - expense.acceptedAmount);
                if (expense.isSettled) return total;
                return total + (expense.paidBy === "me" ? outstanding : -outstanding);
            }, 0),
        [expenses]
    );

    async function createSplit(payload) {
        if (!selectedFriend) return;

        setSubmitting(true);
        setError("");
        setNotice("");

        try {
            await apiRequest(authenticatedFetch, API.createExpense(selectedFriend.id), {
                method: "POST",
                body: JSON.stringify(payload),
            });

            await Promise.all([loadChat(selectedFriend.id), loadFriends()]);
            setComposerOpen(false);
            setNotice("Split created successfully.");
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    }

    async function requestSettlement(expense) {
        setSubmitting(true);
        setError("");
        setNotice("");

        try {
            await apiRequest(authenticatedFetch, API.requestSettlement(selectedFriend.id, expense.id), {
                method: "POST",
                body: JSON.stringify({ amount: expense.actionAmount }),
            });

            await Promise.all([loadChat(selectedFriend.id), loadFriends()]);
            setNotice("Settlement request sent.");
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    }

    async function settleExpense(expense) {
        setSubmitting(true);
        setError("");
        setNotice("");

        try {
            await apiRequest(authenticatedFetch, API.settleExpense(selectedFriend.id, expense.id), {
                method: "POST",
                body: JSON.stringify({ amount: expense.actionAmount }),
            });

            await Promise.all([loadChat(selectedFriend.id), loadFriends()]);
            setSettleTarget(null);
            setNotice("Expense settled successfully.");
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    }

    async function acceptSettlementRequest(expense) {
        if (!expense.incomingSettlementRequest) return;

        setSubmitting(true);
        setError("");
        setNotice("");

        try {
            await apiRequest(
                authenticatedFetch,
                API.acceptSettlementRequest(expense.incomingSettlementRequest.id),
                { method: "POST" }
            );
            await Promise.all([loadChat(selectedFriend.id), loadFriends()]);
            setNotice("Settlement request accepted.");
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="fc-page">
            <section
                className={`fc-shell ${mobileChatOpen ? "fc-chat-active" : ""}`}
            >
                <aside className="fc-sidebar">
                    <div className="fc-side-header">
                        <div>
                            <div className="fc-brand">
                                <img src="/favicon.svg" alt="" width="40" height="40" />
                                <span>Split<span>Ease</span></span>
                            </div>
                            <p className="fc-muted">Your people, your splits.</p>
                        </div>
                    </div>

                    <div className="fc-search">
                        <span>⌕</span>
                        <input
                            placeholder="Search friends..."
                            aria-label="Search friends"
                            onChange={(event) => {
                                setFriendSearch(event.target.value);
                            }}
                        />
                    </div>

                    <FriendList
                        friends={friends}
                        selectedId={selectedFriend?.id}
                        loading={loadingFriends}
                        error={friendsError}
                        onSelect={selectFriend}
                        searchTerm={friendSearch}
                    />
                </aside>

                <section className="fc-conversation">
                    {!selectedFriend ? (
                        <div className="fc-empty">
                            <div className="fc-empty-icon">↗</div>
                            <h2>Every split has a story.</h2>
                            <p>Choose a friend to see your shared expenses.</p>
                        </div>
                    ) : (
                        <>
                            <header className="fc-chat-header">
                                <button
                                    className="fc-back"
                                    onClick={() => setMobileChatOpen(false)}
                                    aria-label="Back to friends"
                                >
                                    ←
                                </button>

                                <div className="fc-avatar fc-avatar-large">
                                    {selectedFriend.initials}
                                </div>

                                <div className="fc-person-heading">
                                    <h2>{selectedFriend.name}</h2>
                                    <span>
                                        <span className="fc-status-dot" />
                                        Personal expenses
                                    </span>
                                </div>

                                <div className="fc-header-balance">
                                    <span>Net balance</span>
                                    <strong className={balance > 0 ? "fc-positive" : balance < 0 ? "fc-negative" : ""}>
                                        {balance > 0 ? "+" : balance < 0 ? "−" : ""}
                                        {money(Math.abs(balance))}
                                    </strong>{/* 
                                    <small>
                                        {balance > 0
                                            ? "They owe you"
                                            : balance < 0
                                                ? "You owe them"
                                                : "All square"}
                                    </small> */}
                                </div>
                            </header>

                            <div className="fc-chat-body">
                                <div className="fc-day-divider">
                                    <span>YOUR SHARED EXPENSES</span>
                                </div>

                                {error && (
                                    <div className="fc-alert fc-alert-error" role="alert">
                                        <span>{error}</span>
                                        <button onClick={() => setError("")} aria-label="Dismiss error">×</button>
                                    </div>
                                )}

                                {notice && (
                                    <div className="fc-alert fc-alert-success" role="status">
                                        <span>{notice}</span>
                                        <button onClick={() => setNotice("")} aria-label="Dismiss notice">×</button>
                                    </div>
                                )}

                                {loadingChat ? (
                                    <div className="fc-chat-loading">
                                        <span className="fc-spinner" />
                                        Loading expenses...
                                    </div>
                                ) : expenses.length === 0 ? (
                                    <div className="fc-no-expenses">
                                        <div>₹</div>
                                        <strong>No splits yet</strong>
                                        <p>Start your expense story with {selectedFriend.name.split(" ")[0]}.</p>
                                        <button
                                            className="fc-primary-btn"
                                            onClick={() => setComposerOpen(true)}
                                        >
                                            + Create first split
                                        </button>
                                    </div>
                                ) : (
                                    <div className="fc-expense-list">
                                        {expenses.map((expense) => (
                                            <ExpenseCard
                                                key={expense.id}
                                                expense={expense}
                                                mine={expense.paidBy === "me"}
                                                settled={expense.isSettled}
                                                onRequest={() => requestSettlement(expense)}
                                                onSettle={() => setSettleTarget(expense)}
                                                onAcceptRequest={() => acceptSettlementRequest(expense)}
                                                busy={submitting}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <footer className="fc-chat-footer">
                                <button
                                    className="fc-primary-btn fc-new-split-btn"
                                    onClick={() => setComposerOpen(true)}
                                >
                                    <span>＋</span> New split
                                </button>
                            </footer>
                        </>
                    )}
                </section>
            </section>

            {composerOpen && selectedFriend && (
                <SplitComposer
                    friend={selectedFriend}
                    busy={submitting}
                    onClose={() => setComposerOpen(false)}
                    onSubmit={createSplit}
                />
            )}

            {settleTarget && (
                <div
                    className="fc-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setSettleTarget(null);
                    }}
                >
                    <section className="fc-confirm-modal" role="dialog" aria-modal="true">
                        <button
                            className="fc-modal-close"
                            onClick={() => setSettleTarget(null)}
                            aria-label="Close"
                        >
                            ×
                        </button>
                        <div className="fc-modal-icon">✓</div>
                        <h2>Settle this expense?</h2>
                        <p>
                            Confirm that <strong>{settleTarget.title}</strong> has been paid
                            and settled for {money(settleTarget.actionAmount)}.
                        </p>
                        <div className="fc-confirm-amount">{money(settleTarget.actionAmount)}</div>
                        <p className="fc-modal-warning">
                            Only confirm after the payment has actually been made.
                        </p>
                        <div className="fc-modal-actions">
                            <button
                                className="fc-secondary-btn"
                                onClick={() => setSettleTarget(null)}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                className="fc-primary-btn"
                                onClick={() => settleExpense(settleTarget)}
                                disabled={submitting}
                            >
                                {submitting ? "Saving..." : "Confirm settlement"}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
}

function FriendList({ friends, selectedId, loading, error, onSelect, searchTerm }) {

    const filteredFriends = friends.filter((friend) =>
        friend.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fc-friends-list">
            {loading ? (
                <div className="fc-list-message">Loading friends...</div>
            ) : error ? (
                <div className="fc-list-message" role="alert">{error}</div>
            ) : filteredFriends.length === 0 ? (
                <div className="fc-list-message">No friends found.</div>
            ) : (
                filteredFriends.map((friend, index) => (
                    <button
                        className={`fc-friend-row ${String(friend.id) === String(selectedId) ? "fc-friend-selected" : ""
                            }`}
                        key={friend.id}
                        onClick={() => onSelect(friend)}
                    >
                        <div className={`fc-avatar fc-avatar-${index % 5}`}>
                            {friend.initials || initials(friend.name)}
                        </div>
                        <div className="fc-friend-info">
                            <strong>{friend.name}</strong>
                            <span>{friend.lastMessage}</span>
                        </div>
                        <div className="fc-friend-balance">
                            <strong
                                className={
                                    friend.amount > 0
                                        ? "fc-positive"
                                        : friend.amount < 0
                                            ? "fc-negative"
                                            : ""
                                }
                            >
                                {friend.amount > 0 ? "+" : friend.amount < 0 ? "−" : ""}
                                {money(Math.abs(friend.amount))}
                            </strong>
                            <span>
                                {friend.amount > 0
                                    ? "They owe you"
                                    : friend.amount < 0
                                        ? "You owe"
                                        : "Settled"}
                            </span>
                        </div>
                    </button>
                ))
            )}
        </div>
    );
}

function ExpenseCard({ expense, mine, settled, onRequest, onSettle, onAcceptRequest, busy }) {
    const [showDetails, setShowDetails] = useState(false);

    const date = new Date(expense.createdAt);
    const formattedDate = Number.isNaN(date.getTime())
        ? ""
        : date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

    return (
        <article className={`fc-message-row ${mine ? "fc-message-mine" : "fc-message-theirs"}`}>
            <div className={`fc-expense-card ${settled ? "fc-expense-settled" : ""}`}>
                <div className="fc-expense-topline">
                    <span className={`fc-expense-icon ${mine ? "fc-icon-green" : "fc-icon-lilac"}`}>
                        ₹
                    </span>
                    <div className="fc-expense-title">
                        <strong>{expense.title}</strong>
                        <span>{mine ? "Created by you" : "Created by your friend"}</span>
                    </div>
                    <span className={`fc-status-pill ${settled ? "fc-pill-settled" : "fc-pill-pending"}`}>
                        {settled
                            ? "Settled"
                            : expense.incomingSettlementRequest
                                ? "Request received"
                                : expense.settlementRequested
                                    ? "Request sent"
                                    : "Pending"}
                    </span>
                </div>

                <div className="fc-expense-amount-row">
                    <span>Total expense</span>
                    <strong>{money(expense.amount)}</strong>
                </div>
                <div className="fc-expense-share-row">
                    <span>{mine ? "Their share" : "Your share"}</span>
                    <strong>{money(expense.myShare)}</strong>
                </div>
                {expense.requestedAmount > 0 && !settled && (
                    <p className="fc-settlement-pending">
                        {expense.incomingSettlementRequest
                            ? "Your friend requested "
                            : "Settlement requested: "}
                        {money(expense.requestedAmount)}
                    </p>
                )}

                <button
                    className="fc-details-toggle"
                    onClick={() => setShowDetails((value) => !value)}
                >
                    {showDetails ? "Hide details" : "View details"} <span>{showDetails ? "⌃" : "⌄"}</span>
                </button>

                {showDetails && (
                    <div className="fc-expense-details">
                        <div><span>Created</span><strong>{formattedDate || "Date unavailable"}</strong></div>
                    </div>
                )}

                {!settled && (
                    <div className="fc-expense-actions">
                        {mine ? (
                            <>
                                {expense.incomingSettlementRequest && (
                                    <button
                                        className="fc-request-btn"
                                        onClick={onAcceptRequest}
                                        disabled={busy}
                                    >
                                        ✓ Accept settlement request
                                    </button>
                                )}
                                {expense.actionAmount > 0 && (
                                    <button
                                        className="fc-settle-btn"
                                        onClick={onSettle}
                                        disabled={busy}
                                    >
                                        ✓ Settle this split
                                    </button>
                                )}
                            </>
                        ) : (
                            <button
                                className="fc-request-btn"
                                onClick={onRequest}
                                disabled={busy || expense.settlementRequested || expense.actionAmount <= 0}
                            >
                                {expense.settlementRequested
                                    ? "Request sent"
                                    : "↗ Request to settle"}
                            </button>
                        )}
                    </div>
                )}

                <div className="fc-expense-timestamp">{formattedDate}</div>
            </div>
        </article>
    );
}

function SplitComposer({ friend, busy, onClose, onSubmit }) {
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [includeMe, setIncludeMe] = useState(true);
    const [mode, setMode] = useState("equal");
    const [myValue, setMyValue] = useState("");

    const total = Number(amount);
    const validTotal = Number.isInteger(total) && total > 0;

    const myShare = useMemo(() => {
        if (!validTotal) return 0;

        if (!includeMe) return 0;
        if (mode === "equal") return total / 2;
        if (mode === "amount") return Number(myValue);
        if (mode === "percentage") return (total * Number(myValue)) / 100;
        return 0;
    }, [total, validTotal, includeMe, mode, myValue]);

    const friendShare = useMemo(() => {
        if (!validTotal) return 0;
        if (!includeMe) return total;
        if (mode === "equal") return Math.floor(total / 2);
        if (mode === "percentage") {
            return Math.round((total * (100 - Number(myValue))) / 100);
        }
        return total - myShare;
    }, [total, validTotal, includeMe, mode, myValue, myShare]);

    const actualMyShare = total - friendShare;
    const customValid =
        !includeMe ||
        mode === "equal" ||
        (mode === "amount" &&
            myValue.trim() !== "" &&
            Number.isFinite(Number(myValue)) &&
            Number.isInteger(Number(myValue)) &&
            Number(myValue) >= 0 &&
            Number(myValue) <= total) ||
        (mode === "percentage" &&
            myValue.trim() !== "" &&
            Number.isFinite(Number(myValue)) &&
            Number(myValue) >= 0 &&
            Number(myValue) <= 100);

    const valid = title.trim() && validTotal && customValid;

    function handleModeChange(nextMode) {
        setMode(nextMode);
        setMyValue("");
    }

    function handleSubmit(event) {
        event.preventDefault();
        if (!valid || busy) return;

        onSubmit({
            description: title.trim(),
            amount: total,
            split: !includeMe
                ? { type: "amount", friendAmount: total }
                : mode === "equal"
                    ? { type: "half" }
                    : mode === "amount"
                        ? { type: "amount", friendAmount: total - Number(myValue) }
                        : { type: "percentage", friendPercentage: 100 - Number(myValue) },
        });
    }

    return (
        <div
            className="fc-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !busy) onClose();
            }}
        >
            <section className="fc-composer" role="dialog" aria-modal="true">
                <header className="fc-composer-header">
                    <div>
                        <span className="fc-eyebrow">SPLITEASE · NEW EXPENSE</span>
                        <h2>Create a split</h2>
                        <p>Adding an expense with {friend.name}</p>
                    </div>
                    <button className="fc-modal-close" onClick={onClose} disabled={busy} aria-label="Close">
                        ×
                    </button>
                </header>

                <form onSubmit={handleSubmit}>
                    <label className="fc-field">
                        <span>What was the expense for?</span>
                        <input
                            autoFocus
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="e.g. Dinner, cab, movie tickets"
                            maxLength={120}
                            required
                        />
                    </label>

                    <label className="fc-field">
                        <span>Total amount (₹)</span>
                        <div className="fc-money-input">
                            <span>₹</span>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={amount}
                                onChange={(event) => setAmount(event.target.value)}
                                placeholder="0"
                                required
                            />
                        </div>
                    </label>

                    <label className="fc-checkbox-row">
                        <input
                            type="checkbox"
                            checked={includeMe}
                            onChange={(event) => {
                                setIncludeMe(event.target.checked);
                                setMyValue("");
                            }}
                        />
                        <span className="fc-custom-checkbox">✓</span>
                        <span>
                            <strong>Split this bill with me too</strong>
                            <small>
                                {includeMe
                                    ? "Both of you will have a share."
                                    : `The whole expense will be assigned to ${friend.name}.`}
                            </small>
                        </span>
                    </label>

                    {includeMe && (
                        <div className="fc-split-settings">
                            <span className="fc-section-label">HOW SHOULD IT BE SPLIT?</span>
                            <div className="fc-mode-tabs">
                                {[
                                    { value: "equal", label: "½ Equal" },
                                    { value: "amount", label: "By amount" },
                                    { value: "percentage", label: "By %" },
                                ].map((option) => (
                                    <button
                                        type="button"
                                        key={option.value}
                                        className={`fc-mode-tab ${mode === option.value ? "fc-mode-active" : ""}`}
                                        onClick={() => handleModeChange(option.value)}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>

                            {mode === "equal" ? (
                                <div className="fc-share-preview">
                                    <div>
                                        <span>You pay</span>
                                        <strong>{money(actualMyShare)}</strong>
                                    </div>
                                    <div>
                                        <span>{friend.name.split(" ")[0]} pays</span>
                                        <strong>{money(friendShare)}</strong>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <label className="fc-field">
                                        <span>{mode === "amount" ? "Your share (₹)" : "Your share (%)"}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max={mode === "amount" ? total || undefined : 100}
                                            step={mode === "amount" ? "1" : "0.01"}
                                            value={myValue}
                                            onChange={(event) => setMyValue(event.target.value)}
                                            placeholder={mode === "amount" ? "Enter your share" : "e.g. 40"}
                                            required
                                        />
                                    </label>
                                    <div className="fc-share-preview">
                                        <div>
                                            <span>You pay</span>
                                            <strong>{money(actualMyShare)}</strong>
                                        </div>
                                        <div>
                                            <span>{friend.name.split(" ")[0]} pays</span>
                                            <strong>{money(friendShare)}</strong>
                                        </div>
                                    </div>
                                    {!customValid && myValue !== "" && (
                                        <p className="fc-field-error">
                                            {mode === "amount"
                                                ? "Your share must be between ₹0 and the total."
                                                : "Enter a percentage from 0 to 100."}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {!includeMe && validTotal && (
                        <div className="fc-friend-only-note">
                            <span>₹</span>
                            <div>
                                <strong>{friend.name} owes {money(total)}</strong>
                                <small>100% of the expense will be assigned to your friend.</small>
                            </div>
                        </div>
                    )}

                    <div className="fc-composer-summary">
                        <span>Total expense</span>
                        <strong>{validTotal ? money(total) : money(0)}</strong>
                    </div>

                    <div className="fc-modal-actions">
                        <button
                            type="button"
                            className="fc-secondary-btn"
                            onClick={onClose}
                            disabled={busy}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="fc-primary-btn"
                            disabled={!valid || busy}
                        >
                            {busy ? "Saving..." : "Create split →"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
