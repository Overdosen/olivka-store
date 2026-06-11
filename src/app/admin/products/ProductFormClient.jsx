'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, deleteImageFromStorage } from '../../../lib/supabase';
import { Package, Upload, Trash2, Star, Save, ArrowLeft, Loader2, DollarSign, TrendingUp, Search, Settings, Ruler, Image as ImageIcon, Palette } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

const THEMES = {
  stone: {
    border: 'border-stone-300',
    headerBg: 'bg-stone-50/40',
    iconBg: 'bg-stone-500/10 text-stone-600',
    titleColor: 'text-stone-850'
  },
  amber: {
    border: 'border-amber-300/80',
    headerBg: 'bg-amber-50/40',
    iconBg: 'bg-amber-500/10 text-amber-700',
    titleColor: 'text-amber-900'
  },
  emerald: {
    border: 'border-emerald-300/80',
    headerBg: 'bg-emerald-50/40',
    iconBg: 'bg-emerald-500/10 text-emerald-700',
    titleColor: 'text-emerald-900'
  },
  blue: {
    border: 'border-blue-300/80',
    headerBg: 'bg-blue-50/40',
    iconBg: 'bg-blue-500/10 text-blue-600',
    titleColor: 'text-blue-900'
  },
  rose: {
    border: 'border-rose-300/80',
    headerBg: 'bg-rose-50/40',
    iconBg: 'bg-rose-500/10 text-rose-700',
    titleColor: 'text-rose-900'
  },
  indigo: {
    border: 'border-indigo-300/80',
    headerBg: 'bg-indigo-50/40',
    iconBg: 'bg-indigo-500/10 text-indigo-700',
    titleColor: 'text-indigo-900'
  },
  purple: {
    border: 'border-purple-300/80',
    headerBg: 'bg-purple-50/40',
    iconBg: 'bg-purple-500/10 text-purple-700',
    titleColor: 'text-purple-900'
  }
};

