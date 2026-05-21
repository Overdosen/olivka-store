'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import OrderRow from './OrderRow';

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">{label}</p>
      <p className="text-sm text-stone-700">{value}</p>
    </div>
  );
}

export default function ClientModal({ client, onClose, onUpdateStatus, onUpdateTracking, onImageClick }) {
  const clientOrders = client._orders || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(28,25,23,0.45)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        className="bg-[#faf9f6] rounded-lg w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
      >
        {/* Шапка */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${client.isGuest ? 'bg-amber-500 text-white' : 'bg-stone-800 text-white'}`}>
              {(client.full_name || client.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-stone-800">{client.full_name || 'Без імені'}</h3>
                {client.isGuest && (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                    Гість
                  </span>
                )}
                {client.isMissingProfile && (
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-wider">
                    Без профілю
                  </span>
                )}
              </div>
              <p className="text-sm text-stone-400">{client.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition p-1">
            <X size={20} />
          </button>
        </div>

        {/* Контакти */}
        <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-stone-100">
          <InfoItem label="Телефон" value={client.phone_ua || clientOrders[0]?.phone || '—'} />
          <InfoItem label="Реєстрація" value={new Date(client.created_at).toLocaleDateString('uk-UA')} />
        </div>

        {/* Замовлення */}
        <div className="p-4 md:p-6">
          <h4 className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4">
            Замовлення ({clientOrders.length})
          </h4>
          {clientOrders.length === 0 ? (
            <p className="text-stone-400 text-sm text-center py-4">Замовлень немає</p>
          ) : (
            <div className="flex flex-col gap-3">
              {clientOrders.map(order => (
                <OrderRow 
                  key={order.id} 
                  order={order} 
                  onUpdateStatus={onUpdateStatus} 
                  onUpdateTracking={onUpdateTracking} 
                  onImageClick={onImageClick} 
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
