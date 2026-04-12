'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Upload, Save, Loader2, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProductFormClient({ id }) {
  const isEditing = Boolean(id);
  const router = useRouter();

  const SIZE_OPTIONS = ['56', '56-62', '62', '62-68', '74', '80', '86', '92'];

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState([]);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    price: '',
    description: '',
    category_id: '',
    is_new: false,
    is_published: true,
    image_url: '',
    stock: 0,
    sizes: [],
    meta_keywords: '',
    meta_description: '',
    measurements: '',
    gender: '',
    age: [],
    material: [],
    color: [],
    features: []
  });
  
  const [sizeInput, setSizeInput] = useState('');
  const [sizeQuantity, setSizeQuantity] = useState('1'); // Default to 1 instead of 0

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  // Auto-calculate total stock from sizes
  useEffect(() => {
    if (formData.sizes && formData.sizes.length > 0) {
      const totalStock = formData.sizes.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0);
      if (totalStock !== formData.stock) {
        setFormData(prev => ({ ...prev, stock: totalStock }));
      }
    }
  }, [formData.sizes]);

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) {
      const hasFullset = data.some(cat => cat.id === 'fullset' || cat.name === 'Готові рішення');
      if (!hasFullset) {
        setCategories([...data, { id: 'fullset', name: 'Готові рішення' }]);
      } else {
        setCategories(data);
      }
    }
  }

  async function fetchProduct() {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) throw error;
      
      setFormData({
        sku: data.sku || '',
        name: data.name || '',
        price: data.price || '',
        description: data.description || '',
        category_id: data.category_id || '',
        is_new: data.is_new || false,
        is_published: data.is_published ?? true,
        image_url: data.image_url || '',
        stock: data.stock || 0,
        sizes: data.sizes || [],
        meta_keywords: data.meta_keywords || '',
        meta_description: data.meta_description || '',
        measurements: data.measurements || '',
        gender: data.gender || '',
        age: data.age || [],
        material: data.material || [],
        color: data.color || [],
        features: data.features || []
      });
      
      const fetchedImages = [];
      if (data.image_url) {
        fetchedImages.push({
          id: 'main_existing',
          url: data.image_url?.startsWith('http') ? data.image_url : `/images/${data.image_url}`,
          rawUrl: data.image_url,
          isMain: true
        });
      }
      
      let parsedGallery = [];
      if (Array.isArray(data.gallery)) {
        parsedGallery = data.gallery;
      } else if (typeof data.gallery === 'string') {
        try {
          if (data.gallery.startsWith('[')) {
            parsedGallery = JSON.parse(data.gallery);
          } else {
            parsedGallery = data.gallery.replace(/^{|}$/g, '').split(',').map(s => s.trim().replace(/^"|"$/g, ''));
          }
        } catch(e) { console.error(e) }
      }

      if (parsedGallery.length > 0) {
        parsedGallery.filter(Boolean).forEach((rawUrl, index) => {
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
      router.push('/admin/products');
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
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      if (!data?.publicUrl) throw new Error('Не вдалося отримати URL завантаженого фото');
      
      return data.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const translite = (text) => {
    const map = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
      'з': 'z', 'и': 'y', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
      'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
      'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
      'і': 'i', 'ї': 'yi', 'є': 'ye'
    };
    return text.toLowerCase().split('').map(char => map[char] || char).join('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (images.length === 0) {
      if (!confirm('Ви не додали жодного фото. Продовжити?')) {
        return;
      }
    }

    setSaving(true);
    
    try {
      if (images.some(img => img.file)) {
        toast.loading('Завантаження фото...', { id: 'upload' });
      }

      const processedImages = [];
      for (const img of images) {
        try {
          if (img.file) {
            const uploadedUrl = await uploadImage(img.file);
            processedImages.push({ ...img, finalUrl: uploadedUrl, file: null });
          } else {
            processedImages.push({ ...img, finalUrl: img.rawUrl }); 
          }
        } catch (err) {
          toast.error(`Помилка завантаження одного з фото: ${err.message}`);
          throw err;
        }
      }
      toast.dismiss('upload');
      
      let mainImage = processedImages.find(img => img.isMain);
      if (!mainImage && processedImages.length > 0) {
        mainImage = processedImages[0];
      }
      
      const galleryImages = processedImages
        .filter(img => img !== mainImage)
        .map(img => img.finalUrl)
        .filter(Boolean);

      const productPayload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        stock: (formData.sizes && formData.sizes.length > 0) 
          ? formData.sizes.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0)
          : (parseInt(formData.stock) || 0),
        image_url: mainImage ? mainImage.finalUrl : '',
        gallery: galleryImages,
        meta_keywords: formData.meta_keywords,
        meta_description: formData.meta_description,
        measurements: formData.measurements,
        gender: formData.gender,
        age: formData.age,
        material: formData.material,
        color: formData.color,
        features: formData.features
      };

      if (!isEditing) {
        const nameToTranslit = (formData.name || '').substring(0, 5);
        const namePart = translite(nameToTranslit)
          .replace(/[^a-z0-9]/g, '');
        
        const skuPart = formData.sku ? String(formData.sku).toLowerCase().replace(/[^a-z0-9]/g, '-') : '555';
        let generatedId = `${namePart}-art-${skuPart}-${Date.now()}`;
        
        productPayload.id = generatedId.replace(/-+/g, '-').replace(/^-|-$/g, '');
      }

      const { error } = isEditing
        ? await supabase.from('products').update(productPayload).eq('id', id)
        : await supabase.from('products').insert([productPayload]);

      if (error) throw error;

      toast.success(isEditing ? 'Товар оновлено' : 'Товар створено');
      router.push('/admin/products');
      
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
    
    const updatedSizes = [...formData.sizes, { name: sizeInput.trim(), quantity: parseInt(sizeQuantity) || 0 }];
    setFormData({
      ...formData,
      sizes: updatedSizes,
      stock: updatedSizes.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0)
    });
    setSizeInput('');
    setSizeQuantity('1');
  };

  const handleUpdateSizeQuantity = (sizeName, newQty) => {
    const updatedSizes = formData.sizes.map(s => 
      s.name === sizeName ? { ...s, quantity: parseInt(newQty) || 0 } : s
    );
    setFormData({
      ...formData,
      sizes: updatedSizes,
      stock: updatedSizes.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0)
    });
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
        <Link href="/admin/products" className="p-3 !text-stone-400 hover:!text-stone-900 hover:bg-white rounded-md transition-all shadow-sm border border-stone-200/50">
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

      <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm p-10 rounded-md shadow-sm border border-stone-200/60 space-y-10">
        
        {/* Basic Info */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2">Назва товару <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-5 py-3.5 bg-stone-50/50 rounded-md border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 focus:border-stone-400 focus:bg-white transition-all text-stone-800 font-medium"
                placeholder="Напр., В'язаний кардиган"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2">Артикул</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                className="w-full px-5 py-3.5 bg-stone-50/50 rounded-md border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 focus:border-stone-400 focus:bg-white transition-all text-stone-800 font-medium"
                placeholder="OLV-001"
              />
            </div>
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
                className="w-full px-5 py-3.5 bg-stone-50/50 rounded-md border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 focus:border-stone-400 focus:bg-white transition-all text-stone-800 font-medium"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2">Категорія <span className="text-red-400">*</span></label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                className="w-full px-5 py-3.5 bg-stone-50/50 rounded-md border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 focus:border-stone-400 focus:bg-white transition-all text-stone-800 font-medium appearance-none"
              >
                <option value="">Оберіть категорію...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2">Кількість на складі {formData.sizes?.length > 0 ? '(Розраховано)' : '(якщо немає розмірів)'}</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                readOnly={formData.sizes && formData.sizes.length > 0}
                className={`w-full px-5 py-3.5 rounded-md border border-stone-200/80 focus:outline-none transition-all text-stone-800 font-medium ${formData.sizes?.length > 0 ? 'bg-stone-100 cursor-not-allowed opacity-70' : 'bg-stone-50/50 focus:ring-2 focus:ring-stone-400/50 focus:border-stone-400 focus:bg-white'}`}
                placeholder="0"
              />
              {formData.sizes?.length > 0 && (
                <p className="text-[10px] text-stone-400 mt-1 italic">* Сума всіх розмірів</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2">Опис</label>
            <textarea
              rows="5"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-5 py-3.5 bg-stone-50/50 rounded-md border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 focus:border-stone-400 focus:bg-white transition-all text-stone-800 resize-none custom-scrollbar"
              placeholder="Детальний опис товару..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2">Заміри виробу (Markdown)</label>
              <textarea
                rows={2}
                value={formData.measurements}
                onChange={(e) => setFormData({...formData, measurements: e.target.value})}
                className="w-full px-5 py-3.5 bg-stone-50/50 rounded-md border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 focus:border-stone-400 focus:bg-white transition-all text-stone-800 resize-none custom-scrollbar font-mono text-sm"
                placeholder="Заміри виробу..."
              />
              <p className="text-[10px] text-stone-400 mt-2 italic">Підтримує форматування: **жирний**, нові рядки.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2">Матеріал</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['Бавовна', 'Фланель', 'Муслін', 'Непромокаюча', 'Інтерлок', 'Футер', 'Перфорація'].map((mat) => (
                    <label key={mat} className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-stone-200 cursor-pointer hover:bg-stone-50 transition-colors">
                      <input 
                        type="checkbox" 
                        className="rounded border-stone-300 text-stone-800 focus:ring-stone-800"
                        checked={formData.material.includes(mat)}
                        onChange={(e) => {
                          const newMats = e.target.checked 
                            ? [...formData.material, mat]
                            : formData.material.filter(m => m !== mat);
                          setFormData({...formData, material: newMats});
                        }}
                      />
                      <span className="text-sm font-medium text-stone-700">{mat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2">Особливості моделі</label>
                <div className="flex flex-wrap gap-2 mt-2">
                {[
                  'З боді', 'З сорочкою', 'З шапочкою', 'Без шапочки', 
                  'Короткий рукав', 'Довгий рукав',
                  'Пісочник', 'Ромпер',
                  'Шапочка-вузлик', 'Чепчик',
                  'Костюм', 'Сукня', 'Футболка/шорти', 'Лонгслів/штани'
                ].map((feature) => (
                    <label key={feature} className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-stone-200 cursor-pointer hover:bg-stone-50 transition-colors">
                      <input 
                        type="checkbox" 
                        className="rounded border-stone-300 text-stone-800 focus:ring-stone-800"
                        checked={formData.features.includes(feature)}
                        onChange={(e) => {
                          const newFeatures = e.target.checked 
                            ? [...formData.features, feature]
                            : formData.features.filter(f => f !== feature);
                          setFormData({...formData, features: newFeatures});
                        }}
                      />
                      <span className="text-sm font-medium text-stone-700">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-stone-100" />

        {/* Sizes */}
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-4">Розміри (опціонально)</label>
          <div className="flex flex-col space-y-4 p-6 bg-stone-50/50 rounded-md border border-stone-100">
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <select
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                className="flex-1 w-full sm:max-w-[200px] px-4 py-2 bg-white rounded-lg border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 transition-all font-medium text-stone-800 appearance-none"
              >
                <option value="">Оберіть розмір...</option>
                {SIZE_OPTIONS.map(opt => (
                  <option key={opt} value={opt} disabled={formData.sizes.some(s => s.name === opt)}>
                    {opt}
                  </option>
                ))}
              </select>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-stone-400 font-medium whitespace-nowrap">К-ть:</span>
                <input
                  type="number"
                  min="0"
                  value={sizeQuantity}
                  onChange={(e) => setSizeQuantity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSize(e);
                  }}
                  className="w-20 px-3 py-2 bg-white rounded-lg border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 transition-all font-medium text-stone-800 text-center"
                />
              </div>
              <button
                type="button"
                onClick={handleAddSize}
                className="w-full sm:w-auto bg-stone-200 hover:bg-stone-300 text-stone-800 px-4 py-2 rounded-lg font-semibold tracking-wide transition-all shadow-sm whitespace-nowrap disabled:opacity-50"
                disabled={!sizeInput}
              >
                Додати +
              </button>
            </div>
            {formData.sizes.length > 0 && (
              <div className="space-y-2 pt-2">
                {formData.sizes.sort((a,b) => {
                  return SIZE_OPTIONS.indexOf(a.name) - SIZE_OPTIONS.indexOf(b.name);
                }).map(size => (
                  <div key={size.name} className="flex items-center justify-between bg-white border border-stone-200 pl-4 pr-1 py-1.5 rounded-lg text-sm font-semibold text-stone-700 shadow-sm transition-all hover:border-stone-400">
                    <div className="flex items-center space-x-4">
                      <span className="w-12 text-stone-900 border-r border-stone-100">{size.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] uppercase text-stone-400 font-bold">Залишок:</span>
                        <input 
                          type="number"
                          min="0"
                          value={size.quantity}
                          onChange={(e) => handleUpdateSizeQuantity(size.name, e.target.value)}
                          className="w-16 px-2 py-0.5 bg-stone-50 border border-transparent focus:border-stone-200 focus:bg-white rounded transition-colors text-center text-xs"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(size.name)}
                      className="ml-2 w-8 h-8 rounded-md bg-stone-50 hover:bg-red-50 text-stone-400 hover:text-red-500 flex items-center justify-center transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-stone-500">Якщо ви додасте хоча б один розмір, на сторінці товару з'явиться вибір розміру для клієнта.</p>
          </div>
        </div>

        <hr className="border-stone-100" />

        {/* Filters */}
        <div className="space-y-6">
          <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-4">Характеристики для фільтрів</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-stone-50/50 rounded-md border border-stone-100">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2">Стать</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                className="w-full px-5 py-3.5 bg-white rounded-md border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 transition-all text-stone-800 font-medium appearance-none"
              >
                <option value="">Не обрано</option>
                <option value="Хлопчик">Хлопчик</option>
                <option value="Дівчинка">Дівчинка</option>
                <option value="Унісекс">Унісекс</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2">Колір (оберіть один або декілька)</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Молочний', 'Рожевий/пудра', 'Сірий', 'Беж/коричневий', 'Гірчичний', 'Інші кольори'].map((color) => (
                  <label key={color} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-stone-200 cursor-pointer hover:bg-stone-50 transition-colors">
                    <input 
                      type="checkbox" 
                      className="rounded border-stone-300 text-stone-800 focus:ring-stone-800"
                      checked={formData.color.includes(color)}
                      onChange={(e) => {
                        const newColors = e.target.checked 
                          ? [...formData.color, color]
                          : formData.color.filter(c => c !== color);
                        setFormData({...formData, color: newColors});
                      }}
                    />
                    <span className="text-sm font-medium text-stone-700">{color}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2">Вік</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['0-1 місяць', '0-3 місяці', '1-3 місяці', '3-6 місяців', '6-9 місяців', '9-12 місяців', '12-18 місяців', '2 роки'].map((age) => (
                  <label key={age} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-stone-200 cursor-pointer hover:bg-stone-50 transition-colors">
                    <input 
                      type="checkbox" 
                      className="rounded border-stone-300 text-stone-800 focus:ring-stone-800"
                      checked={formData.age.includes(age)}
                      onChange={(e) => {
                        const newAges = e.target.checked 
                          ? [...formData.age, age]
                          : formData.age.filter(a => a !== age);
                        setFormData({...formData, age: newAges});
                      }}
                    />
                    <span className="text-sm font-medium text-stone-700">{age}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        </div>

        <hr className="border-stone-100" />

        {/* Toggles */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-8 p-6 bg-stone-50/50 rounded-md border border-stone-100">
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
            <span className="font-medium text-stone-700 group-hover:text-stone-900 transition-colors">Популярні товари (головна сторінка)</span>
          </label>
        </div>

        <hr className="border-stone-100" />

        {/* Image Upload Gallery */}
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-4">Фотографії товару (Галерея)</label>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
            {images.map((img) => (
              <div key={img.id} className={`group relative aspect-square rounded-md overflow-hidden border-2 transition-all ${img.isMain ? 'border-amber-400 shadow-md ring-4 ring-amber-100' : 'border-stone-200 hover:border-stone-400'}`}>
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
            <div className="relative aspect-square rounded-md border-2 border-dashed border-stone-300 flex items-center justify-center bg-stone-50/80 hover:bg-stone-100 hover:border-stone-400 transition-colors cursor-pointer group">
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

        <hr className="border-stone-100" />

        {/* SEO Settings */}
        <div className="space-y-6">
          <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-4">SEO Налаштування (Пошукова оптимізація)</label>
          <div className="grid grid-cols-1 gap-6 p-6 bg-stone-50/50 rounded-md border border-stone-100">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-400 mb-2">SEO Ключові слова (через кому)</label>
              <input
                type="text"
                value={formData.meta_keywords}
                onChange={(e) => setFormData({...formData, meta_keywords: e.target.value})}
                className="w-full px-5 py-3.5 bg-white rounded-md border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 transition-all text-stone-800 font-medium"
                placeholder="напр., дитячий одяг, боді для малюка, подарунок"
              />
              <p className="text-[10px] text-stone-400 mt-2 italic">Допомагає Google зрозуміти тематику товару. Пишіть слова, за якими клієнт може шукати такий товар.</p>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-400 mb-2">SEO Опис (якщо порожній - буде використано звичайний опис)</label>
              <textarea
                rows="3"
                value={formData.meta_description}
                onChange={(e) => setFormData({...formData, meta_description: e.target.value})}
                className="w-full px-5 py-3.5 bg-white rounded-md border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 transition-all text-stone-800 resize-none"
                placeholder="Короткий привабливий текст для результатів пошуку..."
              />
              <p className="text-[10px] text-stone-400 mt-2 italic">Цей текст користувач бачить у Google під назвою сайту. Рекомендується до 160 символів.</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-8 mb-10 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-4 rounded-md font-bold tracking-wide transition-all shadow-md hover:-translate-y-1 flex items-center text-lg shadow-black/30"
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
