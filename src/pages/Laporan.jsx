import { useAuth } from '../hooks/useAuth'
import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Download, Store, Calendar, Info, RefreshCw } from 'lucide-react'
import api from '../api/auth'
import * as XLSX from 'xlsx-js-style'
import MobileLayout from '../components/MobileLayout'
import { useAlert } from '../context/AlertContext'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import React from 'react'

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const getLocalDateString = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().split('T')[0]
}
const fRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
const addDays = (dateStr, n) => {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().split('T')[0]
}
const formatTanggal = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

/* ─── Demo fallback data ───────────────────────────────────────────────────── */
const buildDemoData = (tanggal) => {
  const seed = new Date(tanggal + 'T00:00:00').getDate()
  const v = 0.88 + (seed % 22) * 0.01
  const grossSales     = Math.round(19500000 * v)
  const discounts      = Math.round(925000 * v)
  const refunds        = Math.round(185000 * v)
  const netSales       = grossSales - discounts - refunds
  const gratuity       = Math.round(netSales * 0.05)
  const tax            = Math.round(netSales * 0.11)
  const rounding       = seed % 2 === 0 ? -250 : 250
  const totalCollected = netSales + gratuity + tax + rounding

  const menuDetail = [
    { nama: 'Nasi Goreng Spesial',  sku: 'FD-001', kategori: 'Makanan',     harga_jual: 45000,  total_terjual: Math.round(64*v),  total_pendapatan: Math.round(2880000*v)  },
    { nama: 'Ayam Geprek Crispy',   sku: 'FD-002', kategori: 'Makanan',     harga_jual: 42000,  total_terjual: Math.round(55*v),  total_pendapatan: Math.round(2310000*v)  },
    { nama: 'Mie Goreng Seafood',   sku: 'FD-003', kategori: 'Makanan',     harga_jual: 38000,  total_terjual: Math.round(44*v),  total_pendapatan: Math.round(1672000*v)  },
    { nama: 'Sate Ayam (10 tusuk)', sku: 'FD-004', kategori: 'Makanan',     harga_jual: 35000,  total_terjual: Math.round(28*v),  total_pendapatan: Math.round(980000*v)   },
    { nama: 'Es Kopi Susu',         sku: 'DK-001', kategori: 'Minuman',     harga_jual: 22000,  total_terjual: Math.round(90*v),  total_pendapatan: Math.round(1980000*v)  },
    { nama: 'Teh Tarik',            sku: 'DK-002', kategori: 'Minuman',     harga_jual: 15000,  total_terjual: Math.round(64*v),  total_pendapatan: Math.round(960000*v)   },
    { nama: 'Jus Alpukat',          sku: 'DK-003', kategori: 'Minuman',     harga_jual: 25000,  total_terjual: Math.round(48*v),  total_pendapatan: Math.round(1200000*v)  },
    { nama: 'Air Mineral',          sku: 'DK-004', kategori: 'Minuman',     harga_jual: 8000,   total_terjual: Math.round(96*v),  total_pendapatan: Math.round(768000*v)   },
    { nama: 'Tote Bag NC',          sku: 'MC-001', kategori: 'Merchandise', harga_jual: 85000,  total_terjual: Math.round(18*v),  total_pendapatan: Math.round(1530000*v)  },
    { nama: 'Tumbler NC 500ml',     sku: 'MC-002', kategori: 'Merchandise', harga_jual: 185000, total_terjual: Math.round(13*v),  total_pendapatan: Math.round(2405000*v)  },
  ]
  const metodePembayaran = [
    { metode: 'BCA QR',    grup: 'Digital', jumlah_transaksi: Math.round(42*v), total: Math.round(7350000*v) },
    { metode: 'GoPay',     grup: 'Digital', jumlah_transaksi: Math.round(29*v), total: Math.round(4640000*v) },
    { metode: 'OVO',       grup: 'Digital', jumlah_transaksi: Math.round(18*v), total: Math.round(2970000*v) },
    { metode: 'Dana',      grup: 'Digital', jumlah_transaksi: Math.round(11*v), total: Math.round(1485000*v) },
    { metode: 'Cash',      grup: 'Tunai',   jumlah_transaksi: Math.round(34*v), total: Math.round(4420000*v) },
    { metode: 'Debit BCA', grup: 'Kartu',   jumlah_transaksi: Math.round(8*v),  total: Math.round(1960000*v) },
    { metode: 'Visa/MC',   grup: 'Kartu',   jumlah_transaksi: Math.round(4*v),  total: Math.round(1400000*v) },
  ]
  const categorySales = [
    { kategori: 'Makanan',     warna: 'amber',  items_sold: Math.round(191*v), items_refunded: Math.round(4*v) },
    { kategori: 'Minuman',     warna: 'blue',   items_sold: Math.round(298*v), items_refunded: Math.round(2*v) },
    { kategori: 'Merchandise', warna: 'purple', items_sold: Math.round(31*v),  items_refunded: Math.round(1*v) },
  ]
  return {
    tanggal, grossSales, discounts, refunds, netSales, gratuity, tax, rounding, totalCollected,
    total_pesanan: Math.round(146*v),
    aov: Math.round(netSales / Math.round(146*v)),
    menu_detail: menuDetail,
    metode_pembayaran: metodePembayaran,
    category_sales: categorySales,
    _isDemo: true,
  }
}

