ALTER TABLE properties 
  ADD COLUMN IF NOT EXISTS speciality TEXT,
  ADD COLUMN IF NOT EXISTS deposit_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS deposit_months INTEGER,
  ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS rental_amount DECIMAL(12,2);

CREATE TABLE IF NOT EXISTS property_documents (
  id           VARCHAR(36) NOT NULL DEFAULT gen_random_uuid()::text,
  property_id  VARCHAR(36) NOT NULL,
  title        VARCHAR(255) NOT NULL,
  document_url TEXT NOT NULL,
  file_type    VARCHAR(20) NOT NULL,
  file_size    BIGINT,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT property_documents_pkey PRIMARY KEY (id),
  CONSTRAINT property_documents_property_id_fkey 
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_property_documents_property_id 
  ON property_documents(property_id);