const Section = ({ icon: Icon, title, children, theme = 'stone', className = '' }) => {
  const t = THEMES[theme] || THEMES.stone;
  return (
    <div
      className={`rounded-2xl border ${t.border} overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
      style={{ marginBottom: '18px' }}
    >
      <div className={`px-6 py-5 flex items-center gap-4.5 ${t.headerBg} border-b ${t.border}`}>
        <div className={`p-2.5 rounded-xl ${t.iconBg} flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className={`text-xl md:text-2xl font-bold tracking-tight ${t.titleColor}`}>{title}</h3>
      </div>
      <div className="p-6 md:p-8">{children}</div>
    </div>
  );
};

export default function ProductFormClient({ id }) {
  const isEditing = Boolean(id);
  const router = useRouter();
  const pathname = usePathname();

  const SIZE_OPTIONS = ['56', '56-62', '62', '62-68', '68', '74', '80', '86', '92'];

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState([]);
  const [originalImages, setOriginalImages] = useState([]);
  const [initialState, setInitialState] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [targetUrl, setTargetUrl] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    price: '',
    cost_price: '',
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
    features: [],
    seo_title: ''
  });

  const [sizeInput, setSizeInput] = useState('');
  const [sizeQuantity, setSizeQuantity] = useState('1'); 
  const [sizeCostPrice, setSizeCostPrice] = useState('');

  useEffect(() => {
    if (!isEditing) {
      setInitialState({
        formData: {
          sku: '',
          name: '',
          price: '',
          cost_price: '',
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
          features: [],
          seo_title: ''
        },
        images: []
      });
    }
  }, [isEditing]);

  const isDirty = () => {
    if (!initialState) return false;

    const currentFormDataStr = JSON.stringify(formData);
    const initialFormDataStr = JSON.stringify(initialState.formData);

    const currentImagesClean = images.map(img => ({
      isMain: img.isMain,
      name: img.file ? img.file.name : (img.rawUrl || img.url)
    }));
    const initialImagesClean = initialState.images.map(img => ({
      isMain: img.isMain,
      name: img.rawUrl || img.url
    }));

    const currentImagesStr = JSON.stringify(currentImagesClean);
    const initialImagesStr = JSON.stringify(initialImagesClean);

    return currentFormDataStr !== initialFormDataStr || currentImagesStr !== initialImagesStr;
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handleCaptureClick = (e) => {
      const anchor = e.target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href === pathname) return;

      if (isDirty()) {
        e.preventDefault();
        e.stopPropagation();
        setTargetUrl(href);
        setShowExitConfirm(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('click', handleCaptureClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('click', handleCaptureClick, true);
    };
  }, [formData, images, initialState, pathname]);

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

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

      const fetchedProductData = {
        sku: data.sku || '',
        name: data.name || '',
        price: data.price || '',
        cost_price: data.cost_price || '',
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
        features: data.features || [],
        seo_title: data.seo_title || ''
      };

      setFormData(fetchedProductData);

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
        } catch (e) { console.error(e) }
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
      setOriginalImages(fetchedImages.map(img => img.rawUrl).filter(Boolean));
      setInitialState({
        formData: fetchedProductData,
        images: fetchedImages
      });
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
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/webp'
      };

      let fileToUpload = file;
      try {
        fileToUpload = await imageCompression(file, options);
      } catch (err) {
        console.warn('Помилка стиснення фото, завантажуємо оригінал', err);
      }

      const fileExt = fileToUpload.type === 'image/webp' ? 'webp' : fileToUpload.name.split('.').pop() || 'jpg';
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, fileToUpload, {
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

  const saveProduct = async (duplicate = false, customRedirect = null) => {
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

      if (isEditing) {
        for (const origUrl of originalImages) {
          const stillExists = processedImages.some(img => img.finalUrl === origUrl);
          if (!stillExists) {
            await deleteImageFromStorage(origUrl);
          }
        }
      }

      setImages(processedImages.map(img => ({ ...img, rawUrl: img.finalUrl })));

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
        cost_price: parseFloat(formData.cost_price) || 0,
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
        features: formData.features,
        seo_title: formData.seo_title
      };

      let currentId = id;
      if (!isEditing) {
        const nameToTranslit = (formData.name || '').substring(0, 5);
        const namePart = translite(nameToTranslit)
          .replace(/[^a-z0-9]/g, '');

        const skuPart = formData.sku ? String(formData.sku).toLowerCase().replace(/[^a-z0-9]/g, '-') : '555';
        let generatedId = `${namePart}-art-${skuPart}-${Date.now()}`;

        currentId = generatedId.replace(/-+/g, '-').replace(/^-|-$/g, '');
        productPayload.id = currentId;
      }

      const { error } = isEditing
        ? await supabase.from('products').update(productPayload).eq('id', currentId)
        : await supabase.from('products').insert([productPayload]);

      if (error) throw error;

      toast.success(isEditing ? 'Товар оновлено' : 'Товар створено');

      if (duplicate) {
        const dupNameToTranslit = (formData.name || '').substring(0, 5);
        const dupNamePart = translite(dupNameToTranslit).replace(/[^a-z0-9]/g, '');
        let dupGeneratedId = `${dupNamePart}-art-dup-${Date.now()}`;

        const duplicatePayload = {
          ...productPayload,
          id: dupGeneratedId,
          sku: productPayload.sku ? `${productPayload.sku}-COPY` : '',
          is_published: false,
        };

        const { error: dupError } = await supabase.from('products').insert([duplicatePayload]);
        if (dupError) throw dupError;

        toast.success('Створено копію товару, можна редагувати');
        router.push(`/admin/products/${dupGeneratedId}`);
      } else {
        router.push(customRedirect || '/admin/products');
      }

    } catch (error) {
      toast.error('Помилка збереження: ' + error.message);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!id) return;
    if (!window.confirm('Ви впевнені, що хочете видалити цей товар?')) return;
    try {
      for (const url of originalImages) {
        await deleteImageFromStorage(url);
      }
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success('Товар видалено');
      router.push('/admin/products');
    } catch (error) {
      toast.error('Помилка видалення товару: ' + error.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) return toast.error('Введіть назву товару');
    if (!formData.category_id) return toast.error('Оберіть категорію');
    if (!formData.price) return toast.error('Введіть ціну продажу');
    saveProduct(false);
  };

  const margin = formData.price && formData.cost_price
    ? parseFloat(formData.price) - parseFloat(formData.cost_price)
    : null;
  const marginPct = margin !== null && parseFloat(formData.cost_price) > 0
    ? Math.round((margin / parseFloat(formData.cost_price)) * 100)
    : null;


  if (loading) {
    return <div className="p-8 text-center animate-pulse">Завантаження...</div>;
  }

  const handleAddSize = (e) => {
    e.preventDefault();
    if (!sizeInput.trim()) return;
    if (formData.sizes.some(s => s.name === sizeInput.trim())) return;

    const newSize = {
      name: sizeInput.trim(),
      quantity: parseInt(sizeQuantity) || 0,
      cost_price: sizeCostPrice ? parseFloat(sizeCostPrice) : null
    };

    const updatedSizes = [...formData.sizes, newSize];
    setFormData({
      ...formData,
      sizes: updatedSizes,
      stock: updatedSizes.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0)
    });
    setSizeInput('');
    setSizeQuantity('1');
    setSizeCostPrice('');
  };

  const handleUpdateSizeQuantity = (sizeName, newQty) => {
    const updatedSizes = formData.sizes.map(s =>
      s.name === sizeName ? { ...s, quantity: newQty === '' ? '' : parseInt(newQty) } : s
    );
    setFormData({
      ...formData,
      sizes: updatedSizes,
      stock: updatedSizes.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0)
    });
  };

  const handleUpdateSizeCostPrice = (sizeName, newCost) => {
    const updatedSizes = formData.sizes.map(s =>
      s.name === sizeName ? { ...s, cost_price: newCost ? parseFloat(newCost) : null } : s
    );
    setFormData({
      ...formData,
      sizes: updatedSizes
    });
  };

  const handleRemoveSize = (sizeToRemove) => {
    setFormData({
      ...formData,
      sizes: formData.sizes.filter(s => s.name !== sizeToRemove)
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          type="button"
          onClick={() => {
            if (isDirty()) {
              setTargetUrl('/admin/products');
              setShowExitConfirm(true);
            } else {
              router.push('/admin/products');
            }
          }}
          className="p-2 sm:p-3 !text-stone-400 hover:!text-stone-900 hover:bg-white rounded-lg transition-all shadow-sm border border-stone-200/50 w-fit"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-cormorant font-bold text-stone-800 tracking-tight">
            {isEditing ? 'Редагування товару' : 'Новий товар'}
          </h1>
          <p className="text-stone-500 mt-1 font-medium text-sm">
            {isEditing ? 'Оновіть інформацію, ціну або фото товару.' : 'Заповніть деталі для створення нового товару.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-0" noValidate>

        {/* 📦 Основна інформація */}
        <Section icon={Package} title="Основна інформація" theme="blue">
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-wider font-bold text-[#524f25] mb-2">Назва товару <span className="text-red-400">*</span></label>
                <input type="text" required value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400/30 focus:border-stone-400 focus:bg-white transition-all text-stone-800 font-medium"
                  placeholder="Напр., В'язаний кардиган" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-[#524f25] mb-2">Артикул</label>
                <input type="text" value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400/30 focus:border-stone-400 focus:bg-white transition-all text-stone-800 font-medium"
                  placeholder="OLV-001" />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#524f25] mb-2">Категорія <span className="text-red-400">*</span></label>
              <select required value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400/30 focus:border-stone-400 focus:bg-white transition-all text-stone-800 font-medium appearance-none">
                <option value="">Оберіть категорію...</option>
                {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#524f25] mb-2">Опис</label>
              <textarea rows="4" value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400/30 focus:border-stone-400 focus:bg-white transition-all text-stone-800 resize-none"
                placeholder="Детальний опис товару..." />
            </div>
          </div>
        </Section>

        {/* 💰 Ціни та фінанси */}
        <Section icon={DollarSign} title="Ціни та фінанси" theme="amber">
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-[#524f25] mb-2">Ціна продажу ₴ <span className="text-red-400">*</span></label>
                <input type="number" required min="0" step="10.00" value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400/30 focus:border-stone-400 focus:bg-white transition-all text-stone-800 font-semibold text-lg"
                  placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-[#524f25] mb-2">Кількість на складі (без розмірів)</label>
                <input type="number" min="0" value={formData.stock}
                  disabled={formData.sizes && formData.sizes.length > 0}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400/30 focus:border-stone-400 focus:bg-white disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed transition-all text-stone-800 font-medium"
                  placeholder="0" />
                {formData.sizes && formData.sizes.length > 0 && (
                  <p className="text-[10px] text-stone-400 mt-1 italic">Розраховується автоматично з доданих розмірів</p>
                )}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-[#524f25] mb-2">Закупівельна ціна (без розмірів) ₴</label>
                <input type="number" min="0" step="10.00" value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400/30 focus:border-stone-400 focus:bg-white transition-all text-stone-800 font-medium"
                  placeholder="0.00" />
              </div>
            </div>
            {margin !== null && formData.cost_price && (
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${margin > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <TrendingUp className={`w-4 h-4 ${margin > 0 ? 'text-emerald-600' : 'text-red-500'}`} />
                <span className="text-sm font-semibold text-stone-700">
                  Маржа: <span className={margin > 0 ? 'text-emerald-700' : 'text-red-600'}>{margin > 0 ? '+' : ''}{margin.toFixed(0)} ₴</span>
                  {marginPct !== null && <span className="text-stone-400 font-normal ml-1">({marginPct}%)</span>}
                </span>
              </div>
            )}
          </div>
        </Section>

        {/* Sizes */}
        <Section icon={Ruler} title="Розміри (опціонально)" theme="emerald">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <select
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                className="flex-1 w-full sm:max-w-[200px] px-4 py-2.5 bg-white rounded-lg border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 transition-all font-medium text-stone-800 appearance-none"
              >
                <option value="">Оберіть розмір...</option>
                {SIZE_OPTIONS.map(opt => (
                  <option key={opt} value={opt} disabled={formData.sizes.some(s => s.name === opt)}>
                    {opt}
                  </option>
                ))}
              </select>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold text-[#524f25] whitespace-nowrap">К-ть:</span>
                <input
                  type="number"
                  min="0"
                  value={sizeQuantity}
                  onChange={(e) => setSizeQuantity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSize(e);
                  }}
                  className="w-16 px-3 py-2 bg-white rounded-lg border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 transition-all font-medium text-stone-800 text-center"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold text-[#524f25] whitespace-nowrap">Закупка:</span>
                <input
                  type="number"
                  min="0"
                  step="10.00"
                  value={sizeCostPrice}
                  onChange={(e) => setSizeCostPrice(e.target.value)}
                  placeholder="0.00"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSize(e);
                  }}
                  className="w-24 px-3 py-2 bg-white rounded-lg border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 transition-all font-medium text-stone-800 text-center"
                />
              </div>
              <button
                type="button"
                onClick={handleAddSize}
                className="w-full sm:w-auto bg-stone-200 hover:bg-stone-300 text-stone-800 px-4 py-2 rounded-lg font-semibold tracking-wide transition-all shadow-sm whitespace-nowrap disabled:opacity-50"
                disabled={!sizeInput}
              >
                Додати
              </button>
            </div>
            {formData.sizes.length > 0 && (
              <div className="space-y-2 pt-2">
                {formData.sizes.sort((a, b) => {
                  return SIZE_OPTIONS.indexOf(a.name) - SIZE_OPTIONS.indexOf(b.name);
                }).map(size => (
                  <div key={size.name} className="flex items-center justify-between bg-white border border-stone-200 pl-4 pr-1 py-1.5 rounded-lg text-sm font-semibold text-stone-700 shadow-sm transition-all hover:border-stone-400">
                    <div className="flex items-center space-x-4">
                      <span className="w-12 text-stone-900 border-r border-stone-100">{size.name}</span>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] uppercase font-bold text-[#524f25]">К-ть:</span>
                          <input
                            type="number"
                            min="0"
                            value={size.quantity}
                            onChange={(e) => handleUpdateSizeQuantity(size.name, e.target.value)}
                            className="w-16 px-2 py-0.5 bg-stone-50 border border-transparent focus:border-stone-200 focus:bg-white rounded transition-colors text-center text-xs"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] uppercase font-bold text-[#524f25]">Закупка ₴:</span>
                          <input
                            type="number"
                            min="0"
                            step="10.00"
                            value={size.cost_price || ''}
                            onChange={(e) => handleUpdateSizeCostPrice(size.name, e.target.value)}
                            placeholder={formData.cost_price || "0"}
                            className="w-20 px-2 py-0.5 bg-stone-50 border border-transparent focus:border-stone-200 focus:bg-white rounded transition-colors text-center text-xs"
                          />
                        </div>
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
            <p className="text-sm text-stone-500 leading-relaxed">Якщо ви додасте хоча б один розмір, на сторінці товару з'явиться вибір розміру для клієнта.</p>
            
            <div className="pt-4 border-t border-stone-200/60 mt-4">
              <label className="block text-xs uppercase tracking-wider font-bold text-[#524f25] mb-2">Заміри виробу (для лінійки)</label>
              <textarea
                rows="4"
                value={formData.measurements || ''}
                onChange={(e) => setFormData({ ...formData, measurements: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400/30 focus:border-stone-400 focus:bg-white transition-all text-stone-800 resize-none"
                placeholder="Введіть заміри виробу (наприклад: Довжина - 50 см, Ширина - 30 см...)"
              />
              <p className="text-[10px] text-stone-400 mt-2 italic">Цей текст буде показано клієнтам при натисканні на іконку лінійки поруч з розмірами.</p>
            </div>
          </div>
        </Section>

        {/* Filters */}
        <Section icon={Palette} title="Характеристики для фільтрів" theme="purple">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#524f25] mb-2">Стать</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-5 py-3.5 bg-white rounded-md border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 transition-all text-stone-800 font-medium appearance-none"
              >
                <option value="">Не обрано</option>
                <option value="Хлопчик">Хлопчик</option>
                <option value="Дівчинка">Дівчинка</option>
                <option value="Унісекс">Унісекс</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#524f25] mb-2">Колір (оберіть один або декілька)</label>
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
                        setFormData({ ...formData, color: newColors });
                      }}
                    />
                    <span className="text-sm font-medium text-stone-700">{color}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wider font-bold text-[#524f25] mb-2">Вік</label>
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
                        setFormData({ ...formData, age: newAges });
                      }}
                    />
                    <span className="text-sm font-medium text-stone-700">{age}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wider font-bold text-[#524f25] mb-2">Матеріал (оберіть один або декілька)</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Бавовна', 'Фланель', 'Муслін', 'Непромокаюча', 'Інтерлок', 'Футер', 'Перфорація'].map((mat) => (
                  <label key={mat} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-stone-200 cursor-pointer hover:bg-stone-50 transition-colors">
                    <input
                      type="checkbox"
                      className="rounded border-stone-300 text-stone-800 focus:ring-stone-800"
                      checked={formData.material ? formData.material.includes(mat) : false}
                      onChange={(e) => {
                        const currentMaterial = formData.material || [];
                        const newMaterials = e.target.checked
                          ? [...currentMaterial, mat]
                          : currentMaterial.filter(m => m !== mat);
                        setFormData({ ...formData, material: newMaterials });
                      }}
                    />
                    <span className="text-sm font-medium text-stone-700">{mat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wider font-bold text-[#524f25] mb-2">Особливості моделі (оберіть одну або декілька)</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  'З боді', 'З сорочкою', 'З шапочкою', 'Без шапочки',
                  'Короткий рукав', 'Довгий рукав',
                  'Пісочник', 'Ромпер',
                  'Шапочка-вузлик', 'Чепчик',
                  'Костюм', 'Сукня', 'Футболка/шорти', 'Лонгслів/штани'
                ].map((feat) => (
                  <label key={feat} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-stone-200 cursor-pointer hover:bg-stone-50 transition-colors">
                    <input
                      type="checkbox"
                      className="rounded border-stone-300 text-stone-800 focus:ring-stone-800"
                      checked={formData.features ? formData.features.includes(feat) : false}
                      onChange={(e) => {
                        const currentFeatures = formData.features || [];
                        const newFeatures = e.target.checked
                          ? [...currentFeatures, feat]
                          : currentFeatures.filter(f => f !== feat);
                        setFormData({ ...formData, features: newFeatures });
                      }}
                    />
                    <span className="text-sm font-medium text-stone-700">{feat}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Toggles */}
        <Section icon={Settings} title="Відображення та статус" theme="rose">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-8">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-6 h-6">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-5 h-5 rounded border-stone-300 text-stone-800 focus:ring-stone-800 transition-all peer"
                />
              </div>
              <span className="font-bold text-xs uppercase tracking-wider text-[#524f25] transition-colors">Опубліковано на сайті</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-6 h-6">
                <input
                  type="checkbox"
                  checked={formData.is_new}
                  onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
                  className="w-5 h-5 rounded border-stone-300 text-stone-800 focus:ring-stone-800 transition-all peer"
                />
              </div>
              <span className="font-bold text-xs uppercase tracking-wider text-[#524f25] transition-colors">Популярні товари (головна сторінка)</span>
            </label>
          </div>
        </Section>

        {/* Image Upload Gallery */}
        <Section icon={ImageIcon} title="Фотографії товару" theme="indigo">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
            {images.map((img) => (
              <div key={img.id} className={`group relative aspect-square rounded-md overflow-hidden border-2 transition-all ${img.isMain ? 'border-amber-400 shadow-md ring-4 ring-amber-100' : 'border-stone-200 hover:border-stone-400'}`}>
                {img.url && <Image src={img.url} alt="Preview" fill sizes="150px" className="object-cover" />}

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
              Завантажуйте кілька фотографій одночасно. Зробіть одне з фото <strong>Головним</strong> натиснувши на кнопку з зірочкою.<br />
              Рекомендований розмір: 1000x1000px (пропорції 1:1).
            </p>
          </div>
        </Section>

        {/* SEO Settings */}
        <Section icon={Search} title="SEO Налаштування" theme="stone">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs uppercase tracking-wider font-bold text-[#524f25]">SEO Заголовок (Title)</label>
                <button
                  type="button"
                  onClick={() => {
                    const colorSuffix = formData.color && formData.color.length > 0 ? ` (${formData.color[0]})` : '';
                    setFormData({ ...formData, seo_title: `${formData.name}${colorSuffix}` });
                    toast.success('Заголовок згенеровано');
                  }}
                  className="text-[10px] uppercase font-bold text-amber-600 hover:text-amber-700 underline"
                >
                  Згенерувати автоматично
                </button>
              </div>
              <input
                type="text"
                value={formData.seo_title}
                onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400/30 focus:border-stone-400 focus:bg-white transition-all text-stone-800 font-medium"
                placeholder="Назва товару (Колір)"
              />
              <p className="text-[10px] text-stone-400 mt-2 italic">Це главний заголовок для Google. Має бути унікальним для кожного товару.</p>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#524f25] mb-2">SEO Ключові слова (через кому)</label>
              <input
                type="text"
                value={formData.meta_keywords}
                onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400/30 focus:border-stone-400 focus:bg-white transition-all text-stone-800 font-medium"
                placeholder="напр., дитячий одяг, боді для малюка, подарунок"
              />
              <p className="text-[10px] text-stone-400 mt-2 italic">Допомагає Google зрозуміти тематику товару.</p>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#524f25] mb-2">SEO Опис (Description)</label>
              <textarea
                rows="3"
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400/30 focus:border-stone-400 focus:bg-white transition-all text-stone-800 resize-none"
                placeholder="Короткий привабливий текст для результатів пошуку..."
              />
              <p className="text-[10px] text-stone-400 mt-2 italic">Відображається під назвою в Google. Рекомендується до 160 символів.</p>
            </div>
          </div>
        </Section>

        {/* Submit */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto flex justify-start">
            {isEditing && (
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-4 rounded-md font-bold tracking-wide text-red-650 hover:text-red-750 bg-red-50 hover:bg-red-100/80 border border-red-200/80 transition-all flex items-center justify-center shadow-sm"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                <span>Видалити товар</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-end ml-auto">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); saveProduct(true); }}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-4 rounded-md font-bold tracking-wide transition-all shadow-sm border border-stone-200 hover:bg-stone-50 flex items-center justify-center text-stone-700 bg-white"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin text-stone-400" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              )}
              <span>Зберегти та копіювати</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-8 py-4 rounded-md font-bold tracking-wide transition-all shadow-md hover:-translate-y-1 flex items-center justify-center text-lg shadow-black/30"
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
        </div>
      </form>

      {/* Модальне вікно попередження про незбережені зміни */}
      {showExitConfirm && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden p-6 md:p-7 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-100 flex-shrink-0 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-850 font-cormorant tracking-tight">Незбережені зміни</h3>
                <p className="text-stone-500 text-sm mt-0.5 leading-relaxed">Ви внесли зміни в картку товару. Бажаєте зберегти їх перед виходом?</p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 mt-6">
              <button
                type="button"
                onClick={async () => {
                  if (!formData.name?.trim()) return toast.error('Введіть назву товару');
                  if (!formData.category_id) return toast.error('Оберіть категорію');
                  if (!formData.price) return toast.error('Введіть ціну продажу');
                  setShowExitConfirm(false);
                  await saveProduct(false, targetUrl);
                }}
                disabled={saving}
                className="w-full py-3.5 px-4 rounded-xl text-white font-semibold text-center transition-all bg-stone-900 hover:bg-stone-850 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-sm"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Зберегти</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  router.push(targetUrl || '/admin/products');
                }}
                disabled={saving}
                className="w-full py-3.5 px-4 rounded-xl bg-red-50 hover:bg-red-100/80 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-red-650 font-semibold text-center border border-red-200/50 transition-all"
              >
                Вийти
              </button>

              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                disabled={saving}
                className="w-full py-3.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200/80 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-stone-700 font-semibold text-center transition-all"
              >
                Продовжити редагування
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
