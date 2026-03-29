import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
             name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast.error('Помилка завантаження товарів');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Ви впевнені, що хочете видалити цей товар? Цю дію неможливо скасувати.')) {
      return;
    }

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success('Товар видалено');
      fetchProducts();
    } catch (error) {
      toast.error('Помилка видалення');
      console.error(error);
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-cormorant font-bold text-stone-800 tracking-tight">Керування товарами</h1>
          <p className="text-stone-500 mt-2 font-medium">Керуйте своїм асортиментом, цінами та наявністю.</p>
        </div>
        <Link 
          to="/admin/products/new"
          className="bg-stone-900 !text-white hover:bg-stone-800 px-5 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-md shadow-stone-200 hover:shadow-lg hover:-translate-y-0.5 font-medium tracking-wide"
        >
          <Plus className="w-5 h-5" />
          <span>Додати товар</span>
        </Link>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-stone-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50 border-b border-stone-200/60">
                <th className="p-5 font-semibold text-stone-600 text-xs uppercase tracking-wider w-32">Фото</th>
                <th className="p-5 font-semibold text-stone-600 text-xs uppercase tracking-wider">Назва</th>
                <th className="p-5 font-semibold text-stone-600 text-xs uppercase tracking-wider">Категорія</th>
                <th className="p-5 font-semibold text-stone-600 text-xs uppercase tracking-wider">Ціна</th>
                <th className="p-5 font-semibold text-stone-600 text-xs uppercase tracking-wider text-center">Статус</th>
                <th className="p-5 font-semibold text-stone-600 text-xs uppercase tracking-wider text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-stone-400 animate-pulse font-medium">
                    Завантаження товарів...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-stone-500">
                    <Package className="w-12 h-12 mx-auto text-stone-300 mb-3" />
                    <p className="font-medium">У вас поки немає доданих товарів.</p>
                    <p className="text-sm mt-1">Створіть свій перший товар, натиснувши кнопку вище.</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-stone-50/80 transition-colors group">
                    <td className="p-5">
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-stone-100 flex items-center justify-center border border-stone-200/50 shadow-sm">
                        {product.image_url ? (
                          <img 
                            src={product.image_url.startsWith('http') ? product.image_url : `/images/${product.image_url}`} 
                            alt={product.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-stone-300" />
                        )}
                      </div>
                    </td>
                    <td className="p-5 font-medium text-stone-800">{product.name}</td>
                    <td className="p-5 text-stone-500">{product.categories?.name || '—'}</td>
                    <td className="p-5 font-semibold text-stone-800">{product.price} ₴</td>
                    <td className="p-5 text-center">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide ${
                        product.is_published 
                          ? 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/50' 
                          : 'bg-stone-100 text-stone-500 border border-stone-200/50'
                      }`}>
                        {product.is_published ? 'Опубліковано' : 'Приховано'}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Link 
                          to={`/admin/products/${product.id}`}
                          className="p-2.5 text-stone-500 hover:text-stone-900 hover:bg-white rounded-xl shadow-sm hover:shadow transition-all"
                          title="Редагувати"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-2.5 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Видалити"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
