import AdminStoreDetail from "@/components/admin/AdminStoreDetail"

export default async function AdminStoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AdminStoreDetail storeId={id} />
}