/* ─── Transform real API response ─────────────────────────────────────────── */
const transformApiData = (apiData, tanggal) => {
  const netSales   = Number(apiData.pendapatan || 0)
  const discounts  = Number(apiData.total_diskon || 0)
  const grossSales = netSales + discounts
  const refunds = 0, gratuity = 0, tax = 0, rounding = 0
  const totalCollected = netSales + gratuity + tax + rounding

  const menuDetail = (apiData.menu_detail || []).map((m, i) => ({
    ...m,
    sku: m.sku || ('ITEM-' + String(i + 1).padStart(3, '0')),
    kategori: m.kategori || 'Lainnya',
  }))

  const grupMap = { cash: 'Tunai', tunai: 'Tunai', qris: 'Digital' }
  const metodePembayaran = (apiData.metode_pembayaran || []).map(m => ({
    ...m, grup: grupMap[m.metode?.toLowerCase()] || 'Digital',
  }))

  const catMap = {}
  menuDetail.forEach(m => {
    const c = m.kategori
    if (!catMap[c]) catMap[c] = { kategori: c, items_sold: 0, items_refunded: 0, warna: 'gray' }
    catMap[c].items_sold += Number(m.total_terjual || 0)
  })
  const warnaCat = { Makanan: 'amber', Minuman: 'blue', Merchandise: 'purple' }
  Object.values(catMap).forEach(c => { c.warna = warnaCat[c.kategori] || 'gray' })

  return {
    tanggal, grossSales, discounts, refunds, netSales, gratuity, tax, rounding, totalCollected,
    total_pesanan: Number(apiData.total_pesanan || 0),
    aov: Number(apiData.aov || 0),
    menu_detail: menuDetail,
    metode_pembayaran: metodePembayaran,
    category_sales: Object.values(catMap),
    _isDemo: false,
  }
}

