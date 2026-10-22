import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from '../AuthContext';
import FriendSearch from "../components/FriendSearch"
import "./Dashboard.css";

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

const groups = [
    {
        name: "Flatmates",
        subtitle: "4 members",
        icon: "🏠",
        color: "mint",
        balance: 1250,
    },
    {
        name: "Goa Trip",
        subtitle: "5 members",
        icon: "🏖️",
        color: "peach",
        balance: 900,
    },
    {
        name: "Office Lunch",
        subtitle: "3 members",
        icon: "🍜",
        color: "lavender",
        balance: 300,
    },
];

const people = [
    { name: "Rohan Sharma", initials: "RS", amount: 1800 },
    { name: "Priya Mehta", initials: "PM", amount: 1450 },
    { name: "Ananya Singh", initials: "AS", amount: -800 },
    { name: "Kabir Verma", initials: "KV", amount: -1000 },
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
    const [activeNav, setActiveNav] = useState(activeTab);
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [showSettleForm, setShowSettleForm] = useState(false);
    const [ShowAddGroupForm, setShowAddGroupForm] = useState(false);
    const [ShowAddFriendForm, setShowAddFriendForm] = useState(false);
    const [searchUserResults, setSearchUserResults] = useState([]);
    const [searchUserLoading, setSearchUserLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [searchFriend, setSearchFriend] = useState("");
    const [users, setUsers] = useState([]);
    const [notice, setNotice] = useState("");
    const [expenseTitle, setExpenseTitle] = useState("");
    const [expenseAmount, setExpenseAmount] = useState("");
    const [expenseGroup, setExpenseGroup] = useState("Flatmates");
    const [paidBy, setPaidBy] = useState("You");
    const [settledPerson, setSettledPerson] = useState("Rohan Sharma");
    const [settledAmount, setSettledAmount] = useState("");
    const [settlements, setSettlements] = useState([]);
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
            console.log(error);
            throw error;
        }
    }


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

    function recordSettlement(event) {
        event.preventDefault();

        const amount = Number(settledAmount);
        if (!Number.isFinite(amount) || amount <= 0) return;

        setSettlements((current) => [
            {
                id: Date.now(),
                person: settledPerson,
                amount,
                date: "Just now",
            },
            ...current,
        ]);

        setSettledAmount("");
        setShowSettleForm(false);
        setNotice(
            `Demo settlement recorded for ${settledPerson}.`
        );
    }

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
                            onClick={() => setNotice("You're all caught up!")}
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
                                onClick={() => setShowSettleForm(true)}
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
                                            onClick={() =>
                                                setNotice("Group creation coming soon.")
                                            }
                                        >
                                            ＋
                                        </button>
                                    </div>

                                    <div className="se-groups-list">
                                        {groups.map((group) => (
                                            <button
                                                className="se-group-row"
                                                key={group.name}
                                                onClick={() => {
                                                    setSearch(group.name);
                                                    setActiveNav("Activity");
                                                }}
                                            >
                                                <span
                                                    className={`se-group-icon ${group.color}`}
                                                >
                                                    {group.icon}
                                                </span>
                                                <span className="se-group-info">
                                                    <strong>{group.name}</strong>
                                                    <span>{group.subtitle}</span>
                                                </span>
                                                <span className="se-group-balance">
                                                    <strong>
                                                        {group.balance >= 0 ? "+" : "-"}
                                                        {formatMoney(group.balance)}
                                                    </strong>
                                                    <span>your balance</span>
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
                                        <div className="se-person" key={person.name}>
                                            <div
                                                className={`se-avatar ${index % 2 === 0 ? "avatar-green" : "avatar-peach"
                                                    }`}
                                            >
                                                {person.initials}
                                            </div>
                                            <div className="se-person-info">
                                                <strong>{person.name}</strong>
                                                <span>
                                                    {person.amount > 0 ? "Owes you" : "You owe"}
                                                </span>
                                            </div>
                                            <div
                                                className={`se-person-amount ${person.amount > 0 ? "positive" : "negative"
                                                    }`}
                                            >
                                                {formatMoney(person.amount)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {settlements.length > 0 && (
                                <section className="se-panel se-people-panel">
                                    <div className="se-panel-header">
                                        <div>
                                            <h3>Recent settlements</h3>
                                            <p>Settlements recorded in this demo</p>
                                        </div>
                                    </div>
                                    {settlements.map((settlement) => (
                                        <div className="se-expense-row" key={settlement.id}>
                                            <div className="se-expense-icon mint">✓</div>
                                            <div className="se-expense-info">
                                                <strong>{settlement.person}</strong>
                                                <span>Settlement recorded · {settlement.date}</span>
                                            </div>
                                            <div className="se-expense-amount">
                                                <strong>{formatMoney(settlement.amount)}</strong>
                                            </div>
                                        </div>
                                    ))}
                                </section>
                            )}
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
                                                    : "Review settlements recorded in this demo."}
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

                            {activeNav === "Groups" &&
                                groups.map((group) => (
                                    <div className="se-expense-row" key={group.name}>
                                        <div className={`se-expense-icon ${group.color}`}>
                                            {group.icon}
                                        </div>
                                        <div className="se-expense-info">
                                            <strong>{group.name}</strong>
                                            <span>{group.subtitle}</span>
                                        </div>
                                        <div className="se-expense-amount">
                                            <strong>{formatMoney(group.balance)}</strong>
                                            <span>Your balance</span>
                                        </div>
                                    </div>
                                ))}

                            {activeNav === "Friends" &&
                                people.map((person) => (
                                    <div className="se-expense-row" key={person.name}>
                                        <div className="se-avatar avatar-green">
                                            {person.initials}
                                        </div>
                                        <div className="se-expense-info">
                                            <strong>{person.name}</strong>
                                            <span>
                                                {person.amount > 0 ? "Owes you" : "You owe"}
                                            </span>
                                        </div>
                                        <div className="se-expense-amount">
                                            <strong>{formatMoney(person.amount)}</strong>
                                        </div>
                                    </div>
                                ))}

                            {activeNav === "Settlements" && (
                                settlements.length > 0 ? (
                                    settlements.map((settlement) => (
                                        <div className="se-expense-row" key={settlement.id}>
                                            <div className="se-expense-icon mint">✓</div>

                                            <div className="se-expense-info">
                                                <strong>{settlement.person}</strong>
                                                <span>{settlement.date}</span>
                                            </div>

                                            <div className="se-expense-amount">
                                                <strong>{formatMoney(settlement.amount)}</strong>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="se-empty">
                                        No settlements recorded yet.
                                    </div>
                                )
                            )}

                            {activeNav === "Settlements" && (
                                <button
                                    className="se-btn se-btn-primary"
                                    onClick={() => setShowSettleForm(true)}
                                >
                                    ↔ Record settlement
                                </button>
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

            {showSettleForm && (
                <div
                    className="se-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowSettleForm(false);
                        }
                    }}
                >
                    <form className="se-modal" onSubmit={recordSettlement}>
                        <div className="se-modal-header">
                            <div>
                                <h2>Record a settlement</h2>
                                <p>Log a payment between you and a friend.</p>
                            </div>
                            <button
                                type="button"
                                className="se-modal-close"
                                onClick={() => setShowSettleForm(false)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <label className="se-field">
                            Friend
                            <select
                                value={settledPerson}
                                onChange={(event) => setSettledPerson(event.target.value)}
                            >
                                {people.map((person) => (
                                    <option key={person.name}>{person.name}</option>
                                ))}
                            </select>
                        </label>

                        <label className="se-field">
                            Amount received or paid (₹)
                            <input
                                required
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={settledAmount}
                                onChange={(event) => setSettledAmount(event.target.value)}
                                placeholder="0.00"
                            />
                        </label>

                        <button className="se-btn se-btn-primary se-submit" type="submit">
                            Record settlement
                        </button>
                    </form>
                </div>
            )}
            {ShowAddFriendForm && (
                <div className="se-modal-backdrop">
                    <div className="se-modal">
                        <div className="se-modal-header">
                            <div>
                                <h2>Add a friend</h2>
                                <p>Search for people and split bills with them.</p>
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
                        <div className="friend-search">
                            <span className="search-icon" aria-hidden="true">
                                <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M16.6725 16.6412L21 21M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
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
                                    className="clear-search"
                                    onClick={() => setSearchFriend("")}
                                    aria-label="Clear search"
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                        {searchUserLoading && <p>Searching users...</p>}

                        {!searchUserLoading &&
                            searchFriend.trim() &&
                            searchUserResults.length === 0 && (
                                <p>No users found.</p>
                            )}


                        <div className="search-friend-results">
                            {searchUserResults.map((user) => (
                                <div key={user.username} className="search-friend-result">
                                    <div className="search-friend-avatar" style={{ backgroundColor: getAvatarColor(user.name) }}>
                                        {(user.name || user.username || "?")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>

                                    <div className="search-friend-info">
                                        <span>{user.username}</span>
                                        <span>{user.name}</span>
                                    </div>

                                    <button
                                        onClick={() => handleAddFriend(user.id)}
                                        disabled={user.friendship_status === "request_sent"}
                                    >
                                        {user.friendship_status === "request_sent"
                                            ? "Request Sent"
                                            : `Add Friend`}
                                    </button>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
