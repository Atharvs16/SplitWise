import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import "./FriendChat.css";
import "./GroupChat.css";

const API = {
    groups: "/api/groups",
    group: (groupId) => `/api/groups/${encodeURIComponent(groupId)}`,
    expenses: (groupId) => `/api/groups/${encodeURIComponent(groupId)}/expenses`,
    createExpense: (groupId) => `/api/groups/${encodeURIComponent(groupId)}/expenses`,
    requestSettlement: (groupId, expenseId) =>
        `/api/groups/${encodeURIComponent(groupId)}/expenses/${encodeURIComponent(expenseId)}/settlement-requests`,
    settleExpense: (groupId, expenseId) =>
        `/api/groups/${encodeURIComponent(groupId)}/expenses/${encodeURIComponent(expenseId)}/settlements`,
    acceptSettlementRequest: (requestId) =>
        `/api/groups/settlement-requests/${encodeURIComponent(requestId)}/accept`,
    addMember: (groupId, memberId) =>
        `/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}`,
    removeMember: (groupId, memberId) =>
        `/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}`,
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
    const response = await authenticatedFetch(path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
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

function getSplitSummary(expense, currentUserId) {
    const payerId = String(expense.paid_by);
    const settlements = Array.isArray(expense.settlements) ? expense.settlements : [];
    const splits = (Array.isArray(expense.splits) ? expense.splits : []).map((split) => {
        const userId = String(split.user_id);
        const memberSettlements = settlements.filter(
            (settlement) =>
                String(settlement.paid_by) === userId &&
                String(settlement.paid_to) === payerId
        );
        const settledAmount = memberSettlements
            .filter((settlement) => settlement.status === "accepted")
            .reduce((sum, settlement) => sum + Number(settlement.amount || 0), 0);
        const requestedAmount = memberSettlements
            .filter((settlement) => settlement.status === "requested")
            .reduce((sum, settlement) => sum + Number(settlement.amount || 0), 0);

        return {
            ...split,
            userId,
            share: Number(split.amount) || 0,
            settledAmount,
            requestedAmount,
            remainingAmount: Math.max(0, Number(split.amount) - settledAmount - requestedAmount),
        };
    });
    const debtors = splits.filter((split) => split.userId !== payerId);
    const pendingRequests = settlements.filter(
        (settlement) => settlement.status === "requested"
    );
    const isPayer = payerId === String(currentUserId);

    return {
        payerId,
        isPayer,
        isIncluded: splits.some((split) => split.userId === String(currentUserId)),
        splits,
        debtors,
        pendingRequests,
        isSettled: debtors.every((split) => split.settledAmount >= split.share),
    };
}

export default function GroupChat() {
    const navigate = useNavigate();
    const { groupId } = useParams();
    const { authenticatedFetch } = useAuth();
    const [groups, setGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [groupsError, setGroupsError] = useState("");
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [currentUserId, setCurrentUserId] = useState("");
    const [loadingChat, setLoadingChat] = useState(false);
    const [chatError, setChatError] = useState("");
    const [notice, setNotice] = useState("");
    const [groupSearch, setGroupSearch] = useState("");
    const [mobileChatOpen, setMobileChatOpen] = useState(Boolean(groupId));
    const [composerOpen, setComposerOpen] = useState(false);
    const [settleTarget, setSettleTarget] = useState(null);
    const [groupInfoOpen, setGroupInfoOpen] = useState(false);
    const [addFriendsOpen, setAddFriendsOpen] = useState(false);
    const [friends, setFriends] = useState([]);
    const [loadingFriends, setLoadingFriends] = useState(false);
    const [friendsError, setFriendsError] = useState("");
    const [friendsNotice, setFriendsNotice] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const chatRequestId = useRef(0);

    const loadGroups = useCallback(async () => {
        setLoadingGroups(true);
        try {
            const data = await apiRequest(authenticatedFetch, API.groups);
            if (!Array.isArray(data.groups)) {
                throw new Error("The groups response was not a list.");
            }
            setGroups(data.groups);
            setGroupsError("");
        } catch (error) {
            const message = getErrorMessage(error);
            setGroupsError(message);
            setChatError(message);
        } finally {
            setLoadingGroups(false);
        }
    }, [authenticatedFetch]);

    const loadGroup = useCallback(async (id) => {
        const requestId = ++chatRequestId.current;
        if (!id) {
            setSelectedGroup(null);
            setLoadingChat(false);
            return;
        }

        setLoadingChat(true);
        setSelectedGroup(null);
        setChatError("");
        try {
            const data = await apiRequest(authenticatedFetch, API.group(id));
            if (!data.group || !Array.isArray(data.group.members) || !Array.isArray(data.group.expenses)) {
                throw new Error("The group response was incomplete.");
            }
            if (requestId === chatRequestId.current) {
                setSelectedGroup(data.group);
            }
        } catch (error) {
            if (requestId === chatRequestId.current) {
                setChatError(getErrorMessage(error));
            }
        } finally {
            if (requestId === chatRequestId.current) {
                setLoadingChat(false);
            }
        }
    }, [authenticatedFetch]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadGroups();
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [loadGroups]);

    useEffect(() => {
        let cancelled = false;
        const timeoutId = window.setTimeout(async () => {
            try {
                const data = await apiRequest(authenticatedFetch, "/api/auth/getme");
                if (!data.user?.id) {
                    throw new Error("Unable to identify your account.");
                }
                if (!cancelled) setCurrentUserId(String(data.user.id));
            } catch (error) {
                if (!cancelled) setChatError(getErrorMessage(error));
            }
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [authenticatedFetch]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadGroup(groupId);
            setMobileChatOpen(Boolean(groupId));
        }, 0);
        return () => {
            window.clearTimeout(timeoutId);
            chatRequestId.current += 1;
        };
    }, [groupId, loadGroup]);

    const selectedGroupSummary = useMemo(
        () => groups.find((group) => String(group.id) === String(groupId)),
        [groups, groupId]
    );
    const filteredGroups = useMemo(() => {
        const searchTerm = groupSearch.trim().toLowerCase();
        if (!searchTerm) return groups;
        return groups.filter((group) =>
            `${group.name} ${group.description || ""}`.toLowerCase().includes(searchTerm)
        );
    }, [groups, groupSearch]);

    function selectGroup(group) {
        setMobileChatOpen(true);
        setComposerOpen(false);
        setSettleTarget(null);
        setChatError("");
        setNotice("");
        navigate(`/groupchat/${encodeURIComponent(group.id)}`);
    }

    async function refreshGroupData() {
        await Promise.all([loadGroup(groupId), loadGroups()]);
    }

    function openGroupInfo() {
        setGroupInfoOpen(true);
        setAddFriendsOpen(false);
        setFriendsError("");
        setFriendsNotice("");
    }

    async function loadFriends() {
        setAddFriendsOpen(true);
        setLoadingFriends(true);
        setFriendsError("");
        setFriendsNotice("");
        try {
            const data = await apiRequest(authenticatedFetch, "/api/friends");
            if (!Array.isArray(data)) {
                throw new Error("The friends response was not a list.");
            }
            setFriends(data);
        } catch (error) {
            setFriendsError(getErrorMessage(error));
        } finally {
            setLoadingFriends(false);
        }
    }

    async function addFriendToGroup(friend) {
        setSubmitting(true);
        setFriendsError("");
        setFriendsNotice("");
        try {
            await apiRequest(authenticatedFetch, API.addMember(groupId, friend.friend_id), {
                method: "POST",
            });
            await refreshGroupData();
            setFriends((current) =>
                current.filter((entry) => String(entry.friend_id) !== String(friend.friend_id))
            );
            setFriendsNotice(`${friend.friend_name} was added to the group.`);
        } catch (error) {
            setFriendsError(getErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    }

    async function removeGroupMember(member) {
        if (!window.confirm(`Remove ${member.name} from ${selectedGroup.name}?`)) return;
        setSubmitting(true);
        setChatError("");
        setNotice("");
        try {
            await apiRequest(authenticatedFetch, API.removeMember(groupId, member.id), {
                method: "DELETE",
            });
            await refreshGroupData();
            setNotice(`${member.name} was removed from the group.`);
        } catch (error) {
            setChatError(getErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    }

    async function createExpense(payload) {
        if (!groupId) return;
        setSubmitting(true);
        setChatError("");
        setNotice("");
        try {
            await apiRequest(authenticatedFetch, API.createExpense(groupId), {
                method: "POST",
                body: JSON.stringify(payload),
            });
            await refreshGroupData();
            setComposerOpen(false);
            setNotice("Group expense created successfully.");
        } catch (error) {
            setChatError(getErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    }

    async function requestSettlement(expense, amount) {
        setSubmitting(true);
        setChatError("");
        setNotice("");
        try {
            await apiRequest(
                authenticatedFetch,
                API.requestSettlement(groupId, expense.id),
                {
                    method: "POST",
                    body: JSON.stringify({ paidTo: expense.paid_by, amount }),
                }
            );
            await refreshGroupData();
            setNotice("Settlement request sent to the expense creator.");
        } catch (error) {
            setChatError(getErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    }

    async function settleMemberShares(expense, settlementsToRecord) {
        setSubmitting(true);
        setChatError("");
        setNotice("");
        try {
            const results = await Promise.allSettled(
                settlementsToRecord.map(({ userId, amount }) =>
                    apiRequest(
                        authenticatedFetch,
                        API.settleExpense(groupId, expense.id),
                        {
                            method: "POST",
                            body: JSON.stringify({ paidBy: userId, amount }),
                        }
                    )
                )
            );
            await refreshGroupData();
            setSettleTarget(null);

            const failed = results.filter((result) => result.status === "rejected");
            if (failed.length > 0) {
                throw new Error(
                    failed.length === results.length
                        ? getErrorMessage(failed[0].reason)
                        : "Some settlements were recorded, but one or more failed. Review the updated expense details."
                );
            }
            setNotice("Selected member settlements recorded.");
        } catch (error) {
            setChatError(getErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    }

    async function acceptSettlementRequest(requestId) {
        setSubmitting(true);
        setChatError("");
        setNotice("");
        try {
            await apiRequest(
                authenticatedFetch,
                API.acceptSettlementRequest(requestId),
                { method: "POST" }
            );
            await refreshGroupData();
            setNotice("Settlement request accepted.");
        } catch (error) {
            setChatError(getErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    }

    const activeGroup = selectedGroup || selectedGroupSummary;
    const groupBalance = Number(selectedGroup?.net_balance ?? selectedGroupSummary?.net_balance ?? 0);

    return (
        <main className="fc-page gc-page">
            <section className={`fc-shell ${mobileChatOpen ? "fc-chat-active" : ""}`}>
                <aside className="fc-sidebar">
                    <div className="fc-side-header">
                        <div>
                            <Link className="fc-brand gc-brand-link" to="/workspace">
                                <img src="/favicon.svg" alt="" width="40" height="40" />
                                <span>Split<span>Ease</span></span>
                            </Link>
                            <p className="fc-muted">Your groups, every split.</p>
                        </div>
                        <Link className="fc-dashboard-link" to="/workspace" aria-label="Back to dashboard">
                            <svg width="14px" height="14px" viewBox="0 0 1024 1024" fill="#6B8173" class="icon" version="1.1" xmlns="http://www.w3.org/2000/svg" stroke="#000000" stroke-width="102.4"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="14.336000000000002"></g><g id="SVGRepo_iconCarrier"><path d="M669.6 849.6c8.8 8 22.4 7.2 30.4-1.6s7.2-22.4-1.6-30.4l-309.6-280c-8-7.2-8-17.6 0-24.8l309.6-270.4c8.8-8 9.6-21.6 2.4-30.4-8-8.8-21.6-9.6-30.4-2.4L360.8 480.8c-27.2 24-28 64-0.8 88.8l309.6 280z" fill=""></path></g></svg>
                        </Link>
                    </div>

                    <label className="fc-search">
                        <span>⌕</span>
                        <input
                            placeholder="Search groups..."
                            aria-label="Search groups"
                            value={groupSearch}
                            onChange={(event) => setGroupSearch(event.target.value)}
                        />
                    </label>

                    <GroupList
                        groups={filteredGroups}
                        selectedId={groupId}
                        loading={loadingGroups}
                        error={groupsError}
                        onSelect={selectGroup}
                    />
                </aside>

                <section className="fc-conversation">
                    {!groupId ? (
                        <div className="fc-empty">
                            <div className="fc-empty-icon">♧</div>
                            <h2>Every group has a story.</h2>
                            <p>Choose a group to see its expenses and member splits.</p>
                        </div>
                    ) : (
                        <>
                            <header className="fc-chat-header">
                                <button
                                    className="fc-back"
                                    onClick={() => setMobileChatOpen(false)}
                                    aria-label="Back to groups"
                                >
                                    ←
                                </button>
                                <div className="fc-avatar fc-avatar-large gc-group-avatar">♧</div>
                                <div className="fc-person-heading">
                                    <h2>
                                        <button
                                            type="button"
                                            className="gc-group-info-trigger"
                                            onClick={openGroupInfo}
                                            aria-label={`View members and info for ${activeGroup?.name || "group"}`}
                                        >
                                            {activeGroup?.name || "Group"}
                                        </button>
                                    </h2>
                                    <span>
                                        <span className="fc-status-dot" />
                                        {selectedGroup?.members?.length ?? activeGroup?.member_count ?? 0} members
                                    </span>
                                </div>
                                <div className="fc-header-balance">
                                    <span>Your group balance</span>
                                    <strong className={groupBalance > 0 ? "fc-positive" : groupBalance < 0 ? "fc-negative" : ""}>
                                        {groupBalance > 0 ? "+" : groupBalance < 0 ? "−" : ""}
                                        {money(Math.abs(groupBalance))}
                                    </strong>
                                </div>
                            </header>

                            <div className="fc-chat-body">
                                <div className="fc-day-divider">
                                    <span>GROUP EXPENSES</span>
                                </div>
                                {chatError && (
                                    <div className="fc-alert fc-alert-error" role="alert">
                                        <span>{chatError}</span>
                                        <button onClick={() => setChatError("")} aria-label="Dismiss error">×</button>
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
                                        Loading group expenses...
                                    </div>
                                ) : !selectedGroup ? (
                                    <div className="fc-empty gc-chat-error">
                                        <div className="fc-empty-icon">!</div>
                                        <h2>Couldn't open this group.</h2>
                                        <p>{chatError || "It may have been removed or you may no longer be a member."}</p>
                                        <button className="fc-secondary-btn" onClick={() => navigate("/groupchat")}>
                                            Back to groups
                                        </button>
                                    </div>
                                ) : selectedGroup.expenses.length === 0 ? (
                                    <div className="fc-no-expenses">
                                        <div>₹</div>
                                        <strong>No group expenses yet</strong>
                                        <p>Create the first expense and choose which members should share it.</p>
                                        <button
                                            className="fc-primary-btn"
                                            onClick={() => setComposerOpen(true)}
                                        >
                                            + Add group expense
                                        </button>
                                    </div>
                                ) : (
                                    <div className="fc-expense-list">
                                        {selectedGroup.expenses.map((expense) => (
                                            <GroupExpenseCard
                                                key={expense.id}
                                                expense={expense}
                                                currentUserId={currentUserId}
                                                onRequest={(amount) => requestSettlement(expense, amount)}
                                                onSettle={() => setSettleTarget(expense)}
                                                onAcceptRequest={acceptSettlementRequest}
                                                busy={submitting}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedGroup && (
                                <footer className="fc-chat-footer">
                                    <div className="fc-footer-copy">
                                        <strong>{selectedGroup.members.length} members</strong>
                                        <span>Expenses are split only among selected members.</span>
                                    </div>
                                    <button
                                        className="fc-primary-btn fc-new-split-btn"
                                        onClick={() => setComposerOpen(true)}
                                        disabled={!currentUserId}
                                    >
                                        <span>＋</span> Add expense
                                    </button>
                                </footer>
                            )}
                        </>
                    )}
                </section>
            </section>

            {composerOpen && selectedGroup && (
                <GroupExpenseComposer
                    members={selectedGroup.members}
                    busy={submitting}
                    onClose={() => setComposerOpen(false)}
                    onSubmit={createExpense}
                />
            )}

            {settleTarget && selectedGroup && currentUserId && (
                <GroupSettlementDialog
                    expense={settleTarget}
                    currentUserId={currentUserId}
                    busy={submitting}
                    onClose={() => setSettleTarget(null)}
                    onSubmit={(settlements) => settleMemberShares(settleTarget, settlements)}
                />
            )}

            {groupInfoOpen && selectedGroup && (
                <GroupInfoDialog
                    group={selectedGroup}
                    currentUserId={currentUserId}
                    friends={friends}
                    addingFriends={addFriendsOpen}
                    loadingFriends={loadingFriends}
                    friendsError={friendsError}
                    notice={friendsNotice}
                    busy={submitting}
                    onClose={() => setGroupInfoOpen(false)}
                    onOpenFriends={() => void loadFriends()}
                    onAddFriend={addFriendToGroup}
                    onRemove={removeGroupMember}
                />
            )}
        </main>
    );
}

function GroupInfoDialog({
    group,
    currentUserId,
    friends,
    addingFriends,
    loadingFriends,
    friendsError,
    notice,
    busy,
    onClose,
    onOpenFriends,
    onAddFriend,
    onRemove,
}) {
    const isAdmin = String(group.created_by) === String(currentUserId);
    const memberIds = new Set(group.members.map((member) => String(member.id)));
    const availableFriends = friends.filter((friend) =>
        !memberIds.has(String(friend.friend_id))
    );

    return (
        <div className="fc-overlay" onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
        }}>
            <section
                className="gc-group-info"
                role="dialog"
                aria-modal="true"
                aria-labelledby="gc-group-info-title"
            >
                <header className="fc-composer-header">
                    <div>
                        <span className="fc-eyebrow">GROUP DETAILS</span>
                        <h2 id="gc-group-info-title">{group.name}</h2>
                        <p>{group.members.length} members</p>
                    </div>
                    <button type="button" className="fc-modal-close" onClick={onClose} aria-label="Close group info">
                        ×
                    </button>
                </header>

                <div className="gc-group-members">
                    {group.members.map((member, index) => {
                        const isGroupAdmin = String(member.id) === String(group.created_by);
                        return (
                            <div className="gc-group-member" key={member.id}>
                                <span className={`fc-avatar fc-avatar-${index % 5} gc-member-avatar`}>
                                    {initials(member.name)}
                                </span>
                                <span className="gc-group-member-copy">
                                    <strong>{member.name}</strong>
                                    <small>@{member.username}</small>
                                </span>
                                {isGroupAdmin ? (
                                    <span className="gc-admin-badge">Admin</span>
                                ) : isAdmin ? (
                                    <button
                                        type="button"
                                        className="gc-remove-member"
                                        disabled={busy}
                                        onClick={() => onRemove(member)}
                                    >
                                        Remove
                                    </button>
                                ) : null}
                            </div>
                        );
                    })}
                </div>

                {addingFriends && (
                    <section className="gc-invite-section">
                        <h3>Add your friends</h3>
                        <p>Choose an accepted friend to add them to the group immediately.</p>
                        {friendsError && <p className="gc-invite-error" role="alert">{friendsError}</p>}
                        {notice && <p className="gc-invite-notice" role="status">{notice}</p>}
                        {loadingFriends ? (
                            <p className="gc-invite-empty">Loading friends...</p>
                        ) : availableFriends.length === 0 ? (
                            <p className="gc-invite-empty">All your friends are already members of this group.</p>
                        ) : (
                            <div className="gc-invite-list">
                                {availableFriends.map((friend, index) => {
                                    return (
                                        <div className="gc-group-member" key={friend.friend_id}>
                                            <span className={`fc-avatar fc-avatar-${index % 5} gc-member-avatar`}>
                                                {initials(friend.friend_name)}
                                            </span>
                                            <span className="gc-group-member-copy">
                                                <strong>{friend.friend_name}</strong>
                                                <small>@{friend.username}</small>
                                            </span>
                                            <button
                                                type="button"
                                                className="gc-remove-member gc-invite-button"
                                                disabled={busy}
                                                onClick={() => onAddFriend(friend)}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {!addingFriends && friendsError && (
                    <p className="gc-invite-error" role="alert">{friendsError}</p>
                )}
                {!addingFriends && notice && (
                    <p className="gc-invite-notice" role="status">{notice}</p>
                )}

                <footer className="gc-group-info-footer">
                    {!addingFriends ? (
                        <button type="button" className="fc-primary-btn" onClick={onOpenFriends}>
                            + Add your friends
                        </button>
                    ) : null}
                </footer>
            </section>
        </div>
    );
}

function GroupList({ groups, selectedId, loading, error, onSelect }) {
    return (
        <div className="fc-friends-list">
            {loading ? (
                <div className="fc-list-message">Loading groups...</div>
            ) : error ? (
                <div className="fc-list-message" role="alert">{error}</div>
            ) : groups.length === 0 ? (
                <div className="fc-list-message">No groups found.</div>
            ) : (
                groups.map((group, index) => {
                    const balance = Number(group.net_balance) || 0;
                    return (
                        <button
                            className={`fc-friend-row ${String(group.id) === String(selectedId) ? "fc-friend-selected" : ""}`}
                            key={group.id}
                            onClick={() => onSelect(group)}
                        >
                            <div className={`fc-avatar fc-avatar-${index % 5}`}>♧</div>
                            <div className="fc-friend-info">
                                <strong>{group.name}</strong>
                                <span>{group.member_count} members</span>
                            </div>
                            <div className="fc-friend-balance">
                                <strong className={balance > 0 ? "fc-positive" : balance < 0 ? "fc-negative" : ""}>
                                    {balance > 0 ? "+" : balance < 0 ? "−" : ""}
                                    {money(Math.abs(balance))}
                                </strong>
                                <span>{balance > 0 ? "Owed to you" : balance < 0 ? "You owe" : "Settled"}</span>
                            </div>
                        </button>
                    );
                })
            )}
        </div>
    );
}

function GroupExpenseCard({ expense, currentUserId, onRequest, onSettle, onAcceptRequest, busy }) {
    const [showDetails, setShowDetails] = useState(false);
    const summary = getSplitSummary(expense, currentUserId);
    const createdAt = new Date(expense.created_at);
    const formattedDate = Number.isNaN(createdAt.getTime())
        ? "Date unavailable"
        : createdAt.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    const mySplit = summary.splits.find((split) => split.userId === String(currentUserId));
    const mySplitSettled = Boolean(
        mySplit &&
        !summary.isPayer &&
        mySplit.settledAmount >= mySplit.share
    );
    const status = mySplitSettled
        ? "Your split paid"
        : summary.isSettled
            ? "Settled"
            : summary.pendingRequests.some((request) =>
                String(request.paid_to) === String(currentUserId)
            )
                ? "Request received"
                : summary.pendingRequests.some((request) =>
                    String(request.paid_by) === String(currentUserId)
                )
                    ? "Request sent"
                    : "Pending";

    return (
        <article className={`fc-message-row ${summary.isPayer ? "fc-message-mine" : "fc-message-theirs"}`}>
            <div className={`fc-expense-card gc-expense-card ${summary.isSettled ? "fc-expense-settled" : ""}`}>
                <div className="fc-expense-topline">
                    <span className={`fc-expense-icon ${summary.isPayer ? "fc-icon-green" : "fc-icon-lilac"}`}>₹</span>
                    <div className="fc-expense-title">
                        <strong>{expense.description}</strong>
                        <span>Created by {summary.isPayer ? "you" : expense.paid_by_name}</span>
                    </div>
                    <span className={`fc-status-pill ${summary.isSettled || mySplitSettled ? "fc-pill-settled" : "fc-pill-pending"}`}>
                        {status}
                    </span>
                </div>

                <div className="fc-expense-amount-row">
                    <span>Total expense</span>
                    <strong>{money(expense.amount)}</strong>
                </div>
                <div className="fc-expense-share-row">
                    <span>
                        {summary.isPayer
                            ? `${summary.debtors.length} member${summary.debtors.length === 1 ? "" : "s"} included`
                            : mySplit
                                ? "Your share"
                                : "Your split"}
                    </span>
                    <strong>
                        {mySplit ? money(mySplit.share) : "You're not included"}
                    </strong>
                </div>
                <p className="gc-recipient-line">
                    Split with {summary.splits.length > 0
                        ? summary.splits.map((split) =>
                            split.userId === String(currentUserId) ? "you" : split.name
                        ).join(", ")
                        : "no members"}
                </p>

                {summary.pendingRequests.length > 0 && (
                    <div className="gc-request-list">
                        <strong className="gc-request-heading">Settlement requests</strong>
                        {summary.pendingRequests.map((request) => (
                            <div className="gc-request-row" key={request.id}>
                                <span>
                                    <strong>{request.paid_by_name}</strong> requested {money(request.amount)}
                                </span>
                                {summary.isPayer ? (
                                    <button
                                        className="gc-accept-button"
                                        onClick={() => onAcceptRequest(request.id)}
                                        disabled={busy}
                                    >
                                        {busy ? "Please wait..." : "Accept"}
                                    </button>
                                ) : (
                                    <span className="gc-request-pending">Pending</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <button className="fc-details-toggle" onClick={() => setShowDetails((value) => !value)}>
                    {showDetails ? "Hide split details" : "View split details"}
                    <span>{showDetails ? "⌃" : "⌄"}</span>
                </button>
                {showDetails && (
                    <div className="fc-expense-details gc-split-list">
                        <div>
                            <span>Created</span>
                            <strong>{formattedDate}</strong>
                        </div>
                        <div>
                            <span>Paid by</span>
                            <strong>{expense.paid_by_name}</strong>
                        </div>
                        <div className="gc-split-members">
                            {summary.splits.map((split) => {
                                const isPayer = split.userId === summary.payerId;
                                const settled = isPayer || split.settledAmount >= split.share;
                                return (
                                    <div className="gc-split-member" key={split.userId}>
                                        <span className="fc-avatar gc-member-avatar">{initials(split.name)}</span>
                                        <span className="gc-member-name">
                                            <strong>{split.name}{split.userId === String(currentUserId) ? " (you)" : ""}</strong>
                                            {!isPayer && (
                                                <small className={settled ? "gc-member-settled" : "gc-member-outstanding"}>
                                                    {settled ? "Settled" : "Outstanding"}
                                                </small>
                                            )}
                                        </span>
                                        <span className="gc-member-payment">
                                            <strong className="gc-member-share">
                                                {isPayer
                                                    ? money(split.share)
                                                    : `${money(split.settledAmount)} / ${money(split.share)}`}
                                            </strong>
                                            <small>{isPayer ? "your share" : "paid / share"}</small>
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {!summary.isSettled && (
                    <div className="fc-expense-actions">
                        {summary.isPayer ? (
                            summary.debtors.some((split) => split.remainingAmount > 0) && (
                                <button className="fc-settle-btn" onClick={onSettle} disabled={busy}>
                                    ✓ Record settlement for members
                                </button>
                            )
                        ) : mySplit && mySplit.remainingAmount > 0 ? (
                            <button
                                className="fc-request-btn"
                                onClick={() => onRequest(mySplit.remainingAmount)}
                                disabled={busy}
                            >
                                {mySplit.requestedAmount > 0 ? "Request remaining share" : "↗ Request to settle"}
                                {" · "}{money(mySplit.remainingAmount)}
                            </button>
                        ) : !mySplit ? (
                            <p className="gc-not-in-split">You aren't included in this expense split.</p>
                        ) : null}
                    </div>
                )}
                <div className="fc-expense-timestamp">{formattedDate}</div>
            </div>
        </article>
    );
}

function GroupExpenseComposer({ members, busy, onClose, onSubmit }) {
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [selectedIds, setSelectedIds] = useState(() => members.map((member) => String(member.id)));
    const numericAmount = Number(amount);
    const validAmount = Number.isSafeInteger(numericAmount) && numericAmount > 0;
    const selectedMembers = members.filter((member) => selectedIds.includes(String(member.id)));
    const splitPreview = useMemo(() => {
        if (!validAmount || selectedMembers.length === 0) return [];
        const baseShare = Math.floor(numericAmount / selectedMembers.length);
        let remainder = numericAmount - baseShare * selectedMembers.length;
        return selectedMembers.map((member) => ({
            ...member,
            share: baseShare + (remainder-- > 0 ? 1 : 0),
        }));
    }, [numericAmount, selectedMembers, validAmount]);
    const valid = title.trim() && validAmount && selectedIds.length > 0;

    function toggleMember(memberId) {
        setSelectedIds((ids) =>
            ids.includes(memberId)
                ? ids.filter((id) => id !== memberId)
                : [...ids, memberId]
        );
    }

    function submit(event) {
        event.preventDefault();
        if (!valid || busy) return;
        onSubmit({
            description: title.trim(),
            amount: numericAmount,
            split: { type: "equal", userIds: selectedIds },
        });
    }

    return (
        <div className="fc-overlay" onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) onClose();
        }}>
            <section className="fc-composer gc-composer" role="dialog" aria-modal="true" aria-labelledby="gc-composer-title">
                <header className="fc-composer-header">
                    <div>
                        <span className="fc-eyebrow">SPLITEASE · GROUP EXPENSE</span>
                        <h2 id="gc-composer-title">Add an expense</h2>
                        <p>Everyone is included by default. Change the split members below.</p>
                    </div>
                    <button className="fc-modal-close" onClick={onClose} disabled={busy} aria-label="Close">×</button>
                </header>

                <form onSubmit={submit}>
                    <label className="fc-field">
                        <span>What was the expense for?</span>
                        <input
                            autoFocus
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="e.g. Dinner, groceries, tickets"
                            maxLength={255}
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

                    <div className="gc-members-picker">
                        <div className="gc-picker-heading">
                            <span className="fc-section-label">WHO SHOULD BE IN THIS SPLIT?</span>
                            <button
                                type="button"
                                className="gc-select-all"
                                onClick={() => setSelectedIds(members.map((member) => String(member.id)))}
                            >
                                Select all
                            </button>
                        </div>
                        <div className="gc-picker-list">
                            {members.map((member) => (
                                <label className="gc-picker-member" key={member.id}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(String(member.id))}
                                        onChange={() => toggleMember(String(member.id))}
                                    />
                                    <span className="fc-avatar gc-member-avatar">{initials(member.name)}</span>
                                    <span className="gc-member-name">
                                        <strong>{member.name}</strong>
                                        <small>{member.username ? `@${member.username}` : "Group member"}</small>
                                    </span>
                                </label>
                            ))}
                        </div>
                        {selectedIds.length === 0 && (
                            <p className="fc-field-error">Select at least one group member.</p>
                        )}
                    </div>

                    {splitPreview.length > 0 && (
                        <div className="gc-preview">
                            <span className="fc-section-label">EQUAL SPLIT PREVIEW</span>
                            {splitPreview.map((member) => (
                                <div key={member.id}>
                                    <span>{member.name}</span>
                                    <strong>{money(member.share)}</strong>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="fc-modal-actions">
                        <button type="button" className="fc-secondary-btn" onClick={onClose} disabled={busy}>
                            Cancel
                        </button>
                        <button type="submit" className="fc-primary-btn" disabled={!valid || busy}>
                            {busy ? "Saving..." : "Create expense"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

function GroupSettlementDialog({ expense, currentUserId, busy, onClose, onSubmit }) {
    const summary = getSplitSummary(expense, currentUserId);
    const payableMembers = summary.debtors.filter((split) => split.remainingAmount > 0);
    const [selectedIds, setSelectedIds] = useState(() => payableMembers.map((split) => split.userId));
    const [amounts, setAmounts] = useState(() =>
        Object.fromEntries(payableMembers.map((split) => [split.userId, String(split.remainingAmount)]))
    );
    const selectedSettlements = payableMembers
        .filter((split) => selectedIds.includes(split.userId))
        .map((split) => ({ userId: split.userId, amount: Number(amounts[split.userId]) }));
    const valid = selectedSettlements.length > 0 && selectedSettlements.every(
        ({ userId, amount }) =>
            Number.isSafeInteger(amount) &&
            amount > 0 &&
            amount <= payableMembers.find((split) => split.userId === userId).remainingAmount
    );

    function toggleMember(userId) {
        setSelectedIds((ids) =>
            ids.includes(userId) ? ids.filter((id) => id !== userId) : [...ids, userId]
        );
    }

    function submit(event) {
        event.preventDefault();
        if (!valid || busy) return;
        onSubmit(selectedSettlements);
    }

    return (
        <div className="fc-overlay" onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) onClose();
        }}>
            <section className="fc-composer gc-composer" role="dialog" aria-modal="true" aria-labelledby="gc-settlement-title">
                <header className="fc-composer-header">
                    <div>
                        <span className="fc-eyebrow">SPLITEASE · SETTLEMENT</span>
                        <h2 id="gc-settlement-title">Record member payments</h2>
                        <p>Choose whose payment you have received for “{expense.description}”.</p>
                    </div>
                    <button className="fc-modal-close" onClick={onClose} disabled={busy} aria-label="Close">×</button>
                </header>

                {payableMembers.length === 0 ? (
                    <p className="gc-not-in-split">There are no member shares available to settle.</p>
                ) : (
                    <form onSubmit={submit}>
                        <div className="gc-settlement-list">
                            {payableMembers.map((member) => (
                                <label className="gc-settlement-member" key={member.userId}>
                                    <span className="gc-settlement-person">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(member.userId)}
                                            onChange={() => toggleMember(member.userId)}
                                        />
                                        <span className="fc-avatar gc-member-avatar">{initials(member.name)}</span>
                                        <span className="gc-member-name">
                                            <strong>{member.name}</strong>
                                            <small>{money(member.remainingAmount)} available</small>
                                        </span>
                                    </span>
                                    <span className="gc-settlement-amount">
                                        <span>₹</span>
                                        <input
                                            type="number"
                                            min="1"
                                            max={member.remainingAmount}
                                            step="1"
                                            value={amounts[member.userId] ?? ""}
                                            onChange={(event) => setAmounts((values) => ({
                                                ...values,
                                                [member.userId]: event.target.value,
                                            }))}
                                            disabled={!selectedIds.includes(member.userId)}
                                            aria-label={`Settlement amount for ${member.name}`}
                                        />
                                    </span>
                                </label>
                            ))}
                        </div>
                        <p className="fc-modal-warning gc-settlement-warning">
                            Only record payments that have actually been received. Pending settlement requests are not included here.
                        </p>
                        <div className="fc-modal-actions">
                            <button type="button" className="fc-secondary-btn" onClick={onClose} disabled={busy}>
                                Cancel
                            </button>
                            <button type="submit" className="fc-primary-btn" disabled={!valid || busy}>
                                {busy ? "Saving..." : "Record selected"}
                            </button>
                        </div>
                    </form>
                )}
            </section>
        </div>
    );
}