/* ─── CatChip ─────────────────────────────────────────────────────────────── */
const CatChip = ({ kategori, warna }) => {
  const cls = {
    amber:  'bg-amber-50 text-amber-700 border-amber-200',
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    gray:   'bg-gray-50 text-gray-600 border-gray-200',
  }[warna || 'gray']
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${cls}`}>
      {kategori}
    </span>
  )
}

/* ─── SummaryRow ─────────────────────────────────────────────────────────── */
const SummaryRow = ({ label, value, isTotal, isNegative, isHighlight, note }) => (
  <div className={`flex justify-between items-center py-3.5 px-4 border-b border-gray-50 last:border-0 ${
    isTotal     ? 'bg-gradient-to-r from-[#14532d] to-[#d4af37] rounded-xl text-white font-black mt-1' :
    isHighlight ? 'bg-emerald-50/70 border border-emerald-100 rounded-xl font-bold' :
                  'hover:bg-gray-50/60 transition-colors'
  }`}>
    <span className={`text-sm ${isTotal ? 'text-white/90' : isHighlight ? 'text-[#14532d]' : 'text-gray-600'}`}>
      {label}
      {note && <span className="ml-1.5 text-[10px] font-normal text-gray-400 italic">{note}</span>}
    </span>
    <span className={`text-sm font-bold tabular-nums ${
      isTotal     ? 'text-white text-base' :
      isNegative  ? 'text-red-500' :
      isHighlight ? 'text-[#14532d]' :
                    'text-gray-800'
    }`}>
      {isNegative && value !== 0 ? ('– ' + fRp(Math.abs(value))) : fRp(value)}
    </span>
  </div>
)

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function Laporan() {
  const { user } = useAuth()
  const { showAlert } = useAlert()
  const [tanggal,  setTanggal]  = useState(getLocalDateString())
  const [outlet,   setOutlet]   = useState('semua')
  const [loading,  setLoading]  = useState(false)
  const [data,     setData]     = useState(null)
  const [itemMode, setItemMode] = useState('income')

  const fetchData = useCallback(async (tgl) => {
    setLoading(true)
    try {
      const res = await api.get('/laporan/ringkasan', { params: { tanggal: tgl } })
      setData(transformApiData(res.data, tgl))
    } catch {
      setData(buildDemoData(tgl))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(tanggal) }, []) // eslint-disable-line

  const handlePrev = () => { const t = addDays(tanggal, -1); setTanggal(t); fetchData(t) }
  const handleNext = () => { const t = addDays(tanggal, 1); if (t <= getLocalDateString()) { setTanggal(t); fetchData(t) } }
  const handleDateChange = (e) => { if (!e.target.value) return; setTanggal(e.target.value); fetchData(e.target.value) }

  /* Derived */
  const sortedItems = data
    ? [...(data.menu_detail || [])].sort((a, b) =>
        itemMode === 'income'
          ? Number(b.total_pendapatan) - Number(a.total_pendapatan)
          : Number(b.total_terjual)    - Number(a.total_terjual))
    : []
  const totalItemIncome = sortedItems.reduce((s, m) => s + Number(m.total_pendapatan), 0)
  const totalItemQty    = sortedItems.reduce((s, m) => s + Number(m.total_terjual), 0)

  const buildPaymentGroups = (methods) => {
    const grupOrder = ['Digital', 'Tunai', 'Kartu']
    const map = {}
    ;(methods || []).forEach(m => { const g = m.grup || 'Digital'; if (!map[g]) map[g] = []; map[g].push(m) })
    return grupOrder.filter(g => map[g]).map(g => ({ grup: g, methods: map[g] }))
  }
  const paymentGroups    = data ? buildPaymentGroups(data.metode_pembayaran) : []
  const grandTrxTotal    = (data?.metode_pembayaran || []).reduce((s, m) => s + Number(m.jumlah_transaksi), 0)
  const grandAmountTotal = (data?.metode_pembayaran || []).reduce((s, m) => s + Number(m.total), 0)

  const catIncome = {}
  ;(data?.menu_detail || []).forEach(m => { catIncome[m.kategori] = (catIncome[m.kategori] || 0) + Number(m.total_pendapatan) })
  const totalCatSold = (data?.category_sales || []).reduce((s, c) => s + c.items_sold, 0)
  const totalCatRef  = (data?.category_sales || []).reduce((s, c) => s + c.items_refunded, 0)

  /* Export */
  const handleExport = async () => {
    if (!data) return showAlert('Tidak ada data', 'Gagal', 'error')
    const d = data
    const cc = (val, s) => ({ v: val, t: typeof val === 'number' ? 'n' : 's', s })
    const sH   = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '14532d' } }, alignment: { horizontal: 'center' } }
    const sB   = { font: { bold: true } }
    const sC   = { numFmt: 'Rp #,##0', alignment: { horizontal: 'right' } }
    const sCB  = { font: { bold: true }, numFmt: 'Rp #,##0', alignment: { horizontal: 'right' }, fill: { fgColor: { rgb: 'F5F0E8' } } }
    const sCt  = { alignment: { horizontal: 'center' } }
    const rows = [
      [cc('LAPORAN KASIR POS HARIAN – New Chapter', { font: { bold: true, sz: 14, color: { rgb: '14532d' } }, alignment: { horizontal: 'center' } }), '', '', '', ''],
      [], [cc('Tanggal', sB), formatTanggal(d.tanggal)], [],
      [cc('1. RINGKASAN PENJUALAN (Sales Summary)', { font: { bold: true, sz: 12, color: { rgb: '14532d' } } })],
      [cc('Keterangan', sH), cc('Jumlah (Rp)', sH)],
      ['Gross Sales', cc(d.grossSales, sC)], ['Discounts', cc(-d.discounts, sC)], ['Refunds', cc(-d.refunds, sC)],
      [cc('Net Sales', sB), cc(d.netSales, sCB)],
      ['Gratuity / Service Charge', cc(d.gratuity, sC)], ['Tax (PPN 11%)', cc(d.tax, sC)], ['Rounding', cc(d.rounding, sC)],
      [cc('Total Collected', sB), cc(d.totalCollected, sCB)], [],
      [cc('2. PENJUALAN PER ITEM (Item Sales)', { font: { bold: true, sz: 12, color: { rgb: '14532d' } } })],
      [cc('Nama Item', sH), cc('SKU', sH), cc('Kategori', sH), cc('Penjualan (Rp)', sH), cc('Qty', sH)],
    ]
    sortedItems.forEach(m => rows.push([m.nama, m.sku || '-', m.kategori || '-', cc(Number(m.total_pendapatan), sC), cc(Number(m.total_terjual), sCt)]))
    rows.push([cc('TOTAL', sB), '', '', cc(totalItemIncome, sCB), cc(totalItemQty, { ...sB, ...sCt })], [])
    rows.push([cc('3. METODE PEMBAYARAN (Payment Methods)', { font: { bold: true, sz: 12, color: { rgb: '14532d' } } })])
    rows.push([cc('Metode', sH), cc('Jumlah Transaksi', sH), cc('Total Diterima (Rp)', sH)])
    paymentGroups.forEach(g => {
      rows.push([cc('▸ ' + g.grup, { font: { bold: true } }), '', ''])
      g.methods.forEach(m => rows.push(['  ' + m.metode, cc(m.jumlah_transaksi, sCt), cc(Number(m.total), sC)]))
    })
    rows.push([cc('TOTAL', sB), cc(grandTrxTotal, { ...sB, ...sCt }), cc(grandAmountTotal, sCB)], [])
    rows.push([cc('4. PENJUALAN PER KATEGORI (Category Sales)', { font: { bold: true, sz: 12, color: { rgb: '14532d' } } })])
    rows.push([cc('Kategori', sH), cc('Items Terjual', sH), cc('Items Refund', sH), cc('Net Terjual', sH), cc('Gross Sales (Rp)', sH)])
    ;(d.category_sales || []).forEach(c => rows.push([
      c.kategori, cc(c.items_sold, sCt), cc(c.items_refunded, sCt),
      cc(c.items_sold - c.items_refunded, sCt), cc(catIncome[c.kategori] || 0, sC),
    ]))
    rows.push([cc('TOTAL', sB), cc(totalCatSold, { ...sB, ...sCt }), cc(totalCatRef, { ...sB, ...sCt }), cc(totalCatSold - totalCatRef, { ...sB, ...sCt }), cc(Object.values(catIncome).reduce((a, b) => a + b, 0), sCB)])

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 32 }, { wch: 14 }, { wch: 16 }, { wch: 20 }, { wch: 14 }]
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Kasir Harian')
    try {
      if (Capacitor.isNativePlatform()) {
        const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
        const path = 'Laporan-Kasir-' + d.tanggal + '.xlsx'
        const result = await Filesystem.writeFile({ path, data: base64, directory: Directory.Cache })
        await Share.share({ title: path, url: result.uri, dialogTitle: 'Simpan / Bagikan Laporan' })
      } else {
        const fileName = 'Laporan-Kasir-' + d.tanggal + '.xlsx'
        const wbArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([wbArray], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })

        if (window.showSaveFilePicker) {
          try {
            const handle = await window.showSaveFilePicker({
              suggestedName: fileName,
              types: [{
                description: 'Excel File',
                accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
              }]
            })
            const writable = await handle.createWritable()
            await writable.write(blob)
            await writable.close()
            return
          } catch (e) {
            if (e.name === 'AbortError') return // User cancelled
            console.error(e)
          }
        }

        // Fallback
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 100)
      }
    } catch (err) { showAlert('Gagal export: ' + err.message, 'Error', 'error') }
  }

  return (
    <MobileLayout activeMenu="Laporan">
      {/* Desktop header */}
      <div className="hidden lg:flex justify-between items-center px-6 xl:px-10 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-emerald-100/50 shadow-sm">
        <div>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#14532d] to-[#b8860b]">
            Laporan Kasir Harian
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">Ringkasan penjualan, item, pembayaran &amp; kategori per hari</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-[#14532d]">Halo, {user?.username}</p>
            <p className="text-xs text-[#d4af37]">Laporan Kasir</p>
          </div>
          <div className="w-12 h-12 rounded-full shadow-md flex items-center justify-center text-white font-bold text-xl bg-gradient-to-br from-[#14532d] to-[#d4af37] border-2 border-white">
            {(user?.username || 'K')[0].toUpperCase()}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 xl:p-10 overflow-y-auto bg-[#F9FAFB]">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* ── FILTER BAR ── */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <div className="flex flex-wrap gap-4 items-end">
              {/* Outlet */}
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  <Store size={12} className="inline mr-1" />Outlet / Cabang
                </label>
                <div className="relative">
                  <select value={outlet} onChange={e => setOutlet(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 pr-9 rounded-xl border border-gray-200 focus:outline-none focus:border-[#14532d] font-medium text-gray-700 bg-gray-50 text-sm">
                    <option value="semua">Semua Outlet</option>
                    <option value="pusat">New Chapter – Pusat</option>
                    <option value="selatan">New Chapter – Selatan</option>
                    <option value="timur">New Chapter – Timur</option>
                  </select>
                  <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
                </div>
              </div>
              <div className="hidden sm:block w-px h-10 bg-gray-100 self-end mb-0.5" />
              {/* Date */}
              <div className="flex-1 min-w-[220px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  <Calendar size={12} className="inline mr-1" />Tanggal Transaksi
                </label>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrev}
                    className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-[#14532d] hover:text-white hover:border-[#14532d] transition-all"
                    aria-label="Hari sebelumnya">
                    <ChevronLeft size={16} />
                  </button>
                  <input type="date" value={tanggal} onChange={handleDateChange} max={getLocalDateString()}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#14532d] font-medium text-gray-700 bg-gray-50 text-sm" />
                  <button onClick={handleNext} disabled={tanggal >= getLocalDateString()}
                    className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-[#14532d] hover:text-white hover:border-[#14532d] transition-all disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="Hari berikutnya">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              {/* Actions */}
              <div className="flex gap-2 self-end">
                <button onClick={() => fetchData(tanggal)} disabled={loading}
                  className="h-[42px] px-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#14532d] to-[#d4af37] shadow-md hover:-translate-y-0.5 transition-all text-sm flex items-center gap-2 disabled:opacity-60">
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                  {loading ? 'Memuat...' : 'Tampilkan'}
                </button>
                {data && (
                  <button onClick={handleExport}
                    className="h-[42px] px-4 rounded-xl font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all text-sm flex items-center gap-2">
                    <Download size={15} />Export Excel
                  </button>
                )}
              </div>
            </div>
            {data && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-50">
                <p className="text-sm font-bold text-[#14532d]">{formatTanggal(tanggal)}</p>
                {data._isDemo && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-bold">
                    <Info size={10} className="inline mr-1" />Data Demo
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-48">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#14532d]" />
                <p className="text-sm text-gray-400 font-medium">Memuat laporan...</p>
              </div>
            </div>
          )}

          {data && !loading && (
            <>
              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Net Sales',       value: fRp(data.netSales),       grad: 'from-[#14532d] to-[#d4af37]', txt: 'text-white', sub: 'text-white/70' },
                  { label: 'Total Collected', value: fRp(data.totalCollected), grad: 'from-emerald-600 to-teal-600',  txt: 'text-white', sub: 'text-white/70' },
                  { label: 'Transaksi',       value: data.total_pesanan.toLocaleString('id-ID') + ' trx', plain: true },
                  { label: 'Avg Order Value', value: fRp(data.aov),             plain: true },
                ].map((k, i) => (
                  <div key={i} className={`rounded-2xl p-4 shadow-sm ${k.plain ? 'bg-white border border-gray-100' : ('bg-gradient-to-br ' + k.grad)}`}>
                    <p className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${k.plain ? 'text-gray-400' : k.sub}`}>{k.label}</p>
                    <p className={`text-lg font-black leading-tight ${k.plain ? 'text-[#14532d]' : k.txt}`}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* ══ SECTION 1 – RINGKASAN PENJUALAN ══ */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-black text-lg text-[#14532d] mb-1 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center border border-emerald-200">1</span>
                  Ringkasan Penjualan
                  <span className="text-sm font-normal text-gray-400 ml-1">Sales Summary</span>
                </h2>
                <p className="text-xs text-gray-400 font-medium mb-5 ml-9">Total penjualan kotor hingga total yang diterima</p>
                <div className="divide-y divide-gray-50">
                  <SummaryRow label="Gross Sales"                value={data.grossSales}  />
                  <SummaryRow label="Discounts"                  value={data.discounts}   isNegative note={data._isDemo ? '' : '(dari API)'} />
                  <SummaryRow label="Refunds"                    value={data.refunds}     isNegative note={data._isDemo ? '' : '(belum ada di API)'} />
                  <SummaryRow label="Net Sales"                  value={data.netSales}    isHighlight />
                  <SummaryRow label="Gratuity / Service Charge"  value={data.gratuity}    note={data._isDemo ? '' : '(belum ada di API)'} />
                  <SummaryRow label="Tax (PPN 11%)"              value={data.tax}         note={data._isDemo ? '' : '(belum ada di API)'} />
                  <SummaryRow label="Rounding"                   value={data.rounding}    isNegative={data.rounding < 0} note={data._isDemo ? '' : '(belum ada di API)'} />
                </div>
                <div className="mt-3">
                  <SummaryRow label="Total Collected" value={data.totalCollected} isTotal />
                </div>
              </div>

              {/* ══ SECTION 2 – PENJUALAN PER ITEM ══ */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div>
                    <h2 className="font-black text-lg text-[#14532d] flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center border border-purple-200">2</span>
                      Penjualan per Item
                      <span className="text-sm font-normal text-gray-400 ml-1">Item Sales</span>
                    </h2>
                    <p className="text-xs text-gray-400 font-medium mt-1 ml-9">{sortedItems.length} menu · diurutkan dari tertinggi</p>
                  </div>
                  <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
                    <button onClick={() => setItemMode('income')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${itemMode === 'income' ? 'bg-white text-[#14532d] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                      Nominal (Rp)
                    </button>
                    <button onClick={() => setItemMode('qty')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${itemMode === 'qty' ? 'bg-white text-[#14532d] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                      Kuantitas (Qty)
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#14532d] text-white text-xs">
                        <th className="px-4 py-3 rounded-tl-xl font-semibold uppercase tracking-wider">Nama Item</th>
                        <th className="px-4 py-3 font-semibold uppercase tracking-wider">SKU</th>
                        <th className="px-4 py-3 font-semibold uppercase tracking-wider">Kategori</th>
                        <th className="px-4 py-3 rounded-tr-xl font-semibold uppercase tracking-wider text-right">
                          {itemMode === 'income' ? 'Penjualan (Rp)' : 'Qty Terjual'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedItems.map((m, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors">
                          <td className="px-4 py-3.5 text-sm font-semibold text-gray-800">{m.nama}</td>
                          <td className="px-4 py-3.5 text-xs font-mono text-gray-400">{m.sku || '-'}</td>
                          <td className="px-4 py-3.5">
                            <CatChip kategori={m.kategori}
                              warna={m.kategori === 'Makanan' ? 'amber' : m.kategori === 'Minuman' ? 'blue' : m.kategori === 'Merchandise' ? 'purple' : 'gray'} />
                          </td>
                          <td className="px-4 py-3.5 text-right text-sm font-bold text-emerald-700 tabular-nums">
                            {itemMode === 'income' ? fRp(m.total_pendapatan) : Number(m.total_terjual).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-emerald-50 border-t-2 border-emerald-200">
                        <td colSpan={3} className="px-4 py-4 text-sm font-black text-emerald-900 text-right">Total Keseluruhan</td>
                        <td className="px-4 py-4 text-right text-sm font-black text-emerald-700 tabular-nums">
                          {itemMode === 'income' ? fRp(totalItemIncome) : totalItemQty.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* ══ SECTION 3 – METODE PEMBAYARAN ══ */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-black text-lg text-[#14532d] mb-1 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 text-xs font-black flex items-center justify-center border border-teal-200">3</span>
                  Metode Pembayaran
                  <span className="text-sm font-normal text-gray-400 ml-1">Payment Methods</span>
                </h2>
                <p className="text-xs text-gray-400 font-medium mb-5 ml-9">Dikelompokkan per tipe pembayaran</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#14532d] text-white text-xs">
                        <th className="px-4 py-3 rounded-tl-xl font-semibold uppercase tracking-wider">Metode Pembayaran</th>
                        <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Jumlah Transaksi</th>
                        <th className="px-4 py-3 rounded-tr-xl font-semibold uppercase tracking-wider text-right">Total Diterima</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentGroups.map((g, gi) => (
                        <React.Fragment key={gi}>
                          <tr className="bg-emerald-50/60 border-l-[3px] border-[#14532d]">
                            <td colSpan={3} className="px-4 py-2.5 text-xs font-black text-[#14532d] uppercase tracking-wider">
                              {g.grup === 'Digital' ? '📱' : g.grup === 'Tunai' ? '💵' : '💳'} {g.grup} Payments
                            </td>
                          </tr>
                          {g.methods.map((m, mi) => (
                            <tr key={mi} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3.5 pl-8 text-sm text-gray-700 font-medium">↳ {m.metode}</td>
                              <td className="px-4 py-3.5 text-right text-sm font-semibold text-gray-600 tabular-nums">
                                {Number(m.jumlah_transaksi).toLocaleString('id-ID')} trx
                              </td>
                              <td className="px-4 py-3.5 text-right text-sm font-bold text-emerald-700 tabular-nums">{fRp(m.total)}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-emerald-50 border-t-2 border-emerald-200">
                        <td className="px-4 py-4 text-sm font-black text-emerald-900">Total Keseluruhan</td>
                        <td className="px-4 py-4 text-right text-sm font-black text-emerald-700 tabular-nums">{grandTrxTotal.toLocaleString('id-ID')} trx</td>
                        <td className="px-4 py-4 text-right text-sm font-black text-emerald-700 tabular-nums">{fRp(grandAmountTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* ══ SECTION 4 – PENJUALAN PER KATEGORI ══ */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-black text-lg text-[#14532d] mb-1 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 text-xs font-black flex items-center justify-center border border-amber-200">4</span>
                  Penjualan per Kategori
                  <span className="text-sm font-normal text-gray-400 ml-1">Category Sales</span>
                </h2>
                <p className="text-xs text-gray-400 font-medium mb-5 ml-9">Jumlah item terjual dan refund per kategori menu</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#14532d] text-white text-xs">
                        <th className="px-4 py-3 rounded-tl-xl font-semibold uppercase tracking-wider">Kategori</th>
                        <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Items Terjual</th>
                        <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Items Refund</th>
                        <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Net Terjual</th>
                        <th className="px-4 py-3 rounded-tr-xl font-semibold uppercase tracking-wider text-right">Gross Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.category_sales || []).map((c, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors">
                          <td className="px-4 py-3.5"><CatChip kategori={c.kategori} warna={c.warna} /></td>
                          <td className="px-4 py-3.5 text-right text-sm font-semibold text-gray-700 tabular-nums">{c.items_sold.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3.5 text-right text-sm font-semibold text-red-400 tabular-nums">
                            {c.items_refunded > 0 ? ('– ' + c.items_refunded.toLocaleString('id-ID')) : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-right text-sm font-bold text-gray-800 tabular-nums">{(c.items_sold - c.items_refunded).toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3.5 text-right text-sm font-bold text-emerald-700 tabular-nums">{fRp(catIncome[c.kategori] || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-emerald-50 border-t-2 border-emerald-200">
                        <td className="px-4 py-4 text-sm font-black text-emerald-900">Total</td>
                        <td className="px-4 py-4 text-right text-sm font-black text-emerald-700 tabular-nums">{totalCatSold.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-4 text-right text-sm font-black text-red-400 tabular-nums">
                          {totalCatRef > 0 ? ('– ' + totalCatRef.toLocaleString('id-ID')) : '—'}
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-black text-emerald-700 tabular-nums">{(totalCatSold - totalCatRef).toLocaleString('id-ID')}</td>
                        <td className="px-4 py-4 text-right text-sm font-black text-emerald-700 tabular-nums">
                          {fRp(Object.values(catIncome).reduce((a, b) => a + b, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl">
                  <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    <span className="font-bold">Catatan:</span> Gross Profit per kategori memerlukan data COGS (Harga Pokok Penjualan) per item.
                    Tambahkan field <code className="bg-amber-100 px-1 rounded text-[11px]">hpp</code> pada setiap menu di Manajemen Menu agar bisa dihitung otomatis.
                  </p>
                </div>
              </div>

              <div className="text-center py-4">
                <p className="text-xs text-gray-400">
                  © {new Date().getFullYear()} New Chapter · Laporan Kasir Harian
                   ·  {data._isDemo ? '⚠️ Data Demo (API tidak tersedia)' : '✅ Data Live dari Server'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </MobileLayout>
  )
}
