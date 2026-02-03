-- ============================================
-- Giftyzel Database Schema
-- Production-ready Supabase PostgreSQL Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone_number TEXT,
  address TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'vendor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VENDORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vendor_name TEXT UNIQUE NOT NULL,
  business_name TEXT,
  business_type TEXT,
  tax_id TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  logo_url TEXT,
  banner_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'rejected')),
  approved_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  category TEXT NOT NULL,
  image_url TEXT,
  images TEXT[], -- Array of image URLs
  stock INTEGER DEFAULT 0,
  available BOOLEAN DEFAULT true,
  rating DECIMAL(3, 2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SERVICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  category TEXT NOT NULL,
  image_url TEXT,
  images TEXT[], -- Array of image URLs
  location TEXT,
  -- price is per hour; customer chooses hours at order time
  available BOOLEAN DEFAULT true,
  rating DECIMAL(3, 2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- NULL for guest orders
  order_type TEXT NOT NULL DEFAULT 'self' CHECK (order_type IN ('self', 'gift')),
  
  -- Sender Information (required)
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  
  -- Receiver Information (for gift orders)
  receiver_name TEXT,
  receiver_email TEXT,
  receiver_phone TEXT,
  receiver_address TEXT,
  
  -- Shipping Information (for self orders)
  shipping_address TEXT,
  
  -- Order Details
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Payment Information
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_intent_id TEXT, -- Stripe payment intent ID
  payment_method TEXT,
  
  -- Order Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'dispatched', 'delivered', 'cancelled')),
  
  -- Gift Information
  gift_token TEXT UNIQUE, -- Token for gift receiver link
  gift_link TEXT, -- Full gift receiver URL
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('product', 'service')),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VENDOR ORDER ASSIGNMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.vendor_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'dispatched', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, vendor_id)
);

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (product_id IS NOT NULL AND service_id IS NULL) OR
    (product_id IS NULL AND service_id IS NOT NULL)
  )
);

-- ============================================
-- WISHLISTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Wishlist',
  type TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WISHLIST ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('product', 'service')),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wishlist_id, product_id, service_id),
  CHECK (
    (product_id IS NOT NULL AND service_id IS NULL) OR
    (product_id IS NULL AND service_id IS NOT NULL)
  )
);

-- ============================================
-- CART TABLE (for logged-in users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('product', 'service')),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id, service_id),
  CHECK (
    (product_id IS NOT NULL AND service_id IS NULL) OR
    (product_id IS NULL AND service_id IS NOT NULL)
  )
);

-- ============================================
-- STORAGE BUCKETS (for images)
-- ============================================
-- Note: These need to be created in Supabase Dashboard > Storage
-- Or via Supabase CLI/Migration

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_vendor_id ON public.stores(vendor_id);
CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores(status);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(available);
CREATE INDEX IF NOT EXISTS idx_services_store_id ON public.services(store_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_gift_token ON public.orders(gift_token);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_vendor_orders_vendor_id ON public.vendor_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_orders_order_id ON public.vendor_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON public.reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);

-- ============================================
-- TRIGGERS for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_orders_updated_at BEFORE UPDATE ON public.vendor_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wishlists_updated_at BEFORE UPDATE ON public.wishlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON public.carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check role from users table (with LIMIT to avoid full scan)
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Users: Can read own profile, admins can read all
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

-- Users: Can insert their own profile during signup
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Vendors: Can read own vendor profile
CREATE POLICY "Vendors can view own profile" ON public.vendors
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- Vendors: Can create their own vendor profile
CREATE POLICY "Vendors can insert own profile" ON public.vendors
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Vendors can update own profile" ON public.vendors
  FOR UPDATE USING (user_id = auth.uid());

-- Stores: Public can view approved stores, vendors can manage own stores
CREATE POLICY "Anyone can view approved stores" ON public.stores
  FOR SELECT USING (status = 'approved' OR vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "Vendors can create own stores" ON public.stores
  FOR INSERT WITH CHECK (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));

CREATE POLICY "Vendors can update own stores" ON public.stores
  FOR UPDATE USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));

-- Products: Public can view products from approved stores
CREATE POLICY "Anyone can view products from approved stores" ON public.products
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE status = 'approved') OR
    store_id IN (SELECT id FROM public.stores WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())) OR
    public.is_admin()
  );

CREATE POLICY "Vendors can manage products in own stores" ON public.products
  FOR ALL USING (
    store_id IN (SELECT id FROM public.stores WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()))
  );

-- Services: Same as products
CREATE POLICY "Anyone can view services from approved stores" ON public.services
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE status = 'approved') OR
    store_id IN (SELECT id FROM public.stores WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())) OR
    public.is_admin()
  );

