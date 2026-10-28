import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from '../AuthContext';
import "./Dashboard.css";
import "./Settlements.css";
import Notifications from "../components/Notifications";


const initialExpenses = [
    {
        id: 1,
        title: "Dinner at Toit",
        group: "Flatmates",
        person: "You paid ₹2,400",
        amount: 800,
        date: "Today",
        icon: "🍕",
        color: "peach",
    },
    {
        id: 2,
        title: "Weekly groceries",
        group: "Flatmates",
        person: "Rohan paid ₹1,500",
        amount: 500,
        date: "Yesterday",
        icon: "🛒",
        color: "mint",
    },
    {
        id: 3,
        title: "Goa trip booking",
        group: "Goa Trip",
        person: "Priya paid ₹6,000",
        amount: 2000,
        date: "Oct 17",
        icon: "✈️",
        color: "lavender",
    },
    {
        id: 4,
        title: "Cab to airport",
        group: "Goa Trip",
        person: "You paid ₹900",
        amount: 300,
        date: "16",
        icon: "🚕",
        color: "yellow",
    },
];

const menuItems = [
    {
        label: "My Profile",
        description: "View your personal details",
        icon: "user",
        to: "/profile",
    },
    {
        label: "Account Settings",
        description: "Manage your preferences",
        icon: "settings",
        to: "/settings",
    },
    {
        label: "Help & Support",
        description: "We're here to help",
        icon: "help",
        to: "/help",
    },
];

function MenuIcon({ name }) {
    const paths = {
        user: (
            <>
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20c0-4 2.8-6 7-6s7 2 7 6" />
            </>
        ),
        settings: (
            <>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 3.1-.2-.1a1.7 1.7 0 0 0-1.9.3l-.1.1h-3.6l-.1-.2a1.7 1.7 0 0 0-1.5-1l-.4.1-.2.1-3.1-1.8.1-.2a1.7 1.7 0 0 0-.3-1.9l-.1-.1v-3.6l.2-.1a1.7 1.7 0 0 0 1-1.5l-.1-.4-.1-.2 1.8-3.1.2.1a1.7 1.7 0 0 0 1.9-.3l.1-.1h3.6l.1.2a1.7 1.7 0 0 0 1.5 1l.4-.1.2-.1 3.1 1.8-.1.2a1.7 1.7 0 0 0 .3 1.9l.1.1V15z" />
            </>
        ),
        wallet: (
            <>
                <rect x="3" y="6" width="18" height="14" rx="2" />
                <path d="M3 10h18M16 15h.01M6 6V4h12v2" />
            </>
        ),
        help: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-1.1 1-1.7 1.2-1.7 2.7M12 17h.01" />
            </>
        ),
        logout: (
            <>
                <path d="M10 17l5-5-5-5M15 12H3" />
                <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
            </>
        ),
    };

    return (
        <svg
            className="account-menu-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {paths[name]}
        </svg>
    );
}

const formatMoney = (amount) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Math.abs(amount));

const friendInitials = (name = "") =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

const formatSettlementDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "Date unavailable"
        : date.toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
};

