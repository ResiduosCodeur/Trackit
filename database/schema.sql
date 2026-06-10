CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by)
    REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS group_members (
    group_id INT,
    user_id INT,

    PRIMARY KEY(group_id, user_id),

    FOREIGN KEY (group_id)
    REFERENCES user_groups(id),

    FOREIGN KEY (user_id)
    REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    paid_by INT NOT NULL,
    description VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (group_id)
        REFERENCES user_groups(id)
        ON DELETE CASCADE,

    FOREIGN KEY (paid_by)
        REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS expense_splits (
    expense_id INT NOT NULL,
    user_id INT NOT NULL,
    amount_owed DECIMAL(10,2) NOT NULL,

    PRIMARY KEY (expense_id, user_id),

    FOREIGN KEY (expense_id)
        REFERENCES expenses(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settlements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payer_id INT NOT NULL,
    receiver_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (payer_id)
        REFERENCES users(id),

    FOREIGN KEY (receiver_id)
        REFERENCES users(id)
);

CREATE INDEX idx_expenses_group
ON expenses(group_id);

CREATE INDEX idx_expenses_paid_by
ON expenses(paid_by);

CREATE INDEX idx_group_members_user
ON group_members(user_id);

CREATE INDEX idx_settlements_payer
ON settlements(payer_id);

CREATE INDEX idx_settlements_receiver
ON settlements(receiver_id);