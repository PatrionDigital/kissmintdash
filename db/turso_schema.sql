-- Schema for KissMint Dash Leaderboard System - Turso Database

-- Table to archive leaderboard standings after each period (daily/weekly)
CREATE TABLE IF NOT EXISTS leaderboard_archives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_identifier TEXT NOT NULL, -- e.g., '2023-10-26' for daily, '2023-W43' for weekly
  board_type TEXT NOT NULL CHECK(board_type IN ('daily', 'weekly')),
  user_id TEXT NOT NULL,           -- Farcaster ID (FID) of the user
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  prize_amount REAL NOT NULL,      -- Amount of $GLICO won
  archived_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table to log revenue allocations from game pass purchases
CREATE TABLE IF NOT EXISTS revenue_allocation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id TEXT NOT NULL UNIQUE, -- Unique identifier for the game pass purchase transaction
  total_revenue REAL NOT NULL,      -- Total $GLICO from this purchase
  daily_pool_contribution REAL NOT NULL,
  weekly_pool_contribution REAL NOT NULL,
  treasury_share REAL NOT NULL,
  allocated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table to log summary of each prize distribution attempt
CREATE TABLE IF NOT EXISTS distribution_summary_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  distribution_type TEXT NOT NULL CHECK(distribution_type IN ('daily', 'weekly')),
  period_identifier TEXT NOT NULL, -- e.g., '2023-10-26' or '2023-W43'
  total_prize_pool REAL NOT NULL,
  num_winners INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('PENDING', 'SUCCESS', 'FAILED', 'SKIPPED')), -- SKIPPED if no eligible winners or pool is empty
  reason TEXT,                     -- Reason for SKIPPED or FAILED status
  logged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME             -- Timestamp of last status update
);

-- Table to log individual prize payouts within a distribution
CREATE TABLE IF NOT EXISTS prize_distribution_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  distribution_summary_id INTEGER NOT NULL, -- Foreign key to distribution_summary_log
  user_id TEXT NOT NULL,                    -- Farcaster ID (FID) of the user
  wallet_address TEXT NOT NULL,             -- The wallet address that received the prize
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  prize_amount REAL NOT NULL,
  tx_hash TEXT,                             -- Transaction hash of the payout from Base network
  status TEXT NOT NULL CHECK(status IN ('PENDING', 'SUCCESS', 'FAILED', 'RETRYING')), -- Status of this specific payout
  error_message TEXT,                       -- If the payout failed
  distributed_at DATETIME,                  -- Timestamp of when the distribution was confirmed on-chain
  logged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (distribution_summary_id) REFERENCES distribution_summary_log(id)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_leaderboard_archives_period_type ON leaderboard_archives(period_identifier, board_type);
CREATE INDEX IF NOT EXISTS idx_leaderboard_archives_user_id ON leaderboard_archives(user_id);

CREATE INDEX IF NOT EXISTS idx_revenue_allocation_log_purchase_id ON revenue_allocation_log(purchase_id);

CREATE INDEX IF NOT EXISTS idx_distribution_summary_log_period_type ON distribution_summary_log(period_identifier, distribution_type);
CREATE INDEX IF NOT EXISTS idx_distribution_summary_log_status ON distribution_summary_log(status);

CREATE INDEX IF NOT EXISTS idx_prize_distribution_log_summary_id ON prize_distribution_log(distribution_summary_id);
CREATE INDEX IF NOT EXISTS idx_prize_distribution_log_user_id ON prize_distribution_log(user_id);
CREATE INDEX IF NOT EXISTS idx_prize_distribution_log_wallet_address ON prize_distribution_log(wallet_address);
CREATE INDEX IF NOT EXISTS idx_prize_distribution_log_status ON prize_distribution_log(status);
CREATE INDEX IF NOT EXISTS idx_prize_distribution_log_tx_hash ON prize_distribution_log(tx_hash);

-- Table to log individual score submissions for auditing and analysis
CREATE TABLE IF NOT EXISTS score_submission_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,           -- Farcaster ID (FID) of the user
  score INTEGER NOT NULL,
  game_id TEXT NOT NULL,
  game_session_data TEXT,          -- JSON string for game session details
  is_valid BOOLEAN DEFAULT TRUE,   -- Placeholder, can be updated by advanced validation
  validation_notes TEXT,           -- Placeholder for notes from validation
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for score_submission_log
CREATE INDEX IF NOT EXISTS idx_score_submission_log_user_id ON score_submission_log(user_id);
CREATE INDEX IF NOT EXISTS idx_score_submission_log_game_id ON score_submission_log(game_id);
CREATE INDEX IF NOT EXISTS idx_score_submission_log_submitted_at ON score_submission_log(submitted_at);
