-- Add review moderation status
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_by UUID;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_product_status ON reviews(product_id, status);

-- Create user addresses table
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create partial unique index for default addresses
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_default_address ON user_addresses(user_id) WHERE is_default = true;

-- Enable RLS
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

-- RLS policies for addresses
CREATE POLICY "Users can view their own addresses"
  ON user_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses"
  ON user_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses"
  ON user_addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses"
  ON user_addresses FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view and moderate all reviews
CREATE POLICY "Admins can moderate reviews"
  ON reviews FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Update the public reviews policy to only show approved reviews
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON reviews;
CREATE POLICY "Anyone can view approved reviews"
  ON reviews FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_user_addresses_updated_at
  BEFORE UPDATE ON user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();