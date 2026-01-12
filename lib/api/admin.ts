import { supabase } from '../supabase/client'

// Get pending stores
export async function getPendingStores() {
  const { data, error } = await supabase
    .from('stores')
    .select('*, vendors(*, users(*))')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Approve store
export async function approveStore(storeId: string, adminUserId: string) {
  const { data, error } = await supabase
    .from('stores')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: adminUserId,
    })
    .eq('id', storeId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Reject store
export async function rejectStore(storeId: string, adminUserId: string) {
  const { data, error } = await supabase
    .from('stores')
    .update({
      status: 'rejected',
      approved_by: adminUserId,
    })
    .eq('id', storeId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Suspend store
export async function suspendStore(storeId: string, adminUserId: string) {
  const { data, error } = await supabase
    .from('stores')
    .update({
      status: 'suspended',
      suspended_at: new Date().toISOString(),
      approved_by: adminUserId,
    })
    .eq('id', storeId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get all stores
export async function getAllStores() {
  const { data, error } = await supabase
    .from('stores')
    .select('*, vendors(*, users(*))')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get all orders
export async function getAllOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), users(*)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get dashboard stats
export async function getAdminDashboardStats() {
  const { data: stores } = await supabase
    .from('stores')
    .select('status')

  const { data: orders } = await supabase
    .from('orders')
    .select('total, payment_status, created_at')

  const { data: users } = await supabase
    .from('users')
    .select('role, created_at')

  const stats = {
    totalStores: stores?.length || 0,
    pendingStores: stores?.filter(s => s.status === 'pending').length || 0,
    approvedStores: stores?.filter(s => s.status === 'approved').length || 0,
    totalOrders: orders?.length || 0,
    totalRevenue: orders?.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + parseFloat(o.total), 0) || 0,
    totalUsers: users?.length || 0,
    totalVendors: users?.filter(u => u.role === 'vendor').length || 0,
  }

  return stats
}