CREATE POLICY "Vendors can manage services in own stores" ON public.services
  FOR ALL USING (
    store_id IN (SELECT id FROM public.stores WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()))
  );

-- Orders: Users can view own orders, vendors can view orders for their stores
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (
    user_id = auth.uid() OR
    id IN (SELECT order_id FROM public.vendor_orders WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())) OR
    public.is_admin()
  );

CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL); -- Allow guest orders

CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

-- Order Items: Same visibility as orders
CREATE POLICY "Users can view order items for own orders" ON public.order_items
  FOR SELECT USING (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid() OR id IN (SELECT order_id FROM public.vendor_orders WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()))) OR
    public.is_admin()
  );

-- Vendor Orders: Vendors can view their orders
CREATE POLICY "Vendors can view own vendor orders" ON public.vendor_orders
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()) OR
    public.is_admin()
  );

CREATE POLICY "Vendors can update own vendor orders" ON public.vendor_orders
  FOR UPDATE USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));

-- Reviews: Public can view, users can create/update own reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (user_id = auth.uid());

-- Wishlists: Users can manage own wishlists
CREATE POLICY "Users can manage own wishlists" ON public.wishlists
  FOR ALL USING (user_id = auth.uid() OR is_public = true);

-- Wishlist Items: Same as wishlists
CREATE POLICY "Users can manage own wishlist items" ON public.wishlist_items
  FOR ALL USING (
    wishlist_id IN (SELECT id FROM public.wishlists WHERE user_id = auth.uid() OR is_public = true)
  );

-- Carts: Users can manage own cart
CREATE POLICY "Users can manage own cart" ON public.carts
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_order_number TEXT;
BEGIN
  new_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_sequence')::TEXT, 6, '0');
  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_sequence START 1;

-- Function to update product/service rating after review
CREATE OR REPLACE FUNCTION update_item_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products
    SET rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM public.reviews
      WHERE product_id = NEW.product_id
    ),
    reviews_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE product_id = NEW.product_id
    )
    WHERE id = NEW.product_id;
  ELSIF NEW.service_id IS NOT NULL THEN
    UPDATE public.services
    SET rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM public.reviews
      WHERE service_id = NEW.service_id
    ),
    reviews_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE service_id = NEW.service_id
    )
    WHERE id = NEW.service_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_rating AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_item_rating();

-- ============================================
-- VIEWS for common queries
-- ============================================

-- View for vendor dashboard stats
CREATE OR REPLACE VIEW vendor_dashboard_stats AS
SELECT 
  v.id as vendor_id,
  v.vendor_name,
  COUNT(DISTINCT vo.order_id) as total_orders,
  COALESCE(SUM(o.total), 0) as total_revenue,
  COALESCE(SUM(CASE WHEN o.created_at >= DATE_TRUNC('month', NOW()) THEN o.total ELSE 0 END), 0) as monthly_revenue,
  COUNT(DISTINCT CASE WHEN vo.status = 'pending' THEN vo.id END) as pending_orders,
  COUNT(DISTINCT CASE WHEN vo.status = 'confirmed' THEN vo.id END) as confirmed_orders,
  COUNT(DISTINCT CASE WHEN vo.status = 'dispatched' THEN vo.id END) as dispatched_orders,
  COUNT(DISTINCT CASE WHEN vo.status = 'delivered' THEN vo.id END) as delivered_orders
FROM public.vendors v
LEFT JOIN public.vendor_orders vo ON vo.vendor_id = v.id
LEFT JOIN public.orders o ON o.id = vo.order_id AND o.payment_status = 'paid'
GROUP BY v.id, v.vendor_name;

-- View for top vendors
CREATE OR REPLACE VIEW top_vendors AS
SELECT 
  v.id,
  v.vendor_name,
  s.name as store_name,
  s.logo_url,
  COUNT(DISTINCT vo.order_id) as total_orders,
  COALESCE(SUM(o.total), 0) as total_revenue,
  AVG(r.rating) as avg_rating
FROM public.vendors v
JOIN public.stores s ON s.vendor_id = v.id AND s.status = 'approved'
LEFT JOIN public.vendor_orders vo ON vo.vendor_id = v.id
LEFT JOIN public.orders o ON o.id = vo.order_id AND o.payment_status = 'paid'
LEFT JOIN public.reviews r ON (r.product_id IN (SELECT id FROM public.products WHERE store_id = s.id) OR r.service_id IN (SELECT id FROM public.services WHERE store_id = s.id))
GROUP BY v.id, v.vendor_name, s.name, s.logo_url
ORDER BY total_revenue DESC, avg_rating DESC
LIMIT 10;

