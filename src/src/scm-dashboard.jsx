import React, { useState, useMemo, useEffect, useContext, useCallback, useRef, createContext } from "react";
import {
  LayoutGrid,
  TrendingUp,
  ShoppingCart,
  Factory,
  Map,
  Target,
  BarChart3,
  ShieldAlert,
  Leaf,
  Upload,
  Download,
  RotateCcw,
  Bell,
  Search,
  ChevronRight,
  ArrowLeft,
  Plus,
  Trash2,
  Info,
  Star,
  Wallet,
  Award,
  FileText,
  FileDown,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Lightbulb,
  Package,
  Sparkles,
  Pencil,
  Building2,
  ClipboardList,
  Truck,
  Phone,
  Mail,
  Ban,
  X,
  FileSignature,
  Percent,
  Activity,
  Calculator,
  Menu,
} from "lucide-react";
import {
  LineChart,
  Line,
  ComposedChart,
  Area,
  BarChart,
  Bar,
  Cell,
  ReferenceDot,
  ReferenceLine,
  ScatterChart,
  Scatter,
  ZAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif";

const MODULES = [
  {
    id: "demand",
    name: "Demand & Inventory Planning",
    desc: "Peramalan permintaan, EOQ, safety stock, dan reorder point.",
    icon: TrendingUp,
    accent: "#2FA9A3",
  },
  {
    id: "procurement",
    name: "Procurement & Sourcing",
    desc: "Evaluasi supplier, total cost of ownership, dan manajemen PO.",
    icon: ShoppingCart,
    accent: "#E2A63B",
  },
  {
    id: "production",
    name: "Production Planning & Control",
    desc: "MRP, capacity planning, dan penjadwalan produksi.",
    icon: Factory,
    accent: "#4C86D6",
  },
  {
    id: "network",
    name: "Supply Chain Network Design",
    desc: "Center of gravity, penempatan gudang, dan rute distribusi.",
    icon: Map,
    accent: "#7B7FE0",
  },
  {
    id: "lean",
    name: "Lean & Six Sigma",
    desc: "OEE, DPMO, sigma level, dan pemetaan pemborosan proses.",
    icon: Target,
    accent: "#A57FD9",
  },
  {
    id: "analytics",
    name: "Digital Supply Chain / SCM Analytics",
    desc: "Dashboard KPI gabungan dan analisis tren lintas modul.",
    icon: BarChart3,
    accent: "#34B8B0",
  },
  {
    id: "risk",
    name: "Risk Management",
    desc: "Matriks risiko, FMEA, dan rencana kontinuitas rantai pasok.",
    icon: ShieldAlert,
    accent: "#E2685A",
  },
  {
    id: "sustainability",
    name: "Sustainability / Green Supply Chain",
    desc: "Jejak karbon, reverse logistics, dan efisiensi sumber daya.",
    icon: Leaf,
    accent: "#4FAE7A",
  },
];

const KPIS = [
  { label: "OTIF", value: "—", unit: "%" },
  { label: "Inventory Turnover", value: "—", unit: "x" },
  { label: "Lead Time Rata-rata", value: "—", unit: "hari" },
  { label: "Risiko Aktif", value: "—", unit: "" },
];

const SERVICE_LEVELS = [
  { label: "90%", z: 1.28 },
  { label: "95%", z: 1.65 },
  { label: "97.5%", z: 1.96 },
  { label: "99%", z: 2.33 },
];

const READY_MODULES = ["demand", "procurement", "production", "network", "lean", "analytics", "risk", "sustainability"];

const RISK_ZONES = [
  { max: 4, label: "Rendah", color: "#4FAE7A" },
  { max: 9, label: "Sedang", color: "#E2A63B" },
  { max: 15, label: "Tinggi", color: "#E28A3B" },
  { max: 25, label: "Kritis", color: "#E2685A" },
];

const RISK_CATEGORIES = ["Supplier", "Logistik", "IT/Sistem", "Tenaga Kerja", "Lainnya"];

const RESILIENCE_BANDS = [
  { min: 0, label: "Rentan", color: "#E2685A" },
  { min: 40, label: "Sedang", color: "#E2A63B" },
  { min: 60, label: "Baik", color: "#4C86D6" },
  { min: 80, label: "Tangguh", color: "#4FAE7A" },
];

function resilienceBand(score) {
  return [...RESILIENCE_BANDS].reverse().find((b) => score >= b.min) || RESILIENCE_BANDS[0];
}

// ---------- Laporan: Context & Generator Narasi ----------

const ReportContext = createContext(null);

function useReportSync(id, data) {
  const ctx = useContext(ReportContext);
  const serialized = JSON.stringify(data);
  useEffect(() => {
    if (ctx) ctx.updateReport(id, JSON.parse(serialized));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, serialized]);
}

function ReportProvider({ children }) {
  const [reportData, setReportData] = useState({});
  const updateReport = useCallback((id, data) => {
    setReportData((prev) => ({ ...prev, [id]: data }));
  }, []);
  return (
    <ReportContext.Provider value={{ reportData, updateReport }}>{children}</ReportContext.Provider>
  );
}

function useReportData() {
  const ctx = useContext(ReportContext);
  return ctx ? ctx.reportData : {};
}

// ---------- Persistensi Data (localStorage) ----------

const STORAGE_PREFIX = "meridian_scm_v1:";

function readPersisted(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => readPersisted(key, initialValue));

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(state));
    } catch {
      // storage penuh / tidak tersedia — abaikan secara diam-diam
    }
  }, [key, state]);

  return [state, setState];
}

function clearAllPersistedData() {
  if (typeof window === "undefined") return;
  const keys = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(STORAGE_PREFIX)) keys.push(k);
  }
  keys.forEach((k) => window.localStorage.removeItem(k));
}

function exportAllPersistedData() {
  if (typeof window === "undefined") return {};
  const data = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(STORAGE_PREFIX)) {
      try {
        data[k.slice(STORAGE_PREFIX.length)] = JSON.parse(window.localStorage.getItem(k));
      } catch {
        // lewati entri yang korup
      }
    }
  }
  return data;
}

function importAllPersistedData(data) {
  if (typeof window === "undefined" || !data || typeof data !== "object") return;
  Object.entries(data).forEach(([key, value]) => {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch {
      // lewati entri yang gagal ditulis
    }
  });
}

function toCSVRow(fields) {
  return fields
    .map((f) => {
      const s = String(f ?? "");
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    })
    .join(",");
}

function downloadCSV(filename, csvContent) {
  if (typeof window === "undefined") return;
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const SEVERITY_META = {
  baik: { label: "Baik", color: "#4FAE7A", icon: CheckCircle2 },
  perhatian: { label: "Perlu Perhatian", color: "#E2A63B", icon: AlertTriangle },
  kritis: { label: "Kritis", color: "#E2685A", icon: AlertOctagon },
};

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function rupiah(v) {
  return `Rp ${Math.round(num(v)).toLocaleString("id-ID")}`;
}
function pearsonCorrelation(xs, ys) {
  const n = xs.length;
  if (n < 2) return 0;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let numerator = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    numerator += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : numerator / den;
}

// Tiap fungsi mengembalikan { severity, ringkasan, masalah, penyebab, solusi, metrics }
const REPORT_NARRATIVES = {
  demand: (s) => {
    const mape = num(s.mape);
    const severity = mape <= 10 ? "baik" : mape <= 20 ? "perhatian" : "kritis";
    return {
      severity,
      metrics: [
        { label: "Forecast Periode Berikutnya", value: s.forecastNext ?? "—", unit: "unit" },
        { label: "MAPE (Akurasi Peramalan)", value: s.mape ?? "—", unit: "%" },
        { label: "EOQ", value: s.eoqUnit ?? "—", unit: "unit" },
        { label: "Safety Stock", value: s.safetyStock ?? "—", unit: "unit" },
        { label: "Reorder Point", value: s.rop ?? "—", unit: "unit" },
        { label: "Service Level", value: s.serviceLevel ?? "—", unit: "" },
        { label: "SKU Kelas A (Prioritas)", value: s.abcxyzCountA ?? "—", unit: "SKU" },
        { label: "SKU Kelas CZ (Kandidat Reduksi)", value: s.abcxyzCountCZ ?? "—", unit: "SKU" },
      ],
      ringkasan: `Model peramalan permintaan saat ini menghasilkan tingkat kesalahan (MAPE) sebesar ${s.mape ?? "—"}%, dengan kuantitas pemesanan ekonomis (EOQ) ${s.eoqUnit ?? "—"} unit dan target service level ${s.serviceLevel ?? "—"}. Dari ${s.skuCount ?? "—"} SKU yang dikelola, ${s.abcxyzCountA ?? 0} tergolong kelas A (prioritas nilai tertinggi)${s.abcxyzCountCZ ? ` dan ${s.abcxyzCountCZ} tergolong kelas CZ (nilai rendah & fluktuatif, kandidat evaluasi ulang)` : ""}.`,
      masalah:
        severity === "baik"
          ? "Tidak ditemukan masalah signifikan pada akurasi peramalan; deviasi antara data aktual dan forecast berada dalam batas wajar."
          : severity === "perhatian"
          ? "Akurasi peramalan (MAPE) berada pada level sedang, berpotensi menyebabkan kelebihan atau kekurangan stok pada beberapa periode."
          : "Akurasi peramalan rendah — MAPE melebihi 20% menandakan pola permintaan sulit diprediksi dengan metode saat ini, meningkatkan risiko stockout maupun overstock.",
      penyebab:
        severity === "baik"
          ? "Metode peramalan yang dipilih (moving average / exponential smoothing) sudah cukup merepresentasikan pola data historis yang relatif stabil."
          : "Kemungkinan penyebab: fluktuasi permintaan musiman/tidak reguler yang belum tertangkap oleh metode peramalan sederhana, jumlah data historis yang terbatas, atau adanya faktor eksternal (promosi, event, gangguan pasar) yang tidak dimodelkan.",
      solusi:
        severity === "baik"
          ? "Pertahankan proses monitoring berkala dan perbarui parameter (periode MA / alpha ES) seiring bertambahnya data aktual."
          : "Pertimbangkan menambah panjang data historis, mencoba metode alternatif (mis. exponential smoothing dengan alpha berbeda, atau model musiman), serta menaikkan buffer safety stock pada SKU dengan variabilitas tinggi hingga akurasi membaik.",
    };
  },

  procurement: (s) => {
    const severity = s.weightTotal === 100 ? (num(s.bestRecommendationScore) >= 70 ? "baik" : "perhatian") : "kritis";
    return {
      severity,
      metrics: [
        { label: "Total Bobot Kriteria", value: s.weightTotal ?? "—", unit: "%" },
        { label: "Supplier Skor Tertinggi", value: s.topScoring ?? "—", unit: "" },
        { label: "Skor Evaluasi", value: s.topScoringValue ?? "—", unit: "" },
        { label: "Supplier TCO Terendah", value: s.cheapestTco ?? "—", unit: "" },
        { label: "TCO Terendah", value: s.cheapestTcoValue != null ? rupiah(s.cheapestTcoValue) : "—", unit: "" },
        { label: "Rekomendasi Akhir", value: s.bestRecommendation ?? "—", unit: "" },
      ],
      ringkasan: `Berdasarkan evaluasi multi-kriteria dan Total Cost of Ownership, supplier yang direkomendasikan adalah ${s.bestRecommendation ?? "—"} dengan skor gabungan ${s.bestRecommendationScore ?? "—"}.`,
      masalah:
        s.weightTotal !== 100
          ? `Total bobot kriteria evaluasi supplier saat ini ${s.weightTotal ?? 0}%, belum mencapai 100% sehingga hasil skoring supplier berpotensi bias/tidak proporsional.`
          : severity === "baik"
          ? "Tidak ada masalah berarti — supplier terpilih unggul baik dari sisi kualitatif maupun biaya kepemilikan total."
          : "Selisih skor antar-supplier relatif tipis, sehingga keputusan akhir masih memiliki tingkat ketidakpastian.",
      penyebab:
        s.weightTotal !== 100
          ? "Bobot kriteria (harga, kualitas, ketepatan kirim, pelayanan) belum disesuaikan agar totalnya tepat 100%."
          : "Kemungkinan penyebab selisih tipis: harga penawaran antar-supplier berdekatan, atau komponen TCO (freight, tarif, defect) saling menutupi keunggulan masing-masing supplier.",
      solusi:
        s.weightTotal !== 100
          ? "Sesuaikan kembali bobot tiap kriteria pada tab Evaluasi Supplier hingga totalnya tepat 100% agar hasil skoring valid."
          : "Lakukan negosiasi lanjutan atau uji coba pengiriman skala kecil (pilot order) dengan 2 supplier teratas sebelum menetapkan kontrak jangka panjang, serta pertimbangkan diversifikasi sumber pasokan untuk mitigasi risiko.",
    };
  },

  production: (s) => {
    const overRatio = s.totalWorkCenters ? num(s.overloadedCount) / num(s.totalWorkCenters) : 0;
    const severity =
      num(s.mrpPastDue) > 0 || num(s.mrpShortfallPeriods) > 0 || overRatio > 0.3
        ? "kritis"
        : overRatio > 0
        ? "perhatian"
        : "baik";
    return {
      severity,
      metrics: [
        { label: "Kebutuhan Past Due (MRP)", value: s.mrpPastDue ?? "—", unit: "unit" },
        { label: "Periode di Bawah Safety Stock", value: s.mrpShortfallPeriods ?? 0, unit: "periode" },
        { label: "Work Center Overload", value: `${s.overloadedCount ?? 0} / ${s.totalWorkCenters ?? 0}`, unit: "" },
        { label: "Rata-rata Utilisasi Kapasitas", value: s.avgUtilization ?? "—", unit: "%" },
        { label: "Aturan Penjadwalan", value: (s.schedulingRule || "").toUpperCase(), unit: "" },
        { label: "Rata-rata Keterlambatan", value: s.avgTardiness ?? "—", unit: "" },
        { label: "Jumlah Job Terlambat", value: s.numTardy ?? "—", unit: "job" },
      ],
      ringkasan: `Perencanaan produksi menunjukkan rata-rata utilisasi kapasitas ${s.avgUtilization ?? "—"}% dengan ${s.overloadedCount ?? 0} dari ${s.totalWorkCenters ?? 0} work center dalam kondisi overload, dan ${s.numTardy ?? 0} job berpotensi terlambat pada penjadwalan aturan ${(s.schedulingRule || "").toUpperCase()}.`,
      masalah:
        severity === "baik"
          ? "Kapasitas produksi mencukupi dan tidak ada kebutuhan material yang jatuh tempo di luar horizon perencanaan (past due)."
          : `${num(s.mrpPastDue) > 0 ? `Terdapat kebutuhan material sebesar ${s.mrpPastDue} unit yang past due (lead time tidak mencukupi). ` : ""}${num(s.mrpShortfallPeriods) > 0 ? `${s.mrpShortfallPeriods} periode diproyeksikan berada di bawah safety stock buffer (hasil impor dari Demand Planning). ` : ""}${overRatio > 0 ? `${s.overloadedCount} work center melebihi kapasitas tersedia, berisiko menghambat pemenuhan target produksi.` : ""}`,
      penyebab:
        severity === "baik"
          ? "Perencanaan MRP dan kapasitas saat ini sudah selaras dengan lead time dan kebutuhan produksi."
          : "Penyebab umum: lead time pemesanan lebih panjang dari waktu yang tersedia sebelum kebutuhan (past due), safety stock buffer dari Demand Planning belum diimbangi jadwal produksi, permintaan produksi melonjak melebihi kapasitas terpasang, atau alokasi work center tidak seimbang antar lini.",
      solusi:
        severity === "baik"
          ? "Pertahankan monitoring rutin MRP dan kapasitas setiap periode perencanaan berikutnya."
          : "Pertimbangkan mempercepat proses pengadaan (kurangi lead time / gunakan safety lead time), memajukan Planned Order Release pada periode yang berada di bawah safety stock buffer, menambah shift atau kapasitas mesin pada work center overload, dan mengevaluasi ulang urutan penjadwalan (coba aturan EDD untuk menekan keterlambatan bila prioritas due date tinggi).",
    };
  },

  network: (s) => {
    const severity = "baik";
    return {
      severity,
      metrics: [
        { label: "Titik Center of Gravity", value: `(${s.cogX ?? "—"}, ${s.cogY ?? "—"})`, unit: "" },
        { label: "Lokasi Gudang Terbaik", value: s.bestCandidate ?? "—", unit: "" },
        { label: "Total Biaya Lokasi Terbaik", value: s.bestCandidateCost != null ? rupiah(s.bestCandidateCost) : "—", unit: "" },
        { label: "Jarak Rute Distribusi", value: s.routeTotal != null ? Number(s.routeTotal).toFixed(1) : "—", unit: "km" },
        { label: "Jumlah Titik Rute", value: s.routeStops ?? "—", unit: "titik" },
      ],
      ringkasan: `Titik pusat gravitasi permintaan berada di koordinat (${s.cogX ?? "—"}, ${s.cogY ?? "—"}), dengan ${s.bestCandidate ?? "—"} sebagai kandidat lokasi gudang dengan total biaya terendah (${s.bestCandidateCost != null ? rupiah(s.bestCandidateCost) : "—"}).`,
      masalah:
        "Perlu dipastikan lokasi gudang terpilih tidak hanya optimal secara biaya transportasi, namun juga mempertimbangkan faktor non-kuantitatif seperti aksesibilitas jalan, ketersediaan tenaga kerja, dan regulasi zonasi.",
      penyebab:
        "Model center of gravity dan evaluasi kandidat lokasi murni berbasis jarak, volume, dan biaya tetap — belum memperhitungkan variabel kualitatif di lapangan.",
      solusi:
        "Lakukan survei lapangan (site visit) untuk kandidat lokasi dengan biaya terendah sebelum keputusan final, dan bandingkan dengan rute distribusi eksisting untuk memastikan efisiensi total end-to-end.",
    };
  },

  lean: (s) => {
    const oeeVal = num(s.oeeValue);
    const severity = oeeVal >= 85 ? "baik" : oeeVal >= 60 ? "perhatian" : "kritis";
    return {
      severity,
      metrics: [
        { label: "OEE", value: s.oeeValue ?? "—", unit: "%" },
        { label: "Klasifikasi OEE", value: s.oeeClass ?? "—", unit: "" },
        { label: "DPMO", value: s.dpmo ?? "—", unit: "" },
        { label: "Sigma Level (Long-Term)", value: s.sigma ?? "—", unit: "σ" },
        { label: "Sigma Level (Short-Term)", value: s.sigmaShortTerm ?? "—", unit: "σ" },
        { label: "Waste Dominan", value: s.topWaste ?? "—", unit: "" },
        { label: "Skor Total Waste", value: `${s.totalWasteScore ?? 0} / ${s.maxWasteScore ?? 0}`, unit: "" },
        { label: "Process Cycle Efficiency (VSM)", value: s.pce ?? "—", unit: "%" },
      ],
      ringkasan: `Overall Equipment Effectiveness (OEE) tercatat ${s.oeeValue ?? "—"}% (${s.oeeClass ?? "—"}), dengan sigma level proses ${s.sigma ?? "—"}σ dan jenis pemborosan paling dominan adalah "${s.topWaste ?? "—"}".`,
      masalah:
        severity === "baik"
          ? "Efektivitas peralatan berada pada kelas dunia (world class); tidak ada indikasi masalah signifikan pada availability, performance, maupun quality."
          : severity === "perhatian"
          ? "OEE berada di level rata-rata industri, mengindikasikan masih ada potensi kehilangan produktivitas pada salah satu komponen (availability/performance/quality)."
          : "OEE berada di bawah standar industri, menandakan kerugian produktivitas signifikan dari downtime, kecepatan proses, atau tingkat cacat produk.",
      penyebab:
        severity === "baik"
          ? "Proses produksi berjalan dengan downtime minimal, kecepatan mendekati ideal, dan tingkat cacat rendah."
          : `Penyebab utama biasanya berasal dari kombinasi downtime mesin (breakdown/setup), kecepatan aktual di bawah ideal cycle time, serta produk cacat. Pemetaan waste menunjukkan "${s.topWaste ?? "—"}" sebagai kontributor pemborosan terbesar saat ini.`,
      solusi:
        severity === "baik"
          ? "Pertahankan program preventive maintenance dan quality control yang sudah berjalan sebagai standar acuan lini lain."
          : `Fokuskan perbaikan pada penyebab pemborosan "${s.topWaste ?? "—"}" melalui root cause analysis, terapkan preventive maintenance untuk menekan downtime, dan evaluasi kembali standar kerja untuk mendekatkan performance ke cycle time ideal.`,
    };
  },

  analytics: (s) => {
    const por = num(s.por);
    const severity = por >= 90 ? "baik" : por >= 75 ? "perhatian" : "kritis";
    return {
      severity,
      metrics: [
        { label: "Perfect Order Rate", value: s.por ?? "—", unit: "%" },
        { label: "Inventory Turnover", value: s.turnover ?? "—", unit: "x" },
        { label: "DIO", value: s.dio ?? "—", unit: "hari" },
        { label: "Cash-to-Cash Cycle Time", value: s.c2c ?? "—", unit: "hari" },
        { label: "Kontributor Biaya Terbesar", value: s.topCostDriver ?? "—", unit: "" },
        { label: "Total Rasio Biaya SCM", value: s.totalCostPct != null ? Number(s.totalCostPct).toFixed(1) : "—", unit: "%" },
      ],
      ringkasan: `Perfect Order Rate saat ini ${s.por ?? "—"}%, dengan cash-to-cash cycle time ${s.c2c ?? "—"} hari. Komponen biaya rantai pasok terbesar adalah ${s.topCostDriver ?? "—"} (${s.topCostDriverPct != null ? Number(s.topCostDriverPct).toFixed(1) : "—"}% dari revenue).`,
      masalah:
        severity === "baik"
          ? "Kinerja rantai pasok gabungan berada pada level baik; Perfect Order Rate di atas 90% menandakan proses pemenuhan pesanan berjalan konsisten."
          : severity === "perhatian"
          ? "Perfect Order Rate berada di kisaran menengah, menunjukkan masih ada pesanan yang gagal memenuhi salah satu dari empat komponen (tepat waktu, lengkap, tanpa kerusakan, dokumen akurat)."
          : "Perfect Order Rate di bawah 75% — indikasi kuat adanya masalah sistemik pada proses pemenuhan pesanan yang berdampak langsung pada kepuasan pelanggan.",
      penyebab:
        severity === "baik"
          ? "Keempat komponen perfect order (ketepatan waktu, kelengkapan, kondisi barang, akurasi dokumen) terjaga konsisten di seluruh proses."
          : "Kemungkinan penyebab: keterlambatan pengiriman dari komponen lead time, kesalahan pemenuhan kuantitas, kerusakan barang selama distribusi, atau ketidakakuratan dokumen pengiriman/faktur — perlu ditelusuri komponen mana yang paling rendah nilainya.",
      solusi:
        severity === "baik"
          ? "Pertahankan standar operasional saat ini dan gunakan sebagai baseline benchmark internal untuk periode berikutnya."
          : `Telusuri komponen POR dengan nilai terendah dan lakukan perbaikan proses spesifik di area tersebut. Selain itu, evaluasi kontributor biaya terbesar (${s.topCostDriver ?? "—"}) untuk peluang efisiensi biaya rantai pasok secara keseluruhan.`,
    };
  },

  risk: (s) => {
    const counts = s.riskCounts || {};
    const severity = num(counts.Kritis) > 0 ? "kritis" : num(counts.Tinggi) > 0 ? "perhatian" : "baik";
    return {
      severity,
      metrics: [
        { label: "Risiko Kritis", value: counts.Kritis ?? 0, unit: "" },
        { label: "Risiko Tinggi", value: counts.Tinggi ?? 0, unit: "" },
        { label: "Risiko Sedang", value: counts.Sedang ?? 0, unit: "" },
        { label: "Risiko Rendah", value: counts.Rendah ?? 0, unit: "" },
        { label: "Mode Kegagalan Prioritas (FMEA)", value: s.topFmea ?? "—", unit: "" },
        { label: "RPN Tertinggi", value: s.topFmeaRpn ?? "—", unit: "" },
        { label: "Sisa Eksposur Setelah Mitigasi", value: s.totalResidual != null ? rupiah(s.totalResidual) : "—", unit: "" },
      ],
      ringkasan: `Dari ${s.totalRisks ?? 0} risiko teridentifikasi, terdapat ${counts.Kritis ?? 0} risiko kritis dan ${counts.Tinggi ?? 0} risiko tinggi. Mode kegagalan dengan prioritas tertinggi (RPN) adalah "${s.topFmea ?? "—"}".`,
      masalah:
        severity === "kritis"
          ? `Ditemukan ${counts.Kritis} risiko berkategori KRITIS yang memerlukan tindakan mitigasi segera, berpotensi mengganggu kelangsungan operasional rantai pasok.`
          : severity === "perhatian"
          ? `Terdapat ${counts.Tinggi} risiko berkategori tinggi yang perlu direncanakan mitigasinya sebelum eskalasi menjadi kritis.`
          : "Profil risiko rantai pasok berada dalam kendali; tidak ada risiko pada kategori tinggi maupun kritis.",
      penyebab:
        severity === "baik"
          ? "Kombinasi probabilitas dan dampak dari seluruh risiko teridentifikasi masih berada pada zona aman (rendah-sedang)."
          : "Risiko pada kategori tinggi/kritis umumnya berasal dari kombinasi probabilitas kejadian yang cukup sering dengan dampak finansial/operasional yang besar — seperti ketergantungan pada supplier tunggal, jalur distribusi rawan gangguan, atau sistem kritis tanpa redundansi.",
      solusi:
        severity === "baik"
          ? "Lanjutkan pemantauan berkala matriks risiko dan FMEA sebagai bagian dari proses continuous improvement."
          : `Prioritaskan rencana kontinuitas untuk risiko kategori tinggi/kritis, khususnya mode kegagalan "${s.topFmea ?? "—"}" (RPN ${s.topFmeaRpn ?? "—"}). Sisa eksposur finansial setelah mitigasi saat ini ${s.totalResidual != null ? rupiah(s.totalResidual) : "—"} — evaluasi apakah efektivitas mitigasi perlu ditingkatkan.`,
    };
  },

  sustainability: (s) => {
    const severity = num(s.netBenefit) < 0 ? "perhatian" : num(s.circularityIndex) < 40 ? "perhatian" : "baik";
    return {
      severity,
      metrics: [
        { label: "Total Emisi CO2e", value: s.totalEmission != null ? Number(s.totalEmission).toLocaleString("id-ID", { maximumFractionDigits: 0 }) : "—", unit: "kg" },
        { label: "Moda Kontributor Emisi Terbesar", value: s.topEmissionMode ?? "—", unit: "" },
        { label: "Return Rate", value: s.returnRate != null ? Number(s.returnRate).toFixed(1) : "—", unit: "%" },
        { label: "Net Benefit Reverse Logistics", value: s.netBenefit != null ? rupiah(s.netBenefit) : "—", unit: "" },
        { label: "Circularity Index", value: s.circularityIndex != null ? Number(s.circularityIndex).toFixed(1) : "—", unit: "%" },
      ],
      ringkasan: `Total jejak karbon transportasi tercatat ${s.totalEmission != null ? Number(s.totalEmission).toLocaleString("id-ID", { maximumFractionDigits: 0 }) : "—"} kg CO2e, didominasi moda ${s.topEmissionMode ?? "—"}. Circularity index sumber daya berada di ${s.circularityIndex != null ? Number(s.circularityIndex).toFixed(1) : "—"}%.`,
      masalah:
        num(s.netBenefit) < 0
          ? "Proses reverse logistics saat ini menghasilkan net benefit negatif — biaya pembuangan unit tidak terpulihkan lebih besar dari nilai yang berhasil dipulihkan."
          : num(s.circularityIndex) < 40
          ? "Tingkat sirkularitas sumber daya (material recovery & waste diversion) masih rendah, menandakan sebagian besar material dan limbah belum dikelola secara berkelanjutan."
          : "Kinerja keberlanjutan rantai pasok berada pada level baik dari sisi pemulihan nilai retur maupun sirkularitas sumber daya.",
      penyebab:
        num(s.netBenefit) < 0
          ? "Kemungkinan penyebab: proporsi unit tidak recoverable terlalu tinggi, persentase nilai terpulihkan rendah, atau biaya pembuangan per unit yang mahal."
          : num(s.circularityIndex) < 40
          ? "Rendahnya penggunaan material daur ulang dan/atau minimnya limbah yang dialihkan dari TPA dibanding total limbah yang dihasilkan."
          : `Moda transportasi ${s.topEmissionMode ?? "—"} berkontribusi paling besar terhadap emisi karena intensitas emisi per ton-km yang lebih tinggi dibanding moda lain.`,
      solusi:
        num(s.netBenefit) < 0
          ? "Tingkatkan proses sortir untuk memperbesar proporsi unit recoverable, negosiasikan biaya pembuangan yang lebih efisien, atau evaluasi kualitas produk untuk menekan tingkat retur di sumbernya."
          : num(s.circularityIndex) < 40
          ? "Tingkatkan porsi material daur ulang dalam proses produksi dan perluas program pengalihan limbah dari TPA (daur ulang, kompos, atau kemitraan dengan pengelola limbah)."
          : `Pertimbangkan pengalihan sebagian volume dari moda ${s.topEmissionMode ?? "—"} ke moda dengan intensitas emisi lebih rendah (mis. kereta atau kapal untuk jarak jauh) guna menekan jejak karbon lebih lanjut.`,
    };
  },
};

function riskZone(score) {
  return RISK_ZONES.find((z) => score <= z.max) || RISK_ZONES[RISK_ZONES.length - 1];
}

const WASTE_TYPES = [
  { id: "transportation", label: "Transportasi", desc: "Perpindahan material/produk yang tidak perlu" },
  { id: "inventory", label: "Inventori Berlebih", desc: "Stok melebihi kebutuhan aktual" },
  { id: "motion", label: "Gerakan Tidak Perlu", desc: "Gerakan operator yang tidak menambah nilai" },
  { id: "waiting", label: "Waktu Tunggu", desc: "Idle time menunggu proses, material, atau informasi" },
  { id: "overproduction", label: "Produksi Berlebih", desc: "Memproduksi lebih dari yang diminta" },
  { id: "overprocessing", label: "Proses Berlebih", desc: "Proses yang tidak menambah nilai bagi pelanggan" },
  { id: "defects", label: "Cacat / Rework", desc: "Produk cacat yang perlu diperbaiki atau dibuang" },
];

const SCHEDULE_RULES = [
  { id: "fcfs", label: "FCFS" },
  { id: "spt", label: "SPT" },
  { id: "edd", label: "EDD" },
];

// ---------- Reusable UI ----------

function Glass({ children, className = "", style = {} }) {
  return (
    <div
      className={`backdrop-blur-2xl border ${className}`}
      style={{
        backgroundColor: "rgba(255,255,255,0.55)",
        borderColor: "rgba(255,255,255,0.7)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 30px rgba(31,41,55,0.08)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Garis aksen tipis bergradasi — motif "meridian" berulang, menandai identitas
// modul (warna accent) di titik-titik kunci: header kartu, bawah tab, dsb.
function MeridianLine({ accent, className = "" }) {
  return (
    <div
      className={`h-px w-full ${className}`}
      style={{ background: `linear-gradient(90deg, ${accent} 0%, ${accent}55 35%, transparent 80%)` }}
    />
  );
}

function FieldLabel({ children, hint }) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <label className="text-xs font-medium" style={{ color: "#4B4B4F" }}>
        {children}
      </label>
      {hint && (
        <span title={hint}>
          <Info size={12} style={{ color: "#B5B5B9" }} />
        </span>
      )}
    </div>
  );
}

function NumberInput({ value, onChange, suffix, ...props }) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2"
      style={{ backgroundColor: "rgba(255,255,255,0.7)" }}
    >
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm outline-none"
        style={{ color: "#1D1D1F" }}
        {...props}
      />
      {suffix && (
        <span className="text-xs whitespace-nowrap" style={{ color: "#9A9AA0" }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

function SectionCard({ title, subtitle, children, accent }) {
  return (
    <Glass
      className="overflow-hidden rounded-2xl p-5"
      style={{ borderTop: `2px solid ${accent}` }}
    >
      <div className="mb-4 flex items-center gap-2.5">
        <div
          className="h-4 w-[3px] shrink-0 rounded-full"
          style={{ background: `linear-gradient(180deg, ${accent}, ${accent}66)` }}
        />
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && (
            <p className="text-[11px]" style={{ color: "#9A9AA0" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
    </Glass>
  );
}

function ResultStat({ label, value, unit, highlight, accent = "#0A84FF", trend }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-3.5"
      style={{
        backgroundColor: highlight ? `${accent}1F` : "rgba(255,255,255,0.6)",
      }}
    >
      {highlight && (
        <div className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: accent }} />
      )}
      <div className="flex items-start justify-between">
        <p className="mb-1 text-[11px]" style={{ color: "#8A8A8E" }}>
          {label}
        </p>
        {trend && (
          <span
            className="text-[10px] font-semibold"
            style={{ color: trend.dir === "up" ? "#2FA9A3" : trend.dir === "down" ? "#E2685A" : "#9A9AA0" }}
          >
            {trend.dir === "up" ? "↑" : trend.dir === "down" ? "↓" : "→"} {trend.text}
          </span>
        )}
      </div>
      <p
        className="text-xl font-semibold tracking-tight"
        style={{ fontVariantNumeric: "tabular-nums", color: highlight ? accent : "#1D1D1F" }}
      >
        {value}
        {unit && (
          <span className="ml-1 text-xs font-normal" style={{ color: "#9A9AA0" }}>
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

const CLASS_COLORS = {
  A: "#2FA9A3",
  B: "#E0A82E",
  C: "#B5B5B9",
  X: "#0A84FF",
  Y: "#E0A82E",
  Z: "#E2685A",
};

function ClassBadge({ label, accent }) {
  const color = CLASS_COLORS[label] || accent;
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-semibold"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {label}
    </span>
  );
}

function DeltaBadge({ base, scenario, lowerIsBetter }) {
  const b = Number(base) || 0;
  const s = Number(scenario) || 0;
  const diff = s - b;
  const pct = b !== 0 ? (diff / Math.abs(b)) * 100 : 0;
  if (Math.abs(diff) < 0.005) {
    return (
      <span className="text-[10px] font-medium" style={{ color: "#9A9AA0" }}>
        → tetap
      </span>
    );
  }
  const isIncrease = diff > 0;
  const isGood = lowerIsBetter ? !isIncrease : isIncrease;
  const color = isGood ? "#2FA9A3" : "#E2685A";
  return (
    <span className="text-[10px] font-semibold" style={{ color }}>
      {isIncrease ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function ModuleTabs({ tabs, tab, setTab, accent }) {
  return (
    <div className="flex w-fit flex-col gap-1.5">
      <Glass className="flex w-fit gap-1 rounded-2xl p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
            style={{
              backgroundColor: tab === t.id ? "rgba(255,255,255,0.85)" : "transparent",
              color: tab === t.id ? "#1D1D1F" : "#8A8A8E",
              boxShadow: tab === t.id ? `0 2px 12px ${accent}40, inset 0 0 0 1px ${accent}33` : "none",
            }}
          >
            {t.icon && <t.icon size={14} style={{ color: tab === t.id ? accent : "#8A8A8E" }} />}
            {t.label}
          </button>
        ))}
      </Glass>
      <MeridianLine accent={accent} className="px-1" />
    </div>
  );
}

// ---------- Module 1: Demand & Inventory Planning ----------

const FORECAST_METHODS = [
  { id: "ma", label: "Moving Average" },
  { id: "es", label: "Exp. Smoothing" },
  { id: "regresi", label: "Regresi Linear" },
  { id: "holt", label: "Holt (Tren)" },
  { id: "auto", label: "Auto-Pilih" },
];

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function defaultSku(name) {
  return {
    id: makeId("sku"),
    name: name || "SKU Baru",
    method: "ma",
    maPeriod: 3,
    alpha: 0.3,
    holtAlpha: 0.3,
    holtBeta: 0.1,
    rows: [
      { period: "Jan", actual: 120 },
      { period: "Feb", actual: 135 },
      { period: "Mar", actual: 128 },
      { period: "Apr", actual: 142 },
      { period: "Mei", actual: 150 },
      { period: "Jun", actual: 138 },
    ],
    annualDemand: 12000,
    orderingCost: 150000,
    holdingCost: 2500,
    unitPrice: 25000,
    avgDailyDemand: 40,
    leadTimeDays: 7,
    demandStdDev: 8,
    serviceLevelIdx: 1,
    // --- EOQ Lanjut ---
    procurementMode: "beli", // "beli" | "produksi"
    holdingCostRatePct: 20, // dipakai saat menghitung diskon kuantitas
    discountTiers: [],
    productionRatePerDay: 80,
    // --- Safety Stock Lanjut ---
    variabilityMode: "demand", // "demand" | "demand_leadtime"
    leadTimeStdDev: 1.5,
    reviewMode: "continuous", // "continuous" | "periodic"
    reviewPeriodDays: 30,
    // --- What-If Scenario ---
    whatIf: {
      demandPct: 0, // % perubahan demand (+/-)
      leadTimeDeltaDays: 0, // hari tambahan/pengurangan lead time
      orderingCostPct: 0, // % perubahan biaya pesan
      holdingCostPct: 0, // % perubahan biaya simpan
      serviceLevelIdx: null, // null = ikuti service level baseline SKU
    },
  };
}

// Menjaga kompatibilitas mundur: SKU lama (fase sebelumnya) yang belum
// punya field baru akan otomatis dilengkapi nilai default tanpa menimpa
// data yang sudah ada.
function normalizeSku(raw) {
  const base = defaultSku(raw?.name);
  return {
    ...base,
    ...raw,
    id: raw?.id || base.id,
    rows: raw?.rows?.length ? raw.rows : base.rows,
    discountTiers: raw?.discountTiers ?? base.discountTiers,
  };
}

// ----- Mesin Peramalan (pure functions, tidak menyentuh state React) -----

function forecastMA(rows, maPeriod) {
  const n = rows.length;
  const p = Math.max(1, Number(maPeriod) || 1);
  const result = rows.map((r) => ({ ...r, forecast: null }));
  for (let i = p; i < n; i++) {
    const window = rows.slice(i - p, i).map((r) => Number(r.actual) || 0);
    const avg = window.reduce((a, b) => a + b, 0) / p;
    result[i].forecast = Number(avg.toFixed(1));
  }
  if (n >= p) {
    const window = rows.slice(n - p, n).map((r) => Number(r.actual) || 0);
    const avg = window.reduce((a, b) => a + b, 0) / p;
    result.push({ period: "Berikutnya", actual: null, forecast: Number(avg.toFixed(1)) });
  } else {
    result.push({ period: "Berikutnya", actual: null, forecast: null });
  }
  return result;
}

function forecastES(rows, alpha) {
  const n = rows.length;
  const a = Math.min(1, Math.max(0, Number(alpha) || 0));
  const result = rows.map((r) => ({ ...r, forecast: null }));
  let prevForecast = Number(rows[0]?.actual) || 0;
  for (let i = 1; i < n; i++) {
    const f = a * (Number(rows[i - 1].actual) || 0) + (1 - a) * prevForecast;
    result[i].forecast = Number(f.toFixed(1));
    prevForecast = f;
  }
  const lastActual = Number(rows[n - 1]?.actual) || 0;
  const nextF = a * lastActual + (1 - a) * prevForecast;
  result.push({ period: "Berikutnya", actual: null, forecast: Number((nextF || 0).toFixed(1)) });
  return result;
}

function forecastRegresi(rows) {
  const n = rows.length;
  if (n < 2) return rows.map((r) => ({ ...r, forecast: null })).concat([{ period: "Berikutnya", actual: null, forecast: null }]);
  const xs = rows.map((_, i) => i);
  const ys = rows.map((r) => Number(r.actual) || 0);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) * (xs[i] - meanX);
  }
  const b = den !== 0 ? num / den : 0;
  const a = meanY - b * meanX;
  const result = rows.map((r, i) => ({ ...r, forecast: Number((a + b * i).toFixed(1)) }));
  result.push({ period: "Berikutnya", actual: null, forecast: Number((a + b * n).toFixed(1)) });
  return result;
}

function forecastHolt(rows, alpha, beta) {
  const n = rows.length;
  if (n < 2) return rows.map((r) => ({ ...r, forecast: null })).concat([{ period: "Berikutnya", actual: null, forecast: null }]);
  const a = Math.min(1, Math.max(0, Number(alpha) || 0));
  const b = Math.min(1, Math.max(0, Number(beta) || 0));
  const actual = rows.map((r) => Number(r.actual) || 0);
  let level = actual[0];
  let trend = actual[1] - actual[0];
  const result = [{ ...rows[0], forecast: null }];
  for (let t = 1; t < n; t++) {
    const forecastT = level + trend;
    result.push({ ...rows[t], forecast: Number(forecastT.toFixed(1)) });
    const newLevel = a * actual[t] + (1 - a) * (level + trend);
    const newTrend = b * (newLevel - level) + (1 - b) * trend;
    level = newLevel;
    trend = newTrend;
  }
  const nextForecast = level + trend;
  result.push({ period: "Berikutnya", actual: null, forecast: Number(nextForecast.toFixed(1)) });
  return result;
}

function buildForecast(rows, methodId, params) {
  switch (methodId) {
    case "ma":
      return forecastMA(rows, params.maPeriod);
    case "es":
      return forecastES(rows, params.alpha);
    case "regresi":
      return forecastRegresi(rows);
    case "holt":
      return forecastHolt(rows, params.holtAlpha, params.holtBeta);
    default:
      return forecastMA(rows, params.maPeriod);
  }
}

function calcForecastMetrics(forecastRows) {
  const valid = forecastRows.filter(
    (r) => r.forecast !== null && r.forecast !== undefined && r.actual !== null && r.actual !== undefined
  );
  if (valid.length === 0) {
    return { mad: null, mape: null, bias: null, trackingSignal: null, residualStd: 0, n: 0 };
  }
  const errors = valid.map((r) => Number(r.actual) - Number(r.forecast));
  const absErrors = errors.map((e) => Math.abs(e));
  const mad = absErrors.reduce((a, b) => a + b, 0) / absErrors.length;
  const pct = valid.map((r) =>
    Number(r.actual) !== 0 ? Math.abs((Number(r.actual) - Number(r.forecast)) / Number(r.actual)) * 100 : 0
  );
  const mape = pct.reduce((a, b) => a + b, 0) / pct.length;
  const bias = errors.reduce((a, b) => a + b, 0);
  const trackingSignal = mad !== 0 ? bias / mad : 0;
  const variance = errors.reduce((a, e) => a + e * e, 0) / errors.length;
  const residualStd = Math.sqrt(variance);
  return {
    mad: mad.toFixed(2),
    mape: mape.toFixed(2),
    bias: bias.toFixed(1),
    trackingSignal: trackingSignal.toFixed(2),
    residualStd,
    n: valid.length,
  };
}

function runAutoSelect(rows, params) {
  const candidates = ["ma", "es", "regresi", "holt"];
  const evaluated = candidates.map((id) => {
    const forecastRows = buildForecast(rows, id, params);
    const metrics = calcForecastMetrics(forecastRows);
    return { id, forecastRows, metrics };
  });
  const withMape = evaluated.filter((e) => e.metrics.mape !== null);
  let best = withMape[0] || evaluated[0];
  withMape.forEach((e) => {
    if (Number(e.metrics.mape) < Number(best.metrics.mape)) best = e;
  });
  return {
    chosenId: best.id,
    forecastRows: best.forecastRows,
    comparison: evaluated.map((e) => ({
      id: e.id,
      label: FORECAST_METHODS.find((m) => m.id === e.id)?.label || e.id,
      mape: e.metrics.mape,
    })),
  };
}

function withConfidenceBand(forecastRows, residualStd, z = 1.96) {
  return forecastRows.map((r) => {
    if (r.forecast === null || r.forecast === undefined) {
      return { ...r, band_lower: null, band_diff: null };
    }
    const margin = z * (residualStd || 0);
    const lower = Number((r.forecast - margin).toFixed(1));
    const upper = Number((r.forecast + margin).toFixed(1));
    return { ...r, band_lower: lower, band_diff: Number((upper - lower).toFixed(1)) };
  });
}

// ----- Mesin EOQ Lanjut & Safety Stock Lanjut -----

function calcClassicEOQ(D, S, H) {
  const d = Number(D) || 0;
  const s = Number(S) || 0;
  const h = Number(H) || 1;
  const q = Math.sqrt((2 * d * s) / h);
  const ordersPerYear = q > 0 ? d / q : 0;
  const totalCost = ordersPerYear * s + (q / 2) * h;
  return { q, ordersPerYear, totalCost };
}

function calcEPQ(D, S, H, productionRatePerDay, dailyDemandRate) {
  const d = Number(D) || 0;
  const s = Number(S) || 0;
  const h = Number(H) || 1;
  const p = Number(productionRatePerDay) || 0;
  const dd = Number(dailyDemandRate) || 0;
  const feasible = p > dd;
  const ratio = feasible ? 1 - dd / p : 0.0001;
  const effectiveH = h * ratio;
  const q = effectiveH > 0 ? Math.sqrt((2 * d * s) / effectiveH) : 0;
  const maxInventory = q * ratio;
  const ordersPerYear = q > 0 ? d / q : 0;
  const totalCost = ordersPerYear * s + (maxInventory / 2) * h;
  return { q, maxInventory, ordersPerYear, totalCost, ratio, feasible };
}

function evalQuantityDiscount(D, S, holdingCostRatePct, tiers) {
  const d = Number(D) || 0;
  const s = Number(S) || 0;
  const rate = (Number(holdingCostRatePct) || 0) / 100;
  const sorted = [...tiers]
    .map((t) => ({ minQty: Number(t.minQty) || 0, price: Number(t.price) || 0 }))
    .sort((a, b) => a.minQty - b.minQty);
  const rows = sorted.map((tier, idx) => {
    const h = rate * tier.price;
    const rawEOQ = h > 0 ? Math.sqrt((2 * d * s) / h) : 0;
    const nextMin = sorted[idx + 1] ? sorted[idx + 1].minQty : Infinity;
    const feasible = rawEOQ >= tier.minQty && rawEOQ < nextMin;
    const q = feasible ? rawEOQ : tier.minQty;
    const purchaseCost = d * tier.price;
    const orderingCostTotal = q > 0 ? (d / q) * s : 0;
    const holdingCostTotal = (q / 2) * h;
    const totalCost = purchaseCost + orderingCostTotal + holdingCostTotal;
    return {
      minQty: tier.minQty,
      price: tier.price,
      q: Math.round(q),
      rawEOQ: Math.round(rawEOQ),
      feasible,
      totalCost: Math.round(totalCost),
    };
  });
  let bestIdx = -1;
  rows.forEach((r, i) => {
    if (bestIdx === -1 || r.totalCost < rows[bestIdx].totalCost) bestIdx = i;
  });
  return { rows, bestIdx };
}

function buildEoqSensitivity(D, S, H, optimalQ) {
  const d = Number(D) || 0;
  const s = Number(S) || 0;
  const h = Number(H) || 1;
  const base = Number(optimalQ) || 1;
  if (base <= 0) return [];
  const factors = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.4, 1.6, 1.8, 2];
  return factors.map((f) => {
    const q = Math.max(1, Math.round(base * f));
    const holding = (q / 2) * h;
    const ordering = q > 0 ? (d / q) * s : 0;
    return {
      q,
      holding: Number(holding.toFixed(0)),
      ordering: Number(ordering.toFixed(0)),
      total: Number((holding + ordering).toFixed(0)),
    };
  });
}

function calcSafetyStockAdvanced({ avgDailyDemand, leadTimeDays, demandStdDev, leadTimeStdDev, z, variabilityMode }) {
  const avg = Number(avgDailyDemand) || 0;
  const lt = Number(leadTimeDays) || 0;
  const sigmaD = Number(demandStdDev) || 0;
  const sigmaLT = Number(leadTimeStdDev) || 0;
  let ss;
  if (variabilityMode === "demand_leadtime") {
    const variance = lt * sigmaD * sigmaD + avg * avg * sigmaLT * sigmaLT;
    ss = z * Math.sqrt(Math.max(0, variance));
  } else {
    ss = z * sigmaD * Math.sqrt(lt);
  }
  const rop = avg * lt + ss;
  return { ss, rop };
}

function calcPeriodicReview({ avgDailyDemand, leadTimeDays, reviewPeriodDays, demandStdDev, z }) {
  const avg = Number(avgDailyDemand) || 0;
  const lt = Number(leadTimeDays) || 0;
  const T = Number(reviewPeriodDays) || 0;
  const sigmaD = Number(demandStdDev) || 0;
  const ss = z * sigmaD * Math.sqrt(lt + T);
  const orderUpTo = avg * (lt + T) + ss;
  return { ss, orderUpTo };
}

function buildSafetyTradeoff({ avgDailyDemand, leadTimeDays, demandStdDev, leadTimeStdDev, variabilityMode, holdingCost }) {
  return SERVICE_LEVELS.map((s) => {
    const { ss } = calcSafetyStockAdvanced({
      avgDailyDemand,
      leadTimeDays,
      demandStdDev,
      leadTimeStdDev,
      z: s.z,
      variabilityMode,
    });
    const cost = ss * (Number(holdingCost) || 0);
    return { label: s.label, ss: Number(ss.toFixed(0)), cost: Number(cost.toFixed(0)) };
  });
}

// ----- Skenario What-If -----

function computeWhatIfDrivers(sku, whatIf) {
  const demandMult = 1 + (Number(whatIf.demandPct) || 0) / 100;
  return {
    demandMult,
    annualDemand: (Number(sku.annualDemand) || 0) * demandMult,
    avgDailyDemand: (Number(sku.avgDailyDemand) || 0) * demandMult,
    demandStdDev: (Number(sku.demandStdDev) || 0) * demandMult,
    leadTimeDays: Math.max(0, (Number(sku.leadTimeDays) || 0) + (Number(whatIf.leadTimeDeltaDays) || 0)),
    orderingCost: (Number(sku.orderingCost) || 0) * (1 + (Number(whatIf.orderingCostPct) || 0) / 100),
    holdingCost: (Number(sku.holdingCost) || 0) * (1 + (Number(whatIf.holdingCostPct) || 0) / 100),
    serviceLevelIdx: whatIf.serviceLevelIdx ?? sku.serviceLevelIdx,
  };
}

// Model referensi What-If selalu memakai rumus EOQ klasik + safety stock
// standar (bukan EPQ/diskon) agar baseline vs skenario tetap apple-to-apple.
function buildWhatIfResult(sku, whatIf, forecastNext) {
  const d = computeWhatIfDrivers(sku, whatIf);
  const eoq = calcClassicEOQ(d.annualDemand, d.orderingCost, d.holdingCost);
  const z = SERVICE_LEVELS[d.serviceLevelIdx]?.z ?? 1.65;
  const { ss, rop } = calcSafetyStockAdvanced({
    avgDailyDemand: d.avgDailyDemand,
    leadTimeDays: d.leadTimeDays,
    demandStdDev: d.demandStdDev,
    leadTimeStdDev: sku.leadTimeStdDev,
    z,
    variabilityMode: sku.variabilityMode,
  });
  return {
    forecastNext: Number(((Number(forecastNext) || 0) * d.demandMult).toFixed(0)),
    annualDemand: Number(d.annualDemand.toFixed(0)),
    leadTimeDays: Number(d.leadTimeDays.toFixed(1)),
    eoqUnit: Number(eoq.q.toFixed(0)),
    eoqOrders: Number(eoq.ordersPerYear.toFixed(1)),
    eoqTotalCost: Number(eoq.totalCost.toFixed(0)),
    safetyStock: Number(ss.toFixed(0)),
    rop: Number(rop.toFixed(0)),
  };
}

const WHATIF_PRESETS = [
  { label: "Demand Naik 20%", patch: { demandPct: 20 } },
  { label: "Demand Turun 15%", patch: { demandPct: -15 } },
  { label: "Lead Time Molor 5 Hari", patch: { leadTimeDeltaDays: 5 } },
  { label: "Biaya Pesan Naik 30%", patch: { orderingCostPct: 30 } },
];

// ----- Klasifikasi ABC-XYZ -----

function meanOf(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function stdDevOf(arr) {
  const n = arr.length;
  if (n < 2) return 0;
  const m = meanOf(arr);
  const variance = arr.reduce((s, x) => s + (x - m) * (x - m), 0) / n;
  return Math.sqrt(variance);
}

// Ambang klasifikasi standar: ABC berdasar % kumulatif nilai pemakaian
// tahunan (Pareto 80/95/100); XYZ berdasar koefisien variasi (CV) demand.
const ABC_THRESHOLDS = { a: 80, b: 95 };
const XYZ_THRESHOLDS = { x: 0.25, y: 0.5 };

function classifyAbcXyz(skus) {
  const items = (skus || []).map((raw) => {
    const s = normalizeSku(raw);
    const annualValue = (Number(s.annualDemand) || 0) * (Number(s.unitPrice) || 0);
    const actuals = s.rows.map((r) => Number(r.actual) || 0);
    const mean = meanOf(actuals);
    const sd = stdDevOf(actuals);
    const cv = mean > 0 ? sd / mean : 0;
    return { id: s.id, name: s.name, annualDemand: Number(s.annualDemand) || 0, unitPrice: Number(s.unitPrice) || 0, annualValue, cv };
  });

  const totalValue = items.reduce((a, b) => a + b.annualValue, 0) || 1;
  const sorted = [...items].sort((a, b) => b.annualValue - a.annualValue);
  let cum = 0;
  const classified = sorted.map((it) => {
    cum += it.annualValue;
    const cumPct = (cum / totalValue) * 100;
    const abcClass = cumPct <= ABC_THRESHOLDS.a ? "A" : cumPct <= ABC_THRESHOLDS.b ? "B" : "C";
    const xyzClass = it.cv <= XYZ_THRESHOLDS.x ? "X" : it.cv <= XYZ_THRESHOLDS.y ? "Y" : "Z";
    return {
      ...it,
      valuePct: Number(((it.annualValue / totalValue) * 100).toFixed(1)),
      cumPct: Number(cumPct.toFixed(1)),
      abcClass,
      xyzClass,
      combined: `${abcClass}${xyzClass}`,
    };
  });

  return classified;
}

const ABCXYZ_STRATEGY = {
  AX: { title: "Prioritas Utama, Stabil", desc: "Nilai tinggi & permintaan mudah diprediksi. Otomatisasi replenishment, kontrak jangka panjang dengan supplier, safety stock minim, cocok pakai continuous review." },
  AY: { title: "Prioritas Tinggi, Variasi Sedang", desc: "Nilai tinggi dengan fluktuasi moderat. Pantau rutin, gunakan forecast adaptif (Holt/Auto-pilih) dan safety stock menengah." },
  AZ: { title: "Prioritas Tinggi, Sangat Fluktuatif", desc: "Nilai tinggi tapi sulit diprediksi — butuh perhatian manajerial intensif, safety stock lebih besar, dan review lebih sering." },
  BX: { title: "Menengah, Stabil", desc: "Nilai menengah & stabil. Sistem pemesanan periodik standar biasanya sudah cukup tanpa perlu perhatian khusus." },
  BY: { title: "Menengah, Variasi Sedang", desc: "Nilai menengah dengan variasi sedang. Review berkala dan buffer stok wajar sudah memadai." },
  BZ: { title: "Menengah, Fluktuatif", desc: "Nilai menengah tapi fluktuatif — pertimbangkan buffer lebih besar atau kurangi ukuran lot agar lebih fleksibel." },
  CX: { title: "Rendah, Stabil", desc: "Nilai rendah & stabil. Cukup dipesan dalam jumlah besar namun jarang, minim effort manajemen." },
  CY: { title: "Rendah, Variasi Sedang", desc: "Nilai rendah dengan variasi sedang. Kelola dengan aturan sederhana, jangan habiskan waktu manajemen berlebihan." },
  CZ: { title: "Rendah, Sangat Fluktuatif", desc: "Nilai rendah & sangat fluktuatif — kandidat dikurangi dari katalog, dipesan sesuai kebutuhan (order-to-order), atau digabung dengan SKU lain." },
};

// ----- Sub-komponen -----

function SkuSelector({ skus, activeId, onSelect, onAdd, onRemove, accent }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      {skus.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className="group flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium"
          style={{
            backgroundColor: activeId === s.id ? `${accent}22` : "rgba(255,255,255,0.6)",
            color: activeId === s.id ? accent : "#6E6E73",
          }}
        >
          <Package size={12} />
          {s.name || "SKU"}
          {skus.length > 1 && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(s.id);
              }}
              className="ml-0.5 opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={11} style={{ color: activeId === s.id ? accent : "#C7C7CC" }} />
            </span>
          )}
        </button>
      ))}
      <button
        onClick={onAdd}
        className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium"
        style={{ backgroundColor: "rgba(255,255,255,0.6)", color: "#8A8A8E" }}
      >
        <Plus size={12} /> Tambah SKU
      </button>
    </div>
  );
}

function DemandPlanningModule({ accent }) {
  const [tab, setTab] = useState("forecast");
  const [skus, setSkus] = usePersistentState("demand.skus", [defaultSku("SKU-001")]);
  const [activeSkuId, setActiveSkuId] = usePersistentState("demand.activeSkuId", null);

  const activeId = activeSkuId && skus.some((s) => s.id === activeSkuId) ? activeSkuId : skus[0]?.id;
  const activeIdx = skus.findIndex((s) => s.id === activeId);
  const sku = normalizeSku(skus[activeIdx] || defaultSku("SKU-001"));

  const updateSku = (patch) => {
    setSkus(skus.map((s, i) => (i === activeIdx ? { ...s, ...patch } : s)));
  };

  const addDiscountTier = () =>
    updateSku({ discountTiers: [...sku.discountTiers, { minQty: 0, price: sku.orderingCost ? 0 : 0 }] });
  const removeDiscountTier = (idx) =>
    updateSku({ discountTiers: sku.discountTiers.filter((_, i) => i !== idx) });
  const updateDiscountTier = (idx, field, val) =>
    updateSku({
      discountTiers: sku.discountTiers.map((t, i) => (i === idx ? { ...t, [field]: Number(val) } : t)),
    });

  const addSku = () => {
    const next = defaultSku(`SKU-${String(skus.length + 1).padStart(3, "0")}`);
    setSkus([...skus, next]);
    setActiveSkuId(next.id);
  };

  const removeSku = (id) => {
    if (skus.length <= 1) return;
    const filtered = skus.filter((s) => s.id !== id);
    setSkus(filtered);
    if (activeId === id) setActiveSkuId(filtered[0]?.id ?? null);
  };

  const renameSku = (name) => updateSku({ name });

  const addRow = () => updateSku({ rows: [...sku.rows, { period: `P${sku.rows.length + 1}`, actual: 0 }] });
  const removeRow = (idx) => updateSku({ rows: sku.rows.filter((_, i) => i !== idx) });
  const updateRow = (idx, field, val) =>
    updateSku({
      rows: sku.rows.map((r, i) => (i === idx ? { ...r, [field]: field === "actual" ? Number(val) : val } : r)),
    });

  const forecastParams = {
    maPeriod: sku.maPeriod,
    alpha: sku.alpha,
    holtAlpha: sku.holtAlpha,
    holtBeta: sku.holtBeta,
  };

  const autoResult = useMemo(() => {
    if (sku.method !== "auto") return null;
    return runAutoSelect(sku.rows, forecastParams);
  }, [sku.method, sku.rows, sku.maPeriod, sku.alpha, sku.holtAlpha, sku.holtBeta]);

  const forecastData = useMemo(() => {
    if (sku.method === "auto") return autoResult?.forecastRows ?? [];
    return buildForecast(sku.rows, sku.method, forecastParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sku.rows, sku.method, sku.maPeriod, sku.alpha, sku.holtAlpha, sku.holtBeta, autoResult]);

  const errorMetrics = useMemo(() => calcForecastMetrics(forecastData), [forecastData]);

  const chartData = useMemo(
    () => withConfidenceBand(forecastData, Number(errorMetrics.residualStd) || 0),
    [forecastData, errorMetrics.residualStd]
  );

  const biasFlag =
    errorMetrics.trackingSignal !== null && Math.abs(Number(errorMetrics.trackingSignal)) > 4;

  const { annualDemand, orderingCost, holdingCost } = sku;

  const classicEoq = useMemo(
    () => calcClassicEOQ(annualDemand, orderingCost, holdingCost),
    [annualDemand, orderingCost, holdingCost]
  );

  const epq = useMemo(
    () => calcEPQ(annualDemand, orderingCost, holdingCost, sku.productionRatePerDay, sku.avgDailyDemand),
    [annualDemand, orderingCost, holdingCost, sku.productionRatePerDay, sku.avgDailyDemand]
  );

  const discountResult = useMemo(() => {
    if (!sku.discountTiers.length) return null;
    return evalQuantityDiscount(annualDemand, orderingCost, sku.holdingCostRatePct, sku.discountTiers);
  }, [annualDemand, orderingCost, sku.holdingCostRatePct, sku.discountTiers]);

  const effectiveEoq = useMemo(() => {
    if (sku.procurementMode === "produksi") {
      return { q: epq.q, ordersPerYear: epq.ordersPerYear, totalCost: epq.totalCost, effH: holdingCost * epq.ratio };
    }
    if (discountResult && discountResult.bestIdx !== -1) {
      const best = discountResult.rows[discountResult.bestIdx];
      const effH = (Number(sku.holdingCostRatePct) || 0) / 100 * best.price;
      return { q: best.q, ordersPerYear: best.q > 0 ? annualDemand / best.q : 0, totalCost: best.totalCost, effH };
    }
    return { q: classicEoq.q, ordersPerYear: classicEoq.ordersPerYear, totalCost: classicEoq.totalCost, effH: holdingCost };
  }, [sku.procurementMode, epq, discountResult, classicEoq, holdingCost, sku.holdingCostRatePct, annualDemand]);

  const eoqSensitivity = useMemo(
    () => buildEoqSensitivity(annualDemand, orderingCost, effectiveEoq.effH || holdingCost, effectiveEoq.q),
    [annualDemand, orderingCost, effectiveEoq, holdingCost]
  );

  const eoq = {
    eoq: classicEoq.q.toFixed(0),
    ordersPerYear: classicEoq.ordersPerYear.toFixed(1),
    totalCost: classicEoq.totalCost.toLocaleString("id-ID", { maximumFractionDigits: 0 }),
  };

  const { avgDailyDemand, leadTimeDays, demandStdDev, leadTimeStdDev, serviceLevelIdx, variabilityMode, reviewMode, reviewPeriodDays } = sku;

  const safetyStock = useMemo(() => {
    const z = SERVICE_LEVELS[serviceLevelIdx].z;
    const { ss, rop } = calcSafetyStockAdvanced({
      avgDailyDemand,
      leadTimeDays,
      demandStdDev,
      leadTimeStdDev,
      z,
      variabilityMode,
    });
    return { ss: ss.toFixed(0), rop: rop.toFixed(0) };
  }, [avgDailyDemand, leadTimeDays, demandStdDev, leadTimeStdDev, serviceLevelIdx, variabilityMode]);

  const periodicReview = useMemo(() => {
    const z = SERVICE_LEVELS[serviceLevelIdx].z;
    return calcPeriodicReview({ avgDailyDemand, leadTimeDays, reviewPeriodDays, demandStdDev, z });
  }, [avgDailyDemand, leadTimeDays, reviewPeriodDays, demandStdDev, serviceLevelIdx]);

  const safetyTradeoff = useMemo(
    () =>
      buildSafetyTradeoff({
        avgDailyDemand,
        leadTimeDays,
        demandStdDev,
        leadTimeStdDev,
        variabilityMode,
        holdingCost,
      }),
    [avgDailyDemand, leadTimeDays, demandStdDev, leadTimeStdDev, variabilityMode, holdingCost]
  );

  // Ringkasan lintas-SKU untuk Laporan & Home
  const aggregate = useMemo(() => {
    let totalForecastNext = 0;
    let mapeSum = 0;
    let mapeCount = 0;
    let eoqSum = 0;
    let ssSum = 0;
    let ropSum = 0;
    const slLabels = new Set();
    skus.forEach((s) => {
      const params = { maPeriod: s.maPeriod, alpha: s.alpha, holtAlpha: s.holtAlpha, holtBeta: s.holtBeta };
      const fRows = s.method === "auto" ? runAutoSelect(s.rows, params).forecastRows : buildForecast(s.rows, s.method, params);
      const m = calcForecastMetrics(fRows);
      const next = fRows[fRows.length - 1]?.forecast;
      if (typeof next === "number") totalForecastNext += next;
      if (m.mape !== null) {
        mapeSum += Number(m.mape);
        mapeCount += 1;
      }
      const D = Number(s.annualDemand) || 0;
      const S = Number(s.orderingCost) || 0;
      const H = Number(s.holdingCost) || 1;
      eoqSum += Math.sqrt((2 * D * S) / H);
      const z = SERVICE_LEVELS[s.serviceLevelIdx]?.z ?? 1.65;
      const ss = z * (Number(s.demandStdDev) || 0) * Math.sqrt(Number(s.leadTimeDays) || 0);
      ssSum += ss;
      ropSum += (Number(s.avgDailyDemand) || 0) * (Number(s.leadTimeDays) || 0) + ss;
      slLabels.add(SERVICE_LEVELS[s.serviceLevelIdx]?.label ?? "95%");
    });
    return {
      skuCount: skus.length,
      forecastNext: Number(totalForecastNext.toFixed(0)),
      mape: mapeCount ? (mapeSum / mapeCount).toFixed(2) : null,
      eoqUnit: skus.length ? Math.round(eoqSum / skus.length) : 0,
      safetyStock: Math.round(ssSum),
      rop: skus.length ? Math.round(ropSum / skus.length) : 0,
      serviceLevel: slLabels.size === 1 ? [...slLabels][0] : "Bervariasi",
    };
  }, [skus]);

  // Daftar EOQ/ROP per-SKU (bukan rata-rata) — dipakai Modul Procurement untuk
  // membuatkan usulan kuantitas Purchase Order otomatis per produk.
  const skuProcurementList = useMemo(() => {
    return skus.map((s) => {
      const D = Number(s.annualDemand) || 0;
      const S = Number(s.orderingCost) || 0;
      const H = Number(s.holdingCost) || 1;
      const eoqUnit = Math.round(Math.sqrt((2 * D * S) / H));
      const z = SERVICE_LEVELS[s.serviceLevelIdx]?.z ?? 1.65;
      const ss = z * (Number(s.demandStdDev) || 0) * Math.sqrt(Number(s.leadTimeDays) || 0);
      const rop = (Number(s.avgDailyDemand) || 0) * (Number(s.leadTimeDays) || 0) + ss;
      return {
        id: s.id,
        name: s.name,
        annualDemand: D,
        unitPrice: Number(s.unitPrice) || 0,
        leadTimeDays: Number(s.leadTimeDays) || 0,
        eoqUnit,
        safetyStock: Math.round(ss),
        rop: Math.round(rop),
      };
    });
  }, [skus]);

  const abcXyz = useMemo(() => classifyAbcXyz(skus), [skus]);

  const abcXyzMatrix = useMemo(() => {
    const grid = {};
    ["A", "B", "C"].forEach((a) => {
      ["X", "Y", "Z"].forEach((x) => {
        grid[`${a}${x}`] = [];
      });
    });
    abcXyz.forEach((it) => {
      if (grid[it.combined]) grid[it.combined].push(it);
    });
    return grid;
  }, [abcXyz]);

  const updateWhatIf = (patch) => updateSku({ whatIf: { ...sku.whatIf, ...patch } });
  const resetWhatIf = () => updateSku({ whatIf: defaultSku().whatIf });

  const whatIfBaselineNext = forecastData[forecastData.length - 1]?.forecast ?? 0;

  const whatIfBaseline = useMemo(
    () => buildWhatIfResult(sku, { demandPct: 0, leadTimeDeltaDays: 0, orderingCostPct: 0, holdingCostPct: 0, serviceLevelIdx: sku.serviceLevelIdx }, whatIfBaselineNext),
    [sku, whatIfBaselineNext]
  );

  const whatIfScenario = useMemo(
    () => buildWhatIfResult(sku, sku.whatIf, whatIfBaselineNext),
    [sku, whatIfBaselineNext]
  );

  const whatIfChartData = useMemo(
    () => [
      { metric: "EOQ", Baseline: whatIfBaseline.eoqUnit, Skenario: whatIfScenario.eoqUnit },
      { metric: "Safety Stock", Baseline: whatIfBaseline.safetyStock, Skenario: whatIfScenario.safetyStock },
      { metric: "ROP", Baseline: whatIfBaseline.rop, Skenario: whatIfScenario.rop },
    ],
    [whatIfBaseline, whatIfScenario]
  );

  const isWhatIfActive =
    (Number(sku.whatIf.demandPct) || 0) !== 0 ||
    (Number(sku.whatIf.leadTimeDeltaDays) || 0) !== 0 ||
    (Number(sku.whatIf.orderingCostPct) || 0) !== 0 ||
    (Number(sku.whatIf.holdingCostPct) || 0) !== 0 ||
    (sku.whatIf.serviceLevelIdx !== null && sku.whatIf.serviceLevelIdx !== sku.serviceLevelIdx);

  useReportSync("demand", {
    ...aggregate,
    abcxyzCountA: abcXyz.filter((i) => i.abcClass === "A").length,
    abcxyzCountAX: abcXyz.filter((i) => i.combined === "AX").length,
    abcxyzCountCZ: abcXyz.filter((i) => i.combined === "CZ").length,
    skuList: skuProcurementList,
  });

  const tabs = [
    { id: "forecast", label: "Peramalan Permintaan" },
    { id: "eoq", label: "EOQ" },
    { id: "safety", label: "Safety Stock & ROP" },
    { id: "klasifikasi", label: "Klasifikasi ABC-XYZ", icon: Target },
    { id: "whatif", label: "Skenario What-If", icon: Sparkles },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ModuleTabs tabs={tabs} tab={tab} setTab={setTab} accent={accent} />

      <SkuSelector skus={skus} activeId={activeId} onSelect={setActiveSkuId} onAdd={addSku} onRemove={removeSku} accent={accent} />

      {tab === "forecast" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <SectionCard title="Data Historis & Metode" subtitle={`Produk aktif: ${sku.name}`} accent={accent}>
            <div className="mb-3">
              <FieldLabel hint="Nama/kode produk yang sedang dikelola">Nama SKU</FieldLabel>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: "rgba(255,255,255,0.7)" }}>
                <Pencil size={12} style={{ color: "#B5B5B9" }} />
                <input
                  value={sku.name}
                  onChange={(e) => renameSku(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                  style={{ color: "#1D1D1F" }}
                />
              </div>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              {FORECAST_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => updateSku({ method: m.id })}
                  className="rounded-xl px-2.5 py-1.5 text-[11px] font-medium"
                  style={{
                    backgroundColor: sku.method === m.id ? `${accent}22` : "rgba(255,255,255,0.6)",
                    color: sku.method === m.id ? accent : "#8A8A8E",
                  }}
                >
                  {m.id === "auto" && <Sparkles size={11} className="mr-1 inline" />}
                  {m.label}
                </button>
              ))}
            </div>

            {sku.method === "ma" && (
              <div className="mb-4">
                <FieldLabel hint="Jumlah periode terakhir yang dirata-rata">Periode (n)</FieldLabel>
                <NumberInput value={sku.maPeriod} onChange={(v) => updateSku({ maPeriod: v })} min={1} />
              </div>
            )}
            {sku.method === "es" && (
              <div className="mb-4">
                <FieldLabel hint="Bobot data terbaru, antara 0-1">Alpha (α)</FieldLabel>
                <NumberInput value={sku.alpha} onChange={(v) => updateSku({ alpha: v })} min={0} max={1} step={0.05} />
              </div>
            )}
            {sku.method === "holt" && (
              <div className="mb-4 space-y-3">
                <div>
                  <FieldLabel hint="Bobot pembaruan level, antara 0-1">Alpha (α) — Level</FieldLabel>
                  <NumberInput value={sku.holtAlpha} onChange={(v) => updateSku({ holtAlpha: v })} min={0} max={1} step={0.05} />
                </div>
                <div>
                  <FieldLabel hint="Bobot pembaruan tren, antara 0-1">Beta (β) — Tren</FieldLabel>
                  <NumberInput value={sku.holtBeta} onChange={(v) => updateSku({ holtBeta: v })} min={0} max={1} step={0.05} />
                </div>
              </div>
            )}
            {sku.method === "regresi" && (
              <p className="mb-4 text-[11px] leading-relaxed" style={{ color: "#8A8A8E" }}>
                Regresi linear menarik garis tren terbaik dari seluruh data historis — cocok untuk permintaan yang naik/turun konsisten.
              </p>
            )}
            {sku.method === "auto" && autoResult && (
              <div className="mb-4 rounded-xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.6)" }}>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "#4B4B4F" }}>
                  <Sparkles size={12} style={{ color: accent }} /> Perbandingan MAPE antar metode
                </p>
                <div className="space-y-1">
                  {autoResult.comparison.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-[11px]">
                      <span style={{ color: c.id === autoResult.chosenId ? accent : "#6E6E73", fontWeight: c.id === autoResult.chosenId ? 600 : 400 }}>
                        {c.label} {c.id === autoResult.chosenId ? "· terpilih" : ""}
                      </span>
                      <span style={{ color: "#8A8A8E" }}>{c.mape !== null ? `${c.mape}%` : "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: "#4B4B4F" }}>
                Riwayat Permintaan
              </p>
              <button
                onClick={addRow}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah
              </button>
            </div>

            <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {sku.rows.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={r.period}
                    onChange={(e) => updateRow(i, "period", e.target.value)}
                    className="w-20 rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                  />
                  <input
                    type="number"
                    value={r.actual}
                    onChange={(e) => updateRow(i, "actual", e.target.value)}
                    className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                  />
                  <button onClick={() => removeRow(i)}>
                    <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <SectionCard title="Grafik Aktual vs Forecast" subtitle="Area bayangan menunjukkan rentang keyakinan ~95%" accent={accent}>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#8A8A8E" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#8A8A8E" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(255,255,255,0.7)",
                        borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area dataKey="band_lower" stackId="band" stroke="none" fill="transparent" legendType="none" tooltipType="none" />
                    <Area
                      dataKey="band_diff"
                      stackId="band"
                      stroke="none"
                      fill={accent}
                      fillOpacity={0.14}
                      name="Rentang Keyakinan"
                    />
                    <Line type="monotone" dataKey="actual" name="Aktual" stroke="#0A84FF" strokeWidth={2} dot={{ r: 3 }} />
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      name="Forecast"
                      stroke={accent}
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ResultStat accent={accent} label="Forecast Berikutnya" value={forecastData[forecastData.length - 1]?.forecast ?? "—"} unit="unit" />
              <ResultStat accent={accent} label="MAD" value={errorMetrics.mad ?? "—"} />
              <ResultStat accent={accent} label="MAPE" value={errorMetrics.mape ?? "—"} unit="%" />
              <ResultStat accent={accent}
                label="Sinyal Bias (Tracking Signal)"
                value={errorMetrics.trackingSignal ?? "—"}
                highlight={biasFlag}
              />
            </div>
            {biasFlag && (
              <div className="flex items-start gap-2 rounded-xl p-3" style={{ backgroundColor: "rgba(226,104,90,0.1)" }}>
                <AlertTriangle size={14} style={{ color: "#E2685A", marginTop: 1 }} />
                <p className="text-[11px] leading-relaxed" style={{ color: "#8A5750" }}>
                  Sinyal bias di luar rentang normal (±4) — forecast cenderung konsisten terlalu tinggi/rendah dibanding aktual. Pertimbangkan ganti metode atau evaluasi parameter.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "eoq" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <div className="flex flex-col gap-4">
            <SectionCard title="Parameter Dasar" subtitle={`Economic Order Quantity — ${sku.name}`} accent={accent}>
              <div className="mb-3 flex gap-2">
                <button
                  onClick={() => updateSku({ procurementMode: "beli" })}
                  className="flex-1 rounded-xl px-3 py-2 text-xs font-medium"
                  style={{
                    backgroundColor: sku.procurementMode === "beli" ? `${accent}22` : "rgba(255,255,255,0.6)",
                    color: sku.procurementMode === "beli" ? accent : "#8A8A8E",
                  }}
                >
                  Beli dari Supplier
                </button>
                <button
                  onClick={() => updateSku({ procurementMode: "produksi" })}
                  className="flex-1 rounded-xl px-3 py-2 text-xs font-medium"
                  style={{
                    backgroundColor: sku.procurementMode === "produksi" ? `${accent}22` : "rgba(255,255,255,0.6)",
                    color: sku.procurementMode === "produksi" ? accent : "#8A8A8E",
                  }}
                >
                  Produksi Sendiri (EPQ)
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <FieldLabel hint="Total permintaan dalam satu tahun">Permintaan Tahunan (D)</FieldLabel>
                  <NumberInput value={sku.annualDemand} onChange={(v) => updateSku({ annualDemand: v })} suffix="unit/th" />
                </div>
                <div>
                  <FieldLabel hint="Harga jual/nilai per unit — dipakai untuk menghitung Nilai Pemakaian Tahunan pada tab Klasifikasi ABC-XYZ">Harga per Unit</FieldLabel>
                  <NumberInput value={sku.unitPrice} onChange={(v) => updateSku({ unitPrice: v })} suffix="Rp/unit" />
                </div>
                <div>
                  <FieldLabel hint="Biaya tetap tiap kali melakukan pemesanan/setup produksi">
                    {sku.procurementMode === "produksi" ? "Biaya Setup (S)" : "Biaya Pemesanan (S)"}
                  </FieldLabel>
                  <NumberInput value={sku.orderingCost} onChange={(v) => updateSku({ orderingCost: v })} suffix="Rp/order" />
                </div>
                <div>
                  <FieldLabel hint="Biaya menyimpan satu unit selama satu tahun">Biaya Penyimpanan (H)</FieldLabel>
                  <NumberInput value={sku.holdingCost} onChange={(v) => updateSku({ holdingCost: v })} suffix="Rp/unit/th" />
                </div>
                {sku.procurementMode === "produksi" && (
                  <div>
                    <FieldLabel hint="Kapasitas produksi harian — harus lebih besar dari demand harian rata-rata">Laju Produksi Harian</FieldLabel>
                    <NumberInput value={sku.productionRatePerDay} onChange={(v) => updateSku({ productionRatePerDay: v })} suffix="unit/hari" />
                    <p className="mt-1.5 text-[11px]" style={{ color: epq.feasible ? "#8A8A8E" : "#E2685A" }}>
                      Demand harian rata-rata (dari tab Safety Stock): {sku.avgDailyDemand} unit/hari.
                      {!epq.feasible && " Laju produksi harus lebih besar dari demand harian agar EPQ valid."}
                    </p>
                  </div>
                )}
              </div>
            </SectionCard>

            {sku.procurementMode === "beli" && (
              <SectionCard
                title="Diskon Kuantitas"
                subtitle="Opsional — tambahkan tingkatan harga per jumlah beli"
                accent={accent}
              >
                <div className="mb-3">
                  <FieldLabel hint="Dipakai untuk menghitung biaya simpan tiap tingkat harga (H = tarif × harga)">
                    Tarif Biaya Simpan
                  </FieldLabel>
                  <NumberInput
                    value={sku.holdingCostRatePct}
                    onChange={(v) => updateSku({ holdingCostRatePct: v })}
                    suffix="% dari harga/th"
                  />
                </div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium" style={{ color: "#4B4B4F" }}>
                    Tingkatan Harga
                  </p>
                  <button
                    onClick={addDiscountTier}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                    style={{ backgroundColor: `${accent}22`, color: accent }}
                  >
                    <Plus size={12} /> Tambah
                  </button>
                </div>
                {sku.discountTiers.length === 0 && (
                  <p className="text-[11px]" style={{ color: "#9A9AA0" }}>
                    Belum ada tingkatan harga — EOQ dihitung dengan harga tunggal (klasik).
                  </p>
                )}
                <div className="space-y-1.5">
                  {sku.discountTiers.map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="number"
                        value={t.minQty}
                        onChange={(e) => updateDiscountTier(i, "minQty", e.target.value)}
                        placeholder="Min. qty"
                        className="w-24 rounded-lg px-2 py-1.5 text-xs outline-none"
                        style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                      />
                      <input
                        type="number"
                        value={t.price}
                        onChange={(e) => updateDiscountTier(i, "price", e.target.value)}
                        placeholder="Harga/unit"
                        className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none"
                        style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                      />
                      <button onClick={() => removeDiscountTier(i)}>
                        <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                      </button>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <SectionCard
              title={sku.procurementMode === "produksi" ? "Hasil Perhitungan EPQ" : "Hasil Perhitungan EOQ"}
              accent={accent}
            >
              {sku.procurementMode === "produksi" ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <ResultStat accent={accent} label="EPQ (Jumlah Optimal)" value={epq.q.toFixed(0)} unit="unit" />
                  <ResultStat accent={accent} label="Inventori Maksimum" value={epq.maxInventory.toFixed(0)} unit="unit" />
                  <ResultStat accent={accent}
                    label="Total Biaya Tahunan"
                    value={`Rp ${epq.totalCost.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <ResultStat accent={accent} label="EOQ Klasik (harga tunggal)" value={eoq.eoq} unit="unit" />
                  <ResultStat accent={accent} label="Frekuensi Pesan" value={eoq.ordersPerYear} unit="x/th" />
                  <ResultStat accent={accent} label="Total Biaya Tahunan" value={`Rp ${eoq.totalCost}`} />
                </div>
              )}
              <p className="mt-4 text-xs leading-relaxed" style={{ color: "#8A8A8E" }}>
                {sku.procurementMode === "produksi"
                  ? "EPQ dihitung dengan rumus √(2DS / (H×(1−d/p))) — mempertimbangkan bahwa barang diproduksi bertahap, bukan diterima sekaligus."
                  : "EOQ dihitung dengan rumus √(2DS / H) — titik di mana total biaya pemesanan dan penyimpanan berada pada nilai minimum."}
              </p>
            </SectionCard>

            {sku.procurementMode === "beli" && discountResult && (
              <SectionCard title="Perbandingan Tingkatan Harga" accent={accent}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr style={{ color: "#8A8A8E" }}>
                        <th className="pb-2 pr-3 font-medium">Min. Qty</th>
                        <th className="pb-2 pr-3 font-medium">Harga/unit</th>
                        <th className="pb-2 pr-3 font-medium">Qty Order</th>
                        <th className="pb-2 font-medium">Total Biaya/th</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discountResult.rows.map((r, i) => (
                        <tr
                          key={i}
                          style={{
                            backgroundColor: i === discountResult.bestIdx ? `${accent}14` : "transparent",
                          }}
                        >
                          <td className="py-1.5 pr-3">{r.minQty.toLocaleString("id-ID")}</td>
                          <td className="py-1.5 pr-3">Rp {r.price.toLocaleString("id-ID")}</td>
                          <td className="py-1.5 pr-3">
                            {r.q.toLocaleString("id-ID")}
                            {i === discountResult.bestIdx && (
                              <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${accent}22`, color: accent }}>
                                Terbaik
                              </span>
                            )}
                          </td>
                          <td className="py-1.5">Rp {r.totalCost.toLocaleString("id-ID")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "#8A8A8E" }}>
                  Tingkatan dengan total biaya (pembelian + pemesanan + penyimpanan) terendah ditandai "Terbaik" — itulah kombinasi jumlah order dan harga yang paling ekonomis.
                </p>
              </SectionCard>
            )}

            <SectionCard title="Analisis Sensitivitas Biaya" subtitle="Bagaimana total biaya berubah jika Q meleset dari titik optimal" accent={accent}>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={eoqSensitivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="q" tick={{ fontSize: 10, fill: "#8A8A8E" }} label={{ value: "Kuantitas Order (Q)", position: "insideBottom", offset: -4, fontSize: 10, fill: "#8A8A8E" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#8A8A8E" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(255,255,255,0.7)",
                        borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="holding" name="Biaya Simpan" stroke="#E2A63B" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="ordering" name="Biaya Pesan" stroke="#0A84FF" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="total" name="Total Biaya" stroke={accent} strokeWidth={2.5} dot={false} />
                    <ReferenceDot
                      x={Math.max(1, Math.round(effectiveEoq.q))}
                      y={Math.round(effectiveEoq.totalCost)}
                      r={5}
                      fill={accent}
                      stroke="#fff"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed" style={{ color: "#8A8A8E" }}>
                Titik lingkaran menandai kuantitas order optimal saat ini. Kurva biaya simpan naik dan biaya pesan turun seiring Q membesar — total biaya minimum berada di titik potongnya.
              </p>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "safety" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <SectionCard title="Parameter Safety Stock" subtitle={`Buffer stok & titik pemesanan ulang — ${sku.name}`} accent={accent}>
            <div className="space-y-4">
              <div>
                <FieldLabel>Demand Harian Rata-rata</FieldLabel>
                <NumberInput value={sku.avgDailyDemand} onChange={(v) => updateSku({ avgDailyDemand: v })} suffix="unit/hari" />
              </div>
              <div>
                <FieldLabel>Lead Time Rata-rata</FieldLabel>
                <NumberInput value={sku.leadTimeDays} onChange={(v) => updateSku({ leadTimeDays: v })} suffix="hari" />
              </div>
              <div>
                <FieldLabel hint="Variasi/ketidakpastian demand harian">Standar Deviasi Demand</FieldLabel>
                <NumberInput value={sku.demandStdDev} onChange={(v) => updateSku({ demandStdDev: v })} suffix="unit" />
              </div>

              <div>
                <FieldLabel hint="Sertakan variasi lead time supplier di samping variasi demand">Model Variabilitas</FieldLabel>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => updateSku({ variabilityMode: "demand" })}
                    className="flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: sku.variabilityMode === "demand" ? `${accent}22` : "rgba(255,255,255,0.6)",
                      color: sku.variabilityMode === "demand" ? accent : "#8A8A8E",
                    }}
                  >
                    Demand Saja
                  </button>
                  <button
                    onClick={() => updateSku({ variabilityMode: "demand_leadtime" })}
                    className="flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: sku.variabilityMode === "demand_leadtime" ? `${accent}22` : "rgba(255,255,255,0.6)",
                      color: sku.variabilityMode === "demand_leadtime" ? accent : "#8A8A8E",
                    }}
                  >
                    Demand + Lead Time
                  </button>
                </div>
              </div>
              {sku.variabilityMode === "demand_leadtime" && (
                <div>
                  <FieldLabel hint="Variasi/ketidakpastian waktu pengiriman supplier">Standar Deviasi Lead Time</FieldLabel>
                  <NumberInput value={sku.leadTimeStdDev} onChange={(v) => updateSku({ leadTimeStdDev: v })} suffix="hari" />
                </div>
              )}

              <div>
                <FieldLabel hint="Tingkat keyakinan tidak akan kehabisan stok">Service Level</FieldLabel>
                <div className="flex gap-1.5">
                  {SERVICE_LEVELS.map((s, i) => (
                    <button
                      key={s.label}
                      onClick={() => updateSku({ serviceLevelIdx: i })}
                      className="flex-1 rounded-lg px-2 py-1.5 text-xs font-medium"
                      style={{
                        backgroundColor: sku.serviceLevelIdx === i ? `${accent}22` : "rgba(255,255,255,0.6)",
                        color: sku.serviceLevelIdx === i ? accent : "#8A8A8E",
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel hint="Continuous review memantau stok terus-menerus (ROP); periodic review mengecek stok pada interval tetap">Model Review</FieldLabel>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => updateSku({ reviewMode: "continuous" })}
                    className="flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: sku.reviewMode === "continuous" ? `${accent}22` : "rgba(255,255,255,0.6)",
                      color: sku.reviewMode === "continuous" ? accent : "#8A8A8E",
                    }}
                  >
                    Continuous (ROP)
                  </button>
                  <button
                    onClick={() => updateSku({ reviewMode: "periodic" })}
                    className="flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: sku.reviewMode === "periodic" ? `${accent}22` : "rgba(255,255,255,0.6)",
                      color: sku.reviewMode === "periodic" ? accent : "#8A8A8E",
                    }}
                  >
                    Periodic (Order-up-to)
                  </button>
                </div>
              </div>
              {sku.reviewMode === "periodic" && (
                <div>
                  <FieldLabel hint="Interval waktu antar pengecekan/pemesanan stok">Periode Review</FieldLabel>
                  <NumberInput value={sku.reviewPeriodDays} onChange={(v) => updateSku({ reviewPeriodDays: v })} suffix="hari" />
                </div>
              )}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <SectionCard title="Hasil Perhitungan" accent={accent}>
              {sku.reviewMode === "periodic" ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ResultStat accent={accent} label="Safety Stock (Periodic)" value={periodicReview.ss.toFixed(0)} unit="unit" />
                  <ResultStat accent={accent} label="Order-up-to Level (S)" value={periodicReview.orderUpTo.toFixed(0)} unit="unit" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ResultStat accent={accent} label="Safety Stock" value={safetyStock.ss} unit="unit" />
                  <ResultStat accent={accent} label="Reorder Point (ROP)" value={safetyStock.rop} unit="unit" />
                </div>
              )}
              <p className="mt-4 text-xs leading-relaxed" style={{ color: "#8A8A8E" }}>
                {sku.reviewMode === "periodic"
                  ? "Pada model periodic review, stok dicek tiap periode tetap; saat dicek, pesan hingga mencapai order-up-to level (S) agar cukup sampai pengecekan berikutnya + lead time."
                  : "Saat stok tersedia mencapai nilai ROP, pemesanan ulang harus dilakukan agar stok tidak habis sebelum kiriman baru tiba."}
                {sku.variabilityMode === "demand_leadtime" && " Perhitungan ini sudah memperhitungkan variabilitas lead time supplier, bukan hanya variasi demand."}
              </p>
            </SectionCard>

            <SectionCard title="Trade-off Biaya vs Service Level" subtitle="Biaya simpan safety stock pada tiap target service level" accent={accent}>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={safetyTradeoff}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8A8A8E" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#8A8A8E" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(255,255,255,0.7)",
                        borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                        fontSize: 12,
                      }}
                      formatter={(value, name) => [name === "cost" ? `Rp ${Number(value).toLocaleString("id-ID")}` : value, name === "cost" ? "Biaya Simpan" : "Safety Stock"]}
                    />
                    <Bar dataKey="cost" radius={[6, 6, 0, 0]}>
                      {safetyTradeoff.map((entry, i) => (
                        <Cell key={i} fill={SERVICE_LEVELS[i]?.label === SERVICE_LEVELS[serviceLevelIdx].label ? accent : `${accent}55`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed" style={{ color: "#8A8A8E" }}>
                Semakin tinggi target service level, semakin besar safety stock dan biaya penyimpanannya — batang yang menyala menandai pilihan saat ini.
              </p>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "klasifikasi" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            <SectionCard
              title="Tabel Klasifikasi ABC-XYZ"
              subtitle="A/B/C = kontribusi nilai pemakaian tahunan (Pareto 80/95/100) · X/Y/Z = koefisien variasi (CV) demand historis"
              accent={accent}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr style={{ color: "#8A8A8E" }}>
                      <th className="pb-2 pr-3 font-medium">SKU</th>
                      <th className="pb-2 pr-3 font-medium">Nilai Tahunan (Rp)</th>
                      <th className="pb-2 pr-3 font-medium">% Nilai</th>
                      <th className="pb-2 pr-3 font-medium">% Kumulatif</th>
                      <th className="pb-2 pr-3 font-medium">Kelas ABC</th>
                      <th className="pb-2 pr-3 font-medium">CV Demand</th>
                      <th className="pb-2 pr-3 font-medium">Kelas XYZ</th>
                      <th className="pb-2 font-medium">Kombinasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {abcXyz.map((it) => (
                      <tr key={it.id} style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                        <td className="py-2 pr-3 font-medium" style={{ color: "#1D1D1F" }}>
                          {it.name}
                          {it.id === sku.id && (
                            <span className="ml-1.5 rounded px-1.5 py-0.5 text-[9px]" style={{ backgroundColor: `${accent}22`, color: accent }}>
                              aktif
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-3" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {it.annualValue.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2 pr-3" style={{ fontVariantNumeric: "tabular-nums" }}>{it.valuePct}%</td>
                        <td className="py-2 pr-3" style={{ fontVariantNumeric: "tabular-nums" }}>{it.cumPct}%</td>
                        <td className="py-2 pr-3">
                          <ClassBadge label={it.abcClass} accent={accent} />
                        </td>
                        <td className="py-2 pr-3" style={{ fontVariantNumeric: "tabular-nums" }}>{it.cv.toFixed(2)}</td>
                        <td className="py-2 pr-3">
                          <ClassBadge label={it.xyzClass} accent={accent} />
                        </td>
                        <td className="py-2 font-semibold" style={{ color: accent }}>{it.combined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "#8A8A8E" }}>
                Nilai Tahunan dihitung dari Permintaan Tahunan × Harga per Unit (diisi di tab EOQ). CV = std. deviasi ÷ rata-rata demand historis pada tab Peramalan — makin tinggi CV, makin sulit permintaan SKU diprediksi.
              </p>
            </SectionCard>

            <SectionCard title="Matriks ABC-XYZ" subtitle="Jumlah SKU pada tiap kombinasi kelas" accent={accent}>
              <div className="grid grid-cols-4 gap-1.5 text-center text-[11px]">
                <div />
                {["X", "Y", "Z"].map((x) => (
                  <div key={x} className="pb-1 font-semibold" style={{ color: "#8A8A8E" }}>
                    {x}
                  </div>
                ))}
                {["A", "B", "C"].flatMap((a) => [
                  <div key={`${a}-label`} className="flex items-center justify-center font-semibold" style={{ color: "#8A8A8E" }}>
                    {a}
                  </div>,
                  ...["X", "Y", "Z"].map((x) => {
                    const cellKey = `${a}${x}`;
                    const count = abcXyzMatrix[cellKey]?.length ?? 0;
                    const isActive = abcXyz.find((it) => it.id === sku.id)?.combined === cellKey;
                    return (
                      <div
                        key={cellKey}
                        className="flex flex-col items-center justify-center rounded-xl py-3"
                        style={{
                          backgroundColor: count > 0 ? `${accent}${isActive ? "33" : "18"}` : "rgba(0,0,0,0.03)",
                          border: isActive ? `1.5px solid ${accent}` : "1.5px solid transparent",
                        }}
                        title={abcXyzMatrix[cellKey]?.map((i) => i.name).join(", ")}
                      >
                        <span className="text-base font-semibold" style={{ color: count > 0 ? "#1D1D1F" : "#C5C5C9" }}>
                          {count}
                        </span>
                        <span className="text-[9px]" style={{ color: "#9A9AA0" }}>
                          {cellKey}
                        </span>
                      </div>
                    );
                  }),
                ])}
              </div>
            </SectionCard>
          </div>

          <div className="flex flex-col gap-4">
            <SectionCard title="Strategi per Kombinasi" subtitle="Rekomendasi pengelolaan tiap kelas" accent={accent}>
              <div className="flex max-h-[560px] flex-col gap-2.5 overflow-y-auto pr-1">
                {Object.entries(ABCXYZ_STRATEGY).map(([code, s]) => {
                  const count = abcXyzMatrix[code]?.length ?? 0;
                  return (
                    <div
                      key={code}
                      className="rounded-xl p-3"
                      style={{ backgroundColor: count > 0 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)" }}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: accent }}>
                          {code} — {s.title}
                        </span>
                        <span className="text-[10px]" style={{ color: "#9A9AA0" }}>
                          {count} SKU
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: "#6B6B70" }}>
                        {s.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "whatif" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_1fr]">
          <SectionCard title="Parameter Skenario" subtitle={`Simulasi perubahan asumsi — ${sku.name}`} accent={accent}>
            <div className="space-y-4">
              <div>
                <FieldLabel hint="Positif = demand naik, negatif = demand turun">% Perubahan Demand</FieldLabel>
                <NumberInput value={sku.whatIf.demandPct} onChange={(v) => updateWhatIf({ demandPct: v })} suffix="%" />
              </div>
              <div>
                <FieldLabel hint="Positif = lead time molor/lebih lama, negatif = lebih cepat">Perubahan Lead Time</FieldLabel>
                <NumberInput value={sku.whatIf.leadTimeDeltaDays} onChange={(v) => updateWhatIf({ leadTimeDeltaDays: v })} suffix="hari" />
              </div>
              <div>
                <FieldLabel hint="Perubahan biaya tiap kali pemesanan">% Perubahan Biaya Pesan</FieldLabel>
                <NumberInput value={sku.whatIf.orderingCostPct} onChange={(v) => updateWhatIf({ orderingCostPct: v })} suffix="%" />
              </div>
              <div>
                <FieldLabel hint="Perubahan biaya simpan per unit per tahun">% Perubahan Biaya Simpan</FieldLabel>
                <NumberInput value={sku.whatIf.holdingCostPct} onChange={(v) => updateWhatIf({ holdingCostPct: v })} suffix="%" />
              </div>

              <div>
                <FieldLabel hint="Uji dampak jika target service level diubah, terpisah dari nilai baseline SKU">Service Level Skenario</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => updateWhatIf({ serviceLevelIdx: null })}
                    className="rounded-lg px-2 py-1.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: sku.whatIf.serviceLevelIdx === null ? `${accent}22` : "rgba(255,255,255,0.6)",
                      color: sku.whatIf.serviceLevelIdx === null ? accent : "#8A8A8E",
                    }}
                  >
                    Sama (Baseline)
                  </button>
                  {SERVICE_LEVELS.map((s, i) => (
                    <button
                      key={s.label}
                      onClick={() => updateWhatIf({ serviceLevelIdx: i })}
                      className="rounded-lg px-2 py-1.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: sku.whatIf.serviceLevelIdx === i ? `${accent}22` : "rgba(255,255,255,0.6)",
                        color: sku.whatIf.serviceLevelIdx === i ? accent : "#8A8A8E",
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel hint="Isi cepat kombinasi skenario umum">Preset Cepat</FieldLabel>
                <div className="flex flex-col gap-1.5">
                  {WHATIF_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => updateWhatIf(p.patch)}
                      className="rounded-lg px-3 py-1.5 text-left text-[11px] font-medium"
                      style={{ backgroundColor: "rgba(255,255,255,0.6)", color: "#4B4B4F" }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={resetWhatIf}
                disabled={!isWhatIfActive}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium"
                style={{
                  backgroundColor: isWhatIfActive ? "rgba(226,104,90,0.12)" : "rgba(0,0,0,0.04)",
                  color: isWhatIfActive ? "#E2685A" : "#C5C5C9",
                  cursor: isWhatIfActive ? "pointer" : "default",
                }}
              >
                <RotateCcw size={13} /> Reset ke Baseline
              </button>
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <SectionCard
              title="Perbandingan Baseline vs Skenario"
              subtitle={isWhatIfActive ? "Skenario aktif — parameter di kiri sedang disimulasikan" : "Belum ada perubahan skenario — angka Baseline dan Skenario masih identik"}
              accent={accent}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr style={{ color: "#8A8A8E" }}>
                      <th className="pb-2 pr-3 font-medium">Metrik</th>
                      <th className="pb-2 pr-3 font-medium">Baseline</th>
                      <th className="pb-2 pr-3 font-medium">Skenario</th>
                      <th className="pb-2 font-medium">Perubahan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Forecast Periode Berikutnya", key: "forecastNext", unit: "unit" },
                      { label: "EOQ", key: "eoqUnit", unit: "unit" },
                      { label: "Frekuensi Pesan", key: "eoqOrders", unit: "x/th" },
                      { label: "Total Biaya EOQ", key: "eoqTotalCost", unit: "Rp", isCurrency: true, lowerIsBetter: true },
                      { label: "Safety Stock", key: "safetyStock", unit: "unit", lowerIsBetter: true },
                      { label: "Reorder Point (ROP)", key: "rop", unit: "unit" },
                    ].map((row) => (
                      <tr key={row.key} style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                        <td className="py-2 pr-3 font-medium" style={{ color: "#1D1D1F" }}>{row.label}</td>
                        <td className="py-2 pr-3" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {row.isCurrency ? whatIfBaseline[row.key].toLocaleString("id-ID") : whatIfBaseline[row.key]} {!row.isCurrency && row.unit}
                        </td>
                        <td className="py-2 pr-3 font-semibold" style={{ color: accent, fontVariantNumeric: "tabular-nums" }}>
                          {row.isCurrency ? whatIfScenario[row.key].toLocaleString("id-ID") : whatIfScenario[row.key]} {!row.isCurrency && row.unit}
                        </td>
                        <td className="py-2">
                          <DeltaBadge base={whatIfBaseline[row.key]} scenario={whatIfScenario[row.key]} lowerIsBetter={row.lowerIsBetter} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "#8A8A8E" }}>
                Perhitungan skenario memakai model EOQ klasik & safety stock standar (tanpa diskon kuantitas/EPQ) agar Baseline dan Skenario tetap setara. Panah hijau berarti perubahan menguntungkan, merah berarti sebaliknya (biaya & safety stock: makin rendah makin baik).
              </p>
            </SectionCard>

            <SectionCard title="Grafik Perbandingan" subtitle="EOQ, Safety Stock, dan ROP — Baseline vs Skenario" accent={accent}>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={whatIfChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="metric" tick={{ fontSize: 11, fill: "#8A8A8E" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#8A8A8E" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(255,255,255,0.7)",
                        borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Baseline" fill="#C5C5C9" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Skenario" fill={accent} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}


// ---------- Module 2: Procurement & Sourcing ----------

const DEFAULT_CRITERIA = [
  { name: "Harga", weight: 30 },
  { name: "Kualitas", weight: 25 },
  { name: "Ketepatan Kirim", weight: 25 },
  { name: "Pelayanan", weight: 20 },
];

const PO_STATUS_META = {
  draft: { label: "Draft", color: "#8A8A8E" },
  sent: { label: "Dikirim", color: "#0A84FF" },
  confirmed: { label: "Dikonfirmasi", color: "#E0A82E" },
  received: { label: "Diterima", color: "#3D8A5D" },
  cancelled: { label: "Dibatalkan", color: "#C0453A" },
};
const PO_STATUS_ORDER = ["draft", "sent", "confirmed", "received"];

function ProcurementModule({ accent }) {
  const [tab, setTab] = useState("master");
  const reportData = useReportData();
  const demandSignal = reportData.demand;

  // --- Weighted scoring state ---
  const [criteria, setCriteria] = usePersistentState("procurement.criteria", DEFAULT_CRITERIA);
  const [scoringSuppliers, setScoringSuppliers] = usePersistentState("procurement.scoringSuppliers", [
    { name: "Supplier A", scores: { Harga: 7, Kualitas: 8, "Ketepatan Kirim": 9, Pelayanan: 8 } },
    { name: "Supplier B", scores: { Harga: 9, Kualitas: 6, "Ketepatan Kirim": 7, Pelayanan: 7 } },
    { name: "Supplier C", scores: { Harga: 6, Kualitas: 9, "Ketepatan Kirim": 8, Pelayanan: 9 } },
  ]);

  const weightTotal = criteria.reduce((a, c) => a + Number(c.weight || 0), 0);

  const updateWeight = (idx, val) =>
    setCriteria(criteria.map((c, i) => (i === idx ? { ...c, weight: Number(val) } : c)));

  const updateScore = (supplierIdx, critName, val) =>
    setScoringSuppliers(
      scoringSuppliers.map((s, i) =>
        i === supplierIdx ? { ...s, scores: { ...s.scores, [critName]: Number(val) } } : s
      )
    );

  const addScoringSupplier = () =>
    setScoringSuppliers([
      ...scoringSuppliers,
      {
        name: `Supplier ${String.fromCharCode(65 + scoringSuppliers.length)}`,
        scores: Object.fromEntries(criteria.map((c) => [c.name, 5])),
      },
    ]);

  const removeScoringSupplier = (idx) =>
    setScoringSuppliers(scoringSuppliers.filter((_, i) => i !== idx));

  const scoringResults = useMemo(() => {
    return scoringSuppliers
      .map((s) => {
        const total = criteria.reduce(
          (sum, c) => sum + (Number(s.scores[c.name]) || 0) * (Number(c.weight) / 100),
          0
        );
        return { name: s.name, total: Number(total.toFixed(2)) };
      })
      .sort((a, b) => b.total - a.total);
  }, [scoringSuppliers, criteria]);

  // --- TCO state ---
  const [tcoSuppliers, setTcoSuppliers] = usePersistentState("procurement.tcoSuppliers", [
    { name: "Supplier A", price: 50000, freight: 2000, tariffPct: 5, defectPct: 2, qty: 1000, fixedCost: 500000 },
    { name: "Supplier B", price: 46000, freight: 3500, tariffPct: 8, defectPct: 4, qty: 1000, fixedCost: 300000 },
    { name: "Supplier C", price: 53000, freight: 1500, tariffPct: 3, defectPct: 1, qty: 1000, fixedCost: 700000 },
  ]);

  const updateTco = (idx, field, val) =>
    setTcoSuppliers(
      tcoSuppliers.map((s, i) => (i === idx ? { ...s, [field]: field === "name" ? val : Number(val) } : s))
    );

  const addTcoSupplier = () =>
    setTcoSuppliers([
      ...tcoSuppliers,
      {
        name: `Supplier ${String.fromCharCode(65 + tcoSuppliers.length)}`,
        price: 0,
        freight: 0,
        tariffPct: 0,
        defectPct: 0,
        qty: 1000,
        fixedCost: 0,
      },
    ]);

  const removeTcoSupplier = (idx) => setTcoSuppliers(tcoSuppliers.filter((_, i) => i !== idx));

  const tcoResults = useMemo(() => {
    return tcoSuppliers
      .map((s) => {
        const unitCost = s.price * (1 + s.tariffPct / 100) + s.freight + s.price * (s.defectPct / 100);
        const totalTco = unitCost * s.qty + s.fixedCost;
        return { name: s.name, unitCost: Math.round(unitCost), totalTco: Math.round(totalTco) };
      })
      .sort((a, b) => a.totalTco - b.totalTco);
  }, [tcoSuppliers]);

  // --- Recommendation ---
  const [scoreWeight, setScoreWeight] = usePersistentState("procurement.scoreWeight", 60);

  const recommendation = useMemo(() => {
    const names = scoringResults.map((s) => s.name).filter((n) => tcoResults.some((t) => t.name === n));
    if (names.length === 0) return [];

    const maxScore = Math.max(...scoringResults.map((s) => s.total)) || 1;
    const tcoValues = tcoResults.map((t) => t.totalTco);
    const minTco = Math.min(...tcoValues);
    const maxTco = Math.max(...tcoValues);

    return names
      .map((name) => {
        const s = scoringResults.find((x) => x.name === name);
        const t = tcoResults.find((x) => x.name === name);
        const normScore = s.total / maxScore;
        const normCost = maxTco === minTco ? 1 : 1 - (t.totalTco - minTco) / (maxTco - minTco);
        const final = (scoreWeight / 100) * normScore + (1 - scoreWeight / 100) * normCost;
        return { name, score: s.total, tco: t.totalTco, final: Number((final * 100).toFixed(1)) };
      })
      .sort((a, b) => b.final - a.final);
  }, [scoringResults, tcoResults, scoreWeight]);

  // --- Master Data Supplier ---
  const [masterSuppliers, setMasterSuppliers] = usePersistentState("procurement.masterSuppliers", [
    {
      id: "SUP-001",
      name: "Supplier A",
      category: "Bahan Baku",
      contactPerson: "Budi Santoso",
      phone: "0812-3456-7890",
      email: "budi@suppliera.co.id",
      certification: "ISO 9001",
      status: "active",
      notes: "",
      financialRisk: 2,
      geoRisk: 2,
      spendSharePct: 40,
    },
    {
      id: "SUP-002",
      name: "Supplier B",
      category: "Bahan Baku",
      contactPerson: "Siti Aminah",
      phone: "0813-2233-4455",
      email: "siti@supplierb.co.id",
      certification: "-",
      status: "active",
      notes: "",
      financialRisk: 3,
      geoRisk: 2,
      spendSharePct: 35,
    },
    {
      id: "SUP-003",
      name: "Supplier C",
      category: "Kemasan",
      contactPerson: "Agus Wijaya",
      phone: "0821-9988-7766",
      email: "agus@supplierc.co.id",
      certification: "Halal, ISO 14001",
      status: "active",
      notes: "",
      financialRisk: 2,
      geoRisk: 3,
      spendSharePct: 25,
    },
  ]);

  const nextSupplierId = () => {
    const nums = masterSuppliers.map((s) => Number(String(s.id).replace(/\D/g, "")) || 0);
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `SUP-${String(next).padStart(3, "0")}`;
  };

  const addMasterSupplier = () =>
    setMasterSuppliers([
      ...masterSuppliers,
      {
        id: nextSupplierId(),
        name: `Supplier ${String.fromCharCode(65 + masterSuppliers.length)}`,
        category: "Bahan Baku",
        contactPerson: "",
        phone: "",
        email: "",
        certification: "",
        status: "active",
        notes: "",
      },
    ]);

  const updateMasterSupplier = (idx, field, val) =>
    setMasterSuppliers(masterSuppliers.map((s, i) => (i === idx ? { ...s, [field]: val } : s)));

  const removeMasterSupplier = (idx) => setMasterSuppliers(masterSuppliers.filter((_, i) => i !== idx));

  const activeSupplierCount = masterSuppliers.filter((s) => s.status === "active").length;
  const blacklistSupplierCount = masterSuppliers.filter((s) => s.status === "blacklist").length;

  // --- Risiko Supplier (dihitung dari Master Data: risiko finansial, geografis/ketergantungan tunggal) ---
  const computeSupplierRisk = (s) => {
    const fin = Number(s.financialRisk) || 1;
    const geo = Number(s.geoRisk) || 1;
    const share = Number(s.spendSharePct) || 0;
    const dependencyRisk = share > 50 ? 5 : share > 30 ? 4 : share > 15 ? 3 : share > 5 ? 2 : 1;
    const composite = fin * 0.35 + geo * 0.35 + dependencyRisk * 0.3;
    const level =
      composite <= 2 ? "Rendah" : composite <= 3.4 ? "Sedang" : composite <= 4.2 ? "Tinggi" : "Kritis";
    return { dependencyRisk, composite: Number(composite.toFixed(2)), level };
  };

  const supplierRiskList = useMemo(
    () =>
      masterSuppliers
        .filter((s) => s.status !== "blacklist")
        .map((s) => ({ ...s, risk: computeSupplierRisk(s) }))
        .sort((a, b) => b.risk.composite - a.risk.composite),
    [masterSuppliers]
  );

  const highRiskCount = supplierRiskList.filter((s) => s.risk.level === "Tinggi" || s.risk.level === "Kritis").length;
  const spendShareTotal = masterSuppliers.filter((s) => s.status === "active").reduce((sum, s) => sum + (Number(s.spendSharePct) || 0), 0);

  // --- Purchase Order ---
  const [purchaseOrders, setPurchaseOrders] = usePersistentState("procurement.purchaseOrders", []);
  const [activePoId, setActivePoId] = usePersistentState("procurement.activePoId", null);

  const nextPoNumber = () => {
    const nums = purchaseOrders.map((p) => Number(String(p.id).replace(/\D/g, "")) || 0);
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `PO-${String(next).padStart(4, "0")}`;
  };

  const todayStr = () => new Date().toISOString().slice(0, 10);

  const addPurchaseOrder = (patch = {}) => {
    const newPo = {
      id: nextPoNumber(),
      supplierName: masterSuppliers.find((s) => s.status === "active")?.name || "",
      orderDate: todayStr(),
      expectedDate: "",
      status: "draft",
      items: [{ skuId: "", skuName: "", qty: 0, unitPrice: 0 }],
      notes: "",
      ...patch,
    };
    setPurchaseOrders([newPo, ...purchaseOrders]);
    setActivePoId(newPo.id);
    return newPo;
  };

  const updatePurchaseOrder = (poId, patch) =>
    setPurchaseOrders(purchaseOrders.map((p) => (p.id === poId ? { ...p, ...patch } : p)));

  const removePurchaseOrder = (poId) => {
    setPurchaseOrders(purchaseOrders.filter((p) => p.id !== poId));
    if (activePoId === poId) setActivePoId(null);
  };

  const addPoItem = (poId) =>
    setPurchaseOrders(
      purchaseOrders.map((p) =>
        p.id === poId ? { ...p, items: [...p.items, { skuId: "", skuName: "", qty: 0, unitPrice: 0 }] } : p
      )
    );

  const updatePoItem = (poId, itemIdx, field, val) =>
    setPurchaseOrders(
      purchaseOrders.map((p) => {
        if (p.id !== poId) return p;
        const items = p.items.map((it, i) => {
          if (i !== itemIdx) return it;
          if (field === "skuId") {
            const found = (demandSignal?.skuList || []).find((sk) => sk.id === val);
            return {
              ...it,
              skuId: val,
              skuName: found?.name || it.skuName,
              qty: found ? found.eoqUnit : it.qty,
              unitPrice: found ? found.unitPrice : it.unitPrice,
            };
          }
          return { ...it, [field]: field === "qty" || field === "unitPrice" ? Number(val) : val };
        });
        return { ...p, items };
      })
    );

  const removePoItem = (poId, itemIdx) =>
    setPurchaseOrders(
      purchaseOrders.map((p) => (p.id === poId ? { ...p, items: p.items.filter((_, i) => i !== itemIdx) } : p))
    );

  const poTotal = (po) => (po.items || []).reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);

  const advancePoStatus = (poId) => {
    const order = ["draft", "sent", "confirmed", "received"];
    setPurchaseOrders(
      purchaseOrders.map((p) => {
        if (p.id !== poId) return p;
        const idx = order.indexOf(p.status);
        const nextStatus = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : p.status;
        return { ...p, status: nextStatus };
      })
    );
  };

  const cancelPo = (poId) => updatePurchaseOrder(poId, { status: "cancelled" });

  const createPoFromEoq = () => {
    const skuList = demandSignal?.skuList || [];
    if (skuList.length === 0) return;
    const supplierName = recommendation[0]?.name || masterSuppliers.find((s) => s.status === "active")?.name || "";
    addPurchaseOrder({
      supplierName,
      notes: "Dibuat otomatis dari usulan EOQ Modul Demand & Inventory Planning.",
      items: skuList.map((sk) => ({ skuId: sk.id, skuName: sk.name, qty: sk.eoqUnit, unitPrice: sk.unitPrice })),
    });
  };

  const productionSignal = reportData.production;
  const createPoFromMrp = () => {
    const suggestions = productionSignal?.poSuggestions || [];
    if (suggestions.length === 0) return;
    const supplierName = recommendation[0]?.name || masterSuppliers.find((s) => s.status === "active")?.name || "";
    addPurchaseOrder({
      supplierName,
      notes: "Dibuat otomatis dari usulan Planned Order Release (MRP) Modul Production Planning & Control.",
      items: suggestions.map((s) => ({ skuId: s.itemId, skuName: s.itemName, qty: s.totalQty, unitPrice: 0 })),
    });
  };

  const poSummary = useMemo(() => {
    const openStatuses = ["draft", "sent", "confirmed"];
    return {
      total: purchaseOrders.length,
      draft: purchaseOrders.filter((p) => p.status === "draft").length,
      inProgress: purchaseOrders.filter((p) => p.status === "sent" || p.status === "confirmed").length,
      received: purchaseOrders.filter((p) => p.status === "received").length,
      openValue: purchaseOrders
        .filter((p) => openStatuses.includes(p.status))
        .reduce((sum, p) => sum + poTotal(p), 0),
    };
  }, [purchaseOrders]);

  // --- AHP (pairwise comparison antar kriteria) + TOPSIS ---
  const [ahpValues, setAhpValues] = usePersistentState("procurement.ahpValues", {});

  const setAhpValue = (i, j, val) => setAhpValues({ ...ahpValues, [`${i}-${j}`]: Number(val) || 1 });

  const RI_TABLE = { 1: 0, 2: 0, 3: 0.58, 4: 0.9, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49 };

  const ahpResult = useMemo(() => {
    const n = criteria.length;
    const matrix = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => {
        if (i === j) return 1;
        if (i < j) return Number(ahpValues[`${i}-${j}`]) || 1;
        return 1 / (Number(ahpValues[`${j}-${i}`]) || 1);
      })
    );
    const gm = matrix.map((row) => Math.pow(row.reduce((a, b) => a * b, 1), 1 / n));
    const sumGm = gm.reduce((a, b) => a + b, 0) || 1;
    const weights = gm.map((g) => g / sumGm);
    const ws = matrix.map((row) => row.reduce((sum, val, j) => sum + val * weights[j], 0));
    const cv = ws.map((w, i) => w / (weights[i] || 1e-9));
    const lambdaMax = cv.reduce((a, b) => a + b, 0) / n;
    const CI = n > 1 ? (lambdaMax - n) / (n - 1) : 0;
    const RI = RI_TABLE[n] ?? 1.49;
    const CR = RI > 0 ? CI / RI : 0;
    return {
      matrix,
      weights: criteria.map((c, i) => ({ name: c.name, weight: Number((weights[i] * 100).toFixed(1)) })),
      rawWeights: weights,
      lambdaMax: Number(lambdaMax.toFixed(3)),
      CI: Number(CI.toFixed(3)),
      CR: Number(CR.toFixed(3)),
      consistent: CR < 0.1,
    };
  }, [ahpValues, criteria]);

  const topsisResults = useMemo(() => {
    const criteriaNames = criteria.map((c) => c.name);
    const m = criteriaNames.length;
    const matrix = scoringSuppliers.map((s) => criteriaNames.map((cn) => Number(s.scores[cn]) || 0));
    if (matrix.length === 0 || m === 0) return [];
    const denom = Array.from(
      { length: m },
      (_, j) => Math.sqrt(matrix.reduce((sum, row) => sum + row[j] * row[j], 0)) || 1
    );
    const weights = ahpResult.rawWeights;
    const weighted = matrix.map((row) => row.map((v, j) => (v / denom[j]) * (weights[j] || 0)));
    const idealBest = Array.from({ length: m }, (_, j) => Math.max(...weighted.map((r) => r[j])));
    const idealWorst = Array.from({ length: m }, (_, j) => Math.min(...weighted.map((r) => r[j])));
    return scoringSuppliers
      .map((s, i) => {
        const sPlus = Math.sqrt(weighted[i].reduce((sum, v, j) => sum + (v - idealBest[j]) ** 2, 0));
        const sMinus = Math.sqrt(weighted[i].reduce((sum, v, j) => sum + (v - idealWorst[j]) ** 2, 0));
        const closeness = sPlus + sMinus === 0 ? 0 : sMinus / (sPlus + sMinus);
        return { name: s.name, closeness: Number((closeness * 100).toFixed(1)) };
      })
      .sort((a, b) => b.closeness - a.closeness);
  }, [scoringSuppliers, criteria, ahpResult]);

  // --- RFQ / Perbandingan Penawaran ---
  const [rfqQuotes, setRfqQuotes] = usePersistentState("procurement.rfqQuotes", [
    { id: "RFQ-001", itemName: "Bahan Baku Utama", supplierName: "Supplier A", quotedPrice: 50000, moq: 500, leadTimeDays: 14, validUntil: "" },
    { id: "RFQ-002", itemName: "Bahan Baku Utama", supplierName: "Supplier B", quotedPrice: 46000, moq: 300, leadTimeDays: 10, validUntil: "" },
  ]);

  const nextRfqId = () => {
    const nums = rfqQuotes.map((r) => Number(String(r.id).replace(/\D/g, "")) || 0);
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `RFQ-${String(next).padStart(3, "0")}`;
  };

  const addRfqQuote = () =>
    setRfqQuotes([
      ...rfqQuotes,
      { id: nextRfqId(), itemName: "", supplierName: "", quotedPrice: 0, moq: 0, leadTimeDays: 0, validUntil: "" },
    ]);

  const updateRfqQuote = (idx, field, val) =>
    setRfqQuotes(
      rfqQuotes.map((r, i) =>
        i === idx
          ? { ...r, [field]: ["quotedPrice", "moq", "leadTimeDays"].includes(field) ? Number(val) : val }
          : r
      )
    );

  const removeRfqQuote = (idx) => setRfqQuotes(rfqQuotes.filter((_, i) => i !== idx));

  const rfqCheapestByItem = useMemo(() => {
    const map = {};
    rfqQuotes.forEach((r) => {
      if (!r.itemName) return;
      if (!map[r.itemName] || r.quotedPrice < map[r.itemName]) map[r.itemName] = r.quotedPrice;
    });
    return map;
  }, [rfqQuotes]);

  // --- Multi-Sourcing (alokasi pembelian ke beberapa supplier) ---
  const [sourcingPlans, setSourcingPlans] = usePersistentState("procurement.sourcingPlans", [
    {
      id: "SRC-001",
      itemName: "Bahan Baku Utama",
      totalQty: 1000,
      allocations: [
        { supplierName: "Supplier A", pct: 70 },
        { supplierName: "Supplier B", pct: 30 },
      ],
    },
  ]);

  const nextSrcId = () => {
    const nums = sourcingPlans.map((p) => Number(String(p.id).replace(/\D/g, "")) || 0);
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `SRC-${String(next).padStart(3, "0")}`;
  };

  const addSourcingPlan = () =>
    setSourcingPlans([
      ...sourcingPlans,
      { id: nextSrcId(), itemName: "", totalQty: 0, allocations: [{ supplierName: "", pct: 100 }] },
    ]);

  const removeSourcingPlan = (planId) => setSourcingPlans(sourcingPlans.filter((p) => p.id !== planId));

  const updateSourcingPlan = (planId, patch) =>
    setSourcingPlans(sourcingPlans.map((p) => (p.id === planId ? { ...p, ...patch } : p)));

  const addAllocation = (planId) =>
    setSourcingPlans(
      sourcingPlans.map((p) => (p.id === planId ? { ...p, allocations: [...p.allocations, { supplierName: "", pct: 0 }] } : p))
    );

  const updateAllocation = (planId, idx, field, val) =>
    setSourcingPlans(
      sourcingPlans.map((p) => {
        if (p.id !== planId) return p;
        const allocations = p.allocations.map((a, i) =>
          i === idx ? { ...a, [field]: field === "pct" ? Number(val) : val } : a
        );
        return { ...p, allocations };
      })
    );

  const removeAllocation = (planId, idx) =>
    setSourcingPlans(
      sourcingPlans.map((p) => (p.id === planId ? { ...p, allocations: p.allocations.filter((_, i) => i !== idx) } : p))
    );

  // --- Kontrak & Harga ---
  const [contracts, setContracts] = usePersistentState("procurement.contracts", [
    {
      id: "CTR-001",
      supplierName: "Supplier A",
      itemName: "Bahan Baku Utama",
      agreedPrice: 49000,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      terms: "Pembayaran net 30 hari, harga tetap selama masa kontrak.",
    },
  ]);

  const nextContractId = () => {
    const nums = contracts.map((c) => Number(String(c.id).replace(/\D/g, "")) || 0);
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `CTR-${String(next).padStart(3, "0")}`;
  };

  const addContract = () =>
    setContracts([
      ...contracts,
      { id: nextContractId(), supplierName: "", itemName: "", agreedPrice: 0, startDate: "", endDate: "", terms: "" },
    ]);

  const updateContract = (idx, field, val) =>
    setContracts(
      contracts.map((c, i) => (i === idx ? { ...c, [field]: field === "agreedPrice" ? Number(val) : val } : c))
    );

  const removeContract = (idx) => setContracts(contracts.filter((_, i) => i !== idx));

  const contractStatus = (c) => {
    if (!c.endDate) return { label: "Tanpa Batas", color: "#8A8A8E" };
    const end = new Date(c.endDate);
    const today = new Date();
    const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { label: "Berakhir", color: "#C0453A" };
    if (daysLeft <= 30) return { label: `Segera Berakhir (${daysLeft}h)`, color: "#C08A2E" };
    return { label: "Aktif", color: "#3D8A5D" };
  };

  const contractsExpiringSoon = contracts.filter((c) => {
    const s = contractStatus(c);
    return s.label.startsWith("Segera") || s.label === "Berakhir";
  });

  // --- Kinerja Aktual Supplier (OTIF: On-Time In-Full) ---
  const [performanceRecords, setPerformanceRecords] = usePersistentState("procurement.performanceRecords", [
    { id: "PRF-001", supplierName: "Supplier A", poRef: "", promisedDate: "2026-06-01", actualDate: "2026-06-01", qtyOrdered: 1000, qtyReceived: 1000 },
    { id: "PRF-002", supplierName: "Supplier A", poRef: "", promisedDate: "2026-07-01", actualDate: "2026-07-04", qtyOrdered: 800, qtyReceived: 800 },
    { id: "PRF-003", supplierName: "Supplier B", poRef: "", promisedDate: "2026-06-15", actualDate: "2026-06-14", qtyOrdered: 600, qtyReceived: 540 },
  ]);

  const nextPrfId = () => {
    const nums = performanceRecords.map((r) => Number(String(r.id).replace(/\D/g, "")) || 0);
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `PRF-${String(next).padStart(3, "0")}`;
  };

  const addPerformanceRecord = () =>
    setPerformanceRecords([
      ...performanceRecords,
      { id: nextPrfId(), supplierName: "", poRef: "", promisedDate: "", actualDate: "", qtyOrdered: 0, qtyReceived: 0 },
    ]);

  const updatePerformanceRecord = (idx, field, val) =>
    setPerformanceRecords(
      performanceRecords.map((r, i) =>
        i === idx ? { ...r, [field]: ["qtyOrdered", "qtyReceived"].includes(field) ? Number(val) : val } : r
      )
    );

  const removePerformanceRecord = (idx) => setPerformanceRecords(performanceRecords.filter((_, i) => i !== idx));

  const evalPerformanceRecord = (r) => {
    const onTime = r.promisedDate && r.actualDate ? new Date(r.actualDate) <= new Date(r.promisedDate) : null;
    const inFull = (Number(r.qtyReceived) || 0) >= (Number(r.qtyOrdered) || 0);
    return { onTime, inFull, otif: onTime === true && inFull };
  };

  const supplierOtifSummary = useMemo(() => {
    const bySupplier = {};
    performanceRecords.forEach((r) => {
      if (!r.supplierName) return;
      if (!bySupplier[r.supplierName]) bySupplier[r.supplierName] = { total: 0, onTime: 0, inFull: 0, otif: 0 };
      const evalRes = evalPerformanceRecord(r);
      bySupplier[r.supplierName].total += 1;
      if (evalRes.onTime) bySupplier[r.supplierName].onTime += 1;
      if (evalRes.inFull) bySupplier[r.supplierName].inFull += 1;
      if (evalRes.otif) bySupplier[r.supplierName].otif += 1;
    });
    return Object.entries(bySupplier)
      .map(([name, s]) => ({
        name,
        total: s.total,
        onTimePct: s.total ? Number(((s.onTime / s.total) * 100).toFixed(1)) : 0,
        inFullPct: s.total ? Number(((s.inFull / s.total) * 100).toFixed(1)) : 0,
        otifPct: s.total ? Number(((s.otif / s.total) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.otifPct - a.otifPct);
  }, [performanceRecords]);

  const otifBadge = (pct) => {
    if (pct >= 95) return { label: "Sangat Baik", color: "#3D8A5D" };
    if (pct >= 85) return { label: "Baik", color: "#0A66CC" };
    if (pct >= 70) return { label: "Perlu Perhatian", color: "#C08A2E" };
    return { label: "Kritis", color: "#C0453A" };
  };

  // --- Sensitivitas Keputusan (Rekomendasi Akhir) ---
  const computeRecommendationAt = (weightPct) => {
    const names = scoringResults.map((s) => s.name).filter((n) => tcoResults.some((t) => t.name === n));
    if (names.length === 0) return [];
    const maxScore = Math.max(...scoringResults.map((s) => s.total)) || 1;
    const tcoValues = tcoResults.map((t) => t.totalTco);
    const minTco = Math.min(...tcoValues);
    const maxTco = Math.max(...tcoValues);
    return names
      .map((name) => {
        const s = scoringResults.find((x) => x.name === name);
        const t = tcoResults.find((x) => x.name === name);
        const normScore = s.total / maxScore;
        const normCost = maxTco === minTco ? 1 : 1 - (t.totalTco - minTco) / (maxTco - minTco);
        const final = (weightPct / 100) * normScore + (1 - weightPct / 100) * normCost;
        return { name, final: Number((final * 100).toFixed(1)) };
      })
      .sort((a, b) => b.final - a.final);
  };

  const sensitivityScenarios = useMemo(
    () => [0, 25, 50, 75, 100].map((w) => ({ weight: w, top: computeRecommendationAt(w)[0]?.name ?? "—" })),
    [scoringResults, tcoResults]
  );

  const sensitivityStable = new Set(sensitivityScenarios.map((s) => s.top)).size <= 1;

  useReportSync("procurement", {
    weightTotal,
    topScoring: scoringResults[0]?.name,
    topScoringValue: scoringResults[0]?.total,
    cheapestTco: tcoResults[0]?.name,
    cheapestTcoValue: tcoResults[0]?.totalTco,
    bestRecommendation: recommendation[0]?.name,
    bestRecommendationScore: recommendation[0]?.final,
    activeSupplierCount,
    blacklistSupplierCount,
    poCount: poSummary.total,
    poInProgress: poSummary.inProgress,
    poReceived: poSummary.received,
    poOpenValue: poSummary.openValue,
    highRiskSupplierCount: highRiskCount,
    contractsExpiringSoonCount: contractsExpiringSoon.length,
    avgOtifPct: supplierOtifSummary.length
      ? Number((supplierOtifSummary.reduce((sum, s) => sum + s.otifPct, 0) / supplierOtifSummary.length).toFixed(1))
      : null,
    supplierRiskList: supplierRiskList.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      spendSharePct: Number(s.spendSharePct) || 0,
      composite: s.risk.composite,
      level: s.risk.level,
      dependencyRisk: s.risk.dependencyRisk,
    })),
  });

  const tabs = [
    { id: "master", label: "Data Supplier", icon: Building2 },
    { id: "rfq", label: "RFQ / Penawaran", icon: FileText },
    { id: "scoring", label: "Evaluasi Supplier", icon: Star },
    { id: "ahp", label: "AHP / TOPSIS", icon: Calculator },
    { id: "tco", label: "Total Cost of Ownership", icon: Wallet },
    { id: "recommend", label: "Rekomendasi Akhir", icon: Award },
    { id: "sourcing", label: "Multi-Sourcing", icon: Percent },
    { id: "contracts", label: "Kontrak & Harga", icon: FileSignature },
    { id: "performance", label: "Kinerja Supplier", icon: Activity },
    { id: "po", label: "Purchase Order", icon: ClipboardList },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ModuleTabs tabs={tabs} tab={tab} setTab={setTab} accent={accent} />

      {demandSignal && (
        <SectionCard
          title="Sinyal dari Demand & Inventory Planning"
          subtitle="Prioritas pengadaan otomatis berdasarkan hasil Modul 1"
          accent={accent}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ResultStat accent={accent} label="Rata-rata ROP" value={demandSignal.rop ?? "—"} unit="unit" />
            <ResultStat accent={accent} label="Service Level Dijaga" value={demandSignal.serviceLevel ?? "—"} unit="" />
            <ResultStat accent={accent} label="SKU Kelas A" value={demandSignal.abcxyzCountA ?? 0} unit="SKU" highlight />
            <ResultStat accent={accent} label="SKU Kelas CZ" value={demandSignal.abcxyzCountCZ ?? 0} unit="SKU" />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "#8A8A8E" }}>
            {(demandSignal.abcxyzCountAX ?? 0) > 0
              ? `${demandSignal.abcxyzCountAX} SKU tergolong kelas AX (nilai tinggi & stabil) — prioritaskan supplier dengan kontrak jangka panjang dan skor evaluasi tertinggi untuk SKU ini. `
              : ""}
            {(demandSignal.abcxyzCountCZ ?? 0) > 0
              ? `${demandSignal.abcxyzCountCZ} SKU tergolong kelas CZ (nilai rendah & fluktuatif) — pertimbangkan strategi pesan sesuai kebutuhan agar tidak menumpuk inventori bernilai rendah.`
              : "Belum ada SKU pada kelas CZ — kondisi klasifikasi ABC-XYZ saat ini relatif seimbang."}
          </p>
        </SectionCard>
      )}

      {tab === "master" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
            <ResultStat accent={accent} label="Total Supplier" value={masterSuppliers.length} unit="" />
            <ResultStat accent={accent} label="Supplier Aktif" value={activeSupplierCount} unit="" highlight />
            <ResultStat accent={accent}
              label="Kategori Tercatat"
              value={new Set(masterSuppliers.map((s) => s.category).filter(Boolean)).size}
              unit=""
            />
            <ResultStat accent={accent} label="Blacklist" value={blacklistSupplierCount} unit="" />
            <ResultStat accent={accent} label="Risiko Tinggi/Kritis" value={highRiskCount} unit="supplier" />
            <ResultStat accent={accent}
              label="Total Share Belanja Aktif"
              value={spendShareTotal}
              unit="%"
            />
          </div>

          <SectionCard
            title="Master Data Supplier"
            subtitle="Profil lengkap tiap supplier — jadi rujukan untuk Evaluasi, TCO, dan Purchase Order"
            accent={accent}
          >
            <div className="mb-3 flex justify-end">
              <button
                onClick={addMasterSupplier}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah Supplier
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] border-collapse text-xs">
                <thead>
                  <tr>
                    {["ID", "Nama Supplier", "Kategori", "Kontak", "Telepon", "Email", "Sertifikasi", "Status", "Risiko Finansial", "Risiko Geografis", "Share Belanja", "Skor Risiko"].map(
                      (h) => (
                        <th key={h} className="px-2 py-2 text-left font-medium" style={{ color: "#8A8A8E" }}>
                          {h}
                        </th>
                      )
                    )}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {masterSuppliers.map((s, i) => (
                    <tr
                      key={s.id}
                      style={{
                        backgroundColor:
                          s.status === "blacklist" ? "rgba(226,104,90,0.08)" : i % 2 === 0 ? "rgba(255,255,255,0.4)" : "transparent",
                      }}
                    >
                      <td className="px-2 py-1.5 whitespace-nowrap font-mono text-[10px]" style={{ color: "#9A9AA0" }}>
                        {s.id}
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={s.name}
                          onChange={(e) => updateMasterSupplier(i, "name", e.target.value)}
                          className="w-32 rounded-lg px-2 py-1 outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={s.category}
                          onChange={(e) => updateMasterSupplier(i, "category", e.target.value)}
                          className="rounded-lg px-2 py-1 text-xs outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        >
                          {["Bahan Baku", "Kemasan", "Jasa", "MRO", "Lainnya"].map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={s.contactPerson}
                          onChange={(e) => updateMasterSupplier(i, "contactPerson", e.target.value)}
                          placeholder="Nama PIC"
                          className="w-28 rounded-lg px-2 py-1 outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1">
                          <Phone size={11} style={{ color: "#B5B5B9" }} />
                          <input
                            value={s.phone}
                            onChange={(e) => updateMasterSupplier(i, "phone", e.target.value)}
                            className="w-24 rounded-lg px-2 py-1 outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                          />
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1">
                          <Mail size={11} style={{ color: "#B5B5B9" }} />
                          <input
                            value={s.email}
                            onChange={(e) => updateMasterSupplier(i, "email", e.target.value)}
                            className="w-32 rounded-lg px-2 py-1 outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                          />
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={s.certification}
                          onChange={(e) => updateMasterSupplier(i, "certification", e.target.value)}
                          placeholder="mis. ISO 9001"
                          className="w-28 rounded-lg px-2 py-1 outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={s.status}
                          onChange={(e) => updateMasterSupplier(i, "status", e.target.value)}
                          className="rounded-lg px-2 py-1 text-[11px] font-medium outline-none"
                          style={{
                            backgroundColor:
                              s.status === "active"
                                ? "rgba(79,174,122,0.15)"
                                : s.status === "blacklist"
                                ? "rgba(226,104,90,0.15)"
                                : "rgba(0,0,0,0.06)",
                            color:
                              s.status === "active" ? "#3D8A5D" : s.status === "blacklist" ? "#C0453A" : "#8A8A8E",
                          }}
                        >
                          <option value="active">Aktif</option>
                          <option value="inactive">Nonaktif</option>
                          <option value="blacklist">Blacklist</option>
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={s.financialRisk}
                          onChange={(e) => updateMasterSupplier(i, "financialRisk", Number(e.target.value))}
                          className="rounded-lg px-2 py-1 text-xs outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={s.geoRisk}
                          onChange={(e) => updateMasterSupplier(i, "geoRisk", Number(e.target.value))}
                          className="rounded-lg px-2 py-1 text-xs outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={s.spendSharePct}
                          onChange={(e) => updateMasterSupplier(i, "spendSharePct", Number(e.target.value))}
                          className="w-16 rounded-lg px-2 py-1 outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        />
                        <span className="ml-1 text-[10px]" style={{ color: "#9A9AA0" }}>
                          %
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        {(() => {
                          const r = computeSupplierRisk(s);
                          const color =
                            r.level === "Rendah"
                              ? "#3D8A5D"
                              : r.level === "Sedang"
                              ? "#0A66CC"
                              : r.level === "Tinggi"
                              ? "#C08A2E"
                              : "#C0453A";
                          return (
                            <span
                              className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                              style={{ backgroundColor: `${color}22`, color }}
                            >
                              {r.level} ({r.composite})
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-1">
                        <button onClick={() => removeMasterSupplier(i)}>
                          <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "#8A8A8E" }}>
              Gunakan nama supplier yang sama persis di tab Evaluasi Supplier, TCO, dan Purchase Order agar seluruh
              modul saling terhubung dengan konsisten.
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: "#8A8A8E" }}>
              <span className="font-medium">Skor Risiko</span> = (Risiko Finansial × 35%) + (Risiko Geografis × 35%)
              + (Risiko Ketergantungan dari Share Belanja × 30%), skala 1–5. Semakin besar share belanja pada satu
              supplier, semakin tinggi risiko ketergantungan tunggal (single-source dependency).
              {spendShareTotal > 100 && (
                <span className="ml-1 font-semibold" style={{ color: "#C0453A" }}>
                  Total share belanja supplier aktif saat ini {spendShareTotal}% — melebihi 100%, periksa kembali
                  proporsinya.
                </span>
              )}
            </p>
          </SectionCard>
        </div>
      )}

      {tab === "rfq" && (
        <SectionCard
          title="RFQ — Perbandingan Penawaran"
          subtitle="Catat penawaran harga riil per item dari beberapa supplier"
          accent={accent}
        >
          <div className="mb-3 flex justify-end">
            <button
              onClick={addRfqQuote}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
              style={{ backgroundColor: `${accent}22`, color: accent }}
            >
              <Plus size={12} /> Tambah Penawaran
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-xs">
              <thead>
                <tr>
                  {["Item", "Supplier", "Harga Penawaran", "MOQ", "Lead Time (hari)", "Berlaku s/d"].map((h) => (
                    <th key={h} className="px-2 py-2 text-left font-medium" style={{ color: "#8A8A8E" }}>
                      {h}
                    </th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rfqQuotes.map((r, i) => {
                  const isCheapest = r.itemName && r.quotedPrice === rfqCheapestByItem[r.itemName];
                  return (
                    <tr key={r.id} style={{ backgroundColor: isCheapest ? "rgba(79,174,122,0.08)" : "transparent" }}>
                      <td className="px-2 py-1.5">
                        <input
                          value={r.itemName}
                          onChange={(e) => updateRfqQuote(i, "itemName", e.target.value)}
                          placeholder="Nama item"
                          className="w-32 rounded-lg px-2 py-1 outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={r.supplierName}
                          onChange={(e) => updateRfqQuote(i, "supplierName", e.target.value)}
                          placeholder="Nama supplier"
                          className="w-28 rounded-lg px-2 py-1 outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={r.quotedPrice}
                            onChange={(e) => updateRfqQuote(i, "quotedPrice", e.target.value)}
                            className="w-24 rounded-lg px-2 py-1 outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                          />
                          {isCheapest && (
                            <span className="text-[9px] font-semibold" style={{ color: "#3D8A5D" }}>
                              Termurah
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          value={r.moq}
                          onChange={(e) => updateRfqQuote(i, "moq", e.target.value)}
                          className="w-20 rounded-lg px-2 py-1 outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          value={r.leadTimeDays}
                          onChange={(e) => updateRfqQuote(i, "leadTimeDays", e.target.value)}
                          className="w-20 rounded-lg px-2 py-1 outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="date"
                          value={r.validUntil}
                          onChange={(e) => updateRfqQuote(i, "validUntil", e.target.value)}
                          className="rounded-lg px-2 py-1 outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        />
                      </td>
                      <td className="px-1">
                        <button onClick={() => removeRfqQuote(i)}>
                          <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {rfqQuotes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-2 py-4 text-center text-[11px]" style={{ color: "#9A9AA0" }}>
                      Belum ada penawaran tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "#8A8A8E" }}>
            Isi <span className="font-medium">Item</span> dengan nama yang sama untuk membandingkan beberapa
            penawaran — baris dengan harga terendah per item ditandai otomatis sebagai "Termurah".
          </p>
        </SectionCard>
      )}

      {tab === "scoring" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_1fr]">
          <SectionCard title="Bobot Kriteria" subtitle="Total harus 100%" accent={accent}>
            <div className="space-y-3">
              {criteria.map((c, i) => (
                <div key={c.name}>
                  <FieldLabel>{c.name}</FieldLabel>
                  <NumberInput value={c.weight} onChange={(v) => updateWeight(i, v)} suffix="%" min={0} max={100} />
                </div>
              ))}
            </div>
            <div
              className="mt-4 rounded-xl px-3 py-2 text-xs font-medium"
              style={{
                backgroundColor: weightTotal === 100 ? "rgba(79,174,122,0.15)" : "rgba(226,104,90,0.15)",
                color: weightTotal === 100 ? "#3D8A5D" : "#C0453A",
              }}
            >
              Total bobot: {weightTotal}% {weightTotal !== 100 && "— harus 100%"}
            </div>
          </SectionCard>

          <SectionCard title="Penilaian Supplier" subtitle="Skala 1–10 tiap kriteria" accent={accent}>
            <div className="mb-3 flex justify-end">
              <button
                onClick={addScoringSupplier}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah Supplier
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left font-medium" style={{ color: "#8A8A8E" }}>
                      Supplier
                    </th>
                    {criteria.map((c) => (
                      <th key={c.name} className="px-2 py-2 text-center font-medium" style={{ color: "#8A8A8E" }}>
                        {c.name}
                      </th>
                    ))}
                    <th className="px-2 py-2 text-center font-medium" style={{ color: "#8A8A8E" }}>
                      Skor
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {scoringSuppliers.map((s, si) => {
                    const result = scoringResults.find((r) => r.name === s.name);
                    const isTop = scoringResults[0]?.name === s.name;
                    return (
                      <tr key={si} style={{ backgroundColor: isTop ? "rgba(10,132,255,0.06)" : "transparent" }}>
                        <td className="px-2 py-1.5">
                          <input
                            value={s.name}
                            onChange={(e) =>
                              setScoringSuppliers(
                                scoringSuppliers.map((row, i) =>
                                  i === si ? { ...row, name: e.target.value } : row
                                )
                              )
                            }
                            className="w-28 rounded-lg px-2 py-1 outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                          />
                        </td>
                        {criteria.map((c) => (
                          <td key={c.name} className="px-2 py-1.5 text-center">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={s.scores[c.name] ?? 5}
                              onChange={(e) => updateScore(si, c.name, e.target.value)}
                              className="w-12 rounded-lg px-1.5 py-1 text-center outline-none"
                              style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                            />
                          </td>
                        ))}
                        <td className="px-2 py-1.5 text-center font-semibold" style={{ color: isTop ? accent : "#1D1D1F" }}>
                          {result?.total ?? "—"}
                        </td>
                        <td className="px-1">
                          <button onClick={() => removeScoringSupplier(si)}>
                            <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {scoringResults[0] && (
              <div className="mt-4 rounded-xl p-3.5" style={{ backgroundColor: "rgba(10,132,255,0.1)" }}>
                <p className="text-xs" style={{ color: "#4B4B4F" }}>
                  Skor tertinggi:{" "}
                  <span className="font-semibold" style={{ color: "#0A66CC" }}>
                    {scoringResults[0].name}
                  </span>{" "}
                  ({scoringResults[0].total} / 10)
                </p>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {tab === "ahp" && (
        <div className="flex flex-col gap-4">
          <SectionCard
            title="AHP — Perbandingan Berpasangan Kriteria"
            subtitle="Skala Saaty 1–9 (1 = sama penting, 9 = mutlak lebih penting)"
            accent={accent}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left font-medium" style={{ color: "#8A8A8E" }}></th>
                    {criteria.map((c) => (
                      <th key={c.name} className="px-2 py-2 text-center font-medium" style={{ color: "#8A8A8E" }}>
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {criteria.map((rowC, i) => (
                    <tr key={rowC.name}>
                      <td className="px-2 py-1.5 text-left font-medium" style={{ color: "#4B4B4F" }}>
                        {rowC.name}
                      </td>
                      {criteria.map((colC, j) => (
                        <td key={colC.name} className="px-2 py-1.5 text-center">
                          {i === j ? (
                            <span style={{ color: "#B5B5B9" }}>1</span>
                          ) : i < j ? (
                            <input
                              type="number"
                              step="0.1"
                              min="0.11"
                              max="9"
                              value={ahpValues[`${i}-${j}`] ?? 1}
                              onChange={(e) => setAhpValue(i, j, e.target.value)}
                              className="w-16 rounded-lg px-1.5 py-1 text-center outline-none"
                              style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                            />
                          ) : (
                            <span style={{ color: "#B5B5B9" }}>
                              {(1 / (Number(ahpValues[`${j}-${i}`]) || 1)).toFixed(2)}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl p-3.5" style={{ backgroundColor: "rgba(255,255,255,0.6)" }}>
                <p className="mb-2 text-[11px] font-medium" style={{ color: "#4B4B4F" }}>
                  Bobot Kriteria Hasil AHP
                </p>
                <div className="space-y-1.5">
                  {ahpResult.weights.map((w) => (
                    <div key={w.name} className="flex items-center justify-between text-xs">
                      <span style={{ color: "#4B4B4F" }}>{w.name}</span>
                      <span className="font-semibold">{w.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div
                className="rounded-xl p-3.5"
                style={{ backgroundColor: ahpResult.consistent ? "rgba(79,174,122,0.12)" : "rgba(226,104,90,0.12)" }}
              >
                <p className="mb-2 text-[11px] font-medium" style={{ color: "#4B4B4F" }}>
                  Uji Konsistensi
                </p>
                <p className="text-xs" style={{ color: "#4B4B4F" }}>
                  λmax = {ahpResult.lambdaMax} · CI = {ahpResult.CI} · <span className="font-semibold">CR = {ahpResult.CR}</span>
                </p>
                <p className="mt-1.5 text-[11px] font-semibold" style={{ color: ahpResult.consistent ? "#3D8A5D" : "#C0453A" }}>
                  {ahpResult.consistent
                    ? "Konsisten (CR < 0.1) — bobot valid dipakai."
                    : "Tidak konsisten (CR ≥ 0.1) — sebaiknya tinjau ulang penilaian perbandingan di atas."}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="TOPSIS — Peringkat Kedekatan ke Solusi Ideal"
            subtitle="Memakai skor Evaluasi Supplier, dibobot dengan hasil AHP di atas"
            accent={accent}
          >
            <div className="space-y-2.5">
              {topsisResults.map((r, i) => (
                <div
                  key={r.name}
                  className="flex items-center justify-between rounded-xl p-3.5"
                  style={{ backgroundColor: i === 0 ? "rgba(10,132,255,0.12)" : "rgba(255,255,255,0.6)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: i === 0 ? "#0A84FF" : "rgba(0,0,0,0.08)",
                        color: i === 0 ? "white" : "#8A8A8E",
                      }}
                    >
                      {i + 1}
                    </div>
                    <p className="text-sm font-medium">{r.name}</p>
                  </div>
                  <p className="text-lg font-semibold tracking-tight" style={{ color: i === 0 ? "#0A66CC" : "#1D1D1F" }}>
                    {r.closeness}
                    <span className="ml-1 text-[10px] font-normal" style={{ color: "#9A9AA0" }}>
                      C+
                    </span>
                  </p>
                </div>
              ))}
              {topsisResults.length === 0 && (
                <p className="text-xs" style={{ color: "#9A9AA0" }}>
                  Isi data di tab Evaluasi Supplier terlebih dahulu.
                </p>
              )}
            </div>
            {scoringResults[0] && topsisResults[0] && scoringResults[0].name !== topsisResults[0].name && (
              <p className="mt-3 rounded-xl p-3 text-[11px] leading-relaxed" style={{ backgroundColor: "rgba(226,104,90,0.1)", color: "#C0453A" }}>
                Perhatian: metode Weighted Sum (tab Evaluasi Supplier) dan TOPSIS menghasilkan pemenang berbeda —{" "}
                {scoringResults[0].name} vs {topsisResults[0].name}. Ini menandakan keputusan cukup sensitif
                terhadap metode/bobot yang dipakai; disarankan uji tambahan sebelum finalisasi.
              </p>
            )}
          </SectionCard>
        </div>
      )}

      {tab === "tco" && (
        <SectionCard title="Total Cost of Ownership per Supplier" subtitle="Semua nilai dalam Rupiah" accent={accent}>
          <div className="mb-3 flex justify-end">
            <button
              onClick={addTcoSupplier}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
              style={{ backgroundColor: `${accent}22`, color: accent }}
            >
              <Plus size={12} /> Tambah Supplier
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-xs">
              <thead>
                <tr>
                  {["Supplier", "Harga/Unit", "Ongkir/Unit", "Tarif %", "Reject %", "Qty", "Biaya Tetap"].map((h) => (
                    <th key={h} className="px-2 py-2 text-left font-medium" style={{ color: "#8A8A8E" }}>
                      {h}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center font-medium" style={{ color: "#8A8A8E" }}>
                    Total TCO
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tcoSuppliers.map((s, i) => {
                  const result = tcoResults.find((r) => r.name === s.name);
                  const isBest = tcoResults[0]?.name === s.name;
                  return (
                    <tr key={i} style={{ backgroundColor: isBest ? "rgba(79,174,122,0.08)" : "transparent" }}>
                      <td className="px-2 py-1.5">
                        <input
                          value={s.name}
                          onChange={(e) => updateTco(i, "name", e.target.value)}
                          className="w-24 rounded-lg px-2 py-1 outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        />
                      </td>
                      {["price", "freight", "tariffPct", "defectPct", "qty", "fixedCost"].map((f) => (
                        <td key={f} className="px-2 py-1.5">
                          <input
                            type="number"
                            value={s[f]}
                            onChange={(e) => updateTco(i, f, e.target.value)}
                            className="w-20 rounded-lg px-2 py-1 outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                          />
                        </td>
                      ))}
                      <td
                        className="px-2 py-1.5 text-center font-semibold"
                        style={{ color: isBest ? "#3D8A5D" : "#1D1D1F" }}
                      >
                        Rp {result?.totalTco.toLocaleString("id-ID")}
                      </td>
                      <td className="px-1">
                        <button onClick={() => removeTcoSupplier(i)}>
                          <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {tcoResults[0] && (
            <div className="mt-4 rounded-xl p-3.5" style={{ backgroundColor: "rgba(79,174,122,0.12)" }}>
              <p className="text-xs" style={{ color: "#4B4B4F" }}>
                TCO terendah:{" "}
                <span className="font-semibold" style={{ color: "#3D8A5D" }}>
                  {tcoResults[0].name}
                </span>{" "}
                (Rp {tcoResults[0].totalTco.toLocaleString("id-ID")})
              </p>
            </div>
          )}
        </SectionCard>
      )}

      {tab === "recommend" && (
        <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_1fr]">
          <SectionCard title="Bobot Keputusan" subtitle="Seberapa penting kualitas vs biaya" accent={accent}>
            <FieldLabel hint="Sisanya otomatis jadi bobot biaya">
              Bobot Skor Kualitas: {scoreWeight}%
            </FieldLabel>
            <input
              type="range"
              min={0}
              max={100}
              value={scoreWeight}
              onChange={(e) => setScoreWeight(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: accent }}
            />
            <div className="mt-2 flex justify-between text-[11px]" style={{ color: "#9A9AA0" }}>
              <span>Biaya: {100 - scoreWeight}%</span>
              <span>Kualitas: {scoreWeight}%</span>
            </div>
            <p className="mt-4 text-xs leading-relaxed" style={{ color: "#8A8A8E" }}>
              Skor akhir menggabungkan hasil Evaluasi Supplier dan TCO secara ternormalisasi, lalu diberi bobot sesuai prioritas di atas.
            </p>
          </SectionCard>

          <SectionCard title="Peringkat Akhir Supplier" accent={accent}>
            <div className="space-y-2.5">
              {recommendation.map((r, i) => (
                <div
                  key={r.name}
                  className="flex items-center justify-between rounded-xl p-3.5"
                  style={{ backgroundColor: i === 0 ? "rgba(10,132,255,0.12)" : "rgba(255,255,255,0.6)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: i === 0 ? "#0A84FF" : "rgba(0,0,0,0.08)",
                        color: i === 0 ? "white" : "#8A8A8E",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-[11px]" style={{ color: "#9A9AA0" }}>
                        Skor {r.score}/10 · TCO Rp {r.tco.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold tracking-tight" style={{ color: i === 0 ? "#0A66CC" : "#1D1D1F" }}>
                    {r.final}
                  </p>
                </div>
              ))}
              {recommendation.length === 0 && (
                <p className="text-xs" style={{ color: "#9A9AA0" }}>
                  Samakan nama supplier di tab Evaluasi Supplier dan TCO agar bisa dibandingkan.
                </p>
              )}
            </div>
          </SectionCard>
        </div>

          <SectionCard
            title="Analisis Sensitivitas"
            subtitle="Bagaimana jika bobot kualitas vs biaya diubah?"
            accent={accent}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-xs">
                <thead>
                  <tr>
                    {sensitivityScenarios.map((s) => (
                      <th key={s.weight} className="px-2 py-2 text-center font-medium" style={{ color: "#8A8A8E" }}>
                        Kualitas {s.weight}%
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {sensitivityScenarios.map((s) => (
                      <td key={s.weight} className="px-2 py-2 text-center font-semibold">
                        {s.top}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p
              className="mt-3 rounded-xl p-3 text-[11px] leading-relaxed"
              style={{
                backgroundColor: sensitivityStable ? "rgba(79,174,122,0.1)" : "rgba(226,104,90,0.1)",
                color: sensitivityStable ? "#3D8A5D" : "#C0453A",
              }}
            >
              {sensitivityStable
                ? "Stabil — pemenang tidak berubah di seluruh rentang bobot kualitas vs biaya (0–100%). Keputusan cukup meyakinkan."
                : "Sensitif — pemenang berganti tergantung bobot kualitas vs biaya yang dipilih. Pertimbangkan diskusi lebih lanjut dengan pemangku kepentingan sebelum finalisasi."}
            </p>
          </SectionCard>
        </div>
      )}

      {tab === "sourcing" && (
        <div className="flex flex-col gap-4">
          <SectionCard
            title="Multi-Sourcing — Alokasi Pembelian"
            subtitle="Bagi kuantitas pembelian ke beberapa supplier untuk mitigasi risiko single-source"
            accent={accent}
          >
            <div className="mb-3 flex justify-end">
              <button
                onClick={addSourcingPlan}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah Rencana
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {sourcingPlans.map((plan) => {
                const pctTotal = plan.allocations.reduce((sum, a) => sum + (Number(a.pct) || 0), 0);
                return (
                  <div key={plan.id} className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.55)" }}>
                    <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <FieldLabel>Nama Item</FieldLabel>
                        <input
                          value={plan.itemName}
                          onChange={(e) => updateSourcingPlan(plan.id, { itemName: e.target.value })}
                          className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                        />
                      </div>
                      <div>
                        <FieldLabel>Total Kuantitas Dibutuhkan</FieldLabel>
                        <NumberInput
                          value={plan.totalQty}
                          onChange={(v) => updateSourcingPlan(plan.id, { totalQty: Number(v) })}
                          suffix="unit"
                        />
                      </div>
                      <div className="flex items-end justify-end">
                        <button onClick={() => removeSourcingPlan(plan.id)}>
                          <Trash2 size={14} style={{ color: "#C7C7CC" }} />
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[480px] border-collapse text-xs">
                        <thead>
                          <tr>
                            {["Supplier", "Alokasi %", "Kuantitas"].map((h) => (
                              <th key={h} className="px-2 py-1.5 text-left font-medium" style={{ color: "#8A8A8E" }}>
                                {h}
                              </th>
                            ))}
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {plan.allocations.map((a, ai) => (
                            <tr key={ai}>
                              <td className="px-2 py-1.5">
                                <select
                                  value={a.supplierName}
                                  onChange={(e) => updateAllocation(plan.id, ai, "supplierName", e.target.value)}
                                  className="w-32 rounded-lg px-2 py-1 outline-none"
                                  style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                                >
                                  <option value="">— pilih —</option>
                                  {masterSuppliers
                                    .filter((s) => s.status !== "blacklist")
                                    .map((s) => (
                                      <option key={s.id} value={s.name}>
                                        {s.name}
                                      </option>
                                    ))}
                                </select>
                              </td>
                              <td className="px-2 py-1.5">
                                <input
                                  type="number"
                                  value={a.pct}
                                  onChange={(e) => updateAllocation(plan.id, ai, "pct", e.target.value)}
                                  className="w-20 rounded-lg px-2 py-1 outline-none"
                                  style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                                />
                                <span className="ml-1 text-[10px]" style={{ color: "#9A9AA0" }}>
                                  %
                                </span>
                              </td>
                              <td className="px-2 py-1.5 font-semibold">
                                {Math.round(((Number(a.pct) || 0) / 100) * (Number(plan.totalQty) || 0)).toLocaleString("id-ID")}{" "}
                                <span className="text-[10px] font-normal" style={{ color: "#9A9AA0" }}>
                                  unit
                                </span>
                              </td>
                              <td className="px-1">
                                <button onClick={() => removeAllocation(plan.id, ai)}>
                                  <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <button
                        onClick={() => addAllocation(plan.id)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                        style={{ backgroundColor: `${accent}18`, color: accent }}
                      >
                        <Plus size={12} /> Tambah Supplier
                      </button>
                      <span
                        className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          backgroundColor: pctTotal === 100 ? "rgba(79,174,122,0.15)" : "rgba(226,104,90,0.15)",
                          color: pctTotal === 100 ? "#3D8A5D" : "#C0453A",
                        }}
                      >
                        Total alokasi: {pctTotal}% {pctTotal !== 100 && "— harus 100%"}
                      </span>
                    </div>
                  </div>
                );
              })}
              {sourcingPlans.length === 0 && (
                <p className="text-xs" style={{ color: "#9A9AA0" }}>
                  Belum ada rencana alokasi. Tambahkan rencana untuk membagi pembelian satu item ke beberapa
                  supplier (mis. 70%–30%) sebagai mitigasi risiko single-source.
                </p>
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {tab === "contracts" && (
        <div className="flex flex-col gap-4">
          {contractsExpiringSoon.length > 0 && (
            <div className="rounded-2xl p-3.5" style={{ backgroundColor: "rgba(226,104,90,0.1)" }}>
              <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#C0453A" }}>
                <AlertTriangle size={13} /> {contractsExpiringSoon.length} kontrak akan/telah berakhir dalam ≤30
                hari — segera tinjau untuk perpanjangan atau negosiasi ulang.
              </p>
            </div>
          )}

          <SectionCard
            title="Kontrak & Harga Supplier"
            subtitle="Perjanjian harga, masa berlaku, dan syarat kerja sama"
            accent={accent}
          >
            <div className="mb-3 flex justify-end">
              <button
                onClick={addContract}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah Kontrak
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-xs">
                <thead>
                  <tr>
                    {["No. Kontrak", "Supplier", "Item", "Harga Sepakat", "Mulai", "Berakhir", "Status"].map((h) => (
                      <th key={h} className="px-2 py-2 text-left font-medium" style={{ color: "#8A8A8E" }}>
                        {h}
                      </th>
                    ))}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c, i) => {
                    const status = contractStatus(c);
                    return (
                      <tr key={c.id}>
                        <td className="px-2 py-1.5 font-mono text-[10px]" style={{ color: "#9A9AA0" }}>
                          {c.id}
                        </td>
                        <td className="px-2 py-1.5">
                          <select
                            value={c.supplierName}
                            onChange={(e) => updateContract(i, "supplierName", e.target.value)}
                            className="w-28 rounded-lg px-2 py-1 outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                          >
                            <option value="">— pilih —</option>
                            {masterSuppliers.map((s) => (
                              <option key={s.id} value={s.name}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            value={c.itemName}
                            onChange={(e) => updateContract(i, "itemName", e.target.value)}
                            className="w-28 rounded-lg px-2 py-1 outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            value={c.agreedPrice}
                            onChange={(e) => updateContract(i, "agreedPrice", e.target.value)}
                            className="w-24 rounded-lg px-2 py-1 outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="date"
                            value={c.startDate}
                            onChange={(e) => updateContract(i, "startDate", e.target.value)}
                            className="rounded-lg px-2 py-1 outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="date"
                            value={c.endDate}
                            onChange={(e) => updateContract(i, "endDate", e.target.value)}
                            className="rounded-lg px-2 py-1 outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <span
                            className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: `${status.color}22`, color: status.color }}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-1">
                          <button onClick={() => removeContract(i)}>
                            <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3">
              {contracts.map((c, i) => (
                <div key={`${c.id}-terms`} className="mb-2 rounded-xl p-2.5" style={{ backgroundColor: "rgba(255,255,255,0.5)" }}>
                  <FieldLabel>Syarat & Ketentuan — {c.id}</FieldLabel>
                  <textarea
                    value={c.terms}
                    onChange={(e) => updateContract(i, "terms", e.target.value)}
                    rows={2}
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                  />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {tab === "performance" && (
        <div className="flex flex-col gap-4">
          <SectionCard
            title="Ringkasan OTIF per Supplier"
            subtitle="On-Time In-Full — indikator kinerja pengiriman aktual"
            accent={accent}
          >
            <div className="space-y-2.5">
              {supplierOtifSummary.map((s) => {
                const badge = otifBadge(s.otifPct);
                return (
                  <div key={s.name} className="rounded-xl p-3.5" style={{ backgroundColor: "rgba(255,255,255,0.6)" }}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium">{s.name}</p>
                      <span
                        className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                        style={{ backgroundColor: `${badge.color}22`, color: badge.color }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-semibold" style={{ color: "#1D1D1F" }}>
                          {s.onTimePct}%
                        </p>
                        <p className="text-[10px]" style={{ color: "#9A9AA0" }}>
                          On-Time
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold" style={{ color: "#1D1D1F" }}>
                          {s.inFullPct}%
                        </p>
                        <p className="text-[10px]" style={{ color: "#9A9AA0" }}>
                          In-Full
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold" style={{ color: accent }}>
                          {s.otifPct}%
                        </p>
                        <p className="text-[10px]" style={{ color: "#9A9AA0" }}>
                          OTIF ({s.total}x kirim)
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {supplierOtifSummary.length === 0 && (
                <p className="text-xs" style={{ color: "#9A9AA0" }}>
                  Belum ada catatan pengiriman. Tambahkan data di tabel bawah.
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Catatan Pengiriman" subtitle="Bandingkan janji vs realisasi tiap pengiriman" accent={accent}>
            <div className="mb-3 flex justify-end">
              <button
                onClick={addPerformanceRecord}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah Catatan
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-xs">
                <thead>
                  <tr>
                    {["Supplier", "Ref. PO", "Janji Kirim", "Kirim Aktual", "Qty Pesan", "Qty Terima", "Hasil"].map(
                      (h) => (
                        <th key={h} className="px-2 py-2 text-left font-medium" style={{ color: "#8A8A8E" }}>
                          {h}
                        </th>
                      )
                    )}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {performanceRecords.map((r, i) => {
                    const evalRes = evalPerformanceRecord(r);
                    return (
                      <tr key={r.id}>
                        <td className="px-2 py-1.5">
                          <select
                            value={r.supplierName}
                            onChange={(e) => updatePerformanceRecord(i, "supplierName", e.target.value)}
                            className="w-28 rounded-lg px-2 py-1 outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                          >
                            <option value="">— pilih —</option>
                            {masterSuppliers.map((s) => (
                              <option key={s.id} value={s.name}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            value={r.poRef}
                            onChange={(e) => updatePerformanceRecord(i, "poRef", e.target.value)}
                            placeholder="PO-0001"
                            className="w-20 rounded-lg px-2 py-1 outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="date"
                            value={r.promisedDate}
                            onChange={(e) => updatePerformanceRecord(i, "promisedDate", e.target.value)}
                            className="rounded-lg px-2 py-1 outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="date"
                            value={r.actualDate}
                            onChange={(e) => updatePerformanceRecord(i, "actualDate", e.target.value)}
                            className="rounded-lg px-2 py-1 outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            value={r.qtyOrdered}
                            onChange={(e) => updatePerformanceRecord(i, "qtyOrdered", e.target.value)}
                            className="w-20 rounded-lg px-2 py-1 outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            value={r.qtyReceived}
                            onChange={(e) => updatePerformanceRecord(i, "qtyReceived", e.target.value)}
                            className="w-20 rounded-lg px-2 py-1 outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          {evalRes.onTime === null ? (
                            <span className="text-[10px]" style={{ color: "#B5B5B9" }}>
                              —
                            </span>
                          ) : (
                            <span
                              className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                              style={{
                                backgroundColor: evalRes.otif ? "rgba(79,174,122,0.15)" : "rgba(226,104,90,0.15)",
                                color: evalRes.otif ? "#3D8A5D" : "#C0453A",
                              }}
                            >
                              {evalRes.otif ? "OTIF" : !evalRes.onTime && !evalRes.inFull ? "Telat & Kurang" : !evalRes.onTime ? "Telat" : "Kurang Qty"}
                            </span>
                          )}
                        </td>
                        <td className="px-1">
                          <button onClick={() => removePerformanceRecord(i)}>
                            <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {tab === "po" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <ResultStat accent={accent} label="Total PO" value={poSummary.total} unit="" />
            <ResultStat accent={accent} label="Draft" value={poSummary.draft} unit="" />
            <ResultStat accent={accent} label="Dalam Proses" value={poSummary.inProgress} unit="" highlight />
            <ResultStat accent={accent} label="Diterima" value={poSummary.received} unit="" />
            <ResultStat accent={accent} label="Nilai PO Terbuka" value={`Rp ${poSummary.openValue.toLocaleString("id-ID")}`} unit="" />
          </div>

          <SectionCard
            title="Daftar Purchase Order"
            subtitle="Draft → Dikirim → Dikonfirmasi → Diterima"
            accent={accent}
          >
            <div className="mb-3 flex flex-wrap justify-end gap-2">
              {demandSignal?.skuList?.length > 0 && (
                <button
                  onClick={createPoFromEoq}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
                  style={{ backgroundColor: "rgba(10,132,255,0.12)", color: "#0A66CC" }}
                >
                  <Sparkles size={12} /> Buat dari Usulan EOQ ({demandSignal.skuList.length} SKU)
                </button>
              )}
              {productionSignal?.poSuggestions?.length > 0 && (
                <button
                  onClick={createPoFromMrp}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
                  style={{ backgroundColor: "rgba(76,134,214,0.12)", color: "#4C86D6" }}
                >
                  <Sparkles size={12} /> Buat dari Planned Order MRP ({productionSignal.poSuggestions.length} komponen)
                </button>
              )}
              <button
                onClick={() => addPurchaseOrder()}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> PO Baru
              </button>
            </div>

            {purchaseOrders.length === 0 ? (
              <p className="text-xs" style={{ color: "#9A9AA0" }}>
                Belum ada Purchase Order. Buat PO baru secara manual, atau otomatis dari usulan EOQ Modul Demand
                Planning atau Planned Order Release MRP Modul Production Planning bila tersedia.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-xs">
                  <thead>
                    <tr>
                      {["No. PO", "Supplier", "Tgl Pesan", "Estimasi Tiba", "Item", "Total Nilai", "Status"].map(
                        (h) => (
                          <th key={h} className="px-2 py-2 text-left font-medium" style={{ color: "#8A8A8E" }}>
                            {h}
                          </th>
                        )
                      )}
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrders.map((po) => {
                      const meta = PO_STATUS_META[po.status] || PO_STATUS_META.draft;
                      const isActive = activePoId === po.id;
                      return (
                        <tr
                          key={po.id}
                          onClick={() => setActivePoId(isActive ? null : po.id)}
                          className="cursor-pointer"
                          style={{ backgroundColor: isActive ? "rgba(10,132,255,0.06)" : "transparent" }}
                        >
                          <td className="px-2 py-2 font-mono text-[10px]" style={{ color: "#9A9AA0" }}>
                            {po.id}
                          </td>
                          <td className="px-2 py-2 font-medium">{po.supplierName || "—"}</td>
                          <td className="px-2 py-2">{po.orderDate || "—"}</td>
                          <td className="px-2 py-2">{po.expectedDate || "—"}</td>
                          <td className="px-2 py-2">{po.items.length}</td>
                          <td className="px-2 py-2 font-semibold">Rp {poTotal(po).toLocaleString("id-ID")}</td>
                          <td className="px-2 py-2">
                            <span
                              className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                              style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
                            >
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removePurchaseOrder(po.id);
                              }}
                            >
                              <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {activePoId &&
            (() => {
              const po = purchaseOrders.find((p) => p.id === activePoId);
              if (!po) return null;
              const meta = PO_STATUS_META[po.status] || PO_STATUS_META.draft;
              const nextIdx = PO_STATUS_ORDER.indexOf(po.status);
              const nextLabel =
                nextIdx >= 0 && nextIdx < PO_STATUS_ORDER.length - 1
                  ? PO_STATUS_META[PO_STATUS_ORDER[nextIdx + 1]].label
                  : null;
              return (
                <SectionCard title={`Detail ${po.id}`} subtitle="Klik baris PO lain untuk berpindah" accent={accent}>
                  <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <FieldLabel>Supplier</FieldLabel>
                      <select
                        value={po.supplierName}
                        onChange={(e) => updatePurchaseOrder(po.id, { supplierName: e.target.value })}
                        className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                        style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                      >
                        <option value="">— pilih supplier —</option>
                        {masterSuppliers
                          .filter((s) => s.status !== "blacklist")
                          .map((s) => (
                            <option key={s.id} value={s.name}>
                              {s.name} {s.status === "inactive" ? "(nonaktif)" : ""}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel>Tanggal Pesan</FieldLabel>
                      <input
                        type="date"
                        value={po.orderDate}
                        onChange={(e) => updatePurchaseOrder(po.id, { orderDate: e.target.value })}
                        className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                        style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                      />
                    </div>
                    <div>
                      <FieldLabel>Estimasi Tiba</FieldLabel>
                      <input
                        type="date"
                        value={po.expectedDate}
                        onChange={(e) => updatePurchaseOrder(po.id, { expectedDate: e.target.value })}
                        className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                        style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                      />
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
                      style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    {po.status !== "received" && po.status !== "cancelled" && nextLabel && (
                      <button
                        onClick={() => advancePoStatus(po.id)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
                        style={{ backgroundColor: "rgba(10,132,255,0.12)", color: "#0A66CC" }}
                      >
                        <Truck size={12} /> Tandai {nextLabel}
                      </button>
                    )}
                    {po.status !== "received" && po.status !== "cancelled" && (
                      <button
                        onClick={() => cancelPo(po.id)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
                        style={{ backgroundColor: "rgba(226,104,90,0.12)", color: "#C0453A" }}
                      >
                        <Ban size={12} /> Batalkan
                      </button>
                    )}
                  </div>

                  <div className="mb-2 flex items-center justify-between">
                    <FieldLabel>Item Pesanan</FieldLabel>
                    <button
                      onClick={() => addPoItem(po.id)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                      style={{ backgroundColor: `${accent}22`, color: accent }}
                    >
                      <Plus size={12} /> Tambah Item
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-xs">
                      <thead>
                        <tr>
                          {["SKU", "Nama Item", "Qty", "Harga/Unit", "Subtotal"].map((h) => (
                            <th key={h} className="px-2 py-2 text-left font-medium" style={{ color: "#8A8A8E" }}>
                              {h}
                            </th>
                          ))}
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {po.items.map((it, ii) => (
                          <tr key={ii}>
                            <td className="px-2 py-1.5">
                              {demandSignal?.skuList?.length > 0 ? (
                                <select
                                  value={it.skuId}
                                  onChange={(e) => updatePoItem(po.id, ii, "skuId", e.target.value)}
                                  className="w-32 rounded-lg px-2 py-1 outline-none"
                                  style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                                >
                                  <option value="">manual</option>
                                  {demandSignal.skuList.map((sk) => (
                                    <option key={sk.id} value={sk.id}>
                                      {sk.name} (EOQ {sk.eoqUnit})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-[10px]" style={{ color: "#B5B5B9" }}>
                                  manual
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                value={it.skuName}
                                onChange={(e) => updatePoItem(po.id, ii, "skuName", e.target.value)}
                                placeholder="Nama item"
                                className="w-32 rounded-lg px-2 py-1 outline-none"
                                style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="number"
                                value={it.qty}
                                onChange={(e) => updatePoItem(po.id, ii, "qty", e.target.value)}
                                className="w-20 rounded-lg px-2 py-1 outline-none"
                                style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="number"
                                value={it.unitPrice}
                                onChange={(e) => updatePoItem(po.id, ii, "unitPrice", e.target.value)}
                                className="w-24 rounded-lg px-2 py-1 outline-none"
                                style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                              />
                            </td>
                            <td className="px-2 py-1.5 font-semibold">
                              Rp {((Number(it.qty) || 0) * (Number(it.unitPrice) || 0)).toLocaleString("id-ID")}
                            </td>
                            <td className="px-1">
                              <button onClick={() => removePoItem(po.id, ii)}>
                                <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <p className="text-sm font-semibold">
                      Total: <span style={{ color: accent }}>Rp {poTotal(po).toLocaleString("id-ID")}</span>
                    </p>
                  </div>

                  <div className="mt-4">
                    <FieldLabel>Catatan</FieldLabel>
                    <textarea
                      value={po.notes}
                      onChange={(e) => updatePurchaseOrder(po.id, { notes: e.target.value })}
                      rows={2}
                      className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                      style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                    />
                  </div>
                </SectionCard>
              );
            })()}
        </div>
      )}
    </div>
  );
}

// ---------- Module 3: Production Planning & Control ----------

const GANTT_COLORS = ["#4C86D6", "#2FA9A3", "#E0A82E", "#E2685A", "#8E7CC3", "#5AC8A8", "#D68C4C", "#6B8E9E"];

function GanttChart({ machines, ordered, completion, pxPerUnit = 22 }) {
  const maxTime = Math.max(1, ...completion.map((row) => row[row.length - 1] || 0));
  const axisStep = Math.max(1, Math.round(maxTime / 12));
  return (
    <div className="overflow-x-auto pb-1">
      <div style={{ minWidth: maxTime * pxPerUnit + 140 }}>
        {machines.map((m, mi) => (
          <div key={mi} className="mb-2 flex items-center gap-2">
            <div className="w-24 shrink-0 truncate text-[11px] font-medium" style={{ color: "#4B4B4F" }}>
              {m.name}
            </div>
            <div className="relative h-7 flex-1 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.04)" }}>
              {ordered.map((job, ji) => {
                const dur = Number(job.times[mi]) || 0;
                if (dur <= 0) return null;
                const end = completion[ji][mi];
                const start = end - dur;
                const widthPx = Math.max(dur * pxPerUnit - 2, 3);
                return (
                  <div
                    key={ji}
                    className="absolute top-0.5 flex h-6 items-center justify-center overflow-hidden rounded-md text-[10px] font-medium whitespace-nowrap text-white"
                    style={{
                      left: start * pxPerUnit,
                      width: widthPx,
                      backgroundColor: GANTT_COLORS[ji % GANTT_COLORS.length],
                    }}
                    title={`${job.name}: ${start}–${end}`}
                  >
                    {widthPx > 26 ? job.name : ""}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div className="ml-[104px] mt-1 flex text-[9px]" style={{ color: "#B5B5B9" }}>
          {Array.from({ length: Math.ceil(maxTime) + 1 }).map((_, t) =>
            t % axisStep === 0 ? (
              <span key={t} style={{ width: pxPerUnit * axisStep, flexShrink: 0 }}>
                {t}
              </span>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}

function ProductionModule({ accent }) {
  const [tab, setTab] = useState("bom");
  const reportData = useReportData();
  const demandSignal = reportData.demand;
  const leanSignal = reportData.lean;

  // --- Item Master, BOM & MPS state (Multi-Item MRP) ---
  const LOT_METHODS = [
    { id: "lfl", label: "Lot-for-Lot (LFL)" },
    { id: "foq", label: "Fixed Order Qty (FOQ)" },
    { id: "eoq", label: "Economic Order Qty (EOQ)" },
    { id: "poq", label: "Period Order Qty (POQ)" },
  ];

  const [periods, setPeriods] = usePersistentState("production.periods", [
    "M1", "M2", "M3", "M4", "M5", "M6",
  ]);

  const [items, setItems] = usePersistentState("production.items", [
    { id: "FG1", name: "Sepeda Model A", type: "fg", onHand: 50, leadTime: 1, safetyStock: 10, lotMethod: "lfl", lotSize: 0, orderCost: 150000, holdingCost: 2000 },
    { id: "COMP1", name: "Rangka", type: "component", onHand: 30, leadTime: 2, safetyStock: 5, lotMethod: "foq", lotSize: 100, orderCost: 200000, holdingCost: 1500 },
    { id: "COMP2", name: "Roda (set)", type: "component", onHand: 40, leadTime: 1, safetyStock: 10, lotMethod: "eoq", lotSize: 0, orderCost: 250000, holdingCost: 1000 },
    { id: "COMP3", name: "Baut & Mur (paket)", type: "component", onHand: 500, leadTime: 1, safetyStock: 50, lotMethod: "poq", lotSize: 0, orderCost: 100000, holdingCost: 200 },
  ]);

  const [bom, setBom] = usePersistentState("production.bom", [
    { parentId: "FG1", childId: "COMP1", qtyPer: 1 },
    { parentId: "FG1", childId: "COMP2", qtyPer: 2 },
    { parentId: "FG1", childId: "COMP3", qtyPer: 8 },
  ]);

  const [mps, setMps] = usePersistentState("production.mps", {
    FG1: [100, 120, 90, 140, 110, 130],
  });

  const [selectedMrpItem, setSelectedMrpItem] = usePersistentState("production.selectedMrpItem", "FG1");

  const itemMap = useMemo(() => Object.fromEntries(items.map((it) => [it.id, it])), [items]);
  const childrenOf = useMemo(() => {
    const map = {};
    bom.forEach((b) => {
      if (!map[b.parentId]) map[b.parentId] = [];
      map[b.parentId].push(b);
    });
    return map;
  }, [bom]);
  const isChildItem = useMemo(() => new Set(bom.map((b) => b.childId)), [bom]);
  const topLevelItems = useMemo(() => items.filter((it) => !isChildItem.has(it.id)), [items, isChildItem]);

  // Item CRUD
  const addItem = () =>
    setItems([
      ...items,
      { id: makeId("ITM"), name: "Item Baru", type: "component", onHand: 0, leadTime: 1, safetyStock: 0, lotMethod: "lfl", lotSize: 0, orderCost: 0, holdingCost: 0 },
    ]);
  const removeItem = (id) => {
    setItems(items.filter((it) => it.id !== id));
    setBom(bom.filter((b) => b.parentId !== id && b.childId !== id));
  };
  const updateItem = (id, field, val) =>
    setItems(
      items.map((it) =>
        it.id === id
          ? { ...it, [field]: ["name", "type", "lotMethod"].includes(field) ? val : Number(val) }
          : it
      )
    );

  // BOM CRUD
  const addBomLine = () => {
    if (items.length < 2) return;
    setBom([...bom, { parentId: items[0].id, childId: items[1].id, qtyPer: 1 }]);
  };
  const removeBomLine = (idx) => setBom(bom.filter((_, i) => i !== idx));
  const updateBomLine = (idx, field, val) =>
    setBom(bom.map((b, i) => (i === idx ? { ...b, [field]: field === "qtyPer" ? Number(val) : val } : b)));

  // MPS helpers (hanya untuk item level-atas / finished goods)
  const updateMpsCell = (itemId, periodIdx, val) => {
    const current = mps[itemId] || periods.map(() => 0);
    const next = [...current];
    while (next.length < periods.length) next.push(0);
    next[periodIdx] = Number(val) || 0;
    setMps({ ...mps, [itemId]: next });
  };
  const addPeriod = () => {
    const nextPeriods = [...periods, `M${periods.length + 1}`];
    setPeriods(nextPeriods);
  };
  const removePeriod = () => {
    if (periods.length <= 1) return;
    setPeriods(periods.slice(0, -1));
    const trimmed = {};
    Object.entries(mps).forEach(([k, arr]) => (trimmed[k] = arr.slice(0, -1)));
    setMps(trimmed);
  };

  // EOQ helper (dipakai untuk metode EOQ & sebagai basis interval POQ)
  const computeEOQ = (item, avgPeriodicDemand) => {
    const D = avgPeriodicDemand * periods.length;
    const S = Number(item.orderCost) || 0;
    const H = Number(item.holdingCost) || 0;
    if (D <= 0 || S <= 0 || H <= 0) return 0;
    return Math.sqrt((2 * D * S) / H);
  };

  const runItemRequirementsPlan = (item, grossReqs) => {
    const lt = Math.max(0, Number(item.leadTime) || 0);
    const buffer = Math.max(0, Number(item.safetyStock) || 0);
    const n = grossReqs.length;
    const avgDemand = n ? grossReqs.reduce((a, b) => a + b, 0) / n : 0;
    const eoq = Math.max(1, Math.round(computeEOQ(item, avgDemand)) || 1);
    const poqInterval = Math.max(1, Math.round(eoq / (avgDemand || 1)) || 1);

    let oh = Number(item.onHand) || 0;
    const rows = [];
    for (let t = 0; t < n; t++) {
      const gross = grossReqs[t];
      const usable = Math.max(0, oh - buffer);
      const net = gross > usable ? gross - usable : 0;
      let receipt = 0;
      if (net > 0) {
        if (item.lotMethod === "foq") {
          const lot = Math.max(1, Number(item.lotSize) || 1);
          receipt = Math.ceil(net / lot) * lot;
        } else if (item.lotMethod === "eoq") {
          receipt = Math.ceil(net / eoq) * eoq;
        } else if (item.lotMethod === "poq") {
          let windowSum = 0;
          for (let k = t; k < Math.min(n, t + poqInterval); k++) windowSum += grossReqs[k];
          receipt = Math.max(net, windowSum - usable);
        } else {
          receipt = net;
        }
      }
      const projectedOnHand = oh + receipt - gross;
      rows.push({
        period: periods[t],
        gross,
        onHandBefore: oh,
        netReq: net,
        plannedReceipt: receipt,
        projectedOnHand,
        belowSafetyStock: buffer > 0 && projectedOnHand < buffer,
      });
      oh = projectedOnHand;
    }

    const releases = rows.map(() => 0);
    let pastDue = 0;
    rows.forEach((row, i) => {
      const idx = i - lt;
      if (idx >= 0) releases[idx] += row.plannedReceipt;
      else pastDue += row.plannedReceipt;
    });

    return {
      itemId: item.id,
      eoq,
      poqInterval,
      rows: rows.map((r, i) => ({ ...r, plannedRelease: releases[i] })),
      pastDue,
      shortfallPeriods: rows.filter((r) => r.belowSafetyStock).length,
      totalPlannedOrder: rows.reduce((a, r) => a + r.plannedReceipt, 0),
    };
  };

  // Explosion BOM berjenjang (Kahn's algorithm: parent dihitung & disebar ke anak sebelum anak diproses)
  const explodeMrp = (mpsSource, ltDelta = 0) => {
    const results = {};
    const grossReqMap = {};
    items.forEach((it) => {
      grossReqMap[it.id] = new Array(periods.length).fill(0);
    });

    topLevelItems.forEach((it) => {
      const arr = mpsSource[it.id] || [];
      grossReqMap[it.id] = periods.map((_, i) => Number(arr[i]) || 0);
    });

    const inDegree = {};
    items.forEach((it) => (inDegree[it.id] = 0));
    bom.forEach((b) => {
      if (inDegree[b.childId] !== undefined) inDegree[b.childId] += 1;
    });
    const remaining = { ...inDegree };
    const queue = items.filter((it) => inDegree[it.id] === 0).map((it) => it.id);
    const order = [];
    while (queue.length) {
      const id = queue.shift();
      order.push(id);
      (childrenOf[id] || []).forEach((b) => {
        remaining[b.childId] -= 1;
        if (remaining[b.childId] === 0) queue.push(b.childId);
      });
    }
    items.forEach((it) => {
      if (!order.includes(it.id)) order.push(it.id);
    });

    order.forEach((id) => {
      const item = itemMap[id];
      if (!item) return;
      const adjItem = ltDelta ? { ...item, leadTime: Math.max(0, (Number(item.leadTime) || 0) + ltDelta) } : item;
      const res = runItemRequirementsPlan(adjItem, grossReqMap[id]);
      results[id] = res;
      (childrenOf[id] || []).forEach((b) => {
        const childGross = grossReqMap[b.childId];
        if (!childGross) return;
        res.rows.forEach((r, i) => {
          childGross[i] += r.plannedRelease * (Number(b.qtyPer) || 0);
        });
      });
    });

    return results;
  };

  const mrpExplosion = useMemo(
    () => explodeMrp(mps, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, bom, mps, periods, childrenOf, topLevelItems, itemMap]
  );

  const mrpSummary = useMemo(() => {
    const vals = Object.values(mrpExplosion);
    return {
      totalPastDue: vals.reduce((a, r) => a + r.pastDue, 0),
      itemsWithShortfall: vals.filter((r) => r.shortfallPeriods > 0).length,
      totalItems: vals.length,
    };
  }, [mrpExplosion]);

  const selectedMrpResult = mrpExplosion[selectedMrpItem] || null;

  // --- RCCP state ---
  const [capacityPeriodIdx, setCapacityPeriodIdx] = usePersistentState("production.capacityPeriodIdx", 0);
  const [workCenters, setWorkCenters] = usePersistentState("production.workCenters", [
    { name: "Lini Perakitan 1", available: 400, perUnit: 0.8, qtyMode: "manual", qty: 450, sourceItemId: "", availability: 100, performance: 100, quality: 100 },
    { name: "Stasiun Pengelasan", available: 320, perUnit: 1.2, qtyMode: "manual", qty: 250, sourceItemId: "", availability: 100, performance: 100, quality: 100 },
    { name: "Booth Pengecatan", available: 250, perUnit: 0.5, qtyMode: "manual", qty: 450, sourceItemId: "", availability: 100, performance: 100, quality: 100 },
  ]);

  const addWorkCenter = () =>
    setWorkCenters([
      ...workCenters,
      { name: `Work Center ${workCenters.length + 1}`, available: 300, perUnit: 1, qtyMode: "manual", qty: 100, sourceItemId: "", availability: 100, performance: 100, quality: 100 },
    ]);
  const removeWorkCenter = (idx) => setWorkCenters(workCenters.filter((_, i) => i !== idx));
  const updateWorkCenter = (idx, field, val) =>
    setWorkCenters(
      workCenters.map((w, i) =>
        i === idx
          ? { ...w, [field]: ["name", "qtyMode", "sourceItemId"].includes(field) ? val : Number(val) }
          : w
      )
    );

  const buildCapacityResults = (explosion, demandFactor = 1, applyManual = true) => {
    return workCenters.map((w) => {
      let qty = Number(w.qty) || 0;
      if (w.qtyMode === "mrp" && w.sourceItemId && explosion[w.sourceItemId]) {
        const row = explosion[w.sourceItemId].rows[capacityPeriodIdx];
        qty = row ? row.plannedRelease : 0;
      } else if (applyManual && demandFactor !== 1) {
        qty = qty * demandFactor;
      }
      const required = (Number(w.perUnit) || 0) * qty;
      const baseAvailable = Number(w.available) || 0;
      const oeeFactor =
        (Number(w.availability ?? 100) / 100) *
        (Number(w.performance ?? 100) / 100) *
        (Number(w.quality ?? 100) / 100);
      const effectiveAvailable = baseAvailable * oeeFactor;
      const utilization = effectiveAvailable > 0 ? (required / effectiveAvailable) * 100 : required > 0 ? 999 : 0;
      return {
        name: w.name,
        qty,
        required: Number(required.toFixed(1)),
        baseAvailable,
        effectiveAvailable: Number(effectiveAvailable.toFixed(1)),
        oeePercent: Number((oeeFactor * 100).toFixed(1)),
        utilization: Number(utilization.toFixed(1)),
        overloaded: utilization > 100,
      };
    });
  };

  const capacityResults = useMemo(
    () => buildCapacityResults(mrpExplosion, 1, false),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workCenters, capacityPeriodIdx, mrpExplosion]
  );

  const overloadedCount = capacityResults.filter((r) => r.overloaded).length;
  const avgUtilization =
    capacityResults.length > 0
      ? (capacityResults.reduce((a, r) => a + r.utilization, 0) / capacityResults.length).toFixed(1)
      : "0";

  // --- Rekonsiliasi MPS vs Kapasitas (Rough-Cut Capacity Check) ---
  const mpsCapacityCheck = useMemo(() => {
    const linkedWorkCenters = workCenters.filter(
      (w) => w.qtyMode === "mrp" && w.sourceItemId && topLevelItems.some((it) => it.id === w.sourceItemId)
    );
    return periods.map((p, pi) => {
      const flags = linkedWorkCenters.map((w) => {
        const qty = Number((mps[w.sourceItemId] || [])[pi]) || 0;
        const required = (Number(w.perUnit) || 0) * qty;
        const oeeFactor =
          (Number(w.availability ?? 100) / 100) *
          (Number(w.performance ?? 100) / 100) *
          (Number(w.quality ?? 100) / 100);
        const effectiveAvailable = (Number(w.available) || 0) * oeeFactor;
        return {
          workCenter: w.name,
          itemName: itemMap[w.sourceItemId]?.name || w.sourceItemId,
          required: Number(required.toFixed(1)),
          effectiveAvailable: Number(effectiveAvailable.toFixed(1)),
          overloaded: required > effectiveAvailable,
        };
      });
      return { period: p, flags, hasOverload: flags.some((f) => f.overloaded), hasLinkedWC: linkedWorkCenters.length > 0 };
    });
  }, [periods, workCenters, mps, topLevelItems, itemMap]);

  // --- What-If: Skenario Kapasitas & Jadwal ---
  const [wiDemandPct, setWiDemandPct] = usePersistentState("production.wiDemandPct", 0);
  const [wiLeadTimeDelta, setWiLeadTimeDelta] = usePersistentState("production.wiLeadTimeDelta", 0);
  const [wiApplyManualWC, setWiApplyManualWC] = usePersistentState("production.wiApplyManualWC", true);

  const resetWhatIfProduction = () => {
    setWiDemandPct(0);
    setWiLeadTimeDelta(0);
  };
  const isWhatIfProductionActive = Number(wiDemandPct) !== 0 || Number(wiLeadTimeDelta) !== 0;

  const scenarioMps = useMemo(() => {
    const factor = 1 + (Number(wiDemandPct) || 0) / 100;
    const out = {};
    topLevelItems.forEach((it) => {
      const base = mps[it.id] || periods.map(() => 0);
      out[it.id] = periods.map((_, i) => Math.round((Number(base[i]) || 0) * factor));
    });
    return out;
  }, [mps, topLevelItems, periods, wiDemandPct]);

  const mrpScenario = useMemo(
    () => explodeMrp(scenarioMps, Number(wiLeadTimeDelta) || 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, bom, scenarioMps, periods, childrenOf, topLevelItems, itemMap, wiLeadTimeDelta]
  );

  const mrpSummaryScenario = useMemo(() => {
    const vals = Object.values(mrpScenario);
    return {
      totalPastDue: vals.reduce((a, r) => a + r.pastDue, 0),
      itemsWithShortfall: vals.filter((r) => r.shortfallPeriods > 0).length,
      totalItems: vals.length,
      totalPlannedOrder: vals.reduce((a, r) => a + r.totalPlannedOrder, 0),
    };
  }, [mrpScenario]);

  const mrpTotalPlannedOrderBaseline = useMemo(
    () => Object.values(mrpExplosion).reduce((a, r) => a + r.totalPlannedOrder, 0),
    [mrpExplosion]
  );

  const capacityScenario = useMemo(
    () => buildCapacityResults(mrpScenario, 1 + (Number(wiDemandPct) || 0) / 100, wiApplyManualWC),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workCenters, capacityPeriodIdx, mrpScenario, wiDemandPct, wiApplyManualWC]
  );
  const overloadedCountScenario = capacityScenario.filter((r) => r.overloaded).length;
  const avgUtilizationScenario =
    capacityScenario.length > 0
      ? (capacityScenario.reduce((a, r) => a + r.utilization, 0) / capacityScenario.length).toFixed(1)
      : "0";

  // --- Scheduling state (Flow Shop multi-mesin) ---
  const [machines, setMachines] = usePersistentState("production.machines", [
    { name: "Mesin 1" },
    { name: "Mesin 2" },
    { name: "Mesin 3" },
  ]);
  const [flowJobs, setFlowJobs] = usePersistentState("production.flowJobs", [
    { name: "Job A", times: [4, 3, 2], due: 14 },
    { name: "Job B", times: [2, 4, 3], due: 12 },
    { name: "Job C", times: [6, 2, 4], due: 20 },
    { name: "Job D", times: [3, 3, 3], due: 15 },
  ]);
  const [rule, setRule] = usePersistentState("production.rule", "spt");

  const addMachine = () => {
    setMachines([...machines, { name: `Mesin ${machines.length + 1}` }]);
    setFlowJobs(flowJobs.map((j) => ({ ...j, times: [...(j.times || []), 1] })));
  };
  const removeMachine = (idx) => {
    if (machines.length <= 1) return;
    setMachines(machines.filter((_, i) => i !== idx));
    setFlowJobs(flowJobs.map((j) => ({ ...j, times: (j.times || []).filter((_, i) => i !== idx) })));
  };
  const updateMachine = (idx, val) => setMachines(machines.map((m, i) => (i === idx ? { ...m, name: val } : m)));

  const addFlowJob = () =>
    setFlowJobs([
      ...flowJobs,
      { name: `Job ${String.fromCharCode(65 + flowJobs.length)}`, times: machines.map(() => 1), due: 5 },
    ]);
  const removeFlowJob = (idx) => setFlowJobs(flowJobs.filter((_, i) => i !== idx));
  const updateFlowJob = (idx, field, val) =>
    setFlowJobs(
      flowJobs.map((j, i) => (i === idx ? { ...j, [field]: field === "name" ? val : Number(val) } : j))
    );
  const updateFlowJobTime = (idx, machineIdx, val) =>
    setFlowJobs(
      flowJobs.map((j, i) =>
        i === idx
          ? { ...j, times: (j.times || []).map((t, mi) => (mi === machineIdx ? Number(val) : t)) }
          : j
      )
    );

  const scheduleResult = useMemo(() => {
    const totalTime = (j) => (j.times || []).reduce((a, t) => a + (Number(t) || 0), 0);
    let ordered = flowJobs.map((j) => ({ ...j, times: j.times || machines.map(() => 0) }));
    if (rule === "spt") ordered.sort((a, b) => totalTime(a) - totalTime(b));
    else if (rule === "edd") ordered.sort((a, b) => (Number(a.due) || 0) - (Number(b.due) || 0));

    const n = ordered.length;
    const m = machines.length;
    const completion = Array.from({ length: n }, () => new Array(m).fill(0));
    ordered.forEach((job, j) => {
      for (let mi = 0; mi < m; mi++) {
        const prevJob = j > 0 ? completion[j - 1][mi] : 0;
        const prevMachine = mi > 0 ? completion[j][mi - 1] : 0;
        const start = Math.max(prevJob, prevMachine);
        const dur = Number(job.times[mi]) || 0;
        completion[j][mi] = start + dur;
      }
    });

    const rows = ordered.map((j, i) => {
      const finish = m > 0 ? completion[i][m - 1] : 0;
      const tardiness = Math.max(0, finish - (Number(j.due) || 0));
      return { ...j, completion: finish, tardiness };
    });

    const avgFlow = rows.length ? rows.reduce((a, r) => a + r.completion, 0) / rows.length : 0;
    const avgTardiness = rows.length ? rows.reduce((a, r) => a + r.tardiness, 0) / rows.length : 0;
    const numTardy = rows.filter((r) => r.tardiness > 0).length;
    const makespan = n > 0 && m > 0 ? completion[n - 1][m - 1] : 0;

    return {
      rows,
      ordered,
      completion,
      avgFlow: avgFlow.toFixed(2),
      avgTardiness: avgTardiness.toFixed(2),
      numTardy,
      makespan,
    };
  }, [flowJobs, machines, rule]);

  // --- Usulan PO otomatis dari Planned Order Release komponen (untuk Modul 2) ---
  const poSuggestions = useMemo(() => {
    return items
      .filter((it) => it.type === "component")
      .map((it) => {
        const res = mrpExplosion[it.id];
        if (!res) return null;
        const firstIdx = res.rows.findIndex((r) => r.plannedRelease > 0);
        return {
          itemId: it.id,
          itemName: it.name,
          totalQty: res.totalPlannedOrder,
          nextPeriod: firstIdx >= 0 ? res.rows[firstIdx].period : null,
          nextQty: firstIdx >= 0 ? res.rows[firstIdx].plannedRelease : 0,
          pastDue: res.pastDue,
        };
      })
      .filter((s) => s && s.totalQty > 0);
  }, [items, mrpExplosion]);

  useReportSync("production", {
    mrpPastDue: mrpSummary.totalPastDue,
    mrpShortfallPeriods: mrpSummary.itemsWithShortfall,
    overloadedCount,
    totalWorkCenters: capacityResults.length,
    avgUtilization,
    schedulingRule: rule,
    avgTardiness: scheduleResult.avgTardiness,
    numTardy: scheduleResult.numTardy,
    poSuggestions,
  });

  const tabs = [
    { id: "bom", label: "Item Master & BOM" },
    { id: "mps", label: "MPS" },
    { id: "mrp", label: "MRP" },
    { id: "capacity", label: "Capacity Planning" },
    { id: "scheduling", label: "Penjadwalan Produksi" },
    { id: "whatif", label: "Skenario What-If" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ModuleTabs tabs={tabs} tab={tab} setTab={setTab} accent={accent} />

      {tab === "bom" && (
        <div className="grid grid-cols-1 gap-4">
          <SectionCard title="Item Master" subtitle="Finished goods & komponen — dasar untuk BOM dan MRP berjenjang" accent={accent}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs" style={{ color: "#8A8A8E" }}>
                {items.length} item terdaftar
              </p>
              <button
                onClick={addItem}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah Item
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    {["Nama", "Tipe", "On Hand", "Lead Time", "Safety Stock", "Metode Lot", "Lot Size (FOQ)", "Biaya Pesan (S)", "Biaya Simpan (H)", ""].map((h) => (
                      <th key={h} className="whitespace-nowrap px-2 py-2 text-left font-medium" style={{ color: "#8A8A8E" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                      <td className="px-2 py-1.5">
                        <input
                          value={it.name}
                          onChange={(e) => updateItem(it.id, "name", e.target.value)}
                          className="w-32 rounded-lg px-2 py-1 outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={it.type}
                          onChange={(e) => updateItem(it.id, "type", e.target.value)}
                          className="rounded-lg px-2 py-1 outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        >
                          <option value="fg">Finished Good</option>
                          <option value="component">Komponen</option>
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          value={it.onHand}
                          onChange={(e) => updateItem(it.id, "onHand", e.target.value)}
                          className="w-20 rounded-lg px-2 py-1 outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          value={it.leadTime}
                          onChange={(e) => updateItem(it.id, "leadTime", e.target.value)}
                          className="w-16 rounded-lg px-2 py-1 outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          value={it.safetyStock}
                          onChange={(e) => updateItem(it.id, "safetyStock", e.target.value)}
                          className="w-20 rounded-lg px-2 py-1 outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={it.lotMethod}
                          onChange={(e) => updateItem(it.id, "lotMethod", e.target.value)}
                          className="rounded-lg px-2 py-1 outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        >
                          {LOT_METHODS.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          value={it.lotSize}
                          disabled={it.lotMethod !== "foq"}
                          onChange={(e) => updateItem(it.id, "lotSize", e.target.value)}
                          className="w-20 rounded-lg px-2 py-1 outline-none disabled:opacity-40"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          value={it.orderCost}
                          disabled={it.lotMethod !== "eoq" && it.lotMethod !== "poq"}
                          onChange={(e) => updateItem(it.id, "orderCost", e.target.value)}
                          className="w-24 rounded-lg px-2 py-1 outline-none disabled:opacity-40"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          value={it.holdingCost}
                          disabled={it.lotMethod !== "eoq" && it.lotMethod !== "poq"}
                          onChange={(e) => updateItem(it.id, "holdingCost", e.target.value)}
                          className="w-24 rounded-lg px-2 py-1 outline-none disabled:opacity-40"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <button onClick={() => removeItem(it.id)}>
                          <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "#9A9AA0" }}>
              Finished Good = item yang jadwal produksinya diisi langsung di tab MPS. Komponen = item yang kebutuhannya dihitung otomatis (dependent demand) dari BOM item induknya. Biaya Pesan & Biaya Simpan hanya dipakai untuk metode EOQ/POQ.
            </p>
          </SectionCard>

          <SectionCard title="Struktur BOM (Bill of Materials)" subtitle="Hubungan induk → komponen beserta qty per unit induk" accent={accent}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs" style={{ color: "#8A8A8E" }}>
                {bom.length} baris BOM
              </p>
              <button
                onClick={addBomLine}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah Baris BOM
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    {["Item Induk", "Komponen", "Qty per Induk", ""].map((h) => (
                      <th key={h} className="whitespace-nowrap px-2 py-2 text-left font-medium" style={{ color: "#8A8A8E" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bom.map((b, i) => (
                    <tr key={i} style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                      <td className="px-2 py-1.5">
                        <select
                          value={b.parentId}
                          onChange={(e) => updateBomLine(i, "parentId", e.target.value)}
                          className="w-36 rounded-lg px-2 py-1 outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        >
                          {items.map((it) => (
                            <option key={it.id} value={it.id}>
                              {it.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={b.childId}
                          onChange={(e) => updateBomLine(i, "childId", e.target.value)}
                          className="w-36 rounded-lg px-2 py-1 outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        >
                          {items.map((it) => (
                            <option key={it.id} value={it.id}>
                              {it.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          value={b.qtyPer}
                          onChange={(e) => updateBomLine(i, "qtyPer", e.target.value)}
                          className="w-20 rounded-lg px-2 py-1 outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <button onClick={() => removeBomLine(i)}>
                          <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-xl p-3.5" style={{ backgroundColor: "rgba(255,255,255,0.5)" }}>
              <p className="mb-2 text-[11px] font-medium" style={{ color: "#4B4B4F" }}>
                Struktur Pohon BOM
              </p>
              <div className="space-y-2">
                {topLevelItems.map((top) => (
                  <div key={top.id} className="text-xs">
                    <span className="font-semibold" style={{ color: accent }}>
                      {top.name}
                    </span>
                    <span className="ml-1.5 text-[10px]" style={{ color: "#9A9AA0" }}>
                      (Finished Good)
                    </span>
                    <div className="mt-1 ml-4 space-y-1 border-l pl-3" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                      {(childrenOf[top.id] || []).map((b, i) => (
                        <div key={i} style={{ color: "#4B4B4F" }}>
                          ↳ {itemMap[b.childId]?.name ?? b.childId}{" "}
                          <span style={{ color: "#9A9AA0" }}>× {b.qtyPer} per unit</span>
                        </div>
                      ))}
                      {(childrenOf[top.id] || []).length === 0 && (
                        <div className="text-[11px]" style={{ color: "#B5B5B9" }}>
                          Belum ada komponen — tambahkan baris BOM di atas.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {tab === "mps" && (
        <SectionCard title="Master Production Schedule (MPS)" subtitle="Rencana produksi finished goods per periode — jadi input resmi untuk MRP" accent={accent}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs" style={{ color: "#8A8A8E" }}>
              {topLevelItems.length} finished good · {periods.length} periode
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={addPeriod}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah Periode
              </button>
              <button
                onClick={removePeriod}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
                style={{ backgroundColor: "rgba(0,0,0,0.06)", color: "#4B4B4F" }}
              >
                <Trash2 size={12} /> Hapus Periode
              </button>
            </div>
          </div>

          {topLevelItems.length === 0 ? (
            <p className="text-xs" style={{ color: "#9A9AA0" }}>
              Belum ada item bertipe Finished Good. Tambahkan di tab Item Master & BOM terlebih dahulu.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="whitespace-nowrap px-2.5 py-2 text-left font-medium" style={{ color: "#8A8A8E" }}>
                      Finished Good
                    </th>
                    {periods.map((p, pi) => {
                      const check = mpsCapacityCheck[pi];
                      return (
                        <th key={p} className="whitespace-nowrap px-2.5 py-2 text-left font-medium" style={{ color: check?.hasOverload ? "#C24A3D" : "#8A8A8E" }}>
                          <span className="inline-flex items-center gap-1">
                            {p}
                            {check?.hasOverload && <AlertTriangle size={11} style={{ color: "#E2685A" }} />}
                          </span>
                        </th>
                      );
                    })}
                    <th className="whitespace-nowrap px-2.5 py-2 text-left font-medium" style={{ color: "#8A8A8E" }}>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topLevelItems.map((it) => {
                    const row = mps[it.id] || periods.map(() => 0);
                    const total = periods.reduce((a, _, i) => a + (Number(row[i]) || 0), 0);
                    return (
                      <tr key={it.id} style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                        <td className="px-2.5 py-2 font-medium">{it.name}</td>
                        {periods.map((p, i) => (
                          <td key={p} className="px-2.5 py-1.5">
                            <input
                              type="number"
                              value={row[i] ?? 0}
                              onChange={(e) => updateMpsCell(it.id, i, e.target.value)}
                              className="w-20 rounded-lg px-2 py-1 outline-none"
                              style={{
                                backgroundColor: mpsCapacityCheck[i]?.hasOverload ? "rgba(226,104,90,0.10)" : "rgba(255,255,255,0.7)",
                                color: "#1D1D1F",
                              }}
                            />
                          </td>
                        ))}
                        <td className="px-2.5 py-2 font-semibold" style={{ color: accent }}>
                          {total}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {mpsCapacityCheck.some((c) => c.hasLinkedWC) && (
            <div
              className="mt-4 rounded-xl p-3.5"
              style={{
                backgroundColor: mpsCapacityCheck.some((c) => c.hasOverload) ? "rgba(226,104,90,0.12)" : "rgba(47,169,163,0.10)",
              }}
            >
              <p
                className="mb-1.5 text-xs font-medium"
                style={{ color: mpsCapacityCheck.some((c) => c.hasOverload) ? "#C24A3D" : "#1F7A73" }}
              >
                {mpsCapacityCheck.some((c) => c.hasOverload)
                  ? `Rough-Cut Capacity Check: ${mpsCapacityCheck.filter((c) => c.hasOverload).length} dari ${periods.length} periode berpotensi melebihi kapasitas work center terkait`
                  : "Rough-Cut Capacity Check: MPS saat ini masih dalam batas kapasitas work center yang terhubung"}
              </p>
              {mpsCapacityCheck
                .filter((c) => c.hasOverload)
                .map((c) => (
                  <p key={c.period} className="text-[11px]" style={{ color: "#9A9AA0" }}>
                    <span className="font-medium" style={{ color: "#C24A3D" }}>
                      {c.period}:
                    </span>{" "}
                    {c.flags
                      .filter((f) => f.overloaded)
                      .map((f) => `${f.workCenter} (${f.required}/${f.effectiveAvailable} jam untuk ${f.itemName})`)
                      .join(", ")}
                  </p>
                ))}
              <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: "#9A9AA0" }}>
                Pengecekan ini membandingkan angka MPS langsung terhadap kapasitas efektif (setelah OEE) work center yang diatur bermode "Dari MRP" di tab Capacity Planning — dijalankan sebelum MRP diproses, sesuai praktik Rough-Cut Capacity Planning.
              </p>
            </div>
          )}

          <p className="mt-4 text-xs leading-relaxed" style={{ color: "#8A8A8E" }}>
            Angka MPS di atas menjadi Gross Requirement level teratas pada MRP. Kebutuhan komponen di bawahnya (dependent demand) dihitung otomatis lewat BOM — lihat hasilnya di tab MRP.
          </p>
        </SectionCard>
      )}

      {tab === "mrp" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ResultStat label="Total Item Direncanakan" value={mrpSummary.totalItems} accent={accent} />
            <ResultStat
              label="Item dengan Shortfall"
              value={mrpSummary.itemsWithShortfall}
              unit="item"
              highlight={mrpSummary.itemsWithShortfall > 0}
              accent="#E0A82E"
            />
            <ResultStat
              label="Total Past Due (semua item)"
              value={mrpSummary.totalPastDue}
              unit="unit"
              highlight={mrpSummary.totalPastDue > 0}
              accent="#E2685A"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr]">
            <SectionCard title="Pilih Item" subtitle="Detail rencana kebutuhan per item" accent={accent}>
              <FieldLabel hint="Level teratas (Finished Good) diisi dari MPS; komponen dihitung otomatis dari BOM">Item</FieldLabel>
              <select
                value={selectedMrpItem}
                onChange={(e) => setSelectedMrpItem(e.target.value)}
                className="mb-4 w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
              >
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name} {it.type === "fg" ? "(Finished Good)" : "(Komponen)"}
                  </option>
                ))}
              </select>

              {itemMap[selectedMrpItem] && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span style={{ color: "#8A8A8E" }}>On Hand Awal</span>
                    <span className="font-medium">{itemMap[selectedMrpItem].onHand} unit</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#8A8A8E" }}>Lead Time</span>
                    <span className="font-medium">{itemMap[selectedMrpItem].leadTime} periode</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#8A8A8E" }}>Safety Stock</span>
                    <span className="font-medium">{itemMap[selectedMrpItem].safetyStock} unit</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#8A8A8E" }}>Metode Lot Sizing</span>
                    <span className="font-medium">
                      {LOT_METHODS.find((m) => m.id === itemMap[selectedMrpItem].lotMethod)?.label}
                    </span>
                  </div>
                  {itemMap[selectedMrpItem].lotMethod === "eoq" && selectedMrpResult && (
                    <div className="flex justify-between">
                      <span style={{ color: "#8A8A8E" }}>EOQ Terhitung</span>
                      <span className="font-medium">{selectedMrpResult.eoq} unit/pesan</span>
                    </div>
                  )}
                  {itemMap[selectedMrpItem].lotMethod === "poq" && selectedMrpResult && (
                    <div className="flex justify-between">
                      <span style={{ color: "#8A8A8E" }}>Interval POQ</span>
                      <span className="font-medium">{selectedMrpResult.poqInterval} periode</span>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Tabel Rencana Kebutuhan Material" subtitle={itemMap[selectedMrpItem]?.name} accent={accent}>
              {selectedMrpResult ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr>
                          {["Periode", "Gross Req", "On Hand Awal", "Net Req", "Plnd. Receipt", "Plnd. Release", "Proj. On Hand"].map((h) => (
                            <th key={h} className="whitespace-nowrap px-2.5 py-2 text-left font-medium" style={{ color: "#8A8A8E" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMrpResult.rows.map((r, i) => (
                          <tr key={i} style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                            <td className="px-2.5 py-2 font-medium">{r.period}</td>
                            <td className="px-2.5 py-2">{r.gross}</td>
                            <td className="px-2.5 py-2">{r.onHandBefore}</td>
                            <td className="px-2.5 py-2">{r.netReq}</td>
                            <td className="px-2.5 py-2">{r.plannedReceipt}</td>
                            <td className="px-2.5 py-2 font-medium" style={{ color: r.plannedRelease > 0 ? accent : "#1D1D1F" }}>
                              {r.plannedRelease}
                            </td>
                            <td
                              className="px-2.5 py-2"
                              style={{ color: r.belowSafetyStock ? "#E2685A" : "#1D1D1F", fontWeight: r.belowSafetyStock ? 600 : 400 }}
                            >
                              {r.projectedOnHand}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {selectedMrpResult.pastDue > 0 && (
                    <div className="mt-4 rounded-xl p-3.5" style={{ backgroundColor: "rgba(226,104,90,0.12)" }}>
                      <p className="text-xs font-medium" style={{ color: "#C24A3D" }}>
                        {selectedMrpResult.pastDue} unit perlu dipesan sebelum periode pertama
                      </p>
                      <p className="mt-0.5 text-[11px]" style={{ color: "#9A9AA0" }}>
                        Lead time item ini lebih panjang dari cakupan periode yang tersedia — pesanan seharusnya sudah dilakukan.
                      </p>
                    </div>
                  )}

                  {selectedMrpResult.shortfallPeriods > 0 && (
                    <div className="mt-3 rounded-xl p-3.5" style={{ backgroundColor: "rgba(224,168,46,0.14)" }}>
                      <p className="text-xs font-medium" style={{ color: "#9A6B0A" }}>
                        {selectedMrpResult.shortfallPeriods} periode dengan Proj. On Hand di bawah Safety Stock
                      </p>
                      <p className="mt-0.5 text-[11px]" style={{ color: "#9A9AA0" }}>
                        Periode ditandai merah pada tabel — pertimbangkan menambah Planned Order Release lebih awal.
                      </p>
                    </div>
                  )}

                  <p className="mt-4 text-xs leading-relaxed" style={{ color: "#8A8A8E" }}>
                    Planned Order Release ditandai warna aksen — periode di mana pemesanan/produksi harus dimulai, digeser mundur sejumlah lead time dari Planned Order Receipt. Untuk komponen, Gross Req dihitung otomatis dari Planned Order Release item induknya × qty per BOM.
                  </p>
                </>
              ) : (
                <p className="text-xs" style={{ color: "#9A9AA0" }}>
                  Pilih item untuk melihat rencana kebutuhannya.
                </p>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Ringkasan Semua Item" subtitle="Hasil explosion BOM berjenjang untuk seluruh item" accent={accent}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    {["Item", "Tipe", "Metode Lot", "Total Plnd. Order", "Past Due", "Periode Shortfall"].map((h) => (
                      <th key={h} className="whitespace-nowrap px-2.5 py-2 text-left font-medium" style={{ color: "#8A8A8E" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const res = mrpExplosion[it.id];
                    if (!res) return null;
                    return (
                      <tr key={it.id} style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                        <td className="px-2.5 py-2 font-medium">{it.name}</td>
                        <td className="px-2.5 py-2" style={{ color: "#8A8A8E" }}>
                          {it.type === "fg" ? "Finished Good" : "Komponen"}
                        </td>
                        <td className="px-2.5 py-2" style={{ color: "#8A8A8E" }}>
                          {LOT_METHODS.find((m) => m.id === it.lotMethod)?.label}
                        </td>
                        <td className="px-2.5 py-2">{res.totalPlannedOrder}</td>
                        <td className="px-2.5 py-2" style={{ color: res.pastDue > 0 ? "#E2685A" : "#1D1D1F", fontWeight: res.pastDue > 0 ? 600 : 400 }}>
                          {res.pastDue}
                        </td>
                        <td className="px-2.5 py-2" style={{ color: res.shortfallPeriods > 0 ? "#9A6B0A" : "#1D1D1F" }}>
                          {res.shortfallPeriods}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}


      {tab === "capacity" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[420px_1fr]">
          <SectionCard title="Work Center & Rencana Produksi" subtitle="Rough-Cut Capacity Planning" accent={accent}>
            <div className="mb-3">
              <FieldLabel hint="Periode MRP yang dipakai sebagai sumber qty untuk work center bermode 'Dari MRP'">
                Periode Acuan (untuk WC bermode Dari MRP)
              </FieldLabel>
              <select
                value={capacityPeriodIdx}
                onChange={(e) => setCapacityPeriodIdx(Number(e.target.value))}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
              >
                {periods.map((p, i) => (
                  <option key={p} value={i}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: "#4B4B4F" }}>
                Daftar Work Center
              </p>
              <button
                onClick={addWorkCenter}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah
              </button>
            </div>

            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
              {workCenters.map((w, i) => (
                <div key={i} className="rounded-xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.6)" }}>
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      value={w.name}
                      onChange={(e) => updateWorkCenter(i, "name", e.target.value)}
                      className="flex-1 rounded-lg px-2 py-1.5 text-xs font-medium outline-none"
                      style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                    />
                    <button onClick={() => removeWorkCenter(i)}>
                      <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                    </button>
                  </div>

                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <div>
                      <FieldLabel>Kapasitas Tersedia</FieldLabel>
                      <NumberInput value={w.available} onChange={(v) => updateWorkCenter(i, "available", v)} suffix="jam" />
                    </div>
                    <div>
                      <FieldLabel>Jam/Unit</FieldLabel>
                      <NumberInput value={w.perUnit} onChange={(v) => updateWorkCenter(i, "perUnit", v)} step={0.1} />
                    </div>
                  </div>

                  <div className="mb-2">
                    <FieldLabel hint="Manual: isi qty rencana sendiri. Dari MRP: qty otomatis diambil dari Planned Order Release item terpilih pada periode acuan di atas">
                      Sumber Qty Rencana
                    </FieldLabel>
                    <div className="mb-2 flex gap-1.5">
                      <button
                        onClick={() => updateWorkCenter(i, "qtyMode", "manual")}
                        className="flex-1 rounded-lg py-1.5 text-[11px] font-medium"
                        style={{
                          backgroundColor: w.qtyMode !== "mrp" ? `${accent}22` : "rgba(0,0,0,0.05)",
                          color: w.qtyMode !== "mrp" ? accent : "#8A8A8E",
                        }}
                      >
                        Manual
                      </button>
                      <button
                        onClick={() => updateWorkCenter(i, "qtyMode", "mrp")}
                        className="flex-1 rounded-lg py-1.5 text-[11px] font-medium"
                        style={{
                          backgroundColor: w.qtyMode === "mrp" ? `${accent}22` : "rgba(0,0,0,0.05)",
                          color: w.qtyMode === "mrp" ? accent : "#8A8A8E",
                        }}
                      >
                        Dari MRP
                      </button>
                    </div>
                    {w.qtyMode === "mrp" ? (
                      <select
                        value={w.sourceItemId}
                        onChange={(e) => updateWorkCenter(i, "sourceItemId", e.target.value)}
                        className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                        style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                      >
                        <option value="">— pilih item —</option>
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <NumberInput value={w.qty} onChange={(v) => updateWorkCenter(i, "qty", v)} suffix="unit" />
                    )}
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <FieldLabel hint="OEE = Availability × Performance × Quality — mengurangi kapasitas tersedia riil akibat downtime, kecepatan, dan cacat produksi">
                        Faktor OEE (%)
                      </FieldLabel>
                      {leanSignal && (
                        <button
                          onClick={() =>
                            setWorkCenters(
                              workCenters.map((wc, wi) =>
                                wi === i
                                  ? {
                                      ...wc,
                                      availability: Number(leanSignal.availabilityPct) || wc.availability,
                                      performance: Number(leanSignal.performancePct) || wc.performance,
                                      quality: Number(leanSignal.qualityPct) || wc.quality,
                                    }
                                  : wc
                              )
                            )
                          }
                          title="Isi Availability/Performance/Quality dari hasil perhitungan modul Lean & Six Sigma"
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium"
                          style={{ backgroundColor: `${accent}22`, color: accent }}
                        >
                          <Sparkles size={11} /> Dari Modul Lean
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="mb-1 block text-[9px]" style={{ color: "#9A9AA0" }}>
                          Availability
                        </span>
                        <NumberInput value={w.availability} onChange={(v) => updateWorkCenter(i, "availability", v)} />
                      </div>
                      <div>
                        <span className="mb-1 block text-[9px]" style={{ color: "#9A9AA0" }}>
                          Performance
                        </span>
                        <NumberInput value={w.performance} onChange={(v) => updateWorkCenter(i, "performance", v)} />
                      </div>
                      <div>
                        <span className="mb-1 block text-[9px]" style={{ color: "#9A9AA0" }}>
                          Quality
                        </span>
                        <NumberInput value={w.quality} onChange={(v) => updateWorkCenter(i, "quality", v)} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultStat accent={accent} label="Work Center Overload" value={overloadedCount} unit={`/ ${capacityResults.length}`} highlight={overloadedCount > 0} />
              <ResultStat accent={accent} label="Rata-rata Utilisasi" value={avgUtilization} unit="%" />
            </div>

            <SectionCard title="Grafik Utilisasi per Work Center" subtitle="Bar merah menandakan beban melebihi kapasitas efektif (setelah OEE)" accent={accent}>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={capacityResults} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8A8A8E" }} interval={0} angle={-15} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10, fill: "#8A8A8E" }} label={{ value: "jam", angle: -90, position: "insideLeft", fontSize: 10, fill: "#8A8A8E" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.9)",
                        border: "1px solid rgba(0,0,0,0.06)",
                        borderRadius: 12,
                        fontSize: 11,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="required" name="Jam Dibutuhkan" radius={[4, 4, 0, 0]}>
                      {capacityResults.map((r, i) => (
                        <Cell key={i} fill={r.overloaded ? "#E2685A" : accent} />
                      ))}
                    </Bar>
                    <Bar dataKey="effectiveAvailable" name="Kapasitas Efektif" fill="rgba(0,0,0,0.12)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Detail Utilisasi Kapasitas" accent={accent}>
              <div className="space-y-4">
                {capacityResults.map((r, i) => (
                  <div key={i}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="text-xs font-medium">{r.name}</p>
                      <p className="text-xs" style={{ color: r.overloaded ? "#C24A3D" : "#8A8A8E" }}>
                        {r.required} / {r.effectiveAvailable} jam (OEE {r.oeePercent}%) · {r.utilization}%
                      </p>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.06)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, r.utilization)}%`,
                          backgroundColor: r.overloaded ? "#E2685A" : accent,
                        }}
                      />
                    </div>
                    {r.qty > 0 && (
                      <p className="mt-1 text-[10px]" style={{ color: "#B5B5B9" }}>
                        Qty rencana: {r.qty} unit
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}


      {tab === "scheduling" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <SectionCard title="Mesin & Daftar Job" subtitle="Penjadwalan Produksi — Flow Shop Multi-Mesin" accent={accent}>
            <div className="mb-3 flex gap-2">
              {SCHEDULE_RULES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setRule(s.id)}
                  className="flex-1 rounded-xl px-3 py-2 text-xs font-medium"
                  style={{
                    backgroundColor: rule === s.id ? `${accent}22` : "rgba(255,255,255,0.6)",
                    color: rule === s.id ? accent : "#8A8A8E",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: "#4B4B4F" }}>
                Mesin / Stasiun
              </p>
              <button
                onClick={addMachine}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah Mesin
              </button>
            </div>
            <div className="mb-4 space-y-1.5">
              {machines.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={m.name}
                    onChange={(e) => updateMachine(i, e.target.value)}
                    className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                  />
                  <button onClick={() => removeMachine(i)} disabled={machines.length <= 1}>
                    <Trash2 size={13} style={{ color: machines.length <= 1 ? "#E5E5EA" : "#C7C7CC" }} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: "#4B4B4F" }}>
                Job — Waktu Proses per Mesin & Due Date
              </p>
              <button
                onClick={addFlowJob}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah Job
              </button>
            </div>

            <div className="max-h-80 space-y-2.5 overflow-y-auto pr-1">
              {flowJobs.map((j, i) => (
                <div key={i} className="rounded-xl p-2.5" style={{ backgroundColor: "rgba(255,255,255,0.6)" }}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <input
                      value={j.name}
                      onChange={(e) => updateFlowJob(i, "name", e.target.value)}
                      className="flex-1 rounded-lg px-2 py-1.5 text-xs font-medium outline-none"
                      style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-[10px]" style={{ color: "#9A9AA0" }}>
                        Due
                      </span>
                      <input
                        type="number"
                        value={j.due}
                        onChange={(e) => updateFlowJob(i, "due", e.target.value)}
                        className="w-14 rounded-lg px-2 py-1.5 text-xs outline-none"
                        style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                      />
                    </div>
                    <button onClick={() => removeFlowJob(i)}>
                      <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {machines.map((m, mi) => (
                      <div key={mi} className="flex items-center gap-1">
                        <span className="text-[9px]" style={{ color: "#9A9AA0" }}>
                          {m.name}
                        </span>
                        <input
                          type="number"
                          value={(j.times || [])[mi] ?? 0}
                          onChange={(e) => updateFlowJobTime(i, mi, e.target.value)}
                          className="w-12 rounded-lg px-1.5 py-1 text-xs outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <SectionCard
              title={`Gantt Chart — Urutan Job (Aturan ${SCHEDULE_RULES.find((s) => s.id === rule)?.label})`}
              subtitle="Permutation flow shop: semua job diproses dengan urutan yang sama di setiap mesin"
              accent={accent}
            >
              {machines.length > 0 && scheduleResult.ordered.length > 0 ? (
                <GanttChart machines={machines} ordered={scheduleResult.ordered} completion={scheduleResult.completion} />
              ) : (
                <p className="text-xs" style={{ color: "#9A9AA0" }}>
                  Tambahkan minimal 1 mesin dan 1 job untuk menampilkan Gantt Chart.
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                {scheduleResult.ordered.map((j, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px]" style={{ color: "#8A8A8E" }}>
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: GANTT_COLORS[i % GANTT_COLORS.length] }}
                    />
                    {j.name}
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Detail Urutan & Ketepatan Waktu" accent={accent}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      {["Urutan", "Job", "Total Waktu Proses", "Due Date", "Completion (Mesin Terakhir)", "Tardiness"].map((h) => (
                        <th key={h} className="whitespace-nowrap px-2.5 py-2 text-left font-medium" style={{ color: "#8A8A8E" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleResult.rows.map((r, i) => (
                      <tr key={i} style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                        <td className="px-2.5 py-2 font-medium">{i + 1}</td>
                        <td className="px-2.5 py-2">
                          <span
                            className="mr-1.5 inline-block h-2 w-2 rounded-sm align-middle"
                            style={{ backgroundColor: GANTT_COLORS[i % GANTT_COLORS.length] }}
                          />
                          {r.name}
                        </td>
                        <td className="px-2.5 py-2">{(r.times || []).reduce((a, t) => a + (Number(t) || 0), 0)}</td>
                        <td className="px-2.5 py-2">{r.due}</td>
                        <td className="px-2.5 py-2">{r.completion}</td>
                        <td className="px-2.5 py-2 font-medium" style={{ color: r.tardiness > 0 ? "#C24A3D" : "#1D1D1F" }}>
                          {r.tardiness}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ResultStat accent={accent} label="Rata-rata Flow Time" value={scheduleResult.avgFlow} />
              <ResultStat accent={accent} label="Rata-rata Tardiness" value={scheduleResult.avgTardiness} />
              <ResultStat accent={accent} label="Job Terlambat" value={scheduleResult.numTardy} highlight={scheduleResult.numTardy > 0} />
              <ResultStat accent={accent} label="Makespan" value={scheduleResult.makespan} />
            </div>
          </div>
        </div>
      )}

      {tab === "whatif" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_1fr]">
          <SectionCard title="Parameter Skenario" subtitle="Uji dampak perubahan demand & lead time terhadap MRP dan kapasitas" accent={accent}>
            <div className="space-y-4">
              <div>
                <FieldLabel hint="Menskalakan seluruh angka MPS finished goods di semua periode. Positif = demand naik, negatif = turun">
                  % Perubahan Demand (MPS)
                </FieldLabel>
                <NumberInput value={wiDemandPct} onChange={setWiDemandPct} suffix="%" />
              </div>
              <div>
                <FieldLabel hint="Ditambahkan ke lead time semua item (finished good & komponen). Positif = lead time molor, negatif = lebih cepat">
                  Perubahan Lead Time (semua item)
                </FieldLabel>
                <NumberInput value={wiLeadTimeDelta} onChange={setWiLeadTimeDelta} suffix="periode" />
              </div>
              <div>
                <FieldLabel hint="Jika aktif, qty rencana pada work center bermode 'Manual' ikut diskalakan sesuai % perubahan demand. Work center bermode 'Dari MRP' selalu ikut skenario">
                  Terapkan ke Work Center Manual
                </FieldLabel>
                <button
                  onClick={() => setWiApplyManualWC(!wiApplyManualWC)}
                  className="w-full rounded-xl px-3 py-2 text-xs font-medium"
                  style={{
                    backgroundColor: wiApplyManualWC ? `${accent}22` : "rgba(0,0,0,0.05)",
                    color: wiApplyManualWC ? accent : "#8A8A8E",
                  }}
                >
                  {wiApplyManualWC ? "Aktif — ikut diskalakan" : "Nonaktif — tetap qty manual"}
                </button>
              </div>

              <button
                onClick={resetWhatIfProduction}
                disabled={!isWhatIfProductionActive}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium"
                style={{
                  backgroundColor: isWhatIfProductionActive ? "rgba(226,104,90,0.12)" : "rgba(0,0,0,0.04)",
                  color: isWhatIfProductionActive ? "#E2685A" : "#C5C5C9",
                  cursor: isWhatIfProductionActive ? "pointer" : "default",
                }}
              >
                <RotateCcw size={13} /> Reset ke Baseline
              </button>
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <SectionCard
              title="Perbandingan Baseline vs Skenario"
              subtitle={
                isWhatIfProductionActive
                  ? "Skenario aktif — parameter di kiri sedang disimulasikan terhadap seluruh MRP & kapasitas"
                  : "Belum ada perubahan skenario — angka Baseline dan Skenario masih identik"
              }
              accent={accent}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr style={{ color: "#8A8A8E" }}>
                      <th className="pb-2 pr-3 font-medium">Metrik</th>
                      <th className="pb-2 pr-3 font-medium">Baseline</th>
                      <th className="pb-2 pr-3 font-medium">Skenario</th>
                      <th className="pb-2 font-medium">Perubahan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Total Planned Order (semua item)", base: mrpTotalPlannedOrderBaseline, scenario: mrpSummaryScenario.totalPlannedOrder, unit: "unit" },
                      { label: "Item dengan Shortfall", base: mrpSummary.itemsWithShortfall, scenario: mrpSummaryScenario.itemsWithShortfall, unit: "item", lowerIsBetter: true },
                      { label: "Total Past Due", base: mrpSummary.totalPastDue, scenario: mrpSummaryScenario.totalPastDue, unit: "unit", lowerIsBetter: true },
                      { label: "Work Center Overload", base: overloadedCount, scenario: overloadedCountScenario, unit: `/ ${capacityResults.length}`, lowerIsBetter: true },
                      { label: "Rata-rata Utilisasi Kapasitas", base: Number(avgUtilization), scenario: Number(avgUtilizationScenario), unit: "%", lowerIsBetter: true },
                    ].map((row) => (
                      <tr key={row.label} style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                        <td className="py-2 pr-3 font-medium" style={{ color: "#1D1D1F" }}>{row.label}</td>
                        <td className="py-2 pr-3" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {row.base} {row.unit}
                        </td>
                        <td className="py-2 pr-3 font-semibold" style={{ color: accent, fontVariantNumeric: "tabular-nums" }}>
                          {row.scenario} {row.unit}
                        </td>
                        <td className="py-2">
                          <DeltaBadge base={row.base} scenario={row.scenario} lowerIsBetter={row.lowerIsBetter} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "#8A8A8E" }}>
                Skenario menjalankan ulang explosion BOM berjenjang & perhitungan RCCP secara terpisah dari data aktual — mengubah parameter di sini tidak mengubah MPS atau Item Master yang tersimpan. Utilisasi kapasitas skenario memakai periode acuan yang sama dengan yang dipilih di tab Capacity Planning.
              </p>
            </SectionCard>

            <SectionCard title="Utilisasi per Work Center — Baseline vs Skenario" accent={accent}>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={capacityResults.map((r, i) => ({
                      name: r.name,
                      baseline: r.utilization,
                      skenario: capacityScenario[i]?.utilization ?? r.utilization,
                    }))}
                    margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8A8A8E" }} interval={0} angle={-15} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10, fill: "#8A8A8E" }} label={{ value: "% utilisasi", angle: -90, position: "insideLeft", fontSize: 10, fill: "#8A8A8E" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.9)",
                        border: "1px solid rgba(0,0,0,0.06)",
                        borderRadius: 12,
                        fontSize: 11,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="baseline" name="Baseline" fill="rgba(0,0,0,0.15)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="skenario" name="Skenario" fill={accent} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}


// ---------- Module 4: Supply Chain Network Design ----------

// Fungsi murni (bisa dipakai ulang untuk skenario What-If): mencari subset kandidat gudang
// terbaik untuk dibuka, lalu mengalokasikan tiap titik demand ke gudang terbuka termurah
// yang kapasitasnya cukup & masih dalam batas jarak layanan.
function computeFacilityAllocation(candidatesArr, demandArr, openCountRaw, serviceLimitRaw, costPerDist) {
  const n = candidatesArr.length;
  if (n === 0 || demandArr.length === 0) return null;
  const k = Math.min(Math.max(1, Number(openCountRaw) || 1), n);
  const serviceLimit = Number(serviceLimitRaw) || Infinity;

  const subsets = [];
  const combo = (start, chosen) => {
    if (chosen.length === k) {
      subsets.push([...chosen]);
      return;
    }
    for (let i = start; i < n; i++) {
      chosen.push(i);
      combo(i + 1, chosen);
      chosen.pop();
    }
  };
  combo(0, []);
  if (subsets.length > 4000) subsets.length = 4000; // safety guard

  const evaluateSubset = (subsetIdx) => {
    const openWarehouses = subsetIdx.map((i) => ({
      ...candidatesArr[i],
      idx: i,
      capacityNum: Number(candidatesArr[i].capacity) || Infinity,
      remaining: Number(candidatesArr[i].capacity) || Infinity,
    }));
    const points = demandArr
      .map((p, pi) => ({ ...p, pi, volumeNum: Number(p.volume) || 0 }))
      .sort((a, b) => b.volumeNum - a.volumeNum);

    const assignments = [];
    let totalTransport = 0;
    let overflowVolume = 0;
    let serviceViolations = 0;

    points.forEach((p) => {
      const vol = p.volumeNum;
      const options = openWarehouses
        .map((w) => {
          const dist = Math.sqrt(
            Math.pow((Number(p.x) || 0) - (Number(w.x) || 0), 2) +
              Math.pow((Number(p.y) || 0) - (Number(w.y) || 0), 2)
          );
          return { w, dist, cost: dist * vol * (Number(costPerDist) || 0) };
        })
        .sort((a, b) => a.cost - b.cost);

      let chosen =
        options.find((opt) => opt.w.remaining >= vol && opt.dist <= serviceLimit) ||
        options.find((opt) => opt.w.remaining >= vol) ||
        options.find((opt) => opt.dist <= serviceLimit) ||
        options[0];

      if (chosen.w.remaining >= vol) {
        chosen.w.remaining -= vol;
      } else {
        overflowVolume += Math.max(0, vol - chosen.w.remaining);
        chosen.w.remaining = Math.max(0, chosen.w.remaining - vol);
      }
      if (chosen.dist > serviceLimit) serviceViolations += 1;

      totalTransport += chosen.cost;
      assignments.push({
        point: p.name,
        x: Number(p.x) || 0,
        y: Number(p.y) || 0,
        volume: vol,
        warehouse: chosen.w.name,
        warehouseIdx: chosen.w.idx,
        distance: chosen.dist,
        cost: chosen.cost,
        violatesService: chosen.dist > serviceLimit,
      });
    });

    const fixedCostTotal = openWarehouses.reduce((s, w) => s + (Number(w.fixedCost) || 0), 0);
    const totalCost = fixedCostTotal + totalTransport;
    const score = serviceViolations * 1e12 + totalCost;
    return {
      subsetIdx,
      openWarehouses,
      assignments,
      fixedCostTotal,
      transportCost: totalTransport,
      totalCost,
      overflowVolume,
      serviceViolations,
      score,
    };
  };

  let best = null;
  subsets.forEach((s) => {
    const res = evaluateSubset(s);
    if (!best || res.score < best.score) best = res;
  });
  return best;
}

// Total safety stock gabungan lintas titik demand, mengelompokkan titik-titik yang
// dilayani gudang yang sama (efek risk pooling): kelompok yang lebih besar menyerap
// variabilitas demand secara agregat sehingga total buffer yang dibutuhkan lebih kecil.
function computeSafetyStockByGroups(stdDevByPoint, groupOfEachPoint, z, leadTimeDays) {
  const groups = {};
  stdDevByPoint.forEach((std, i) => {
    const g = groupOfEachPoint[i];
    if (!groups[g]) groups[g] = [];
    groups[g].push(std);
  });
  const sqrtLT = Math.sqrt(Number(leadTimeDays) || 0);
  return Object.values(groups).reduce((total, stds) => {
    const sumSq = stds.reduce((s, v) => s + v * v, 0);
    return total + z * sqrtLT * Math.sqrt(sumSq);
  }, 0);
}

function NetworkModule({ accent }) {
  const [tab, setTab] = useState("cog");
  const reportData = useReportData();
  const demandSignal = reportData.demand;

  // --- Shared demand points (Center of Gravity + Warehouse Evaluation) ---
  const [demandPoints, setDemandPoints] = usePersistentState("network.demandPoints", [
    { name: "Toko Jakarta", x: 10, y: 20, volume: 500 },
    { name: "Toko Surabaya", x: 80, y: 15, volume: 350 },
    { name: "Toko Bandung", x: 5, y: 5, volume: 300 },
    { name: "Toko Medan", x: -20, y: 60, volume: 250 },
  ]);

  const addDemandPoint = () =>
    setDemandPoints([
      ...demandPoints,
      { name: `Titik ${demandPoints.length + 1}`, x: 0, y: 0, volume: 100 },
    ]);
  const removeDemandPoint = (idx) => setDemandPoints(demandPoints.filter((_, i) => i !== idx));
  const updateDemandPoint = (idx, field, val) =>
    setDemandPoints(
      demandPoints.map((p, i) =>
        i === idx ? { ...p, [field]: field === "name" ? val : Number(val) } : p
      )
    );

  // Impor total volume demand dari Modul 1 (Demand Planning): total forecast/annual demand
  // dari semua SKU didistribusikan ke titik-titik demand yang sudah ada, mengikuti proporsi
  // volume relatif yang sekarang disetel user (sebaran geografis tetap milik user, totalnya data-driven).
  const importDemandFromPlanning = () => {
    if (!demandSignal || demandPoints.length === 0) return;
    const totalVolume = Number(demandSignal.forecastNext) || 0;
    if (totalVolume <= 0) return;
    const currentTotal = demandPoints.reduce((s, p) => s + (Number(p.volume) || 0), 0);
    setDemandPoints(
      demandPoints.map((p) => ({
        ...p,
        volume:
          currentTotal > 0
            ? Math.round(((Number(p.volume) || 0) / currentTotal) * totalVolume)
            : Math.round(totalVolume / demandPoints.length),
      }))
    );
  };

  const cog = useMemo(() => {
    const totalW = demandPoints.reduce((a, p) => a + (Number(p.volume) || 0), 0) || 1;
    const x = demandPoints.reduce((a, p) => a + (Number(p.x) || 0) * (Number(p.volume) || 0), 0) / totalW;
    const y = demandPoints.reduce((a, p) => a + (Number(p.y) || 0) * (Number(p.volume) || 0), 0) / totalW;
    const avgVolume = totalW / (demandPoints.length || 1);
    return { x: x.toFixed(2), y: y.toFixed(2), avgVolume };
  }, [demandPoints]);

  const scatterDemand = demandPoints.map((p) => ({
    x: Number(p.x) || 0,
    y: Number(p.y) || 0,
    volume: Number(p.volume) || 0,
    name: p.name,
  }));
  const scatterCog = [{ x: Number(cog.x), y: Number(cog.y), volume: cog.avgVolume, name: "Center of Gravity" }];

  // --- Warehouse candidate evaluation ---
  const [costPerDistance, setCostPerDistance] = usePersistentState("network.costPerDistance", 1500);
  const [candidates, setCandidates] = usePersistentState("network.candidates", [
    { name: "Kandidat A", x: 15, y: 18, fixedCost: 50000000, capacity: 800 },
    { name: "Kandidat B", x: 40, y: 30, fixedCost: 35000000, capacity: 600 },
    { name: "Kandidat C", x: 0, y: 10, fixedCost: 60000000, capacity: 900 },
  ]);

  const addCandidate = () =>
    setCandidates([
      ...candidates,
      { name: `Kandidat ${String.fromCharCode(65 + candidates.length)}`, x: 0, y: 0, fixedCost: 0, capacity: 500 },
    ]);
  const removeCandidate = (idx) => setCandidates(candidates.filter((_, i) => i !== idx));
  const updateCandidate = (idx, field, val) =>
    setCandidates(
      candidates.map((c, i) =>
        i === idx ? { ...c, [field]: field === "name" ? val : Number(val) } : c
      )
    );

  const candidateResults = useMemo(() => {
    return candidates
      .map((c) => {
        const transportCost = demandPoints.reduce((sum, p) => {
          const dist = Math.sqrt(
            Math.pow((Number(p.x) || 0) - (Number(c.x) || 0), 2) +
              Math.pow((Number(p.y) || 0) - (Number(c.y) || 0), 2)
          );
          return sum + dist * (Number(p.volume) || 0) * (Number(costPerDistance) || 0);
        }, 0);
        const totalCost = transportCost + (Number(c.fixedCost) || 0);
        return {
          name: c.name,
          transportCost: Math.round(transportCost),
          totalCost: Math.round(totalCost),
        };
      })
      .sort((a, b) => a.totalCost - b.totalCost);
  }, [candidates, demandPoints, costPerDistance]);

  // --- Multi-Warehouse Allocation (facility location w/ capacity & service level) ---
  const [openWarehouseCount, setOpenWarehouseCount] = usePersistentState("network.openWarehouseCount", 2);
  const [maxServiceDistance, setMaxServiceDistance] = usePersistentState("network.maxServiceDistance", 50);
  const ALLOC_COLORS = ["#0A84FF", "#2FA9A3", "#E2685A", "#B5854D", "#8E6CC7", "#4B9F5A", "#D68A3C", "#5A7FE2"];

  const multiAllocation = useMemo(() => {
    const best = computeFacilityAllocation(candidates, demandPoints, openWarehouseCount, maxServiceDistance, costPerDistance);
    if (!best) return null;

    const utilization = best.openWarehouses.map((w, colorIdx) => {
      const assignedVolume = best.assignments
        .filter((a) => a.warehouseIdx === w.idx)
        .reduce((s, a) => s + a.volume, 0);
      const capacityNum = Number(w.capacity) || 0;
      const pct = capacityNum > 0 ? (assignedVolume / capacityNum) * 100 : 0;
      return { name: w.name, idx: w.idx, assignedVolume, capacity: capacityNum, pct: Math.min(999, pct), color: ALLOC_COLORS[colorIdx % ALLOC_COLORS.length] };
    });

    const singleWarehouseCost = candidateResults[0]?.totalCost;
    const savingsPct =
      singleWarehouseCost && singleWarehouseCost > 0
        ? ((singleWarehouseCost - best.totalCost) / singleWarehouseCost) * 100
        : null;

    return { ...best, utilization, singleWarehouseCost, savingsPct };
  }, [candidates, demandPoints, costPerDistance, openWarehouseCount, maxServiceDistance, candidateResults]);

  // --- Distribution route (Nearest Neighbor) ---
  const [routePoints, setRoutePoints] = usePersistentState("network.routePoints", [
    { name: "Depot", x: 0, y: 0, load: 0 },
    { name: "Stop 1", x: 10, y: 20, load: 40 },
    { name: "Stop 2", x: 30, y: 5, load: 35 },
    { name: "Stop 3", x: -15, y: 25, load: 50 },
    { name: "Stop 4", x: 20, y: -10, load: 30 },
  ]);
  const [vehicleCapacity, setVehicleCapacity] = usePersistentState("network.vehicleCapacity", 80);

  const addRoutePoint = () =>
    setRoutePoints([...routePoints, { name: `Stop ${routePoints.length}`, x: 0, y: 0, load: 20 }]);
  const removeRoutePoint = (idx) => setRoutePoints(routePoints.filter((_, i) => i !== idx));
  const updateRoutePoint = (idx, field, val) =>
    setRoutePoints(
      routePoints.map((p, i) =>
        i === idx ? { ...p, [field]: field === "name" ? val : Number(val) } : p
      )
    );

  const routeResult = useMemo(() => {
    if (routePoints.length < 2) return { order: routePoints, oneWay: 0, returnDist: 0, total: 0 };
    const points = routePoints.map((p) => ({ ...p, x: Number(p.x) || 0, y: Number(p.y) || 0 }));
    const visited = new Array(points.length).fill(false);
    let current = points[0];
    visited[0] = true;
    const order = [{ ...current, legDistance: 0 }];
    let oneWay = 0;

    for (let step = 1; step < points.length; step++) {
      let nearestIdx = -1;
      let nearestDist = Infinity;
      points.forEach((p, i) => {
        if (!visited[i]) {
          const d = Math.sqrt(Math.pow(p.x - current.x, 2) + Math.pow(p.y - current.y, 2));
          if (d < nearestDist) {
            nearestDist = d;
            nearestIdx = i;
          }
        }
      });
      if (nearestIdx !== -1) {
        visited[nearestIdx] = true;
        oneWay += nearestDist;
        order.push({ ...points[nearestIdx], legDistance: nearestDist });
        current = points[nearestIdx];
      }
    }

    const returnDist = Math.sqrt(
      Math.pow(current.x - points[0].x, 2) + Math.pow(current.y - points[0].y, 2)
    );

    return { order, oneWay, returnDist, total: oneWay + returnDist };
  }, [routePoints]);

  // --- Capacitated VRP: split stops into multiple trips (or vehicles) from the same depot ---
  const VRP_COLORS = ["#0A84FF", "#2FA9A3", "#E2685A", "#B5854D", "#8E6CC7", "#4B9F5A", "#D68A3C", "#5A7FE2"];

  const vrpResult = useMemo(() => {
    if (routePoints.length < 2) return { trips: [], totalDistance: 0, overloadedStops: [] };
    const depot = { ...routePoints[0], x: Number(routePoints[0].x) || 0, y: Number(routePoints[0].y) || 0 };
    const capacity = Number(vehicleCapacity) || Infinity;

    const stops = routePoints.slice(1).map((p, i) => ({
      ...p,
      idx: i + 1,
      x: Number(p.x) || 0,
      y: Number(p.y) || 0,
      load: Number(p.load) || 0,
    }));

    // Flag stops whose single load already exceeds vehicle capacity — they still get
    // served alone (best effort) but are reported as overloaded.
    const overloadedStops = stops.filter((s) => s.load > capacity).map((s) => s.name);

    const visited = new Set();
    const trips = [];

    while (visited.size < stops.length) {
      let current = depot;
      let load = 0;
      const order = [{ ...depot, legDistance: 0 }];
      let distance = 0;

      // Keep adding the nearest not-yet-visited stop that still fits this vehicle's remaining capacity
      let addedAny = true;
      while (addedAny) {
        addedAny = false;
        let nearestIdx = -1;
        let nearestDist = Infinity;
        stops.forEach((s) => {
          if (!visited.has(s.idx)) {
            const fits = load + s.load <= capacity || (load === 0 && s.load > capacity); // allow lone overloaded stop
            if (fits) {
              const d = Math.sqrt(Math.pow(s.x - current.x, 2) + Math.pow(s.y - current.y, 2));
              if (d < nearestDist) {
                nearestDist = d;
                nearestIdx = s.idx;
              }
            }
          }
        });
        if (nearestIdx !== -1) {
          const s = stops.find((st) => st.idx === nearestIdx);
          visited.add(nearestIdx);
          load += s.load;
          distance += nearestDist;
          order.push({ ...s, legDistance: nearestDist });
          current = s;
          addedAny = true;
        }
      }

      const returnDist = Math.sqrt(Math.pow(current.x - depot.x, 2) + Math.pow(current.y - depot.y, 2));
      distance += returnDist;
      trips.push({ order, load, distance, returnDist, stopCount: order.length - 1 });

      if (order.length === 1) break; // safety: nothing could be added, avoid infinite loop
    }

    const totalDistance = trips.reduce((s, t) => s + t.distance, 0);
    return { trips, totalDistance, overloadedStops };
  }, [routePoints, vehicleCapacity]);

  // --- Risk Pooling: sentralisasi vs desentralisasi safety stock ---
  const [riskCVPct, setRiskCVPct] = usePersistentState("network.riskCVPct", 30);
  const [riskLeadTimeDays, setRiskLeadTimeDays] = usePersistentState("network.riskLeadTimeDays", 7);
  const [riskServiceLevelIdx, setRiskServiceLevelIdx] = usePersistentState("network.riskServiceLevelIdx", 1);

  const riskPooling = useMemo(() => {
    if (demandPoints.length === 0) return null;
    const cv = (Number(riskCVPct) || 0) / 100;
    const z = SERVICE_LEVELS[riskServiceLevelIdx]?.z ?? 1.65;
    const stdDevs = demandPoints.map((p) => (Number(p.volume) || 0) * cv);

    // Skenario 1: setiap titik menyimpan safety stock sendiri (tidak ada pooling)
    const decentralizedGroups = demandPoints.map((_, i) => i);
    const decentralizedSS = computeSafetyStockByGroups(stdDevs, decentralizedGroups, z, riskLeadTimeDays);

    // Skenario 2: mengikuti jaringan saat ini (hasil Alokasi Multi-Gudang) — titik yang
    // dilayani gudang yang sama berbagi satu buffer gabungan
    let currentGroups = decentralizedGroups;
    let currentWarehouseCount = demandPoints.length;
    if (multiAllocation?.assignments?.length === demandPoints.length) {
      const nameToGroup = {};
      currentGroups = demandPoints.map((p) => {
        const a = multiAllocation.assignments.find((as) => as.point === p.name);
        return a ? a.warehouseIdx : 0;
      });
      currentWarehouseCount = multiAllocation.openWarehouses.length;
    }
    const currentSS = computeSafetyStockByGroups(stdDevs, currentGroups, z, riskLeadTimeDays);

    // Skenario 3: satu gudang pusat tunggal melayani semua titik (pooling penuh)
    const centralizedGroups = demandPoints.map(() => 0);
    const centralizedSS = computeSafetyStockByGroups(stdDevs, centralizedGroups, z, riskLeadTimeDays);

    const savingsCurrentVsDecentral = decentralizedSS > 0 ? ((decentralizedSS - currentSS) / decentralizedSS) * 100 : 0;
    const savingsCentralVsDecentral = decentralizedSS > 0 ? ((decentralizedSS - centralizedSS) / decentralizedSS) * 100 : 0;

    return {
      z,
      cv,
      decentralizedSS,
      currentSS,
      currentWarehouseCount,
      centralizedSS,
      savingsCurrentVsDecentral,
      savingsCentralVsDecentral,
    };
  }, [demandPoints, riskCVPct, riskLeadTimeDays, riskServiceLevelIdx, multiAllocation]);

  // --- Skenario What-If Jaringan: perubahan demand & penutupan gudang ---
  const [whatIfDemandPct, setWhatIfDemandPct] = usePersistentState("network.whatIfDemandPct", 0);
  const [whatIfClosedIdx, setWhatIfClosedIdx] = usePersistentState("network.whatIfClosedIdx", "none");

  const networkWhatIf = useMemo(() => {
    if (candidates.length === 0 || demandPoints.length === 0) return null;

    const scenarioDemand = demandPoints.map((p) => ({
      ...p,
      volume: (Number(p.volume) || 0) * (1 + (Number(whatIfDemandPct) || 0) / 100),
    }));
    const closedIdx = whatIfClosedIdx === "none" ? -1 : Number(whatIfClosedIdx);
    const scenarioCandidates = candidates.filter((_, i) => i !== closedIdx);

    if (scenarioCandidates.length === 0) return { unavailable: true };

    const scenarioK = Math.min(Number(openWarehouseCount) || 1, scenarioCandidates.length);
    const scenarioBest = computeFacilityAllocation(scenarioCandidates, scenarioDemand, scenarioK, maxServiceDistance, costPerDistance);
    if (!scenarioBest) return { unavailable: true };

    const cv = (Number(riskCVPct) || 0) / 100;
    const z = SERVICE_LEVELS[riskServiceLevelIdx]?.z ?? 1.65;
    const scenarioStdDevs = scenarioDemand.map((p) => (Number(p.volume) || 0) * cv);
    let scenarioGroups = scenarioDemand.map((_, i) => i);
    if (scenarioBest.assignments.length === scenarioDemand.length) {
      scenarioGroups = scenarioDemand.map((p) => {
        const a = scenarioBest.assignments.find((as) => as.point === p.name);
        return a ? a.warehouseIdx : 0;
      });
    }
    const scenarioSS = computeSafetyStockByGroups(scenarioStdDevs, scenarioGroups, z, riskLeadTimeDays);

    return {
      unavailable: false,
      openWarehouseCount: scenarioBest.openWarehouses.length,
      totalCost: scenarioBest.totalCost,
      overflowVolume: scenarioBest.overflowVolume,
      serviceViolations: scenarioBest.serviceViolations,
      safetyStock: scenarioSS,
      closedName: closedIdx >= 0 ? candidates[closedIdx]?.name : null,
    };
  }, [candidates, demandPoints, whatIfDemandPct, whatIfClosedIdx, openWarehouseCount, maxServiceDistance, costPerDistance, riskCVPct, riskLeadTimeDays, riskServiceLevelIdx]);

  const networkWhatIfChartData = useMemo(() => {
    if (!networkWhatIf || networkWhatIf.unavailable || !multiAllocation) return [];
    return [
      { metric: "Total Biaya (Rp jt)", Baseline: Math.round(multiAllocation.totalCost / 1_000_000), Skenario: Math.round(networkWhatIf.totalCost / 1_000_000) },
      { metric: "Safety Stock", Baseline: Math.round(riskPooling?.currentSS || 0), Skenario: Math.round(networkWhatIf.safetyStock) },
      { metric: "Gudang Dibuka", Baseline: multiAllocation.openWarehouses.length, Skenario: networkWhatIf.openWarehouseCount },
    ];
  }, [networkWhatIf, multiAllocation, riskPooling]);

  useReportSync("network", {
    cogX: cog.x,
    cogY: cog.y,
    bestCandidate: candidateResults[0]?.name,
    bestCandidateCost: candidateResults[0]?.totalCost,
    multiWarehouseCount: multiAllocation?.openWarehouses?.length,
    multiWarehouseCost: multiAllocation?.totalCost,
    multiWarehouseSavingsPct: multiAllocation?.savingsPct,
    multiWarehouseServiceViolations: multiAllocation?.serviceViolations,
    routeTotal: routeResult.total,
    routeStops: routePoints.length,
    vrpVehicleCount: vrpResult.trips.length,
    vrpTotalDistance: vrpResult.totalDistance,
    riskPoolingSavingsPct: riskPooling?.savingsCurrentVsDecentral,
    riskPoolingCurrentSS: riskPooling?.currentSS,
  });

  const tabs = [
    { id: "cog", label: "Center of Gravity" },
    { id: "warehouse", label: "Evaluasi Lokasi Gudang" },
    { id: "multi", label: "Alokasi Multi-Gudang" },
    { id: "route", label: "Rute Distribusi" },
    { id: "risk", label: "Risk Pooling" },
    { id: "whatif", label: "Skenario What-If" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ModuleTabs tabs={tabs} tab={tab} setTab={setTab} accent={accent} />

      {tab === "cog" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <SectionCard title="Titik Demand" subtitle="Koordinat & volume tiap titik permintaan" accent={accent}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium" style={{ color: "#4B4B4F" }}>
                Daftar Titik
              </p>
              <div className="flex items-center gap-2">
                {Number(demandSignal?.forecastNext) > 0 && (
                  <button
                    onClick={importDemandFromPlanning}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
                    style={{ backgroundColor: "rgba(10,132,255,0.12)", color: "#0A66CC" }}
                  >
                    <Sparkles size={12} /> Impor Total Demand dari Demand Planning ({demandSignal.skuCount} SKU)
                  </button>
                )}
                <button
                  onClick={addDemandPoint}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                  style={{ backgroundColor: `${accent}22`, color: accent }}
                >
                  <Plus size={12} /> Tambah
                </button>
              </div>
            </div>
            {Number(demandSignal?.forecastNext) > 0 && (
              <p className="mb-3 text-[11px] leading-relaxed" style={{ color: "#8A8A8E" }}>
                Total forecast periode berikutnya dari Demand Planning ({Number(demandSignal.forecastNext).toLocaleString("id-ID")} unit)
                akan disebar ke titik-titik di bawah mengikuti proporsi volume yang sudah kamu atur — sebaran
                geografis tetap punya kamu, totalnya ditarik dari data forecast.
              </p>
            )}

            <div className="mb-1.5 flex items-center gap-2 px-1">
              <span className="w-20 text-[10px]" style={{ color: "#9A9AA0" }}>
                Nama
              </span>
              <span className="flex-1 text-[10px]" style={{ color: "#9A9AA0" }}>
                X
              </span>
              <span className="flex-1 text-[10px]" style={{ color: "#9A9AA0" }}>
                Y
              </span>
              <span className="flex-1 text-[10px]" style={{ color: "#9A9AA0" }}>
                Volume
              </span>
            </div>

            <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
              {demandPoints.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={p.name}
                    onChange={(e) => updateDemandPoint(i, "name", e.target.value)}
                    className="w-20 rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                  />
                  <input
                    type="number"
                    value={p.x}
                    onChange={(e) => updateDemandPoint(i, "x", e.target.value)}
                    className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                  />
                  <input
                    type="number"
                    value={p.y}
                    onChange={(e) => updateDemandPoint(i, "y", e.target.value)}
                    className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                  />
                  <input
                    type="number"
                    value={p.volume}
                    onChange={(e) => updateDemandPoint(i, "volume", e.target.value)}
                    className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                  />
                  <button onClick={() => removeDemandPoint(i)}>
                    <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <SectionCard title="Peta Titik Demand & Lokasi Optimal" accent={accent}>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis type="number" dataKey="x" name="X" tick={{ fontSize: 11, fill: "#8A8A8E" }} />
                    <YAxis type="number" dataKey="y" name="Y" tick={{ fontSize: 11, fill: "#8A8A8E" }} />
                    <ZAxis type="number" dataKey="volume" range={[60, 380]} />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(255,255,255,0.7)",
                        borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Scatter name="Titik Demand" data={scatterDemand} fill="#0A84FF" />
                    <Scatter name="Center of Gravity" data={scatterCog} fill={accent} shape="star" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <div className="grid grid-cols-2 gap-3">
              <ResultStat accent={accent} label="Koordinat X Optimal" value={cog.x} highlight />
              <ResultStat accent={accent} label="Koordinat Y Optimal" value={cog.y} highlight />
            </div>
          </div>
        </div>
      )}

      {tab === "warehouse" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <SectionCard title="Kandidat Lokasi Gudang" subtitle="Bandingkan berdasarkan total biaya distribusi" accent={accent}>
            <div className="mb-4">
              <FieldLabel hint="Biaya transportasi per unit jarak per unit volume">Biaya per Unit Jarak</FieldLabel>
              <NumberInput value={costPerDistance} onChange={setCostPerDistance} suffix="Rp" />
            </div>

            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: "#4B4B4F" }}>
                Daftar Kandidat
              </p>
              <button
                onClick={addCandidate}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah
              </button>
            </div>

            <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {candidates.map((c, i) => (
                <div key={i} className="rounded-xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.6)" }}>
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      value={c.name}
                      onChange={(e) => updateCandidate(i, "name", e.target.value)}
                      className="flex-1 rounded-lg px-2 py-1.5 text-xs font-medium outline-none"
                      style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                    />
                    <button onClick={() => removeCandidate(i)}>
                      <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <FieldLabel>X</FieldLabel>
                      <NumberInput value={c.x} onChange={(v) => updateCandidate(i, "x", v)} />
                    </div>
                    <div>
                      <FieldLabel>Y</FieldLabel>
                      <NumberInput value={c.y} onChange={(v) => updateCandidate(i, "y", v)} />
                    </div>
                    <div>
                      <FieldLabel hint="Sewa, operasional, dsb.">Biaya Tetap</FieldLabel>
                      <NumberInput value={c.fixedCost} onChange={(v) => updateCandidate(i, "fixedCost", v)} />
                    </div>
                    <div>
                      <FieldLabel hint="Batas throughput volume yang bisa ditangani gudang ini">Kapasitas</FieldLabel>
                      <NumberInput value={c.capacity} onChange={(v) => updateCandidate(i, "capacity", v)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Peringkat Kandidat" subtitle="Diurutkan dari total biaya terendah" accent={accent}>
            <div className="space-y-2">
              {candidateResults.map((r, i) => (
                <div
                  key={r.name}
                  className="flex items-center justify-between rounded-xl p-3.5"
                  style={{ backgroundColor: i === 0 ? "rgba(10,132,255,0.12)" : "rgba(255,255,255,0.6)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: i === 0 ? "#0A84FF" : "rgba(0,0,0,0.06)",
                        color: i === 0 ? "#fff" : "#8A8A8E",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-[11px]" style={{ color: "#9A9AA0" }}>
                        Biaya Transportasi Rp {r.transportCost.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold tracking-tight" style={{ color: i === 0 ? "#0A66CC" : "#1D1D1F" }}>
                    Rp {r.totalCost.toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed" style={{ color: "#8A8A8E" }}>
              Total Biaya = Biaya Transportasi (jarak × volume × biaya/jarak, dijumlah ke semua titik demand) + Biaya Tetap kandidat.
            </p>
          </SectionCard>
        </div>
      )}

      {tab === "multi" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
            <SectionCard title="Parameter Alokasi" subtitle="Jumlah gudang & batas layanan yang akan dipakai" accent={accent}>
              <FieldLabel hint="Algoritma mencoba semua kombinasi kandidat sejumlah ini dan memilih total biaya terendah">
                Jumlah Gudang Dibuka
              </FieldLabel>
              <NumberInput
                value={openWarehouseCount}
                onChange={setOpenWarehouseCount}
                min={1}
                max={candidates.length}
                suffix={`dari ${candidates.length} kandidat`}
              />

              <div className="mt-3">
                <FieldLabel hint="Jarak maksimum yang dianggap masih memenuhi target layanan ke pelanggan">
                  Batas Jarak Layanan Maksimum
                </FieldLabel>
                <NumberInput value={maxServiceDistance} onChange={setMaxServiceDistance} />
              </div>

              {multiAllocation?.serviceViolations > 0 && (
                <div
                  className="mt-3 flex items-start gap-2 rounded-xl p-3 text-[11px]"
                  style={{ backgroundColor: "rgba(226,104,90,0.12)", color: "#B7473C" }}
                >
                  <AlertOctagon size={14} className="mt-0.5 shrink-0" />
                  <span>
                    {multiAllocation.serviceViolations} titik demand berada di luar batas jarak layanan
                    ({maxServiceDistance}) dengan konfigurasi gudang terpilih — lihat tabel detail di bawah.
                  </span>
                </div>
              )}
              {multiAllocation?.overflowVolume > 0 && (
                <div
                  className="mt-3 flex items-start gap-2 rounded-xl p-3 text-[11px]"
                  style={{ backgroundColor: "rgba(226,104,90,0.12)", color: "#B7473C" }}
                >
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>
                    Kapasitas total gudang terpilih tidak cukup — kelebihan{" "}
                    {multiAllocation.overflowVolume.toLocaleString("id-ID")} unit volume dipaksakan ke gudang
                    termurah (tetap dihitung dalam biaya transportasi).
                  </span>
                </div>
              )}
              <p className="mt-3 text-xs leading-relaxed" style={{ color: "#8A8A8E" }}>
                Setiap titik demand dialokasikan ke gudang terbuka dengan biaya transportasi terendah, selama
                kapasitas gudang tersebut masih cukup. Titik bervolume besar diproses lebih dulu agar kendala
                kapasitas lebih realistis.
              </p>
            </SectionCard>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ResultStat
                accent={accent}
                label="Gudang Terbuka (Optimal)"
                value={multiAllocation?.openWarehouses?.length ?? "—"}
                highlight
              />
              <ResultStat
                accent={accent}
                label="Total Biaya (Fixed + Transport)"
                value={multiAllocation ? `Rp ${multiAllocation.totalCost.toLocaleString("id-ID")}` : "—"}
              />
              <ResultStat
                accent={accent}
                label="vs. 1 Gudang Terbaik"
                value={
                  multiAllocation?.savingsPct != null
                    ? `${multiAllocation.savingsPct >= 0 ? "Hemat" : "Lebih Mahal"} ${Math.abs(multiAllocation.savingsPct).toFixed(1)}%`
                    : "—"
                }
                trend={
                  multiAllocation?.savingsPct != null
                    ? { dir: multiAllocation.savingsPct >= 0 ? "up" : "down", text: "" }
                    : undefined
                }
              />
              <ResultStat
                accent={multiAllocation?.serviceViolations > 0 ? "#E2685A" : accent}
                label="Pelanggaran Service Level"
                value={multiAllocation ? `${multiAllocation.serviceViolations} titik` : "—"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
            <SectionCard title="Peta Alokasi" subtitle="Warna titik demand mengikuti gudang yang melayaninya" accent={accent}>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis type="number" dataKey="x" name="X" tick={{ fontSize: 11, fill: "#8A8A8E" }} />
                    <YAxis type="number" dataKey="y" name="Y" tick={{ fontSize: 11, fill: "#8A8A8E" }} />
                    <ZAxis type="number" dataKey="volume" range={[60, 380]} />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(255,255,255,0.7)",
                        borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {(multiAllocation?.utilization || []).map((w) => (
                      <Scatter
                        key={`pts-${w.idx}`}
                        name={w.name}
                        data={(multiAllocation.assignments || [])
                          .filter((a) => a.warehouseIdx === w.idx)
                          .map((a) => ({ x: a.x, y: a.y, volume: a.volume, name: a.point }))}
                        fill={w.color}
                      />
                    ))}
                    <Scatter
                      name="Gudang Terbuka"
                      data={(multiAllocation?.openWarehouses || []).map((w) => ({
                        x: Number(w.x) || 0,
                        y: Number(w.y) || 0,
                        volume: 250,
                        name: w.name,
                      }))}
                      fill="#1D1D1F"
                      shape="star"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Utilisasi Kapasitas" subtitle="Volume teralokasi vs kapasitas gudang" accent={accent}>
              <div className="space-y-3">
                {(multiAllocation?.utilization || []).map((w) => (
                  <div key={w.idx}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="font-medium" style={{ color: "#4B4B4F" }}>
                        {w.name}
                      </span>
                      <span style={{ color: w.pct > 100 ? "#E2685A" : "#9A9AA0" }}>
                        {w.assignedVolume.toLocaleString("id-ID")} / {w.capacity.toLocaleString("id-ID")} ({w.pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.06)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, w.pct)}%`,
                          backgroundColor: w.pct > 100 ? "#E2685A" : w.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
                {!multiAllocation?.utilization?.length && (
                  <p className="text-xs" style={{ color: "#9A9AA0" }}>
                    Tambahkan kandidat gudang &amp; titik demand untuk melihat utilisasi.
                  </p>
                )}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Detail Alokasi per Titik Demand" accent={accent}>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left" style={{ color: "#9A9AA0" }}>
                    <th className="pb-2 font-medium">Titik Demand</th>
                    <th className="pb-2 font-medium">Volume</th>
                    <th className="pb-2 font-medium">Dilayani Oleh</th>
                    <th className="pb-2 font-medium">Jarak</th>
                    <th className="pb-2 text-right font-medium">Biaya Transportasi</th>
                  </tr>
                </thead>
                <tbody>
                  {(multiAllocation?.assignments || []).map((a, i) => (
                    <tr
                      key={i}
                      style={{
                        borderTop: "1px solid rgba(0,0,0,0.05)",
                        backgroundColor: a.violatesService ? "rgba(226,104,90,0.08)" : "transparent",
                      }}
                    >
                      <td className="py-1.5">{a.point}</td>
                      <td className="py-1.5">{a.volume.toLocaleString("id-ID")}</td>
                      <td className="py-1.5">{a.warehouse}</td>
                      <td className="py-1.5" style={{ color: a.violatesService ? "#B7473C" : "inherit" }}>
                        {a.distance.toFixed(1)}
                        {a.violatesService && (
                          <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] font-medium">
                            <AlertOctagon size={10} /> luar batas
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 text-right">Rp {Math.round(a.cost).toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {multiAllocation && (
              <p className="mt-3 text-xs leading-relaxed" style={{ color: "#8A8A8E" }}>
                Biaya Tetap ({multiAllocation.openWarehouses.map((w) => w.name).join(", ")}): Rp{" "}
                {multiAllocation.fixedCostTotal.toLocaleString("id-ID")} + Biaya Transportasi Rp{" "}
                {Math.round(multiAllocation.transportCost).toLocaleString("id-ID")} = Total Rp{" "}
                {multiAllocation.totalCost.toLocaleString("id-ID")}.
              </p>
            )}
          </SectionCard>
        </div>
      )}

      {tab === "route" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <SectionCard title="Titik Pengiriman" subtitle="Titik pertama diperlakukan sebagai depot" accent={accent}>
            <div className="mb-3">
              <FieldLabel hint="Kapasitas muat satu kendaraan/trip — jika total muatan melebihi ini, rute otomatis dipecah jadi beberapa trip/kendaraan">
                Kapasitas Kendaraan
              </FieldLabel>
              <NumberInput value={vehicleCapacity} onChange={setVehicleCapacity} />
            </div>

            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: "#4B4B4F" }}>
                Daftar Titik
              </p>
              <button
                onClick={addRoutePoint}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah
              </button>
            </div>

            <div className="mb-1.5 flex items-center gap-2 px-1">
              <span className="w-20 text-[10px]" style={{ color: "#9A9AA0" }}>
                Nama
              </span>
              <span className="flex-1 text-[10px]" style={{ color: "#9A9AA0" }}>
                X
              </span>
              <span className="flex-1 text-[10px]" style={{ color: "#9A9AA0" }}>
                Y
              </span>
              <span className="flex-1 text-[10px]" style={{ color: "#9A9AA0" }}>
                Muatan
              </span>
            </div>

            <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
              {routePoints.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={p.name}
                    onChange={(e) => updateRoutePoint(i, "name", e.target.value)}
                    className="w-20 rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                  />
                  <input
                    type="number"
                    value={p.x}
                    onChange={(e) => updateRoutePoint(i, "x", e.target.value)}
                    className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                  />
                  <input
                    type="number"
                    value={p.y}
                    onChange={(e) => updateRoutePoint(i, "y", e.target.value)}
                    className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                  />
                  <input
                    type="number"
                    value={p.load ?? 0}
                    disabled={i === 0}
                    onChange={(e) => updateRoutePoint(i, "load", e.target.value)}
                    className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none disabled:opacity-40"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                  />
                  <button onClick={() => removeRoutePoint(i)}>
                    <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                  </button>
                </div>
              ))}
            </div>
            {vrpResult.overloadedStops.length > 0 && (
              <div
                className="mt-3 flex items-start gap-2 rounded-xl p-3 text-[11px]"
                style={{ backgroundColor: "rgba(226,104,90,0.12)", color: "#B7473C" }}
              >
                <AlertOctagon size={14} className="mt-0.5 shrink-0" />
                <span>
                  Muatan {vrpResult.overloadedStops.join(", ")} melebihi kapasitas satu kendaraan — tetap dilayani
                  sendirian dalam satu trip khusus.
                </span>
              </div>
            )}
          </SectionCard>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <ResultStat accent={accent} label="Jumlah Trip/Kendaraan" value={vrpResult.trips.length} highlight />
              <ResultStat accent={accent} label="Total Jarak (Semua Trip)" value={vrpResult.totalDistance.toFixed(1)} />
              <ResultStat
                accent={accent}
                label="vs. 1 Kendaraan Tanpa Batas"
                value={
                  vrpResult.trips.length > 1
                    ? `+${(vrpResult.totalDistance - routeResult.total).toFixed(1)} jarak`
                    : "Sama"
                }
              />
            </div>

            <SectionCard title="Rute per Trip/Kendaraan (VRP Berkapasitas)" subtitle="Nearest Neighbor per trip, trip baru dimulai saat kapasitas penuh" accent={accent}>
              <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
                {vrpResult.trips.map((trip, ti) => (
                  <div key={ti} className="rounded-xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.6)", borderLeft: `3px solid ${VRP_COLORS[ti % VRP_COLORS.length]}` }}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold" style={{ color: VRP_COLORS[ti % VRP_COLORS.length] }}>
                        Trip {ti + 1} · {trip.stopCount} stop
                      </p>
                      <p className="text-[11px]" style={{ color: "#9A9AA0" }}>
                        Muatan {trip.load.toLocaleString("id-ID")} / {Number(vehicleCapacity).toLocaleString("id-ID")} · Jarak {trip.distance.toFixed(1)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {trip.order.map((p, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs" style={{ backgroundColor: "rgba(255,255,255,0.7)" }}>
                          <span className="font-medium">{i}. {p.name}</span>
                          <span style={{ color: "#9A9AA0" }}>
                            {i === 0 ? "Titik awal (depot)" : `+${p.legDistance.toFixed(1)} jarak · muatan ${p.load}`}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs" style={{ backgroundColor: `${VRP_COLORS[ti % VRP_COLORS.length]}14`, color: VRP_COLORS[ti % VRP_COLORS.length] }}>
                        <span className="font-medium">Kembali ke {routePoints[0]?.name || "Depot"}</span>
                        <span>+{trip.returnDist.toFixed(1)} jarak</span>
                      </div>
                    </div>
                  </div>
                ))}
                {vrpResult.trips.length === 0 && (
                  <p className="text-xs" style={{ color: "#9A9AA0" }}>Tambahkan titik pengiriman untuk melihat pembagian trip.</p>
                )}
              </div>
            </SectionCard>
          </div>

        </div>
      )}

      {tab === "risk" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
            <SectionCard title="Parameter Variabilitas Demand" subtitle="Dipakai untuk menghitung safety stock tiap skenario" accent={accent}>
              <div className="mb-3">
                <FieldLabel hint="Coefficient of Variation — rasio simpangan baku terhadap rata-rata volume tiap titik demand">
                  Variabilitas Demand (CV)
                </FieldLabel>
                <NumberInput value={riskCVPct} onChange={setRiskCVPct} suffix="%" />
              </div>
              <div className="mb-3">
                <FieldLabel hint="Lead time pengisian ulang stok dari gudang ke titik demand">Lead Time</FieldLabel>
                <NumberInput value={riskLeadTimeDays} onChange={setRiskLeadTimeDays} suffix="hari" />
              </div>
              <FieldLabel>Target Service Level</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {SERVICE_LEVELS.map((sl, i) => (
                  <button
                    key={sl.label}
                    onClick={() => setRiskServiceLevelIdx(i)}
                    className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: riskServiceLevelIdx === i ? accent : "rgba(255,255,255,0.7)",
                      color: riskServiceLevelIdx === i ? "#fff" : "#4B4B4F",
                    }}
                  >
                    {sl.label}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed" style={{ color: "#8A8A8E" }}>
                Efek risk pooling: menggabungkan safety stock beberapa titik demand ke satu gudang mengurangi total
                buffer yang dibutuhkan, karena variabilitas demand yang independen sebagian saling meniadakan
                (SS gabungan = z × √LT × √(Σ σᵢ²), lebih kecil dari jumlah SS per titik = z × √LT × Σ σᵢ).
              </p>
            </SectionCard>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ResultStat accent={accent} label="Desentralisasi Penuh (per titik)" value={Math.round(riskPooling?.decentralizedSS || 0).toLocaleString("id-ID")} unit="unit SS" />
                <ResultStat
                  accent={accent}
                  label={`Jaringan Saat Ini (${riskPooling?.currentWarehouseCount ?? "—"} gudang)`}
                  value={Math.round(riskPooling?.currentSS || 0).toLocaleString("id-ID")}
                  unit="unit SS"
                  highlight
                  trend={riskPooling ? { dir: riskPooling.savingsCurrentVsDecentral >= 0 ? "up" : "down", text: `Hemat ${riskPooling.savingsCurrentVsDecentral.toFixed(1)}%` } : undefined}
                />
                <ResultStat
                  accent={accent}
                  label="Sentralisasi Penuh (1 gudang)"
                  value={Math.round(riskPooling?.centralizedSS || 0).toLocaleString("id-ID")}
                  unit="unit SS"
                  trend={riskPooling ? { dir: riskPooling.savingsCentralVsDecentral >= 0 ? "up" : "down", text: `Hemat ${riskPooling.savingsCentralVsDecentral.toFixed(1)}%` } : undefined}
                />
              </div>

              <SectionCard title="Perbandingan Total Safety Stock" subtitle="Semakin sedikit titik penyimpanan terpisah, semakin besar efek pooling" accent={accent}>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={[
                        { name: "Desentralisasi Penuh", SS: Math.round(riskPooling?.decentralizedSS || 0) },
                        { name: "Jaringan Saat Ini", SS: Math.round(riskPooling?.currentSS || 0) },
                        { name: "Sentralisasi Penuh", SS: Math.round(riskPooling?.centralizedSS || 0) },
                      ]}
                      margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8A8A8E" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#8A8A8E" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255,255,255,0.92)",
                          border: "1px solid rgba(255,255,255,0.7)",
                          borderRadius: 12,
                          boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="SS" fill={accent} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      )}

      {tab === "whatif" && (
        <div className="flex flex-col gap-4">
          <SectionCard title="Parameter Skenario" subtitle="Uji dampak perubahan demand & penutupan gudang terhadap jaringan" accent={accent}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel hint="Perubahan volume demand di semua titik secara merata, dibanding kondisi saat ini">
                  Perubahan Volume Demand
                </FieldLabel>
                <NumberInput value={whatIfDemandPct} onChange={setWhatIfDemandPct} suffix="%" />
              </div>
              <div>
                <FieldLabel hint="Simulasikan salah satu kandidat gudang ditutup / tidak tersedia">Tutup Gudang</FieldLabel>
                <select
                  value={whatIfClosedIdx}
                  onChange={(e) => setWhatIfClosedIdx(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                >
                  <option value="none">Tidak ada</option>
                  {candidates.map((c, i) => (
                    <option key={i} value={i}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed" style={{ color: "#8A8A8E" }}>
              Skenario dihitung ulang dari nol memakai jumlah gudang dibuka & batas jarak layanan yang sama seperti
              tab Alokasi Multi-Gudang, tapi dengan volume demand dan daftar kandidat sesuai parameter di atas. Data
              asli tidak berubah — ini simulasi terpisah.
            </p>
          </SectionCard>

          {networkWhatIf?.unavailable ? (
            <SectionCard title="Skenario Tidak Dapat Dihitung" accent={accent}>
              <p className="text-xs" style={{ color: "#9A9AA0" }}>
                Semua kandidat gudang tertutup pada skenario ini — pilih parameter lain.
              </p>
            </SectionCard>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <ResultStat accent={accent} label="Gudang Dibuka (Baseline)" value={multiAllocation?.openWarehouses?.length ?? "—"} />
                <ResultStat accent={accent} label="Gudang Dibuka (Skenario)" value={networkWhatIf?.openWarehouseCount ?? "—"} highlight />
                <ResultStat
                  accent={accent}
                  label="Total Biaya (Skenario)"
                  value={networkWhatIf ? `Rp ${networkWhatIf.totalCost.toLocaleString("id-ID")}` : "—"}
                />
                <ResultStat
                  accent={networkWhatIf?.serviceViolations > 0 ? "#E2685A" : accent}
                  label="Pelanggaran Service Level"
                  value={networkWhatIf ? `${networkWhatIf.serviceViolations} titik` : "—"}
                />
                <ResultStat
                  accent={accent}
                  label="Safety Stock (Skenario)"
                  value={networkWhatIf ? Math.round(networkWhatIf.safetyStock).toLocaleString("id-ID") : "—"}
                />
              </div>

              <SectionCard title="Baseline vs Skenario" subtitle={networkWhatIf?.closedName ? `Gudang ditutup: ${networkWhatIf.closedName}` : "Tidak ada gudang yang ditutup"} accent={accent}>
                <div style={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart data={networkWhatIfChartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="metric" tick={{ fontSize: 11, fill: "#8A8A8E" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#8A8A8E" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255,255,255,0.92)",
                          border: "1px solid rgba(255,255,255,0.7)",
                          borderRadius: 12,
                          boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Baseline" fill="#B5B5B9" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Skenario" fill={accent} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Module 5: Lean & Six Sigma ----------

const SIX_BIG_LOSSES_INFO = {
  breakdown: { label: "Kerusakan Mesin (Breakdown)", group: "Availability" },
  setup: { label: "Setup & Penyesuaian", group: "Availability" },
  minorStop: { label: "Idling & Minor Stops", group: "Performance" },
  speed: { label: "Kecepatan Berkurang", group: "Performance" },
  startup: { label: "Startup / Yield Loss", group: "Quality" },
  defect: { label: "Cacat Proses / Rework", group: "Quality" },
};

const GROUP_COLORS = {
  Availability: "#E2685A",
  Performance: "#E2A63B",
  Quality: "#4C86D6",
};

function InsightBox({ accent, text }) {
  if (!text) return null;
  return (
    <div
      className="flex items-start gap-2.5 rounded-2xl p-4"
      style={{ backgroundColor: `${accent}12`, border: `1px solid ${accent}33` }}
    >
      <Lightbulb size={16} style={{ color: accent, marginTop: 1, flexShrink: 0 }} />
      <p className="text-xs leading-relaxed" style={{ color: "#4B4B4F" }}>
        {text}
      </p>
    </div>
  );
}

function WarningBanner({ text }) {
  if (!text) return null;
  return (
    <div
      className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs font-medium leading-relaxed"
      style={{ backgroundColor: "rgba(226,104,90,0.15)", color: "#C0453A" }}
    >
      <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{text}</span>
    </div>
  );
}

const DEFAULT_DEFECT_CATEGORIES = [
  { label: "Dimensi Tidak Sesuai", count: 5 },
  { label: "Goresan / Permukaan", count: 4 },
  { label: "Kesalahan Perakitan", count: 3 },
];

const DEFAULT_VSM_STEPS = [
  { name: "Terima Bahan Baku", cycleTime: 30, waitTime: 1 },
  { name: "Proses Pemotongan", cycleTime: 45, waitTime: 0.5 },
  { name: "Perakitan", cycleTime: 60, waitTime: 1 },
  { name: "Inspeksi & Pengemasan", cycleTime: 25, waitTime: 0.5 },
];

const DEFAULT_SEVERITIES = {
  transportation: 2,
  inventory: 3,
  motion: 2,
  waiting: 4,
  overproduction: 1,
  overprocessing: 2,
  defects: 3,
};

const DEFAULT_FREQUENCIES = {
  transportation: 2,
  inventory: 2,
  motion: 3,
  waiting: 3,
  overproduction: 1,
  overprocessing: 2,
  defects: 2,
};

const DEFAULT_FIVE_WHY = {
  problem: "",
  whys: ["", "", "", "", ""],
  rootCause: "",
};

const DEFAULT_ACTIONS = [
  { description: "Contoh: pasang jadwal preventive maintenance mingguan", pic: "", targetDate: "", status: "Belum Mulai" },
];

const STATUS_OPTIONS = ["Belum Mulai", "Berjalan", "Selesai"];
const STATUS_COLORS = {
  "Belum Mulai": "#9A9AA0",
  Berjalan: "#E2A63B",
  Selesai: "#4FAE7A",
};

// --- Fishbone (Ishikawa) Diagram: 6M ---
const FISHBONE_CATEGORIES = [
  { key: "man", label: "Manusia (Man)" },
  { key: "machine", label: "Mesin (Machine)" },
  { key: "method", label: "Metode (Method)" },
  { key: "material", label: "Material (Material)" },
  { key: "measurement", label: "Pengukuran (Measurement)" },
  { key: "environment", label: "Lingkungan (Environment)" },
];

const FISHBONE_COLORS = {
  man: "#4C86D6",
  machine: "#E2685A",
  method: "#E2A63B",
  material: "#4FAE7A",
  measurement: "#7B7FE0",
  environment: "#2FA9A3",
};

const DEFAULT_FISHBONE = {
  man: [""],
  machine: [""],
  method: [""],
  material: [""],
  measurement: [""],
  environment: [""],
};

// --- 5S Audit ---
const FIVE_S_CATEGORIES = [
  {
    key: "seiri",
    label: "Seiri — Ringkas (Sort)",
    color: "#E2685A",
    items: [
      "Barang yang tidak diperlukan sudah disingkirkan dari area kerja",
      "Ada sistem red-tag untuk barang yang statusnya diragukan",
      "Tidak ada barang pribadi berlebihan di area kerja",
      "Persediaan/material berlebih di area kerja sudah diminimalkan",
    ],
  },
  {
    key: "seiton",
    label: "Seiton — Rapi (Set in Order)",
    color: "#E2A63B",
    items: [
      "Setiap barang memiliki tempat/lokasi yang jelas dan diberi label",
      "Alat kerja mudah dijangkau dan diambil tanpa mencari lama",
      "Jalur lalu lintas & area kerja ditandai dengan jelas (marka lantai)",
      "Barang dikembalikan ke tempatnya setelah digunakan",
    ],
  },
  {
    key: "seiso",
    label: "Seiso — Resik (Shine)",
    color: "#4FAE7A",
    items: [
      "Area kerja, mesin, dan lantai dalam kondisi bersih",
      "Ada jadwal pembersihan rutin dan dijalankan konsisten",
      "Kebocoran/tumpahan/kotoran cepat terdeteksi dan ditangani",
      "Kebersihan dijadikan sarana inspeksi kondisi mesin",
    ],
  },
  {
    key: "seiketsu",
    label: "Seiketsu — Rawat (Standardize)",
    color: "#4C86D6",
    items: [
      "Standar 3S di atas (Ringkas-Rapi-Resik) didokumentasikan dengan jelas",
      "Ada visual control (foto standar, checklist) di area kerja",
      "Standar diterapkan secara konsisten di seluruh shift/tim",
      "Audit 5S dilakukan secara berkala",
    ],
  },
  {
    key: "shitsuke",
    label: "Shitsuke — Rajin (Sustain)",
    color: "#7B7FE0",
    items: [
      "Karyawan menjalankan 5S tanpa harus diingatkan terus-menerus",
      "Ada pelatihan/sosialisasi 5S untuk karyawan baru maupun lama",
      "Manajemen aktif mendukung & terlibat dalam program 5S",
      "Ada mekanisme penghargaan/tindak lanjut hasil audit 5S",
    ],
  },
];

const DEFAULT_FIVE_S = FIVE_S_CATEGORIES.reduce((acc, cat) => {
  acc[cat.key] = cat.items.map(() => 3);
  return acc;
}, {});

const FIVE_S_ADVICE = {
  seiri: "Lakukan sortir berkala dan pasang red-tag pada barang yang statusnya diragukan agar area kerja hanya berisi yang benar-benar diperlukan.",
  seiton: "Buat pelabelan lokasi (shadow board/label rak) untuk setiap alat dan material agar semua orang tahu tempat pastinya.",
  seiso: "Tetapkan jadwal pembersihan rutin dan jadikan aktivitas bersih-bersih sekaligus sebagai inspeksi kondisi mesin.",
  seiketsu: "Dokumentasikan standar 3S (Ringkas-Rapi-Resik) dalam bentuk visual/checklist yang mudah diikuti semua shift.",
  shitsuke: "Perkuat kebiasaan lewat audit rutin, pelatihan berkala, serta keterlibatan aktif manajemen dan sistem penghargaan.",
};

// --- Cost of Poor Quality (model PAF: Prevention-Appraisal-Failure) ---
const COPQ_CATEGORIES = [
  { key: "prevention", label: "Prevention Cost", color: "#4FAE7A", group: "Cost of Good Quality" },
  { key: "appraisal", label: "Appraisal Cost", color: "#4C86D6", group: "Cost of Good Quality" },
  { key: "internalFailure", label: "Internal Failure Cost", color: "#E2A63B", group: "Cost of Poor Quality" },
  { key: "externalFailure", label: "External Failure Cost", color: "#E2685A", group: "Cost of Poor Quality" },
];

const DEFAULT_COPQ_ITEMS = {
  prevention: [
    { label: "Perencanaan & Sistem Kualitas", amount: 5000000 },
    { label: "Pelatihan Karyawan", amount: 3000000 },
    { label: "Preventive Maintenance", amount: 4000000 },
  ],
  appraisal: [
    { label: "Inspeksi & Pengujian", amount: 6000000 },
    { label: "Kalibrasi Alat Ukur", amount: 2000000 },
    { label: "Audit Kualitas", amount: 1500000 },
  ],
  internalFailure: [
    { label: "Scrap / Barang Rusak", amount: 8000000 },
    { label: "Rework / Perbaikan Ulang", amount: 6000000 },
    { label: "Inspeksi Ulang", amount: 2000000 },
    { label: "Downtime Akibat Cacat", amount: 3000000 },
  ],
  externalFailure: [
    { label: "Klaim Garansi", amount: 5000000 },
    { label: "Retur Pelanggan", amount: 4000000 },
    { label: "Penanganan Komplain", amount: 2000000 },
    { label: "Penarikan Produk (Recall)", amount: 0 },
  ],
};

function truncateCause(text, max = 28) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

function FishboneDiagram({ problem, fishbone }) {
  const columnCenters = [210, 430, 650];
  const topCats = FISHBONE_CATEGORIES.slice(0, 3);
  const bottomCats = FISHBONE_CATEGORIES.slice(3, 6);
  const boxW = 210;
  const boxH = 120;
  const maxLines = 4;

  const renderBox = (cat, colX, isTop) => {
    const causes = (fishbone[cat.key] || []).filter((c) => c.trim() !== "");
    const color = FISHBONE_COLORS[cat.key];
    const bx = isTop ? colX - boxW / 2 - 18 : colX - boxW / 2 + 18;
    const by = isTop ? 30 : 340;
    const lineFromX = isTop ? bx + boxW / 2 : bx + boxW / 2;
    const lineFromY = isTop ? by + boxH : by;
    const lineToX = colX;
    const lineToY = 300;
    const shown = causes.slice(0, maxLines);
    const extra = causes.length - shown.length;

    return (
      <g key={cat.key}>
        <line
          x1={lineFromX}
          y1={lineFromY}
          x2={lineToX}
          y2={lineToY}
          stroke={color}
          strokeWidth={2}
        />
        <rect
          x={bx}
          y={by}
          width={boxW}
          height={boxH}
          rx={10}
          fill="#ffffff"
          stroke={color}
          strokeWidth={1.5}
        />
        <text x={bx + 10} y={by + 20} fontSize="11" fontWeight="700" fill={color}>
          {cat.label}
        </text>
        {shown.length === 0 && (
          <text x={bx + 10} y={by + 40} fontSize="10" fill="#B5B5B9">
            Belum ada penyebab
          </text>
        )}
        {shown.map((c, i) => (
          <text key={i} x={bx + 10} y={by + 40 + i * 16} fontSize="10" fill="#4B4B4F">
            • {truncateCause(c)}
          </text>
        ))}
        {extra > 0 && (
          <text x={bx + 10} y={by + 40 + shown.length * 16} fontSize="10" fill="#9A9AA0">
            +{extra} lainnya
          </text>
        )}
      </g>
    );
  };

  return (
    <svg viewBox="0 0 950 520" className="w-full" style={{ minHeight: 320 }}>
      <line x1={90} y1={300} x2={800} y2={300} stroke="#8A8A8E" strokeWidth={3} />
      <polygon points="800,285 840,300 800,315" fill="#8A8A8E" />
      <rect x={800} y={260} width={140} height={80} rx={10} fill="rgba(10,132,255,0.08)" stroke="#0A84FF" strokeWidth={1.5} />
      <text x={870} y={295} fontSize="10" fontWeight="700" fill="#0A84FF" textAnchor="middle">
        MASALAH
      </text>
      <foreignObject x={806} y={300} width={128} height={38}>
        <div
          style={{
            fontSize: 9.5,
            lineHeight: "12px",
            color: "#1D1D1F",
            textAlign: "center",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {problem || "Belum diisi"}
        </div>
      </foreignObject>
      {topCats.map((cat, i) => renderBox(cat, columnCenters[i], true))}
      {bottomCats.map((cat, i) => renderBox(cat, columnCenters[i], false))}
    </svg>
  );
}

function LeanSixSigmaModule({ accent }) {
  const [tab, setTab] = useState("oee");

  // --- OEE state (breakdown mengikuti kerangka Six Big Losses) ---
  const [plannedTime, setPlannedTime] = usePersistentState("lean.plannedTime", 480);
  const [downBreakdown, setDownBreakdown] = usePersistentState("lean.downBreakdown", 30);
  const [downSetup, setDownSetup] = usePersistentState("lean.downSetup", 15);
  const [minorStopTime, setMinorStopTime] = usePersistentState("lean.minorStopTime", 20);
  const [idealCycleTime, setIdealCycleTime] = usePersistentState("lean.idealCycleTime", 0.8);
  const [totalCount, setTotalCount] = usePersistentState("lean.totalCount", 480);
  const [rejectStartup, setRejectStartup] = usePersistentState("lean.rejectStartup", 10);
  const [rejectProcess, setRejectProcess] = usePersistentState("lean.rejectProcess", 15);

  const oee = useMemo(() => {
    const planned = Number(plannedTime) || 0;
    const bd = Math.max(0, Number(downBreakdown) || 0);
    const su = Math.max(0, Number(downSetup) || 0);
    const minorStop = Math.max(0, Number(minorStopTime) || 0);
    const majorDowntime = bd + su;
    const operating = Math.max(0, planned - majorDowntime);
    const availability = planned > 0 ? operating / planned : 0;

    const ideal = Number(idealCycleTime) || 0;
    const total = Math.max(0, Number(totalCount) || 0);
    const rs = Math.max(0, Number(rejectStartup) || 0);
    const rp = Math.max(0, Number(rejectProcess) || 0);
    const good = Math.max(0, total - rs - rp);

    const netOperating = Math.max(0, operating - minorStop);
    const performance = netOperating > 0 ? Math.min(1, (ideal * total) / netOperating) : 0;
    const quality = total > 0 ? Math.min(1, good / total) : 0;

    const oeeVal = availability * performance * quality;
    let classification = "Perlu Perbaikan";
    let classColor = "#E2685A";
    if (oeeVal >= 0.85) {
      classification = "World Class";
      classColor = "#4FAE7A";
    } else if (oeeVal >= 0.6) {
      classification = "Dapat Diterima";
      classColor = "#E2A63B";
    }

    const speedLoss = Math.max(0, netOperating - ideal * total);
    const startupLoss = rs * ideal;
    const defectLoss = rp * ideal;

    const lossesRaw = [
      { id: "breakdown", minutes: bd },
      { id: "setup", minutes: su },
      { id: "minorStop", minutes: minorStop },
      { id: "speed", minutes: speedLoss },
      { id: "startup", minutes: startupLoss },
      { id: "defect", minutes: defectLoss },
    ];
    const totalLossMinutes = lossesRaw.reduce((a, l) => a + l.minutes, 0);
    const safeTotal = totalLossMinutes || 1;
    let cum = 0;
    const losses = [...lossesRaw]
      .sort((a, b) => b.minutes - a.minutes)
      .map((l) => {
        cum += l.minutes;
        return {
          ...l,
          label: SIX_BIG_LOSSES_INFO[l.id].label,
          group: SIX_BIG_LOSSES_INFO[l.id].group,
          pct: (l.minutes / safeTotal) * 100,
          cumPct: (cum / safeTotal) * 100,
        };
      });

    return {
      availability: (availability * 100).toFixed(1),
      performance: (performance * 100).toFixed(1),
      quality: (quality * 100).toFixed(1),
      oee: (oeeVal * 100).toFixed(1),
      classification,
      classColor,
      good,
      losses,
      topLoss: totalLossMinutes > 0 ? losses[0] : null,
      downtimeExceedsPlanned: majorDowntime > planned,
      rejectExceedsTotal: rs + rp > total,
    };
  }, [plannedTime, downBreakdown, downSetup, minorStopTime, idealCycleTime, totalCount, rejectStartup, rejectProcess]);

  const oeeInsight = useMemo(() => {
    if (!oee.topLoss) return "";
    const g = oee.topLoss.group;
    const advice =
      g === "Availability"
        ? "Fokuskan perbaikan pada preventive maintenance dan percepatan proses setup/changeover (mis. metode SMED) untuk menekan kerugian ini."
        : g === "Performance"
        ? "Telusuri penyebab idling/minor stop di lapangan dan evaluasi apakah kecepatan aktual mesin bisa didekatkan ke ideal cycle time."
        : "Lakukan root cause analysis pada penyebab cacat/reject dan perkuat quality control terutama di tahap awal produksi (startup).";
    return `Kerugian terbesar saat ini adalah "${oee.topLoss.label}" — menyumbang ${oee.topLoss.pct.toFixed(1)}% dari total kerugian (kategori ${g}). ${advice}`;
  }, [oee]);

  // --- Perbandingan OEE Antar Mesin / Shift ---
  const [machineComparisons, setMachineComparisons] = usePersistentState("lean.machineComparisons", []);
  const [machineNameDraft, setMachineNameDraft] = useState("");
  const addMachineComparison = () => {
    const name = machineNameDraft.trim() || `Mesin/Shift ${machineComparisons.length + 1}`;
    setMachineComparisons([
      ...machineComparisons,
      {
        id: `${Date.now()}`,
        name,
        availability: Number(oee.availability),
        performance: Number(oee.performance),
        quality: Number(oee.quality),
        oee: Number(oee.oee),
      },
    ]);
    setMachineNameDraft("");
  };
  const removeMachineComparison = (id) => setMachineComparisons(machineComparisons.filter((m) => m.id !== id));
  const worstMachine = useMemo(() => {
    if (machineComparisons.length === 0) return null;
    return [...machineComparisons].sort((a, b) => a.oee - b.oee)[0];
  }, [machineComparisons]);

  // --- DPMO & Sigma state (cacat dipecah per kategori untuk analisis Pareto) ---
  const [totalUnits, setTotalUnits] = usePersistentState("lean.totalUnits", 1000);
  const [opportunities, setOpportunities] = usePersistentState("lean.opportunities", 5);
  const [defectCategories, setDefectCategories] = usePersistentState(
    "lean.defectCategories",
    DEFAULT_DEFECT_CATEGORIES
  );

  const addDefectCategory = () =>
    setDefectCategories([...defectCategories, { label: `Kategori ${defectCategories.length + 1}`, count: 0 }]);
  const updateDefectCategory = (i, field, val) => {
    const next = [...defectCategories];
    next[i] = { ...next[i], [field]: field === "count" ? Math.max(0, Number(val) || 0) : val };
    setDefectCategories(next);
  };
  const removeDefectCategory = (i) => setDefectCategories(defectCategories.filter((_, idx) => idx !== i));

  const dpmoResult = useMemo(() => {
    const units = Number(totalUnits) || 0;
    const opp = Number(opportunities) || 1;
    const defects = defectCategories.reduce((a, c) => a + (Number(c.count) || 0), 0);
    const totalOpp = units * opp;
    const dpmo = totalOpp > 0 ? (defects / totalOpp) * 1000000 : 0;
    const yieldPct = totalOpp > 0 ? Math.max(0, (1 - defects / totalOpp) * 100) : 100;

    let sigma;
    if (dpmo <= 0) sigma = 6;
    else if (dpmo >= 1000000) sigma = 0;
    else sigma = 0.8406 + Math.sqrt(29.37 - 2.221 * Math.log(dpmo));

    if (!isFinite(sigma) || isNaN(sigma)) sigma = 0;
    sigma = Math.max(0, Math.min(6, sigma));
    // Sigma dari DPMO observasi lapangan merepresentasikan performa long-term (Zlt).
    // Konvensi Six Sigma menambahkan pergeseran proses 1.5σ untuk memperkirakan
    // potensi short-term (Zst) seandainya proses berjalan tanpa drift jangka panjang.
    const sigmaShortTerm = Math.max(0, Math.min(6, sigma + 1.5));

    const safeDefects = defects || 1;
    let cum = 0;
    const pareto = defectCategories
      .map((c) => ({ label: c.label, count: Number(c.count) || 0 }))
      .sort((a, b) => b.count - a.count)
      .map((c) => {
        cum += c.count;
        return { ...c, pct: (c.count / safeDefects) * 100, cumPct: (cum / safeDefects) * 100 };
      });

    return {
      dpmo: Math.round(dpmo),
      yieldPct: yieldPct.toFixed(2),
      sigma: sigma.toFixed(2),
      sigmaShortTerm: sigmaShortTerm.toFixed(2),
      totalDefects: defects,
      pareto,
      topDefect: defects > 0 ? pareto[0] : null,
    };
  }, [totalUnits, opportunities, defectCategories]);

  const dpmoInsight = useMemo(() => {
    if (!dpmoResult.topDefect) return "";
    return `Jenis cacat paling dominan adalah "${dpmoResult.topDefect.label}" — ${dpmoResult.topDefect.pct.toFixed(
      1
    )}% dari total cacat. Prioritaskan root cause analysis (mis. fishbone diagram atau 5-Why) pada kategori ini sebelum kategori lainnya.`;
  }, [dpmoResult]);

  // --- Process Capability (Cp/Cpk) state — untuk data pengukuran kontinu (mis. dimensi, berat) ---
  const [uslInput, setUslInput] = usePersistentState("lean.usl", 10.5);
  const [lslInput, setLslInput] = usePersistentState("lean.lsl", 9.5);
  const [processMean, setProcessMean] = usePersistentState("lean.processMean", 10.05);
  const [processStdDev, setProcessStdDev] = usePersistentState("lean.processStdDev", 0.15);

  const capability = useMemo(() => {
    const usl = Number(uslInput) || 0;
    const lsl = Number(lslInput) || 0;
    const mean = Number(processMean) || 0;
    const sd = Number(processStdDev) || 0;

    const invalidSpec = usl <= lsl;
    if (sd <= 0 || invalidSpec) {
      return { cp: null, cpk: null, cpu: null, cpl: null, classification: "—", classColor: "#9A9AA0", invalidSpec, sdInvalid: sd <= 0 };
    }

    const cp = (usl - lsl) / (6 * sd);
    const cpu = (usl - mean) / (3 * sd);
    const cpl = (mean - lsl) / (3 * sd);
    const cpk = Math.min(cpu, cpl);

    let classification = "Tidak Mampu (Not Capable)";
    let classColor = "#E2685A";
    if (cpk >= 1.33) {
      classification = "Mampu (Capable)";
      classColor = "#4FAE7A";
    } else if (cpk >= 1.0) {
      classification = "Marginal — Perlu Pengawasan Ketat";
      classColor = "#E2A63B";
    }

    return {
      cp: cp.toFixed(2),
      cpk: cpk.toFixed(2),
      cpu: cpu.toFixed(2),
      cpl: cpl.toFixed(2),
      classification,
      classColor,
      invalidSpec: false,
      sdInvalid: false,
      offCenter: cpk < cp - 0.05,
    };
  }, [uslInput, lslInput, processMean, processStdDev]);

  // --- Waste mapping state (Severity × Frekuensi = RPN, mirip pendekatan FMEA) ---
  const [severities, setSeverities] = usePersistentState("lean.severities", DEFAULT_SEVERITIES);
  const [frequencies, setFrequencies] = usePersistentState("lean.frequencies", DEFAULT_FREQUENCIES);

  const updateSeverity = (id, val) =>
    setSeverities({ ...severities, [id]: Math.min(5, Math.max(1, Number(val) || 1)) });
  const updateFrequency = (id, val) =>
    setFrequencies({ ...frequencies, [id]: Math.min(5, Math.max(1, Number(val) || 1)) });

  const wasteRanking = useMemo(() => {
    const ranked = WASTE_TYPES.map((w) => {
      const severity = severities[w.id] || 1;
      const frequency = frequencies[w.id] || 1;
      return { ...w, severity, frequency, rpn: severity * frequency };
    }).sort((a, b) => b.rpn - a.rpn);
    const total = ranked.reduce((a, w) => a + w.rpn, 0) || 1;
    let cum = 0;
    return ranked.map((w) => {
      cum += w.rpn;
      return { ...w, pct: (w.rpn / total) * 100, cumPct: (cum / total) * 100 };
    });
  }, [severities, frequencies]);

  const totalWasteScore = wasteRanking.reduce((a, w) => a + w.severity, 0);
  const maxWasteScore = WASTE_TYPES.length * 5;
  const maxRpn = 25;

  const wasteInsight = useMemo(() => {
    const top = wasteRanking[0];
    if (!top || top.rpn <= 1) return "";
    return `Prioritas waste tertinggi (Severity × Frekuensi) adalah "${top.label}" dengan RPN ${top.rpn}/${maxRpn} (Severity ${top.severity}, Frekuensi ${top.frequency}). ${top.desc}. Lihat tab Value Stream Mapping untuk memetakan di titik proses mana waste ini paling banyak terjadi.`;
  }, [wasteRanking]);

  // --- Value Stream Mapping (VSM) state, dilengkapi Takt Time ---
  const [secondsPerDay, setSecondsPerDay] = usePersistentState("lean.vsmSecondsPerDay", 28800);
  const [customerDemand, setCustomerDemand] = usePersistentState("lean.customerDemand", 400);
  const [vsmSteps, setVsmSteps] = usePersistentState("lean.vsmSteps", DEFAULT_VSM_STEPS);

  const addVsmStep = () =>
    setVsmSteps([...vsmSteps, { name: `Proses ${vsmSteps.length + 1}`, cycleTime: 30, waitTime: 0.5 }]);
  const updateVsmStep = (i, field, val) => {
    const next = [...vsmSteps];
    next[i] = { ...next[i], [field]: field === "name" ? val : Math.max(0, Number(val) || 0) };
    setVsmSteps(next);
  };
  const removeVsmStep = (i) => setVsmSteps(vsmSteps.filter((_, idx) => idx !== i));

  const vsmResult = useMemo(() => {
    const spd = Number(secondsPerDay) || 1;
    const demand = Number(customerDemand) || 0;
    const taktTimeSeconds = demand > 0 ? spd / demand : 0;

    const chartData = vsmSteps.map((s, i) => {
      const cycleTime = Number(s.cycleTime) || 0;
      const waitTime = Number(s.waitTime) || 0;
      return {
        name: s.name || `Proses ${i + 1}`,
        cycleTime,
        waitDays: waitTime,
        cycleDaysEquiv: cycleTime / spd,
        isBottleneck: taktTimeSeconds > 0 && cycleTime > taktTimeSeconds,
      };
    });
    const totalVaSeconds = chartData.reduce((a, s) => a + s.cycleTime, 0);
    const totalWaitDays = chartData.reduce((a, s) => a + s.waitDays, 0);
    const totalVaDaysEquiv = totalVaSeconds / spd;
    const totalLeadTimeDays = totalWaitDays + totalVaDaysEquiv;
    const pce = totalLeadTimeDays > 0 ? (totalVaDaysEquiv / totalLeadTimeDays) * 100 : 0;

    let pceClass = "Sangat Boros (Typical World Class Manufacturing: 25%+)";
    let pceColor = "#E2685A";
    if (pce >= 25) {
      pceClass = "Baik — mendekati/melampaui acuan lean manufacturing (~25%)";
      pceColor = "#4FAE7A";
    } else if (pce >= 10) {
      pceClass = "Sedang — masih ada banyak waktu non-value-added untuk dipangkas";
      pceColor = "#E2A63B";
    }

    const bottleneckSteps = chartData.filter((s) => s.isBottleneck);

    return {
      chartData,
      totalVaSeconds,
      totalWaitDays,
      totalVaDaysEquiv,
      totalLeadTimeDays,
      pce,
      pceClass,
      pceColor,
      taktTimeSeconds,
      bottleneckSteps,
    };
  }, [vsmSteps, secondsPerDay, customerDemand]);

  const vsmInsight = useMemo(() => {
    if (vsmResult.chartData.length === 0) return "";
    const biggestWait = [...vsmResult.chartData].sort((a, b) => b.waitDays - a.waitDays)[0];
    if (!biggestWait || biggestWait.waitDays === 0) return "";
    return `Waktu tunggu (inventory/WIP) terbesar terjadi sebelum proses "${biggestWait.name}" (${biggestWait.waitDays} hari). Karena Process Cycle Efficiency Anda saat ini ${vsmResult.pce.toFixed(
      1
    )}%, penurunan buffer di titik ini kemungkinan besar memberi dampak terbesar terhadap pemendekan total lead time.`;
  }, [vsmResult]);

  const taktInsight = useMemo(() => {
    if (vsmResult.taktTimeSeconds <= 0) return "";
    if (vsmResult.bottleneckSteps.length === 0) {
      return `Takt Time saat ini ${vsmResult.taktTimeSeconds.toFixed(
        1
      )} detik/unit — seluruh proses masih lebih cepat dari permintaan pelanggan, artinya kapasitas produksi belum menjadi kendala untuk memenuhi demand.`;
    }
    const names = vsmResult.bottleneckSteps.map((s) => s.name).join(", ");
    return `Proses "${names}" memiliki Cycle Time di atas Takt Time (${vsmResult.taktTimeSeconds.toFixed(
      1
    )} detik/unit) — inilah bottleneck utama yang membuat lini tidak bisa mengejar kecepatan permintaan pelanggan. Prioritaskan perbaikan di sini sebelum proses lain.`;
  }, [vsmResult]);

  // --- Riwayat & Tren (snapshot periodik) ---
  const [history, setHistory] = usePersistentState("lean.history", []);
  const [historyLabelDraft, setHistoryLabelDraft] = useState("");

  // --- Root Cause (5-Why) & Tindak Lanjut (PDCA) ---
  const [fiveWhy, setFiveWhy] = usePersistentState("lean.fiveWhy", DEFAULT_FIVE_WHY);
  const updateFiveWhyField = (field, val) => setFiveWhy({ ...fiveWhy, [field]: val });
  const updateWhyStep = (idx, val) => {
    const nextWhys = [...fiveWhy.whys];
    nextWhys[idx] = val;
    setFiveWhy({ ...fiveWhy, whys: nextWhys });
  };
  const fillProblemFrom = (text) => setFiveWhy({ ...fiveWhy, problem: text });

  // --- Fishbone (Ishikawa) ---
  const [fishbone, setFishbone] = usePersistentState("lean.fishbone", DEFAULT_FISHBONE);
  const updateFishboneCause = (catKey, idx, val) => {
    const nextList = [...fishbone[catKey]];
    nextList[idx] = val;
    setFishbone({ ...fishbone, [catKey]: nextList });
  };
  const addFishboneCause = (catKey) => setFishbone({ ...fishbone, [catKey]: [...fishbone[catKey], ""] });
  const removeFishboneCause = (catKey, idx) =>
    setFishbone({ ...fishbone, [catKey]: fishbone[catKey].filter((_, i) => i !== idx) });

  // --- 5S Audit ---
  const [fiveS, setFiveS] = usePersistentState("lean.fiveS", DEFAULT_FIVE_S);
  const updateFiveSScore = (catKey, idx, val) => {
    const nextList = [...fiveS[catKey]];
    nextList[idx] = Number(val);
    setFiveS({ ...fiveS, [catKey]: nextList });
  };

  const fiveSResult = useMemo(() => {
    const perCategory = FIVE_S_CATEGORIES.map((cat) => {
      const scores = fiveS[cat.key] || cat.items.map(() => 3);
      const avg = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
      const pct = (avg / 5) * 100;
      return { key: cat.key, label: cat.label, color: cat.color, avg, pct: Number(pct.toFixed(1)) };
    });
    const overallPct = perCategory.reduce((a, c) => a + c.pct, 0) / (perCategory.length || 1);
    let classification = "Kurang — perlu tindakan segera";
    let classColor = "#E2685A";
    if (overallPct >= 90) {
      classification = "Sangat Baik — mendekati World Class 5S";
      classColor = "#4FAE7A";
    } else if (overallPct >= 75) {
      classification = "Baik — konsisten, tinggal disempurnakan";
      classColor = "#8BC48A";
    } else if (overallPct >= 60) {
      classification = "Cukup — masih perlu perbaikan di beberapa area";
      classColor = "#E2A63B";
    }
    const weakest = [...perCategory].sort((a, b) => a.pct - b.pct)[0];
    return { perCategory, overallPct: Number(overallPct.toFixed(1)), classification, classColor, weakest };
  }, [fiveS]);

  const fiveSInsight = useMemo(() => {
    if (!fiveSResult.weakest) return "";
    return `Skor terendah ada di kategori "${fiveSResult.weakest.label}" (${fiveSResult.weakest.pct.toFixed(
      1
    )}%). ${FIVE_S_ADVICE[fiveSResult.weakest.key]}`;
  }, [fiveSResult]);

  // --- Cost of Poor Quality (COPQ) ---
  const [copqItems, setCopqItems] = usePersistentState("lean.copqItems", DEFAULT_COPQ_ITEMS);
  const [copqRevenue, setCopqRevenue] = usePersistentState("lean.copqRevenue", 500000000);

  const updateCopqItem = (catKey, idx, field, val) => {
    const next = [...copqItems[catKey]];
    next[idx] = { ...next[idx], [field]: field === "amount" ? Number(val) || 0 : val };
    setCopqItems({ ...copqItems, [catKey]: next });
  };
  const addCopqItem = (catKey) =>
    setCopqItems({ ...copqItems, [catKey]: [...copqItems[catKey], { label: "Item baru", amount: 0 }] });
  const removeCopqItem = (catKey, idx) =>
    setCopqItems({ ...copqItems, [catKey]: copqItems[catKey].filter((_, i) => i !== idx) });

  const copqResult = useMemo(() => {
    const sums = {};
    let totalQualityCost = 0;
    COPQ_CATEGORIES.forEach((cat) => {
      const sum = (copqItems[cat.key] || []).reduce((a, it) => a + (Number(it.amount) || 0), 0);
      sums[cat.key] = sum;
      totalQualityCost += sum;
    });
    const copq = sums.internalFailure + sums.externalFailure;
    const cogq = sums.prevention + sums.appraisal;
    const revenue = Number(copqRevenue) || 0;
    const copqPctRevenue = revenue > 0 ? (copq / revenue) * 100 : 0;
    const totalPctRevenue = revenue > 0 ? (totalQualityCost / revenue) * 100 : 0;
    const preventionRatio = totalQualityCost > 0 ? (sums.prevention / totalQualityCost) * 100 : 0;
    const failureRatio = totalQualityCost > 0 ? (copq / totalQualityCost) * 100 : 0;

    let classification = "Kritis — biaya kegagalan kualitas sangat membebani";
    let classColor = "#E2685A";
    if (copqPctRevenue <= 2) {
      classification = "Sangat Baik — mendekati praktik World Class (COPQ ≤2% dari revenue)";
      classColor = "#4FAE7A";
    } else if (copqPctRevenue <= 5) {
      classification = "Cukup Baik — masih dalam rentang wajar industri";
      classColor = "#8BC48A";
    } else if (copqPctRevenue <= 10) {
      classification = "Perlu Perhatian — ada peluang besar untuk penghematan";
      classColor = "#E2A63B";
    }

    const chartData = COPQ_CATEGORIES.map((cat) => ({
      label: cat.label,
      amount: sums[cat.key],
      color: cat.color,
      group: cat.group,
    }));

    return {
      sums,
      totalQualityCost,
      copq,
      cogq,
      copqPctRevenue,
      totalPctRevenue,
      preventionRatio,
      failureRatio,
      classification,
      classColor,
      chartData,
    };
  }, [copqItems, copqRevenue]);

  const copqInsight = useMemo(() => {
    if (copqResult.totalQualityCost === 0) return "";
    if (copqResult.failureRatio > 50 && copqResult.preventionRatio < 15) {
      return `Biaya kegagalan (internal + eksternal) menyerap ${copqResult.failureRatio.toFixed(
        1
      )}% dari total biaya kualitas, sementara Prevention Cost hanya ${copqResult.preventionRatio.toFixed(
        1
      )}%. Berdasarkan aturan praktis 1:10:100 (biaya mencegah jauh lebih murah daripada memperbaiki), menambah investasi di Prevention Cost berpotensi memangkas biaya kegagalan secara signifikan.`;
    }
    if (copqResult.sums.externalFailure > copqResult.sums.internalFailure) {
      return `External Failure Cost (Rp ${copqResult.sums.externalFailure.toLocaleString(
        "id-ID"
      )}) lebih besar dari Internal Failure Cost — artinya cacat lebih banyak lolos sampai ke tangan pelanggan. Perkuat inspeksi/appraisal sebelum produk keluar pabrik untuk menangkap cacat lebih awal (lebih murah ditangani secara internal).`;
    }
    return `Struktur biaya kualitas saat ini didominasi oleh Internal Failure Cost — cacat sebagian besar masih tertangkap sebelum sampai ke pelanggan. Fokuskan perbaikan pada akar penyebab cacat di proses produksi untuk menekan biaya scrap/rework.`;
  }, [copqResult]);

  const [actions, setActions] = usePersistentState("lean.actions", DEFAULT_ACTIONS);
  const addAction = () =>
    setActions([...actions, { description: "", pic: "", targetDate: "", status: "Belum Mulai" }]);
  const updateAction = (i, field, val) => {
    const next = [...actions];
    next[i] = { ...next[i], [field]: val };
    setActions(next);
  };
  const removeAction = (i) => setActions(actions.filter((_, idx) => idx !== i));
  const doneActionCount = actions.filter((a) => a.status === "Selesai").length;

  // --- Snapshot riwayat: rekam ringkasan + seluruh data mentah tab OEE/DPMO/Waste/VSM ---
  const buildRawSnapshot = () => ({
    plannedTime,
    downBreakdown,
    downSetup,
    minorStopTime,
    idealCycleTime,
    totalCount,
    rejectStartup,
    rejectProcess,
    totalUnits,
    opportunities,
    defectCategories,
    uslInput,
    lslInput,
    processMean,
    processStdDev,
    severities,
    frequencies,
    secondsPerDay,
    customerDemand,
    vsmSteps,
  });

  const addHistorySnapshot = () => {
    const label = historyLabelDraft.trim() || `Periode ${history.length + 1}`;
    setHistory([
      ...history,
      {
        id: `${Date.now()}`,
        period: label,
        savedAt: new Date().toISOString(),
        oee: Number(oee.oee),
        sigma: Number(dpmoResult.sigma),
        pce: Number(vsmResult.pce.toFixed(1)),
        wasteScore: totalWasteScore,
        raw: buildRawSnapshot(),
      },
    ]);
    setHistoryLabelDraft("");
  };
  const removeHistoryEntry = (id) => setHistory(history.filter((h) => h.id !== id));

  const [restoreConfirmId, setRestoreConfirmId] = useState(null);
  const restoreHistoryEntry = (entry) => {
    const r = entry.raw;
    if (!r) return;
    setPlannedTime(r.plannedTime);
    setDownBreakdown(r.downBreakdown);
    setDownSetup(r.downSetup);
    setMinorStopTime(r.minorStopTime);
    setIdealCycleTime(r.idealCycleTime);
    setTotalCount(r.totalCount);
    setRejectStartup(r.rejectStartup);
    setRejectProcess(r.rejectProcess);
    setTotalUnits(r.totalUnits);
    setOpportunities(r.opportunities);
    setDefectCategories(r.defectCategories);
    setUslInput(r.uslInput);
    setLslInput(r.lslInput);
    setProcessMean(r.processMean);
    setProcessStdDev(r.processStdDev);
    setSeverities(r.severities);
    setFrequencies(r.frequencies);
    setSecondsPerDay(r.secondsPerDay);
    setCustomerDemand(r.customerDemand);
    setVsmSteps(r.vsmSteps);
    setRestoreConfirmId(null);
  };

  useReportSync("lean", {
    oeeValue: oee.oee,
    oeeClass: oee.classification,
    availabilityPct: oee.availability,
    performancePct: oee.performance,
    qualityPct: oee.quality,
    dpmo: dpmoResult.dpmo,
    sigma: dpmoResult.sigma,
    sigmaShortTerm: dpmoResult.sigmaShortTerm,
    topWaste: wasteRanking[0]?.label,
    totalWasteScore,
    maxWasteScore,
    pce: vsmResult.pce.toFixed(1),
    openActions: actions.filter((a) => a.status !== "Selesai").length,
  });

  const resetLeanModule = () => {
    setPlannedTime(480);
    setDownBreakdown(30);
    setDownSetup(15);
    setMinorStopTime(20);
    setIdealCycleTime(0.8);
    setTotalCount(480);
    setRejectStartup(10);
    setRejectProcess(15);
    setTotalUnits(1000);
    setOpportunities(5);
    setDefectCategories(DEFAULT_DEFECT_CATEGORIES);
    setUslInput(10.5);
    setLslInput(9.5);
    setProcessMean(10.05);
    setProcessStdDev(0.15);
    setSeverities(DEFAULT_SEVERITIES);
    setFrequencies(DEFAULT_FREQUENCIES);
    setMachineComparisons([]);
    setSecondsPerDay(28800);
    setCustomerDemand(400);
    setVsmSteps(DEFAULT_VSM_STEPS);
    setHistory([]);
    setFiveWhy(DEFAULT_FIVE_WHY);
    setFishbone(DEFAULT_FISHBONE);
    setFiveS(DEFAULT_FIVE_S);
    setCopqItems(DEFAULT_COPQ_ITEMS);
    setCopqRevenue(500000000);
    setActions(DEFAULT_ACTIONS);
  };

  const TAB_EXPORT_LABELS = {
    oee: "OEE & Six Big Losses",
    dpmo: "DPMO & Sigma Level",
    waste: "Pemetaan 7 Waste",
    vsm: "Value Stream Mapping",
    "5s": "5S Audit",
    copq: "COPQ",
    riwayat: "Tren Historis",
    rca: "Root Cause & Tindak Lanjut",
  };

  const exportTabCSV = () => {
    const rows = [];
    let filename = `lean-${tab}.csv`;
    switch (tab) {
      case "oee": {
        rows.push(toCSVRow(["Ringkasan OEE"]));
        rows.push(toCSVRow(["Availability (%)", oee.availability]));
        rows.push(toCSVRow(["Performance (%)", oee.performance]));
        rows.push(toCSVRow(["Quality (%)", oee.quality]));
        rows.push(toCSVRow(["OEE (%)", oee.oee]));
        rows.push(toCSVRow(["Klasifikasi", oee.classification]));
        rows.push(toCSVRow([]));
        rows.push(toCSVRow(["Rincian Six Big Losses"]));
        rows.push(toCSVRow(["Kategori", "Jenis Kerugian", "Menit", "Kumulatif %"]));
        oee.losses.forEach((l) => rows.push(toCSVRow([l.group, l.label, l.minutes, l.cumPct])));
        if (machineComparisons.length > 0) {
          rows.push(toCSVRow([]));
          rows.push(toCSVRow(["Perbandingan Mesin/Shift"]));
          rows.push(toCSVRow(["Nama", "Availability (%)", "Performance (%)", "Quality (%)", "OEE (%)"]));
          machineComparisons.forEach((m) => rows.push(toCSVRow([m.name, m.availability, m.performance, m.quality, m.oee])));
        }
        filename = "lean-oee.csv";
        break;
      }
      case "dpmo": {
        rows.push(toCSVRow(["Kategori Cacat", "Jumlah", "% dari Total"]));
        defectCategories.forEach((d) => {
          const pct = dpmoResult.totalDefects > 0 ? ((d.count / dpmoResult.totalDefects) * 100).toFixed(1) : 0;
          rows.push(toCSVRow([d.label, d.count, pct]));
        });
        rows.push(toCSVRow([]));
        rows.push(toCSVRow(["DPMO", dpmoResult.dpmo]));
        rows.push(toCSVRow(["Sigma Level (Long-Term)", dpmoResult.sigma]));
        rows.push(toCSVRow(["Sigma Level (Short-Term, +1.5σ shift)", dpmoResult.sigmaShortTerm]));
        rows.push(toCSVRow(["Cp", dpmoResult.cp]));
        rows.push(toCSVRow(["Cpk", dpmoResult.cpk]));
        filename = "lean-dpmo-sigma.csv";
        break;
      }
      case "waste": {
        rows.push(toCSVRow(["Jenis Waste", "Severity", "Frekuensi", "RPN"]));
        wasteRanking.forEach((w) => rows.push(toCSVRow([w.label, w.severity, w.frequency, w.rpn])));
        filename = "lean-waste-7.csv";
        break;
      }
      case "vsm": {
        rows.push(toCSVRow(["Proses", "Cycle Time (detik)", "Wait Time (hari)", "Di atas Takt Time?"]));
        vsmResult.chartData.forEach((s) =>
          rows.push(toCSVRow([s.name, s.cycleTime, s.waitDays, s.isBottleneck ? "Ya" : "Tidak"]))
        );
        rows.push(toCSVRow([]));
        rows.push(toCSVRow(["Total Lead Time (hari)", vsmResult.totalLeadTimeDays.toFixed(2)]));
        rows.push(toCSVRow(["PCE (%)", vsmResult.pce.toFixed(1)]));
        rows.push(toCSVRow(["Takt Time (detik/unit)", vsmResult.taktTimeSeconds.toFixed(1)]));
        filename = "lean-vsm.csv";
        break;
      }
      case "5s": {
        rows.push(toCSVRow(["Kategori", "Pernyataan", "Skor (1-5)"]));
        FIVE_S_CATEGORIES.forEach((cat) => {
          cat.items.forEach((item, i) => rows.push(toCSVRow([cat.label, item, fiveS[cat.key][i]])));
        });
        rows.push(toCSVRow([]));
        rows.push(toCSVRow(["Skor Keseluruhan (%)", fiveSResult.overallPct]));
        rows.push(toCSVRow(["Klasifikasi", fiveSResult.classification]));
        filename = "lean-5s-audit.csv";
        break;
      }
      case "copq": {
        rows.push(toCSVRow(["Kategori", "Item", "Jumlah (Rp)"]));
        COPQ_CATEGORIES.forEach((cat) => {
          copqItems[cat.key].forEach((it) => rows.push(toCSVRow([cat.label, it.label, it.amount])));
        });
        rows.push(toCSVRow([]));
        rows.push(toCSVRow(["Total Biaya Kualitas (Rp)", copqResult.totalQualityCost]));
        rows.push(toCSVRow(["COPQ — Internal+External (Rp)", copqResult.copq]));
        rows.push(toCSVRow(["COPQ (% dari Revenue)", copqResult.copqPctRevenue.toFixed(2)]));
        filename = "lean-copq.csv";
        break;
      }
      case "riwayat": {
        rows.push(toCSVRow(["Periode", "OEE (%)", "Sigma", "PCE (%)", "Skor Waste"]));
        history.forEach((h) => rows.push(toCSVRow([h.period, h.oee, h.sigma, h.pce, h.wasteScore])));
        filename = "lean-tren-historis.csv";
        break;
      }
      case "rca": {
        rows.push(toCSVRow(["Pernyataan Masalah", fiveWhy.problem]));
        fiveWhy.whys.forEach((w, i) => rows.push(toCSVRow([`Why ${i + 1}`, w])));
        rows.push(toCSVRow(["Akar Masalah", fiveWhy.rootCause]));
        rows.push(toCSVRow([]));
        rows.push(toCSVRow(["Fishbone — Kategori", "Penyebab"]));
        FISHBONE_CATEGORIES.forEach((cat) => {
          fishbone[cat.key]
            .filter((c) => c.trim() !== "")
            .forEach((c) => rows.push(toCSVRow([cat.label, c])));
        });
        rows.push(toCSVRow([]));
        rows.push(toCSVRow(["Rencana Tindak Lanjut (PDCA)"]));
        rows.push(toCSVRow(["Deskripsi Aksi", "PIC", "Target", "Status"]));
        actions.forEach((a) => rows.push(toCSVRow([a.description, a.pic, a.targetDate, a.status])));
        filename = "lean-rca.csv";
        break;
      }
      default:
        break;
    }
    downloadCSV(filename, rows.join("\n"));
  };

  const tabs = [
    { id: "oee", label: "OEE" },
    { id: "dpmo", label: "DPMO & Sigma Level" },
    { id: "waste", label: "Pemetaan 7 Waste" },
    { id: "vsm", label: "Value Stream Mapping" },
    { id: "5s", label: "5S Audit" },
    { id: "copq", label: "COPQ" },
    { id: "riwayat", label: "Tren Historis" },
    { id: "rca", label: "Root Cause & Tindak Lanjut" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ModuleTabs tabs={tabs} tab={tab} setTab={setTab} accent={accent} />
        <div className="flex items-center gap-2">
          <button
            onClick={exportTabCSV}
            title={`Ekspor data tab "${TAB_EXPORT_LABELS[tab] ?? tab}" sebagai CSV`}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium"
            style={{ backgroundColor: `${accent}18`, color: accent }}
          >
            <Download size={12} />
            Ekspor Tab Ini (CSV)
          </button>
          <button
            onClick={resetLeanModule}
            title="Kembalikan semua input di modul Lean & Six Sigma ke nilai bawaan"
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium"
            style={{ backgroundColor: "rgba(226,104,90,0.12)", color: "#C0453A" }}
          >
            <RotateCcw size={12} />
            Reset Modul Ini
          </button>
        </div>
      </div>

      {tab === "oee" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <SectionCard title="Parameter Mesin & Produksi" subtitle="Overall Equipment Effectiveness" accent={accent}>
            <div className="space-y-4">
              <div>
                <FieldLabel hint="Total waktu mesin dijadwalkan beroperasi">Planned Production Time</FieldLabel>
                <NumberInput value={plannedTime} onChange={setPlannedTime} suffix="menit" />
              </div>
              <p className="px-0.5 text-[10px] font-medium uppercase tracking-wide" style={{ color: "#B5B5B9" }}>
                Rincian Availability Loss
              </p>
              <div>
                <FieldLabel hint="Waktu berhenti akibat mesin rusak/breakdown tak terduga">
                  Downtime — Kerusakan Mesin
                </FieldLabel>
                <NumberInput value={downBreakdown} onChange={setDownBreakdown} suffix="menit" />
              </div>
              <div>
                <FieldLabel hint="Waktu berhenti untuk pergantian produk, setup, atau penyesuaian mesin">
                  Downtime — Setup & Penyesuaian
                </FieldLabel>
                <NumberInput value={downSetup} onChange={setDownSetup} suffix="menit" />
              </div>
              <p className="px-0.5 text-[10px] font-medium uppercase tracking-wide" style={{ color: "#B5B5B9" }}>
                Rincian Performance Loss
              </p>
              <div>
                <FieldLabel hint="Waktu berhenti sebentar (macet, menunggu material) yang tidak dicatat sebagai breakdown">
                  Idling & Minor Stops
                </FieldLabel>
                <NumberInput value={minorStopTime} onChange={setMinorStopTime} suffix="menit" />
              </div>
              <div>
                <FieldLabel hint="Waktu siklus ideal per unit sesuai spesifikasi">Ideal Cycle Time</FieldLabel>
                <NumberInput value={idealCycleTime} onChange={setIdealCycleTime} suffix="menit/unit" step={0.1} />
              </div>
              <p className="px-0.5 text-[10px] font-medium uppercase tracking-wide" style={{ color: "#B5B5B9" }}>
                Rincian Quality Loss
              </p>
              <div>
                <FieldLabel hint="Total unit yang diproduksi pada periode ini">Total Output</FieldLabel>
                <NumberInput value={totalCount} onChange={setTotalCount} suffix="unit" />
              </div>
              <div>
                <FieldLabel hint="Unit cacat yang terjadi di awal proses produksi, misal saat warm-up mesin">
                  Reject — Startup / Yield Loss
                </FieldLabel>
                <NumberInput value={rejectStartup} onChange={setRejectStartup} suffix="unit" />
              </div>
              <div>
                <FieldLabel hint="Unit cacat yang terjadi selama proses produksi berjalan normal">
                  Reject — Proses / Rework
                </FieldLabel>
                <NumberInput value={rejectProcess} onChange={setRejectProcess} suffix="unit" />
              </div>
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <WarningBanner
              text={
                oee.downtimeExceedsPlanned
                  ? "Total downtime (Kerusakan Mesin + Setup) melebihi Planned Production Time — Availability otomatis dibatasi ke 0%. Periksa kembali input Anda."
                  : ""
              }
            />
            <WarningBanner
              text={
                oee.rejectExceedsTotal
                  ? "Total reject (Startup + Proses) melebihi Total Output — Good Output otomatis dibatasi ke 0%. Periksa kembali input Anda."
                  : ""
              }
            />

            <SectionCard title="Hasil Perhitungan OEE" accent={accent}>
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ResultStat accent={accent} label="Availability" value={oee.availability} unit="%" />
                <ResultStat accent={accent} label="Performance" value={oee.performance} unit="%" />
                <ResultStat accent={accent} label="Quality" value={oee.quality} unit="%" />
              </div>
              <div
                className="rounded-2xl p-5 text-center"
                style={{ backgroundColor: `${oee.classColor}18` }}
              >
                <p className="mb-1 text-[11px]" style={{ color: "#8A8A8E" }}>
                  Overall Equipment Effectiveness
                </p>
                <p className="text-4xl font-semibold tracking-tight" style={{ color: oee.classColor }}>
                  {oee.oee}%
                </p>
                <p className="mt-1 text-xs font-medium" style={{ color: oee.classColor }}>
                  {oee.classification}
                </p>
              </div>
            </SectionCard>
            <p className="px-1 text-xs leading-relaxed" style={{ color: "#8A8A8E" }}>
              OEE = Availability × Performance × Quality. Skor ≥85% tergolong World Class, 60–85% dapat diterima, di bawah itu menandakan ada kerugian signifikan pada salah satu dari tiga faktor.
            </p>

            <SectionCard
              title="Rincian Six Big Losses"
              subtitle="Diurutkan dari kerugian waktu/unit terbesar — warna menandai kategori OEE yang terdampak"
              accent={accent}
            >
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <ComposedChart data={oee.losses} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#8A8A8E" }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#8A8A8E" }} label={{ value: "menit", angle: -90, position: "insideLeft", fontSize: 10, fill: "#8A8A8E" }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#8A8A8E" }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(255,255,255,0.7)",
                        borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                        fontSize: 11,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="left" dataKey="minutes" name="Kerugian (menit)" radius={[4, 4, 0, 0]}>
                      {oee.losses.map((l, i) => (
                        <Cell key={i} fill={GROUP_COLORS[l.group]} />
                      ))}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="cumPct" name="Kumulatif %" stroke="#1D1D1F" strokeWidth={1.5} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {Object.entries(GROUP_COLORS).map(([g, c]) => (
                  <div key={g} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
                    <span className="text-[10px]" style={{ color: "#8A8A8E" }}>
                      {g}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <InsightBox accent={accent} text={oeeInsight} />

            <SectionCard
              title="Perbandingan Antar Mesin / Shift"
              subtitle="Simpan hasil OEE saat ini sebagai satu entri, lalu bandingkan beberapa mesin/shift sekaligus"
              accent={accent}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <input
                  value={machineNameDraft}
                  onChange={(e) => setMachineNameDraft(e.target.value)}
                  placeholder={`Mesin/Shift ${machineComparisons.length + 1}`}
                  className="min-w-[160px] flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                />
                <button
                  onClick={addMachineComparison}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium"
                  style={{ backgroundColor: `${accent}22`, color: accent }}
                >
                  <Plus size={12} /> Simpan OEE Saat Ini
                </button>
              </div>

              {machineComparisons.length > 0 ? (
                <>
                  <div style={{ width: "100%", height: 240 }}>
                    <ResponsiveContainer>
                      <BarChart data={machineComparisons} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#8A8A8E" }} interval={0} angle={-15} textAnchor="end" height={50} />
                        <YAxis tick={{ fontSize: 10, fill: "#8A8A8E" }} domain={[0, 100]} label={{ value: "%", angle: -90, position: "insideLeft", fontSize: 10, fill: "#8A8A8E" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255,255,255,0.92)",
                            border: "1px solid rgba(255,255,255,0.7)",
                            borderRadius: 12,
                            boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                            fontSize: 11,
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="availability" name="Availability (%)" fill={GROUP_COLORS.Availability} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="performance" name="Performance (%)" fill={GROUP_COLORS.Performance} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="quality" name="Quality (%)" fill={GROUP_COLORS.Quality} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="oee" name="OEE (%)" fill={accent} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr style={{ color: "#9A9AA0" }}>
                          <th className="px-2 pb-2 font-medium">Mesin / Shift</th>
                          <th className="px-2 pb-2 font-medium">Availability</th>
                          <th className="px-2 pb-2 font-medium">Performance</th>
                          <th className="px-2 pb-2 font-medium">Quality</th>
                          <th className="px-2 pb-2 font-medium">OEE</th>
                          <th className="px-1 pb-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {machineComparisons.map((m) => (
                          <tr key={m.id} style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                            <td className="px-2 py-1.5 font-medium">
                              {m.name}
                              {worstMachine && worstMachine.id === m.id && machineComparisons.length > 1 && (
                                <span
                                  className="ml-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-semibold"
                                  style={{ backgroundColor: "rgba(226,104,90,0.15)", color: "#C0453A" }}
                                >
                                  Terendah
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-1.5">{m.availability}%</td>
                            <td className="px-2 py-1.5">{m.performance}%</td>
                            <td className="px-2 py-1.5">{m.quality}%</td>
                            <td className="px-2 py-1.5 font-medium">{m.oee}%</td>
                            <td className="px-1">
                              <button onClick={() => removeMachineComparison(m.id)}>
                                <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {worstMachine && machineComparisons.length > 1 && (
                    <InsightBox
                      accent={accent}
                      text={`OEE terendah saat ini ada pada "${worstMachine.name}" (${worstMachine.oee}%) — prioritaskan perbaikan di sini terlebih dulu karena paling membatasi output lini secara keseluruhan.`}
                    />
                  )}
                </>
              ) : (
                <p className="text-xs leading-relaxed" style={{ color: "#8A8A8E" }}>
                  Isi parameter di panel kiri untuk satu mesin/shift, lalu klik "Simpan OEE Saat Ini". Ubah parameter untuk mesin/shift berikutnya dan simpan lagi — semua entri akan dibandingkan di sini.
                </p>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "dpmo" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <SectionCard title="Parameter Kualitas" subtitle="Defects Per Million Opportunities" accent={accent}>
            <div className="space-y-4">
              <div>
                <FieldLabel hint="Total unit yang diperiksa/diuji pada periode ini">Total Unit Diperiksa</FieldLabel>
                <NumberInput value={totalUnits} onChange={setTotalUnits} suffix="unit" />
              </div>
              <div>
                <FieldLabel hint="Jumlah peluang terjadinya cacat per unit">Peluang Cacat per Unit</FieldLabel>
                <NumberInput value={opportunities} onChange={setOpportunities} />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <FieldLabel hint="Pecah total cacat berdasarkan jenisnya agar bisa dianalisis prioritas perbaikannya (Pareto)">
                    Rincian Cacat per Kategori
                  </FieldLabel>
                  <button
                    onClick={addDefectCategory}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                    style={{ backgroundColor: `${accent}22`, color: accent }}
                  >
                    <Plus size={12} /> Tambah
                  </button>
                </div>
                <div className="space-y-1.5">
                  {defectCategories.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={c.label}
                        onChange={(e) => updateDefectCategory(i, "label", e.target.value)}
                        className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                        style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                      />
                      <input
                        type="number"
                        value={c.count}
                        onChange={(e) => updateDefectCategory(i, "count", e.target.value)}
                        className="w-20 rounded-lg px-2 py-1.5 text-xs outline-none"
                        style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                      />
                      <button onClick={() => removeDefectCategory(i)}>
                        <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                      </button>
                    </div>
                  ))}
                  {defectCategories.length === 0 && (
                    <p className="py-2 text-center text-[11px]" style={{ color: "#9A9AA0" }}>
                      Belum ada kategori cacat.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <SectionCard title="Hasil Perhitungan" accent={accent}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ResultStat accent={accent} label="Total Cacat" value={dpmoResult.totalDefects} unit="unit" />
                <ResultStat accent={accent} label="DPMO" value={dpmoResult.dpmo.toLocaleString("id-ID")} />
                <ResultStat accent={accent} label="Yield" value={dpmoResult.yieldPct} unit="%" />
                <ResultStat accent={accent} label="Sigma Long-Term" value={dpmoResult.sigma} unit="σ" highlight />
                <ResultStat accent={accent} label="Sigma Short-Term" value={dpmoResult.sigmaShortTerm} unit="σ" />
              </div>
              <p className="mt-4 text-xs leading-relaxed" style={{ color: "#8A8A8E" }}>
                Sigma Long-Term dihitung dengan pendekatan Bothe: 0,8406 + √(29,37 − 2,221 × ln(DPMO)) — merepresentasikan performa aktual proses apa adanya (termasuk drift/pergeseran dari waktu ke waktu). Sigma Short-Term (Zst = Zlt + 1,5) memakai konvensi "1,5 sigma shift" yang umum dipakai di Six Sigma, memperkirakan potensi proses seandainya tidak ada pergeseran jangka panjang. 6σ setara sekitar 3,4 DPMO.
              </p>
            </SectionCard>

            {dpmoResult.pareto.length > 0 && (
              <SectionCard
                title="Pareto Jenis Cacat"
                subtitle="Diurutkan dari kontribusi terbesar — garis menunjukkan persentase kumulatif"
                accent={accent}
              >
                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <ComposedChart data={dpmoResult.pareto} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#8A8A8E" }} interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#8A8A8E" }} label={{ value: "unit", angle: -90, position: "insideLeft", fontSize: 10, fill: "#8A8A8E" }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#8A8A8E" }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255,255,255,0.92)",
                          border: "1px solid rgba(255,255,255,0.7)",
                          borderRadius: 12,
                          boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                          fontSize: 11,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar yAxisId="left" dataKey="count" name="Jumlah Cacat" fill={accent} radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="cumPct" name="Kumulatif %" stroke="#1D1D1F" strokeWidth={1.5} dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            )}

            <SectionCard
              title="Process Capability (Cp/Cpk)"
              subtitle="Untuk data pengukuran kontinu (dimensi, berat, dsb.) — pelengkap DPMO yang berbasis data cacat diskrit"
              accent={accent}
            >
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <FieldLabel hint="Batas spesifikasi atas yang diizinkan pelanggan/desain">USL</FieldLabel>
                  <NumberInput value={uslInput} onChange={setUslInput} step={0.01} />
                </div>
                <div>
                  <FieldLabel hint="Batas spesifikasi bawah yang diizinkan pelanggan/desain">LSL</FieldLabel>
                  <NumberInput value={lslInput} onChange={setLslInput} step={0.01} />
                </div>
                <div>
                  <FieldLabel hint="Rata-rata aktual hasil pengukuran proses">Mean Proses</FieldLabel>
                  <NumberInput value={processMean} onChange={setProcessMean} step={0.01} />
                </div>
                <div>
                  <FieldLabel hint="Standar deviasi aktual hasil pengukuran proses">Std. Dev Proses</FieldLabel>
                  <NumberInput value={processStdDev} onChange={setProcessStdDev} step={0.01} />
                </div>
              </div>

              <WarningBanner text={capability.invalidSpec ? "USL harus lebih besar dari LSL agar Cp/Cpk dapat dihitung." : ""} />
              <WarningBanner text={capability.sdInvalid ? "Standar deviasi proses harus lebih besar dari 0 agar Cp/Cpk dapat dihitung." : ""} />

              {capability.cp !== null && (
                <>
                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <ResultStat accent={accent} label="Cp (Potensi)" value={capability.cp} />
                    <ResultStat accent={accent} label="Cpk (Aktual)" value={capability.cpk} highlight />
                    <ResultStat accent={accent} label="Cpu (Sisi Atas)" value={capability.cpu} />
                    <ResultStat accent={accent} label="Cpl (Sisi Bawah)" value={capability.cpl} />
                  </div>
                  <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: `${capability.classColor}18` }}>
                    <p className="text-sm font-medium" style={{ color: capability.classColor }}>
                      {capability.classification}
                    </p>
                    {capability.offCenter && (
                      <p className="mt-1 text-[11px]" style={{ color: "#8A8A8E" }}>
                        Cpk jauh lebih rendah dari Cp — proses tergolong tidak center terhadap titik tengah spesifikasi, meskipun variasinya (Cp) sebenarnya cukup baik.
                      </p>
                    )}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed" style={{ color: "#8A8A8E" }}>
                    Cp mengukur potensi proses (variasi vs lebar spesifikasi) tanpa memperhatikan posisi rata-rata. Cpk memperhitungkan posisi rata-rata tersebut — Cpk ≥ 1,33 umumnya dianggap mampu (capable), 1,00–1,33 marginal, di bawah 1,00 tidak mampu.
                  </p>
                </>
              )}
            </SectionCard>

            <InsightBox accent={accent} text={dpmoInsight} />
          </div>
        </div>
      )}

      {tab === "waste" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[420px_1fr]">
          <SectionCard
            title="Penilaian Waste (Severity × Frekuensi)"
            subtitle="Skala 1 (rendah) – 5 (tinggi) untuk tiap dimensi, mirip pendekatan FMEA"
            accent={accent}
          >
            <div className="space-y-3">
              {WASTE_TYPES.map((w) => (
                <div key={w.id} className="rounded-xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.6)" }}>
                  <p className="mb-2 text-xs font-medium">{w.label}</p>
                  <div className="mb-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: "#9A9AA0" }}>
                        Severity (keparahan)
                      </span>
                      <span className="text-[10px] font-medium" style={{ color: accent }}>
                        {severities[w.id] || 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => updateSeverity(w.id, n)}
                          className="flex h-6 flex-1 items-center justify-center rounded-lg text-[11px] font-medium"
                          style={{
                            backgroundColor: (severities[w.id] || 1) >= n ? `${accent}22` : "rgba(0,0,0,0.05)",
                            color: (severities[w.id] || 1) >= n ? accent : "#B5B5B9",
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: "#9A9AA0" }}>
                        Frekuensi kejadian
                      </span>
                      <span className="text-[10px] font-medium" style={{ color: accent }}>
                        {frequencies[w.id] || 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => updateFrequency(w.id, n)}
                          className="flex h-6 flex-1 items-center justify-center rounded-lg text-[11px] font-medium"
                          style={{
                            backgroundColor: (frequencies[w.id] || 1) >= n ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.05)",
                            color: (frequencies[w.id] || 1) >= n ? "#4B4B4F" : "#B5B5B9",
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: "#9A9AA0" }}>
                    {w.desc}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultStat accent={accent} label="Total Skor Severity" value={totalWasteScore} unit={`/ ${maxWasteScore}`} />
              <ResultStat accent={accent} label="Prioritas Utama (RPN)" value={wasteRanking[0]?.label ?? "—"} highlight />
            </div>

            <SectionCard
              title="Pareto Waste (RPN = Severity × Frekuensi)"
              subtitle="Diurutkan dari RPN terbesar — garis menunjukkan persentase kumulatif"
              accent={accent}
            >
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <ComposedChart data={wasteRanking} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#8A8A8E" }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#8A8A8E" }} domain={[0, 25]} label={{ value: "RPN", angle: -90, position: "insideLeft", fontSize: 10, fill: "#8A8A8E" }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#8A8A8E" }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(255,255,255,0.7)",
                        borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                        fontSize: 11,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="left" dataKey="rpn" name="RPN (Severity × Frekuensi)">
                      {wasteRanking.map((w, i) => (
                        <Cell key={i} fill={w.rpn >= 16 ? "#E2685A" : accent} radius={[4, 4, 0, 0]} />
                      ))}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="cumPct" name="Kumulatif %" stroke="#1D1D1F" strokeWidth={1.5} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Peringkat Waste" subtitle="Diurutkan dari RPN paling tinggi" accent={accent}>
              <div className="space-y-4">
                {wasteRanking.map((w) => (
                  <div key={w.id}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="text-xs font-medium">{w.label}</p>
                      <p className="text-xs" style={{ color: "#8A8A8E" }}>
                        RPN {w.rpn} (S{w.severity} × F{w.frequency})
                      </p>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.06)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(w.rpn / maxRpn) * 100}%`,
                          backgroundColor: w.rpn >= 16 ? "#E2685A" : accent,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <InsightBox accent={accent} text={wasteInsight} />
          </div>
        </div>
      )}

      {tab === "vsm" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <SectionCard title="Langkah Proses" subtitle="Urutan dari bahan baku masuk hingga produk jadi" accent={accent}>
            <div className="mb-4 grid grid-cols-1 gap-3">
              <div>
                <FieldLabel hint="Total waktu kerja efektif per hari — dipakai untuk menyamakan satuan Cycle Time (detik) dengan Waktu Tunggu (hari) saat menghitung Lead Time, dan untuk menghitung Takt Time">
                  Waktu Kerja per Hari
                </FieldLabel>
                <NumberInput value={secondsPerDay} onChange={setSecondsPerDay} suffix="detik/hari" />
              </div>
              <div>
                <FieldLabel hint="Rata-rata permintaan pelanggan per hari — dipakai untuk menghitung Takt Time (kecepatan produksi yang dibutuhkan agar memenuhi demand)">
                  Permintaan Pelanggan
                </FieldLabel>
                <NumberInput value={customerDemand} onChange={setCustomerDemand} suffix="unit/hari" />
              </div>
            </div>

            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: "#4B4B4F" }}>
                Urutan Proses
              </p>
              <button
                onClick={addVsmStep}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah Proses
              </button>
            </div>
            <div className="space-y-2.5">
              {vsmSteps.map((s, i) => (
                <div key={i} className="rounded-xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.6)" }}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[10px] font-medium" style={{ color: "#B5B5B9" }}>
                      #{i + 1}
                    </span>
                    <input
                      value={s.name}
                      onChange={(e) => updateVsmStep(i, "name", e.target.value)}
                      className="flex-1 rounded-lg px-2 py-1.5 text-xs font-medium outline-none"
                      style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                    />
                    <button onClick={() => removeVsmStep(i)}>
                      <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <FieldLabel hint="Waktu aktual mengerjakan proses ini per unit — dibandingkan dengan Takt Time untuk mendeteksi bottleneck">
                        Cycle Time (proses ini)
                      </FieldLabel>
                      <NumberInput value={s.cycleTime} onChange={(v) => updateVsmStep(i, "cycleTime", v)} suffix="detik" />
                    </div>
                    <div>
                      <FieldLabel hint="Waktu unit menunggu/mengendap sebagai inventori/WIP sebelum memasuki proses ini">
                        Tunggu Sebelum Proses Ini
                      </FieldLabel>
                      <NumberInput value={s.waitTime} onChange={(v) => updateVsmStep(i, "waitTime", v)} suffix="hari" step={0.1} />
                    </div>
                  </div>
                </div>
              ))}
              {vsmSteps.length === 0 && (
                <p className="py-4 text-center text-[11px]" style={{ color: "#9A9AA0" }}>
                  Belum ada proses ditambahkan.
                </p>
              )}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ResultStat accent={accent} label="Takt Time" value={vsmResult.taktTimeSeconds.toFixed(1)} unit="detik/unit" />
              <ResultStat accent={accent} label="Total Value-Added Time" value={vsmResult.totalVaDaysEquiv.toFixed(2)} unit="hari-ekuiv." />
              <ResultStat accent={accent} label="Total Lead Time" value={vsmResult.totalLeadTimeDays.toFixed(2)} unit="hari" />
              <ResultStat accent={accent} label="Process Cycle Efficiency" value={vsmResult.pce.toFixed(1)} unit="%" highlight />
            </div>

            <SectionCard
              title="Cycle Time vs Takt Time per Proses"
              subtitle="Garis putus-putus menandai Takt Time — bar merah berarti proses tersebut lebih lambat dari permintaan pelanggan (bottleneck)"
              accent={accent}
            >
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={vsmResult.chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#8A8A8E" }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10, fill: "#8A8A8E" }} label={{ value: "detik", angle: -90, position: "insideLeft", fontSize: 10, fill: "#8A8A8E" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(255,255,255,0.7)",
                        borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                        fontSize: 11,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {vsmResult.taktTimeSeconds > 0 && (
                      <ReferenceLine
                        y={vsmResult.taktTimeSeconds}
                        stroke="#1D1D1F"
                        strokeDasharray="5 4"
                        label={{ value: "Takt Time", position: "insideTopRight", fontSize: 10, fill: "#1D1D1F" }}
                      />
                    )}
                    <Bar dataKey="cycleTime" name="Cycle Time" radius={[4, 4, 0, 0]}>
                      {vsmResult.chartData.map((s, i) => (
                        <Cell key={i} fill={s.isBottleneck ? "#E2685A" : accent} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <InsightBox accent={accent} text={taktInsight} />

            <SectionCard
              title="Ladder Value Stream (per Proses)"
              subtitle="Bar abu-abu = waktu tunggu/inventori, bar berwarna = waktu proses (dikonversi ke hari-ekuivalen)"
              accent={accent}
            >
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={vsmResult.chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#8A8A8E" }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10, fill: "#8A8A8E" }} label={{ value: "hari", angle: -90, position: "insideLeft", fontSize: 10, fill: "#8A8A8E" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(255,255,255,0.7)",
                        borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                        fontSize: 11,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="waitDays" stackId="ladder" name="Waktu Tunggu (hari)" fill="rgba(0,0,0,0.15)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="cycleDaysEquiv" stackId="ladder" name="Waktu Proses (hari-ekuiv.)" fill={accent} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: `${vsmResult.pceColor}18` }}>
              <p className="text-sm font-medium" style={{ color: vsmResult.pceColor }}>
                {vsmResult.pceClass}
              </p>
            </div>
            <p className="px-1 text-xs leading-relaxed" style={{ color: "#8A8A8E" }}>
              Process Cycle Efficiency (PCE) = Total Value-Added Time ÷ Total Lead Time. PCE mengukur seberapa besar porsi lead time yang benar-benar menambah nilai bagi pelanggan — sisanya adalah waktu tunggu/inventori yang berpotensi dipangkas. Takt Time = Waktu Kerja per Hari ÷ Permintaan Pelanggan — kecepatan produksi yang dibutuhkan agar tepat memenuhi demand, tanpa kelebihan maupun kekurangan.
            </p>

            <InsightBox accent={accent} text={vsmInsight} />
          </div>
        </div>
      )}

      {tab === "5s" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-4">
            <SectionCard
              title="Checklist Audit 5S"
              subtitle="Nilai tiap pernyataan dari 1 (sangat kurang) sampai 5 (sangat baik)"
              accent={accent}
            >
              <div className="space-y-5">
                {FIVE_S_CATEGORIES.map((cat) => (
                  <div key={cat.key}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: cat.color }}>
                      {cat.label}
                    </p>
                    <div className="space-y-2">
                      {cat.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-3 rounded-xl p-2.5"
                          style={{ backgroundColor: `${cat.color}0D` }}
                        >
                          <p className="text-xs leading-relaxed" style={{ color: "#4B4B4F" }}>
                            {item}
                          </p>
                          <select
                            value={fiveS[cat.key][i]}
                            onChange={(e) => updateFiveSScore(cat.key, i, e.target.value)}
                            className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.85)", color: "#1D1D1F" }}
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="flex flex-col gap-4">
            <SectionCard title="Skor 5S per Kategori" accent={accent}>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <RadarChart data={fiveSResult.perCategory} outerRadius="75%">
                    <PolarGrid stroke="rgba(0,0,0,0.08)" />
                    <PolarAngleAxis dataKey="label" tick={{ fontSize: 9, fill: "#8A8A8E" }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "#B5B5B9" }} />
                    <Radar name="Skor (%)" dataKey="pct" stroke={accent} fill={accent} fillOpacity={0.35} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(255,255,255,0.7)",
                        borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                        fontSize: 11,
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: `${fiveSResult.classColor}18` }}>
              <p className="mb-1 text-[11px]" style={{ color: "#8A8A8E" }}>
                Skor 5S Keseluruhan
              </p>
              <p className="text-4xl font-semibold tracking-tight" style={{ color: fiveSResult.classColor }}>
                {fiveSResult.overallPct}%
              </p>
              <p className="mt-1 text-xs font-medium" style={{ color: fiveSResult.classColor }}>
                {fiveSResult.classification}
              </p>
            </div>

            <SectionCard title="Rincian per Kategori" accent={accent}>
              <div className="space-y-2">
                {fiveSResult.perCategory.map((c) => (
                  <div key={c.key} className="flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: "#4B4B4F" }}>
                      {c.label}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: c.color }}>
                      {c.pct.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <InsightBox accent={accent} text={fiveSInsight} />
          </div>
        </div>
      )}

      {tab === "copq" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[420px_1fr]">
          <div className="flex flex-col gap-4">
            <SectionCard title="Parameter Umum" accent={accent}>
              <div>
                <FieldLabel hint="Total penjualan/revenue periode ini, dipakai untuk menghitung COPQ sebagai persentase dari revenue">
                  Total Revenue Periode Ini
                </FieldLabel>
                <NumberInput value={copqRevenue} onChange={setCopqRevenue} suffix="Rp" />
              </div>
            </SectionCard>

            {COPQ_CATEGORIES.map((cat) => (
              <SectionCard key={cat.key} title={cat.label} subtitle={cat.group} accent={accent}>
                <div className="space-y-2">
                  {copqItems[cat.key].map((it, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <input
                        value={it.label}
                        onChange={(e) => updateCopqItem(cat.key, i, "label", e.target.value)}
                        className="w-1/2 rounded-lg px-2 py-1.5 text-[11px] outline-none"
                        style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                      />
                      <input
                        type="number"
                        value={it.amount}
                        onChange={(e) => updateCopqItem(cat.key, i, "amount", e.target.value)}
                        className="flex-1 rounded-lg px-2 py-1.5 text-[11px] outline-none"
                        style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                      />
                      <button onClick={() => removeCopqItem(cat.key, i)}>
                        <Trash2 size={12} style={{ color: "#C7C7CC" }} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addCopqItem(cat.key)}
                    className="flex items-center gap-1 text-[10px] font-medium"
                    style={{ color: cat.color }}
                  >
                    <Plus size={10} /> Tambah item
                  </button>
                  <p className="pt-1 text-right text-[11px] font-semibold" style={{ color: cat.color }}>
                    Subtotal: Rp {copqResult.sums[cat.key].toLocaleString("id-ID")}
                  </p>
                </div>
              </SectionCard>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ResultStat
                accent={accent}
                label="Cost of Poor Quality (Internal+Eksternal)"
                value={`Rp ${copqResult.copq.toLocaleString("id-ID")}`}
              />
              <ResultStat
                accent={accent}
                label="Cost of Good Quality (Prevention+Appraisal)"
                value={`Rp ${copqResult.cogq.toLocaleString("id-ID")}`}
              />
            </div>

            <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: `${copqResult.classColor}18` }}>
              <p className="mb-1 text-[11px]" style={{ color: "#8A8A8E" }}>
                Total Biaya Kualitas (PAF) — Rp {copqResult.totalQualityCost.toLocaleString("id-ID")}
              </p>
              <p className="text-4xl font-semibold tracking-tight" style={{ color: copqResult.classColor }}>
                {copqResult.copqPctRevenue.toFixed(2)}%
              </p>
              <p className="mt-1 text-xs" style={{ color: "#8A8A8E" }}>
                COPQ terhadap Total Revenue
              </p>
              <p className="mt-1 text-xs font-medium" style={{ color: copqResult.classColor }}>
                {copqResult.classification}
              </p>
            </div>

            <SectionCard
              title="Komposisi Biaya Kualitas"
              subtitle="Prevention & Appraisal = investasi mencegah cacat · Internal & External Failure = biaya akibat cacat"
              accent={accent}
            >
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={copqResult.chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#8A8A8E" }} interval={0} angle={-15} textAnchor="end" height={55} />
                    <YAxis tick={{ fontSize: 10, fill: "#8A8A8E" }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                    <Tooltip
                      formatter={(v) => `Rp ${Number(v).toLocaleString("id-ID")}`}
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(255,255,255,0.7)",
                        borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                        fontSize: 11,
                      }}
                    />
                    <Bar dataKey="amount" name="Biaya (Rp)" radius={[4, 4, 0, 0]}>
                      {copqResult.chartData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: "#9A9AA0" }}>
                    Porsi Prevention Cost
                  </p>
                  <p className="text-sm font-semibold" style={{ color: "#4FAE7A" }}>
                    {copqResult.preventionRatio.toFixed(1)}% dari total biaya kualitas
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: "#9A9AA0" }}>
                    Porsi Biaya Kegagalan
                  </p>
                  <p className="text-sm font-semibold" style={{ color: "#E2685A" }}>
                    {copqResult.failureRatio.toFixed(1)}% dari total biaya kualitas
                  </p>
                </div>
              </div>
            </SectionCard>

            <InsightBox accent={accent} text={copqInsight} />
          </div>
        </div>
      )}

      {tab === "riwayat" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_1fr]">
          <SectionCard title="Simpan Snapshot Periode Ini" subtitle="Rekam metrik kunci agar bisa dipantau trennya" accent={accent}>
            <div className="space-y-3">
              <div>
                <FieldLabel hint="Nama bebas untuk menandai kapan snapshot ini diambil, mis. 'Minggu 1' atau tanggal">
                  Label Periode
                </FieldLabel>
                <input
                  value={historyLabelDraft}
                  onChange={(e) => setHistoryLabelDraft(e.target.value)}
                  placeholder={`Periode ${history.length + 1}`}
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                />
              </div>
              <div className="rounded-xl p-3 text-[11px] leading-relaxed" style={{ backgroundColor: "rgba(0,0,0,0.04)", color: "#8A8A8E" }}>
                Snapshot akan merekam nilai <span className="font-medium">saat ini</span>: OEE {oee.oee}%, Sigma {dpmoResult.sigma}σ, PCE {vsmResult.pce.toFixed(1)}%, dan Skor Waste {totalWasteScore}/{maxWasteScore} dari tab-tab lain — plus <span className="font-medium">seluruh input mentah</span> tab OEE, DPMO, Waste, dan VSM, sehingga bisa dimuat ulang kapan saja.
              </div>
              <button
                onClick={addHistorySnapshot}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Simpan Snapshot
              </button>
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            {history.length > 0 ? (
              <>
                <SectionCard title="Tren OEE, Sigma & PCE" subtitle="Antar periode yang telah disimpan" accent={accent}>
                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                      <ComposedChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                        <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#8A8A8E" }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#8A8A8E" }} domain={[0, 100]} label={{ value: "%", angle: -90, position: "insideLeft", fontSize: 10, fill: "#8A8A8E" }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#8A8A8E" }} domain={[0, 6]} label={{ value: "σ", angle: -90, position: "insideRight", fontSize: 10, fill: "#8A8A8E" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255,255,255,0.92)",
                            border: "1px solid rgba(255,255,255,0.7)",
                            borderRadius: 12,
                            boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                            fontSize: 11,
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line yAxisId="left" type="monotone" dataKey="oee" name="OEE (%)" stroke={accent} strokeWidth={2} dot={{ r: 3 }} />
                        <Line yAxisId="left" type="monotone" dataKey="pce" name="PCE (%)" stroke="#4C86D6" strokeWidth={2} dot={{ r: 3 }} />
                        <Line yAxisId="right" type="monotone" dataKey="sigma" name="Sigma (σ)" stroke="#4FAE7A" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </SectionCard>

                <SectionCard title="Daftar Snapshot" subtitle="Muat kembali untuk mengisi ulang seluruh input tab OEE, DPMO, Waste & VSM sesuai periode tersebut" accent={accent}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr style={{ color: "#9A9AA0" }}>
                          <th className="px-2 pb-2 font-medium">Periode</th>
                          <th className="px-2 pb-2 font-medium">OEE</th>
                          <th className="px-2 pb-2 font-medium">Sigma</th>
                          <th className="px-2 pb-2 font-medium">PCE</th>
                          <th className="px-2 pb-2 font-medium">Skor Waste</th>
                          <th className="px-2 pb-2 font-medium"></th>
                          <th className="px-1 pb-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((h) => (
                          <tr key={h.id} style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                            <td className="px-2 py-1.5 font-medium">{h.period}</td>
                            <td className="px-2 py-1.5">{h.oee}%</td>
                            <td className="px-2 py-1.5">{h.sigma}σ</td>
                            <td className="px-2 py-1.5">{h.pce}%</td>
                            <td className="px-2 py-1.5">{h.wasteScore}</td>
                            <td className="px-2 py-1.5">
                              {h.raw &&
                                (restoreConfirmId === h.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => restoreHistoryEntry(h)}
                                      className="rounded-lg px-2 py-1 text-[10px] font-medium"
                                      style={{ backgroundColor: "rgba(226,104,90,0.15)", color: "#C0453A" }}
                                    >
                                      Yakin, timpa input saat ini
                                    </button>
                                    <button
                                      onClick={() => setRestoreConfirmId(null)}
                                      className="rounded-lg px-2 py-1 text-[10px] font-medium"
                                      style={{ backgroundColor: "rgba(0,0,0,0.06)", color: "#8A8A8E" }}
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setRestoreConfirmId(h.id)}
                                    className="rounded-lg px-2 py-1 text-[10px] font-medium"
                                    style={{ backgroundColor: `${accent}22`, color: accent }}
                                  >
                                    Muat Kembali
                                  </button>
                                ))}
                            </td>
                            <td className="px-1">
                              <button onClick={() => removeHistoryEntry(h.id)}>
                                <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </>
            ) : (
              <SectionCard title="Belum Ada Riwayat" accent={accent}>
                <p className="text-xs leading-relaxed" style={{ color: "#8A8A8E" }}>
                  Simpan snapshot pertama Anda di panel kiri untuk mulai memantau tren OEE, Sigma, dan PCE dari waktu ke waktu. Tanpa riwayat ini, semua perhitungan di modul Lean hanya mencerminkan satu periode saja dan tidak bisa menunjukkan apakah perbaikan yang dilakukan benar-benar berhasil.
                </p>
              </SectionCard>
            )}
          </div>
        </div>
      )}

      {tab === "rca" && (
        <div className="flex flex-col gap-4">
          <SectionCard
            title="Diagram Fishbone (Ishikawa) — 6M"
            subtitle="Kelompokkan penyebab ke 6 kategori standar, terhubung otomatis ke Pernyataan Masalah 5-Why"
            accent={accent}
          >
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
              <div className="overflow-x-auto rounded-2xl" style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
                <FishboneDiagram problem={fiveWhy.problem} fishbone={fishbone} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {FISHBONE_CATEGORIES.map((cat) => (
                  <div key={cat.key} className="rounded-xl p-2.5" style={{ backgroundColor: `${FISHBONE_COLORS[cat.key]}12` }}>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: FISHBONE_COLORS[cat.key] }}>
                      {cat.label}
                    </p>
                    <div className="space-y-1.5">
                      {fishbone[cat.key].map((c, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <input
                            value={c}
                            onChange={(e) => updateFishboneCause(cat.key, i, e.target.value)}
                            placeholder="Penyebab..."
                            className="w-full rounded-lg px-2 py-1 text-[11px] outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                          />
                          <button onClick={() => removeFishboneCause(cat.key, i)}>
                            <Trash2 size={11} style={{ color: "#C7C7CC" }} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addFishboneCause(cat.key)}
                        className="flex items-center gap-1 text-[10px] font-medium"
                        style={{ color: FISHBONE_COLORS[cat.key] }}
                      >
                        <Plus size={10} /> Tambah penyebab
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[420px_1fr]">
          <div className="flex flex-col gap-4">
            <SectionCard title="Ringkasan Prioritas Lintas-Alat" subtitle="Diambil otomatis dari tab OEE, DPMO, dan Waste" accent={accent}>
              <div className="space-y-2.5">
                <div className="rounded-xl p-3" style={{ backgroundColor: `${GROUP_COLORS.Availability}12` }}>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wide" style={{ color: "#9A9AA0" }}>
                    Kerugian OEE Terbesar
                  </p>
                  <p className="mb-2 text-xs font-medium">{oee.topLoss ? oee.topLoss.label : "—"}</p>
                  {oee.topLoss && (
                    <button
                      onClick={() => fillProblemFrom(`Kerugian OEE terbesar: ${oee.topLoss.label} (${oee.topLoss.pct.toFixed(1)}% dari total kerugian)`)}
                      className="rounded-lg px-2 py-1 text-[10px] font-medium"
                      style={{ backgroundColor: `${accent}22`, color: accent }}
                    >
                      Gunakan sebagai Masalah
                    </button>
                  )}
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: `${accent}12` }}>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wide" style={{ color: "#9A9AA0" }}>
                    Jenis Cacat Dominan
                  </p>
                  <p className="mb-2 text-xs font-medium">{dpmoResult.topDefect ? dpmoResult.topDefect.label : "—"}</p>
                  {dpmoResult.topDefect && (
                    <button
                      onClick={() => fillProblemFrom(`Jenis cacat dominan: ${dpmoResult.topDefect.label} (${dpmoResult.topDefect.pct.toFixed(1)}% dari total cacat)`)}
                      className="rounded-lg px-2 py-1 text-[10px] font-medium"
                      style={{ backgroundColor: `${accent}22`, color: accent }}
                    >
                      Gunakan sebagai Masalah
                    </button>
                  )}
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: "rgba(0,0,0,0.04)" }}>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wide" style={{ color: "#9A9AA0" }}>
                    Waste Prioritas Tertinggi (RPN)
                  </p>
                  <p className="mb-2 text-xs font-medium">
                    {wasteRanking[0] ? `${wasteRanking[0].label} (RPN ${wasteRanking[0].rpn})` : "—"}
                  </p>
                  {wasteRanking[0] && (
                    <button
                      onClick={() => fillProblemFrom(`Waste prioritas tertinggi: ${wasteRanking[0].label}, RPN ${wasteRanking[0].rpn} (Severity ${wasteRanking[0].severity} × Frekuensi ${wasteRanking[0].frequency})`)}
                      className="rounded-lg px-2 py-1 text-[10px] font-medium"
                      style={{ backgroundColor: `${accent}22`, color: accent }}
                    >
                      Gunakan sebagai Masalah
                    </button>
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Analisis 5-Why" subtitle="Telusuri akar masalah dengan bertanya 'kenapa' berulang kali" accent={accent}>
              <div className="space-y-3">
                <div>
                  <FieldLabel hint="Tuliskan masalah yang ingin ditelusuri, atau pakai tombol 'Gunakan sebagai Masalah' di atas">
                    Pernyataan Masalah
                  </FieldLabel>
                  <input
                    value={fiveWhy.problem}
                    onChange={(e) => updateFiveWhyField("problem", e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                  />
                </div>
                {fiveWhy.whys.map((w, i) => (
                  <div key={i}>
                    <FieldLabel>Why {i + 1} — Kenapa itu terjadi?</FieldLabel>
                    <input
                      value={w}
                      onChange={(e) => updateWhyStep(i, e.target.value)}
                      className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                      style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                    />
                  </div>
                ))}
                <div>
                  <FieldLabel hint="Kesimpulan akar masalah setelah menelusuri kelima 'why' di atas">
                    Akar Masalah / Kesimpulan
                  </FieldLabel>
                  <textarea
                    value={fiveWhy.rootCause}
                    onChange={(e) => updateFiveWhyField("rootCause", e.target.value)}
                    rows={3}
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultStat accent={accent} label="Total Rencana Aksi" value={actions.length} />
              <ResultStat accent={accent} label="Sudah Selesai" value={doneActionCount} unit={`/ ${actions.length}`} highlight />
            </div>

            <SectionCard title="Rencana Tindak Lanjut (PDCA)" subtitle="Aksi, penanggung jawab, target, dan status" accent={accent}>
              <div className="mb-3 flex justify-end">
                <button
                  onClick={addAction}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                  style={{ backgroundColor: `${accent}22`, color: accent }}
                >
                  <Plus size={12} /> Tambah Aksi
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr style={{ color: "#9A9AA0" }}>
                      <th className="px-2 pb-2 font-medium">Deskripsi Aksi</th>
                      <th className="px-2 pb-2 font-medium">PIC</th>
                      <th className="px-2 pb-2 font-medium">Target</th>
                      <th className="px-2 pb-2 font-medium">Status</th>
                      <th className="px-1 pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {actions.map((a, i) => (
                      <tr key={i} style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                        <td className="px-2 py-1.5">
                          <input
                            value={a.description}
                            onChange={(e) => updateAction(i, "description", e.target.value)}
                            className="w-48 rounded-lg px-2 py-1 outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            value={a.pic}
                            onChange={(e) => updateAction(i, "pic", e.target.value)}
                            className="w-24 rounded-lg px-2 py-1 outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="date"
                            value={a.targetDate}
                            onChange={(e) => updateAction(i, "targetDate", e.target.value)}
                            className="rounded-lg px-2 py-1 outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <select
                            value={a.status}
                            onChange={(e) => updateAction(i, "status", e.target.value)}
                            className="rounded-lg px-2 py-1 text-[11px] font-medium outline-none"
                            style={{ backgroundColor: `${STATUS_COLORS[a.status]}22`, color: STATUS_COLORS[a.status] }}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-1">
                          <button onClick={() => removeAction(i)}>
                            <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {actions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-2 py-4 text-center text-[11px]" style={{ color: "#9A9AA0" }}>
                          Belum ada rencana tindak lanjut.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Module 6: Digital Supply Chain / SCM Analytics ----------

const DEFAULT_ANALYTICS_THRESHOLDS = {
  por: 90,
  otif: 90,
  leadTime: 7,
  fillRate: 95,
  inventoryAccuracy: 95,
  backorderRate: 5,
  c2c: 60,
  costPct: 15,
};

function AnalyticsModule({ accent }) {
  const [tab, setTab] = useState("kpi");

  // --- KPI Utama state ---
  const [onTimePct, setOnTimePct] = usePersistentState("analytics.onTimePct", 94);
  const [inFullPct, setInFullPct] = usePersistentState("analytics.inFullPct", 96);
  const [damageFreePct, setDamageFreePct] = usePersistentState("analytics.damageFreePct", 98);
  const [docAccuratePct, setDocAccuratePct] = usePersistentState("analytics.docAccuratePct", 97);

  const [cogs, setCogs] = usePersistentState("analytics.cogs", 2400000000);
  const [avgInventory, setAvgInventory] = usePersistentState("analytics.avgInventory", 400000000);

  const [dso, setDso] = usePersistentState("analytics.dso", 45);
  const [dpo, setDpo] = usePersistentState("analytics.dpo", 30);

  // --- KPI SCM Lanjutan ---
  const [forecastQty, setForecastQty] = usePersistentState("analytics.forecastQty", 1000);
  const [actualQty, setActualQty] = usePersistentState("analytics.actualQty", 950);
  const [unitsShipped, setUnitsShipped] = usePersistentState("analytics.unitsShipped", 970);
  const [unitsOrdered, setUnitsOrdered] = usePersistentState("analytics.unitsOrdered", 1000);
  const [systemQty, setSystemQty] = usePersistentState("analytics.systemQty", 5000);
  const [physicalQty, setPhysicalQty] = usePersistentState("analytics.physicalQty", 4900);
  const [backorderedOrders, setBackorderedOrders] = usePersistentState("analytics.backorderedOrders", 12);
  const [totalOrders, setTotalOrders] = usePersistentState("analytics.totalOrders", 400);
  const [orderCycleTime, setOrderCycleTime] = usePersistentState("analytics.orderCycleTime", 3.5);

  const extendedKpi = useMemo(() => {
    const mape = Number(actualQty) > 0 ? (Math.abs(Number(forecastQty) - Number(actualQty)) / Number(actualQty)) * 100 : 0;
    const forecastAccuracy = Math.max(0, 100 - mape);
    const fillRate = Number(unitsOrdered) > 0 ? (Number(unitsShipped) / Number(unitsOrdered)) * 100 : 0;
    const inventoryAccuracy =
      Number(systemQty) > 0
        ? Math.max(0, 100 - (Math.abs(Number(systemQty) - Number(physicalQty)) / Number(systemQty)) * 100)
        : 0;
    const backorderRate = Number(totalOrders) > 0 ? (Number(backorderedOrders) / Number(totalOrders)) * 100 : 0;
    return {
      mape: mape.toFixed(1),
      forecastAccuracy: forecastAccuracy.toFixed(1),
      fillRate: fillRate.toFixed(1),
      inventoryAccuracy: inventoryAccuracy.toFixed(1),
      backorderRate: backorderRate.toFixed(1),
    };
  }, [forecastQty, actualQty, unitsShipped, unitsOrdered, systemQty, physicalQty, backorderedOrders, totalOrders]);

  const extendedKpiInsight = useMemo(() => {
    const items = [
      { key: "forecastAccuracy", label: "Forecast Accuracy", value: Number(extendedKpi.forecastAccuracy), goodDir: "high" },
      { key: "fillRate", label: "Fill Rate", value: Number(extendedKpi.fillRate), goodDir: "high" },
      { key: "inventoryAccuracy", label: "Inventory Accuracy", value: Number(extendedKpi.inventoryAccuracy), goodDir: "high" },
      { key: "backorderRate", label: "Backorder Rate", value: Number(extendedKpi.backorderRate), goodDir: "low" },
    ];
    const worst = [...items].sort((a, b) => {
      const scoreA = a.goodDir === "high" ? a.value : 100 - a.value;
      const scoreB = b.goodDir === "high" ? b.value : 100 - b.value;
      return scoreA - scoreB;
    })[0];
    const advice = {
      forecastAccuracy: "Tinjau ulang metode peramalan permintaan (mis. moving average/exponential smoothing) dan kolaborasikan data penjualan terbaru dengan tim demand planning.",
      fillRate: "Evaluasi ketersediaan stok dan waktu replenishment — fill rate rendah biasanya menandakan safety stock kurang atau lead time pemasok tidak stabil.",
      inventoryAccuracy: "Lakukan cycle counting lebih sering dan audit proses pencatatan stok masuk/keluar untuk menutup selisih sistem vs fisik.",
      backorderRate: "Perbaiki perencanaan kebutuhan (MRP) dan pertimbangkan menaikkan safety stock pada item dengan variabilitas permintaan tinggi.",
    };
    return `KPI yang paling perlu perhatian saat ini: "${worst.label}" (${worst.value.toFixed(1)}%). ${advice[worst.key]}`;
  }, [extendedKpi]);

  const kpiResult = useMemo(() => {
    const por =
      (Number(onTimePct) / 100) *
      (Number(inFullPct) / 100) *
      (Number(damageFreePct) / 100) *
      (Number(docAccuratePct) / 100) *
      100;

    const inv = Number(avgInventory) || 1;
    const turnover = (Number(cogs) || 0) / inv;
    const dio = turnover > 0 ? 365 / turnover : 0;
    const c2c = dio + (Number(dso) || 0) - (Number(dpo) || 0);

    return {
      por: por.toFixed(1),
      turnover: turnover.toFixed(2),
      dio: dio.toFixed(1),
      c2c: c2c.toFixed(1),
    };
  }, [onTimePct, inFullPct, damageFreePct, docAccuratePct, cogs, avgInventory, dso, dpo]);

  // --- Tren multi-periode state ---
  const [trendRows, setTrendRows] = usePersistentState("analytics.trendRows", [
    { period: "Jan", otif: 88, leadTime: 9 },
    { period: "Feb", otif: 90, leadTime: 8 },
    { period: "Mar", otif: 92, leadTime: 7.5 },
    { period: "Apr", otif: 91, leadTime: 8 },
    { period: "Mei", otif: 94, leadTime: 6.5 },
    { period: "Jun", otif: 95, leadTime: 6 },
  ]);

  const addTrendRow = () =>
    setTrendRows([...trendRows, { period: `P${trendRows.length + 1}`, otif: 90, leadTime: 7 }]);
  const removeTrendRow = (idx) => setTrendRows(trendRows.filter((_, i) => i !== idx));
  const updateTrendRow = (idx, field, val) =>
    setTrendRows(
      trendRows.map((r, i) =>
        i === idx ? { ...r, [field]: field === "period" ? val : Number(val) } : r
      )
    );

  const [trendImportMsg, setTrendImportMsg] = useState("");
  const trendFileInputRef = useRef(null);
  const handleTrendImportClick = () => trendFileInputRef.current?.click();
  const parseTrendCSV = (text) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const parsed = [];
    lines.forEach((line) => {
      const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      if (cols.length < 3) return;
      const otif = Number(cols[1]);
      const leadTime = Number(cols[2]);
      if (Number.isNaN(otif) || Number.isNaN(leadTime)) return; // lewati baris header/non-numerik
      parsed.push({ period: cols[0], otif, leadTime });
    });
    return parsed;
  };
  const handleTrendImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseTrendCSV(String(reader.result || ""));
        if (parsed.length === 0) {
          setTrendImportMsg("Tidak ada baris valid ditemukan. Pastikan format: Periode,OTIF (%),Lead Time (hari)");
        } else {
          setTrendRows(parsed);
          setTrendImportMsg(`Berhasil mengimpor ${parsed.length} baris data periode.`);
        }
      } catch {
        setTrendImportMsg("Gagal membaca file CSV. Pastikan formatnya benar.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const trendDelta = useMemo(() => {
    if (trendRows.length < 2) return null;
    const first = trendRows[0];
    const last = trendRows[trendRows.length - 1];
    return {
      otifDelta: (Number(last.otif) - Number(first.otif)).toFixed(1),
      leadTimeDelta: (Number(last.leadTime) - Number(first.leadTime)).toFixed(1),
    };
  }, [trendRows]);

  // --- Analisis Korelasi Lead Time vs OTIF ---
  const correlationResult = useMemo(() => {
    if (trendRows.length < 2) return null;
    const xs = trendRows.map((r) => Number(r.leadTime));
    const ys = trendRows.map((r) => Number(r.otif));
    const r = pearsonCorrelation(xs, ys);
    const scatterData = trendRows.map((row) => ({
      x: Number(row.leadTime),
      y: Number(row.otif),
      period: row.period,
    }));

    const n = xs.length;
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;
    let num2 = 0;
    let den2 = 0;
    for (let i = 0; i < n; i++) {
      num2 += (xs[i] - meanX) * (ys[i] - meanY);
      den2 += (xs[i] - meanX) ** 2;
    }
    const slope = den2 === 0 ? 0 : num2 / den2;
    const intercept = meanY - slope * meanX;
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const lineData = [
      { x: minX, y: slope * minX + intercept },
      { x: maxX, y: slope * maxX + intercept },
    ];

    const abs = Math.abs(r);
    let strength = "sangat lemah";
    if (abs >= 0.7) strength = "kuat";
    else if (abs >= 0.4) strength = "sedang";
    else if (abs >= 0.2) strength = "lemah";
    const direction = r > 0.001 ? "positif" : r < -0.001 ? "negatif" : "tidak ada";

    return { r: Number(r.toFixed(3)), scatterData, lineData, strength, direction, n };
  }, [trendRows]);

  const correlationInsight = useMemo(() => {
    if (!correlationResult) return "";
    const { r, strength, direction, n } = correlationResult;
    const dataCaveat = n < 4 ? " (catatan: data baru ada " + n + " periode, hasil korelasi mungkin belum representatif — tambah lebih banyak periode untuk hasil yang lebih andal)" : "";
    if (direction === "negatif" && (strength === "sedang" || strength === "kuat")) {
      return `Ditemukan korelasi ${strength} dan negatif (r = ${r}) antara Lead Time dan OTIF — semakin panjang lead time, OTIF cenderung semakin turun. Ini mengindikasikan variabilitas/panjangnya lead time menjadi salah satu penyebab keterlambatan pengiriman; fokuskan perbaikan pada stabilitas lead time (kolaborasi dengan pemasok/mitra logistik, buffer waktu pada proses kritis).${dataCaveat}`;
    }
    if (direction === "positif" && (strength === "sedang" || strength === "kuat")) {
      return `Ditemukan korelasi ${strength} dan positif (r = ${r}) antara Lead Time dan OTIF pada data ini — pola yang tidak umum, kemungkinan dipengaruhi faktor lain di luar dua variabel ini (mis. perubahan definisi target OTIF antar periode). Perlu ditelusuri lebih lanjut sebelum diambil kesimpulan.${dataCaveat}`;
    }
    return `Korelasi antara Lead Time dan OTIF pada data ini tergolong ${strength} (r = ${r}) — belum terlihat hubungan linear yang jelas. Kemungkinan OTIF lebih banyak dipengaruhi faktor lain seperti kelengkapan pesanan, kondisi barang, atau akurasi dokumen ketimbang lead time semata.${dataCaveat}`;
  }, [correlationResult]);

  // --- Proyeksi Tren KPI (regresi linear sederhana) ---
  const [forecastPeriods, setForecastPeriods] = usePersistentState("analytics.forecastPeriods", 3);

  const forecastResult = useMemo(() => {
    if (trendRows.length < 2) return null;
    const n = trendRows.length;
    const xs = trendRows.map((_, i) => i);
    const otifYs = trendRows.map((r) => Number(r.otif));
    const ltYs = trendRows.map((r) => Number(r.leadTime));

    const linreg = (xsArr, ysArr) => {
      const nn = xsArr.length;
      const meanX = xsArr.reduce((a, b) => a + b, 0) / nn;
      const meanY = ysArr.reduce((a, b) => a + b, 0) / nn;
      let numerator = 0;
      let denom = 0;
      for (let i = 0; i < nn; i++) {
        numerator += (xsArr[i] - meanX) * (ysArr[i] - meanY);
        denom += (xsArr[i] - meanX) ** 2;
      }
      const slope = denom === 0 ? 0 : numerator / denom;
      const intercept = meanY - slope * meanX;
      return { slope, intercept };
    };

    const otifReg = linreg(xs, otifYs);
    const ltReg = linreg(xs, ltYs);
    const periodsAhead = Math.max(1, Math.min(12, Number(forecastPeriods) || 3));

    const combined = trendRows.map((r, i) => ({
      period: r.period,
      otifActual: Number(r.otif),
      otifProjected: i === n - 1 ? Number(r.otif) : null,
      leadTimeActual: Number(r.leadTime),
      leadTimeProjected: i === n - 1 ? Number(r.leadTime) : null,
    }));

    const projections = [];
    for (let k = 1; k <= periodsAhead; k++) {
      const idx = n - 1 + k;
      const predOtif = Math.min(100, Math.max(0, otifReg.slope * idx + otifReg.intercept));
      const predLT = Math.max(0, ltReg.slope * idx + ltReg.intercept);
      const row = {
        period: `P+${k}`,
        otifActual: null,
        otifProjected: Number(predOtif.toFixed(1)),
        leadTimeActual: null,
        leadTimeProjected: Number(predLT.toFixed(1)),
      };
      combined.push(row);
      projections.push({ period: row.period, otif: row.otifProjected, leadTime: row.leadTimeProjected });
    }

    return {
      combined,
      projections,
      otifTrendDirection: otifReg.slope > 0.05 ? "naik" : otifReg.slope < -0.05 ? "turun" : "stabil",
      leadTimeTrendDirection: ltReg.slope > 0.05 ? "naik" : ltReg.slope < -0.05 ? "turun" : "stabil",
    };
  }, [trendRows, forecastPeriods]);

  const forecastInsight = useMemo(() => {
    if (!forecastResult) return "";
    const { otifTrendDirection, leadTimeTrendDirection, projections } = forecastResult;
    const lastProj = projections[projections.length - 1];
    let msg = `Berdasarkan tren linear dari data historis, OTIF diproyeksikan ${otifTrendDirection} dan Lead Time diproyeksikan ${leadTimeTrendDirection} dalam ${projections.length} periode ke depan`;
    if (lastProj) {
      msg += ` — perkiraan pada periode terakhir proyeksi: OTIF ≈ ${lastProj.otif}%, Lead Time ≈ ${lastProj.leadTime} hari`;
    }
    msg += ".";
    if (otifTrendDirection === "turun") {
      msg += " Tren OTIF menurun perlu diwaspadai — evaluasi penyebab keterlambatan sebelum berlanjut ke periode mendatang.";
    }
    if (leadTimeTrendDirection === "naik") {
      msg += " Tren Lead Time memanjang berpotensi menekan OTIF lebih lanjut — pertimbangkan tindakan preventif pada rantai pasok/logistik.";
    }
    msg += " Catatan: proyeksi linear sederhana ini mengasumsikan pola berlanjut seperti tren historis dan tidak memperhitungkan faktor eksternal mendadak.";
    return msg;
  }, [forecastResult]);

  // --- Rasio biaya SCM state ---
  const [revenue, setRevenue] = usePersistentState("analytics.revenue", 5000000000);
  const [costItems, setCostItems] = usePersistentState("analytics.costItems", [
    { name: "Transportasi", cost: 350000000 },
    { name: "Pergudangan", cost: 220000000 },
    { name: "Biaya Simpan Inventori", cost: 180000000 },
    { name: "Administrasi & Overhead", cost: 90000000 },
  ]);

  const addCostItem = () =>
    setCostItems([...costItems, { name: `Biaya ${costItems.length + 1}`, cost: 0 }]);
  const removeCostItem = (idx) => setCostItems(costItems.filter((_, i) => i !== idx));
  const updateCostItem = (idx, field, val) =>
    setCostItems(
      costItems.map((c, i) =>
        i === idx ? { ...c, [field]: field === "name" ? val : Number(val) } : c
      )
    );

  const costResult = useMemo(() => {
    const rev = Number(revenue) || 1;
    const items = costItems
      .map((c) => {
        const cost = Number(c.cost) || 0;
        return { name: c.name, cost, pct: (cost / rev) * 100 };
      })
      .sort((a, b) => b.cost - a.cost);
    const totalCost = items.reduce((a, c) => a + c.cost, 0);
    const totalPct = (totalCost / rev) * 100;
    return { items, totalCost, totalPct };
  }, [costItems, revenue]);

  // --- Sistem Alert / Threshold Otomatis ---
  const [thresholds, setThresholds] = usePersistentState("analytics.thresholds", DEFAULT_ANALYTICS_THRESHOLDS);
  const updateThreshold = (key, val) => setThresholds({ ...thresholds, [key]: Number(val) || 0 });

  const alertItems = useMemo(() => {
    const lastTrend = trendRows[trendRows.length - 1];
    const raw = [
      { key: "por", label: "Perfect Order Rate", unit: "%", direction: "min", value: Number(kpiResult.por), threshold: Number(thresholds.por) },
      { key: "otif", label: "OTIF Terbaru", unit: "%", direction: "min", value: lastTrend ? Number(lastTrend.otif) : null, threshold: Number(thresholds.otif) },
      { key: "leadTime", label: "Lead Time Terbaru", unit: "hari", direction: "max", value: lastTrend ? Number(lastTrend.leadTime) : null, threshold: Number(thresholds.leadTime) },
      { key: "fillRate", label: "Fill Rate", unit: "%", direction: "min", value: Number(extendedKpi.fillRate), threshold: Number(thresholds.fillRate) },
      { key: "inventoryAccuracy", label: "Inventory Accuracy", unit: "%", direction: "min", value: Number(extendedKpi.inventoryAccuracy), threshold: Number(thresholds.inventoryAccuracy) },
      { key: "backorderRate", label: "Backorder Rate", unit: "%", direction: "max", value: Number(extendedKpi.backorderRate), threshold: Number(thresholds.backorderRate) },
      { key: "c2c", label: "Cash-to-Cash Cycle", unit: "hari", direction: "max", value: Number(kpiResult.c2c), threshold: Number(thresholds.c2c) },
      { key: "costPct", label: "Total Biaya SCM (% Revenue)", unit: "%", direction: "max", value: Number(costResult.totalPct.toFixed(1)), threshold: Number(thresholds.costPct) },
    ];
    return raw.map((it) => {
      if (it.value === null || Number.isNaN(it.value)) return { ...it, status: "no-data", breach: false };
      const breach = it.direction === "min" ? it.value < it.threshold : it.value > it.threshold;
      return { ...it, status: breach ? "alert" : "ok", breach };
    });
  }, [kpiResult, extendedKpi, costResult, trendRows, thresholds]);

  const activeAlerts = useMemo(() => alertItems.filter((a) => a.breach), [alertItems]);

  const alertInsight = useMemo(() => {
    const monitored = alertItems.filter((a) => a.status !== "no-data");
    if (activeAlerts.length === 0) {
      return monitored.length > 0
        ? "Semua KPI yang dipantau saat ini berada dalam ambang batas yang ditetapkan."
        : "Belum ada data KPI yang cukup untuk dipantau. Isi data di tab-tab lain terlebih dahulu.";
    }
    const worst = [...activeAlerts].sort((a, b) => {
      const devA = a.direction === "min" ? (a.threshold - a.value) / (a.threshold || 1) : (a.value - a.threshold) / (a.threshold || 1);
      const devB = b.direction === "min" ? (b.threshold - b.value) / (b.threshold || 1) : (b.value - b.threshold) / (b.threshold || 1);
      return devB - devA;
    })[0];
    return `${activeAlerts.length} dari ${monitored.length} KPI yang dipantau berada di luar ambang batas. Yang paling kritis: "${worst.label}" (${worst.value}${worst.unit} vs ambang ${
      worst.direction === "min" ? "minimum" : "maksimum"
    } ${worst.threshold}${worst.unit}). Prioritaskan tindakan perbaikan pada KPI ini terlebih dahulu.`;
  }, [activeAlerts, alertItems]);

  useReportSync("analytics", {
    por: kpiResult.por,
    turnover: kpiResult.turnover,
    dio: kpiResult.dio,
    c2c: kpiResult.c2c,
    topCostDriver: costResult.items[0]?.name,
    topCostDriverPct: costResult.items[0]?.pct,
    totalCostPct: costResult.totalPct,
    otifLatest: trendRows[trendRows.length - 1]?.otif ?? null,
    leadTimeLatest: trendRows[trendRows.length - 1]?.leadTime ?? null,
    trend: trendRows,
    forecastAccuracy: extendedKpi.forecastAccuracy,
    fillRate: extendedKpi.fillRate,
    inventoryAccuracy: extendedKpi.inventoryAccuracy,
    backorderRate: extendedKpi.backorderRate,
    orderCycleTime,
  });

  const tabs = [
    { id: "kpi", label: "KPI Utama" },
    { id: "kpi2", label: "KPI SCM Lanjutan" },
    { id: "trend", label: "Tren Multi-Periode" },
    { id: "korelasi", label: "Korelasi KPI" },
    { id: "forecast", label: "Proyeksi Tren" },
    { id: "cost", label: "Rasio Biaya SCM" },
    { id: "alert", label: "Alert & Threshold" },
  ];

  const TAB_EXPORT_LABELS = {
    kpi: "KPI Utama",
    kpi2: "KPI SCM Lanjutan",
    trend: "Tren Multi-Periode",
    korelasi: "Korelasi KPI",
    forecast: "Proyeksi Tren",
    cost: "Rasio Biaya SCM",
    alert: "Alert & Threshold",
  };

  const exportTabCSV = () => {
    const rows = [];
    let filename = `analytics-${tab}.csv`;
    switch (tab) {
      case "kpi": {
        rows.push(toCSVRow(["Perfect Order Rate — Komponen"]));
        rows.push(toCSVRow(["% Tepat Waktu", onTimePct]));
        rows.push(toCSVRow(["% Lengkap", inFullPct]));
        rows.push(toCSVRow(["% Tanpa Kerusakan", damageFreePct]));
        rows.push(toCSVRow(["% Dokumen Akurat", docAccuratePct]));
        rows.push(toCSVRow([]));
        rows.push(toCSVRow(["Metrik", "Nilai"]));
        rows.push(toCSVRow(["Perfect Order Rate (%)", kpiResult.por]));
        rows.push(toCSVRow(["Inventory Turnover (x/th)", kpiResult.turnover]));
        rows.push(toCSVRow(["Days Inventory Outstanding (hari)", kpiResult.dio]));
        rows.push(toCSVRow(["Cash-to-Cash Cycle (hari)", kpiResult.c2c]));
        filename = "analytics-kpi-utama.csv";
        break;
      }
      case "kpi2": {
        rows.push(toCSVRow(["Metrik", "Nilai"]));
        rows.push(toCSVRow(["Forecast Accuracy (%)", extendedKpi.forecastAccuracy]));
        rows.push(toCSVRow(["MAPE (%)", extendedKpi.mape]));
        rows.push(toCSVRow(["Fill Rate (%)", extendedKpi.fillRate]));
        rows.push(toCSVRow(["Inventory Accuracy (%)", extendedKpi.inventoryAccuracy]));
        rows.push(toCSVRow(["Backorder Rate (%)", extendedKpi.backorderRate]));
        rows.push(toCSVRow(["Order Cycle Time (hari)", orderCycleTime]));
        filename = "analytics-kpi-scm-lanjutan.csv";
        break;
      }
      case "trend": {
        rows.push(toCSVRow(["Periode", "OTIF (%)", "Lead Time (hari)"]));
        trendRows.forEach((r) => rows.push(toCSVRow([r.period, r.otif, r.leadTime])));
        if (trendDelta) {
          rows.push(toCSVRow([]));
          rows.push(toCSVRow(["Perubahan OTIF (periode awal→akhir)", trendDelta.otifDelta]));
          rows.push(toCSVRow(["Perubahan Lead Time (periode awal→akhir)", trendDelta.leadTimeDelta]));
        }
        filename = "analytics-tren-multi-periode.csv";
        break;
      }
      case "korelasi": {
        rows.push(toCSVRow(["Periode", "Lead Time (hari)", "OTIF (%)"]));
        (correlationResult?.scatterData ?? []).forEach((d) => rows.push(toCSVRow([d.period, d.x, d.y])));
        rows.push(toCSVRow([]));
        rows.push(toCSVRow(["Koefisien Korelasi (r)", correlationResult?.r ?? "-"]));
        rows.push(toCSVRow(["Kekuatan Hubungan", correlationResult?.strength ?? "-"]));
        rows.push(toCSVRow(["Arah Hubungan", correlationResult?.direction ?? "-"]));
        filename = "analytics-korelasi-kpi.csv";
        break;
      }
      case "forecast": {
        rows.push(toCSVRow(["Periode", "OTIF Proyeksi (%)", "Lead Time Proyeksi (hari)"]));
        (forecastResult?.projections ?? []).forEach((p) => rows.push(toCSVRow([p.period, p.otif, p.leadTime])));
        rows.push(toCSVRow([]));
        rows.push(toCSVRow(["Arah Tren OTIF", forecastResult?.otifTrendDirection ?? "-"]));
        rows.push(toCSVRow(["Arah Tren Lead Time", forecastResult?.leadTimeTrendDirection ?? "-"]));
        filename = "analytics-proyeksi-tren.csv";
        break;
      }
      case "cost": {
        rows.push(toCSVRow(["Komponen Biaya", "Nilai (Rp)", "% dari Revenue"]));
        costResult.items.forEach((c) => rows.push(toCSVRow([c.name, c.cost, c.pct.toFixed(2)])));
        rows.push(toCSVRow([]));
        rows.push(toCSVRow(["Total Biaya SCM (Rp)", costResult.totalCost]));
        rows.push(toCSVRow(["Total Biaya SCM (% Revenue)", costResult.totalPct.toFixed(2)]));
        filename = "analytics-rasio-biaya-scm.csv";
        break;
      }
      case "alert": {
        rows.push(toCSVRow(["KPI", "Nilai Saat Ini", "Ambang Batas", "Arah", "Status"]));
        alertItems.forEach((a) =>
          rows.push(
            toCSVRow([
              a.label,
              a.value === null ? "-" : `${a.value}${a.unit}`,
              `${a.threshold}${a.unit}`,
              a.direction === "min" ? "Minimum" : "Maksimum",
              a.status === "no-data" ? "Data belum ada" : a.status === "alert" ? "ALERT" : "OK",
            ])
          )
        );
        filename = "analytics-alert-threshold.csv";
        break;
      }
      default:
        break;
    }
    downloadCSV(filename, rows.join("\n"));
  };

  return (
    <div className="flex flex-col gap-4">
      {activeAlerts.length > 0 && tab !== "alert" && (
        <button
          onClick={() => setTab("alert")}
          className="flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium"
          style={{ backgroundColor: "rgba(226,104,90,0.12)", color: "#C0453A" }}
        >
          <AlertTriangle size={13} />
          {activeAlerts.length} KPI di luar ambang batas: {activeAlerts.map((a) => a.label).join(", ")} — klik untuk lihat detail
        </button>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ModuleTabs tabs={tabs} tab={tab} setTab={setTab} accent={accent} />
        <button
          onClick={exportTabCSV}
          title={`Ekspor data tab "${TAB_EXPORT_LABELS[tab] ?? tab}" sebagai CSV`}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium"
          style={{ backgroundColor: `${accent}18`, color: accent }}
        >
          <Download size={12} />
          Ekspor Tab Ini (CSV)
        </button>
      </div>

      {tab === "kpi" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <SectionCard title="Parameter KPI" subtitle="Perfect Order Rate, Turnover, Cash-to-Cash" accent={accent}>
            <div className="space-y-4">
              <p className="text-[11px] font-medium" style={{ color: "#9A9AA0" }}>
                Perfect Order Rate
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>% Tepat Waktu</FieldLabel>
                  <NumberInput value={onTimePct} onChange={setOnTimePct} suffix="%" />
                </div>
                <div>
                  <FieldLabel>% Lengkap</FieldLabel>
                  <NumberInput value={inFullPct} onChange={setInFullPct} suffix="%" />
                </div>
                <div>
                  <FieldLabel>% Tanpa Kerusakan</FieldLabel>
                  <NumberInput value={damageFreePct} onChange={setDamageFreePct} suffix="%" />
                </div>
                <div>
                  <FieldLabel>% Dokumen Akurat</FieldLabel>
                  <NumberInput value={docAccuratePct} onChange={setDocAccuratePct} suffix="%" />
                </div>
              </div>

              <div className="h-px" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />

              <p className="text-[11px] font-medium" style={{ color: "#9A9AA0" }}>
                Inventory Turnover
              </p>
              <div>
                <FieldLabel>COGS Tahunan</FieldLabel>
                <NumberInput value={cogs} onChange={setCogs} suffix="Rp/th" />
              </div>
              <div>
                <FieldLabel>Rata-rata Nilai Inventori</FieldLabel>
                <NumberInput value={avgInventory} onChange={setAvgInventory} suffix="Rp" />
              </div>

              <div className="h-px" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />

              <p className="text-[11px] font-medium" style={{ color: "#9A9AA0" }}>
                Cash-to-Cash Cycle
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel hint="Days Sales Outstanding">DSO</FieldLabel>
                  <NumberInput value={dso} onChange={setDso} suffix="hari" />
                </div>
                <div>
                  <FieldLabel hint="Days Payable Outstanding">DPO</FieldLabel>
                  <NumberInput value={dpo} onChange={setDpo} suffix="hari" />
                </div>
              </div>
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ResultStat accent={accent} label="Perfect Order Rate" value={kpiResult.por} unit="%" highlight />
              <ResultStat accent={accent} label="Cash-to-Cash Cycle" value={kpiResult.c2c} unit="hari" highlight />
              <ResultStat accent={accent} label="Inventory Turnover" value={kpiResult.turnover} unit="x/th" />
              <ResultStat accent={accent} label="Days Inventory Outstanding" value={kpiResult.dio} unit="hari" />
            </div>
            <p className="px-1 text-xs leading-relaxed" style={{ color: "#8A8A8E" }}>
              Perfect Order Rate mengalikan keempat komponen — satu saja gagal, pesanan tidak terhitung "sempurna". Cash-to-Cash Cycle = DIO + DSO − DPO; makin kecil, makin cepat kas perusahaan berputar kembali.
            </p>
          </div>
        </div>
      )}

      {tab === "kpi2" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <SectionCard title="Parameter KPI SCM Lanjutan" subtitle="Forecast Accuracy, Fill Rate, Inventory Accuracy, Backorder Rate" accent={accent}>
            <div className="space-y-4">
              <p className="text-[11px] font-medium" style={{ color: "#9A9AA0" }}>
                Forecast Accuracy
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Jumlah Peramalan</FieldLabel>
                  <NumberInput value={forecastQty} onChange={setForecastQty} suffix="unit" />
                </div>
                <div>
                  <FieldLabel>Jumlah Aktual</FieldLabel>
                  <NumberInput value={actualQty} onChange={setActualQty} suffix="unit" />
                </div>
              </div>

              <div className="h-px" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />

              <p className="text-[11px] font-medium" style={{ color: "#9A9AA0" }}>
                Fill Rate
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Unit Terkirim</FieldLabel>
                  <NumberInput value={unitsShipped} onChange={setUnitsShipped} suffix="unit" />
                </div>
                <div>
                  <FieldLabel>Unit Dipesan</FieldLabel>
                  <NumberInput value={unitsOrdered} onChange={setUnitsOrdered} suffix="unit" />
                </div>
              </div>

              <div className="h-px" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />

              <p className="text-[11px] font-medium" style={{ color: "#9A9AA0" }}>
                Inventory Accuracy
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Qty Sistem</FieldLabel>
                  <NumberInput value={systemQty} onChange={setSystemQty} suffix="unit" />
                </div>
                <div>
                  <FieldLabel>Qty Fisik</FieldLabel>
                  <NumberInput value={physicalQty} onChange={setPhysicalQty} suffix="unit" />
                </div>
              </div>

              <div className="h-px" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />

              <p className="text-[11px] font-medium" style={{ color: "#9A9AA0" }}>
                Backorder Rate
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Pesanan Backorder</FieldLabel>
                  <NumberInput value={backorderedOrders} onChange={setBackorderedOrders} suffix="pesanan" />
                </div>
                <div>
                  <FieldLabel>Total Pesanan</FieldLabel>
                  <NumberInput value={totalOrders} onChange={setTotalOrders} suffix="pesanan" />
                </div>
              </div>

              <div className="h-px" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />

              <p className="text-[11px] font-medium" style={{ color: "#9A9AA0" }}>
                Order Cycle Time
              </p>
              <div>
                <FieldLabel hint="Rata-rata waktu dari pesanan dibuat sampai diterima pelanggan">Order Cycle Time</FieldLabel>
                <NumberInput value={orderCycleTime} onChange={setOrderCycleTime} suffix="hari" />
              </div>
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ResultStat accent={accent} label="Forecast Accuracy" value={extendedKpi.forecastAccuracy} unit="%" highlight />
              <ResultStat accent={accent} label="Fill Rate" value={extendedKpi.fillRate} unit="%" highlight />
              <ResultStat accent={accent} label="Inventory Accuracy" value={extendedKpi.inventoryAccuracy} unit="%" />
              <ResultStat accent={accent} label="Backorder Rate" value={extendedKpi.backorderRate} unit="%" />
              <ResultStat accent={accent} label="Order Cycle Time" value={orderCycleTime} unit="hari" />
              <ResultStat accent={accent} label="MAPE (Forecast Error)" value={extendedKpi.mape} unit="%" />
            </div>
            <InsightBox accent={accent} text={extendedKpiInsight} />
          </div>
        </div>
      )}

      {tab === "trend" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <SectionCard title="Data Kinerja per Periode" subtitle="OTIF% dan Lead Time tiap periode" accent={accent}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium" style={{ color: "#4B4B4F" }}>
                Riwayat Kinerja
              </p>
              <div className="flex items-center gap-2">
                <input
                  ref={trendFileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleTrendImportFile}
                  className="hidden"
                />
                <button
                  onClick={handleTrendImportClick}
                  title="Impor CSV dengan kolom: Periode,OTIF (%),Lead Time (hari)"
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                  style={{ backgroundColor: "rgba(0,0,0,0.06)", color: "#4B4B4F" }}
                >
                  <Download size={12} style={{ transform: "rotate(180deg)" }} /> Impor CSV
                </button>
                <button
                  onClick={addTrendRow}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                  style={{ backgroundColor: `${accent}22`, color: accent }}
                >
                  <Plus size={12} /> Tambah
                </button>
              </div>
            </div>

            {trendImportMsg && (
              <p className="mb-2 text-[11px]" style={{ color: "#8A8A8E" }}>
                {trendImportMsg}
              </p>
            )}

            <div className="mb-1.5 flex items-center gap-2 px-1">
              <span className="w-14 text-[10px]" style={{ color: "#9A9AA0" }}>
                Periode
              </span>
              <span className="flex-1 text-[10px]" style={{ color: "#9A9AA0" }}>
                OTIF %
              </span>
              <span className="flex-1 text-[10px]" style={{ color: "#9A9AA0" }}>
                Lead Time
              </span>
            </div>

            <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
              {trendRows.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={r.period}
                    onChange={(e) => updateTrendRow(i, "period", e.target.value)}
                    className="w-14 rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                  />
                  <input
                    type="number"
                    value={r.otif}
                    onChange={(e) => updateTrendRow(i, "otif", e.target.value)}
                    className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                  />
                  <input
                    type="number"
                    value={r.leadTime}
                    onChange={(e) => updateTrendRow(i, "leadTime", e.target.value)}
                    className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                  />
                  <button onClick={() => removeTrendRow(i)}>
                    <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <SectionCard title="Tren OTIF% vs Lead Time" accent={accent}>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={trendRows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#8A8A8E" }} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11, fill: "#8A8A8E" }}
                      domain={[0, 100]}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11, fill: "#8A8A8E" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(255,255,255,0.7)",
                        borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line yAxisId="left" type="monotone" dataKey="otif" name="OTIF %" stroke="#0A84FF" strokeWidth={2} dot={{ r: 3 }} />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="leadTime"
                      name="Lead Time (hari)"
                      stroke={accent}
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            {trendDelta && (
              <div className="grid grid-cols-2 gap-3">
                <ResultStat accent={accent}
                  label="Perubahan OTIF (awal → akhir)"
                  value={`${trendDelta.otifDelta > 0 ? "+" : ""}${trendDelta.otifDelta}`}
                  unit="poin"
                  highlight={Number(trendDelta.otifDelta) > 0}
                />
                <ResultStat accent={accent}
                  label="Perubahan Lead Time (awal → akhir)"
                  value={`${trendDelta.leadTimeDelta > 0 ? "+" : ""}${trendDelta.leadTimeDelta}`}
                  unit="hari"
                  highlight={Number(trendDelta.leadTimeDelta) < 0}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "korelasi" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
          <SectionCard
            title="Korelasi Lead Time vs OTIF"
            subtitle="Tiap titik mewakili satu periode dari tab Tren Multi-Periode — garis putus-putus adalah tren linear"
            accent={accent}
          >
            {correlationResult ? (
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <ComposedChart margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="Lead Time"
                      unit=" hari"
                      tick={{ fontSize: 10, fill: "#8A8A8E" }}
                      label={{ value: "Lead Time (hari)", position: "insideBottom", offset: -4, fontSize: 10, fill: "#8A8A8E" }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="OTIF"
                      unit="%"
                      tick={{ fontSize: 10, fill: "#8A8A8E" }}
                      label={{ value: "OTIF (%)", angle: -90, position: "insideLeft", fontSize: 10, fill: "#8A8A8E" }}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      formatter={(v, name) => [name === "OTIF" ? `${v}%` : `${v} hari`, name]}
                      labelFormatter={() => ""}
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(255,255,255,0.7)",
                        borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                        fontSize: 11,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Scatter name="Periode Aktual" data={correlationResult.scatterData} fill={accent} />
                    <Line
                      name="Tren Linear"
                      data={correlationResult.lineData}
                      dataKey="y"
                      stroke="#9A9AA0"
                      strokeDasharray="5 4"
                      dot={false}
                      activeDot={false}
                      legendType="line"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs leading-relaxed" style={{ color: "#8A8A8E" }}>
                Butuh minimal 2 periode data di tab "Tren Multi-Periode" untuk menghitung korelasi. Tambahkan data periode terlebih dahulu.
              </p>
            )}
          </SectionCard>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: `${accent}18` }}>
              <p className="mb-1 text-[11px]" style={{ color: "#8A8A8E" }}>
                Koefisien Korelasi Pearson (r)
              </p>
              <p className="text-4xl font-semibold tracking-tight" style={{ color: accent }}>
                {correlationResult ? correlationResult.r : "—"}
              </p>
              {correlationResult && (
                <p className="mt-1 text-xs font-medium" style={{ color: accent }}>
                  Hubungan {correlationResult.strength}, {correlationResult.direction}
                </p>
              )}
            </div>
            <div className="rounded-xl p-3 text-[11px] leading-relaxed" style={{ backgroundColor: "rgba(0,0,0,0.04)", color: "#8A8A8E" }}>
              r berkisar dari −1 (korelasi negatif sempurna) sampai +1 (korelasi positif sempurna). Semakin mendekati 0, semakin lemah hubungan liniernya. Korelasi tidak selalu berarti sebab-akibat.
            </div>
            {correlationResult && <InsightBox accent={accent} text={correlationInsight} />}
          </div>
        </div>
      )}

      {tab === "forecast" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
          <SectionCard
            title="Proyeksi Tren OTIF & Lead Time"
            subtitle="Garis solid = data aktual, garis putus-putus = proyeksi berdasarkan regresi linear dari tren historis"
            accent={accent}
          >
            {forecastResult ? (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <FieldLabel hint="Jumlah periode ke depan yang diproyeksikan (maks 12)">Proyeksi berapa periode ke depan?</FieldLabel>
                </div>
                <div className="mb-4 w-40">
                  <NumberInput value={forecastPeriods} onChange={setForecastPeriods} suffix="periode" />
                </div>
                <div style={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer>
                    <ComposedChart data={forecastResult.combined} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#8A8A8E" }} />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 10, fill: "#8A8A8E" }}
                        domain={[0, 100]}
                        label={{ value: "OTIF %", angle: -90, position: "insideLeft", fontSize: 10, fill: "#8A8A8E" }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 10, fill: "#8A8A8E" }}
                        label={{ value: "hari", angle: -90, position: "insideRight", fontSize: 10, fill: "#8A8A8E" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255,255,255,0.92)",
                          border: "1px solid rgba(255,255,255,0.7)",
                          borderRadius: 12,
                          boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                          fontSize: 11,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line yAxisId="left" type="monotone" dataKey="otifActual" name="OTIF Aktual (%)" stroke="#0A84FF" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
                      <Line yAxisId="left" type="monotone" dataKey="otifProjected" name="OTIF Proyeksi (%)" stroke="#0A84FF" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} connectNulls />
                      <Line yAxisId="right" type="monotone" dataKey="leadTimeActual" name="Lead Time Aktual (hari)" stroke="#E2A63B" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
                      <Line yAxisId="right" type="monotone" dataKey="leadTimeProjected" name="Lead Time Proyeksi (hari)" stroke="#E2A63B" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} connectNulls />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr style={{ color: "#9A9AA0" }}>
                        <th className="px-2 pb-2 font-medium">Periode Proyeksi</th>
                        <th className="px-2 pb-2 font-medium">OTIF (%)</th>
                        <th className="px-2 pb-2 font-medium">Lead Time (hari)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecastResult.projections.map((p) => (
                        <tr key={p.period} style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                          <td className="px-2 py-1.5 font-medium">{p.period}</td>
                          <td className="px-2 py-1.5">{p.otif}%</td>
                          <td className="px-2 py-1.5">{p.leadTime} hari</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-xs leading-relaxed" style={{ color: "#8A8A8E" }}>
                Butuh minimal 2 periode data di tab "Tren Multi-Periode" untuk membuat proyeksi.
              </p>
            )}
          </SectionCard>

          <div className="flex flex-col gap-4">
            {forecastResult && (
              <div className="grid grid-cols-1 gap-3">
                <ResultStat
                  accent={accent}
                  label="Arah Tren OTIF"
                  value={forecastResult.otifTrendDirection}
                  highlight={forecastResult.otifTrendDirection === "naik"}
                />
                <ResultStat
                  accent={accent}
                  label="Arah Tren Lead Time"
                  value={forecastResult.leadTimeTrendDirection}
                  highlight={forecastResult.leadTimeTrendDirection === "turun"}
                />
              </div>
            )}
            {forecastResult && <InsightBox accent={accent} text={forecastInsight} />}
          </div>
        </div>
      )}

      {tab === "cost" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <SectionCard title="Revenue & Komponen Biaya" subtitle="Rasio biaya rantai pasok terhadap pendapatan" accent={accent}>
            <div className="mb-4">
              <FieldLabel>Revenue</FieldLabel>
              <NumberInput value={revenue} onChange={setRevenue} suffix="Rp/th" />
            </div>

            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: "#4B4B4F" }}>
                Komponen Biaya
              </p>
              <button
                onClick={addCostItem}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah
              </button>
            </div>

            <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {costItems.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={c.name}
                    onChange={(e) => updateCostItem(i, "name", e.target.value)}
                    className="w-32 rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                  />
                  <input
                    type="number"
                    value={c.cost}
                    onChange={(e) => updateCostItem(i, "cost", e.target.value)}
                    className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
                  />
                  <button onClick={() => removeCostItem(i)}>
                    <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <ResultStat accent={accent} label="Total Rasio Biaya SCM terhadap Revenue" value={costResult.totalPct.toFixed(1)} unit="%" highlight />

            <SectionCard title="Kontribusi Tiap Komponen Biaya" accent={accent}>
              <div className="space-y-4">
                {costResult.items.map((c, i) => (
                  <div key={i}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="text-xs font-medium">{c.name}</p>
                      <p className="text-xs" style={{ color: "#8A8A8E" }}>
                        Rp {c.cost.toLocaleString("id-ID")} · {c.pct.toFixed(1)}%
                      </p>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.06)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, c.pct)}%`, backgroundColor: accent }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "alert" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <SectionCard title="Ambang Batas KPI" subtitle="Atur nilai minimum/maksimum yang dianggap wajar untuk tiap KPI" accent={accent}>
            <div className="space-y-3">
              {[
                { key: "por", label: "Perfect Order Rate", unit: "%", direction: "min" },
                { key: "otif", label: "OTIF Terbaru", unit: "%", direction: "min" },
                { key: "leadTime", label: "Lead Time Terbaru", unit: "hari", direction: "max" },
                { key: "fillRate", label: "Fill Rate", unit: "%", direction: "min" },
                { key: "inventoryAccuracy", label: "Inventory Accuracy", unit: "%", direction: "min" },
                { key: "backorderRate", label: "Backorder Rate", unit: "%", direction: "max" },
                { key: "c2c", label: "Cash-to-Cash Cycle", unit: "hari", direction: "max" },
                { key: "costPct", label: "Total Biaya SCM (% Revenue)", unit: "%", direction: "max" },
              ].map((cfg) => (
                <div key={cfg.key}>
                  <FieldLabel hint={cfg.direction === "min" ? "Alert muncul jika nilai turun di bawah ambang ini" : "Alert muncul jika nilai naik di atas ambang ini"}>
                    {cfg.label} ({cfg.direction === "min" ? "min" : "maks"})
                  </FieldLabel>
                  <NumberInput value={thresholds[cfg.key]} onChange={(v) => updateThreshold(cfg.key, v)} suffix={cfg.unit} />
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <div
              className="rounded-2xl p-5 text-center"
              style={{ backgroundColor: activeAlerts.length > 0 ? "rgba(226,104,90,0.15)" : "rgba(79,174,122,0.15)" }}
            >
              <p className="mb-1 text-[11px]" style={{ color: "#8A8A8E" }}>
                Status Keseluruhan
              </p>
              <p className="text-4xl font-semibold tracking-tight" style={{ color: activeAlerts.length > 0 ? "#C0453A" : "#4FAE7A" }}>
                {activeAlerts.length}
              </p>
              <p className="mt-1 text-xs font-medium" style={{ color: activeAlerts.length > 0 ? "#C0453A" : "#4FAE7A" }}>
                {activeAlerts.length > 0 ? "KPI di luar ambang batas" : "Semua KPI dalam batas aman"}
              </p>
            </div>

            <SectionCard title="Rincian per KPI" accent={accent}>
              <div className="space-y-2">
                {alertItems.map((a) => (
                  <div
                    key={a.key}
                    className="flex items-center justify-between rounded-xl p-2.5"
                    style={{
                      backgroundColor:
                        a.status === "alert" ? "rgba(226,104,90,0.1)" : a.status === "ok" ? "rgba(79,174,122,0.08)" : "rgba(0,0,0,0.03)",
                    }}
                  >
                    <div>
                      <p className="text-xs font-medium" style={{ color: "#1D1D1F" }}>
                        {a.label}
                      </p>
                      <p className="text-[10px]" style={{ color: "#8A8A8E" }}>
                        {a.status === "no-data" ? "Belum ada data" : `Ambang ${a.direction === "min" ? "minimum" : "maksimum"}: ${a.threshold}${a.unit}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold" style={{ color: "#1D1D1F" }}>
                        {a.status === "no-data" ? "—" : `${a.value}${a.unit}`}
                      </p>
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[9px] font-semibold"
                        style={{
                          backgroundColor: a.status === "alert" ? "rgba(226,104,90,0.2)" : a.status === "ok" ? "rgba(79,174,122,0.2)" : "rgba(0,0,0,0.06)",
                          color: a.status === "alert" ? "#C0453A" : a.status === "ok" ? "#357A54" : "#9A9AA0",
                        }}
                      >
                        {a.status === "alert" ? "ALERT" : a.status === "ok" ? "OK" : "N/A"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <InsightBox accent={accent} text={alertInsight} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Module 7: Risk Management ----------

const EMISSION_FACTORS = [
  { id: "truck", label: "Truk", factor: 0.062 },
  { id: "train", label: "Kereta", factor: 0.022 },
  { id: "ship", label: "Kapal Laut", factor: 0.008 },
  { id: "air", label: "Udara", factor: 0.602 },
];

const DEFAULT_RESILIENCE_WEIGHTS = { matrix: 30, fmea: 25, continuity: 20, supplier: 25 };

function RiskModule({ accent }) {
  const [tab, setTab] = useState("resilience");
  const reportData = useReportData();
  const supplierRiskData = reportData.procurement?.supplierRiskList || [];
  const analyticsSignal = reportData.analytics;

  // --- Risk Matrix state ---
  const [risks, setRisks] = usePersistentState("risk.risks", [
    { name: "Keterlambatan Supplier Utama", probability: 4, impact: 4, category: "Supplier" },
    { name: "Kenaikan Harga Bahan Baku", probability: 3, impact: 3, category: "Supplier" },
    { name: "Bencana Alam di Jalur Distribusi", probability: 2, impact: 5, category: "Logistik" },
    { name: "Kegagalan Sistem IT Gudang", probability: 2, impact: 3, category: "IT/Sistem" },
    { name: "Kekurangan Tenaga Kerja Musiman", probability: 3, impact: 2, category: "Tenaga Kerja" },
  ]);

  const addRisk = () =>
    setRisks([...risks, { name: `Risiko ${risks.length + 1}`, probability: 3, impact: 3, category: "Lainnya" }]);
  const removeRisk = (idx) => setRisks(risks.filter((_, i) => i !== idx));
  const updateRisk = (idx, field, val) =>
    setRisks(
      risks.map((r, i) =>
        i === idx ? { ...r, [field]: field === "name" || field === "category" ? val : Number(val) } : r
      )
    );

  const risksScored = useMemo(
    () =>
      risks.map((r) => {
        const score = (Number(r.probability) || 0) * (Number(r.impact) || 0);
        return { ...r, category: r.category || "Lainnya", score, zone: riskZone(score) };
      }),
    [risks]
  );

  const riskCounts = useMemo(() => {
    const counts = { Rendah: 0, Sedang: 0, Tinggi: 0, Kritis: 0 };
    risksScored.forEach((r) => {
      counts[r.zone.label] = (counts[r.zone.label] || 0) + 1;
    });
    return counts;
  }, [risksScored]);

  // --- FMEA state ---
  const [failureModes, setFailureModes] = usePersistentState("risk.failureModes", [
    { name: "Kesalahan Pengiriman Alamat", severity: 6, occurrence: 4, detection: 5 },
    { name: "Cacat Produk dari Supplier", severity: 8, occurrence: 3, detection: 4 },
    { name: "Stockout Bahan Baku Kritis", severity: 9, occurrence: 3, detection: 6 },
    { name: "Kesalahan Input Data PO", severity: 5, occurrence: 5, detection: 3 },
  ]);

  const addFailureMode = () =>
    setFailureModes([
      ...failureModes,
      { name: `Mode Kegagalan ${failureModes.length + 1}`, severity: 5, occurrence: 5, detection: 5 },
    ]);
  const removeFailureMode = (idx) => setFailureModes(failureModes.filter((_, i) => i !== idx));
  const updateFailureMode = (idx, field, val) =>
    setFailureModes(
      failureModes.map((f, i) =>
        i === idx ? { ...f, [field]: field === "name" ? val : Number(val) } : f
      )
    );

  const fmeaResults = useMemo(() => {
    return failureModes
      .map((f) => {
        const rpn =
          (Number(f.severity) || 0) * (Number(f.occurrence) || 0) * (Number(f.detection) || 0);
        let level = "Rendah";
        let color = "#4FAE7A";
        if (rpn >= 200) {
          level = "Kritis";
          color = "#E2685A";
        } else if (rpn >= 100) {
          level = "Tinggi";
          color = "#E28A3B";
        } else if (rpn >= 50) {
          level = "Sedang";
          color = "#E2A63B";
        }
        return { ...f, rpn, level, color };
      })
      .sort((a, b) => b.rpn - a.rpn);
  }, [failureModes]);

  // --- Business Continuity / Risk Exposure state ---
  const [continuityItems, setContinuityItems] = usePersistentState("risk.continuityItems", [
    { name: "Keterlambatan Supplier Utama", probPct: 60, impactRp: 400000000, mitigationPct: 40, impactVariabilityPct: 25, otifImpactPct: -8, leadTimeImpactDays: 4 },
    { name: "Bencana Alam di Jalur Distribusi", probPct: 25, impactRp: 900000000, mitigationPct: 55, impactVariabilityPct: 40, otifImpactPct: -15, leadTimeImpactDays: 7 },
    { name: "Kegagalan Sistem IT Gudang", probPct: 30, impactRp: 200000000, mitigationPct: 70, impactVariabilityPct: 20, otifImpactPct: -5, leadTimeImpactDays: 2 },
  ]);

  const addContinuityItem = () =>
    setContinuityItems([
      ...continuityItems,
      { name: `Risiko ${continuityItems.length + 1}`, probPct: 30, impactRp: 100000000, mitigationPct: 30, impactVariabilityPct: 25, otifImpactPct: -5, leadTimeImpactDays: 2 },
    ]);
  const removeContinuityItem = (idx) => setContinuityItems(continuityItems.filter((_, i) => i !== idx));
  const updateContinuityItem = (idx, field, val) =>
    setContinuityItems(
      continuityItems.map((c, i) =>
        i === idx ? { ...c, [field]: field === "name" ? val : Number(val) } : c
      )
    );

  const continuityResults = useMemo(() => {
    const items = continuityItems.map((c) => {
      const exposure = ((Number(c.probPct) || 0) / 100) * (Number(c.impactRp) || 0);
      const residual = exposure * (1 - (Number(c.mitigationPct) || 0) / 100);
      return { ...c, exposure, residual };
    });
    const totalExposure = items.reduce((a, c) => a + c.exposure, 0);
    const totalResidual = items.reduce((a, c) => a + c.residual, 0);
    const reductionPct = totalExposure > 0 ? ((totalExposure - totalResidual) / totalExposure) * 100 : 0;
    return { items, totalExposure, totalResidual, reductionPct };
  }, [continuityItems]);

  // --- Simulasi Risiko Monte Carlo ---
  const [mcIterations, setMcIterations] = usePersistentState("risk.mcIterations", 5000);
  const [mcResult, setMcResult] = useState(null);
  const [mcRunning, setMcRunning] = useState(false);

  const runMonteCarlo = () => {
    setMcRunning(true);
    // Ditunda satu tick agar UI sempat menampilkan status "menjalankan" sebelum loop sinkron berjalan
    setTimeout(() => {
      const n = Math.max(100, Math.min(20000, Number(mcIterations) || 5000));
      const losses = new Array(n);
      for (let i = 0; i < n; i++) {
        let total = 0;
        for (const c of continuityItems) {
          const prob = (Number(c.probPct) || 0) / 100;
          if (Math.random() < prob) {
            const impact = Number(c.impactRp) || 0;
            const variability = Math.max(0, Number(c.impactVariabilityPct) || 0) / 100;
            const low = impact * (1 - variability);
            const high = impact * (1 + variability);
            const sampledImpact = low + Math.random() * (high - low);
            const mitigation = (Number(c.mitigationPct) || 0) / 100;
            total += Math.max(0, sampledImpact * (1 - mitigation));
          }
        }
        losses[i] = total;
      }
      losses.sort((a, b) => a - b);
      const mean = losses.reduce((a, v) => a + v, 0) / n;
      const median = losses[Math.floor(n * 0.5)];
      const var95 = losses[Math.floor(n * 0.95)];
      const var99 = losses[Math.min(n - 1, Math.floor(n * 0.99))];
      const max = losses[n - 1];
      const probAnyLoss = losses.filter((v) => v > 0).length / n;

      const binCount = 16;
      const binSize = max > 0 ? max / binCount : 1;
      const bins = new Array(binCount).fill(0).map((_, i) => ({
        label: `${(((i * binSize) / 1000000).toFixed(0))}jt`,
        from: i * binSize,
        to: (i + 1) * binSize,
        count: 0,
      }));
      losses.forEach((v) => {
        const idx = binSize > 0 ? Math.min(binCount - 1, Math.floor(v / binSize)) : 0;
        bins[idx].count++;
      });

      setMcResult({ n, mean, median, var95, var99, max, probAnyLoss, bins });
      setMcRunning(false);
    }, 30);
  };

  // --- Skenario What-If & Dampak Berantai ---
  const [whatIfIdx, setWhatIfIdx] = usePersistentState("risk.whatIfIdx", 0);
  const [whatIfMitigated, setWhatIfMitigated] = usePersistentState("risk.whatIfMitigated", false);
  const selectedContinuityIdx = Math.min(whatIfIdx, Math.max(0, continuityItems.length - 1));
  const selectedRiskItem = continuityItems[selectedContinuityIdx] || null;

  const whatIfResult = useMemo(() => {
    if (!selectedRiskItem) return null;
    const mitigationFactor = whatIfMitigated ? 1 - (Number(selectedRiskItem.mitigationPct) || 0) / 100 : 1;
    const baselineOtif = analyticsSignal?.otifLatest ?? null;
    const baselineLeadTime = analyticsSignal?.leadTimeLatest ?? null;
    const scenarioOtif = baselineOtif != null ? Math.max(0, baselineOtif + (Number(selectedRiskItem.otifImpactPct) || 0) * mitigationFactor) : null;
    const scenarioLeadTime = baselineLeadTime != null ? Math.max(0, baselineLeadTime + (Number(selectedRiskItem.leadTimeImpactDays) || 0) * mitigationFactor) : null;
    const baseExposure = ((Number(selectedRiskItem.probPct) || 0) / 100) * (Number(selectedRiskItem.impactRp) || 0);
    const scenarioExposure = baseExposure * mitigationFactor;
    return { baselineOtif, scenarioOtif, baselineLeadTime, scenarioLeadTime, baseExposure, scenarioExposure };
  }, [selectedRiskItem, whatIfMitigated, analyticsSignal]);

  // --- Pelacak Tindakan Mitigasi ---
  const [actionItems, setActionItems] = usePersistentState("risk.actionItems", [
    {
      id: "ACT-001",
      riskName: "Keterlambatan Supplier Utama",
      action: "Kualifikasi supplier cadangan untuk komponen kritis",
      owner: "Tim Procurement",
      dueDate: "2026-10-15",
      status: "proses",
      history: [{ status: "belum", date: "2026-09-01" }, { status: "proses", date: "2026-09-10" }],
    },
    {
      id: "ACT-002",
      riskName: "Kegagalan Sistem IT Gudang",
      action: "Uji coba failover sistem WMS ke server cadangan",
      owner: "Tim IT",
      dueDate: "2026-09-20",
      status: "belum",
      history: [{ status: "belum", date: "2026-09-01" }],
    },
  ]);

  const nextActionId = () => {
    const nums = actionItems.map((a) => Number(String(a.id).replace(/\D/g, "")) || 0);
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `ACT-${String(next).padStart(3, "0")}`;
  };

  const addActionItem = () =>
    setActionItems([
      ...actionItems,
      {
        id: nextActionId(),
        riskName: continuityItems[0]?.name || "",
        action: "",
        owner: "",
        dueDate: "",
        status: "belum",
        history: [{ status: "belum", date: new Date().toISOString().slice(0, 10) }],
      },
    ]);

  const removeActionItem = (idx) => setActionItems(actionItems.filter((_, i) => i !== idx));

  const updateActionItem = (idx, field, val) =>
    setActionItems(actionItems.map((a, i) => (i === idx ? { ...a, [field]: val } : a)));

  const updateActionStatus = (idx, newStatus) =>
    setActionItems(
      actionItems.map((a, i) =>
        i === idx
          ? {
              ...a,
              status: newStatus,
              history: [...(a.history || []), { status: newStatus, date: new Date().toISOString().slice(0, 10) }],
            }
          : a
      )
    );

  const ACTION_STATUS_META = {
    belum: { label: "Belum Dimulai", color: "#9A9AA0" },
    proses: { label: "Dalam Proses", color: "#E2A63B" },
    selesai: { label: "Selesai", color: "#4FAE7A" },
  };

  const overdueActionItems = useMemo(() => {
    const today = new Date();
    return actionItems.filter((a) => a.status !== "selesai" && a.dueDate && new Date(a.dueDate) < today);
  }, [actionItems]);

  const actionStatusCounts = useMemo(() => {
    const counts = { belum: 0, proses: 0, selesai: 0 };
    actionItems.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return counts;
  }, [actionItems]);

  // --- Supply Chain Resilience Score state ---
  const [resilienceWeightsRaw, setResilienceWeights] = usePersistentState(
    "risk.resilienceWeights",
    DEFAULT_RESILIENCE_WEIGHTS
  );
  const resilienceWeights = { ...DEFAULT_RESILIENCE_WEIGHTS, ...resilienceWeightsRaw };
  const updateResilienceWeight = (key, val) =>
    setResilienceWeights({ ...resilienceWeights, [key]: Number(val) || 0 });

  // --- Risiko Supplier Multi-Tier (ditarik otomatis dari Modul 2 Procurement) ---
  const supplierRiskHighCount = supplierRiskData.filter(
    (s) => s.level === "Tinggi" || s.level === "Kritis"
  ).length;
  const supplierSingleSourceList = useMemo(
    () => supplierRiskData.filter((s) => s.spendSharePct > 30).sort((a, b) => b.spendSharePct - a.spendSharePct),
    [supplierRiskData]
  );
  const avgSupplierComposite = supplierRiskData.length
    ? supplierRiskData.reduce((a, s) => a + s.composite, 0) / supplierRiskData.length
    : 0;

  const categoryBreakdown = useMemo(() => {
    return RISK_CATEGORIES.map((cat) => {
      const items = risksScored.filter((r) => r.category === cat);
      const avgScore = items.length ? items.reduce((a, r) => a + r.score, 0) / items.length : 0;
      return { category: cat, count: items.length, avgScore, zone: riskZone(Math.round(avgScore)) };
    }).filter((c) => c.count > 0);
  }, [risksScored]);

  const resilienceResult = useMemo(() => {
    // Subskor Matriks Risiko: rata-rata skor risiko (maks 25) dibalik jadi skala ketahanan 0-100
    const avgRiskScore = risksScored.length
      ? risksScored.reduce((a, r) => a + r.score, 0) / risksScored.length
      : 0;
    const matrixScore = Math.max(0, 100 - (avgRiskScore / 25) * 100);

    // Subskor FMEA: rata-rata RPN (maks 1000) dibalik jadi skala ketahanan 0-100
    const avgRpn = fmeaResults.length
      ? fmeaResults.reduce((a, f) => a + f.rpn, 0) / fmeaResults.length
      : 0;
    const fmeaScore = Math.max(0, 100 - (avgRpn / 1000) * 100);

    // Subskor Kontinuitas: efektivitas reduksi eksposur oleh mitigasi
    const continuityScore = Math.max(0, Math.min(100, continuityResults.reductionPct));

    // Subskor Risiko Supplier: rata-rata komposit risiko supplier (skala 1-5) dari Modul 2, dibalik jadi 0-100
    const hasSupplierData = supplierRiskData.length > 0;
    const supplierScore = hasSupplierData ? Math.max(0, 100 - (avgSupplierComposite / 5) * 100) : null;

    const activeWeights = {
      matrix: Number(resilienceWeights.matrix) || 0,
      fmea: Number(resilienceWeights.fmea) || 0,
      continuity: Number(resilienceWeights.continuity) || 0,
      supplier: hasSupplierData ? Number(resilienceWeights.supplier) || 0 : 0,
    };
    const totalWeight = activeWeights.matrix + activeWeights.fmea + activeWeights.continuity + activeWeights.supplier || 1;

    const weightedScore =
      (matrixScore * activeWeights.matrix +
        fmeaScore * activeWeights.fmea +
        continuityScore * activeWeights.continuity +
        (supplierScore || 0) * activeWeights.supplier) /
      totalWeight;

    return {
      matrixScore,
      fmeaScore,
      continuityScore,
      supplierScore,
      hasSupplierData,
      totalScore: weightedScore,
      band: resilienceBand(weightedScore),
    };
  }, [risksScored, fmeaResults, continuityResults, resilienceWeights, supplierRiskData, avgSupplierComposite]);

  useReportSync("risk", {
    totalRisks: risksScored.length,
    riskCounts,
    topFmea: fmeaResults[0]?.name,
    topFmeaRpn: fmeaResults[0]?.rpn,
    totalResidual: continuityResults.totalResidual,
    resilienceScore: resilienceResult.totalScore,
    resilienceBand: resilienceResult.band.label,
  });

  const tabs = [
    { id: "resilience", label: "Skor Ketahanan" },
    { id: "matrix", label: "Matriks Risiko" },
    { id: "supplierTier", label: "Risiko Supplier" },
    { id: "fmea", label: "FMEA" },
    { id: "continuity", label: "Rencana Kontinuitas" },
    { id: "montecarlo", label: "Simulasi Monte Carlo" },
    { id: "whatif", label: "Skenario What-If" },
    { id: "actions", label: "Tindakan Mitigasi" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ModuleTabs tabs={tabs} tab={tab} setTab={setTab} accent={accent} />

      {tab === "resilience" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <SectionCard
            title="Skor Ketahanan Rantai Pasok"
            subtitle="Gabungan dari Matriks Risiko, FMEA, dan Rencana Kontinuitas"
            accent={accent}
          >
            <div
              className="mb-4 flex flex-col items-center justify-center gap-1 rounded-2xl py-6"
              style={{ backgroundColor: `${resilienceResult.band.color}18` }}
            >
              <p
                className="text-4xl font-semibold tracking-tight"
                style={{ color: resilienceResult.band.color, fontVariantNumeric: "tabular-nums" }}
              >
                {resilienceResult.totalScore.toFixed(0)}
              </p>
              <span
                className="rounded-full px-3 py-0.5 text-[11px] font-medium"
                style={{ backgroundColor: `${resilienceResult.band.color}22`, color: resilienceResult.band.color }}
              >
                {resilienceResult.band.label}
              </span>
            </div>

            <div className="mb-4 space-y-2">
              {RESILIENCE_BANDS.map((b, i) => {
                const nextMin = RESILIENCE_BANDS[i + 1]?.min ?? 100;
                return (
                  <div key={b.label} className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: `${b.color}22` }}>
                      <div className="h-full rounded-full" style={{ width: "100%", backgroundColor: `${b.color}55` }} />
                    </div>
                    <span className="w-24 text-right text-[10px]" style={{ color: "#9A9AA0" }}>
                      {b.label} ({b.min}–{nextMin === 100 ? 100 : nextMin - 1})
                    </span>
                  </div>
                );
              })}
              <p className="pt-1 text-[10px]" style={{ color: "#B5B5B9" }}>
                Skala benchmark internal 0–100 (bukan data industri eksternal).
              </p>
            </div>

            <p className="mb-2 text-xs font-medium" style={{ color: "#4B4B4F" }}>
              Bobot Subskor
            </p>
            <div className="space-y-2">
              {[
                { key: "matrix", label: "Matriks Risiko" },
                { key: "fmea", label: "FMEA" },
                { key: "continuity", label: "Rencana Kontinuitas" },
                { key: "supplier", label: "Risiko Supplier (Modul 2)" },
              ].map((w) => (
                <div key={w.key} className="flex items-center gap-2">
                  <FieldLabel>{w.label}</FieldLabel>
                  <div className="ml-auto w-24">
                    <NumberInput
                      value={resilienceWeights[w.key]}
                      onChange={(v) => updateResilienceWeight(w.key, v)}
                      suffix="%"
                      min={0}
                      max={100}
                      disabled={w.key === "supplier" && !resilienceResult.hasSupplierData}
                    />
                  </div>
                </div>
              ))}
              {!resilienceResult.hasSupplierData && (
                <p className="text-[10px]" style={{ color: "#B5B5B9" }}>
                  Bobot risiko supplier nonaktif — belum ada data supplier di Modul 2 (Procurement).
                </p>
              )}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <ResultStat
                accent={accent}
                label="Subskor Matriks Risiko"
                value={resilienceResult.matrixScore.toFixed(0)}
              />
              <ResultStat accent={accent} label="Subskor FMEA" value={resilienceResult.fmeaScore.toFixed(0)} />
              <ResultStat
                accent={accent}
                label="Subskor Kontinuitas"
                value={resilienceResult.continuityScore.toFixed(0)}
              />
              <ResultStat
                accent={accent}
                label="Subskor Risiko Supplier"
                value={resilienceResult.hasSupplierData ? resilienceResult.supplierScore.toFixed(0) : "—"}
              />
            </div>

            <SectionCard
              title="Breakdown per Kategori Risiko"
              subtitle="Rata-rata skor risiko (probabilitas × dampak) per kategori"
              accent={accent}
            >
              {categoryBreakdown.length === 0 ? (
                <p className="text-xs" style={{ color: "#9A9AA0" }}>
                  Belum ada risiko dengan kategori pada Matriks Risiko.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {categoryBreakdown.map((c) => (
                    <div key={c.category} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-xs font-medium">{c.category}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.05)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(c.avgScore / 25) * 100}%`, backgroundColor: c.zone.color }}
                        />
                      </div>
                      <span className="w-10 text-right text-[11px] font-medium" style={{ color: c.zone.color }}>
                        {c.avgScore.toFixed(1)}
                      </span>
                      <span className="w-16 text-right text-[10px]" style={{ color: "#9A9AA0" }}>
                        {c.count} risiko
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Interpretasi" accent={accent}>
              <p className="text-xs leading-relaxed" style={{ color: "#4B4B4F" }}>
                Skor ketahanan rantai pasok saat ini berada pada level{" "}
                <span className="font-semibold" style={{ color: resilienceResult.band.color }}>
                  {resilienceResult.band.label}
                </span>{" "}
                ({resilienceResult.totalScore.toFixed(0)}/100). Subskor terendah adalah{" "}
                {(() => {
                  const subs = [
                    { label: "Matriks Risiko", value: resilienceResult.matrixScore },
                    { label: "FMEA", value: resilienceResult.fmeaScore },
                    { label: "Rencana Kontinuitas", value: resilienceResult.continuityScore },
                    ...(resilienceResult.hasSupplierData
                      ? [{ label: "Risiko Supplier", value: resilienceResult.supplierScore }]
                      : []),
                  ].sort((a, b) => a.value - b.value)[0];
                  return `"${subs.label}" (${subs.value.toFixed(0)})`;
                })()}
                {" "}— area ini layak menjadi prioritas perbaikan berikutnya. Sesuaikan bobot subskor di kiri sesuai
                prioritas strategis organisasi Anda.
              </p>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "matrix" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <SectionCard title="Daftar Risiko" subtitle="Probabilitas & dampak skala 1–5" accent={accent}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: "#4B4B4F" }}>
                Risiko Teridentifikasi
              </p>
              <button
                onClick={addRisk}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah
              </button>
            </div>

            <div className="max-h-[440px] space-y-3 overflow-y-auto pr-1">
              {risksScored.map((r, i) => (
                <div key={i} className="rounded-xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.6)" }}>
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      value={r.name}
                      onChange={(e) => updateRisk(i, "name", e.target.value)}
                      className="flex-1 rounded-lg px-2 py-1.5 text-xs font-medium outline-none"
                      style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                    />
                    <button onClick={() => removeRisk(i)}>
                      <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                    </button>
                  </div>
                  <div className="mb-2">
                    <FieldLabel>Kategori</FieldLabel>
                    <select
                      value={r.category}
                      onChange={(e) => updateRisk(i, "category", e.target.value)}
                      className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                      style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                    >
                      {RISK_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <FieldLabel>Probabilitas</FieldLabel>
                      <NumberInput value={r.probability} onChange={(v) => updateRisk(i, "probability", v)} min={1} max={5} />
                    </div>
                    <div>
                      <FieldLabel>Dampak</FieldLabel>
                      <NumberInput value={r.impact} onChange={(v) => updateRisk(i, "impact", v)} min={1} max={5} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: `${r.zone.color}22`, color: r.zone.color }}
                    >
                      {r.zone.label}
                    </span>
                    <span className="text-[11px]" style={{ color: "#9A9AA0" }}>
                      Skor: {r.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-3">
              {RISK_ZONES.map((z) => (
                <ResultStat accent={accent} key={z.label} label={z.label} value={riskCounts[z.label] || 0} />
              ))}
            </div>

            <SectionCard title="Grid Probabilitas × Dampak" accent={accent}>
              <div className="flex gap-2">
                <div className="flex flex-col justify-between py-1 text-[10px]" style={{ color: "#9A9AA0" }}>
                  {[5, 4, 3, 2, 1].map((v) => (
                    <div key={v} className="flex h-20 items-center">
                      {v}
                    </div>
                  ))}
                </div>
                <div className="grid flex-1 grid-cols-5 gap-1.5">
                  {[5, 4, 3, 2, 1].map((impact) =>
                    [1, 2, 3, 4, 5].map((prob) => {
                      const score = impact * prob;
                      const zone = riskZone(score);
                      const cellRisks = risksScored.filter(
                        (r) => Number(r.probability) === prob && Number(r.impact) === impact
                      );
                      return (
                        <div
                          key={`${impact}-${prob}`}
                          className="flex h-20 flex-col items-center justify-center gap-0.5 rounded-lg p-1 text-center"
                          style={{ backgroundColor: `${zone.color}${cellRisks.length ? "33" : "18"}` }}
                        >
                          {cellRisks.length > 0 ? (
                            cellRisks.slice(0, 2).map((r, i) => (
                              <p key={i} className="text-[9px] font-medium leading-tight" style={{ color: zone.color }}>
                                {r.name.length > 14 ? r.name.slice(0, 14) + "…" : r.name}
                              </p>
                            ))
                          ) : (
                            <span className="text-[10px]" style={{ color: `${zone.color}88` }}>
                              {score}
                            </span>
                          )}
                          {cellRisks.length > 2 && (
                            <p className="text-[9px]" style={{ color: zone.color }}>
                              +{cellRisks.length - 2} lagi
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="mt-2 flex justify-center gap-8 pl-6 text-[10px]" style={{ color: "#9A9AA0" }}>
                <span>Dampak (sumbu Y) →</span>
                <span>Probabilitas (sumbu X) →</span>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "supplierTier" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
          <SectionCard
            title="Peta Risiko Multi-Tier Supplier"
            subtitle="Ditarik otomatis dari Modul 2 (Procurement) — Data Supplier & Evaluasi"
            accent={accent}
          >
            {supplierRiskData.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <ShieldAlert size={24} style={{ color: "#C7C7CC" }} />
                <p className="text-xs" style={{ color: "#9A9AA0" }}>
                  Belum ada data supplier. Buka Modul 2 (Procurement) → tab "Data Supplier" dan isi minimal satu
                  supplier untuk mengaktifkan integrasi ini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      {["Supplier", "Kategori", "Pangsa Belanja", "Risiko Komposit", "Level"].map((h) => (
                        <th key={h} className="whitespace-nowrap px-2.5 py-2 text-left font-medium" style={{ color: "#8A8A8E" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {supplierRiskData.map((s) => {
                      const zone = riskZone(Math.round((s.composite / 5) * 25));
                      return (
                        <tr key={s.id} style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                          <td className="px-2.5 py-2 font-medium">{s.name}</td>
                          <td className="px-2.5 py-2" style={{ color: "#8A8A8E" }}>
                            {s.category}
                          </td>
                          <td className="px-2.5 py-2">{s.spendSharePct}%</td>
                          <td className="px-2.5 py-2">{s.composite.toFixed(2)}</td>
                          <td className="px-2.5 py-2">
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                              style={{ backgroundColor: `${zone.color}22`, color: zone.color }}
                            >
                              {s.level}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultStat accent={accent} label="Supplier Risiko Tinggi/Kritis" value={supplierRiskHighCount} highlight={supplierRiskHighCount > 0} />
              <ResultStat accent={accent} label="Ketergantungan Single-Source" value={supplierSingleSourceList.length} />
            </div>

            <SectionCard
              title="Ketergantungan Single-Source"
              subtitle="Supplier dengan pangsa belanja > 30%"
              accent={accent}
            >
              {supplierSingleSourceList.length === 0 ? (
                <p className="text-xs" style={{ color: "#9A9AA0" }}>
                  Tidak ada supplier dengan konsentrasi belanja berisiko tinggi saat ini.
                </p>
              ) : (
                <div className="space-y-2">
                  {supplierSingleSourceList.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-xl p-2.5"
                      style={{ backgroundColor: "rgba(255,255,255,0.6)" }}
                    >
                      <div>
                        <p className="text-xs font-medium">{s.name}</p>
                        <p className="text-[10px]" style={{ color: "#9A9AA0" }}>
                          {s.category}
                        </p>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: "#E28A3B" }}>
                        {s.spendSharePct}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <p className="text-[10px] leading-relaxed" style={{ color: "#B5B5B9" }}>
              Data ini bersifat baca-saja di Modul 7 — untuk mengubahnya, edit langsung di Modul 2 (Procurement),
              tab "Data Supplier". Perubahan akan otomatis tersinkron ke sini dan ke Skor Ketahanan.
            </p>
          </div>
        </div>
      )}

      {tab === "fmea" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <SectionCard title="Mode Kegagalan" subtitle="Severity, Occurrence, Detection — skala 1–10" accent={accent}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: "#4B4B4F" }}>
                Daftar Mode Kegagalan
              </p>
              <button
                onClick={addFailureMode}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah
              </button>
            </div>

            <div className="max-h-[440px] space-y-3 overflow-y-auto pr-1">
              {failureModes.map((f, i) => (
                <div key={i} className="rounded-xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.6)" }}>
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      value={f.name}
                      onChange={(e) => updateFailureMode(i, "name", e.target.value)}
                      className="flex-1 rounded-lg px-2 py-1.5 text-xs font-medium outline-none"
                      style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                    />
                    <button onClick={() => removeFailureMode(i)}>
                      <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <FieldLabel>Severity</FieldLabel>
                      <NumberInput value={f.severity} onChange={(v) => updateFailureMode(i, "severity", v)} min={1} max={10} />
                    </div>
                    <div>
                      <FieldLabel>Occurrence</FieldLabel>
                      <NumberInput value={f.occurrence} onChange={(v) => updateFailureMode(i, "occurrence", v)} min={1} max={10} />
                    </div>
                    <div>
                      <FieldLabel>Detection</FieldLabel>
                      <NumberInput value={f.detection} onChange={(v) => updateFailureMode(i, "detection", v)} min={1} max={10} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Peringkat RPN" subtitle="Diurutkan dari prioritas tertinggi" accent={accent}>
            <div className="space-y-2">
              {fmeaResults.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl p-3.5"
                  style={{ backgroundColor: i === 0 ? `${f.color}18` : "rgba(255,255,255,0.6)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                      style={{ backgroundColor: `${f.color}22`, color: f.color }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{f.name}</p>
                      <p className="text-[11px]" style={{ color: "#9A9AA0" }}>
                        S{f.severity} × O{f.occurrence} × D{f.detection}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold tracking-tight" style={{ color: f.color }}>
                      {f.rpn}
                    </p>
                    <p className="text-[10px]" style={{ color: f.color }}>
                      {f.level}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {tab === "continuity" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[420px_1fr]">
          <SectionCard title="Eksposur Risiko & Mitigasi" subtitle="Kuantifikasi risiko ke nilai finansial" accent={accent}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: "#4B4B4F" }}>
                Risiko Prioritas
              </p>
              <button
                onClick={addContinuityItem}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah
              </button>
            </div>

            <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
              {continuityItems.map((c, i) => (
                <div key={i} className="rounded-xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.6)" }}>
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      value={c.name}
                      onChange={(e) => updateContinuityItem(i, "name", e.target.value)}
                      className="flex-1 rounded-lg px-2 py-1.5 text-xs font-medium outline-none"
                      style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                    />
                    <button onClick={() => removeContinuityItem(i)}>
                      <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <FieldLabel>Probabilitas</FieldLabel>
                      <NumberInput value={c.probPct} onChange={(v) => updateContinuityItem(i, "probPct", v)} suffix="%" />
                    </div>
                    <div>
                      <FieldLabel>Dampak (estimasi tengah)</FieldLabel>
                      <NumberInput value={c.impactRp} onChange={(v) => updateContinuityItem(i, "impactRp", v)} suffix="Rp" />
                    </div>
                    <div>
                      <FieldLabel hint="Perkiraan efektivitas rencana mitigasi">Mitigasi</FieldLabel>
                      <NumberInput value={c.mitigationPct} onChange={(v) => updateContinuityItem(i, "mitigationPct", v)} suffix="%" />
                    </div>
                    <div>
                      <FieldLabel hint="Rentang naik-turun dampak di sekitar estimasi tengah, dipakai Simulasi Monte Carlo">
                        Variabilitas Dampak
                      </FieldLabel>
                      <NumberInput
                        value={c.impactVariabilityPct}
                        onChange={(v) => updateContinuityItem(i, "impactVariabilityPct", v)}
                        suffix="%"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <ResultStat accent={accent} label="Total Eksposur Awal" value={`Rp ${Math.round(continuityResults.totalExposure).toLocaleString("id-ID")}`} />
              <ResultStat accent={accent} label="Sisa Eksposur Setelah Mitigasi" value={`Rp ${Math.round(continuityResults.totalResidual).toLocaleString("id-ID")}`} />
              <ResultStat accent={accent} label="Reduksi Risiko" value={continuityResults.reductionPct.toFixed(1)} unit="%" highlight />
            </div>

            <SectionCard title="Rincian per Risiko" accent={accent}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      {["Risiko", "Eksposur Awal", "Mitigasi", "Sisa Eksposur"].map((h) => (
                        <th key={h} className="whitespace-nowrap px-2.5 py-2 text-left font-medium" style={{ color: "#8A8A8E" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {continuityResults.items.map((c, i) => (
                      <tr key={i} style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                        <td className="px-2.5 py-2 font-medium">{c.name}</td>
                        <td className="px-2.5 py-2">Rp {Math.round(c.exposure).toLocaleString("id-ID")}</td>
                        <td className="px-2.5 py-2">{c.mitigationPct}%</td>
                        <td className="px-2.5 py-2 font-medium" style={{ color: accent }}>
                          Rp {Math.round(c.residual).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "montecarlo" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr]">
          <SectionCard
            title="Pengaturan Simulasi"
            subtitle="Berdasarkan data Rencana Kontinuitas"
            accent={accent}
          >
            <div className="mb-3">
              <FieldLabel hint="Jumlah iterasi acak yang dijalankan. Makin banyak, makin stabil hasilnya tapi makin lama diproses.">
                Jumlah Iterasi
              </FieldLabel>
              <select
                value={mcIterations}
                onChange={(e) => setMcIterations(Number(e.target.value))}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
              >
                {[1000, 5000, 10000, 20000].map((v) => (
                  <option key={v} value={v}>
                    {v.toLocaleString("id-ID")} iterasi
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={runMonteCarlo}
              disabled={mcRunning || continuityItems.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
              style={{ backgroundColor: accent, color: "#fff", opacity: mcRunning ? 0.6 : 1 }}
            >
              <Sparkles size={14} />
              {mcRunning ? "Menjalankan Simulasi…" : "Jalankan Simulasi"}
            </button>

            {continuityItems.length === 0 && (
              <p className="mt-2 text-[10px]" style={{ color: "#B5B5B9" }}>
                Isi minimal satu risiko di tab "Rencana Kontinuitas" terlebih dahulu.
              </p>
            )}

            <div className="mt-4 space-y-2 text-[11px] leading-relaxed" style={{ color: "#8A8A8E" }}>
              <p>
                Setiap iterasi mensimulasikan apakah masing-masing risiko terjadi (berdasarkan probabilitasnya),
                lalu mengambil sampel besar dampak finansial dalam rentang Variabilitas Dampak, dikurangi
                efektivitas mitigasi.
              </p>
              <p style={{ color: "#B5B5B9" }}>
                Asumsi: setiap risiko terjadi independen satu sama lain (tidak memodelkan korelasi antar-risiko).
              </p>
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            {!mcResult ? (
              <SectionCard title="Hasil Simulasi" accent={accent}>
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <Calculator size={24} style={{ color: "#C7C7CC" }} />
                  <p className="text-xs" style={{ color: "#9A9AA0" }}>
                    Jalankan simulasi untuk melihat distribusi probabilitas kerugian gabungan.
                  </p>
                </div>
              </SectionCard>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                  <ResultStat
                    accent={accent}
                    label="Ekspektasi Kerugian (Mean)"
                    value={`Rp ${Math.round(mcResult.mean / 1000000).toLocaleString("id-ID")}jt`}
                  />
                  <ResultStat
                    accent={accent}
                    label="Median Kerugian"
                    value={`Rp ${Math.round(mcResult.median / 1000000).toLocaleString("id-ID")}jt`}
                  />
                  <ResultStat
                    accent={accent}
                    label="Probabilitas Ada Kerugian"
                    value={(mcResult.probAnyLoss * 100).toFixed(1)}
                    unit="%"
                  />
                  <ResultStat
                    accent={accent}
                    label="Value at Risk 95%"
                    value={`Rp ${Math.round(mcResult.var95 / 1000000).toLocaleString("id-ID")}jt`}
                    highlight
                  />
                  <ResultStat
                    accent={accent}
                    label="Value at Risk 99%"
                    value={`Rp ${Math.round(mcResult.var99 / 1000000).toLocaleString("id-ID")}jt`}
                  />
                  <ResultStat
                    accent={accent}
                    label="Kerugian Maksimum (simulasi)"
                    value={`Rp ${Math.round(mcResult.max / 1000000).toLocaleString("id-ID")}jt`}
                  />
                </div>

                <SectionCard
                  title="Distribusi Kerugian"
                  subtitle={`Histogram dari ${mcResult.n.toLocaleString("id-ID")} iterasi (nilai dalam juta Rupiah)`}
                  accent={accent}
                >
                  <div style={{ width: "100%", height: 220 }}>
                    <ResponsiveContainer>
                      <BarChart data={mcResult.bins}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8A8A8E" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#8A8A8E" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255,255,255,0.92)",
                            border: "1px solid rgba(255,255,255,0.7)",
                            borderRadius: 12,
                            boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                            fontSize: 12,
                          }}
                          formatter={(value) => [`${value} iterasi`, "Frekuensi"]}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {mcResult.bins.map((bin, i) => (
                            <Cell
                              key={i}
                              fill={bin.from <= mcResult.var95 && mcResult.var95 < bin.to ? "#E2685A" : `${accent}66`}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed" style={{ color: "#8A8A8E" }}>
                    Batang merah menandai posisi VaR 95% — artinya dalam 95% skenario simulasi, kerugian gabungan
                    berada di bawah nilai tersebut. Sisanya (5% skenario terburuk) melebihi angka ini, sehingga
                    layak dijadikan acuan cadangan risiko (risk reserve) yang lebih realistis dibanding estimasi
                    titik tunggal pada Rencana Kontinuitas.
                  </p>
                </SectionCard>
              </>
            )}
          </div>
        </div>
      )}

      {tab === "whatif" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_1fr]">
          <SectionCard title="Pilih Risiko" subtitle="Sumber: daftar Rencana Kontinuitas" accent={accent}>
            {continuityItems.length === 0 ? (
              <p className="text-xs" style={{ color: "#9A9AA0" }}>
                Isi minimal satu risiko di tab "Rencana Kontinuitas" terlebih dahulu.
              </p>
            ) : (
              <>
                <div className="mb-4 flex flex-col gap-1.5">
                  {continuityItems.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setWhatIfIdx(i)}
                      className="rounded-xl px-3 py-2 text-left text-xs font-medium"
                      style={{
                        backgroundColor: selectedContinuityIdx === i ? `${accent}22` : "rgba(255,255,255,0.6)",
                        color: selectedContinuityIdx === i ? accent : "#4B4B4F",
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>

                <FieldLabel hint="Bandingkan dampak jika rencana mitigasi risiko ini dijalankan atau tidak">
                  Kondisi Skenario
                </FieldLabel>
                <div className="mb-4 flex gap-1.5">
                  <button
                    onClick={() => setWhatIfMitigated(false)}
                    className="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium"
                    style={{
                      backgroundColor: !whatIfMitigated ? "rgba(226,104,90,0.15)" : "rgba(255,255,255,0.6)",
                      color: !whatIfMitigated ? "#E2685A" : "#8A8A8E",
                    }}
                  >
                    Tanpa Mitigasi
                  </button>
                  <button
                    onClick={() => setWhatIfMitigated(true)}
                    className="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium"
                    style={{
                      backgroundColor: whatIfMitigated ? `${accent}22` : "rgba(255,255,255,0.6)",
                      color: whatIfMitigated ? accent : "#8A8A8E",
                    }}
                  >
                    Dengan Mitigasi
                  </button>
                </div>

                {selectedRiskItem && (
                  <>
                    <p className="mb-2 text-xs font-medium" style={{ color: "#4B4B4F" }}>
                      Asumsi Dampak Berantai
                    </p>
                    <div className="space-y-3">
                      <div>
                        <FieldLabel hint="Perkiraan penurunan OTIF (poin persentase) jika risiko ini terjadi, sebelum faktor mitigasi">
                          Dampak ke OTIF
                        </FieldLabel>
                        <NumberInput
                          value={selectedRiskItem.otifImpactPct}
                          onChange={(v) => updateContinuityItem(selectedContinuityIdx, "otifImpactPct", v)}
                          suffix="poin %"
                        />
                      </div>
                      <div>
                        <FieldLabel hint="Perkiraan tambahan Lead Time (hari) jika risiko ini terjadi, sebelum faktor mitigasi">
                          Dampak ke Lead Time
                        </FieldLabel>
                        <NumberInput
                          value={selectedRiskItem.leadTimeImpactDays}
                          onChange={(v) => updateContinuityItem(selectedContinuityIdx, "leadTimeImpactDays", v)}
                          suffix="hari"
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </SectionCard>

          <div className="flex flex-col gap-4">
            {!whatIfResult ? (
              <SectionCard title="Dampak Skenario" accent={accent}>
                <p className="text-xs" style={{ color: "#9A9AA0" }}>
                  Pilih risiko di sebelah kiri untuk melihat proyeksi dampaknya.
                </p>
              </SectionCard>
            ) : (
              <>
                <SectionCard
                  title="Perbandingan Baseline vs Skenario"
                  subtitle={`Jika "${selectedRiskItem.name}" terjadi — ${whatIfMitigated ? "dengan" : "tanpa"} mitigasi`}
                  accent={accent}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr style={{ color: "#8A8A8E" }}>
                          <th className="pb-2 pr-3 font-medium">Metrik</th>
                          <th className="pb-2 pr-3 font-medium">Baseline</th>
                          <th className="pb-2 pr-3 font-medium">Skenario</th>
                          <th className="pb-2 font-medium">Perubahan</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                          <td className="py-2 pr-3 font-medium" style={{ color: "#1D1D1F" }}>
                            OTIF (Modul 6 — Digital Analytics)
                          </td>
                          <td className="py-2 pr-3" style={{ fontVariantNumeric: "tabular-nums" }}>
                            {whatIfResult.baselineOtif != null ? `${whatIfResult.baselineOtif}%` : "— (belum ada data)"}
                          </td>
                          <td className="py-2 pr-3 font-semibold" style={{ color: accent, fontVariantNumeric: "tabular-nums" }}>
                            {whatIfResult.scenarioOtif != null ? `${whatIfResult.scenarioOtif.toFixed(1)}%` : "—"}
                          </td>
                          <td className="py-2">
                            {whatIfResult.baselineOtif != null && (
                              <DeltaBadge base={whatIfResult.baselineOtif} scenario={whatIfResult.scenarioOtif} lowerIsBetter={false} />
                            )}
                          </td>
                        </tr>
                        <tr style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                          <td className="py-2 pr-3 font-medium" style={{ color: "#1D1D1F" }}>
                            Lead Time Rata-rata (Modul 6)
                          </td>
                          <td className="py-2 pr-3" style={{ fontVariantNumeric: "tabular-nums" }}>
                            {whatIfResult.baselineLeadTime != null ? `${whatIfResult.baselineLeadTime} hari` : "— (belum ada data)"}
                          </td>
                          <td className="py-2 pr-3 font-semibold" style={{ color: accent, fontVariantNumeric: "tabular-nums" }}>
                            {whatIfResult.scenarioLeadTime != null ? `${whatIfResult.scenarioLeadTime.toFixed(1)} hari` : "—"}
                          </td>
                          <td className="py-2">
                            {whatIfResult.baselineLeadTime != null && (
                              <DeltaBadge base={whatIfResult.baselineLeadTime} scenario={whatIfResult.scenarioLeadTime} lowerIsBetter />
                            )}
                          </td>
                        </tr>
                        <tr style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                          <td className="py-2 pr-3 font-medium" style={{ color: "#1D1D1F" }}>
                            Eksposur Finansial Risiko Ini
                          </td>
                          <td className="py-2 pr-3" style={{ fontVariantNumeric: "tabular-nums" }}>
                            Rp {Math.round(whatIfResult.baseExposure).toLocaleString("id-ID")}
                          </td>
                          <td className="py-2 pr-3 font-semibold" style={{ color: accent, fontVariantNumeric: "tabular-nums" }}>
                            Rp {Math.round(whatIfResult.scenarioExposure).toLocaleString("id-ID")}
                          </td>
                          <td className="py-2">
                            <DeltaBadge base={whatIfResult.baseExposure} scenario={whatIfResult.scenarioExposure} lowerIsBetter />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {(whatIfResult.baselineOtif == null || whatIfResult.baselineLeadTime == null) && (
                    <p className="mt-3 text-[11px]" style={{ color: "#B5B5B9" }}>
                      Baseline OTIF/Lead Time belum tersedia — isi data tren di Modul 6 (Digital Analytics) tab
                      "Tren Multi-Periode" agar perbandingan ini terisi.
                    </p>
                  )}
                </SectionCard>

                <SectionCard title="Catatan Dampak Lanjutan" accent={accent}>
                  <p className="text-xs leading-relaxed" style={{ color: "#4B4B4F" }}>
                    Proyeksi ini adalah estimasi berbasis asumsi (bukan kalkulasi ulang otomatis lintas modul).
                    Untuk melihat efek keterlambatan/gangguan terhadap rute distribusi dan alokasi gudang secara
                    lebih rinci, gunakan tab "Skenario What-If" pada Modul 4 (Network Design) dengan menaikkan
                    parameter demand atau menonaktifkan simpul jaringan yang relevan secara manual.
                  </p>
                </SectionCard>
              </>
            )}
          </div>
        </div>
      )}

      {tab === "actions" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_300px]">
          <SectionCard
            title="Pelacak Tindakan Mitigasi"
            subtitle="Pemilik, tenggat waktu, dan status eksekusi rencana mitigasi"
            accent={accent}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: "#4B4B4F" }}>
                Daftar Tindakan
              </p>
              <button
                onClick={addActionItem}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah
              </button>
            </div>

            <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
              {actionItems.map((a, i) => {
                const isOverdue = a.status !== "selesai" && a.dueDate && new Date(a.dueDate) < new Date();
                const meta = ACTION_STATUS_META[a.status] || ACTION_STATUS_META.belum;
                return (
                  <div
                    key={a.id}
                    className="rounded-xl p-3.5"
                    style={{
                      backgroundColor: isOverdue ? "rgba(226,104,90,0.08)" : "rgba(255,255,255,0.6)",
                      boxShadow: isOverdue ? "inset 0 0 0 1px rgba(226,104,90,0.35)" : "none",
                    }}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <select
                          value={a.riskName}
                          onChange={(e) => updateActionItem(i, "riskName", e.target.value)}
                          className="mb-1.5 w-full rounded-lg px-2 py-1 text-[11px] font-medium outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.8)", color: accent }}
                        >
                          <option value="">— Pilih Risiko Terkait —</option>
                          {continuityItems.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <input
                          value={a.action}
                          onChange={(e) => updateActionItem(i, "action", e.target.value)}
                          placeholder="Deskripsi tindakan mitigasi"
                          className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                        />
                      </div>
                      <button onClick={() => removeActionItem(i)} className="mt-1 shrink-0">
                        <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                      </button>
                    </div>

                    <div className="mb-2 grid grid-cols-2 gap-2">
                      <div>
                        <FieldLabel>Penanggung Jawab</FieldLabel>
                        <input
                          value={a.owner}
                          onChange={(e) => updateActionItem(i, "owner", e.target.value)}
                          placeholder="Nama / tim"
                          className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                        />
                      </div>
                      <div>
                        <FieldLabel>Tenggat Waktu</FieldLabel>
                        <input
                          type="date"
                          value={a.dueDate}
                          onChange={(e) => updateActionItem(i, "dueDate", e.target.value)}
                          className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5">
                        {Object.entries(ACTION_STATUS_META).map(([key, m]) => (
                          <button
                            key={key}
                            onClick={() => updateActionStatus(i, key)}
                            className="rounded-lg px-2 py-1 text-[10px] font-medium"
                            style={{
                              backgroundColor: a.status === key ? `${m.color}22` : "rgba(0,0,0,0.04)",
                              color: a.status === key ? m.color : "#9A9AA0",
                            }}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                      {isOverdue && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#E2685A" }}>
                          <AlertTriangle size={11} /> Lewat Tenggat
                        </span>
                      )}
                    </div>

                    {a.history && a.history.length > 0 && (
                      <div className="mt-2 border-t pt-2" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                        <p className="mb-1 text-[10px] font-medium" style={{ color: "#B5B5B9" }}>
                          Riwayat Status
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {a.history.map((h, hi) => (
                            <span
                              key={hi}
                              className="rounded-full px-2 py-0.5 text-[9px]"
                              style={{
                                backgroundColor: `${(ACTION_STATUS_META[h.status] || ACTION_STATUS_META.belum).color}18`,
                                color: (ACTION_STATUS_META[h.status] || ACTION_STATUS_META.belum).color,
                              }}
                            >
                              {(ACTION_STATUS_META[h.status] || ACTION_STATUS_META.belum).label} · {h.date}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {actionItems.length === 0 && (
                <p className="py-8 text-center text-xs" style={{ color: "#9A9AA0" }}>
                  Belum ada tindakan mitigasi. Klik "Tambah" untuk membuat yang pertama.
                </p>
              )}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3">
              <ResultStat accent={accent} label="Total Tindakan" value={actionItems.length} />
              <ResultStat
                accent={accent}
                label="Lewat Tenggat"
                value={overdueActionItems.length}
                highlight={overdueActionItems.length > 0}
              />
              <ResultStat accent={accent} label="Belum Dimulai" value={actionStatusCounts.belum || 0} />
              <ResultStat accent={accent} label="Dalam Proses" value={actionStatusCounts.proses || 0} />
              <ResultStat accent={accent} label="Selesai" value={actionStatusCounts.selesai || 0} />
            </div>

            {overdueActionItems.length > 0 && (
              <SectionCard title="Perlu Perhatian Segera" accent={accent}>
                <div className="space-y-2">
                  {overdueActionItems.map((a) => (
                    <div key={a.id} className="rounded-xl p-2.5" style={{ backgroundColor: "rgba(226,104,90,0.1)" }}>
                      <p className="text-xs font-medium" style={{ color: "#1D1D1F" }}>
                        {a.action || "(Belum ada deskripsi)"}
                      </p>
                      <p className="text-[10px]" style={{ color: "#9A9AA0" }}>
                        {a.riskName || "—"} · Tenggat: {a.dueDate} · PIC: {a.owner || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Module 8: Sustainability / Green Supply Chain ----------

const SUSTAINABILITY_BANDS = [
  { min: 0, label: "Perlu Perbaikan", color: "#E2685A" },
  { min: 40, label: "Sedang", color: "#E2A63B" },
  { min: 60, label: "Baik", color: "#4C86D6" },
  { min: 80, label: "Unggul", color: "#4FAE7A" },
];

function sustainabilityBand(score) {
  return [...SUSTAINABILITY_BANDS].reverse().find((b) => score >= b.min) || SUSTAINABILITY_BANDS[0];
}

// Ambang batas intensitas emisi (kg CO2e per ton-km) untuk menilai subskor Jejak Karbon.
// 0 = tidak ada emisi (skor 100), >= INTENSITY_WORST = didominasi moda intensif emisi (skor 0).
const CARBON_INTENSITY_WORST = 0.15;

const DEFAULT_SUSTAINABILITY_WEIGHTS = { carbon: 40, reverse: 30, circularity: 30 };

// Asumsi biaya (Rp/ton-km) dan kecepatan rata-rata (km/jam) per moda untuk simulasi trade-off pergeseran moda.
const MODE_COST_FACTORS = { truck: 2500, train: 1500, ship: 900, air: 12000 };
const MODE_TRANSIT_SPEED_KMH = { truck: 60, train: 40, ship: 20, air: 700 };

function computeLogisticsMetrics(shipmentList) {
  let totalEmission = 0;
  let totalCost = 0;
  let totalTonKm = 0;
  let transitWeighted = 0;
  shipmentList.forEach((s) => {
    const distance = Number(s.distance) || 0;
    const weight = Number(s.weight) || 0;
    const tonKm = distance * weight;
    const emissionFactor = (EMISSION_FACTORS.find((f) => f.id === s.mode) || EMISSION_FACTORS[0]).factor;
    const costFactor = MODE_COST_FACTORS[s.mode] ?? MODE_COST_FACTORS.truck;
    const speed = MODE_TRANSIT_SPEED_KMH[s.mode] ?? MODE_TRANSIT_SPEED_KMH.truck;
    totalEmission += tonKm * emissionFactor;
    totalCost += tonKm * costFactor;
    totalTonKm += tonKm;
    transitWeighted += (distance / speed / 24) * tonKm;
  });
  const avgTransitDays = totalTonKm > 0 ? transitWeighted / totalTonKm : 0;
  return { totalEmission, totalCost, totalTonKm, avgTransitDays };
}

function SustainabilityModule({ accent }) {
  const [tab, setTab] = useState("score");
  const reportData = useReportData();
  const networkSignal = reportData.network;

  // --- Carbon Footprint state ---
  const [shipments, setShipments] = usePersistentState("sustainability.shipments", [
    { name: "Distribusi Jabodetabek", mode: "truck", distance: 850, weight: 12 },
    { name: "Ekspor via Pelabuhan", mode: "ship", distance: 4200, weight: 40 },
    { name: "Pengiriman Ekspres", mode: "air", distance: 1600, weight: 1.5 },
    { name: "Antar Gudang Regional", mode: "train", distance: 620, weight: 25 },
  ]);

  const addShipment = () =>
    setShipments([
      ...shipments,
      { name: `Pengiriman ${shipments.length + 1}`, mode: "truck", distance: 100, weight: 5 },
    ]);
  const removeShipment = (idx) => setShipments(shipments.filter((_, i) => i !== idx));
  const updateShipment = (idx, field, val) =>
    setShipments(
      shipments.map((s, i) =>
        i === idx ? { ...s, [field]: field === "mode" || field === "name" ? val : Number(val) } : s
      )
    );

  const carbonResults = useMemo(() => {
    const items = shipments.map((s) => {
      const factorObj = EMISSION_FACTORS.find((f) => f.id === s.mode) || EMISSION_FACTORS[0];
      const emission = (Number(s.distance) || 0) * (Number(s.weight) || 0) * factorObj.factor;
      return { ...s, factorLabel: factorObj.label, emission };
    });
    const totalEmission = items.reduce((a, s) => a + s.emission, 0);
    const byMode = EMISSION_FACTORS.map((f) => ({
      label: f.label,
      total: items.filter((s) => s.mode === f.id).reduce((a, s) => a + s.emission, 0),
    })).filter((m) => m.total > 0);
    return { items, totalEmission, byMode: byMode.sort((a, b) => b.total - a.total) };
  }, [shipments]);

  // --- Target & Pelacakan Reduksi Emisi ---
  const [emissionBaseYear, setEmissionBaseYear] = usePersistentState("sustainability.emissionBaseYear", 2023);
  const [emissionBaseValue, setEmissionBaseValue] = usePersistentState("sustainability.emissionBaseValue", 180000);
  const [emissionTargetYear, setEmissionTargetYear] = usePersistentState("sustainability.emissionTargetYear", 2030);
  const [emissionTargetReductionPct, setEmissionTargetReductionPct] = usePersistentState(
    "sustainability.emissionTargetReductionPct",
    30
  );
  const [emissionActuals, setEmissionActuals] = usePersistentState("sustainability.emissionActuals", [
    { year: 2024, actualEmission: 168000 },
    { year: 2025, actualEmission: 155000 },
  ]);

  const addEmissionActual = () =>
    setEmissionActuals([
      ...emissionActuals,
      { year: (emissionActuals[emissionActuals.length - 1]?.year || Number(emissionBaseYear) || 2023) + 1, actualEmission: 0 },
    ]);
  const removeEmissionActual = (idx) => setEmissionActuals(emissionActuals.filter((_, i) => i !== idx));
  const updateEmissionActual = (idx, field, val) =>
    setEmissionActuals(emissionActuals.map((e, i) => (i === idx ? { ...e, [field]: Number(val) } : e)));

  const emissionTargetResult = useMemo(() => {
    const baseYear = Number(emissionBaseYear) || 0;
    const baseValue = Number(emissionBaseValue) || 0;
    const targetYear = Number(emissionTargetYear) || baseYear + 1;
    const reductionPct = Number(emissionTargetReductionPct) || 0;
    const span = Math.max(1, targetYear - baseYear);
    const targetValue = baseValue * (1 - reductionPct / 100);

    const trajectoryFor = (year) => {
      if (year <= baseYear) return baseValue;
      if (year >= targetYear) return targetValue;
      return baseValue - (baseValue - targetValue) * ((year - baseYear) / span);
    };

    const sortedActuals = [...emissionActuals].sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0));
    const years = Array.from(
      new Set([baseYear, targetYear, ...sortedActuals.map((e) => Number(e.year) || 0)])
    ).sort((a, b) => a - b);

    const chartData = years.map((year) => {
      const actualEntry = sortedActuals.find((e) => Number(e.year) === year);
      return {
        year: String(year),
        Target: Math.round(trajectoryFor(year)),
        Realisasi: actualEntry ? Number(actualEntry.actualEmission) || 0 : null,
      };
    });

    const latest = sortedActuals[sortedActuals.length - 1] || null;
    let latestStatus = null;
    if (latest) {
      const expected = trajectoryFor(Number(latest.year) || baseYear);
      const actual = Number(latest.actualEmission) || 0;
      const onTrack = actual <= expected;
      const gapPct = expected > 0 ? ((actual - expected) / expected) * 100 : 0;
      latestStatus = { year: latest.year, actual, expected, onTrack, gapPct };
    }

    const progressPct =
      baseValue > 0 && latest ? ((baseValue - (Number(latest.actualEmission) || 0)) / baseValue) * 100 : 0;

    return { targetValue, chartData, latestStatus, progressPct, baseYear, targetYear, reductionPct };
  }, [emissionBaseYear, emissionBaseValue, emissionTargetYear, emissionTargetReductionPct, emissionActuals]);

  // --- Simulasi Pergeseran Moda Transportasi ---
  const [shiftFromMode, setShiftFromMode] = usePersistentState("sustainability.shiftFromMode", "truck");
  const [shiftToMode, setShiftToMode] = usePersistentState("sustainability.shiftToMode", "train");
  const [shiftPct, setShiftPct] = usePersistentState("sustainability.shiftPct", 30);

  const modeShiftResult = useMemo(() => {
    const baseline = computeLogisticsMetrics(shipments);

    const pct = Math.max(0, Math.min(100, Number(shiftPct) || 0));
    const scenarioShipments = shipments.flatMap((s) => {
      const weight = Number(s.weight) || 0;
      if (s.mode !== shiftFromMode || pct <= 0 || shiftFromMode === shiftToMode) {
        return [{ ...s, weight }];
      }
      const shiftedWeight = weight * (pct / 100);
      const remainingWeight = weight - shiftedWeight;
      const rows = [];
      if (remainingWeight > 0) rows.push({ ...s, weight: remainingWeight });
      if (shiftedWeight > 0) rows.push({ ...s, mode: shiftToMode, weight: shiftedWeight });
      return rows;
    });
    const scenario = computeLogisticsMetrics(scenarioShipments);

    const affectedTonKm = shipments
      .filter((s) => s.mode === shiftFromMode)
      .reduce((a, s) => a + (Number(s.distance) || 0) * (Number(s.weight) || 0), 0);

    const chartData = [
      { metric: "Emisi (kg CO2e)", Baseline: Math.round(baseline.totalEmission), Skenario: Math.round(scenario.totalEmission) },
      { metric: "Biaya (Rp rb)", Baseline: Math.round(baseline.totalCost / 1000), Skenario: Math.round(scenario.totalCost / 1000) },
    ];

    return { baseline, scenario, affectedTonKm, chartData };
  }, [shipments, shiftFromMode, shiftToMode, shiftPct]);

  // --- Integrasi Rute dari Modul 4 (Network) ---
  const [networkRouteMode, setNetworkRouteMode] = usePersistentState("sustainability.networkRouteMode", "truck");
  const [networkRouteAvgLoadTon, setNetworkRouteAvgLoadTon] = usePersistentState(
    "sustainability.networkRouteAvgLoadTon",
    5
  );

  const networkRouteResult = useMemo(() => {
    const hasData = !!networkSignal && (Number(networkSignal.routeStops) || 0) >= 2;
    if (!hasData) return { hasData: false };

    const vehicleCount = Math.max(1, Number(networkSignal.vrpVehicleCount) || 1);
    const distance =
      Number(networkSignal.vrpTotalDistance) > 0
        ? Number(networkSignal.vrpTotalDistance)
        : Number(networkSignal.routeTotal) || 0;
    const totalTon = (Number(networkRouteAvgLoadTon) || 0) * vehicleCount;
    const tonKm = distance * totalTon;
    const factor = (EMISSION_FACTORS.find((f) => f.id === networkRouteMode) || EMISSION_FACTORS[0]).factor;
    const estimatedEmission = tonKm * factor;

    return { hasData: true, distance, vehicleCount, totalTon, tonKm, estimatedEmission };
  }, [networkSignal, networkRouteMode, networkRouteAvgLoadTon]);

  // --- Pelacak Inisiatif Keberlanjutan ---
  const SUSTAINABILITY_INIT_CATEGORIES = ["Emisi Karbon", "Reverse Logistics", "Efisiensi Sumber Daya", "Lainnya"];
  const SUSTAINABILITY_ACTION_STATUS_META = {
    belum: { label: "Belum Dimulai", color: "#9A9AA0" },
    proses: { label: "Dalam Proses", color: "#E2A63B" },
    selesai: { label: "Selesai", color: "#4FAE7A" },
  };

  const [sustainabilityActions, setSustainabilityActions] = usePersistentState("sustainability.actionItems", [
    {
      id: "INIT-001",
      category: "Emisi Karbon",
      action: "Elektrifikasi sebagian armada truk pengiriman regional",
      owner: "Tim Fleet & Logistik",
      dueDate: "2027-03-31",
      impactEstimate: "-15% emisi armada truk",
      status: "proses",
      history: [{ status: "belum", date: "2026-06-01" }, { status: "proses", date: "2026-08-15" }],
    },
    {
      id: "INIT-002",
      category: "Efisiensi Sumber Daya",
      action: "Ganti kemasan sekunder ke bahan daur ulang 100%",
      owner: "Tim Packaging",
      dueDate: "2026-11-30",
      impactEstimate: "+8% material recovery rate",
      status: "belum",
      history: [{ status: "belum", date: "2026-08-01" }],
    },
  ]);

  const nextSustainabilityActionId = () => {
    const nums = sustainabilityActions.map((a) => Number(String(a.id).replace(/\D/g, "")) || 0);
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `INIT-${String(next).padStart(3, "0")}`;
  };

  const addSustainabilityAction = () =>
    setSustainabilityActions([
      ...sustainabilityActions,
      {
        id: nextSustainabilityActionId(),
        category: SUSTAINABILITY_INIT_CATEGORIES[0],
        action: "",
        owner: "",
        dueDate: "",
        impactEstimate: "",
        status: "belum",
        history: [{ status: "belum", date: new Date().toISOString().slice(0, 10) }],
      },
    ]);

  const removeSustainabilityAction = (idx) =>
    setSustainabilityActions(sustainabilityActions.filter((_, i) => i !== idx));

  const updateSustainabilityAction = (idx, field, val) =>
    setSustainabilityActions(sustainabilityActions.map((a, i) => (i === idx ? { ...a, [field]: val } : a)));

  const updateSustainabilityActionStatus = (idx, newStatus) =>
    setSustainabilityActions(
      sustainabilityActions.map((a, i) =>
        i === idx
          ? {
              ...a,
              status: newStatus,
              history: [...(a.history || []), { status: newStatus, date: new Date().toISOString().slice(0, 10) }],
            }
          : a
      )
    );

  const overdueSustainabilityActions = useMemo(() => {
    const today = new Date();
    return sustainabilityActions.filter((a) => a.status !== "selesai" && a.dueDate && new Date(a.dueDate) < today);
  }, [sustainabilityActions]);

  const sustainabilityActionStatusCounts = useMemo(() => {
    const counts = { belum: 0, proses: 0, selesai: 0 };
    sustainabilityActions.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return counts;
  }, [sustainabilityActions]);

  // --- Reverse Logistics state ---
  const [totalSold, setTotalSold] = usePersistentState("sustainability.totalSold", 8500);
  const [totalReturned, setTotalReturned] = usePersistentState("sustainability.totalReturned", 340);
  const [recoverableUnits, setRecoverableUnits] = usePersistentState("sustainability.recoverableUnits", 230);
  const [nonRecoverableUnits, setNonRecoverableUnits] = usePersistentState("sustainability.nonRecoverableUnits", 110);
  const [originalValue, setOriginalValue] = usePersistentState("sustainability.originalValue", 150000);
  const [recoveryPct, setRecoveryPct] = usePersistentState("sustainability.recoveryPct", 65);
  const [disposalCost, setDisposalCost] = usePersistentState("sustainability.disposalCost", 20000);

  const reverseResults = useMemo(() => {
    const returnRate = (Number(totalSold) || 0) > 0 ? ((Number(totalReturned) || 0) / Number(totalSold)) * 100 : 0;
    const recoveryValue =
      (Number(recoverableUnits) || 0) * (Number(originalValue) || 0) * ((Number(recoveryPct) || 0) / 100);
    const disposalTotal = (Number(nonRecoverableUnits) || 0) * (Number(disposalCost) || 0);
    const netBenefit = recoveryValue - disposalTotal;
    return { returnRate, recoveryValue, disposalTotal, netBenefit };
  }, [totalSold, totalReturned, recoverableUnits, nonRecoverableUnits, originalValue, recoveryPct, disposalCost]);

  // --- Resource Efficiency / Circularity state ---
  const [totalMaterialInput, setTotalMaterialInput] = usePersistentState("sustainability.totalMaterialInput", 12000);
  const [recycledMaterialUsed, setRecycledMaterialUsed] = usePersistentState("sustainability.recycledMaterialUsed", 3600);
  const [totalWaste, setTotalWaste] = usePersistentState("sustainability.totalWaste", 950);
  const [wasteDiverted, setWasteDiverted] = usePersistentState("sustainability.wasteDiverted", 700);

  const circularityResults = useMemo(() => {
    const materialRecoveryRate =
      (Number(totalMaterialInput) || 0) > 0
        ? ((Number(recycledMaterialUsed) || 0) / Number(totalMaterialInput)) * 100
        : 0;
    const wasteDiversionRate =
      (Number(totalWaste) || 0) > 0 ? ((Number(wasteDiverted) || 0) / Number(totalWaste)) * 100 : 0;
    const circularityIndex = (materialRecoveryRate + wasteDiversionRate) / 2;
    return { materialRecoveryRate, wasteDiversionRate, circularityIndex };
  }, [totalMaterialInput, recycledMaterialUsed, totalWaste, wasteDiverted]);

  // --- Skor Sustainability Komposit ---
  const [sustainabilityWeightsRaw, setSustainabilityWeights] = usePersistentState(
    "sustainability.weights",
    DEFAULT_SUSTAINABILITY_WEIGHTS
  );
  const sustainabilityWeights = { ...DEFAULT_SUSTAINABILITY_WEIGHTS, ...sustainabilityWeightsRaw };
  const updateSustainabilityWeight = (key, val) =>
    setSustainabilityWeights({ ...sustainabilityWeights, [key]: Number(val) || 0 });

  const sustainabilityResult = useMemo(() => {
    const totalTonKm = shipments.reduce((a, s) => a + (Number(s.distance) || 0) * (Number(s.weight) || 0), 0);
    const intensity = totalTonKm > 0 ? carbonResults.totalEmission / totalTonKm : 0;
    const carbonScore = Math.max(0, Math.min(100, 100 - (intensity / CARBON_INTENSITY_WORST) * 100));

    const returned = Number(totalReturned) || 0;
    const recoveryRatio = returned > 0 ? ((Number(recoverableUnits) || 0) / returned) * 100 : 100;
    const reverseScore = Math.max(
      0,
      Math.min(100, recoveryRatio + (reverseResults.netBenefit >= 0 ? 10 : -10))
    );

    const circularityScore = Math.max(0, Math.min(100, circularityResults.circularityIndex));

    const w = {
      carbon: Number(sustainabilityWeights.carbon) || 0,
      reverse: Number(sustainabilityWeights.reverse) || 0,
      circularity: Number(sustainabilityWeights.circularity) || 0,
    };
    const totalWeight = w.carbon + w.reverse + w.circularity;
    const weightedScore =
      totalWeight > 0
        ? (carbonScore * w.carbon + reverseScore * w.reverse + circularityScore * w.circularity) / totalWeight
        : 0;

    return {
      carbonScore,
      reverseScore,
      circularityScore,
      totalScore: weightedScore,
      band: sustainabilityBand(weightedScore),
    };
  }, [shipments, carbonResults, totalReturned, recoverableUnits, reverseResults, circularityResults, sustainabilityWeights]);

  useReportSync("sustainability", {
    totalEmission: carbonResults.totalEmission,
    topEmissionMode: carbonResults.byMode[0]?.label,
    returnRate: reverseResults.returnRate,
    netBenefit: reverseResults.netBenefit,
    circularityIndex: circularityResults.circularityIndex,
    sustainabilityScore: sustainabilityResult.totalScore,
    sustainabilityBand: sustainabilityResult.band.label,
    initiativeCount: sustainabilityActions.length,
    overdueInitiativeCount: overdueSustainabilityActions.length,
  });

  const tabs = [
    { id: "score", label: "Skor Sustainability" },
    { id: "carbon", label: "Jejak Karbon" },
    { id: "emissionTarget", label: "Target Emisi" },
    { id: "modeShift", label: "Simulasi Pergeseran Moda" },
    { id: "networkRoute", label: "Rute dari Modul 4" },
    { id: "reverse", label: "Reverse Logistics" },
    { id: "circularity", label: "Efisiensi Sumber Daya" },
    { id: "initiatives", label: "Inisiatif Keberlanjutan" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ModuleTabs tabs={tabs} tab={tab} setTab={setTab} accent={accent} />

      {tab === "score" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <SectionCard
            title="Skor Sustainability Komposit"
            subtitle="Gabungan dari Jejak Karbon, Reverse Logistics, dan Efisiensi Sumber Daya"
            accent={accent}
          >
            <div
              className="mb-4 flex flex-col items-center justify-center gap-1 rounded-2xl py-6"
              style={{ backgroundColor: `${sustainabilityResult.band.color}18` }}
            >
              <p
                className="text-4xl font-semibold tracking-tight"
                style={{ color: sustainabilityResult.band.color, fontVariantNumeric: "tabular-nums" }}
              >
                {sustainabilityResult.totalScore.toFixed(0)}
              </p>
              <span
                className="rounded-full px-3 py-0.5 text-[11px] font-medium"
                style={{ backgroundColor: `${sustainabilityResult.band.color}22`, color: sustainabilityResult.band.color }}
              >
                {sustainabilityResult.band.label}
              </span>
            </div>

            <div className="mb-4 space-y-2">
              {SUSTAINABILITY_BANDS.map((b, i) => {
                const nextMin = SUSTAINABILITY_BANDS[i + 1]?.min ?? 100;
                return (
                  <div key={b.label} className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: `${b.color}22` }}>
                      <div className="h-full rounded-full" style={{ width: "100%", backgroundColor: `${b.color}55` }} />
                    </div>
                    <span className="w-24 text-right text-[10px]" style={{ color: "#9A9AA0" }}>
                      {b.label} ({b.min}–{nextMin === 100 ? 100 : nextMin - 1})
                    </span>
                  </div>
                );
              })}
              <p className="pt-1 text-[10px]" style={{ color: "#B5B5B9" }}>
                Skala benchmark internal 0–100 (bukan data industri eksternal).
              </p>
            </div>

            <p className="mb-2 text-xs font-medium" style={{ color: "#4B4B4F" }}>
              Bobot Subskor
            </p>
            <div className="space-y-2">
              {[
                { key: "carbon", label: "Jejak Karbon" },
                { key: "reverse", label: "Reverse Logistics" },
                { key: "circularity", label: "Efisiensi Sumber Daya" },
              ].map((w) => (
                <div key={w.key} className="flex items-center gap-2">
                  <FieldLabel>{w.label}</FieldLabel>
                  <div className="ml-auto w-24">
                    <NumberInput
                      value={sustainabilityWeights[w.key]}
                      onChange={(v) => updateSustainabilityWeight(w.key, v)}
                      suffix="%"
                      min={0}
                      max={100}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ResultStat accent={accent} label="Subskor Jejak Karbon" value={sustainabilityResult.carbonScore.toFixed(0)} />
              <ResultStat accent={accent} label="Subskor Reverse Logistics" value={sustainabilityResult.reverseScore.toFixed(0)} />
              <ResultStat accent={accent} label="Subskor Efisiensi Sumber Daya" value={sustainabilityResult.circularityScore.toFixed(0)} />
            </div>

            <SectionCard title="Interpretasi" accent={accent}>
              <p className="text-xs leading-relaxed" style={{ color: "#4B4B4F" }}>
                Skor sustainability saat ini berada pada level{" "}
                <span className="font-semibold" style={{ color: sustainabilityResult.band.color }}>
                  {sustainabilityResult.band.label}
                </span>{" "}
                ({sustainabilityResult.totalScore.toFixed(0)}/100). Subskor terendah adalah{" "}
                {(() => {
                  const subs = [
                    { label: "Jejak Karbon", value: sustainabilityResult.carbonScore },
                    { label: "Reverse Logistics", value: sustainabilityResult.reverseScore },
                    { label: "Efisiensi Sumber Daya", value: sustainabilityResult.circularityScore },
                  ].sort((a, b) => a.value - b.value)[0];
                  return (
                    <>
                      <span className="font-semibold">{subs.label}</span> ({subs.value.toFixed(0)}) — prioritaskan
                      perbaikan di area ini terlebih dahulu.
                    </>
                  );
                })()}
              </p>
              <p className="mt-2 text-[11px]" style={{ color: "#9A9AA0" }}>
                Subskor Jejak Karbon dihitung dari intensitas emisi rata-rata (kg CO2e per ton-km) dibandingkan
                ambang batas internal {CARBON_INTENSITY_WORST} kg/ton-km. Subskor Reverse Logistics menggabungkan
                rasio unit recoverable terhadap total retur dengan status net benefit. Subskor Efisiensi Sumber
                Daya memakai Circularity Index dari tab "Efisiensi Sumber Daya".
              </p>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "carbon" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[420px_1fr]">
          <SectionCard title="Pengiriman" subtitle="Jarak (km), berat (ton), dan moda transportasi" accent={accent}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: "#4B4B4F" }}>
                Daftar Pengiriman
              </p>
              <button
                onClick={addShipment}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah
              </button>
            </div>

            <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
              {shipments.map((s, i) => (
                <div key={i} className="rounded-xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.6)" }}>
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      value={s.name}
                      onChange={(e) => updateShipment(i, "name", e.target.value)}
                      className="flex-1 rounded-lg px-2 py-1.5 text-xs font-medium outline-none"
                      style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                    />
                    <button onClick={() => removeShipment(i)}>
                      <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                    </button>
                  </div>
                  <div className="mb-2">
                    <FieldLabel>Moda Transportasi</FieldLabel>
                    <select
                      value={s.mode}
                      onChange={(e) => updateShipment(i, "mode", e.target.value)}
                      className="w-full rounded-lg px-2.5 py-2 text-xs outline-none"
                      style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                    >
                      {EMISSION_FACTORS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <FieldLabel>Jarak</FieldLabel>
                      <NumberInput value={s.distance} onChange={(v) => updateShipment(i, "distance", v)} suffix="km" />
                    </div>
                    <div>
                      <FieldLabel>Berat</FieldLabel>
                      <NumberInput value={s.weight} onChange={(v) => updateShipment(i, "weight", v)} suffix="ton" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultStat accent={accent}
                label="Total Emisi CO2e"
                value={carbonResults.totalEmission.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                unit="kg"
                highlight
              />
              <ResultStat accent={accent}
                label="Jumlah Pengiriman"
                value={shipments.length}
                unit="rute"
              />
            </div>

            <SectionCard title="Emisi per Moda Transportasi" subtitle="Diurutkan dari kontribusi terbesar" accent={accent}>
              <div className="space-y-2">
                {carbonResults.byMode.map((m, i) => {
                  const pct =
                    carbonResults.totalEmission > 0 ? (m.total / carbonResults.totalEmission) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium">{m.label}</span>
                        <span style={{ color: "#8A8A8E" }}>
                          {m.total.toLocaleString("id-ID", { maximumFractionDigits: 0 })} kg CO2e ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.06)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: accent }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Rincian per Pengiriman" accent={accent}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      {["Pengiriman", "Moda", "Jarak", "Berat", "Emisi CO2e"].map((h) => (
                        <th key={h} className="whitespace-nowrap px-2.5 py-2 text-left font-medium" style={{ color: "#8A8A8E" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {carbonResults.items.map((s, i) => (
                      <tr key={i} style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                        <td className="px-2.5 py-2 font-medium">{s.name}</td>
                        <td className="px-2.5 py-2">{s.factorLabel}</td>
                        <td className="px-2.5 py-2">{s.distance} km</td>
                        <td className="px-2.5 py-2">{s.weight} ton</td>
                        <td className="px-2.5 py-2 font-medium" style={{ color: accent }}>
                          {s.emission.toLocaleString("id-ID", { maximumFractionDigits: 0 })} kg
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "emissionTarget" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_1fr]">
          <SectionCard title="Target Reduksi Emisi" subtitle="Tahun dasar, nilai baseline, dan target" accent={accent}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Tahun Dasar</FieldLabel>
                  <NumberInput value={emissionBaseYear} onChange={setEmissionBaseYear} />
                </div>
                <div>
                  <FieldLabel>Tahun Target</FieldLabel>
                  <NumberInput value={emissionTargetYear} onChange={setEmissionTargetYear} />
                </div>
              </div>
              <div>
                <FieldLabel hint="Total emisi CO2e tahunan pada tahun dasar, sebagai acuan perhitungan reduksi">
                  Emisi Baseline
                </FieldLabel>
                <NumberInput value={emissionBaseValue} onChange={setEmissionBaseValue} suffix="kg CO2e" />
              </div>
              <div>
                <FieldLabel hint="Target penurunan emisi dari nilai baseline pada tahun target">
                  Target Reduksi
                </FieldLabel>
                <NumberInput value={emissionTargetReductionPct} onChange={setEmissionTargetReductionPct} suffix="%" />
              </div>
              <p className="text-[11px]" style={{ color: "#9A9AA0" }}>
                Target emisi tahun {emissionTargetResult.targetYear}: {Math.round(emissionTargetResult.targetValue).toLocaleString("id-ID")} kg CO2e
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: "#4B4B4F" }}>
                Realisasi per Tahun
              </p>
              <button
                onClick={addEmissionActual}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {emissionActuals.map((e, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-20">
                    <NumberInput value={e.year} onChange={(v) => updateEmissionActual(i, "year", v)} />
                  </div>
                  <div className="flex-1">
                    <NumberInput
                      value={e.actualEmission}
                      onChange={(v) => updateEmissionActual(i, "actualEmission", v)}
                      suffix="kg CO2e"
                    />
                  </div>
                  <button onClick={() => removeEmissionActual(i)}>
                    <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                  </button>
                </div>
              ))}
              {emissionActuals.length === 0 && (
                <p className="text-xs" style={{ color: "#9A9AA0" }}>
                  Belum ada data realisasi. Klik "Tambah" untuk mengisi.
                </p>
              )}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <ResultStat
                accent={accent}
                label="Realisasi Terakhir"
                value={
                  emissionTargetResult.latestStatus
                    ? `${Math.round(emissionTargetResult.latestStatus.actual).toLocaleString("id-ID")} kg`
                    : "—"
                }
              />
              <ResultStat
                accent={accent}
                label="Target Tahun Tersebut"
                value={
                  emissionTargetResult.latestStatus
                    ? `${Math.round(emissionTargetResult.latestStatus.expected).toLocaleString("id-ID")} kg`
                    : "—"
                }
              />
              <ResultStat
                accent={emissionTargetResult.latestStatus?.onTrack ? "#4FAE7A" : "#E2685A"}
                label="Status"
                value={
                  emissionTargetResult.latestStatus
                    ? emissionTargetResult.latestStatus.onTrack
                      ? "On-Track"
                      : "Off-Track"
                    : "—"
                }
                highlight
              />
              <ResultStat
                accent={accent}
                label="Progres dari Baseline"
                value={emissionTargetResult.progressPct.toFixed(1)}
                unit="%"
              />
            </div>

            <SectionCard
              title="Realisasi vs Jalur Target"
              subtitle={`Tahun dasar ${emissionTargetResult.baseYear} → target ${emissionTargetResult.targetYear} (reduksi ${emissionTargetResult.reductionPct}%)`}
              accent={accent}
            >
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={emissionTargetResult.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#8A8A8E" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#8A8A8E" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(255,255,255,0.7)",
                        borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="Target" stroke="#8A8A8E" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} connectNulls />
                    <Line type="monotone" dataKey="Realisasi" stroke={accent} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            {emissionTargetResult.latestStatus && (
              <SectionCard title="Interpretasi" accent={accent}>
                <p className="text-xs leading-relaxed" style={{ color: "#4B4B4F" }}>
                  Pada tahun {emissionTargetResult.latestStatus.year}, realisasi emisi adalah{" "}
                  {Math.round(emissionTargetResult.latestStatus.actual).toLocaleString("id-ID")} kg CO2e,{" "}
                  {emissionTargetResult.latestStatus.onTrack ? (
                    <>
                      lebih rendah dari jalur target ({Math.round(emissionTargetResult.latestStatus.expected).toLocaleString("id-ID")} kg) —
                      berada <span className="font-semibold" style={{ color: "#4FAE7A" }}>on-track</span> menuju target tahun{" "}
                      {emissionTargetResult.targetYear}.
                    </>
                  ) : (
                    <>
                      melebihi jalur target ({Math.round(emissionTargetResult.latestStatus.expected).toLocaleString("id-ID")} kg) sebesar{" "}
                      {Math.abs(emissionTargetResult.latestStatus.gapPct).toFixed(1)}% — berada{" "}
                      <span className="font-semibold" style={{ color: "#E2685A" }}>off-track</span>, perlu percepatan
                      inisiatif reduksi emisi.
                    </>
                  )}
                </p>
              </SectionCard>
            )}
          </div>
        </div>
      )}

      {tab === "modeShift" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_1fr]">
          <SectionCard
            title="Skenario Pergeseran Moda"
            subtitle="Geser sebagian volume dari satu moda ke moda lain"
            accent={accent}
          >
            <div className="space-y-3">
              <div>
                <FieldLabel>Dari Moda</FieldLabel>
                <select
                  value={shiftFromMode}
                  onChange={(e) => setShiftFromMode(e.target.value)}
                  className="w-full rounded-lg px-2.5 py-2 text-xs outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                >
                  {EMISSION_FACTORS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Ke Moda</FieldLabel>
                <select
                  value={shiftToMode}
                  onChange={(e) => setShiftToMode(e.target.value)}
                  className="w-full rounded-lg px-2.5 py-2 text-xs outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                >
                  {EMISSION_FACTORS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel hint="Persentase volume (ton) dari moda asal yang dipindah ke moda tujuan">
                  Persentase Dipindah
                </FieldLabel>
                <NumberInput value={shiftPct} onChange={setShiftPct} suffix="%" min={0} max={100} />
              </div>
              {shiftFromMode === shiftToMode && (
                <p className="text-[11px]" style={{ color: "#B5B5B9" }}>
                  Moda asal dan tujuan sama — pilih moda tujuan yang berbeda untuk melihat dampak skenario.
                </p>
              )}
              <p className="text-[11px]" style={{ color: "#9A9AA0" }}>
                Total volume pada moda asal saat ini: {modeShiftResult.affectedTonKm > 0 ? `${modeShiftResult.affectedTonKm.toLocaleString("id-ID", { maximumFractionDigits: 0 })} ton-km` : "tidak ada pengiriman dengan moda ini"}.
              </p>
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="flex flex-col gap-1">
                <ResultStat
                  accent={accent}
                  label="Total Emisi (Skenario)"
                  value={`${Math.round(modeShiftResult.scenario.totalEmission).toLocaleString("id-ID")} kg`}
                  highlight
                />
                <DeltaBadge base={modeShiftResult.baseline.totalEmission} scenario={modeShiftResult.scenario.totalEmission} lowerIsBetter />
              </div>
              <div className="flex flex-col gap-1">
                <ResultStat
                  accent={accent}
                  label="Total Biaya (Skenario)"
                  value={`Rp ${Math.round(modeShiftResult.scenario.totalCost).toLocaleString("id-ID")}`}
                />
                <DeltaBadge base={modeShiftResult.baseline.totalCost} scenario={modeShiftResult.scenario.totalCost} lowerIsBetter />
              </div>
              <div className="flex flex-col gap-1">
                <ResultStat
                  accent={accent}
                  label="Rata-rata Waktu Tempuh"
                  value={modeShiftResult.scenario.avgTransitDays.toFixed(1)}
                  unit="hari"
                />
                <DeltaBadge base={modeShiftResult.baseline.avgTransitDays} scenario={modeShiftResult.scenario.avgTransitDays} lowerIsBetter />
              </div>
            </div>

            <SectionCard title="Baseline vs Skenario" accent={accent}>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={modeShiftResult.chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="metric" tick={{ fontSize: 11, fill: "#8A8A8E" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#8A8A8E" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(255,255,255,0.7)",
                        borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Baseline" fill="#B5B5B9" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Skenario" fill={accent} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Catatan Trade-off" accent={accent}>
              <p className="text-xs leading-relaxed" style={{ color: "#4B4B4F" }}>
                Moda dengan emisi lebih rendah (kereta, kapal laut) umumnya memiliki biaya per ton-km lebih murah
                namun waktu tempuh lebih lama, sedangkan moda udara jauh lebih cepat namun emisi dan biayanya jauh
                lebih tinggi. Gunakan simulasi ini untuk menimbang trade-off antara target emisi, biaya logistik,
                dan kecepatan pengiriman sebelum mengubah kebijakan moda transportasi secara aktual.
              </p>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "networkRoute" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_1fr]">
          <SectionCard
            title="Sumber Data"
            subtitle="Jarak rute otomatis dari Modul 4 (Network Design)"
            accent={accent}
          >
            {!networkRouteResult.hasData ? (
              <p className="text-xs" style={{ color: "#9A9AA0" }}>
                Belum ada data rute — isi minimal 2 titik pada tab "Rute Distribusi" di Modul 4 (Network Design)
                terlebih dahulu agar jarak rute dapat ditarik otomatis ke sini.
              </p>
            ) : (
              <>
                <div className="mb-4 space-y-2 text-xs" style={{ color: "#4B4B4F" }}>
                  <div className="flex items-center justify-between">
                    <span style={{ color: "#8A8A8E" }}>Total Jarak Rute (Modul 4)</span>
                    <span className="font-medium">{networkRouteResult.distance.toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: "#8A8A8E" }}>Jumlah Trip/Kendaraan</span>
                    <span className="font-medium">{networkRouteResult.vehicleCount}</span>
                  </div>
                </div>

                <div>
                  <FieldLabel hint="Modul 4 tidak menyimpan berat muatan dalam ton, jadi nilai ini perlu diisi manual sebagai asumsi">
                    Rata-rata Muatan per Kendaraan
                  </FieldLabel>
                  <NumberInput value={networkRouteAvgLoadTon} onChange={setNetworkRouteAvgLoadTon} suffix="ton" />
                </div>
                <div className="mt-3">
                  <FieldLabel>Moda Transportasi</FieldLabel>
                  <select
                    value={networkRouteMode}
                    onChange={(e) => setNetworkRouteMode(e.target.value)}
                    className="w-full rounded-lg px-2.5 py-2 text-xs outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                  >
                    {EMISSION_FACTORS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </SectionCard>

          <div className="flex flex-col gap-4">
            {!networkRouteResult.hasData ? (
              <SectionCard title="Estimasi Emisi Rute Utama" accent={accent}>
                <p className="text-xs" style={{ color: "#9A9AA0" }}>
                  Isi data rute di Modul 4 untuk melihat estimasi jejak karbon di sini.
                </p>
              </SectionCard>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <ResultStat
                    accent={accent}
                    label="Total Muatan"
                    value={networkRouteResult.totalTon.toLocaleString("id-ID")}
                    unit="ton"
                  />
                  <ResultStat
                    accent={accent}
                    label="Ton-Km"
                    value={Math.round(networkRouteResult.tonKm).toLocaleString("id-ID")}
                  />
                  <ResultStat
                    accent={accent}
                    label="Estimasi Emisi"
                    value={Math.round(networkRouteResult.estimatedEmission).toLocaleString("id-ID")}
                    unit="kg CO2e"
                    highlight
                  />
                </div>

                <SectionCard title="Catatan" accent={accent}>
                  <p className="text-xs leading-relaxed" style={{ color: "#4B4B4F" }}>
                    Estimasi ini dihitung otomatis dari jarak rute yang dioptimalkan di Modul 4 (Network Design),
                    dikalikan asumsi muatan yang Anda isi di sebelah kiri. Angka ini bersifat referensi/estimasi
                    saja dan{" "}
                    <span className="font-medium">tidak digabungkan otomatis</span> ke dalam daftar pengiriman di
                    tab "Jejak Karbon" — sumber kebenaran jarak tetap berada di Modul 4. Jika ingin memasukkannya
                    ke total emisi resmi, tambahkan sebagai entri baru secara manual di tab "Jejak Karbon".
                  </p>
                </SectionCard>
              </>
            )}
          </div>
        </div>
      )}

      {tab === "reverse" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <SectionCard title="Data Retur & Pemulihan" subtitle="Nilai dalam Rupiah" accent={accent}>
            <div className="space-y-3">
              <div>
                <FieldLabel>Total Terjual</FieldLabel>
                <NumberInput value={totalSold} onChange={setTotalSold} suffix="unit" />
              </div>
              <div>
                <FieldLabel>Total Retur</FieldLabel>
                <NumberInput value={totalReturned} onChange={setTotalReturned} suffix="unit" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Unit Recoverable</FieldLabel>
                  <NumberInput value={recoverableUnits} onChange={setRecoverableUnits} suffix="unit" />
                </div>
                <div>
                  <FieldLabel>Unit Tidak Recoverable</FieldLabel>
                  <NumberInput value={nonRecoverableUnits} onChange={setNonRecoverableUnits} suffix="unit" />
                </div>
              </div>
              <div>
                <FieldLabel>Nilai Awal per Unit</FieldLabel>
                <NumberInput value={originalValue} onChange={setOriginalValue} suffix="Rp" />
              </div>
              <div>
                <FieldLabel hint="Persentase nilai yang bisa dipulihkan dari unit recoverable">% Nilai Terpulihkan</FieldLabel>
                <NumberInput value={recoveryPct} onChange={setRecoveryPct} suffix="%" />
              </div>
              <div>
                <FieldLabel>Biaya Pembuangan per Unit</FieldLabel>
                <NumberInput value={disposalCost} onChange={setDisposalCost} suffix="Rp" />
              </div>
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <ResultStat accent={accent} label="Return Rate" value={reverseResults.returnRate.toFixed(1)} unit="%" />
              <ResultStat accent={accent}
                label="Recovery Value"
                value={`Rp ${Math.round(reverseResults.recoveryValue).toLocaleString("id-ID")}`}
              />
              <ResultStat accent={accent}
                label="Biaya Pembuangan"
                value={`Rp ${Math.round(reverseResults.disposalTotal).toLocaleString("id-ID")}`}
              />
              <ResultStat accent={accent}
                label="Net Benefit"
                value={`Rp ${Math.round(reverseResults.netBenefit).toLocaleString("id-ID")}`}
                highlight
              />
            </div>

            <SectionCard
              title="Interpretasi"
              subtitle="Perbandingan nilai pulih vs biaya buang"
              accent={accent}
            >
              <div className="space-y-2 text-xs" style={{ color: "#4B4B4F" }}>
                <p>
                  Dari {totalReturned} unit retur ({reverseResults.returnRate.toFixed(1)}% dari total terjual),{" "}
                  {recoverableUnits} unit berpotensi dipulihkan nilainya, sedangkan {nonRecoverableUnits} unit
                  harus dibuang.
                </p>
                <p>
                  Net benefit dari proses reverse logistics adalah{" "}
                  <span className="font-semibold" style={{ color: reverseResults.netBenefit >= 0 ? "#4FAE7A" : "#E2685A" }}>
                    Rp {Math.round(reverseResults.netBenefit).toLocaleString("id-ID")}
                  </span>{" "}
                  — {reverseResults.netBenefit >= 0 ? "nilai pulih melebihi biaya pembuangan." : "biaya pembuangan lebih besar dari nilai yang berhasil dipulihkan."}
                </p>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "circularity" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
          <SectionCard title="Data Sumber Daya" subtitle="Material & limbah" accent={accent}>
            <div className="space-y-3">
              <div>
                <FieldLabel>Total Material Input</FieldLabel>
                <NumberInput value={totalMaterialInput} onChange={setTotalMaterialInput} suffix="kg" />
              </div>
              <div>
                <FieldLabel>Material Daur Ulang Digunakan</FieldLabel>
                <NumberInput value={recycledMaterialUsed} onChange={setRecycledMaterialUsed} suffix="kg" />
              </div>
              <div>
                <FieldLabel>Total Limbah</FieldLabel>
                <NumberInput value={totalWaste} onChange={setTotalWaste} suffix="kg" />
              </div>
              <div>
                <FieldLabel hint="Limbah yang tidak berakhir di TPA (didaur ulang, dikompos, dsb.)">Limbah Dialihkan dari TPA</FieldLabel>
                <NumberInput value={wasteDiverted} onChange={setWasteDiverted} suffix="kg" />
              </div>
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <ResultStat accent={accent} label="Material Recovery Rate" value={circularityResults.materialRecoveryRate.toFixed(1)} unit="%" />
              <ResultStat accent={accent} label="Waste Diversion Rate" value={circularityResults.wasteDiversionRate.toFixed(1)} unit="%" />
              <ResultStat accent={accent} label="Circularity Index" value={circularityResults.circularityIndex.toFixed(1)} unit="%" highlight />
            </div>

            <SectionCard title="Visualisasi Circularity Index" accent={accent}>
              <div className="space-y-4">
                {[
                  { label: "Material Recovery Rate", value: circularityResults.materialRecoveryRate },
                  { label: "Waste Diversion Rate", value: circularityResults.wasteDiversionRate },
                  { label: "Circularity Index (rata-rata)", value: circularityResults.circularityIndex },
                ].map((row, i) => (
                  <div key={i}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium">{row.label}</span>
                      <span style={{ color: "#8A8A8E" }}>{row.value.toFixed(1)}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.06)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(row.value, 100)}%`, backgroundColor: accent }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "initiatives" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_300px]">
          <SectionCard
            title="Pelacak Inisiatif Keberlanjutan"
            subtitle="Pemilik, tenggat waktu, estimasi dampak, dan status eksekusi"
            accent={accent}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: "#4B4B4F" }}>
                Daftar Inisiatif
              </p>
              <button
                onClick={addSustainabilityAction}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Plus size={12} /> Tambah
              </button>
            </div>

            <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
              {sustainabilityActions.map((a, i) => {
                const isOverdue = a.status !== "selesai" && a.dueDate && new Date(a.dueDate) < new Date();
                const meta = SUSTAINABILITY_ACTION_STATUS_META[a.status] || SUSTAINABILITY_ACTION_STATUS_META.belum;
                return (
                  <div
                    key={a.id}
                    className="rounded-xl p-3.5"
                    style={{
                      backgroundColor: isOverdue ? "rgba(226,104,90,0.08)" : "rgba(255,255,255,0.6)",
                      boxShadow: isOverdue ? "inset 0 0 0 1px rgba(226,104,90,0.35)" : "none",
                    }}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <select
                          value={a.category}
                          onChange={(e) => updateSustainabilityAction(i, "category", e.target.value)}
                          className="mb-1.5 w-full rounded-lg px-2 py-1 text-[11px] font-medium outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.8)", color: accent }}
                        >
                          {SUSTAINABILITY_INIT_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <input
                          value={a.action}
                          onChange={(e) => updateSustainabilityAction(i, "action", e.target.value)}
                          placeholder="Deskripsi inisiatif keberlanjutan"
                          className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                        />
                      </div>
                      <button onClick={() => removeSustainabilityAction(i)} className="mt-1 shrink-0">
                        <Trash2 size={13} style={{ color: "#C7C7CC" }} />
                      </button>
                    </div>

                    <div className="mb-2 grid grid-cols-2 gap-2">
                      <div>
                        <FieldLabel>Penanggung Jawab</FieldLabel>
                        <input
                          value={a.owner}
                          onChange={(e) => updateSustainabilityAction(i, "owner", e.target.value)}
                          placeholder="Nama / tim"
                          className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                        />
                      </div>
                      <div>
                        <FieldLabel>Tenggat Waktu</FieldLabel>
                        <input
                          type="date"
                          value={a.dueDate}
                          onChange={(e) => updateSustainabilityAction(i, "dueDate", e.target.value)}
                          className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                          style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                        />
                      </div>
                    </div>

                    <div className="mb-2">
                      <FieldLabel hint="Perkiraan dampak, misalnya -15% emisi armada atau +8% material recovery rate">
                        Estimasi Dampak
                      </FieldLabel>
                      <input
                        value={a.impactEstimate}
                        onChange={(e) => updateSustainabilityAction(i, "impactEstimate", e.target.value)}
                        placeholder="mis. -500 kg CO2e/bulan"
                        className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                        style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#1D1D1F" }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5">
                        {Object.entries(SUSTAINABILITY_ACTION_STATUS_META).map(([key, m]) => (
                          <button
                            key={key}
                            onClick={() => updateSustainabilityActionStatus(i, key)}
                            className="rounded-lg px-2 py-1 text-[10px] font-medium"
                            style={{
                              backgroundColor: a.status === key ? `${m.color}22` : "rgba(0,0,0,0.04)",
                              color: a.status === key ? m.color : "#9A9AA0",
                            }}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                      {isOverdue && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#E2685A" }}>
                          <AlertTriangle size={11} /> Lewat Tenggat
                        </span>
                      )}
                    </div>

                    {a.history && a.history.length > 0 && (
                      <div className="mt-2 border-t pt-2" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                        <p className="mb-1 text-[10px] font-medium" style={{ color: "#B5B5B9" }}>
                          Riwayat Status
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {a.history.map((h, hi) => (
                            <span
                              key={hi}
                              className="rounded-full px-2 py-0.5 text-[9px]"
                              style={{
                                backgroundColor: `${(SUSTAINABILITY_ACTION_STATUS_META[h.status] || SUSTAINABILITY_ACTION_STATUS_META.belum).color}18`,
                                color: (SUSTAINABILITY_ACTION_STATUS_META[h.status] || SUSTAINABILITY_ACTION_STATUS_META.belum).color,
                              }}
                            >
                              {(SUSTAINABILITY_ACTION_STATUS_META[h.status] || SUSTAINABILITY_ACTION_STATUS_META.belum).label} · {h.date}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {sustainabilityActions.length === 0 && (
                <p className="py-8 text-center text-xs" style={{ color: "#9A9AA0" }}>
                  Belum ada inisiatif keberlanjutan. Klik "Tambah" untuk membuat yang pertama.
                </p>
              )}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3">
              <ResultStat accent={accent} label="Total Inisiatif" value={sustainabilityActions.length} />
              <ResultStat
                accent={accent}
                label="Lewat Tenggat"
                value={overdueSustainabilityActions.length}
                highlight={overdueSustainabilityActions.length > 0}
              />
              <ResultStat accent={accent} label="Belum Dimulai" value={sustainabilityActionStatusCounts.belum || 0} />
              <ResultStat accent={accent} label="Dalam Proses" value={sustainabilityActionStatusCounts.proses || 0} />
              <ResultStat accent={accent} label="Selesai" value={sustainabilityActionStatusCounts.selesai || 0} />
            </div>

            {overdueSustainabilityActions.length > 0 && (
              <SectionCard title="Perlu Perhatian Segera" accent={accent}>
                <div className="space-y-2">
                  {overdueSustainabilityActions.map((a) => (
                    <div key={a.id} className="rounded-xl p-2.5" style={{ backgroundColor: "rgba(226,104,90,0.1)" }}>
                      <p className="text-xs font-medium" style={{ color: "#1D1D1F" }}>
                        {a.action || "(Belum ada deskripsi)"}
                      </p>
                      <p className="text-[10px]" style={{ color: "#9A9AA0" }}>
                        {a.category || "—"} · Tenggat: {a.dueDate} · PIC: {a.owner || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Laporan Lengkap (Report / PDF export) ----------

function ReportPrintStyles() {
  return (
    <style>{`
      @media print {
        body * { visibility: hidden; }
        #report-print-area, #report-print-area * { visibility: visible; }
        #report-print-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          margin: 0;
          padding: 0;
        }
        .no-print { display: none !important; }
        .report-section { break-inside: avoid; page-break-inside: avoid; }
        .report-page-break { break-before: page; page-break-before: always; }
        .report-cover { break-after: page; page-break-after: always; }
        @page { margin: 16mm 14mm; }
      }
    `}</style>
  );
}

function ReportMetricGrid({ metrics }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {metrics.map((m, i) => (
        <div key={i} className="rounded-lg border p-2.5" style={{ borderColor: "#E5E5EA" }}>
          <p className="text-[10px] uppercase tracking-wide" style={{ color: "#8A8A8E" }}>
            {m.label}
          </p>
          <p className="text-sm font-semibold" style={{ color: "#1D1D1F" }}>
            {m.value}
            {m.unit ? <span className="ml-1 text-[11px] font-normal" style={{ color: "#8A8A8E" }}>{m.unit}</span> : null}
          </p>
        </div>
      ))}
    </div>
  );
}

function ReportModuleSection({ module, result }) {
  const Icon = module.icon;

  if (!result) {
    return (
      <section className="report-section mb-6 rounded-xl border p-5" style={{ borderColor: "#E5E5EA" }}>
        <div className="mb-2 flex items-center gap-2">
          <Icon size={16} style={{ color: "#B5B5B9" }} />
          <h3 className="text-sm font-semibold" style={{ color: "#8A8A8E" }}>
            {module.name}
          </h3>
        </div>
        <p className="text-xs italic" style={{ color: "#B5B5B9" }}>
          Modul ini belum diisi datanya, sehingga belum bisa disertakan dalam analisis laporan. Kunjungi modul
          "{module.name}" pada dashboard dan isi data yang relevan agar bagian ini tampil lengkap.
        </p>
      </section>
    );
  }

  const meta = SEVERITY_META[result.severity] || SEVERITY_META.baik;
  const StatusIcon = meta.icon;

  return (
    <section className="report-section mb-6 rounded-xl border p-5" style={{ borderColor: "#E5E5EA" }}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${module.accent}1A` }}>
            <Icon size={15} style={{ color: module.accent }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "#1D1D1F" }}>
              {module.name}
            </h3>
            <p className="text-[11px]" style={{ color: "#9A9AA0" }}>
              {module.desc}
            </p>
          </div>
        </div>
        <span
          className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold"
          style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
        >
          <StatusIcon size={11} />
          {meta.label}
        </span>
      </div>

      <p className="mb-3 text-xs leading-relaxed" style={{ color: "#3A3A3D" }}>
        {result.ringkasan}
      </p>

      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#8A8A8E" }}>
        Metrik Utama
      </p>
      <div className="mb-4">
        <ReportMetricGrid metrics={result.metrics} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg p-3" style={{ backgroundColor: "#FBF4F2" }}>
          <p className="mb-1 text-[11px] font-semibold" style={{ color: "#B5493D" }}>
            Uraian Masalah
          </p>
          <p className="text-[11.5px] leading-relaxed" style={{ color: "#4B4B4F" }}>
            {result.masalah}
          </p>
        </div>
        <div className="rounded-lg p-3" style={{ backgroundColor: "#FBF7EC" }}>
          <p className="mb-1 text-[11px] font-semibold" style={{ color: "#B5822E" }}>
            Analisis Penyebab
          </p>
          <p className="text-[11.5px] leading-relaxed" style={{ color: "#4B4B4F" }}>
            {result.penyebab}
          </p>
        </div>
        <div className="rounded-lg p-3" style={{ backgroundColor: "#EFF7F1" }}>
          <p className="mb-1 text-[11px] font-semibold" style={{ color: "#3D8A5D" }}>
            Rekomendasi Solusi
          </p>
          <p className="text-[11.5px] leading-relaxed" style={{ color: "#4B4B4F" }}>
            {result.solusi}
          </p>
        </div>
      </div>
    </section>
  );
}

function ReportPage() {
  const reportData = useReportData();
  const [orgName, setOrgName] = useState("Meridian Supply Chain Command");
  const [authorName, setAuthorName] = useState("");
  const [periodLabel, setPeriodLabel] = useState("");

  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const evaluated = useMemo(
    () =>
      MODULES.map((m) => {
        const raw = reportData[m.id];
        const fn = REPORT_NARRATIVES[m.id];
        const result = raw && fn ? fn(raw) : null;
        return { module: m, result };
      }),
    [reportData]
  );

  const filled = evaluated.filter((e) => e.result);
  const counts = { baik: 0, perhatian: 0, kritis: 0 };
  filled.forEach((e) => {
    counts[e.result.severity] = (counts[e.result.severity] || 0) + 1;
  });

  const priorityItems = filled
    .filter((e) => e.result.severity !== "baik")
    .sort((a, b) => (a.result.severity === "kritis" ? -1 : 1) - (b.result.severity === "kritis" ? -1 : 1));

  const overallSeverity = counts.kritis > 0 ? "kritis" : counts.perhatian > 0 ? "perhatian" : "baik";
  const overallMeta = SEVERITY_META[overallSeverity];

  return (
    <div className="flex flex-col gap-4">
      <ReportPrintStyles />

      {/* Toolbar (screen only) */}
      <Glass className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4">
        <div>
          <p className="text-sm font-semibold">Laporan Analisis Rantai Pasok Terpadu</p>
          <p className="text-[11px]" style={{ color: "#9A9AA0" }}>
            {filled.length} dari {MODULES.length} modul terisi · Isi identitas laporan di bawah lalu unduh sebagai PDF
            melalui dialog cetak browser.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white"
          style={{ background: "linear-gradient(135deg, #0A84FF, #5E9BFF)", boxShadow: "0 4px 14px rgba(10,132,255,0.35)" }}
        >
          <FileDown size={15} />
          Unduh sebagai PDF
        </button>
      </Glass>

      <Glass className="no-print rounded-2xl p-5">
        <p className="mb-3 text-xs font-semibold" style={{ color: "#4B4B4F" }}>
          Identitas Laporan (opsional, akan tampil di sampul)
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <FieldLabel>Nama Organisasi / Perusahaan</FieldLabel>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
            />
          </div>
          <div>
            <FieldLabel>Disusun Oleh</FieldLabel>
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Nama penyusun laporan"
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
            />
          </div>
          <div>
            <FieldLabel>Periode Analisis</FieldLabel>
            <input
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              placeholder="mis. Semester I 2026"
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#1D1D1F" }}
            />
          </div>
        </div>
      </Glass>

      {/* Printable report document */}
      <div
        id="report-print-area"
        className="mx-auto w-full max-w-[860px] rounded-2xl bg-white p-8 sm:p-12"
        style={{ boxShadow: "0 8px 30px rgba(31,41,55,0.08)", color: "#1D1D1F" }}
      >
        {/* Cover page */}
        <div className="report-cover flex min-h-[900px] flex-col">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #0A84FF, #5E9BFF)" }}
            >
              <LayoutGrid size={17} className="text-white" />
            </div>
            <div>
              <p className="text-[15px] font-semibold leading-tight tracking-tight">{orgName || "Meridian Supply Chain Command"}</p>
              <p className="text-[11px] leading-tight" style={{ color: "#6E6E73" }}>
                Dashboard Analisis Rantai Pasok Terpadu
              </p>
            </div>
          </div>

          <div className="my-auto py-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#0A84FF" }}>
              Laporan Analisis
            </p>
            <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight" style={{ color: "#1D1D1F" }}>
              Laporan Analisis
              <br />
              Rantai Pasok Terpadu
            </h1>
            <p className="max-w-md text-sm leading-relaxed" style={{ color: "#6E6E73" }}>
              Ringkasan hasil analisis kuantitatif dari {MODULES.length} modul supply chain management — mencakup
              perencanaan permintaan, pengadaan, produksi, jaringan distribusi, lean six sigma, analitik kinerja,
              manajemen risiko, dan keberlanjutan.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wide" style={{ color: "#9A9AA0" }}>
                  Tanggal Diterbitkan
                </p>
                <p className="font-medium">{today}</p>
              </div>
              {periodLabel && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide" style={{ color: "#9A9AA0" }}>
                    Periode Analisis
                  </p>
                  <p className="font-medium">{periodLabel}</p>
                </div>
              )}
              {authorName && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide" style={{ color: "#9A9AA0" }}>
                    Disusun Oleh
                  </p>
                  <p className="font-medium">{authorName}</p>
                </div>
              )}
              <div>
                <p className="text-[11px] uppercase tracking-wide" style={{ color: "#9A9AA0" }}>
                  Cakupan Modul
                </p>
                <p className="font-medium">{filled.length} dari {MODULES.length} modul terisi</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-4 text-[10.5px]" style={{ borderColor: "#E5E5EA", color: "#B5B5B9" }}>
            <span>Dihasilkan otomatis oleh dashboard Meridian Supply Chain Command</span>
            <span>Dokumen internal — untuk kebutuhan analisis dan pengambilan keputusan</span>
          </div>
        </div>

        {/* Executive summary */}
        <div className="report-page-break">
          <h2 className="mb-1 text-lg font-bold tracking-tight">Ringkasan Eksekutif</h2>
          <p className="mb-5 text-xs" style={{ color: "#8A8A8E" }}>
            Kondisi umum rantai pasok berdasarkan {filled.length} modul yang telah diisi datanya.
          </p>

          <div
            className="report-section mb-5 flex items-center gap-4 rounded-xl border p-4"
            style={{ borderColor: "#E5E5EA", backgroundColor: `${overallMeta.color}0D` }}
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${overallMeta.color}22` }}
            >
              <overallMeta.icon size={20} style={{ color: overallMeta.color }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: overallMeta.color }}>
                Status Umum: {overallMeta.label}
              </p>
              <p className="text-xs" style={{ color: "#4B4B4F" }}>
                {counts.baik} modul dalam kondisi baik, {counts.perhatian} modul perlu perhatian, dan {counts.kritis}{" "}
                modul dalam kondisi kritis.
              </p>
            </div>
          </div>

          <div className="report-section mb-6 space-y-2">
            {evaluated.map(({ module, result }) => {
              const meta = result ? SEVERITY_META[result.severity] : null;
              const Icon = module.icon;
              return (
                <div
                  key={module.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5"
                  style={{ borderColor: "#EFEFF1" }}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Icon size={14} style={{ color: module.accent }} />
                    <span className="truncate text-xs font-medium">{module.name}</span>
                  </div>
                  {meta ? (
                    <span
                      className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: "#F2F2F4", color: "#B5B5B9" }}>
                      Belum diisi
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {priorityItems.length > 0 && (
            <div className="report-section mb-2">
              <h3 className="mb-2 text-sm font-bold tracking-tight">Rencana Tindak Lanjut Prioritas</h3>
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: "#E5E5EA" }}>
                <table className="w-full border-collapse text-[11.5px]">
                  <thead>
                    <tr style={{ backgroundColor: "#F7F7F9" }}>
                      {["Prioritas", "Modul", "Masalah Utama", "Rekomendasi"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold" style={{ color: "#6E6E73" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {priorityItems.map(({ module, result }, i) => {
                      const meta = SEVERITY_META[result.severity];
                      return (
                        <tr key={module.id} style={{ borderTop: "1px solid #EFEFF1" }}>
                          <td className="px-3 py-2.5">
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
                            >
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-medium">{module.name}</td>
                          <td className="px-3 py-2.5" style={{ color: "#4B4B4F" }}>
                            {result.masalah}
                          </td>
                          <td className="px-3 py-2.5" style={{ color: "#4B4B4F" }}>
                            {result.solusi}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Detailed per-module sections */}
        <div className="report-page-break">
          <h2 className="mb-1 text-lg font-bold tracking-tight">Uraian Analisis per Modul</h2>
          <p className="mb-5 text-xs" style={{ color: "#8A8A8E" }}>
            Detail metrik, uraian masalah, analisis penyebab, dan rekomendasi solusi untuk setiap modul.
          </p>
          {evaluated.map(({ module, result }) => (
            <ReportModuleSection key={module.id} module={module} result={result} />
          ))}
        </div>

        <div className="flex items-center justify-between border-t pt-4 text-[10.5px]" style={{ borderColor: "#E5E5EA", color: "#B5B5B9" }}>
          <span>{orgName || "Meridian Supply Chain Command"} · Laporan Analisis Rantai Pasok Terpadu</span>
          <span>Diterbitkan {today}</span>
        </div>
      </div>
    </div>
  );
}

// ---------- App shell ----------

class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("Dashboard error:", error, info);
  }
  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== "undefined") window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex h-screen w-full flex-col items-center justify-center gap-4 p-6 text-center"
          style={{ fontFamily: FONT_STACK, color: "#1D1D1F", background: "linear-gradient(135deg, #E7F0FD 0%, #EFE9FC 45%, #E4F6EF 100%)" }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "rgba(226,104,90,0.12)" }}
          >
            <AlertTriangle size={26} style={{ color: "#C0453A" }} />
          </div>
          <h1 className="text-lg font-semibold">Terjadi kesalahan pada tampilan</h1>
          <p className="max-w-md text-sm" style={{ color: "#6E6E73" }}>
            Sesuatu berjalan tidak sesuai rencana di modul ini. Data Anda yang sudah tersimpan aman — coba muat ulang
            halaman. Jika masalah berlanjut, ekspor backup data Anda sebelum melanjutkan.
          </p>
          <button
            onClick={this.handleReset}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-white"
            style={{ background: "linear-gradient(135deg, #0A84FF, #5E9BFF)" }}
          >
            Muat Ulang Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SCMDashboard() {
  return (
    <DashboardErrorBoundary>
      <ReportProvider>
        <SCMDashboardInner />
      </ReportProvider>
    </DashboardErrorBoundary>
  );
}

function SCMDashboardInner() {
  const [active, setActive] = useState("home");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const activeModule = MODULES.find((m) => m.id === active);
  const fileInputRef = useRef(null);
  const reportData = useReportData();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [active]);

  const homeKpis = useMemo(() => {
    const a = reportData.analytics;
    const r = reportData.risk;
    const l = reportData.lean;
    return [
      { label: "OTIF", value: a?.otifLatest ?? null, unit: "%", accent: "#34B8B0", icon: Activity, sourceModule: "analytics", sourceLabel: "Digital SCM Analytics" },
      { label: "Inventory Turnover", value: a?.turnover ?? null, unit: "x", accent: "#4C86D6", icon: BarChart3, sourceModule: "analytics", sourceLabel: "Digital SCM Analytics" },
      { label: "Lead Time Rata-rata", value: a?.leadTimeLatest ?? null, unit: "hari", accent: "#E2A63B", icon: Truck, sourceModule: "analytics", sourceLabel: "Digital SCM Analytics" },
      { label: "OEE Rata-rata", value: l?.oeeValue ?? null, unit: "%", accent: "#A57FD9", icon: Target, sourceModule: "lean", sourceLabel: "Lean & Six Sigma" },
      { label: "Risiko Aktif", value: r?.totalRisks ?? null, unit: "", accent: "#E2685A", icon: ShieldAlert, sourceModule: "risk", sourceLabel: "Risk Management" },
    ];
  }, [reportData]);

  const savedKeyCount =
    typeof window !== "undefined"
      ? Object.keys(window.localStorage).filter((k) => k.startsWith(STORAGE_PREFIX)).length
      : 0;

  const filledModuleCount = READY_MODULES.filter((id) => Boolean(reportData[id])).length;

  const handleExportData = () => {
    const data = exportAllPersistedData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meridian-scm-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        importAllPersistedData(data);
        window.location.reload();
      } catch {
        window.alert("File backup tidak valid atau rusak. Pastikan file berformat .json hasil ekspor dari dashboard ini.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleResetData = () => {
    if (
      window.confirm(
        "Hapus semua data yang tersimpan di perangkat ini pada seluruh modul? Tindakan ini tidak dapat dibatalkan."
      )
    ) {
      clearAllPersistedData();
      window.location.reload();
    }
  };

  return (
    <div
      className="relative flex h-screen w-full overflow-hidden p-4 gap-4"
      style={{ fontFamily: FONT_STACK, color: "#1D1D1F" }}
    >
      <div
        className="no-print absolute inset-0 -z-10"
        style={{ background: "linear-gradient(135deg, #E7F0FD 0%, #EFE9FC 45%, #E4F6EF 100%)" }}
      />
      <div className="no-print absolute -left-20 -top-32 h-96 w-96 rounded-full blur-3xl -z-10" style={{ backgroundColor: "rgba(76,134,214,0.35)" }} />
      <div className="no-print absolute right-0 top-1/3 h-80 w-80 rounded-full blur-3xl -z-10" style={{ backgroundColor: "rgba(165,127,217,0.30)" }} />
      <div className="no-print absolute bottom-0 left-1/3 h-72 w-72 rounded-full blur-3xl -z-10" style={{ backgroundColor: "rgba(79,174,122,0.25)" }} />

      {/* Backdrop untuk drawer sidebar di layar kecil */}
      {mobileNavOpen && (
        <div
          className="no-print fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Glass
        className={`no-print fixed inset-y-4 left-4 z-50 flex w-64 shrink-0 flex-col rounded-3xl transition-transform duration-300 md:static md:z-auto md:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-[120%]"
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #0A84FF, #5E9BFF)", boxShadow: "0 4px 12px rgba(10,132,255,0.35)" }}
          >
            <LayoutGrid size={17} className="text-white" />
          </div>
          <div>
            <p className="text-[15px] font-semibold leading-tight tracking-tight">Meridian</p>
            <p className="text-[11px] leading-tight" style={{ color: "#6E6E73" }}>
              Supply Chain Command
            </p>
          </div>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg md:hidden"
            style={{ backgroundColor: "rgba(255,255,255,0.6)" }}
          >
            <X size={14} style={{ color: "#4B4B4F" }} />
          </button>
        </div>

        <div className="mx-4 h-px" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />

        <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
          <button
            onClick={() => setActive("home")}
            className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all"
            style={{
              backgroundColor: active === "home" ? "rgba(10,132,255,0.12)" : "transparent",
              color: active === "home" ? "#0A66CC" : "#4B4B4F",
            }}
          >
            <LayoutGrid size={16} />
            Dashboard
          </button>

          <p className="mb-2 mt-4 px-3 text-[11px] font-medium" style={{ color: "#9A9AA0" }}>
            Modul SCM
          </p>

          {MODULES.map((m) => {
            const Icon = m.icon;
            const isActive = active === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActive(m.id)}
                className="relative mb-1 flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200"
                style={{
                  backgroundColor: isActive ? `${m.accent}17` : "transparent",
                  color: isActive ? "#1D1D1F" : "#4B4B4F",
                }}
              >
                {isActive && (
                  <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full" style={{ backgroundColor: m.accent }} />
                )}
                <Icon size={16} style={{ color: isActive ? m.accent : "#8A8A8E" }} />
                <span className="truncate">{m.name}</span>
              </button>
            );
          })}

          <p className="mb-2 mt-4 px-3 text-[11px] font-medium" style={{ color: "#9A9AA0" }}>
            Laporan
          </p>
          <button
            onClick={() => setActive("report")}
            className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all"
            style={{
              backgroundColor: active === "report" ? "rgba(255,255,255,0.7)" : "transparent",
              color: active === "report" ? "#1D1D1F" : "#4B4B4F",
              boxShadow: active === "report" ? "0 2px 10px rgba(31,41,55,0.08)" : "none",
            }}
          >
            <FileText size={16} style={{ color: active === "report" ? "#0A84FF" : "#8A8A8E" }} />
            <span className="truncate">Laporan Lengkap (PDF)</span>
          </button>

          <div className="mt-auto px-1 pt-4">
            <div className="rounded-2xl p-3.5" style={{ backgroundColor: "rgba(255,255,255,0.5)" }}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-medium" style={{ color: "#4B4B4F" }}>
                  Progres Pengisian Data
                </p>
                <p className="text-[11px] font-semibold" style={{ color: "#0A84FF" }}>
                  {filledModuleCount}/{READY_MODULES.length}
                </p>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(filledModuleCount / READY_MODULES.length) * 100}%`,
                    background: "linear-gradient(90deg, #0A84FF, #5E9BFF)",
                  }}
                />
              </div>
              <p className="mt-2 text-[10px] leading-relaxed" style={{ color: "#9A9AA0" }}>
                {filledModuleCount === 0
                  ? "Belum ada modul yang diisi."
                  : filledModuleCount === READY_MODULES.length
                  ? "Semua modul sudah terisi data."
                  : `${READY_MODULES.length - filledModuleCount} modul lagi belum ada data.`}
              </p>
            </div>
          </div>
        </nav>

        <div className="mx-4 h-px" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
        <div className="px-5 py-3.5">
          <div className="mb-2.5 flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: savedKeyCount > 0 ? "#4FAE7A" : "#C7C7CC" }}
            />
            <p className="text-[11px] font-medium" style={{ color: "#4B4B4F" }}>
              {savedKeyCount > 0 ? "Data tersimpan di perangkat ini" : "Belum ada data tersimpan"}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={handleExportData}
              title="Ekspor semua data ke file .json"
              className="flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium"
              style={{ backgroundColor: "rgba(255,255,255,0.6)", color: "#4B4B4F" }}
            >
              <Download size={13} />
              Ekspor
            </button>
            <button
              onClick={handleImportClick}
              title="Impor data dari file .json"
              className="flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium"
              style={{ backgroundColor: "rgba(255,255,255,0.6)", color: "#4B4B4F" }}
            >
              <Upload size={13} />
              Impor
            </button>
            <button
              onClick={handleResetData}
              title="Hapus semua data tersimpan"
              className="flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium"
              style={{ backgroundColor: "rgba(226,104,90,0.12)", color: "#C0453A" }}
            >
              <RotateCcw size={13} />
              Reset
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportFile} className="hidden" />
          <div className="mt-2.5 flex items-start gap-1.5 rounded-lg px-2 py-2" style={{ backgroundColor: "rgba(226,166,59,0.10)" }}>
            <Info size={12} style={{ color: "#B9822A", marginTop: 1, flexShrink: 0 }} />
            <p className="text-[10px] leading-relaxed" style={{ color: "#8A6A22" }}>
              Data hanya tersimpan di browser/perangkat ini, tidak di server. Ekspor backup secara berkala agar tidak hilang saat cache dihapus atau ganti perangkat.
            </p>
          </div>
        </div>
      </Glass>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        <Glass className="no-print flex shrink-0 items-center justify-between rounded-3xl px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl md:hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.6)" }}
            >
              <Menu size={15} style={{ color: "#4B4B4F" }} />
            </button>
            {active !== "home" && (
              <button
                onClick={() => setActive("home")}
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: "rgba(255,255,255,0.6)" }}
              >
                <ArrowLeft size={15} style={{ color: "#4B4B4F" }} />
              </button>
            )}
            <div>
              <p className="text-[11px]" style={{ color: "#9A9AA0" }}>
                {active === "home" ? "Dashboard" : active === "report" ? "Laporan" : "Modul"}
              </p>
              <h1 className="text-lg font-semibold tracking-tight">
                {active === "home" ? "Ringkasan Rantai Pasok" : active === "report" ? "Laporan Lengkap" : activeModule?.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="hidden items-center gap-2 rounded-xl px-3.5 py-2 sm:flex"
              style={{ backgroundColor: "rgba(255,255,255,0.6)" }}
            >
              <Search size={14} style={{ color: "#9A9AA0" }} />
              <input
                placeholder="Cari modul atau data..."
                className="w-40 bg-transparent text-sm outline-none"
                style={{ color: "#1D1D1F" }}
              />
            </div>
            <button className="hidden h-9 w-9 items-center justify-center rounded-xl sm:flex" style={{ backgroundColor: "rgba(255,255,255,0.6)" }}>
              <Bell size={16} style={{ color: "#4B4B4F" }} />
            </button>
            <button
              onClick={handleExportData}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white sm:px-4"
              style={{ background: "linear-gradient(135deg, #0A84FF, #5E9BFF)", boxShadow: "0 4px 14px rgba(10,132,255,0.35)" }}
            >
              <Download size={15} />
              <span className="hidden sm:inline">Ekspor Data</span>
            </button>
          </div>
        </Glass>

        <main className="flex-1 overflow-y-auto pr-1">
          {active === "home" && (
            <>
              {savedKeyCount === 0 && (
                <Glass
                  className="mb-4 flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between"
                  style={{ background: "linear-gradient(135deg, rgba(10,132,255,0.10), rgba(94,155,255,0.04))" }}
                >
                  <div>
                    <h2 className="text-base font-semibold tracking-tight">Selamat datang di Meridian 👋</h2>
                    <p className="mt-1 max-w-xl text-xs leading-relaxed" style={{ color: "#6E6E73" }}>
                      Belum ada data yang diisi di perangkat ini. Mulai dari salah satu dari 8 modul di bawah —
                      data yang Anda masukkan akan otomatis tersinkron ke KPI Dashboard ini dan ke Laporan Lengkap.
                    </p>
                  </div>
                  <button
                    onClick={() => setActive("demand")}
                    className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white"
                    style={{ background: "linear-gradient(135deg, #0A84FF, #5E9BFF)", boxShadow: "0 4px 14px rgba(10,132,255,0.35)" }}
                  >
                    Mulai Sekarang
                    <ChevronRight size={15} />
                  </button>
                </Glass>
              )}

              <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                {homeKpis.map((k) => {
                  const isEmpty = k.value === null || k.value === undefined;
                  return (
                    <Glass
                      key={k.label}
                      className="overflow-hidden rounded-2xl transition-all duration-200"
                      style={{ borderTop: `2px solid ${k.accent}` }}
                    >
                      <button
                        onClick={isEmpty ? () => setActive(k.sourceModule) : undefined}
                        disabled={!isEmpty}
                        className={`flex w-full flex-col p-4 text-left ${isEmpty ? "cursor-pointer hover:-translate-y-0.5 transition-transform duration-200" : "cursor-default"}`}
                      >
                        <div className="mb-2 flex items-center gap-1.5">
                          <k.icon size={12} style={{ color: k.accent }} />
                          <p className="text-[11px]" style={{ color: "#8A8A8E" }}>
                            {k.label}
                          </p>
                        </div>
                        {isEmpty ? (
                          <>
                            <p className="text-lg font-semibold tracking-tight" style={{ color: "#D1D1D6" }}>
                              —
                            </p>
                            <p className="mt-1 text-[10px] leading-snug" style={{ color: "#B5B5B9" }}>
                              Isi data di {k.sourceLabel}
                            </p>
                          </>
                        ) : (
                          <p className="text-2xl font-semibold tracking-tight" style={{ fontVariantNumeric: "tabular-nums" }}>
                            {k.value}
                            <span className="ml-1 text-xs font-normal" style={{ color: "#9A9AA0" }}>
                              {k.unit}
                            </span>
                          </p>
                        )}
                      </button>
                    </Glass>
                  );
                })}
              </div>

              {reportData.analytics?.trend?.length > 1 && (
                <Glass className="mb-4 rounded-2xl p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold">Tren Kinerja Rantai Pasok</h2>
                      <p className="text-[11px]" style={{ color: "#9A9AA0" }}>
                        OTIF (%) vs Lead Time (hari) — dari data modul Digital SCM Analytics
                      </p>
                    </div>
                  </div>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer>
                      <LineChart data={reportData.analytics.trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                        <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#8A8A8E" }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#8A8A8E" }} width={32} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#8A8A8E" }} width={32} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.7)",
                            backgroundColor: "rgba(255,255,255,0.92)",
                            boxShadow: "0 8px 24px rgba(31,41,55,0.12)",
                            fontSize: 12,
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line yAxisId="left" type="monotone" dataKey="otif" name="OTIF %" stroke="#0A84FF" strokeWidth={2} dot={{ r: 3 }} />
                        <Line yAxisId="right" type="monotone" dataKey="leadTime" name="Lead Time" stroke="#E2A63B" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Glass>
              )}

              <div className="mb-4 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold">Modul Analisis</h2>
                <p className="text-[11px]" style={{ color: "#9A9AA0" }}>
                  8 modul · {READY_MODULES.length} aktif
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 pb-2 md:grid-cols-2 xl:grid-cols-4">
                {MODULES.map((m) => {
                  const Icon = m.icon;
                  const isReady = READY_MODULES.includes(m.id);
                  const hasData = Boolean(reportData[m.id]);
                  return (
                    <Glass
                      key={m.id}
                      className="group overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        borderTop: `2px solid ${m.accent}`,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 30px rgba(31,41,55,0.08)",
                      }}
                    >
                      <button onClick={() => setActive(m.id)} className="flex w-full flex-col p-4 text-left">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${m.accent}22` }}>
                            <Icon size={16} style={{ color: m.accent }} />
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isReady && (
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: hasData ? "#4FAE7A" : "rgba(0,0,0,0.12)" }}
                                title={hasData ? "Sudah ada data" : "Belum ada data"}
                              />
                            )}
                            <ChevronRight
                              size={15}
                              className="transition-transform duration-200 group-hover:translate-x-0.5"
                              style={{ color: "#B5B5B9" }}
                            />
                          </div>
                        </div>
                        <p className="mb-1 text-sm font-medium">{m.name}</p>
                        <p className="mb-3 text-xs leading-relaxed" style={{ color: "#8A8A8E" }}>
                          {m.desc}
                        </p>
                        <span
                          className="mt-auto flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium"
                          style={{
                            backgroundColor: isReady ? (hasData ? `${m.accent}22` : "rgba(0,0,0,0.05)") : "rgba(0,0,0,0.04)",
                            color: isReady ? (hasData ? m.accent : "#8A8A8E") : "#B5B5B9",
                          }}
                        >
                          {isReady && hasData && <CheckCircle2 size={11} />}
                          {isReady ? (hasData ? "Data Tersedia" : "Belum Ada Data") : "Segera Hadir"}
                        </span>
                      </button>
                    </Glass>
                  );
                })}
              </div>
            </>
          )}

          {active === "demand" && <DemandPlanningModule accent={activeModule.accent} />}
          {active === "procurement" && <ProcurementModule accent={activeModule.accent} />}
          {active === "production" && <ProductionModule accent={activeModule.accent} />}
          {active === "network" && <NetworkModule accent={activeModule.accent} />}
          {active === "lean" && <LeanSixSigmaModule accent={activeModule.accent} />}
          {active === "analytics" && <AnalyticsModule accent={activeModule.accent} />}
          {active === "risk" && <RiskModule accent={activeModule.accent} />}
          {active === "sustainability" && <SustainabilityModule accent={activeModule.accent} />}
          {active === "report" && <ReportPage />}

          {active !== "home" && active !== "report" && !READY_MODULES.includes(active) && (
            <Glass className="flex flex-col items-center justify-center rounded-2xl p-16 text-center">
              <p className="mb-1 text-sm font-medium">Modul belum dikembangkan</p>
              <p className="text-xs" style={{ color: "#9A9AA0" }}>
                {activeModule?.name} akan menyusul setelah modul-modul sebelumnya selesai.
              </p>
            </Glass>
          )}
        </main>
      </div>
    </div>
  );
}
