'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Edit2, Trash2, Package, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });


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

  const sortedProducts = [...products].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handling nested category names for sorting if needed
    if (sortConfig.key === 'category') {
      aValue = a.categories?.name || '';
      bValue = b.categories?.name || '';
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredProducts = sortedProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="w-3 h-3 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-stone-900" />
      : <ChevronDown className="w-3.5 h-3.5 text-stone-900" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).replace('.', '');
  };


  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      <div className="flex flex-col gap-4 md:gap-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl md:text-4xl font-cormorant font-bold text-stone-800 tracking-tight whitespace-nowrap">Товари</h1>
          <Link
            href="/admin/products/new"
            className="bg-stone-900 !text-white hover:bg-stone-800 px-5 py-2.5 rounded-md flex items-center justify-center space-x-2 transition-all shadow-md shadow-stone-200 hover:shadow-lg font-medium tracking-wide w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Додати товар</span>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              placeholder="Пошук за назвою або артикулом..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-white rounded-md border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-400 transition-all text-sm font-medium"
            />
          </div>
          <p className="text-stone-500 font-medium text-sm hidden md:block">Керуйте своїм асортиментом, цінами та наявністю.</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-md shadow-sm border border-stone-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px] md:min-w-full">
            <thead>
              <tr className="bg-stone-50/50 border-b border-stone-200/60">
                <th className="p-3 md:p-5 font-semibold text-stone-600 text-[10px] uppercase tracking-wider w-20 md:w-32">Фото</th>
                <th
                  className="p-3 md:p-5 font-semibold text-stone-600 text-[10px] uppercase tracking-wider cursor-pointer hover:text-stone-900 transition-colors group"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    Назва <SortIcon column="name" />
                  </div>
                </th>
                <th
                  className="p-5 font-semibold text-stone-600 text-[10px] uppercase tracking-wider cursor-pointer hover:text-stone-900 transition-colors group hidden lg:table-cell"
                  onClick={() => requestSort('category')}
                >
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    Категорія <SortIcon column="category" />
                  </div>
                </th>
                <th
                  className="p-3 md:p-5 font-semibold text-stone-600 text-[10px] uppercase tracking-wider cursor-pointer hover:text-stone-900 transition-colors group"
                  onClick={() => requestSort('price')}
                >
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    Ціна <SortIcon column="price" />
                  </div>
                </th>
                <th
                  className="p-5 font-semibold text-stone-600 text-[10px] uppercase tracking-wider cursor-pointer hover:text-stone-900 transition-colors group hidden md:table-cell"
                  onClick={() => requestSort('created_at')}
                >
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    Дата <SortIcon column="created_at" />
                  </div>
                </th>
                <th className="p-3 md:p-5 font-semibold text-stone-600 text-[10px] uppercase tracking-wider text-center hidden sm:table-cell">Статус</th>
                <th className="p-3 md:p-5 font-semibold text-stone-600 text-[10px] uppercase tracking-wider text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-stone-400 animate-pulse font-medium">
                    Завантаження товарів...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-stone-500">
                    <Package className="w-12 h-12 mx-auto text-stone-300 mb-3" />
                    <p className="font-medium">Товарів не знайдено.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-stone-50/80 transition-colors group">
                    <td className="p-3 md:p-5">
                      <div className="w-12 h-12 md:w-24 md:h-24 rounded-md overflow-hidden bg-stone-100 flex items-center justify-center border border-stone-200/50 shadow-sm">
                        {product.image_url ? (
                          <img
                            src={product.image_url?.startsWith('http') ? product.image_url : `/images/${product.image_url}`}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <Package className="w-6 h-6 md:w-8 md:h-8 text-stone-300" />
                        )}
                      </div>
                    </td>
                    <td className={`p-3 md:p-5 ${sortConfig.key === 'name' ? 'bg-stone-50/40' : ''}`}>
                      <div className="font-medium text-stone-800 text-sm md:text-base line-clamp-2 md:line-clamp-none">{product.name}</div>
                      {product.sku && <div className="text-[10px] text-stone-400 mt-1 uppercase tracking-tight">Арт: {product.sku}</div>}
                      <div className="lg:hidden text-[10px] text-stone-500 mt-1">
                        {product.categories?.name || (product.category_id === 'fullset' ? 'Готові рішення' : '—')}
                      </div>
                    </td>
                    <td className={`p-5 text-stone-500 hidden lg:table-cell ${sortConfig.key === 'category' ? 'bg-stone-50/40' : ''}`}>
                      {product.categories?.name || (product.category_id === 'fullset' ? 'Готові рішення' : '—')}
                    </td>
                    <td className={`p-3 md:p-5 font-semibold text-stone-800 text-sm md:text-base ${sortConfig.key === 'price' ? 'bg-stone-50/40' : ''}`}>
                      {product.price} ₴
                    </td>
                    <td className={`p-5 text-stone-400 text-xs whitespace-nowrap hidden md:table-cell ${sortConfig.key === 'created_at' ? 'bg-stone-50/40' : ''}`}>
                      {formatDate(product.created_at)}
                    </td>
                    <td className="p-3 md:p-5 text-center hidden sm:table-cell">
                      <span className={`px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-semibold tracking-wide ${product.is_published
                          ? 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/50'
                          : 'bg-stone-100 text-stone-500 border border-stone-200/50'
                        }`}>
                        {product.is_published ? 'OK' : 'OFF'}
                      </span>
                    </td>
                    <td className="p-3 md:p-5 text-right">
                      <div className="flex items-center justify-end gap-[10px]">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="p-2.5 text-stone-500 hover:text-stone-900 hover:bg-white rounded-md shadow-sm hover:shadow transition-all"
                        >
                          <Edit2 className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2.5 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all hidden sm:block"
                        >
                          <Trash2 className="w-5 h-5" />
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
