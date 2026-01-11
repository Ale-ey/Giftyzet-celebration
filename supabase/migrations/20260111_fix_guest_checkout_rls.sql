-- Fix RLS policies to allow guest checkout (orders without login)
-- This allows both logged-in users and anonymous users to create orders

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow anonymous order creation" ON public.orders;
DROP POLICY IF EXISTS "Allow order reading by gift token" ON public.orders;

DROP POLICY IF EXISTS "Users can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow anonymous order items creation" ON public.order_items;

DROP POLICY IF EXISTS "Vendors can view their orders" ON public.vendor_orders;
DROP POLICY IF EXISTS "Vendors can update their orders" ON public.vendor_orders;
DROP POLICY IF EXISTS "Allow vendor order creation" ON public.vendor_orders;

-- Enable RLS on tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_orders ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ORDERS TABLE POLICIES
-- =============================================

-- Policy 1: Allow anyone (including anonymous users) to INSERT orders
-- This enables guest checkout
CREATE POLICY "Allow anyone to create orders"
ON public.orders
FOR INSERT
TO public
WITH CHECK (true);

-- Policy 2: Allow users to view their own orders
-- Users can see orders where they are the user_id
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Policy 3: Allow anyone to view orders by gift token
-- This allows gift receivers to view gift orders without login
CREATE POLICY "Anyone can view orders by gift token"
ON public.orders
FOR SELECT
TO public
USING (
  gift_token IS NOT NULL
);

-- Policy 4: Allow anyone to update orders by gift token
-- This allows gift receivers to confirm address without login
CREATE POLICY "Anyone can update orders by gift token"
ON public.orders
FOR UPDATE
TO public
USING (
  gift_token IS NOT NULL
)
WITH CHECK (
  gift_token IS NOT NULL
);

-- Policy 5: Allow users to update their own orders
CREATE POLICY "Users can update their own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

-- Policy 6: Allow admins to view all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy 7: Allow vendors to view orders containing their products/services
CREATE POLICY "Vendors can view orders with their items"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vendor_orders
    WHERE vendor_orders.order_id = orders.id
    AND vendor_orders.vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  )
);

-- =============================================
-- ORDER_ITEMS TABLE POLICIES
-- =============================================

-- Policy 1: Allow anyone to INSERT order items
-- This enables guest checkout
CREATE POLICY "Allow anyone to create order items"
ON public.order_items
FOR INSERT
TO public
WITH CHECK (true);

-- Policy 2: Allow anyone to view order items for orders they can view
-- This works with the orders policies above
CREATE POLICY "Anyone can view order items for accessible orders"
ON public.order_items
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (
      -- Order has gift token (gift orders)
      orders.gift_token IS NOT NULL
      -- Or user owns the order (logged in)
      OR (auth.uid() IS NOT NULL AND orders.user_id = auth.uid())
      -- Or user is admin
      OR EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
      )
      -- Or user is vendor with items in order
      OR EXISTS (
        SELECT 1 FROM public.vendor_orders
        WHERE vendor_orders.order_id = orders.id
        AND vendor_orders.vendor_id IN (
          SELECT id FROM public.vendors WHERE user_id = auth.uid()
        )
      )
    )
  )
);

-- =============================================
-- VENDOR_ORDERS TABLE POLICIES
-- =============================================

-- Policy 1: Allow anyone to create vendor orders
-- This is needed during order creation
CREATE POLICY "Allow anyone to create vendor orders"
ON public.vendor_orders
FOR INSERT
TO public
WITH CHECK (true);

-- Policy 2: Vendors can view their own orders
CREATE POLICY "Vendors can view their orders"
ON public.vendor_orders
FOR SELECT
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM public.vendors WHERE user_id = auth.uid()
  )
);

-- Policy 3: Vendors can update their own orders
CREATE POLICY "Vendors can update their orders"
ON public.vendor_orders
FOR UPDATE
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM public.vendors WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  vendor_id IN (
    SELECT id FROM public.vendors WHERE user_id = auth.uid()
  )
);

-- Policy 4: Admins can view all vendor orders
CREATE POLICY "Admins can view all vendor orders"
ON public.vendor_orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy 5: Admins can update all vendor orders
CREATE POLICY "Admins can update all vendor orders"
ON public.vendor_orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- =============================================
-- ADDITIONAL POLICIES FOR READING PRODUCTS/SERVICES
-- =============================================

-- Ensure anonymous users can read products and services
-- (needed for order creation)

DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view available products"
ON public.products
FOR SELECT
TO public
USING (available = true);

DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
CREATE POLICY "Anyone can view available services"
ON public.services
FOR SELECT
TO public
USING (available = true);

DROP POLICY IF EXISTS "Anyone can view stores" ON public.stores;
CREATE POLICY "Anyone can view approved stores"
ON public.stores
FOR SELECT
TO public
USING (status = 'approved');

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON POLICY "Allow anyone to create orders" ON public.orders IS 
'Allows guest checkout - anyone can create orders without authentication';

COMMENT ON POLICY "Anyone can view orders by gift token" ON public.orders IS 
'Allows gift receivers to view gift orders using the gift link without logging in';

COMMENT ON POLICY "Anyone can update orders by gift token" ON public.orders IS 
'Allows gift receivers to confirm their address without logging in';
