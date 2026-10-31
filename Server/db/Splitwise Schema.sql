CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(100) NOT NULL,
    email varchar(255) UNIQUE,
    phone varchar(10) NOT NULL UNIQUE,
    username varchar(20) NOT NULL UNIQUE,
    password_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_users_phone_format CHECK (phone ~ '^[6-9][0-9]{9}$')
);

CREATE TABLE groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(50) NOT NULL,
    description varchar(200) NOT NULL DEFAULT '',
    created_by uuid NOT NULL REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE group_members (
    group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
    paid_by uuid NOT NULL REFERENCES users(id),
    amount bigint NOT NULL CHECK (amount > 0),
    description varchar(255) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE expense_splits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id),
    amount bigint NOT NULL CHECK (amount >= 0),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (expense_id, user_id)
);

CREATE TABLE settlements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
    expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    paid_by uuid NOT NULL REFERENCES users(id),
    paid_to uuid NOT NULL REFERENCES users(id),
    amount bigint NOT NULL CHECK (amount > 0),
    status varchar(10) NOT NULL DEFAULT 'accepted'
        CHECK (status IN ('requested', 'accepted')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE friends (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status varchar(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    CONSTRAINT no_self_friend_request CHECK (sender_id <> receiver_id),
    CONSTRAINT unique_friend_request UNIQUE (sender_id, receiver_id)
);

CREATE UNIQUE INDEX unique_friend_pair
    ON friends (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id));
CREATE INDEX idx_friends_receiver_status ON friends (receiver_id, status);
CREATE INDEX idx_friends_sender_status ON friends (sender_id, status);

CREATE TABLE group_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    invited_by uuid NOT NULL REFERENCES users(id),
    invited_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    invited_phone varchar(15),
    status varchar(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    expires_at timestamptz
);

CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type varchar(50) NOT NULL,
    title varchar(150) NOT NULL,
    message text NOT NULL,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash text UNIQUE,
    ip varchar(45),
    user_agent text,
    revoked boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_group_id ON expenses (group_id);
CREATE INDEX idx_expenses_paid_by ON expenses (paid_by);
CREATE INDEX idx_expense_splits_user_id ON expense_splits (user_id);
CREATE INDEX idx_settlements_group_id ON settlements (group_id);
CREATE INDEX idx_settlements_expense_id ON settlements (expense_id);
CREATE INDEX idx_settlements_paid_by ON settlements (paid_by);
CREATE INDEX idx_settlements_paid_to ON settlements (paid_to);
CREATE INDEX idx_settlements_status ON settlements (status);
CREATE INDEX idx_group_invitations_group_id ON group_invitations (group_id);
CREATE INDEX idx_group_invitations_invited_by ON group_invitations (invited_by);
CREATE INDEX idx_group_invitations_invited_user_id ON group_invitations (invited_user_id);
CREATE INDEX idx_group_invitations_invited_phone ON group_invitations (invited_phone);
CREATE INDEX idx_group_invitations_status ON group_invitations (status);
CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_is_read ON notifications (is_read);
CREATE INDEX idx_notifications_created_at ON notifications (created_at);
CREATE INDEX idx_sessions_user_id ON sessions (user_id);
CREATE INDEX idx_sessions_revoked ON sessions (revoked);
