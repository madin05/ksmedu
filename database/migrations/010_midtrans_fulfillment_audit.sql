

SET NAMES utf8mb4;

ALTER TABLE token_purchase_requests 
  ADD COLUMN IF NOT EXISTS midtrans_transaction_id VARCHAR(100) NULL AFTER snap_token,
  ADD COLUMN IF NOT EXISTS mdr_fee DECIMAL(12,2) NULL DEFAULT 0.00 AFTER price_rupiah,
  ADD COLUMN IF NOT EXISTS net_amount DECIMAL(12,2) NULL DEFAULT 0.00 AFTER mdr_fee,
  ADD COLUMN IF NOT EXISTS settled_at DATETIME NULL AFTER approved_at;

ALTER TABLE token_purchase_requests MODIFY COLUMN status ENUM('awaiting_proof','pending','approved','rejected','cancelled','expired') NOT NULL DEFAULT 'pending';
