-- ============================================
-- Landing Page Schema Updates
-- This migration ensures the schema supports the landing page APIs
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Update Products Table
-- ============================================

-- Add vendor_account_id column if it doesn't exist (for new schema)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'vendor_account_id'
  ) THEN
    -- Add vendor_account_id column
    ALTER TABLE public.products 
    ADD COLUMN vendor_account_id UUID REFERENCES public.vendor_accounts(id);
    
    -- Create index for performance
    CREATE INDEX IF NOT EXISTS idx_products_vendor_account_id 
    ON public.products(vendor_account_id);
  END IF;
END $$;

-- Ensure price is numeric (in case it's stored as text)
ALTER TABLE public.products 
ALTER COLUMN price TYPE NUMERIC(10, 2) USING price::NUMERIC(10, 2);

-- Ensure rating is numeric
ALTER TABLE public.products 
ALTER COLUMN rating TYPE NUMERIC(3, 2) USING COALESCE(rating::NUMERIC(3, 2), 0);

-- ============================================
-- Update Services Table
-- ============================================

-- Add vendor_account_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'vendor_account_id'
  ) THEN
    -- Add vendor_account_id column
    ALTER TABLE public.services 
    ADD COLUMN vendor_account_id UUID REFERENCES public.vendor_accounts(id);
    
    -- Create index for performance
    CREATE INDEX IF NOT EXISTS idx_services_vendor_account_id 
    ON public.services(vendor_account_id);
  END IF;
END $$;

-- Add price_per_hour if it doesn't exist (services might use price or price_per_hour)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'price_per_hour'
  ) THEN
    ALTER TABLE public.services 
    ADD COLUMN price_per_hour NUMERIC(10, 2);
    
    -- Migrate existing price to price_per_hour if price exists
    UPDATE public.services 
    SET price_per_hour = price 
    WHERE price_per_hour IS NULL AND price IS NOT NULL;
  END IF;
END $$;

-- Add duration_hours if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'duration_hours'
  ) THEN
    ALTER TABLE public.services 
    ADD COLUMN duration_hours INTEGER DEFAULT 1;
  END IF;
END $$;

-- Ensure rating is numeric
ALTER TABLE public.services 
ALTER COLUMN rating TYPE NUMERIC(3, 2) USING COALESCE(rating::NUMERIC(3, 2), 0);

-- ============================================
-- Ensure Vendor Accounts Table Exists
-- ============================================

CREATE TABLE IF NOT EXISTS public.vendor_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stripe_account_id TEXT UNIQUE,
  account_status TEXT NOT NULL DEFAULT 'pending' CHECK (account_status IN ('pending', 'approved', 'active', 'suspended', 'rejected')),
  details_submitted BOOLEAN DEFAULT false,
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  requirements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  vendor_application_id UUID,
  contact_email TEXT,
  contact_phone TEXT,
  business_name TEXT,
  CONSTRAINT vendor_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Create indexes for vendor_accounts
CREATE INDEX IF NOT EXISTS idx_vendor_accounts_user_id ON public.vendor_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_accounts_status ON public.vendor_accounts(account_status);

-- ============================================
-- Add Tags Column to Products (if needed)
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'tags'
  ) THEN
    ALTER TABLE public.products 
    ADD COLUMN tags TEXT[];
  END IF;
END $$;

-- ============================================
-- Add Vendor URL to Products (if needed)
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'vendor_url'
  ) THEN
    ALTER TABLE public.products 
    ADD COLUMN vendor_url TEXT;
  END IF;
END $$;

-- ============================================
-- Update Services Table - Provider Fields
-- ============================================

-- Add provider fields if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE public.services 
    ADD COLUMN provider_id UUID;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'provider_name'
  ) THEN
    ALTER TABLE public.services 
    ADD COLUMN provider_name TEXT NOT NULL DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'provider_email'
  ) THEN
    ALTER TABLE public.services 
    ADD COLUMN provider_email TEXT NOT NULL DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'provider_phone'
  ) THEN
    ALTER TABLE public.services 
    ADD COLUMN provider_phone TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'reviews_count'
  ) THEN
    ALTER TABLE public.services 
    ADD COLUMN reviews_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- Create Function to Update Updated At
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_products_updated_at'
  ) THEN
    CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_services_updated_at'
  ) THEN
    CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_vendor_accounts_updated_at'
  ) THEN
    CREATE TRIGGER update_vendor_accounts_updated_at
    BEFORE UPDATE ON public.vendor_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- Performance Indexes for Landing Page Queries
-- ============================================

-- Index for trending products (rating + created_at)
CREATE INDEX IF NOT EXISTS idx_products_trending 
ON public.products(rating DESC NULLS LAST, created_at DESC) 
WHERE available = true;

-- Index for services by category and rating
CREATE INDEX IF NOT EXISTS idx_services_category_rating 
ON public.services(category, rating DESC NULLS LAST) 
WHERE available = true;

-- Index for products by category
CREATE INDEX IF NOT EXISTS idx_products_category_available 
ON public.products(category, available) 
WHERE available = true;

-- ============================================
-- Comments
-- ============================================

COMMENT ON COLUMN public.products.vendor_account_id IS 'Reference to vendor_accounts table (new schema)';
COMMENT ON COLUMN public.services.vendor_account_id IS 'Reference to vendor_accounts table (new schema)';
COMMENT ON COLUMN public.services.price_per_hour IS 'Price per hour for service booking';
COMMENT ON COLUMN public.services.duration_hours IS 'Default duration in hours for the service';
