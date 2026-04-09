import ProductFormClient from '../ProductFormClient';

export default async function EditProductPage({ params }) {
  const { id } = await params;
  return <ProductFormClient id={id} />;
}
