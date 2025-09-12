import CategoryEditClient from '@/app/admin/categories/[id]/edit/CategoryEditClient'

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  const { id } = params
  return <CategoryEditClient categoryId={id} />
} 