export default function Dashboard() {
    const navigate = useNavigate();
    const { accessToken, authenticatedFetch, setAccessToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    useEffect(() => {
        if (!accessToken) return;
        const fetchMe = async () => {
            try {
                setLoading(true);

                const res = await authenticatedFetch("/api/auth/getme", {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                const result = await res.json();
                if (!res.ok) {
                    throw new Error(result.message || "Failed to fetch user");
                }
                setData(result);
            } catch (error) {
                console.error("Fetch error:", error);
            }
            finally {
                setLoading(false);
            }
        };

        fetchMe();
    }, [accessToken, authenticatedFetch]);

    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "Dashboard";
    const handleTabChange = (tabName) => {
        setSearchParams({ tab: tabName });
    }
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        function handleOutsideClick(event) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        }

        function handleEscape(event) {
            if (event.key === "Escape") {
                setIsOpen(false);
                setConfirmLogout(false);
                buttonRef.current?.focus();
            }
        }

        document.addEventListener("click", handleOutsideClick, true);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("click", handleOutsideClick, true);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);


    function closeMenu() {
        setIsOpen(false);
    }

    const [expenses, setExpenses] = useState(initialExpenses);
    const [groups, setGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [groupsError, setGroupsError] = useState("");
    const [activeNav, setActiveNav] = useState(activeTab);
    const [showNotificationTab, setShowNotificationTab] = useState(false);
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [ShowAddGroupForm, setShowAddGroupForm] = useState(false);
    const [ShowAddFriendForm, setShowAddFriendForm] = useState(false);
    const [searchUserResults, setSearchUserResults] = useState([]);
    const [searchUserLoading, setSearchUserLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [searchFriend, setSearchFriend] = useState("");
    const [users, setUsers] = useState([]);
    const [activeFriendTab, setActiveFriendTab] = useState("search");
    const [friendRequests, setFriendRequests] = useState([]);
    const [friendRequestsLoading, setFriendRequestsLoading] = useState(false);
    const [respondingToRequest, setRespondingToRequest] = useState(null);
    const [friendRequestError, setFriendRequestError] = useState("");
    const [people, setPeople] = useState([]);
    const [settlements, setSettlements] = useState([]);
    const [settlementsLoading, setSettlementsLoading] = useState(activeTab === "Settlements");
    const [settlementsError, setSettlementsError] = useState("");
    const [settlementsRefresh, setSettlementsRefresh] = useState(0);
    const [loadingFriends, setLoadingFriends] = useState(true);
    const [friendsError, setFriendsError] = useState("");
    const [notice, setNotice] = useState("");
    const [expenseTitle, setExpenseTitle] = useState("");
    const [expenseAmount, setExpenseAmount] = useState("");
    const [expenseGroup, setExpenseGroup] = useState("Flatmates");
    const [groupName, setGroupName] = useState("");
    const [groupDescription, setGroupDescription] = useState("");
    const [selectedGroupFriendIds, setSelectedGroupFriendIds] = useState([]);
    const [creatingGroup, setCreatingGroup] = useState(false);
    const [groupCreationError, setGroupCreationError] = useState("");
    const [paidBy, setPaidBy] = useState("You");
    const [confirmLogout, setConfirmLogout] = useState(false)
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const updateGreeting = () => {
            const currentHour = new Date().getHours();

            if (currentHour >= 5 && currentHour < 12) {
                setGreeting('Good Morning');
            } else if (currentHour >= 12 && currentHour < 17) {
                setGreeting('Good Afternoon');
            } else if (currentHour >= 17 && currentHour < 21) {
                setGreeting('Good Evening');
            } else {
                setGreeting('Good Night');
            }
        };

        updateGreeting();

        const timer = setInterval(updateGreeting, 60000);

        return () => clearInterval(timer);
    }, []);


    useEffect(() => {
        const identifier = searchFriend.trim();

        if (!identifier) {
            setSearchUserResults([]);
            setSearchUserLoading(false);
            return;
        }

        let cancelled = false;

        const timer = setTimeout(async () => {
            try {
                setSearchUserLoading(true);

                const results = await searchAddFriends(identifier);

                if (cancelled) return;

                setSearchUserResults((prevResults) =>
                    results.map((newUser) => {
                        const existingUser = prevResults.find(
                            (user) => user.id === newUser.id
                        );

                        // Preserve a locally updated status
                        if (
                            existingUser?.friendship_status === "request_sent"
                        ) {
                            return {
                                ...newUser,
                                friendship_status: "request_sent",
                            };
                        }

                        return newUser;
                    })
                );
            } catch (error) {
                if (!cancelled) {
                    console.error("Failed to search users:", error);
                    setSearchUserResults([]);
                }
            } finally {
                if (!cancelled) {
                    setSearchUserLoading(false);
                }
            }
        }, 500);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [searchFriend]);


    useEffect(() => {
        if (!ShowAddFriendForm || activeFriendTab !== "requests") {
            return;
        }

        fetchFriendRequests();
    }, [ShowAddFriendForm, activeFriendTab]);

    useEffect(() => {
        if (!accessToken) return;

        let cancelled = false;
        const fetchGroups = async () => {
            try {
                setLoadingGroups(true);
                setGroupsError("");
                const response = await authenticatedFetch("/api/groups");
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || "Could not load groups.");
                }
                if (!Array.isArray(result.groups)) {
                    throw new Error("The groups response was not a list.");
                }
                if (!cancelled) setGroups(result.groups);
            } catch (error) {
                if (!cancelled) {
                    console.error("Failed to load groups:", error);
                    setGroupsError(error.message || "Could not load groups.");
                }
            } finally {
                if (!cancelled) setLoadingGroups(false);
            }
        };

        fetchGroups();
        return () => {
            cancelled = true;
        };
    }, [accessToken, authenticatedFetch]);

    useEffect(() => {
        if (!accessToken) return;

        let cancelled = false;
        const fetchFriends = async () => {
            try {
                setLoadingFriends(true);
                setFriendsError("");
                const response = await authenticatedFetch("/api/friends");
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Could not load friends.");
                }
                if (!Array.isArray(data)) {
                    throw new Error("The friends response was not a list.");
                }

                if (!cancelled) setPeople(data);
            } catch (error) {
                if (!cancelled) {
                    console.error("Failed to load friends:", error);
                    setFriendsError(error.message || "Could not load friends.");
                }
            } finally {
                if (!cancelled) setLoadingFriends(false);
            }
        };

        fetchFriends();
        return () => {
            cancelled = true;
        };
    }, [accessToken, authenticatedFetch]);

    useEffect(() => {
        if (!accessToken || activeNav !== "Settlements") return;

        let cancelled = false;
        const fetchSettlements = async () => {
            try {
                setSettlementsError("");
                const response = await authenticatedFetch("/api/friends/settlements");
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || "Could not load settlements.");
                }
                if (!Array.isArray(result.settlements)) {
                    throw new Error("The settlements response was not a list.");
                }
                if (!cancelled) setSettlements(result.settlements);
            } catch (error) {
                if (!cancelled) {
                    setSettlementsError(error.message || "Could not load settlements.");
                }
            } finally {
                if (!cancelled) setSettlementsLoading(false);
            }
        };

        void fetchSettlements();
        return () => {
            cancelled = true;
        };
    }, [accessToken, activeNav, authenticatedFetch, settlementsRefresh]);

    const avatarColors = [
        "#FCA5A5",
        "#FDBA74",
        "#FDE68A",
        "#86EFAC",
        "#93C5FD",
        "#C4B5FD",
        "#F9A8D4",
        "#67E8F9",
    ];

    const getAvatarColor = (username = "") => {
        const hash = [...username].reduce(
            (sum, char) => sum + char.charCodeAt(0),
            0
        );

        return avatarColors[hash % avatarColors.length];

    };



    const filteredExpenses = useMemo(
        () =>
            expenses.filter((expense) =>
                `${expense.title} ${expense.group} ${expense.person}`
                    .toLowerCase()
                    .includes(search.toLowerCase())
            ),
        [expenses, search]
    );
    function validatePhone(phone) {
        return /^[6-9]\d{9}$/.test(phone);
    }

    async function searchAddFriends(identifier) {
        const phone = validatePhone(identifier) ? identifier : "";
        const username = phone ? "" : identifier;

        try {
            const response = await fetch("/api/friends/search-add-friend", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    username,
                    phone
                })
            });



            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }

            const result = await response.json();
            console.log(result)

            setUsers(result);
            return result;

        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async function handleAddFriend(receiverId) {
        try {
            const response = await fetch("/api/friends/add-friend", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    receiverId
                })
            })

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }
            const result = await response.json();

            setSearchUserResults((prevResults) =>
                prevResults.map((user) =>
                    user.id === receiverId
                        ? { ...user, friendship_status: "request_sent" }
                        : user
                )
            );
            return result;
        }

        catch (error) {
            console.error(error);
            throw error;
        }
    }

    const fetchFriendRequests = async () => {
        try {
            setFriendRequestsLoading(true);
            setFriendRequestError("");

            const response = await fetch("/api/friends/requests", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                // Add credentials if your authentication uses cookies:
                // credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to load friend requests");
            }

            const data = await response.json();
            setFriendRequests(data.requests ?? []);
        } catch (error) {
            console.error(error);
            setFriendRequestError("Failed to load friend requests.");
        } finally {
            setFriendRequestsLoading(false);
        }
    };

    const handleFriendRequestResponse = async (requestId, action) => {
        if (respondingToRequest === "accepted" || respondingToRequest === "rejected") {
            return;
        }
        try {
            setRespondingToRequest(requestId);
            setFriendRequestError("");

            const response = await fetch(
                `/api/friends/requests/${requestId}/${action}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessToken}`,
                    },
                    // credentials: "include",
                }
            );
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(
                    data.message || `Failed to ${action} friend request`
                );
            }

            setFriendRequests((previousRequests) =>
                previousRequests.filter(
                    (request) => request.id !== requestId
                )
            );

            // If accepted, refresh your friends list here if needed.
        } catch (error) {
            console.error(error);
            setFriendRequestError(
                error.message || `Failed to ${action} friend request.`
            );
        } finally {
            setRespondingToRequest(`${action}ed`);
        }
    };

    async function handleLogout() {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });
            navigate("/auth");

        } catch (error) {
            console.error("Logout request failed:", error);
        } finally {
            setAccessToken(null)
        }
    }

    function addExpense(event) {
        event.preventDefault();

        const amount = Number(expenseAmount);
        if (!expenseTitle.trim() || !Number.isFinite(amount) || amount <= 0) {
            return;
        }

        setExpenses((current) => [
            {
                id: Date.now(),
                title: expenseTitle.trim(),
                group: expenseGroup,
                person: `${paidBy} paid ${formatMoney(amount)}`,
                amount,
                date: "Just now",
                icon: "💸",
                color: "mint",
            },
            ...current,
        ]);

        setExpenseTitle("");
        setExpenseAmount("");
        setShowExpenseForm(false);
        setActiveNav("Dashboard");
        setNotice("Expense added to this demo dashboard.");
    }

    async function createGroup(event) {
        event.preventDefault();
        setGroupCreationError("");
        setCreatingGroup(true);

        try {
            const response = await authenticatedFetch("/api/groups/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: groupName.trim(),
                    description: groupDescription.trim(),
                    memberIds: selectedGroupFriendIds,
                }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Could not create group.");
            }
            if (!result.group?.id) {
                throw new Error("The group was created but the response was invalid.");
            }

            const createdGroup = {
                ...result.group,
                member_count: selectedGroupFriendIds.length + 1,
                net_balance: result.group.net_balance ?? 0,
            };
            setGroups((currentGroups) => [createdGroup, ...currentGroups]);
            setShowAddGroupForm(false);
            setGroupName("");
            setGroupDescription("");
            setSelectedGroupFriendIds([]);
            setNotice(
                `“${createdGroup.name}” created with ${selectedGroupFriendIds.length} friend${selectedGroupFriendIds.length === 1 ? "" : "s"}.`
            );
        } catch (error) {
            console.error("Failed to create group:", error);
            setGroupCreationError(error.message || "Could not create group.");
        } finally {
            setCreatingGroup(false);
        }
    }

    function toggleGroupFriend(friendId) {
        setSelectedGroupFriendIds((selectedIds) =>
            selectedIds.includes(friendId)
                ? selectedIds.filter((id) => id !== friendId)
                : [...selectedIds, friendId]
        );
    }

    const groupColors = ["mint", "peach", "lavender", "yellow"];
    const getGroupBalance = (group) => Number(group.net_balance) || 0;
    const getGroupMemberCount = (group) => Number(group.member_count) || 0;

    const navItems = [
        { label: "Dashboard", icon: "⌂" },
        { label: "Activity", icon: "↗" },
        { label: "Groups", icon: "▦" },
        { label: "Friends", icon: "♧" },
        { label: "Settlements", icon: "⇄" },
    ];

    if (loading) {
        return (
            <div className="loadcontainer">
                <div className="dash uno"></div>
                <div className="dash dos"></div>
                <div className="dash tres"></div>
                <div className="dash cuatro"></div>
            </div>
        );
    }

    return (
        <div className="se-app">
            <aside className="se-sidebar">
                <a href="/workspace" className="se-brand" >
                    <span className="se-brand-mark">
                        <img src="/favicon.svg" alt="" width="40" height="40" />
                    </span>

                    <span >
                        Split<span className="se-brand-light">Ease</span>
                    </span>
                </a>

                <div className="se-workspace-label">WORKSPACE</div>

                <nav className="se-nav">
                    {navItems.map((item) => (
                        <button
                            key={item.label}
                            className={`se-nav-item ${activeNav === item.label ? "active" : ""
                                }`}
                            onClick={() => {
                                setActiveNav(item.label);
                                if (item.label === "Settlements") {
                                    setSettlementsLoading(true);
                                }
                                handleTabChange(item.label)
                                setNotice("");
                            }}
                        >
                            <span className="se-nav-icon">{item.icon}</span>
                            {item.label}
                            {item.label === "Activity" && (
                                <span className="se-nav-count">{expenses.length}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="se-sidebar-bottom">
                    <button
                        className="se-nav-item"
                        onClick={() => setNotice("Settings page coming soon.")}
                    >
                        <span className="se-nav-icon">⚙</span>
                        Settings
                    </button>

                    <div className="se-profile" ref={menuRef}>
                        <div className="se-avatar avatar-green">{data?.user?.name?.[0] || "?"}</div>
                        <div className="se-profile-info">
                            <strong>{data?.user?.name || "Loading account..."}</strong>
                            <span>Personal account</span>
                        </div>
                        <button
                            ref={buttonRef}
                            className={`se-more account-menu-trigger ${isOpen ? "active" : ""}`}
                            aria-label="Open account menu"
                            aria-haspopup="menu"
                            aria-expanded={isOpen}
                            onClick={() => setIsOpen((prev) => !prev)}
                        >
                            ···
                        </button>
                        {isOpen && <div className="account-dropdown" role="menu">
                            <div className="dropdown-heading">
                                <span className="dropdown-heading-title">Your account</span>
                                <span className="dropdown-heading-subtitle">
                                    Manage your SplitEase account
                                </span>
                            </div>

                            <div className="dropdown-divider" />

                            <nav className="account-menu-links" aria-label="Account options">
                                {menuItems.map((item) => (
                                    <button
                                        key={item.label}
                                        to={item.to}
                                        className="account-menu-item"
                                        role="menuitem"
                                        onClick={closeMenu}
                                    >
                                        <span className="menu-item-icon">
                                            <MenuIcon name={item.icon} />
                                        </span>

                                        <span className="menu-item-content">
                                            <span className="menu-item-label">{item.label}</span>
                                            <span className="menu-item-description">
                                                {item.description}
                                            </span>
                                        </span>

                                        <span className="menu-item-arrow">›</span>
                                    </button>
                                ))}
                            </nav>

                            <div className="dropdown-divider" />

                            <button
                                type="button"
                                className="account-logout-button"
                                role="menuitem"
                                onClick={() => setConfirmLogout(true)}
                            >
                                <span className="menu-item-icon logout-icon">
                                    <MenuIcon name="logout" />
                                </span>
                                <span>Log Out</span>
                            </button>

                            <div className="dropdown-footer">
                                Made for sharing, built for simplicity.
                            </div>
                            {confirmLogout && <div className="logout-overlay1">
                                <div
                                    className="logout-box1"
                                >
                                    <div className="logout-icon1">↗</div>

                                    <h3>Confirm logout?</h3>
                                    <p>
                                        Are you sure you want to log out of SplitEase?
                                    </p>

                                    <div className="logout-actions1">
                                        <button
                                            className="logout-cancel1"
                                            onClick={() => setConfirmLogout(false)}
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            className="logout-confirm1"
                                            onClick={handleLogout}
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </div>}
                        </div>}
                    </div>
                </div>
            </aside>

            <main className="se-main" id="dashboard">
                <header className="se-topbar">
                    <div className="se-breadcrumb">
                        Workspace <span>/</span> {activeNav}
                    </div>
                    <div className="se-topbar-right">
                        <span className="se-date">Personal finances, simplified.</span>
                        <button
                            className="se-notification"
                            aria-label="Notifications"
                            onClick={() => setShowNotificationTab(true)}
                        >
                            ♧
                            <span />
                        </button>
                    </div>
                </header>

                <div className="se-content">
                    <section className="se-welcome">
                        <div>
                            <div className="se-eyebrow">{
                                new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })
                            }</div>
                            <h1>
                                {activeNav === "Dashboard"
                                    ? greeting + ', ' + (data?.user?.name?.split(' ')[0] || "there")
                                    : activeNav}
                                <span className="se-wave"> ✳</span>
                            </h1>
                            <p>
                                {activeNav === "Dashboard"
                                    ? "Here's what's happening with your shared expenses."
                                    : `Keep track of your ${activeNav.toLowerCase()} in one place.`}
                            </p>
                        </div>

                        <div className="se-actions">
                            <button
                                className="se-btn se-btn-secondary"
                                onClick={() => {
                                    setActiveNav("Settlements");
                                    setSettlementsLoading(true);
                                    handleTabChange("Settlements");
                                }}
                            >
                                ↔ Settle up
                            </button>
                            {!(activeNav === "Settlements" || activeNav === "Activity") && <button
                                className="se-btn se-btn-primary"
                                onClick={() => {
                                    activeNav === "Friends" ? setShowAddFriendForm(true) :
                                        activeNav === "Groups" ? setShowAddGroupForm(true) :
                                            setShowExpenseForm(true);
                                }}
                            >
                                <span>＋</span>
                                {activeNav === "Friends" ? "Add friend" :
                                    activeNav === "Groups" ? "Add Group" :
                                        "Add expense"}
                            </button>}
                        </div>
                    </section>

                    {notice && (
                        <div className="se-notice" role="status">
                            <span>{notice}</span>
                            <button onClick={() => setNotice("")}>×</button>
                        </div>
                    )}

                    {activeNav === "Dashboard" ? (
                        <>
                            <section className="se-balance-grid">
                                <article className="se-balance-card se-balance-owed">
                                    <div className="se-card-top">
                                        <span className="se-card-icon">↙</span>
                                        <span className="se-card-caption">INCOMING</span>
                                        <span className="se-card-trend">↗</span>
                                    </div>
                                    <p className="se-card-label">You are owed</p>
                                    <h2>₹4,250</h2>
                                    <div className="se-card-foot">
                                        <span className="se-status-dot" />
                                        From 3 people
                                    </div>
                                </article>

                                <article className="se-balance-card se-balance-owe">
                                    <div className="se-card-top">
                                        <span className="se-card-icon">↗</span>
                                        <span className="se-card-caption">OUTGOING</span>
                                        <span className="se-card-trend">↘</span>
                                    </div>
                                    <p className="se-card-label">You owe</p>
                                    <h2>₹1,800</h2>
                                    <div className="se-card-foot">
                                        <span className="se-status-dot" />
                                        To 2 people
                                    </div>
                                </article>

                                <article className="se-balance-card se-balance-total">
                                    <div className="se-card-top">
                                        <span className="se-card-icon">◎</span>
                                        <span className="se-card-caption">YOUR OVERVIEW</span>
                                        <span className="se-total-pill">Positive</span>
                                    </div>
                                    <p className="se-card-label">Total net balance</p>
                                    <h2>+₹2,450</h2>
                                    <div className="se-card-foot">
                                        <span className="se-status-dot" />
                                        You're owed more than you owe
                                    </div>
                                </article>
                            </section>

                            <section className="se-dashboard-grid">
                                <article className="se-panel se-activity-panel">
                                    <div className="se-panel-header">
                                        <div>
                                            <h3>Recent activity</h3>
                                            <p>Your latest shared expenses</p>
                                        </div>
                                        <button
                                            className="se-text-button"
                                            onClick={() => {
                                                setActiveNav("Activity");
                                                handleTabChange("Activity");
                                            }
                                            }
                                        >
                                            View all <span>↗</span>
                                        </button>
                                    </div>

                                    <label className="se-search">
                                        <span>⌕</span>
                                        <input
                                            value={search}
                                            onChange={(event) => setSearch(event.target.value)}
                                            placeholder="Search expenses..."
                                            aria-label="Search expenses"
                                        />
                                        {search && (
                                            <button
                                                onClick={() => setSearch("")}
                                                aria-label="Clear search"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </label>

                                    <div className="se-expense-list">
                                        {filteredExpenses.length ? (
                                            filteredExpenses.map((expense) => (
                                                <div className="se-expense-row" key={expense.id}>
                                                    <div
                                                        className={`se-expense-icon ${expense.color}`}
                                                    >
                                                        {expense.icon}
                                                    </div>
                                                    <div className="se-expense-info">
                                                        <strong>{expense.title}</strong>
                                                        <span>
                                                            {expense.person} · {expense.group}
                                                        </span>
                                                    </div>
                                                    <div className="se-expense-amount">
                                                        <strong>{formatMoney(expense.amount)}</strong>
                                                        <span>{expense.date}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="se-empty">
                                                No expenses match your search.
                                            </div>
                                        )}
                                    </div>
                                </article>

                                <article className="se-panel se-groups-panel">
                                    <div className="se-panel-header">
                                        <div>
                                            <h3>Your groups</h3>
                                            <p>Expenses with your people</p>
                                        </div>
                                        <button
                                            className="se-icon-button"
                                            aria-label="Add group"
                                            onClick={() => {
                                                setGroupCreationError("");
                                                setShowAddGroupForm(true);
                                            }}
                                        >
                                            ＋
                                        </button>
                                    </div>

                                    <div className="se-groups-list">
                                        {loadingGroups ? (
                                            <div className="se-empty">Loading groups...</div>
                                        ) : groupsError ? (
                                            <div className="se-empty" role="alert">{groupsError}</div>
                                        ) : groups.length === 0 ? (
                                            <div className="se-empty">You haven't created any groups yet.</div>
                                        ) : groups.slice(0, 4).map((group, index) => (
                                            <button
                                                className="se-group-row"
                                                key={group.id}
                                                onClick={() => navigate(`/groupchat/${group.id}`)}
                                            >
                                                <span
                                                    className={`se-group-icon ${groupColors[index % groupColors.length]}`}
                                                >
                                                    👥
                                                </span>
                                                <span className="se-group-info">
                                                    <strong>{group.name}</strong>
                                                    <span>{getGroupMemberCount(group)} members</span>
                                                </span>
                                                <span className="se-group-balance">
                                                    <strong>
                                                        {getGroupBalance(group) >= 0 ? "+" : "-"}
                                                        {formatMoney(getGroupBalance(group))}
                                                    </strong>
                                                    <span>Your balance</span>
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        className="se-create-group"
                                        onClick={() => setNotice("Group creation coming soon.")}
                                    >
                                        <span>＋</span> Create a new group
                                    </button>
                                </article>
                            </section>

                            <section className="se-panel se-people-panel">
                                <div className="se-panel-header">
                                    <div>
                                        <h3>People & balances</h3>
                                        <p>A quick look at who owes whom</p>
                                    </div>
                                    <button
                                        className="se-text-button"
                                        onClick={() => {
                                            setActiveNav("Friends");
                                            handleTabChange("Friends")
                                        }
                                        }
                                    >
                                        All friends <span>↗</span>
                                    </button>
                                </div>

                                <div className="se-people-grid">
                                    {people.map((person, index) => (
                                        <button
                                            type="button"
                                            className="se-person"
                                            key={person.friend_id}
                                            onClick={() => navigate(`/friendchat/${encodeURIComponent(person.username)}`)}
                                            aria-label={`Open expenses with ${person.friend_name}`}
                                        >
                                            <div
                                                className={`se-avatar ${index % 2 === 0 ? "avatar-green" : "avatar-peach"
                                                    }`}
                                            >
                                                {friendInitials(person.friend_name)}
                                            </div>
                                            <div className="se-person-info">
                                                <strong>{person.friend_name}</strong>
                                                <span>{person.status}</span>
                                            </div>
                                            <div
                                                className={`se-person-amount ${person.status === "Owes you" ? "positive" : person.status === "You owe" ? "negative" : ""
                                                    }`}
                                            >
                                                {formatMoney(person.amount)}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </section>

                        </>
                    ) : (
                        <section className="se-panel se-section-panel">
                            <div className="se-panel-header">
                                <div>
                                    <h3>{activeNav}</h3>
                                    <p>
                                        {activeNav === "Activity"
                                            ? "Browse and search your shared expenses."
                                            : activeNav === "Groups"
                                                ? "Explore expenses shared with your groups."
                                                : activeNav === "Friends"
                                                    ? "See your balances with friends."
                                                    : "Review recent settlements and outstanding friend balances."}
                                    </p>
                                </div>
                                {activeNav === "Activity" && (
                                    <button
                                        className="se-btn se-btn-primary"
                                        onClick={() => setShowExpenseForm(true)}
                                    >
                                        ＋ Add expense
                                    </button>
                                )}
                            </div>

                            {activeNav === "Activity" && (
                                <>
                                    <label className="se-search">
                                        <span>⌕</span>
                                        <input
                                            value={search}
                                            onChange={(event) => setSearch(event.target.value)}
                                            placeholder="Search expenses..."
                                        />
                                    </label>
                                    {filteredExpenses.map((expense) => (
                                        <div className="se-expense-row" key={expense.id}>
                                            <div className={`se-expense-icon ${expense.color}`}>
                                                {expense.icon}
                                            </div>
                                            <div className="se-expense-info">
                                                <strong>{expense.title}</strong>
                                                <span>{expense.person} · {expense.group}</span>
                                            </div>
                                            <div className="se-expense-amount">
                                                <strong>{formatMoney(expense.amount)}</strong>
                                                <span>{expense.date}</span>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}

                            {activeNav === "Groups" && (
                                loadingGroups ? (
                                    <div className="se-empty">Loading groups...</div>
                                ) : groupsError ? (
                                    <div className="se-empty" role="alert">{groupsError}</div>
                                ) : groups.length === 0 ? (
                                    <div className="se-empty">You haven't created any groups yet. Create one to get started.</div>
                                ) : (
                                    groups.map((group, index) => (
                                        <button
                                            type="button"
                                            className="se-expense-row"
                                            key={group.id}
                                            onClick={() => navigate(`/groupchat/${group.id}`)}
                                        >
                                            <div className={`se-expense-icon ${groupColors[index % groupColors.length]}`}>
                                                👥
                                            </div>
                                            <div className="se-expense-info">
                                                <strong>{group.name}</strong>
                                                <span>{getGroupMemberCount(group)} members</span>
                                            </div>
                                            <div className="se-expense-amount">
                                                <strong>
                                                    {getGroupBalance(group) >= 0 ? "+" : "-"}
                                                    {formatMoney(getGroupBalance(group))}
                                                </strong>
                                                <span>Your balance</span>
                                            </div>
                                        </button>
                                    ))
                                )
                            )}

                            {activeNav === "Friends" && (
                                <div>
                                    {loadingFriends ? (
                                        <p>Loading friends...</p>
                                    ) : friendsError ? (
                                        <p>{friendsError}</p>
                                    ) : people.length === 0 ? (
                                        <p>You haven't added any friends yet.</p>
                                    ) : (
                                        people.map((person) => (
                                            <button
                                                type="button"
                                                className="se-expense-row"
                                                key={person.friend_id}
                                                onClick={() => navigate(`/friendchat/${encodeURIComponent(person.username)}`)}
                                                aria-label={`Open expenses with ${person.friend_name}`}
                                            >
                                                <div className="se-avatar avatar-green">
                                                    {friendInitials(person.friend_name)}
                                                </div>

                                                <div className="se-expense-info">
                                                    <strong>{person.friend_name}</strong>
                                                    <span>{person.status}</span>
                                                </div>

                                                <div className="se-expense-amount">
                                                    <strong>
                                                        {formatMoney(Math.abs(person.amount))}
                                                    </strong>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeNav === "Settlements" && (
                                <div className="settlements-tab-content">
                                    <section className="settlements-section">
                                        <div className="settlements-section-heading">
                                            <div>
                                                <h2>Balances with friends</h2>
                                                <p>Choose a friend to review shared expenses and settle up.</p>
                                            </div>
                                        </div>

                                        {loadingFriends ? (
                                            <p className="settlements-empty">Loading balances...</p>
                                        ) : friendsError ? (
                                            <p className="settlements-empty" role="alert">{friendsError}</p>
                                        ) : people.length === 0 ? (
                                            <p className="settlements-empty">You don’t have any friends to settle with yet.</p>
                                        ) : (
                                            <div className="settlements-friends">
                                                {people.map((friend) => {
                                                    const amount = Number(friend.amount) || 0;
                                                    const owesYou = friend.status === "Owes you";
                                                    const youOwe = friend.status === "You owe";

                                                    return (
                                                        <article className="settlement-friend" key={friend.friend_id}>
                                                            <div className="settlement-friend-avatar" aria-hidden="true">
                                                                {friendInitials(friend.friend_name).charAt(0) || "?"}
                                                            </div>
                                                            <div className="settlement-friend-details">
                                                                <strong>{friend.friend_name}</strong>
                                                                <span>
                                                                    {owesYou ? "Owes you" : youOwe ? "You owe" : "All settled"}
                                                                </span>
                                                            </div>
                                                            <strong className={`settlement-balance ${owesYou ? "is-positive" : youOwe ? "is-negative" : ""}`}>
                                                                {formatMoney(amount)}
                                                            </strong>
                                                            {amount > 0 ? (
                                                                <button
                                                                    type="button"
                                                                    className="settlement-action"
                                                                    onClick={() => navigate(`/friendchat/${encodeURIComponent(friend.username)}`)}
                                                                    disabled={!friend.username}
                                                                >
                                                                    {youOwe ? "Settle up" : "Review"}
                                                                    <span aria-hidden="true">↗</span>
                                                                </button>
                                                            ) : (
                                                                <span className="settlement-complete">✓ Settled</span>
                                                            )}
                                                        </article>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </section>

                                    <section className="settlements-section">
                                        <div className="settlements-section-heading">
                                            <div>
                                                <h2>Recent settlements</h2>
                                                <p>Your latest settlement activity, including requests awaiting confirmation.</p>
                                            </div>
                                            <button
                                                type="button"
                                                className="se-text-button"
                                                onClick={() => {
                                                    setSettlementsLoading(true);
                                                    setSettlementsRefresh((value) => value + 1);
                                                }}
                                                disabled={settlementsLoading}
                                            >
                                                Refresh
                                            </button>
                                        </div>

                                        {settlementsLoading ? (
                                            <p className="settlements-empty">Loading settlement history...</p>
                                        ) : settlementsError ? (
                                            <div className="settlements-error" role="alert">
                                                <span>{settlementsError}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSettlementsLoading(true);
                                                        setSettlementsRefresh((value) => value + 1);
                                                    }}
                                                >
                                                    Try again
                                                </button>
                                            </div>
                                        ) : settlements.length === 0 ? (
                                            <p className="settlements-empty">No settlements or settlement requests yet.</p>
                                        ) : (
                                            <div className="settlements-history">
                                                {settlements.map((settlement) => {
                                                    const paidByUser = settlement.direction === "paid";
                                                    const statusText = settlement.status === "accepted"
                                                        ? "Completed"
                                                        : paidByUser
                                                            ? "Awaiting confirmation"
                                                            : "Needs your confirmation";

                                                    return (
                                                        <article className="settlement-history-row" key={settlement.id}>
                                                            <span className={`settlement-history-icon ${settlement.status === "accepted" ? "is-complete" : ""}`}>
                                                                {settlement.status === "accepted" ? "✓" : "◷"}
                                                            </span>
                                                            <div className="settlement-history-details">
                                                                <strong>{settlement.friend_name}</strong>
                                                                <span>{settlement.expense_description} · {formatSettlementDate(settlement.created_at)}</span>
                                                            </div>
                                                            <div className="settlement-history-amount">
                                                                <strong>{formatMoney(Number(settlement.amount))}</strong>
                                                                <span>{statusText}</span>
                                                            </div>
                                                        </article>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </section>
                                </div>
                            )}

                        </section>
                    )}

                    <footer className="se-footer">
                        <span>SplitEase</span>
                        <span>Less awkward money talks. More good times.</span>
                    </footer>
                </div>
            </main>

            {showExpenseForm && (
                <div
                    className="se-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowExpenseForm(false);
                        }
                    }}
                >
                    <form className="se-modal" onSubmit={addExpense}>
                        <div className="se-modal-header">
                            <div>
                                <h2>Add an expense</h2>
                                <p>Record a shared expense.</p>
                            </div>
                            <button
                                type="button"
                                className="se-modal-close"
                                onClick={() => setShowExpenseForm(false)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <label className="se-field">
                            Expense name
                            <input
                                required
                                autoFocus
                                value={expenseTitle}
                                onChange={(event) => setExpenseTitle(event.target.value)}
                                placeholder="e.g. Dinner, groceries"
                            />
                        </label>

                        <label className="se-field">
                            Total amount (₹)
                            <input
                                required
                                min="0.01"
                                step="0.01"
                                type="number"
                                value={expenseAmount}
                                onChange={(event) => setExpenseAmount(event.target.value)}
                                placeholder="0.00"
                            />
                        </label>

                        <label className="se-field">
                            Group
                            <select
                                value={expenseGroup}
                                onChange={(event) => setExpenseGroup(event.target.value)}
                            >
                                {groups.map((group) => (
                                    <option key={group.name}>{group.name}</option>
                                ))}
                            </select>
                        </label>

                        <label className="se-field">
                            Paid by
                            <select
                                value={paidBy}
                                onChange={(event) => setPaidBy(event.target.value)}
                            >
                                <option>You</option>
                                <option>Rohan</option>
                                <option>Priya</option>
                                <option>Ananya</option>
                            </select>
                        </label>

                        <button className="se-btn se-btn-primary se-submit" type="submit">
                            Save expense
                        </button>
                    </form>
                </div>
            )}

            {ShowAddGroupForm && (
                <div
                    className="se-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !creatingGroup) {
                            setShowAddGroupForm(false);
                        }
                    }}
                >
                    <form className="se-modal" onSubmit={createGroup}>
                        <div className="se-modal-header">
                            <div>
                                <h2>Create a group</h2>
                                <p>Add a name and choose friends to include.</p>
                            </div>
                            <button
                                type="button"
                                className="se-modal-close"
                                onClick={() => setShowAddGroupForm(false)}
                                disabled={creatingGroup}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <label className="se-field">
                            Group name
                            <input
                                required
                                autoFocus
                                minLength="2"
                                maxLength="50"
                                value={groupName}
                                onChange={(event) => setGroupName(event.target.value)}
                                placeholder="e.g. Flatmates, Goa trip"
                            />
                        </label>

                        <label className="se-field">
                            Description (optional)
                            <input
                                maxLength="200"
                                value={groupDescription}
                                onChange={(event) => setGroupDescription(event.target.value)}
                                placeholder="What is this group for?"
                            />
                        </label>

                        <fieldset className="se-group-friends">
                            <legend>
                                Add friends
                                {selectedGroupFriendIds.length > 0 &&
                                    ` (${selectedGroupFriendIds.length} selected)`}
                            </legend>
                            {loadingFriends ? (
                                <p className="group-friends-message">Loading friends...</p>
                            ) : friendsError ? (
                                <p className="group-friends-message" role="alert">{friendsError}</p>
                            ) : people.length === 0 ? (
                                <p className="group-friends-message">You don't have any friends to add yet.</p>
                            ) : (
                                <div className="se-group-friend-list">
                                    {people.map((friend) => (
                                        <label className="se-group-friend" key={friend.friend_id}>
                                            <input
                                                type="checkbox"
                                                checked={selectedGroupFriendIds.includes(friend.friend_id)}
                                                onChange={() => toggleGroupFriend(friend.friend_id)}
                                            />
                                            <span className="se-avatar avatar-green">
                                                {friendInitials(friend.friend_name)}
                                            </span>
                                            <span className="se-group-friend-info">
                                                <strong>{friend.friend_name}</strong>
                                                <span>@{friend.username}</span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </fieldset>

                        {groupCreationError && (
                            <p className="se-form-error" role="alert">{groupCreationError}</p>
                        )}

                        <button
                            className="se-btn se-btn-primary se-submit"
                            type="submit"
                            disabled={creatingGroup}
                        >
                            {creatingGroup ? "Creating group..." : "Create group"}
                        </button>
                    </form>
                </div>
            )}

            {ShowAddFriendForm && (
                <div className="se-modal-backdrop">
                    <div className="se-modal">
                        {/* Header */}
                        <div className="se-modal-header">
                            <div>
                                <h2>Add a friend</h2>
                                <p>Find friends or manage your friend requests.</p>
                            </div>

                            <button
                                type="button"
                                className="se-modal-close"
                                onClick={() => setShowAddFriendForm(false)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="friend-tabs">
                            <button
                                type="button"
                                className={`friend-tab ${activeFriendTab === "search" ? "active" : ""
                                    }`}
                                onClick={() => setActiveFriendTab("search")}
                            >
                                Find Friends
                            </button>

                            <button
                                type="button"
                                className={`friend-tab ${activeFriendTab === "requests" ? "active" : ""
                                    }`}
                                onClick={() => setActiveFriendTab("requests")}
                            >
                                Friend Requests
                                {friendRequests?.length > 0 && (
                                    <span className="friend-request-badge">
                                        {friendRequests.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Section 1: Find Friends */}
                        {activeFriendTab === "search" && (
                            <div className="friend-tab-content">
                                <div className="friend-search">
                                    <span className="search-icon" aria-hidden="true">
                                        <svg
                                            width="20px"
                                            height="20px"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M16.6725 16.6412L21 21M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
                                                stroke="#6b7280"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>

                                    <input
                                        type="text"
                                        placeholder="Search by name or username..."
                                        value={searchFriend}
                                        onChange={(e) => setSearchFriend(e.target.value)}
                                        aria-label="Search friends"
                                    />

                                    {searchFriend && (
                                        <button
                                            type="button"
                                            className="clear-search"
                                            onClick={() => setSearchFriend("")}
                                            aria-label="Clear search"
                                        >
                                            &times;
                                        </button>
                                    )}
                                </div>

                                {searchUserLoading && (
                                    <p className="friend-status-message">
                                        Searching users...
                                    </p>
                                )}

                                {!searchUserLoading &&
                                    searchFriend.trim() &&
                                    searchUserResults.length === 0 && (
                                        <p className="friend-status-message">
                                            No users found.
                                        </p>
                                    )}

                                {!searchUserLoading &&
                                    !searchFriend.trim() && (
                                        <p className="friend-status-message">
                                            Search for people by name or username.
                                        </p>
                                    )}

                                <div className="search-friend-results">
                                    {searchUserResults.map((user) => (
                                        <div
                                            key={user.username}
                                            className="search-friend-result"
                                        >
                                            <div
                                                className="search-friend-avatar"
                                                style={{
                                                    backgroundColor: getAvatarColor(
                                                        user.name
                                                    ),
                                                }}
                                            >
                                                {(user.name || user.username || "?")
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div className="search-friend-info">
                                                <span>{user.username}</span>
                                                <span>{user.name}</span>
                                            </div>

                                            {user.friendship_status === "friends" ? (
                                                <button disabled>Friends ✓</button>
                                            ) : user.friendship_status === "request_sent" ? (
                                                <button disabled>Request Sent</button>
                                            ) : user.friendship_status === "request_received" ? (
                                                <button onClick={() => setActiveFriendTab("requests")}>Accept Request</button>
                                            ) : (<button onClick={() => handleAddFriend(user.id)}>
                                                Add Friend
                                            </button>
                                            )
                                            }
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Section 2: Friend Requests */}
                        {activeFriendTab === "requests" && (
                            <div className="friend-tab-content">
                                {friendRequestsLoading && (
                                    <p className="friend-status-message">
                                        Loading friend requests...
                                    </p>
                                )}

                                {friendRequestError && (
                                    <p className="friend-error-message">
                                        {friendRequestError}
                                    </p>
                                )}

                                {!friendRequestsLoading &&
                                    !friendRequestError &&
                                    friendRequests.length === 0 && (
                                        <p className="friend-status-message">
                                            You don't have any pending friend requests.
                                        </p>
                                    )}

                                <div className="search-friend-results">
                                    {friendRequests.map((request) =>
                                    (
                                        <div
                                            key={request.id}
                                            className="search-friend-result"
                                        >
                                            <div
                                                className="search-friend-avatar"
                                                style={{
                                                    backgroundColor: getAvatarColor(
                                                        request.name
                                                    ),
                                                }}
                                            >
                                                {(request.name || request.username || "?")
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div className="search-friend-info">
                                                <span>{request.username}</span>
                                                <span>{request.name}</span>
                                            </div>

                                            <div className="friend-request-actions">
                                                {respondingToRequest !== "rejected" && <button
                                                    type="button"
                                                    className="accept-request-btn"
                                                    disabled={
                                                        respondingToRequest === request.request_id
                                                    }
                                                    onClick={() =>
                                                        handleFriendRequestResponse(
                                                            request.request_id,
                                                            "accept"
                                                        )
                                                    }
                                                >
                                                    {respondingToRequest === request.request_id ? "Please wait..." :
                                                        respondingToRequest === "accepted" ? "Accepted" :
                                                            "Accept"}
                                                </button>}

                                                {respondingToRequest !== "accepted" && <button
                                                    type="button"
                                                    className="decline-request-btn"
                                                    disabled={
                                                        respondingToRequest === request.request_id
                                                    }
                                                    onClick={() =>
                                                        handleFriendRequestResponse(
                                                            request.request_id,
                                                            "reject"
                                                        )
                                                    }
                                                >
                                                    {respondingToRequest === request.request_id ? "Please wait..." :
                                                        respondingToRequest === "rejected" ? "Rejected" :
                                                            "Reject"}
                                                </button>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {showNotificationTab && (<Notifications />)}
        </div>
    );
}
