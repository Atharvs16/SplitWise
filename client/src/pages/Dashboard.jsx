
import { useEffect, useMemo, useState } from "react";
import { useAuth } from '../AuthContext';
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
        date: "Oct 16",
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

const formatMoney = (amount) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Math.abs(amount));

export default function Dashboard() {
    const { accessToken } = useAuth();
    const [data, setData] = useState(null);
    useEffect(()=>{
        fetch('/api/auth/getme', {
            headers: { Authorization: `Bearer ${accessToken}` }
        })
        .then(res => res.json())
        .then(setData)
        .then(console.log);
        },
    [accessToken]);
    

    const [expenses, setExpenses] = useState(initialExpenses);
    const [activeNav, setActiveNav] = useState("Dashboard");
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [showSettleForm, setShowSettleForm] = useState(false);
    const [search, setSearch] = useState("");
    const [notice, setNotice] = useState("");
    const [expenseTitle, setExpenseTitle] = useState("");
    const [expenseAmount, setExpenseAmount] = useState("");
    const [expenseGroup, setExpenseGroup] = useState("Flatmates");
    const [paidBy, setPaidBy] = useState("You");
    const [settledPerson, setSettledPerson] = useState("Rohan Sharma");
    const [settledAmount, setSettledAmount] = useState("");
    const [settlements, setSettlements] = useState([]);


    const filteredExpenses = useMemo(
        () =>
            expenses.filter((expense) =>
                `${expense.title} ${expense.group} ${expense.person}`
                    .toLowerCase()
                    .includes(search.toLowerCase())
            ),
        [expenses, search]
    );

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

    return (
        <div className="se-app">
            <aside className="se-sidebar">
                <a href="/" className="se-brand" >
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

                    <div className="se-profile">
                        <div className="se-avatar avatar-green">A</div>
                        <div className="se-profile-info">
                            <strong>Atharv</strong>
                            <span>Personal account</span>
                        </div>
                        <button
                            className="se-more"
                            aria-label="Account options"
                            onClick={() => setNotice("Account menu coming soon.")}
                        >
                            ···
                        </button>
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
                            <div className="se-eyebrow">MONDAY, OCTOBER 19</div>
                            <h1>
                                {activeNav === "Dashboard"
                                    ? "Good evening, Atharv"
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
                            <button
                                className="se-btn se-btn-primary"
                                onClick={() => setShowExpenseForm(true)}
                            >
                                <span>＋</span> Add expense
                            </button>
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
                                            onClick={() => setActiveNav("Activity")}
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
                                        onClick={() => setActiveNav("Friends")}
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
        </div>
    );
}
