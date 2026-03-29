import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Upload, Save, Loader2, Star, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ProductForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category_id: '',
    is_new: false,
    is_published: true,
    image_url: '',
    stock: 0,
    sizes: []
  });
  
  const [sizeInput, setSizeInput] = useState('');
  const [sizeQuantity, setSizeQuantity] = useState('0');

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  }

  async function fetchProduct() {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) throw error;
      
      setFormData({
        name: data.name || '',
        price: data.price || '',
        description: data.description || '',
        category_id: data.category_id || '',
        is_new: data.is_new || false,
        is_published: data.is_published ?? true,
        image_url: data.image_url || '',
        stock: data.stock || 0,
        sizes: data.sizes || []
      });
      
      const fetchedImages = [];
      if (data.image_url) {
        fetchedImages.push({
          id: 'main_existing',
          url: data.image_url.startsWith('http') ? data.image_url : `/images/${data.image_url}`,
          rawUrl: data.image_url,
          isMain: true
        });
      }
      if (data.gallery && Array.isArray(data.gallery)) {
        data.gallery.forEach((rawUrl, index) => {
          fetchedImages.push({
            id: `gallery_${index}`,
            url: rawUrl.startsWith('http') ? rawUrl : `/images/${rawUrl}`,
            rawUrl: rawUrl,
            isMain: false
          });
        });
      }
      setImages(fetchedImages);
    } catch (error) {
      toast.error('Не вдалося завантажити товар');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImages = files.map(file => ({
        id: Math.random().toString(36).substring(7),
        file,
        url: URL.createObjectURL(file),
        isMain: false
      }));
      
      setImages(prev => {
        const combined = [...prev, ...newImages];
        if (combined.length > 0 && !combined.some(img => img.isMain)) {
          combined[0].isMain = true;
        }
        return combined;
      });
    }
  };

  const handleSetMainImage = (id) => {
    setImages(prev => prev.map(img => ({
      ...img,
      isMain: img.id === id
    })));
  };

  const handleRemoveImage = (id) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (filtered.length > 0 && !filtered.some(img => img.isMain)) {
        filtered[0].isMain = true;
      }
      return filtered;
    });
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (images.some(img => img.file)) {
        toast.loading('Завантаження фото...', { id: 'upload' });
      }

      const processedImages = [];
      for (const img of images) {
        if (img.file) {
          const uploadedUrl = await uploadImage(img.file);
          processedImages.push({ ...img, finalUrl: uploadedUrl });
        } else {
          processedImages.push({ ...img, finalUrl: img.rawUrl }); // existing image URL
        }
      }
      toast.dismiss('upload');
      
      const mainImage = processedImages.find(img => img.isMain);
      const galleryImages = processedImages.filter(img => !img.isMain).map(img => img.finalUrl);

      const productPayload = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        image_url: mainImage ? mainImage.finalUrl : '',
        gallery: galleryImages,
      };

      if (!isEditing) {
        // ID is auto-generated usually, but your schema requires explicit ID
        // Let's generate a simple slug-like ID
        productPayload.id = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
      }

      const { error } = isEditing
        ? await supabase.from('products').update(productPayload).eq('id', id)
        : await supabase.from('products').insert([productPayload]);

      if (error) throw error;

      toast.success(isEditing ? 'Товар оновлено' : 'Товар створено');
      navigate('/admin/products');
      
    } catch (error) {
      toast.error('Помилка збереження: ' + error.message);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center animate-pulse">Завантаження...</div>;
  }

  const handleAddSize = (e) => {
    e.preventDefault();
    if (!sizeInput.trim()) return;
    if (formData.sizes.some(s => s.name === sizeInput.trim())) return;
    
    setFormData({
      ...formData,
      sizes: [...formData.sizes, { name: sizeInput.trim(), quantity: parseInt(sizeQuantity) || 0 }]
    });
    setSizeInput('');
    setSizeQuantity('0');
  };

  const handleRemoveSize = (sizeToRemove) => {
    setFormData({
      ...formData,
      sizes: formData.sizes.filter(s => s.name !== sizeToRemove)
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center space-x-6">
        <Link to="/admin/products" className="p-3 !text-stone-400 hover:!text-stone-900 hover:bg-white rounded-2xl transition-all shadow-sm border border-stone-200/50">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-4xl font-cormorant font-bold text-stone-800 tracking-tight">
            {isEditing ? 'Редагування товару' : 'Новий товар'}
          </h1>
          <p className="text-stone-500 mt-2 font-medium">
            {isEditing ? 'Оновіть інформацію, ціну або фото товару.' : 'Заповніть деталі для створення нового товару в каталозі.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm p-10 rounded-2xl shadow-sm border border-stone-200/60 space-y-10">
        
        {/* Basic Info */}
        <div className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2">Назва товару <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-5 py-3.5 bg-stone-50/50 rounded-xl border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 focus:border-stone-400 focus:bg-white transition-all text-stone-800 font-medium"
              placeholder="Напр., В'язаний кардиган"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2">Ціна (₴) <span className="text-red-400">*</span></label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-5 py-3.5 bg-stone-50/50 rounded-xl border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 focus:border-stone-400 focus:bg-white transition-all text-stone-800 font-medium"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2">Категорія <span className="text-red-400">*</span></label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                className="w-full px-5 py-3.5 bg-stone-50/50 rounded-xl border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 focus:border-stone-400 focus:bg-white transition-all text-stone-800 font-medium appearance-none"
              >
                <option value="">Оберіть категорію...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2">Кількість на складі (якщо немає розмірів)</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
                className="w-full px-5 py-3.5 bg-stone-50/50 rounded-xl border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 focus:border-stone-400 focus:bg-white transition-all text-stone-800 font-medium"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2">Опис</label>
            <textarea
              rows="5"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-5 py-3.5 bg-stone-50/50 rounded-xl border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 focus:border-stone-400 focus:bg-white transition-all text-stone-800 resize-none custom-scrollbar"
              placeholder="Детальний опис товару..."
            />
          </div>
        </div>

        <hr className="border-stone-100" />

        {/* Sizes */}
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-4">Розміри (опціонально)</label>
          <div className="flex flex-col space-y-4 p-6 bg-stone-50/50 rounded-xl border border-stone-100">
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <input
                type="text"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSize(e);
                }}
                className="flex-1 w-full sm:max-w-[200px] px-4 py-2 bg-white rounded-lg border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 transition-all font-medium text-stone-800"
                placeholder="Розмір (напр., 62)"
              />
              <input
                type="number"
                min="0"
                value={sizeQuantity}
                onChange={(e) => setSizeQuantity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSize(e);
                }}
                className="w-full sm:w-24 px-4 py-2 bg-white rounded-lg border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 transition-all font-medium text-stone-800 text-center"
                placeholder="К-ть"
              />
              <button
                type="button"
                onClick={handleAddSize}
                className="w-full sm:w-auto bg-stone-200 hover:bg-stone-300 text-stone-800 px-4 py-2 rounded-lg font-semibold tracking-wide transition-all shadow-sm whitespace-nowrap"
              >
                Додати +
              </button>
            </div>
            {formData.sizes.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {formData.sizes.map(size => (
                  <div key={size.name} className="flex items-center bg-white border border-stone-200 pl-3 pr-1 py-1 rounded-full text-sm font-semibold text-stone-700 shadow-sm">
                    {size.name} <span className="ml-1.5 px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded text-xs">{size.quantity} шт</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(size.name)}
                      className="ml-2 w-6 h-6 rounded-full bg-stone-100 hover:bg-red-100 text-stone-400 hover:text-red-500 flex items-center justify-center transition-colors"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-stone-500">Якщо ви додасте хоча б один розмір, на сторінці товару з'явиться вибір розміру для клієнта.</p>
          </div>
        </div>

        <hr className="border-stone-100" />

        {/* Toggles */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-8 p-6 bg-stone-50/50 rounded-xl border border-stone-100">
          <label className="flex items-center space-x-3 cursor-pointer group">
            <div className="relative flex items-center justify-center w-6 h-6">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                className="w-5 h-5 rounded border-stone-300 text-stone-800 focus:ring-stone-800 transition-all peer"
              />
            </div>
            <span className="font-medium text-stone-700 group-hover:text-stone-900 transition-colors">Опубліковано на сайті</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer group">
            <div className="relative flex items-center justify-center w-6 h-6">
              <input
                type="checkbox"
                checked={formData.is_new}
                onChange={(e) => setFormData({...formData, is_new: e.target.checked})}
                className="w-5 h-5 rounded border-stone-300 text-stone-800 focus:ring-stone-800 transition-all peer"
              />
            </div>
            <span className="font-medium text-stone-700 group-hover:text-stone-900 transition-colors">Помітка "Новинка"</span>
          </label>
        </div>

        <hr className="border-stone-100" />

        {/* Image Upload Gallery */}
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-4">Фотографії товару (Галерея)</label>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
            {images.map((img) => (
              <div key={img.id} className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${img.isMain ? 'border-amber-400 shadow-md ring-4 ring-amber-100' : 'border-stone-200 hover:border-stone-400'}`}>
                <img src={img.url} alt="Preview" className="w-full h-full object-cover" />
                
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-900/80 to-transparent p-2 pt-8 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleSetMainImage(img.id)}
                    className={`p-1.5 rounded-full backdrop-blur-md transition-colors ${img.isMain ? 'bg-amber-400 text-white' : 'bg-white/20 text-white hover:bg-amber-400'}`}
                    title={img.isMain ? "Це головне фото" : "Зробити головним"}
                  >
                    <Star className={`w-4 h-4 ${img.isMain ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    className="p-1.5 rounded-full bg-white/20 hover:bg-red-500 text-white backdrop-blur-md transition-colors"
                    title="Видалити"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {img.isMain && (
                  <div className="absolute top-2 left-2 bg-amber-400 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow-sm">
                    Головне
                  </div>
                )}
              </div>
            ))}
            
            {/* Add New Image Tile - Allows Multiple */}
            <div className="relative aspect-square rounded-xl border-2 border-dashed border-stone-300 flex items-center justify-center bg-stone-50/80 hover:bg-stone-100 hover:border-stone-400 transition-colors cursor-pointer group">
              <div className="text-center text-stone-400 group-hover:text-stone-600 transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-2 opacity-50 group-hover:opacity-80" />
                <span className="text-sm font-medium">Додати фото</span>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                multiple
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-stone-800">Підказки</h4>
            <p className="text-sm text-stone-500 leading-relaxed">
              Завантажуйте кілька фотографій одночасно. Зробіть одне з фото <strong>Головним</strong> натиснувши на кнопку з зірочкою.<br/>
              Рекомендований розмір: 1000x1000px (пропорції 1:1).
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-8 mb-10 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-4 rounded-xl font-bold tracking-wide transition-all shadow-md hover:-translate-y-1 flex items-center text-lg shadow-black/30"
            style={{ backgroundColor: '#1c1917', color: '#ffffff' }}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin" style={{ color: '#ffffff' }} />
            ) : (
              <Save className="w-6 h-6 mr-3" style={{ color: '#ffffff' }} />
            )}
            <span style={{ color: '#ffffff' }}>{saving ? 'Збереження...' : 'Зберегти товар'}</span>
          </button>
        </div>
        
      </form>
    </div>
  );
}
