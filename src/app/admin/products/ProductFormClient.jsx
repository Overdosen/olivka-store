'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, deleteImageFromStorage } from '../../../lib/supabase';
import { Package, Upload, Trash2, Star, Save, ArrowLeft, Loader2, DollarSign, TrendingUp, Search, Settings, Ruler, Image as ImageIcon, Palette, Check, Boxes, Plus, X as XIcon, AlertCircle } from 'lucide-react';
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

// ─── Unified field styles (Settings-style) ────────────────────────────────────
const F = {
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#a8a29e',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    background: '#fafaf9',
    border: '1.5px solid #e7e5e4',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#1c1917',
    outline: 'none',
    transition: 'border-color 0.15s, background 0.15s',
    boxSizing: 'border-box',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  hint: {
    fontSize: '11px',
    color: '#a8a29e',
    marginTop: '6px',
    fontStyle: 'italic',
  },
  req: { color: '#f87171', marginLeft: '2px' },
};

const handleFocus = (e) => { e.target.style.borderColor = '#a8a29e'; e.target.style.background = '#fff'; };
const handleBlur  = (e) => { e.target.style.borderColor = '#e7e5e4'; e.target.style.background = '#fafaf9'; };

const CheckboxChip = ({ checked, onChange, label, color = '#1c1917' }) => {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        padding: '9px 14px',
        background: checked ? '#f5f5f4' : 'white',
        border: checked ? `1.5px solid ${color}` : '1.5px solid #e7e5e4',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        userSelect: 'none'
      }}
      className="hover:border-stone-400"
    >
      <div style={{
        position: 'relative',
        width: '18px',
        height: '18px',
        borderRadius: '5px',
        border: checked ? 'none' : '1.5px solid #d6d3d1',
        background: checked ? color : 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.15s'
      }}>
        {checked && <Check size={13} color="white" strokeWidth={3} />}
      </div>
      <input
        type="checkbox"
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
        checked={checked}
        onChange={onChange}
      />
      <span style={{ fontSize: '13px', fontWeight: checked ? 700 : 500, color: '#1c1917' }}>
        {label}
      </span>
    </label>
  );
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

  // ── Bundle components (Готові рішення) ───────────────────────────────────
  const [bundleComponents, setBundleComponents] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [componentSearch, setComponentSearch] = useState('');
  const [showComponentDropdown, setShowComponentDropdown] = useState(false);
  // pendingProduct: товар обраний в dropdown, чекає вибору розміру
  const [pendingProduct, setPendingProduct] = useState(null);

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
    is_combo: false,
    is_outfit: false,
    is_published: true,
    is_bundle: false,
    image_url: '',
    stock: 0,
    sizes: [],
    variant_type: 'size',
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
          is_combo: false,
          is_outfit: false,
          is_published: true,
          is_bundle: false,
          image_url: '',
          stock: 0,
          sizes: [],
          variant_type: 'size',
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
    fetchAllProductsForBundle();
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

  // Auto-calculate stock/price/cost_price from bundle components (Готові рішення)
  useEffect(() => {
    if (formData.category_id !== 'fullset') return;

    // Якщо компоненти видалено — скидаємо залишок до 0, але ціни залишаємо (щоб не було "0 грн" на сайті)
    if (bundleComponents.length === 0) {
      setFormData(prev => ({ ...prev, stock: 0 }));
      return;
    }

    // Stock = мінімум серед компонентів (по вибраному розміру або загальному)
    const getCompStock = (comp) => {
      if (comp.selectedSize && comp.sizes && comp.sizes.length > 0) {
        const sizeObj = comp.sizes.find(s => s.name === comp.selectedSize);
        return sizeObj ? (parseInt(sizeObj.quantity) || 0) : 0;
      }
      if (comp.sizes && comp.sizes.length > 0) {
        return comp.sizes.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0);
      }
      return comp.stock || 0;
    };

    const minStock = Math.min(...bundleComponents.map(getCompStock));

    // Price = сума цін компонентів
    const sumPrice = bundleComponents.reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0);

    // Cost price = сума закупівельних цін
    const sumCostPrice = bundleComponents.reduce((sum, c) => sum + (parseFloat(c.cost_price) || 0), 0);

    setFormData(prev => ({
      ...prev,
      stock: minStock,
      price: String(Math.round(sumPrice)),
      cost_price: String(sumCostPrice.toFixed(2)),
    }));
  }, [bundleComponents, formData.category_id]);



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

  async function fetchAllProductsForBundle() {
    const { data } = await supabase
      .from('products')
      .select('id, name, sku, stock, sizes, price, cost_price')
      .order('name');
    if (data) {
      setAllProducts(data.filter(p => p.id !== id));
    }
  }

  async function fetchBundleComponents(bundleId) {
    const { data } = await supabase
      .from('product_components')
      .select('component_id, size, products!component_id(id, name, sku, stock, sizes, price, cost_price)')
      .eq('bundle_id', bundleId);
    if (data) {
      setBundleComponents(
        data
          .map(row => row.products ? { ...row.products, selectedSize: row.size || null } : null)
          .filter(Boolean)
      );
    }
  }

  async function saveBundleComponents(bundleId) {
    await supabase.from('product_components').delete().eq('bundle_id', bundleId);
    if (bundleComponents.length > 0) {
      const rows = bundleComponents.map(c => ({
        bundle_id: bundleId,
        component_id: c.id,
        size: c.selectedSize || null
      }));
      const { error } = await supabase.from('product_components').insert(rows);
      if (error) throw error;
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
        is_combo: data.is_combo || false,
        is_outfit: data.is_outfit || false,
        is_published: data.is_published ?? true,
        is_bundle: data.is_bundle ?? false,
        image_url: data.image_url || '',
        stock: data.stock || 0,
        sizes: data.sizes || [],
        variant_type: data.variant_type || 'size',
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

      // Load bundle components if this is a fullset product
      if (data.category_id === 'fullset') {
        await fetchBundleComponents(id);
      }

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

      // Save bundle components if this is a fullset product
      if (formData.category_id === 'fullset') {
        await saveBundleComponents(currentId);
      }

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
        if (!isEditing) {
          router.push(`/admin/products/${currentId}`);
        } else {
          if (customRedirect) {
            router.push(customRedirect);
          } else {
            setInitialState({
              formData: { ...formData },
              images: processedImages.map(img => ({ ...img, rawUrl: img.finalUrl }))
            });
            setOriginalImages(processedImages.map(img => img.finalUrl).filter(Boolean));
          }
        }
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={F.label}>Назва товару<span style={F.req}>*</span></label>
                <input type="text" required value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={F.input} onFocus={handleFocus} onBlur={handleBlur}
                  placeholder="Напр., В'язаний кардиган" />
              </div>
              <div>
                <label style={F.label}>Артикул</label>
                <input type="text" value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  style={F.input} onFocus={handleFocus} onBlur={handleBlur}
                  placeholder="OLV-001" />
              </div>
            </div>
            <div>
              <label style={F.label}>Категорія<span style={F.req}>*</span></label>
              <select required value={formData.category_id}
                onChange={(e) => {
                  setFormData({ ...formData, category_id: e.target.value });
                  if (e.target.value === 'fullset' && isEditing) {
                    fetchBundleComponents(id);
                  } else if (e.target.value !== 'fullset') {
                    setBundleComponents([]);
                  }
                }}
                style={{ ...F.input, appearance: 'none', cursor: 'pointer' }}
                onFocus={handleFocus} onBlur={handleBlur}>
                <option value="">Оберіть категорію...</option>
                {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
              </select>
            </div>

            {/* ── Склад набору (для Готових рішень) ── */}
            {(formData.category_id === 'fullset') && (() => {
              // Якщо зберігається selectedSize — враховуємо сток тільки цього розміру
              const getComponentStock = (comp) => {
                if (comp.selectedSize && comp.sizes && comp.sizes.length > 0) {
                  const sizeObj = comp.sizes.find(s => s.name === comp.selectedSize);
                  return sizeObj ? (parseInt(sizeObj.quantity) || 0) : 0;
                }
                if (comp.sizes && comp.sizes.length > 0) {
                  return comp.sizes.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0);
                }
                return comp.stock || 0;
              };
              const hasOutOfStock = bundleComponents.some(c => getComponentStock(c) === 0);
              const filteredProducts = allProducts.filter(p =>
                !bundleComponents.some(c => c.id === p.id) &&
                (componentSearch === '' ||
                  p.name.toLowerCase().includes(componentSearch.toLowerCase()) ||
                  (p.sku && p.sku.toLowerCase().includes(componentSearch.toLowerCase())))
              );
              return (
                <div style={{
                  border: hasOutOfStock ? '1.5px solid #fca5a5' : '1.5px solid #d1fae5',
                  borderRadius: '12px',
                  padding: '20px',
                  background: hasOutOfStock ? '#fff7f7' : '#f0fdf4',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <Boxes size={18} style={{ color: hasOutOfStock ? '#ef4444' : '#16a34a' }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: hasOutOfStock ? '#dc2626' : '#15803d' }}>
                      Склад набору
                    </span>
                    {hasOutOfStock && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#dc2626', fontWeight: 600, marginLeft: 'auto' }}>
                        <AlertCircle size={14} /> Один із товарів відсутній — набір недоступний
                      </span>
                    )}
                  </div>

                  {/* Список доданих компонентів */}
                  {bundleComponents.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                      {bundleComponents.map((comp, idx) => {
                        const compStock = getComponentStock(comp);
                        const outOfStock = compStock === 0;
                        return (
                          <div key={`${comp.id}-${comp.selectedSize || idx}`} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: 'white',
                            borderRadius: '10px',
                            border: outOfStock ? '1.5px solid #fca5a5' : '1.5px solid #e7e5e4',
                            gap: '12px'
                          }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1c1917', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {comp.name}
                              </div>
                              <div style={{ display: 'flex', gap: '6px', marginTop: '3px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {comp.sku && <span style={{ fontSize: '11px', color: '#a8a29e' }}>Арт: {comp.sku}</span>}
                                {comp.selectedSize && (
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#524f25', background: '#fef9c3', border: '1px solid #fde68a', padding: '1px 6px', borderRadius: '5px' }}>
                                    📏 {comp.selectedSize}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{
                              fontSize: '12px', fontWeight: 700,
                              color: outOfStock ? '#dc2626' : '#16a34a',
                              whiteSpace: 'nowrap',
                              padding: '3px 8px',
                              background: outOfStock ? '#fee2e2' : '#dcfce7',
                              borderRadius: '6px'
                            }}>
                              {outOfStock ? '⚠ 0 шт.' : `${compStock} шт.`}
                            </div>
                            <button
                              type="button"
                              onClick={() => setBundleComponents(prev => prev.filter((_, i) => i !== idx))}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', display: 'flex', padding: '4px', borderRadius: '6px', flexShrink: 0 }}
                              className="hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <XIcon size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Вибір розміру для pending-товару */}
                  {pendingProduct && (
                    <div style={{
                      marginBottom: '12px',
                      background: 'white',
                      border: '1.5px solid #fde68a',
                      borderRadius: '10px',
                      padding: '12px 14px'
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', marginBottom: '8px' }}>
                        📏 Оберіть розмір для «{pendingProduct.name}»:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {pendingProduct.sizes.map(s => {
                          const qty = parseInt(s.quantity) || 0;
                          return (
                            <button
                              key={s.name}
                              type="button"
                              onClick={() => {
                                setBundleComponents(prev => [...prev, { ...pendingProduct, selectedSize: s.name }]);
                                setPendingProduct(null);
                                setComponentSearch('');
                              }}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                border: qty === 0 ? '1.5px solid #fca5a5' : '1.5px solid #d1fae5',
                                background: qty === 0 ? '#fff7f7' : '#f0fdf4',
                                color: qty === 0 ? '#dc2626' : '#15803d',
                                fontSize: '13px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                              className="hover:opacity-80 active:scale-95"
                            >
                              {s.name} <span style={{ fontWeight: 400, fontSize: '11px', opacity: 0.8 }}>({qty} шт.)</span>
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setPendingProduct(null)}
                          style={{ padding: '6px 10px', borderRadius: '8px', border: '1.5px solid #e7e5e4', background: 'white', color: '#a8a29e', fontSize: '12px', cursor: 'pointer' }}
                        >
                          Скасувати
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Пошук і додавання нових компонентів */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a8a29e', pointerEvents: 'none' }} />
                        <input
                          type="text"
                          value={componentSearch}
                          onChange={e => { setComponentSearch(e.target.value); setShowComponentDropdown(true); }}
                          onFocus={() => setShowComponentDropdown(true)}
                          placeholder="Пошук товару для додавання..."
                          style={{ ...F.input, paddingLeft: '36px' }}
                          onFocus={e => { handleFocus(e); setShowComponentDropdown(true); }}
                          onBlur={e => { handleBlur(e); setTimeout(() => setShowComponentDropdown(false), 200); }}
                        />
                      </div>
                    </div>

                    {/* Dropdown */}
                    {showComponentDropdown && filteredProducts.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1.5px solid #e7e5e4',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        zIndex: 50,
                        maxHeight: '260px',
                        overflowY: 'auto'
                      }}>
                        {filteredProducts.slice(0, 30).map(p => {
                          const pStock = p.sizes && p.sizes.length > 0
                            ? p.sizes.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0)
                            : (p.stock || 0);
                          const oos = pStock === 0;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onMouseDown={() => {
                                if (p.sizes && p.sizes.length > 0) {
                                  // Є розміри — показуємо picker
                                  setPendingProduct(p);
                                  setShowComponentDropdown(false);
                                } else {
                                  // Немає розмірів — додаємо одразу
                                  setBundleComponents(prev => [...prev, { ...p, selectedSize: null }]);
                                  setComponentSearch('');
                                  setShowComponentDropdown(false);
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                width: '100%',
                                padding: '10px 14px',
                                background: 'none',
                                border: 'none',
                                borderBottom: '1px solid #f5f5f4',
                                cursor: 'pointer',
                                textAlign: 'left',
                                gap: '12px'
                              }}
                              className="hover:bg-stone-50 transition-colors"
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1c1917', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {p.name}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '3px', alignItems: 'center' }}>
                                  {p.sku && <span style={{ fontSize: '11px', color: '#a8a29e' }}>Арт: {p.sku}</span>}
                                  {p.price && <span style={{ fontSize: '11px', color: '#78716c', fontWeight: 600 }}>💰 {p.price} ₴</span>}
                                  {p.cost_price && <span style={{ fontSize: '11px', color: '#a8a29e' }}>📦 {p.cost_price} ₴</span>}
                                  {p.sizes && p.sizes.length > 0 && (
                                    <span style={{ fontSize: '10px', color: '#78716c', background: '#f5f5f4', padding: '1px 5px', borderRadius: '4px' }}>
                                      {p.sizes.map(s => `${s.name}:${s.quantity}`).join(' · ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div style={{
                                fontSize: '11px', fontWeight: 700,
                                color: oos ? '#dc2626' : '#16a34a',
                                whiteSpace: 'nowrap',
                                padding: '2px 7px',
                                background: oos ? '#fee2e2' : '#dcfce7',
                                borderRadius: '5px',
                                flexShrink: 0,
                                marginTop: '2px'
                              }}>
                                {oos ? '0 шт.' : `${pStock} шт.`}
                              </div>
                              <Plus size={14} style={{ color: '#a8a29e', flexShrink: 0, marginTop: '3px' }} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {showComponentDropdown && componentSearch && filteredProducts.length === 0 && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'white', border: '1.5px solid #e7e5e4', borderRadius: '12px', padding: '16px', textAlign: 'center', fontSize: '13px', color: '#a8a29e', zIndex: 50 }}>
                        Нічого не знайдено
                      </div>
                    )}
                  </div>

                  {bundleComponents.length === 0 && (
                    <p style={{ fontSize: '12px', color: '#a8a29e', marginTop: '12px', fontStyle: 'italic' }}>
                      Додайте товари-компоненти цього набору. Якщо хоча б один закінчиться — набір піде в «Немає в наявності».
                    </p>
                  )}
                </div>
              );
            })()}
            <div>
              <label style={F.label}>Опис</label>
              <textarea rows="5" value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ ...F.input, resize: 'vertical', minHeight: '110px' }}
                onFocus={handleFocus} onBlur={handleBlur}
                placeholder="Детальний опис товару..." />
            </div>
          </div>
        </Section>

        {/* 💰 Ціни та фінанси */}
        <Section icon={DollarSign} title="Ціни та фінанси" theme="amber">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
              <div>
                <label style={F.label}>Ціна продажу ₴<span style={F.req}>*</span></label>
                <input type="number" required min="0" step="10.00" value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  style={{ ...F.input, fontWeight: 700, fontSize: '16px' }}
                  onFocus={handleFocus} onBlur={handleBlur} placeholder="0.00" />
                {formData.category_id === 'fullset' && bundleComponents.length > 0 && (
                  <p style={F.hint}>💡 Авто-сума компонентів. Можна редагувати</p>
                )}
              </div>
              <div>
                <label style={F.label}>Кількість на складі</label>
                <input type="number" min="0" value={formData.stock}
                  disabled={
                    (formData.sizes && formData.sizes.length > 0) ||
                    (formData.category_id === 'fullset' && bundleComponents.length > 0)
                  }
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  style={{
                    ...F.input,
                    opacity: ((formData.sizes && formData.sizes.length > 0) || (formData.category_id === 'fullset' && bundleComponents.length > 0)) ? 0.6 : 1,
                    cursor: ((formData.sizes && formData.sizes.length > 0) || (formData.category_id === 'fullset' && bundleComponents.length > 0)) ? 'not-allowed' : 'auto',
                    background: (formData.category_id === 'fullset' && bundleComponents.length > 0) ? '#f0fdf4' : undefined,
                    fontWeight: (formData.category_id === 'fullset' && bundleComponents.length > 0) ? 700 : undefined,
                    color: (formData.category_id === 'fullset' && bundleComponents.length > 0 && formData.stock === 0) ? '#dc2626' : '#16a34a',
                  }}
                  onFocus={handleFocus} onBlur={handleBlur}
                  placeholder="0" />
                {formData.sizes && formData.sizes.length > 0 && (
                  <p style={F.hint}>Розраховується з розмірів</p>
                )}
                {formData.category_id === 'fullset' && bundleComponents.length > 0 && (
                  <p style={F.hint}>⚡ Мінімум серед компонентів</p>
                )}
              </div>
              <div>
                <label style={F.label}>Закупівельна ціна ₴</label>
                <input type="number" min="0" step="10.00" value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  style={F.input} onFocus={handleFocus} onBlur={handleBlur}
                  placeholder="0.00" />
                {formData.category_id === 'fullset' && bundleComponents.length > 0 && (
                  <p style={F.hint}>💡 Авто-сума компонентів. Можна редагувати</p>
                )}
              </div>
            </div>

            {margin !== null && formData.cost_price && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px', borderRadius: '10px',
                background: margin > 0 ? '#f0fdf4' : '#fef2f2',
                border: `1.5px solid ${margin > 0 ? '#bbf7d0' : '#fecaca'}`,
              }}>
                <TrendingUp style={{ width: '16px', height: '16px', color: margin > 0 ? '#16a34a' : '#dc2626', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917' }}>
                  Маржа:&nbsp;
                  <span style={{ color: margin > 0 ? '#15803d' : '#dc2626' }}>{margin > 0 ? '+' : ''}{margin.toFixed(0)} ₴</span>
                  {marginPct !== null && <span style={{ color: '#a8a29e', fontWeight: 400, marginLeft: '4px' }}>({marginPct}%)</span>}
                </span>
              </div>
            )}
          </div>
        </Section>


        {/* Sizes / Colors */}
        <Section icon={Ruler} title="Варіанти (розміри або кольори)" theme="emerald">
          <div className="flex flex-col space-y-4">

            {/* Toggle: Size or Color */}
            <div className="flex flex-col gap-2 pb-2 border-b border-stone-100">
              <span className="text-xs uppercase font-bold tracking-widest text-[#524f25]">Тип варіантів</span>
              <div className="inline-flex rounded-xl overflow-hidden border border-stone-200 w-fit bg-stone-50 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => { setFormData({ ...formData, variant_type: 'size', sizes: [] }); setSizeInput(''); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 20px', borderRadius: '8px',
                    fontSize: '14px', fontWeight: 600, border: 'none',
                    cursor: 'pointer', transition: 'all 0.2s',
                    backgroundColor: formData.variant_type !== 'color' ? '#524f25' : 'transparent',
                    color: formData.variant_type !== 'color' ? '#fff' : '#78716c',
                    boxShadow: formData.variant_type !== 'color' ? '0 2px 8px rgba(82,79,37,0.3)' : 'none',
                  }}
                >
                  📏 Розміри
                </button>
                <button
                  type="button"
                  onClick={() => { setFormData({ ...formData, variant_type: 'color', sizes: [] }); setSizeInput(''); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 20px', borderRadius: '8px',
                    fontSize: '14px', fontWeight: 600, border: 'none',
                    cursor: 'pointer', transition: 'all 0.2s',
                    backgroundColor: formData.variant_type === 'color' ? '#524f25' : 'transparent',
                    color: formData.variant_type === 'color' ? '#fff' : '#78716c',
                    boxShadow: formData.variant_type === 'color' ? '0 2px 8px rgba(82,79,37,0.3)' : 'none',
                  }}
                >
                  🎨 Кольори
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {formData.variant_type === 'color' ? (
                <input
                  type="text"
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  placeholder="Введіть колір"
                  className="flex-1 min-w-[150px] sm:max-w-[200px] px-4 py-2.5 bg-white rounded-lg border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 transition-all font-medium text-stone-800"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddSize(e); }}
                />
              ) : (
              <select
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                className="flex-1 min-w-[150px] sm:max-w-[200px] px-4 py-2.5 bg-white rounded-lg border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-stone-400/50 transition-all font-medium text-stone-800 appearance-none"
              >
                <option value="">Оберіть розмір...</option>
                {SIZE_OPTIONS.map(opt => (
                  <option key={opt} value={opt} disabled={formData.sizes.some(s => s.name === opt)}>
                    {opt}
                  </option>
                ))}
              </select>
              )}
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
                className="w-full sm:w-auto bg-[#524f25] hover:bg-[#63602f] text-white px-5 py-2.5 rounded-lg font-semibold tracking-wide transition-all shadow-sm whitespace-nowrap disabled:opacity-50"
                disabled={!sizeInput}
              >
                Додати
              </button>
            </div>
            {formData.sizes.length > 0 && (
              <div className="space-y-2 pt-2">
                {formData.sizes.sort((a, b) => {
                  if (formData.variant_type === 'color') {
                    return a.name.localeCompare(b.name);
                  }
                  return SIZE_OPTIONS.indexOf(a.name) - SIZE_OPTIONS.indexOf(b.name);
                }).map(size => (
                  <div key={size.name} className="flex flex-wrap sm:flex-nowrap items-center justify-between bg-white border border-stone-200 pl-4 pr-1 py-2 rounded-lg text-sm font-semibold text-stone-700 shadow-sm transition-all hover:border-stone-400 gap-2">
                    <div className="flex items-center space-x-4 flex-1 min-w-[120px]">
                      <span className="min-w-[90px] text-stone-900 border-r border-stone-100 pr-2 truncate">{size.name}</span>
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
            
            <div style={{ paddingTop: '20px', borderTop: '1.5px solid #f5f5f4', marginTop: '8px' }}>
              <label style={F.label}>Заміри виробу (для лінійки)</label>
              <textarea
                rows="4"
                value={formData.measurements || ''}
                onChange={(e) => setFormData({ ...formData, measurements: e.target.value })}
                style={{ ...F.input, resize: 'vertical', minHeight: '90px' }}
                onFocus={handleFocus} onBlur={handleBlur}
                placeholder="Довжина - 50 см, Ширина - 30 см..."
              />
              <p style={F.hint}>Текст показується клієнтам при натисканні на іконку лінійки.</p>
            </div>
          </div>
        </Section>

        {/* Filters */}
        <Section icon={Palette} title="Характеристики для фільтрів" theme="purple">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Стать */}
            <div>
              <label style={F.label}>Стать</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                style={{ ...F.input, appearance: 'none', cursor: 'pointer', maxWidth: '320px' }}
                onFocus={handleFocus} onBlur={handleBlur}
              >
                <option value="">Не обрано</option>
                <option value="Хлопчик">Хлопчик</option>
                <option value="Дівчинка">Дівчинка</option>
                <option value="Унісекс">Унісекс</option>
              </select>
            </div>

            {/* Колір */}
            <div>
              <label style={F.label}>Колір (оберіть один або декілька)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {['Молочний', 'Рожевий/пудра', 'Сірий', 'Беж/коричневий', 'Гірчичний', 'Блакитний', 'Інші кольори'].map((color) => (
                  <CheckboxChip
                    key={color}
                    label={color}
                    checked={formData.color.includes(color)}
                    onChange={(e) => {
                      const newColors = e.target.checked
                        ? [...formData.color, color]
                        : formData.color.filter(c => c !== color);
                      setFormData({ ...formData, color: newColors });
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Вік */}
            <div>
              <label style={F.label}>Вік</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {['0-1 місяць', '0-3 місяці', '1-3 місяці', '3-6 місяців', '6-9 місяців', '9-12 місяців', '12-18 місяців', '2 роки'].map((age) => (
                  <CheckboxChip
                    key={age}
                    label={age}
                    checked={formData.age.includes(age)}
                    onChange={(e) => {
                      const newAges = e.target.checked
                        ? [...formData.age, age]
                        : formData.age.filter(a => a !== age);
                      setFormData({ ...formData, age: newAges });
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Матеріал */}
            <div>
              <label style={F.label}>Матеріал (оберіть один або декілька)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {['Бавовна', 'Фланель', 'Муслін', 'Непромокаюча', 'Інтерлок', 'Футер', 'Перфорація'].map((mat) => (
                  <CheckboxChip
                    key={mat}
                    label={mat}
                    checked={formData.material ? formData.material.includes(mat) : false}
                    onChange={(e) => {
                      const currentMaterial = formData.material || [];
                      const newMaterials = e.target.checked
                        ? [...currentMaterial, mat]
                        : currentMaterial.filter(m => m !== mat);
                      setFormData({ ...formData, material: newMaterials });
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Особливості моделі (одяг) */}
            <div>
              <label style={F.label}>Особливості моделі — Одяг (оберіть одну або декілька)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {[
                  'З боді', 'З сорочкою', 'З шапочкою', 'Без шапочки',
                  'Короткий рукав', 'Довгий рукав',
                  'Пісочник', 'Ромпер',
                  'Шапочка-вузлик', 'Чепчик',
                  'Костюм', 'Сукня', 'Футболка/шорти', 'Лонгслів/штани'
                ].map((feat) => (
                  <CheckboxChip
                    key={feat}
                    label={feat}
                    checked={formData.features ? formData.features.includes(feat) : false}
                    onChange={(e) => {
                      const currentFeatures = formData.features || [];
                      const newFeatures = e.target.checked
                        ? [...currentFeatures, feat]
                        : currentFeatures.filter(f => f !== feat);
                      setFormData({ ...formData, features: newFeatures });
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Особливості моделі (аксесуари та пустушки) */}
            <div style={{ paddingTop: '20px', borderTop: '1px dashed #e7e5e4' }}>
              <label style={{ ...F.label, color: '#9333ea' }}>Аксесуари (оберіть одну або декілька)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {[
                  'Пустушки', 'Прорізувачі', 'Контейнери', 'Ланцюжки для пустушок'
                ].map((feat) => (
                  <CheckboxChip
                    key={feat}
                    label={feat}
                    color="#9333ea"
                    checked={formData.features ? formData.features.includes(feat) : false}
                    onChange={(e) => {
                      const currentFeatures = formData.features || [];
                      const newFeatures = e.target.checked
                        ? [...currentFeatures, feat]
                        : currentFeatures.filter(f => f !== feat);
                      setFormData({ ...formData, features: newFeatures });
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Toggles */}
        <Section icon={Settings} title="Відображення та статус" theme="rose">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <CheckboxChip
              label="Опубліковано на сайті"
              color="#e11d48"
              checked={formData.is_published}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
            />
            <CheckboxChip
              label="Популярні товари (головна сторінка)"
              color="#e11d48"
              checked={formData.is_new}
              onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
            />
            <CheckboxChip
              label="Ідеальне поєднання (головна сторінка)"
              color="#524f25"
              checked={formData.is_combo}
              onChange={(e) => setFormData({ ...formData, is_combo: e.target.checked })}
            />
            <CheckboxChip
              label="Готові образи (головна сторінка)"
              color="#c77dba"
              checked={formData.is_outfit}
              onChange={(e) => setFormData({ ...formData, is_outfit: e.target.checked })}
            />
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ ...F.label, marginBottom: 0 }}>SEO Заголовок (Title)</label>
                <button
                  type="button"
                  onClick={() => {
                    const colorSuffix = formData.color && formData.color.length > 0 ? ` (${formData.color[0]})` : '';
                    setFormData({ ...formData, seo_title: `${formData.name}${colorSuffix}` });
                    toast.success('Заголовок згенеровано');
                  }}
                  style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Згенерувати автоматично
                </button>
              </div>
              <input
                type="text"
                value={formData.seo_title}
                onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                style={F.input} onFocus={handleFocus} onBlur={handleBlur}
                placeholder="Назва товару (Колір)"
              />
              <p style={F.hint}>Головний заголовок для Google. Має бути унікальним для кожного товару.</p>
            </div>
            <div>
              <label style={F.label}>SEO Ключові слова (через кому)</label>
              <input
                type="text"
                value={formData.meta_keywords}
                onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                style={F.input} onFocus={handleFocus} onBlur={handleBlur}
                placeholder="напр., дитячий одяг, боді для малюка, подарунок"
              />
              <p style={F.hint}>Допомагає Google зрозуміти тематику товару.</p>
            </div>
            <div>
              <label style={F.label}>SEO Опис (Description)</label>
              <textarea
                rows="3"
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                style={{ ...F.input, resize: 'vertical', minHeight: '80px' }}
                onFocus={handleFocus} onBlur={handleBlur}
                placeholder="Короткий привабливий текст для результатів пошуку..."
              />
              <p style={F.hint}>Відображається під назвою в Google. До 160 символів.</p>
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
              className="w-full sm:w-auto px-6 py-4 rounded-md font-bold tracking-wide transition-all shadow-sm border border-stone-200 hover:bg-stone-50 flex items-center justify-center text-stone-700 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={saving || !isDirty()}
              className="w-full sm:w-auto px-8 py-4 rounded-md font-bold tracking-wide transition-all shadow-md hover:-translate-y-1 flex items-center justify-center text-lg shadow-black/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
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
