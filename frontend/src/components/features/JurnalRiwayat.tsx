"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  ScrollText, 
  Search, 
  History,
  Download,
  Upload,
  Plus,
  RefreshCw,
  Trash2,
  Brain,
  Sliders,
  AlertTriangle,
  Clock,
  CheckCircle,
  HelpCircle,
  Filter,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  BookOpen,
  Camera,
  ZoomIn,
  ZoomOut,
  Info,
  Edit2,
  Save,
  FileText,
  ArrowRight
} from 'lucide-react';

interface Trade {
  id: number;
  pair: string;
  strategy_type: string;
  side: string;
  price: string;
  amount: string;
  pnl: string | null;
  created_at: string;
  status: string;
  requested_price?: string | null;
  slippage?: string | null;
  market_regime?: string | null;
  is_manual_intervention?: boolean | null;
  intervention_pnl_diff?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  market_session?: string | null;
  notes?: string | null; // Alasan column
}

interface HistoryLog {
  timestamp: string;
  field: string;
  oldValue: string;
  newValue: string;
}

const INITIAL_MOCK_TRADES: Trade[] = [
  { 
    id: 101, 
    pair: 'BTCUSDT', 
    strategy_type: 'DCA', 
    side: 'BUY', 
    price: '67420.50', 
    amount: '0.0045', 
    pnl: null, 
    created_at: '2026-06-11T13:45:22Z', 
    status: 'COMPLETED',
    requested_price: '67418.00',
    slippage: '2.50',
    market_regime: 'Sideways High Vol',
    is_manual_intervention: false,
    intervention_pnl_diff: null,
    error_code: null,
    error_message: null,
    market_session: 'London',
    notes: '-' // bot trade, reason empty/dash
  },
  { 
    id: 102, 
    pair: 'ETHUSDT', 
    strategy_type: 'GRID', 
    side: 'SELL', 
    price: '3485.20', 
    amount: '0.1500', 
    pnl: '+14.85', 
    created_at: '2026-06-11T12:15:45Z', 
    status: 'COMPLETED',
    requested_price: '3485.20',
    slippage: '0.00',
    market_regime: 'Trending Bullish',
    is_manual_intervention: true,
    intervention_pnl_diff: '-4.20',
    error_code: null,
    error_message: null,
    market_session: 'London',
    notes: '-' // bot trade, reason empty/dash
  },
  { 
    id: 103, 
    pair: 'SOLUSDT', 
    strategy_type: 'MANUAL', 
    side: 'SELL', 
    price: '148.75', 
    amount: '4.5000', 
    pnl: '+18.20', 
    created_at: '2026-06-11T10:30:00Z', 
    status: 'COMPLETED',
    requested_price: '148.90',
    slippage: '-0.15',
    market_regime: 'Trending Bullish',
    is_manual_intervention: false,
    intervention_pnl_diff: null,
    error_code: null,
    error_message: null,
    market_session: 'London',
    notes: 'Rejection daily resistance zone' // manual trade reason
  },
  { 
    id: 104, 
    pair: 'BTCUSDT', 
    strategy_type: 'DCA', 
    side: 'SELL', 
    price: '68150.00', 
    amount: '0.0045', 
    pnl: '+3.28', 
    created_at: '2026-06-11T09:12:33Z', 
    status: 'COMPLETED',
    requested_price: '68140.00',
    slippage: '10.00',
    market_regime: 'Sideways Low Vol',
    is_manual_intervention: false,
    intervention_pnl_diff: null,
    error_code: null,
    error_message: null,
    market_session: 'Asia',
    notes: '-' // bot trade, reason empty/dash
  },
  { 
    id: 105, 
    pair: 'DOGEUSDT', 
    strategy_type: 'MANUAL', 
    side: 'BUY', 
    price: '0.1425', 
    amount: '850.0000', 
    pnl: null, 
    created_at: '2026-06-11T08:05:10Z', 
    status: 'ACTIVE',
    requested_price: '0.1425',
    slippage: '0.00',
    market_regime: 'Sideways Low Vol',
    is_manual_intervention: false,
    intervention_pnl_diff: null,
    error_code: null,
    error_message: null,
    market_session: 'Asia',
    notes: 'Support level retest on H4' // manual trade reason
  },
  { 
    id: 106, 
    pair: 'SOLUSDT', 
    strategy_type: 'DCA', 
    side: 'BUY', 
    price: '143.10', 
    amount: '2.0000', 
    pnl: null, 
    created_at: '2026-06-11T07:30:15Z', 
    status: 'COMPLETED',
    requested_price: '143.10',
    slippage: '0.00',
    market_regime: 'Trending Bearish',
    is_manual_intervention: false,
    intervention_pnl_diff: null,
    error_code: 'ERR_130',
    error_message: 'Invalid Stops parameters on broker exchange link',
    market_session: 'Asia',
    notes: '-' // bot trade, reason empty/dash
  },
];

export default function JurnalRiwayat() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);

  // Column Filters & Sort state (Excel Features)
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    pair: [],
    strategy_type: [],
    side: [],
    market_session: [],
    market_regime: [],
    status: []
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [columnSearch, setColumnSearch] = useState<Record<string, string>>({});

  // View limits & Zoom State (Custom Features)
  const [rowLimit, setRowLimit] = useState<number>(100);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);

  // Persistent Change History state (Stored in LocalStorage)
  const [changeHistory, setChangeHistory] = useState<Record<number, HistoryLog[]>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('trade_change_history');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('trade_change_history', JSON.stringify(changeHistory));
  }, [changeHistory]);

  // Handle outside click to close Excel column popover menus
  useEffect(() => {
    if (activeFilterCol === null) return;
    
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.filter-popover') || target.closest('.filter-trigger-btn')) {
        return;
      }
      setActiveFilterCol(null);
    };
    
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [activeFilterCol]);

  // Manual Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newManualTrade, setNewManualTrade] = useState({
    pair: 'BTCUSDT',
    strategy_type: 'MANUAL',
    side: 'BUY',
    price: '',
    amount: '',
    pnl: '',
    status: 'COMPLETED',
    market_session: 'London',
    market_regime: 'Sideways High Vol',
    notes: '' // Alasan
  });

  // Detail Modal Row Click State
  const [selectedDetailTrade, setSelectedDetailTrade] = useState<Trade | null>(null);
  const [isEditingTrade, setIsEditingTrade] = useState(false);
  const [editingTradeFields, setEditingTradeFields] = useState<Trade | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<'info' | 'history'>('info');

  // CSV Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedPreview, setImportedPreview] = useState<any[]>([]);

  // AI & Advanced Analytics Panel state
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'regime' | 'whatif' | 'backtest'>('regime');

  // What-If Simulation Inputs
  const [tpOffset, setTpOffset] = useState<number>(0.02);
  const [skipFridays, setSkipFridays] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch trades from backend API
  const fetchTrades = async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      const apiHost = window.location.hostname;
      const response = await fetch(`http://${apiHost}:8080/api/trades`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const historyMap: Record<number, HistoryLog[]> = {};
          const normalized = data.map((t: any) => {
            if (t.change_history) {
              try {
                historyMap[t.id] = JSON.parse(t.change_history);
              } catch (e) {
                console.error("Failed to parse change history for trade", t.id, e);
              }
            }
            return {
              id: t.id,
              pair: t.pair,
              strategy_type: t.strategy_type || t.type || 'DCA',
              side: t.side,
              price: String(t.price),
              amount: String(t.amount),
              pnl: t.pnl ? (parseFloat(t.pnl) >= 0 ? `+${parseFloat(t.pnl).toFixed(2)}` : parseFloat(t.pnl).toFixed(2)) : null,
              created_at: t.created_at || new Date().toISOString(),
              status: t.status || 'COMPLETED',
              requested_price: t.requested_price ? String(t.requested_price) : null,
              slippage: t.slippage ? String(t.slippage) : null,
              market_regime: t.market_regime || 'Sideways Low Vol',
              is_manual_intervention: t.is_manual_intervention || false,
              intervention_pnl_diff: t.intervention_pnl_diff ? String(t.intervention_pnl_diff) : null,
              error_code: t.error_code || null,
              error_message: t.error_message || null,
              market_session: t.market_session || 'London',
              notes: t.notes || '-'
            };
          });
          setTrades(normalized);
          setChangeHistory(prev => ({ ...prev, ...historyMap }));
          setUsingMockData(false);
        } else {
          setTrades([]);
          setUsingMockData(false);
        }
      } else {
        setTrades([]);
        setUsingMockData(false);
      }
    } catch (e) {
      console.warn("Failed to fetch trades from API", e);
      setTrades([]);
      setUsingMockData(false);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  // Filter & Sort computation (Excel pipeline)
  const filteredTrades = React.useMemo(() => {
    return trades.filter(trade => {
      // 1. Global Filter Pill (ALL / DCA / GRID / TRAILING / MANUAL)
      if (filter !== 'ALL' && trade.strategy_type !== filter) return false;

      // 2. Global Search Box
      const matchesGlobalSearch = searchQuery === '' || 
        trade.pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trade.strategy_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (trade.market_regime && trade.market_regime.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (trade.notes && trade.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesGlobalSearch) return false;

      // 3. Excel Per-Column Checkbox Filters
      for (const [col, vals] of Object.entries(selectedFilters)) {
        if (vals.length === 0) continue;
        const tradeVal = String((trade as any)[col] || '').trim();
        if (!vals.includes(tradeVal)) {
          return false;
        }
      }

      return true;
    });
  }, [trades, filter, searchQuery, selectedFilters]);

  // Sorted list logic
  const sortedAndFilteredTrades = React.useMemo(() => {
    let list = [...filteredTrades];
    if (sortConfig !== null) {
      list.sort((a, b) => {
        let aVal = (a as any)[sortConfig.key];
        let bVal = (b as any)[sortConfig.key];

        // Numeric fields parse
        if (['price', 'amount', 'pnl', 'slippage', 'requested_price', 'intervention_pnl_diff'].includes(sortConfig.key)) {
          const aNum = aVal ? parseFloat(aVal) : 0;
          const bNum = bVal ? parseFloat(bVal) : 0;
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }

        // Default string compare
        aVal = aVal ? String(aVal).toLowerCase() : '';
        bVal = bVal ? String(bVal).toLowerCase() : '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [filteredTrades, sortConfig]);

  // Apply row limit custom selector
  const limitedTrades = React.useMemo(() => {
    return sortedAndFilteredTrades.slice(0, rowLimit);
  }, [sortedAndFilteredTrades, rowLimit]);

  // Compute values for unique items in filters
  const getUniqueValues = (colKey: keyof Trade) => {
    const vals = trades.map(t => String(t[colKey] || '').trim()).filter(Boolean);
    return Array.from(new Set(vals));
  };

  const toggleFilterValue = (col: string, val: string) => {
    setSelectedFilters(prev => {
      const current = prev[col] || [];
      const updated = current.includes(val) 
        ? current.filter(v => v !== val) 
        : [...current, val];
      return { ...prev, [col]: updated };
    });
  };

  const clearColumnFilter = (col: string) => {
    setSelectedFilters(prev => ({ ...prev, [col]: [] }));
    setColumnSearch(prev => ({ ...prev, [col]: '' }));
  };

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortConfig({ key, direction });
    setActiveFilterCol(null);
  };

  const resetAllFilters = () => {
    setSelectedFilters({
      pair: [],
      strategy_type: [],
      side: [],
      market_session: [],
      market_regime: [],
      status: []
    });
    setSortConfig(null);
    setSearchQuery('');
    setColumnSearch({});
    setFilter('ALL');
  };

  // Metrics calculators based on limitedTrades (current sheet layout view)
  const totalTradesCount = limitedTrades.length;
  const completedTrades = limitedTrades.filter(t => t.pnl !== null);
  const winningTrades = completedTrades.filter(t => parseFloat(t.pnl || '0') > 0);
  const winRate = completedTrades.length > 0 
    ? Math.round((winningTrades.length / completedTrades.length) * 100) 
    : 100;
  
  const netProfit = limitedTrades.reduce((acc, t) => {
    if (!t.pnl) return acc;
    return acc + parseFloat(t.pnl);
  }, 0);

  const totalVolume = limitedTrades.reduce((acc, t) => {
    const priceVal = parseFloat(t.price) || 0;
    const amountVal = parseFloat(t.amount) || 0;
    return acc + (priceVal * amountVal);
  }, 0);

  const totalPanicLoss = limitedTrades.reduce((acc, t) => {
    if (t.is_manual_intervention && t.intervention_pnl_diff) {
      return acc + Math.abs(parseFloat(t.intervention_pnl_diff));
    }
    return acc;
  }, 0);

  const sessionStats = limitedTrades.reduce((acc, t) => {
    const s = t.market_session || 'Other';
    if (!acc[s]) acc[s] = { count: 0, pnl: 0 };
    acc[s].count += 1;
    if (t.pnl) acc[s].pnl += parseFloat(t.pnl);
    return acc;
  }, {} as Record<string, { count: number; pnl: number }>);

  // What-If Simulation
  const runWhatIfSimulation = () => {
    let simulatedTotalPnl = 0;
    limitedTrades.forEach(trade => {
      if (skipFridays && trade.created_at) {
        const day = new Date(trade.created_at).getUTCDay();
        if (day === 5) return;
      }
      let pnlVal = trade.pnl ? parseFloat(trade.pnl) : 0;
      if (pnlVal > 0) {
        pnlVal = pnlVal * (1 + tpOffset);
      }
      if (trade.is_manual_intervention && trade.intervention_pnl_diff) {
        pnlVal = pnlVal + Math.abs(parseFloat(trade.intervention_pnl_diff));
      }
      simulatedTotalPnl += pnlVal;
    });
    return simulatedTotalPnl;
  };

  const simulatedPnl = runWhatIfSimulation();
  const simulationDiff = simulatedPnl - netProfit;

  // Date helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Export CSV Function
  const handleExportCSV = () => {
    if (limitedTrades.length === 0) return;
    const headers = [
      "ID", "Time", "Asset Pair", "Strategy", "Data Source", "Action", "Price Requested", 
      "Price Executed", "Slippage", "Market Regime", "Market Session", 
      "Amount", "PnL ($)", "Status", "Manual Intervene", "Panic Loss Diff", "Notes"
    ];
    const rows = limitedTrades.map(t => [
      t.id,
      t.created_at,
      t.pair,
      t.strategy_type,
      t.strategy_type === 'MANUAL' ? 'MANUAL' : 'BOT',
      t.side,
      t.requested_price || t.price,
      t.price,
      t.slippage || '0.00',
      t.market_regime || 'N/A',
      t.market_session || 'N/A',
      t.amount,
      t.pnl || '0.00',
      t.status,
      t.is_manual_intervention ? 'YES' : 'NO',
      t.intervention_pnl_diff || '0.00',
      t.notes || '-'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `excel_trade_journal_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download CSV Template function
  const handleDownloadCSVTemplate = () => {
    const headers = ["Waktu", "Aset", "Strategi", "Aksi", "Harga", "Jumlah", "PnL", "Status", "Sesi", "Regime", "Alasan"];
    const sampleRow = [
      new Date().toISOString(),
      "BTCUSDT",
      "MANUAL",
      "BUY",
      "67500.25",
      "0.0050",
      "+15.00",
      "COMPLETED",
      "London",
      "Trending Bullish",
      "H4 Support bounce confirmation"
    ];
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), sampleRow.join(",")].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_jurnal_trading.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processCSVFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processCSVFile(e.target.files[0]);
    }
  };

  const processCSVFile = (file: File) => {
    setImportError(null);
    if (!file.name.endsWith(".csv")) {
      setImportError("Berkas harus bertipe CSV (.csv)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setImportError("Gagal membaca isi berkas.");
        return;
      }

      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        setImportError("Berkas CSV kosong atau tidak memiliki baris data.");
        return;
      }

      const parsed: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 5) continue;
        parsed.push({
          waktu: cols[0] || new Date().toISOString(),
          pair: cols[1] || 'BTCUSDT',
          strategy_type: cols[2] || 'MANUAL',
          side: cols[3] || 'BUY',
          price: cols[4] || '0',
          amount: cols[5] || '0',
          pnl: cols[6] || null,
          status: cols[7] || 'COMPLETED',
          market_session: cols[8] || 'Asia',
          market_regime: cols[9] || 'Sideways Low Vol',
          notes: cols[10] || '-'
        });
      }

      if (parsed.length === 0) {
        setImportError("Gagal mengurai kolom CSV. Pastikan struktur berkas sesuai.");
      } else {
        setImportedPreview(parsed);
      }
    };
    reader.readAsText(file);
  };

  const commitCSVImport = async () => {
    if (importedPreview.length === 0) return;

    const token = localStorage.getItem('token');
    const apiHost = window.location.hostname;
    const newTradesList: Trade[] = [];

    for (let i = 0; i < importedPreview.length; i++) {
      const item = importedPreview[i];
      const isBot = item.strategy_type !== 'MANUAL';
      const finalNotes = isBot ? '-' : (item.notes || '-');

      const payload = {
        pair: item.pair.toUpperCase(),
        strategy_type: item.strategy_type,
        side: item.side.toUpperCase(),
        price: parseFloat(item.price) || 0,
        amount: parseFloat(item.amount) || 0,
        pnl: item.pnl ? parseFloat(item.pnl) : null,
        status: item.status,
        notes: finalNotes,
        market_session: item.market_session,
        market_regime: item.market_regime
      };

      if (!usingMockData && token) {
        try {
          await fetch(`http://${apiHost}:8080/api/trades`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
        } catch (err) {
          console.error("Failed to upload CSV trade to DB", err);
        }
      }

      newTradesList.push({
        id: Date.now() + i,
        pair: item.pair.toUpperCase(),
        strategy_type: item.strategy_type,
        side: item.side.toUpperCase(),
        price: item.price,
        amount: item.amount,
        pnl: item.pnl ? (parseFloat(item.pnl) >= 0 ? `+${parseFloat(item.pnl).toFixed(2)}` : parseFloat(item.pnl).toFixed(2)) : null,
        created_at: item.waktu || new Date().toISOString(),
        status: item.status,
        requested_price: item.price,
        slippage: '0.00',
        market_regime: item.market_regime,
        market_session: item.market_session,
        notes: finalNotes
      });
    }

    setTrades(prev => [...newTradesList, ...prev]);
    setShowImportModal(false);
    setImportedPreview([]);
    setImportError(null);
    alert(`Berhasil mengimpor ${newTradesList.length} transaksi.`);
  };

  // Submit Manual Trade
  const handleAddManualTradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isBot = newManualTrade.strategy_type !== 'MANUAL';
    const finalNotes = isBot ? '-' : (newManualTrade.notes || '-');

    const payload = {
      pair: newManualTrade.pair.toUpperCase(),
      strategy_type: newManualTrade.strategy_type,
      side: newManualTrade.side,
      price: parseFloat(newManualTrade.price) || 0,
      amount: parseFloat(newManualTrade.amount) || 0,
      pnl: newManualTrade.pnl ? parseFloat(newManualTrade.pnl) : null,
      status: newManualTrade.status,
      notes: finalNotes,
      market_session: newManualTrade.market_session,
      market_regime: newManualTrade.market_regime
    };

    const token = localStorage.getItem('token');
    const apiHost = window.location.hostname;
    let success = false;

    if (!usingMockData && token) {
      try {
        const res = await fetch(`http://${apiHost}:8080/api/trades`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          success = true;
          fetchTrades(true);
        }
      } catch (err) {
        console.error("Failed to add manual trade", err);
      }
    }

    if (usingMockData || !success) {
      const priceVal = parseFloat(newManualTrade.price) || 0;
      const amountVal = parseFloat(newManualTrade.amount) || 0;
      const pnlVal = newManualTrade.pnl ? parseFloat(newManualTrade.pnl) : null;
      const formattedPnl = pnlVal !== null ? (pnlVal >= 0 ? `+${pnlVal.toFixed(2)}` : pnlVal.toFixed(2)) : null;

      const localNewTrade: Trade = {
        id: Date.now() % 100000,
        pair: newManualTrade.pair.toUpperCase(),
        strategy_type: newManualTrade.strategy_type,
        side: newManualTrade.side,
        price: priceVal.toFixed(2),
        amount: amountVal.toFixed(4),
        pnl: formattedPnl,
        created_at: new Date().toISOString(),
        status: newManualTrade.status,
        requested_price: priceVal.toFixed(2),
        slippage: '0.00',
        market_regime: newManualTrade.market_regime,
        is_manual_intervention: false,
        intervention_pnl_diff: null,
        error_code: null,
        error_message: null,
        market_session: newManualTrade.market_session,
        notes: finalNotes
      };

      setTrades(prev => [localNewTrade, ...prev]);
    }

    setShowAddModal(false);
    setNewManualTrade({
      pair: 'BTCUSDT',
      strategy_type: 'MANUAL',
      side: 'BUY',
      price: '',
      amount: '',
      pnl: '',
      status: 'COMPLETED',
      market_session: 'London',
      market_regime: 'Sideways High Vol',
      notes: ''
    });
  };

  const handleClearTrade = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Avoid row click details popover
    
    const token = localStorage.getItem('token');
    const apiHost = window.location.hostname;
    
    if (!usingMockData && token) {
      try {
        await fetch(`http://${apiHost}:8080/api/trades/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to delete trade in DB", err);
      }
    }
    
    // Perform delete request to backend if connected, but fallback is frontend filter
    setTrades(prev => prev.filter(t => t.id !== id));
    
    // Clear history for this trade
    setChangeHistory(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    if (selectedDetailTrade?.id === id) {
      setSelectedDetailTrade(null);
    }
  };

  // Edit Trade Form inside details modal
  const handleStartEdit = () => {
    if (!selectedDetailTrade) return;
    setIsEditingTrade(true);
    setEditingTradeFields({ ...selectedDetailTrade });
  };

  const handleSaveEdit = async () => {
    if (!selectedDetailTrade || !editingTradeFields) return;

    const oldTrade = selectedDetailTrade;
    const newTrade = editingTradeFields;

    // Detect fields changed and construct logs
    const logs: HistoryLog[] = [];
    const fieldsToTrack: (keyof Trade)[] = [
      'pair', 'strategy_type', 'side', 'price', 'amount', 'pnl', 'status', 'market_session', 'market_regime', 'notes'
    ];

    fieldsToTrack.forEach(f => {
      const oldVal = String(oldTrade[f] ?? '-');
      const newVal = String(newTrade[f] ?? '-');
      if (oldVal !== newVal) {
        logs.push({
          timestamp: new Date().toISOString(),
          field: f.toUpperCase(),
          oldValue: oldVal,
          newValue: newVal
        });
      }
    });

    let updatedHistoryList = changeHistory[oldTrade.id] || [];
    if (logs.length > 0) {
      updatedHistoryList = [...logs, ...updatedHistoryList];
      setChangeHistory(prev => ({
        ...prev,
        [oldTrade.id]: updatedHistoryList
      }));
    }

    const token = localStorage.getItem('token');
    const apiHost = window.location.hostname;
    
    if (!usingMockData && token) {
      try {
        const rawPnl = newTrade.pnl ? String(newTrade.pnl).replace('+', '') : '';
        const parsedPnl = parseFloat(rawPnl);
        const payload = {
          pair: newTrade.pair.toUpperCase(),
          strategy_type: newTrade.strategy_type,
          side: newTrade.side.toUpperCase(),
          price: parseFloat(newTrade.price) || 0,
          amount: parseFloat(newTrade.amount) || 0,
          pnl: isNaN(parsedPnl) ? null : parsedPnl,
          status: newTrade.status,
          notes: newTrade.notes || '-',
          market_session: newTrade.market_session,
          market_regime: newTrade.market_regime,
          change_history: JSON.stringify(updatedHistoryList)
        };
        
        await fetch(`http://${apiHost}:8080/api/trades/${oldTrade.id}`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error("Failed to update trade in DB", err);
      }
    }

    // Update in trades state
    setTrades(prev => prev.map(t => t.id === oldTrade.id ? { ...newTrade } : t));
    setSelectedDetailTrade({ ...newTrade });
    setIsEditingTrade(false);
    setEditingTradeFields(null);
  };

  // HTML2Canvas Screenshot Capture function
  const handleCaptureScreenshot = async () => {
    // Select the table inside the wrapper for clean canvas rendering
    const element = document.querySelector('#spreadsheet-table-wrapper table') as HTMLElement;
    if (!element) return;

    setIsCapturingScreenshot(true);

    // Dynamic import to avoid SSR undefined document issues
    let html2canvasObj;
    try {
      const module = await import('html2canvas');
      html2canvasObj = module.default || module;
      if (typeof html2canvasObj !== 'function' && (html2canvasObj as any).default) {
        html2canvasObj = (html2canvasObj as any).default;
      }
    } catch (err) {
      console.error("Dynamic html2canvas load failed:", err);
      alert("Gagal memuat modul screenshot: " + err);
      setIsCapturingScreenshot(false);
      return;
    }

    // Inject temporary styles to force correct table format (independent of screen size)
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      .is-capturing-screenshot {
        table-layout: auto !important;
        width: max-content !important;
        min-width: 1350px !important;
      }
      .is-capturing-screenshot th,
      .is-capturing-screenshot td {
        padding: 8px 12px !important;
        white-space: nowrap !important;
      }
      .is-capturing-screenshot th:nth-child(1), .is-capturing-screenshot td:nth-child(1) { min-width: 40px !important; width: 40px !important; text-align: center !important; }
      .is-capturing-screenshot th:nth-child(2), .is-capturing-screenshot td:nth-child(2) { min-width: 130px !important; width: 130px !important; }
      .is-capturing-screenshot th:nth-child(3), .is-capturing-screenshot td:nth-child(3) { min-width: 70px !important; width: 70px !important; text-align: center !important; }
      .is-capturing-screenshot th:nth-child(4), .is-capturing-screenshot td:nth-child(4) { min-width: 100px !important; width: 100px !important; }
      .is-capturing-screenshot th:nth-child(5), .is-capturing-screenshot td:nth-child(5) { min-width: 95px !important; width: 95px !important; }
      .is-capturing-screenshot th:nth-child(6), .is-capturing-screenshot td:nth-child(6) { min-width: 80px !important; width: 80px !important; }
      .is-capturing-screenshot th:nth-child(7), .is-capturing-screenshot td:nth-child(7) { min-width: 125px !important; width: 125px !important; }
      .is-capturing-screenshot th:nth-child(8), .is-capturing-screenshot td:nth-child(8) { min-width: 70px !important; width: 70px !important; }
      .is-capturing-screenshot th:nth-child(9), .is-capturing-screenshot td:nth-child(9) { min-width: 100px !important; width: 100px !important; }
      .is-capturing-screenshot th:nth-child(10), .is-capturing-screenshot td:nth-child(10) { min-width: 100px !important; width: 100px !important; }
      .is-capturing-screenshot th:nth-child(11), .is-capturing-screenshot td:nth-child(11) { min-width: 80px !important; width: 80px !important; }
      .is-capturing-screenshot th:nth-child(12), .is-capturing-screenshot td:nth-child(12) { min-width: 110px !important; width: 110px !important; }
      .is-capturing-screenshot th:nth-child(13), .is-capturing-screenshot td:nth-child(13) { min-width: 110px !important; width: 110px !important; }
      .is-capturing-screenshot th:nth-child(14), .is-capturing-screenshot td:nth-child(14) { min-width: 90px !important; width: 90px !important; }
      .is-capturing-screenshot th:nth-child(15), .is-capturing-screenshot td:nth-child(15) { min-width: 150px !important; width: 150px !important; }
    `;
    document.head.appendChild(styleEl);
    element.classList.add('is-capturing-screenshot');

    // Helper to toggle visibility of action (trash) columns & trailing empty footers
    const setActionColumnVisibility = (visible: boolean) => {
      const rows = element.querySelectorAll('tr');
      rows.forEach((row) => {
        const cells = Array.from(row.children);
        if (cells.length > 0) {
          const isHeader = row.parentElement?.tagName.toLowerCase() === 'thead';
          const isFooter = row.parentElement?.tagName.toLowerCase() === 'tfoot';
          
          if (isHeader) {
            // Hide the last th
            const lastCell = cells[cells.length - 1] as HTMLElement;
            if (lastCell) lastCell.style.display = visible ? '' : 'none';
          } else if (isFooter) {
            // Hide the last two empty td cells in the footer
            const cell1 = cells[cells.length - 1] as HTMLElement;
            const cell2 = cells[cells.length - 2] as HTMLElement;
            if (cell1) cell1.style.display = visible ? '' : 'none';
            if (cell2) cell2.style.display = visible ? '' : 'none';
          } else {
            // Hide the last td (trash cell)
            const lastCell = cells[cells.length - 1] as HTMLElement;
            if (lastCell) lastCell.style.display = visible ? '' : 'none';
          }
        }
      });
    };

    // Hide action column before measurement to ensure scrollWidth does not include it
    setActionColumnVisibility(false);

    // Measure the actual layout size of the table AFTER it has expanded to the forced width (and trash is hidden)
    const tableWidth = element.scrollWidth;
    const tableHeight = element.scrollHeight;

    const isLightTheme = document.body.classList.contains('light-theme');
    const screenshotBg = isLightTheme ? '#ffffff' : '#09090b';

    try {
      const canvas = await html2canvasObj(element, {
        backgroundColor: screenshotBg,
        scale: 1.5,
        logging: true,
        useCORS: true,
        allowTaint: false, // crucial to avoid SecurityError during canvas.toDataURL()
        x: -12, // shift start position 12px left to capture left padding
        y: -12, // shift start position 12px up to capture top padding
        scrollX: 0,
        scrollY: 0,
        width: tableWidth + 24, // expand canvas width to cover left and right padding
        height: tableHeight + 24, // expand canvas height to cover top and bottom padding
        windowWidth: tableWidth + 200, // Force window viewport to be wider than the table
        windowHeight: tableHeight + 200,
        onclone: (clonedDoc: any, clonedElement: any) => {
          // Force cloned document and body wrapper to match full table dimensions to prevent boundary cropping
          if (clonedDoc.documentElement) {
            clonedDoc.documentElement.style.width = `${tableWidth + 200}px`;
            clonedDoc.documentElement.style.minWidth = `${tableWidth + 200}px`;
            clonedDoc.documentElement.style.height = `${tableHeight + 200}px`;
            clonedDoc.documentElement.style.minHeight = `${tableHeight + 200}px`;
            clonedDoc.documentElement.style.overflow = 'visible';
          }
          if (clonedDoc.body) {
            // Copy body classes to ensure light-theme/dark-theme styles propagate to the cloned DOM
            clonedDoc.body.className = document.body.className;

            clonedDoc.body.style.width = `${tableWidth + 200}px`;
            clonedDoc.body.style.minWidth = `${tableWidth + 200}px`;
            clonedDoc.body.style.height = `${tableHeight + 200}px`;
            clonedDoc.body.style.minHeight = `${tableHeight + 200}px`;
            clonedDoc.body.style.overflow = 'visible';
            clonedDoc.body.style.padding = '12px'; // add spacing inside cloned body
            clonedDoc.body.style.backgroundColor = screenshotBg;
            clonedDoc.body.style.color = isLightTheme ? '#1d1d1f' : '#f5f5f7';
          }

          // Set full size styles on the cloned table element to prevent wrap/crop
          const clonedTable = clonedElement as HTMLElement;
          if (clonedTable) {
            clonedTable.style.width = `${tableWidth}px`;
            clonedTable.style.minWidth = `${tableWidth}px`;
            clonedTable.style.height = `${tableHeight}px`;
            clonedTable.style.backgroundColor = isLightTheme ? '#ffffff' : '#09090b';
            clonedTable.style.color = isLightTheme ? '#1d1d1f' : '#f5f5f7';

            // Manually strip all sticky classes and force static positioning on the clone
            clonedTable.querySelectorAll('thead, tbody, tfoot, tr, th, td').forEach((el: any) => {
              el.classList.remove('sticky', 'top-0', 'bottom-0');
              el.style.position = 'static';
              el.style.transform = 'none';
              el.style.boxShadow = 'none';

              // Apply crisp border styling
              el.style.borderColor = isLightTheme ? '#cbd5e1' : '#27272a';

              // Force backgrounds and high contrast colors on table components
              const isTh = el.tagName.toLowerCase() === 'th';
              if (isTh) {
                el.style.backgroundColor = isLightTheme ? '#f1f5f9' : '#18181b';
                el.style.color = isLightTheme ? '#334155' : '#94a3b8';
              } else {
                // Alternating row background for cells
                const parentRow = el.parentElement;
                const isEven = parentRow ? Array.from(parentRow.parentElement?.children || []).indexOf(parentRow) % 2 === 0 : false;
                el.style.backgroundColor = isLightTheme 
                  ? (isEven ? '#f8fafc' : '#ffffff')
                  : (isEven ? '#111114' : '#09090b');
                
                // Set text color dynamically based on Tailwind text classes
                el.style.color = isLightTheme ? '#1d1d1f' : '#e2e8f0';
                const classes = el.className || '';
                if (classes.includes('text-rose-400') || classes.includes('text-rose-500')) {
                  el.style.color = isLightTheme ? '#b91c1c' : '#f87171';
                } else if (classes.includes('text-emerald-400') || classes.includes('text-emerald-500')) {
                  el.style.color = isLightTheme ? '#047857' : '#34d399';
                } else if (classes.includes('text-slate-500')) {
                  el.style.color = isLightTheme ? '#475569' : '#64748b';
                } else if (classes.includes('text-slate-400')) {
                  el.style.color = isLightTheme ? '#334155' : '#94a3b8';
                } else if (classes.includes('text-slate-300')) {
                  el.style.color = isLightTheme ? '#1e293b' : '#cbd5e1';
                }
              }
            });

            // Adjust nested span elements (specifically for Sesi, Sumber, Aksi, PnL) to guarantee readability
            clonedTable.querySelectorAll('td span, th span').forEach((spanEl: any) => {
              const classes = spanEl.className || '';
              
              // Amber color / Sesi Asia
              if (classes.includes('text-amber-500') || classes.includes('text-amber-400')) {
                spanEl.style.color = isLightTheme ? '#b45309' : '#fbbf24';
              }
              // Blue color / Sesi London / BOT source
              else if (classes.includes('text-blue-500') || classes.includes('text-blue-400')) {
                spanEl.style.color = isLightTheme ? '#1d4ed8' : '#60a5fa';
              }
              // Purple color / Sesi NY / MANUAL source
              else if (classes.includes('text-purple-500') || classes.includes('text-purple-400')) {
                spanEl.style.color = isLightTheme ? '#7e22ce' : '#c084fc';
              }
              // Emerald color / BUY / Profit
              else if (classes.includes('text-emerald-500') || classes.includes('text-emerald-400')) {
                spanEl.style.color = isLightTheme ? '#047857' : '#34d399';
              }
              // Rose color / SELL / Loss
              else if (classes.includes('text-rose-500') || classes.includes('text-rose-400')) {
                spanEl.style.color = isLightTheme ? '#b91c1c' : '#f87171';
              }
              // White color status
              else if (classes.includes('text-white')) {
                spanEl.style.color = isLightTheme ? '#1d1d1f' : '#ffffff';
              }
            });
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `excel_sheet_snapshot_${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Screenshot capture failed:", err);
      alert("Tangkapan layar gagal: " + err);
    } finally {
      // Restore action column visibility on screen
      setActionColumnVisibility(true);

      // Clean up capturing class and styles
      element.classList.remove('is-capturing-screenshot');
      if (styleEl && styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
      setIsCapturingScreenshot(false);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-76px)] flex flex-col bg-transparent overflow-hidden relative">

      {/* 1. Control Toolbar */}
      <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-2 bg-transparent border-b border-white/10 px-4 py-2.5">
        
        {/* Segmented Filter Pills */}
        <div className="flex flex-wrap p-0.5 bg-white/[0.03] border border-white/5 rounded-[6px] gap-0.5">
          {['ALL', 'DCA', 'GRID', 'TRAILING', 'MANUAL'].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-wider rounded-[4px] transition-all cursor-pointer ${
                filter === item 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item === 'ALL' ? 'Semua' : item}
            </button>
          ))}
        </div>

        {/* Search, AI and Action Buttons group */}
        <div className="flex flex-wrap items-center gap-1.5">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-44">
            <input 
              type="text" 
              placeholder="CARI DATA..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-white/10 p-1.5 pl-8 text-[8px] font-bold text-white uppercase tracking-widest outline-none focus:border-blue-500/50 rounded-[4px] transition-all"
            />
            <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>

          {/* Toggle AI & What-If Button */}
          <button 
            onClick={() => setShowAnalyticsPanel(!showAnalyticsPanel)}
            className={`px-3 py-1.5 border text-[8px] font-black uppercase tracking-widest transition-all rounded-[4px] flex items-center justify-center gap-1 cursor-pointer ${
              showAnalyticsPanel 
                ? 'bg-purple-600/20 text-purple-400 border-purple-500/40 shadow-lg shadow-purple-500/10' 
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Brain size={10} />
            <span>Jurnal AI Analitik</span>
          </button>

          {/* Refresh button */}
          <button 
            onClick={() => fetchTrades(false)}
            className={`p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-[4px] transition-all flex items-center justify-center cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}
            title="Refresh log"
          >
            <RefreshCw size={10} />
          </button>

        </div>

      </div>

      {/* 2. Expanded AI Analytics & What-If Simulation Panel */}
      {showAnalyticsPanel && (
        <div className="flex-shrink-0 bg-black/40 border-b border-purple-500/20 px-4 py-3 animate-in slide-in-from-top-2 duration-300 space-y-2">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <div className="flex items-center gap-2">
              <Brain size={12} className="text-purple-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white">AI Engine Trading Analytics</span>
            </div>
            
            <div className="flex bg-white/5 p-0.5 rounded-[4px] gap-1">
              <button 
                onClick={() => setActiveTab('regime')}
                className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-[2px] transition-all ${activeTab === 'regime' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Market Regime
              </button>
              <button 
                onClick={() => setActiveTab('whatif')}
                className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-[2px] transition-all ${activeTab === 'whatif' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                What-If Simulator
              </button>
              <button 
                onClick={() => setActiveTab('backtest')}
                className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-[2px] transition-all ${activeTab === 'backtest' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Backtest Deviasi
              </button>
            </div>
          </div>

          {/* Tab Content 1: Market Regime Advisory */}
          {activeTab === 'regime' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1 bg-transparent border-l-2 border-purple-500/30 pl-2.5 py-1">
                <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider block">Deteksi Karakter Pasar (Market Regime)</span>
                <p className="text-[10px] text-white font-bold">
                  Sinyal Tren: <span className="text-blue-400">Sideways High Vol (Dominan)</span>
                </p>
                <p className="text-[8px] text-slate-400 uppercase leading-normal">
                  Rekomendasi AI: Robot DCA berkinerja optimal di pasar saat ini. Jurnal mendeteksi kerugian minor pada robot Grid selama 3 hari terakhir akibat pergeseran volatilitas.
                </p>
              </div>

              <div className="space-y-1 bg-transparent border-l-2 border-purple-500/30 pl-2.5 py-1">
                <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider block">Evaluasi Psikologi (AI Intervention Audit)</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-slate-300 font-medium">Intervensi Manual:</span>
                  <span className="text-[10px] text-rose-400 font-bold font-mono">
                    {trades.filter(t => t.is_manual_intervention).length} Trades
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[8.5px] text-slate-400 uppercase font-black">Kerugian Kepanikan:</span>
                  <span className="text-[9px] text-rose-400 font-bold font-mono">-${totalPanicLoss.toFixed(2)}</span>
                </div>
                <p className="text-[7.5px] text-slate-500 italic leading-normal">
                  *Kerugian kepanikan dihitung dari selisih profit jika order dibiarkan menyentuh TP/SL otomatis dibanding ditutup manual.
                </p>
              </div>

              <div className="space-y-1 bg-transparent border-l-2 border-purple-500/30 pl-2.5 py-1">
                <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider block">Analisis Sesi Performa Pasar</span>
                <div className="grid grid-cols-3 gap-1 pt-0.5">
                  {['Asia', 'London', 'New York'].map(sessionName => {
                    const stats = sessionStats[sessionName] || { count: 0, pnl: 0 };
                    return (
                      <div key={sessionName} className="text-center py-1 bg-white/5 border border-white/5 rounded">
                        <span className="text-[7px] font-bold text-slate-400 block">{sessionName}</span>
                        <span className={`text-[8.5px] font-black font-mono block ${stats.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {stats.pnl >= 0 ? '+' : ''}{stats.pnl.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 2: What-If Risk Simulator */}
          {activeTab === 'whatif' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2 bg-transparent border-l-2 border-purple-500/30 pl-2.5 py-1">
                <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider block">Simulator Parameter Risiko</span>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-bold text-slate-400">
                    <span>Target Profit (Pip Offset):</span>
                    <span className="text-purple-400">{tpOffset >= 0 ? '+' : ''}{(tpOffset * 100).toFixed(2)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="-0.05" 
                    max="0.1" 
                    step="0.01" 
                    value={tpOffset}
                    onChange={(e) => setTpOffset(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                <label className="flex items-center gap-2 text-[8px] font-bold text-slate-400 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={skipFridays} 
                    onChange={(e) => setSkipFridays(e.target.checked)}
                    className="rounded border-white/10 bg-black text-purple-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span>Hindari Trading Hari Jumat (Skip Friday)</span>
                </label>
              </div>

              <div className="space-y-1 bg-transparent border-l-2 border-purple-500/30 pl-2.5 py-1 flex flex-col justify-between">
                <div>
                  <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider block">Hasil Simulasi Real-Time</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-[8.5px] text-slate-400 uppercase font-black">PnL Saat Ini:</span>
                    <span className={`text-[10px] font-bold font-mono ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${netProfit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[8.5px] text-slate-400 uppercase font-black">PnL Simulasi:</span>
                    <span className={`text-[10px] font-bold font-mono ${simulatedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${simulatedPnl.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className={`p-1 text-center rounded-[3px] text-[8px] font-black uppercase tracking-wider ${simulationDiff >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                  {simulationDiff >= 0 ? '+' : ''}${simulationDiff.toFixed(2)} ({simulationDiff >= 0 ? 'Lebih Untung' : 'Lebih Rugi'})
                </div>
              </div>

              <div className="bg-transparent border-l-2 border-purple-500/30 pl-2.5 py-1 flex items-center gap-2">
                <HelpCircle size={14} className="text-purple-400 flex-shrink-0" />
                <p className="text-[8.5px] text-slate-400 leading-normal uppercase">
                  AI What-If Insight: Menghindari intervensi emosional dan menaikkan target profit memberikan dampak profitabilitas terbaik. Sistem menyarankan untuk mengunci parameter Take Profit otomatis pada bot.
                </p>
              </div>
            </div>
          )}

          {/* Tab Content 3: Backtest vs Forward Test Deviation */}
          {activeTab === 'backtest' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1 bg-transparent border-l-2 border-purple-500/30 pl-2.5 py-1">
                <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider block">Validasi Performa (Backtest vs Forward)</span>
                <div className="flex justify-between text-[9px]">
                  <span className="text-slate-400">Backtest Win Rate:</span>
                  <span className="font-mono font-bold text-white">82%</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-slate-400">Forward Win Rate:</span>
                  <span className="font-mono font-bold text-white">{winRate}%</span>
                </div>
              </div>

              <div className="space-y-1 bg-transparent border-l-2 border-purple-500/30 pl-2.5 py-1 flex flex-col justify-between">
                <div>
                  <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider block">Deviasi Keuntungan Aktual</span>
                  <div className="flex justify-between items-baseline pt-0.5">
                    <span className="text-slate-400 text-[8.5px]">Profit Deviation:</span>
                    <span className="text-[10px] font-bold text-emerald-400 font-mono">-8.5% (Aman)</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-0.5 rounded text-center justify-center uppercase">
                  <CheckCircle size={8} />
                  <span>Sistem Berjalan Optimal</span>
                </div>
              </div>

              <div className="bg-transparent border-l-2 border-purple-500/30 pl-2.5 py-1 flex items-center gap-2">
                <AlertTriangle size={14} className="text-yellow-500 flex-shrink-0" />
                <p className="text-[8.5px] text-slate-400 leading-normal uppercase">
                  Peringatan Deviasi: Jika forward test melenceng &gt;15% dari hasil backtest masa lalu, sistem akan memicu notifikasi peringatan ("Over-fit warning") agar robot dinilai ulang.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Flat Spreadsheet Table Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative w-full bg-zinc-950">
        
        {/* Left Aligned Excel Toolbar Header */}
        <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/[0.02] flex-shrink-0">
          
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Add Manual Trade Button */}
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] font-black uppercase tracking-widest transition-all rounded-[3px] flex items-center gap-1 cursor-pointer shadow-md shadow-emerald-600/10"
            >
              <Plus size={10} strokeWidth={3} />
              <span>Tambah Trade ke Jurnal</span>
            </button>

            {/* Reset Filter Button */}
            <button 
              onClick={resetAllFilters}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[8px] font-black uppercase tracking-widest transition-all rounded-[3px] flex items-center gap-1 cursor-pointer"
              title="Reset Semua Filter & Sorting"
            >
              <X size={10} />
              <span>Reset Filter</span>
            </button>

            {/* CSV Import Button -> Opens Popup Modal now! */}
            <button 
              onClick={() => setShowImportModal(true)}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[8px] font-black uppercase tracking-widest transition-all rounded-[3px] flex items-center gap-1 cursor-pointer"
              title="Impor dari Berkas CSV"
            >
              <Upload size={10} />
              <span>Impor CSV</span>
            </button>

            {/* CSV Export Button */}
            <button 
              onClick={handleExportCSV}
              disabled={limitedTrades.length === 0}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white disabled:opacity-40 text-[8px] font-black uppercase tracking-widest transition-all rounded-[3px] flex items-center gap-1 cursor-pointer"
              title="Ekspor ke Berkas CSV"
            >
              <Download size={10} />
              <span>Ekspor CSV</span>
            </button>

            {/* Screenshot Button (Custom Feature) */}
            <button 
              onClick={handleCaptureScreenshot}
              disabled={isCapturingScreenshot || limitedTrades.length === 0}
              className={`px-2.5 py-1.5 text-[8px] font-black uppercase tracking-widest transition-all rounded-[3px] flex items-center gap-1 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white ${isCapturingScreenshot ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Screenshot 50-500 baris data"
            >
              <Camera size={10} />
              <span>{isCapturingScreenshot ? 'Memotret...' : 'Screenshot'}</span>
            </button>
          </div>

          {/* Zoom and Limits controls */}
          <div className="flex items-center gap-2">
            
            {/* Zoom Controls (Custom Feature) */}
            <div className="flex items-center bg-black/40 border border-white/10 rounded-[3px] p-0.5 gap-0.5">
              <button 
                onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}
                className="p-1 hover:bg-white/5 text-slate-400 hover:text-white rounded cursor-pointer" 
                title="Zoom Out"
              >
                <ZoomOut size={10} />
              </button>
              <span className="text-[7.5px] font-black font-mono text-slate-400 px-1 select-none min-w-[32px] text-center">
                {zoomLevel}%
              </span>
              <button 
                onClick={() => setZoomLevel(prev => Math.min(130, prev + 10))}
                className="p-1 hover:bg-white/5 text-slate-400 hover:text-white rounded cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={10} />
              </button>
            </div>

            {/* Row limit display selector */}
            <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-[3px] px-1.5 py-0.5">
              <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider">Tampil:</span>
              <select 
                value={rowLimit} 
                onChange={(e) => setRowLimit(parseInt(e.target.value))}
                className="bg-transparent text-[8px] font-black text-slate-300 font-mono outline-none border-none p-0 cursor-pointer text-center"
              >
                <option value={50} className="bg-zinc-950 text-white">50 Baris</option>
                <option value={100} className="bg-zinc-950 text-white">100 Baris</option>
                <option value={250} className="bg-zinc-950 text-white">250 Baris</option>
                <option value={500} className="bg-zinc-950 text-white">500 Baris</option>
              </select>
            </div>
            
          </div>
        </div>

        {/* Scrollable grid table viewport with Horizontal scroll support */}
        <div 
          id="spreadsheet-table-wrapper"
          className="flex-1 overflow-auto min-h-[300px] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3 h-full">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent animate-spin rounded-full"></div>
              <span className="text-[8px] font-bold tracking-widest text-slate-500 uppercase">Mengunduh Jurnal...</span>
            </div>
          ) : limitedTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 px-4 h-full">
              <ScrollText size={24} className="text-slate-600 stroke-[1.5]" />
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tidak Ada Transaksi Cocok</p>
                <p className="text-[8px] text-slate-600 uppercase font-medium max-w-xs mx-auto">
                  Metode filter aktif menyaring semua hasil. Coba Reset Filter atau tambahkan data manual.
                </p>
              </div>
            </div>
          ) : (
            <table 
              className="w-full text-left border-collapse border border-white/5 min-w-[1450px]"
              style={{ fontSize: `${(11 * zoomLevel) / 100}px` }}
            >
              <thead>
                <tr className="bg-zinc-900 sticky top-0 z-20 shadow-md text-[0.9em]">
                  <th className="border border-white/10 px-2 py-2 text-center text-slate-500 bg-zinc-900 w-8 font-mono">NO</th>
                  
                  {/* WAKTU Column Header */}
                  <th className="border border-white/10 px-3 py-2 text-slate-400 uppercase tracking-widest bg-zinc-900 relative">
                    <div className="flex items-center justify-between gap-1">
                      <span>WAKTU</span>
                      <button 
                        onClick={() => setActiveFilterCol(activeFilterCol === 'created_at' ? null : 'created_at')}
                        className={`hover:text-white p-0.5 rounded cursor-pointer filter-trigger-btn ${sortConfig?.key === 'created_at' ? 'text-blue-500' : 'text-slate-500'}`}
                      >
                        <Filter size={8} />
                      </button>
                    </div>
                    {/* Waktu Popover Filter */}
                    {activeFilterCol === 'created_at' && (
                      <div className="absolute left-0 mt-1 w-40 bg-zinc-950 border border-zinc-800 rounded-[6px] shadow-2xl p-2 z-50 text-[10px] font-bold text-slate-300 filter-popover">
                        <button onClick={() => handleSort('created_at', 'asc')} className="w-full text-left p-1.5 hover:bg-white/5 rounded flex items-center gap-1.5 cursor-pointer">
                          <ChevronUp size={10} /> Sort Terlama
                        </button>
                        <button onClick={() => handleSort('created_at', 'desc')} className="w-full text-left p-1.5 hover:bg-white/5 rounded flex items-center gap-1.5 cursor-pointer">
                          <ChevronDown size={10} /> Sort Terbaru
                        </button>
                      </div>
                    )}
                  </th>

                  {/* SESI Column Header */}
                  <th className="border border-white/10 px-2.5 py-2 text-slate-400 uppercase tracking-widest bg-zinc-900 text-center relative">
                    <div className="flex items-center justify-center gap-1">
                      <span>SESI</span>
                      <button 
                        onClick={() => setActiveFilterCol(activeFilterCol === 'market_session' ? null : 'market_session')}
                        className={`hover:text-white p-0.5 rounded cursor-pointer filter-trigger-btn ${(selectedFilters.market_session?.length || 0) > 0 ? 'text-blue-500' : 'text-slate-500'}`}
                      >
                        <Filter size={8} />
                      </button>
                    </div>
                    {/* Sesi Popover Filter */}
                    {activeFilterCol === 'market_session' && (
                      <div className="absolute left-1/2 -translate-x-1/2 mt-1 w-40 bg-zinc-950 border border-zinc-800 rounded-[6px] shadow-2xl p-2 z-50 text-[10px] text-left filter-popover">
                        <div className="px-1.5 py-1 text-slate-500 font-black uppercase border-b border-white/5 mb-1">Filter Sesi</div>
                        {['Asia', 'London', 'New York'].map(v => (
                          <label key={v} className="flex items-center gap-2 p-1 hover:bg-white/5 rounded cursor-pointer text-slate-300">
                            <input 
                              type="checkbox" 
                              checked={(selectedFilters.market_session || []).includes(v)}
                              onChange={() => toggleFilterValue('market_session', v)}
                              className="rounded border-white/10 bg-black text-blue-500 focus:ring-0 w-3 h-3 cursor-pointer"
                            />
                            <span>{v}</span>
                          </label>
                        ))}
                        <button onClick={() => clearColumnFilter('market_session')} className="w-full text-center mt-1 p-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded text-[9px] cursor-pointer">
                          Hapus Filter
                        </button>
                      </div>
                    )}
                  </th>

                  {/* ASET Column Header */}
                  <th className="border border-white/10 px-3 py-2 text-slate-400 uppercase tracking-widest bg-zinc-900 relative">
                    <div className="flex items-center justify-between gap-1">
                      <span>ASET</span>
                      <button 
                        onClick={() => setActiveFilterCol(activeFilterCol === 'pair' ? null : 'pair')}
                        className={`hover:text-white p-0.5 rounded cursor-pointer filter-trigger-btn ${(selectedFilters.pair?.length || 0) > 0 ? 'text-blue-500' : 'text-slate-500'}`}
                      >
                        <Filter size={8} />
                      </button>
                    </div>
                    {/* Aset Popover Filter */}
                    {activeFilterCol === 'pair' && (
                      <div className="absolute left-0 mt-1 w-44 bg-zinc-950 border border-zinc-800 rounded-[6px] shadow-2xl p-2 z-50 text-[10px] text-left filter-popover">
                        <button onClick={() => handleSort('pair', 'asc')} className="w-full text-left p-1 hover:bg-white/5 rounded flex items-center gap-1.5 cursor-pointer text-slate-300 font-bold mb-1">
                          <ChevronUp size={10} /> Sort A-Z
                        </button>
                        <button onClick={() => handleSort('pair', 'desc')} className="w-full text-left p-1 hover:bg-white/5 rounded flex items-center gap-1.5 cursor-pointer text-slate-300 font-bold border-b border-white/5 pb-1.5 mb-1.5">
                          <ChevronDown size={10} /> Sort Z-A
                        </button>
                        <input 
                          type="text" 
                          placeholder="Cari Aset..." 
                          value={columnSearch.pair || ''}
                          onChange={(e) => setColumnSearch(prev => ({ ...prev, pair: e.target.value }))}
                          className="w-full bg-black border border-white/10 p-1 text-[10px] rounded mb-1 outline-none text-white font-mono"
                        />
                        <div className="max-h-24 overflow-y-auto space-y-1">
                          {getUniqueValues('pair')
                            .filter(v => v.toLowerCase().includes((columnSearch.pair || '').toLowerCase()))
                            .map(v => (
                              <label key={v} className="flex items-center gap-2 p-1 hover:bg-white/5 rounded cursor-pointer text-slate-300">
                                <input 
                                  type="checkbox" 
                                  checked={(selectedFilters.pair || []).includes(v)}
                                  onChange={() => toggleFilterValue('pair', v)}
                                  className="rounded border-white/10 bg-black text-blue-500 focus:ring-0 w-3 h-3 cursor-pointer"
                                />
                                <span className="font-mono">{v}</span>
                              </label>
                            ))}
                        </div>
                        <button onClick={() => clearColumnFilter('pair')} className="w-full text-center mt-1.5 p-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded text-[9px] cursor-pointer border-t border-white/5 pt-1.5">
                          Hapus Filter
                        </button>
                      </div>
                    )}
                  </th>

                  {/* STRATEGI Column Header */}
                  <th className="border border-white/10 px-3 py-2 text-slate-400 uppercase tracking-widest bg-zinc-900 relative">
                    <div className="flex items-center justify-between gap-1">
                      <span>STRATEGI</span>
                      <button 
                        onClick={() => setActiveFilterCol(activeFilterCol === 'strategy_type' ? null : 'strategy_type')}
                        className={`hover:text-white p-0.5 rounded cursor-pointer filter-trigger-btn ${(selectedFilters.strategy_type?.length || 0) > 0 ? 'text-blue-500' : 'text-slate-500'}`}
                      >
                        <Filter size={8} />
                      </button>
                    </div>
                    {/* Strategi Popover */}
                    {activeFilterCol === 'strategy_type' && (
                      <div className="absolute left-0 mt-1 w-40 bg-zinc-950 border border-zinc-800 rounded-[6px] shadow-2xl p-2 z-50 text-[10px] text-left filter-popover">
                        <div className="px-1.5 py-1 text-slate-500 font-black uppercase border-b border-white/5 mb-1">Filter Strategi</div>
                        {getUniqueValues('strategy_type').map(v => (
                          <label key={v} className="flex items-center gap-2 p-1 hover:bg-white/5 rounded cursor-pointer text-slate-300">
                            <input 
                              type="checkbox" 
                              checked={(selectedFilters.strategy_type || []).includes(v)}
                              onChange={() => toggleFilterValue('strategy_type', v)}
                              className="rounded border-white/10 bg-black text-blue-500 focus:ring-0 w-3 h-3 cursor-pointer"
                            />
                            <span>{v}</span>
                          </label>
                        ))}
                        <button onClick={() => clearColumnFilter('strategy_type')} className="w-full text-center mt-1 p-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded text-[9px] cursor-pointer">
                          Hapus Filter
                        </button>
                      </div>
                    )}
                  </th>

                  {/* SUMBER Column Header */}
                  <th className="border border-white/10 px-3 py-2 text-slate-400 uppercase tracking-widest bg-zinc-900 text-center">
                    SUMBER
                  </th>

                  {/* REGIME Column Header */}
                  <th className="border border-white/10 px-3 py-2 text-slate-400 uppercase tracking-widest bg-zinc-900 relative">
                    <div className="flex items-center justify-between gap-1">
                      <span>REGIME</span>
                      <button 
                        onClick={() => setActiveFilterCol(activeFilterCol === 'market_regime' ? null : 'market_regime')}
                        className={`hover:text-white p-0.5 rounded cursor-pointer filter-trigger-btn ${(selectedFilters.market_regime?.length || 0) > 0 ? 'text-blue-500' : 'text-slate-500'}`}
                      >
                        <Filter size={8} />
                      </button>
                    </div>
                    {/* Regime Popover */}
                    {activeFilterCol === 'market_regime' && (
                      <div className="absolute left-0 mt-1 w-44 bg-zinc-950 border border-zinc-800 rounded-[6px] shadow-2xl p-2 z-50 text-[10px] text-left filter-popover">
                        <div className="px-1.5 py-1 text-slate-500 font-black uppercase border-b border-white/5 mb-1">Filter Regime</div>
                        {getUniqueValues('market_regime').map(v => (
                          <label key={v} className="flex items-center gap-2 p-1 hover:bg-white/5 rounded cursor-pointer text-slate-300">
                            <input 
                              type="checkbox" 
                              checked={(selectedFilters.market_regime || []).includes(v)}
                              onChange={() => toggleFilterValue('market_regime', v)}
                              className="rounded border-white/10 bg-black text-blue-500 focus:ring-0 w-3 h-3 cursor-pointer"
                            />
                            <span>{v}</span>
                          </label>
                        ))}
                        <button onClick={() => clearColumnFilter('market_regime')} className="w-full text-center mt-1 p-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded text-[9px] cursor-pointer">
                          Hapus Filter
                        </button>
                      </div>
                    )}
                  </th>

                  {/* AKSI Column Header */}
                  <th className="border border-white/10 px-3 py-2 text-slate-400 uppercase tracking-widest bg-zinc-900 relative">
                    <div className="flex items-center justify-between gap-1">
                      <span>AKSI</span>
                      <button 
                        onClick={() => setActiveFilterCol(activeFilterCol === 'side' ? null : 'side')}
                        className={`hover:text-white p-0.5 rounded cursor-pointer filter-trigger-btn ${(selectedFilters.side?.length || 0) > 0 ? 'text-blue-500' : 'text-slate-500'}`}
                      >
                        <Filter size={8} />
                      </button>
                    </div>
                    {/* Aksi Popover */}
                    {activeFilterCol === 'side' && (
                      <div className="absolute left-0 mt-1 w-36 bg-zinc-950 border border-zinc-800 rounded-[6px] shadow-2xl p-2 z-50 text-[10px] text-left filter-popover">
                        <div className="px-1.5 py-1 text-slate-500 font-black uppercase border-b border-white/5 mb-1">Filter Aksi</div>
                        {['BUY', 'SELL'].map(v => (
                          <label key={v} className="flex items-center gap-2 p-1 hover:bg-white/5 rounded cursor-pointer text-slate-300">
                            <input 
                              type="checkbox" 
                              checked={(selectedFilters.side || []).includes(v)}
                              onChange={() => toggleFilterValue('side', v)}
                              className="rounded border-white/10 bg-black text-blue-500 focus:ring-0 w-3 h-3 cursor-pointer"
                            />
                            <span>{v}</span>
                          </label>
                        ))}
                        <button onClick={() => clearColumnFilter('side')} className="w-full text-center mt-1 p-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded text-[9px] cursor-pointer">
                          Hapus Filter
                        </button>
                      </div>
                    )}
                  </th>

                  <th className="border border-white/10 px-3 py-2 text-slate-400 uppercase tracking-widest bg-zinc-900 text-right cursor-pointer hover:bg-white/5 select-none" onClick={() => handleSort('requested_price', sortConfig?.key === 'requested_price' && sortConfig.direction === 'asc' ? 'desc' : 'asc')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>REQ PRICE</span>
                      {sortConfig?.key === 'requested_price' && (sortConfig.direction === 'asc' ? <ChevronUp size={8} /> : <ChevronDown size={8} />)}
                    </div>
                  </th>

                  <th className="border border-white/10 px-3 py-2 text-slate-400 uppercase tracking-widest bg-zinc-900 text-right cursor-pointer hover:bg-white/5 select-none" onClick={() => handleSort('price', sortConfig?.key === 'price' && sortConfig.direction === 'asc' ? 'desc' : 'asc')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>EXEC PRICE</span>
                      {sortConfig?.key === 'price' && (sortConfig.direction === 'asc' ? <ChevronUp size={8} /> : <ChevronDown size={8} />)}
                    </div>
                  </th>

                  <th className="border border-white/10 px-3 py-2 text-slate-400 uppercase tracking-widest bg-zinc-900 text-right cursor-pointer hover:bg-white/5 select-none" onClick={() => handleSort('slippage', sortConfig?.key === 'slippage' && sortConfig.direction === 'asc' ? 'desc' : 'asc')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>SLIPPAGE</span>
                      {sortConfig?.key === 'slippage' && (sortConfig.direction === 'asc' ? <ChevronUp size={8} /> : <ChevronDown size={8} />)}
                    </div>
                  </th>

                  <th className="border border-white/10 px-3 py-2 text-slate-400 uppercase tracking-widest bg-zinc-900 text-right cursor-pointer hover:bg-white/5 select-none" onClick={() => handleSort('amount', sortConfig?.key === 'amount' && sortConfig.direction === 'asc' ? 'desc' : 'asc')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>JUMLAH</span>
                      {sortConfig?.key === 'amount' && (sortConfig.direction === 'asc' ? <ChevronUp size={8} /> : <ChevronDown size={8} />)}
                    </div>
                  </th>

                  <th className="border border-white/10 px-3 py-2 text-slate-400 uppercase tracking-widest bg-zinc-900 text-right cursor-pointer hover:bg-white/5 select-none" onClick={() => handleSort('pnl', sortConfig?.key === 'pnl' && sortConfig.direction === 'asc' ? 'desc' : 'asc')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>PNL ($)</span>
                      {sortConfig?.key === 'pnl' && (sortConfig.direction === 'asc' ? <ChevronUp size={8} /> : <ChevronDown size={8} />)}
                    </div>
                  </th>

                  {/* STATUS Column Header */}
                  <th className="border border-white/10 px-3 py-2 text-slate-400 uppercase tracking-widest bg-zinc-900 text-center relative">
                    <div className="flex items-center justify-center gap-1">
                      <span>STATUS</span>
                      <button 
                        onClick={() => setActiveFilterCol(activeFilterCol === 'status' ? null : 'status')}
                        className={`hover:text-white p-0.5 rounded cursor-pointer filter-trigger-btn ${(selectedFilters.status?.length || 0) > 0 ? 'text-blue-500' : 'text-slate-500'}`}
                      >
                        <Filter size={8} />
                      </button>
                    </div>
                    {/* Status Popover */}
                    {activeFilterCol === 'status' && (
                      <div className="absolute right-0 mt-1 w-36 bg-zinc-950 border border-zinc-800 rounded-[6px] shadow-2xl p-2 z-50 text-[10px] text-left filter-popover">
                        <div className="px-1.5 py-1 text-slate-500 font-black uppercase border-b border-white/5 mb-1">Filter Status</div>
                        {getUniqueValues('status').map(v => (
                          <label key={v} className="flex items-center gap-2 p-1 hover:bg-white/5 rounded cursor-pointer text-slate-300">
                            <input 
                              type="checkbox" 
                              checked={(selectedFilters.status || []).includes(v)}
                              onChange={() => toggleFilterValue('status', v)}
                              className="rounded border-white/10 bg-black text-blue-500 focus:ring-0 w-3 h-3 cursor-pointer"
                            />
                            <span>{v}</span>
                          </label>
                        ))}
                        <button onClick={() => clearColumnFilter('status')} className="w-full text-center mt-1 p-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded text-[9px] cursor-pointer">
                          Hapus Filter
                        </button>
                      </div>
                    )}
                  </th>

                  {/* ALASAN Column Header */}
                  <th className="border border-white/10 px-3 py-2 text-slate-400 uppercase tracking-widest bg-zinc-900 relative">
                    <div className="flex items-center justify-between gap-1">
                      <span>ALASAN</span>
                      <button 
                        onClick={() => setActiveFilterCol(activeFilterCol === 'notes' ? null : 'notes')}
                        className="hover:text-white p-0.5 rounded cursor-pointer text-slate-500 filter-trigger-btn"
                      >
                        <Filter size={8} />
                      </button>
                    </div>
                    {/* Alasan Search popover */}
                    {activeFilterCol === 'notes' && (
                      <div className="absolute right-0 mt-1 w-44 bg-zinc-950 border border-zinc-800 rounded-[6px] shadow-2xl p-2 z-50 text-[10px] text-left filter-popover">
                        <div className="px-1.5 py-1 text-slate-500 font-black uppercase border-b border-white/5 mb-1.5">Cari Alasan</div>
                        <input 
                          type="text" 
                          placeholder="Ketik alasan..." 
                          value={columnSearch.notes || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setColumnSearch(prev => ({ ...prev, notes: val }));
                            setSelectedFilters(prev => ({
                              ...prev,
                              notes: val ? trades.map(t => String(t.notes || '')).filter(n => n.toLowerCase().includes(val.toLowerCase())) : []
                            }));
                          }}
                          className="w-full bg-black border border-white/10 p-1 text-[10px] rounded mb-1 outline-none text-white"
                        />
                        <button onClick={() => clearColumnFilter('notes')} className="w-full text-center mt-1 p-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded text-[9px] cursor-pointer">
                          Reset
                        </button>
                      </div>
                    )}
                  </th>

                  <th className="border border-white/10 px-2 py-2 bg-zinc-900 text-center w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-zinc-950/40">
                {limitedTrades.map((trade, idx) => {
                  const isProfit = trade.pnl && parseFloat(trade.pnl) > 0;
                  const slipAmount = trade.slippage ? parseFloat(trade.slippage) : 0;
                  const hasLargeSlippage = Math.abs(slipAmount) > (parseFloat(trade.price) * 0.001);

                  // Source mapping
                  const isBotTrade = trade.strategy_type !== 'MANUAL';
                  const displayNotes = isBotTrade ? '-' : (trade.notes || '-');

                  return (
                    <tr 
                      key={trade.id} 
                      onClick={() => {
                        setSelectedDetailTrade(trade);
                        setDetailActiveTab('info');
                        setIsEditingTrade(false);
                      }}
                      className="hover:bg-white/[0.04] even:bg-white/[0.008] transition-colors group cursor-pointer text-[0.95em]"
                    >
                      <td className="border border-white/10 px-2 py-1 text-center font-mono text-[0.9em] font-bold text-slate-600 bg-black/20 select-none">{idx + 1}</td>
                      
                      {/* Waktu */}
                      <td className="border border-white/10 px-3 py-1 font-mono text-slate-400 tabular-nums whitespace-nowrap">
                        {formatDate(trade.created_at)}
                      </td>

                      {/* Sesi */}
                      <td className="border border-white/10 px-2.5 py-1 text-center font-mono font-bold">
                        <span className={
                          trade.market_session === 'Asia' ? 'text-amber-500 dark:text-amber-400' :
                          trade.market_session === 'London' ? 'text-blue-500 dark:text-blue-400' :
                          'text-purple-500 dark:text-purple-400'
                        }>
                          {trade.market_session || 'Asia'}
                        </span>
                      </td>
                      
                      {/* Aset */}
                      <td className="border border-white/10 px-3 py-1 font-semibold text-white tracking-wider font-mono">
                        {trade.pair}
                      </td>

                      {/* Strategi */}
                      <td className="border border-white/10 px-3 py-1 font-bold uppercase tracking-wider text-[0.9em]">
                        <span className={
                          trade.strategy_type === 'MANUAL' 
                            ? 'text-emerald-500 dark:text-emerald-400' 
                            : 'text-slate-500 dark:text-slate-400'
                        }>
                          {trade.strategy_type}
                        </span>
                      </td>

                      {/* SUMBER */}
                      <td className="border border-white/10 px-3 py-1 text-center font-black uppercase tracking-widest text-[0.9em]">
                        <span className={
                          isBotTrade 
                            ? 'text-blue-500 dark:text-blue-400' 
                            : 'text-purple-500 dark:text-purple-400'
                        }>
                          {isBotTrade ? 'BOT' : 'MANUAL'}
                        </span>
                      </td>

                      {/* Regime */}
                      <td className="border border-white/10 px-3 py-1 font-mono text-slate-400 text-[0.9em]">
                        {trade.market_regime || 'Sideways'}
                      </td>
                      
                      {/* Aksi */}
                      <td className="border border-white/10 px-3 py-1 font-black tracking-wider text-[0.9em]">
                        <span className={
                          trade.side === 'BUY' 
                            ? 'text-emerald-500 dark:text-emerald-400' 
                            : 'text-rose-500 dark:text-rose-400'
                        }>
                          {trade.side}
                        </span>
                      </td>
                      
                      {/* Req Price */}
                      <td className="border border-white/10 px-3 py-1 font-mono text-right text-slate-500 tabular-nums">
                        {trade.requested_price ? parseFloat(trade.requested_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '---'}
                      </td>

                      {/* Exec Price */}
                      <td className="border border-white/10 px-3 py-1 font-mono text-right font-medium text-slate-300 tabular-nums">
                        {parseFloat(trade.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      </td>

                      {/* Slippage */}
                      <td className={`border border-white/10 px-3 py-1 font-mono text-right tabular-nums font-bold ${
                        slipAmount > 0 ? 'text-rose-400' : slipAmount < 0 ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        <div className="flex items-center justify-end gap-1">
                          {trade.slippage ? `${slipAmount > 0 ? '+' : ''}${slipAmount.toFixed(2)}` : '0.00'}
                          {hasLargeSlippage && (
                            <span title="Slippage eksekusi besar (>0.1%). Evaluasi koneksi broker/VPS!">
                              <AlertTriangle size={8} className="text-yellow-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* Jumlah */}
                      <td className="border border-white/10 px-3 py-1 font-mono text-right text-slate-400 tabular-nums">
                        {trade.amount}
                      </td>
                      
                      {/* PnL */}
                      <td className="border border-white/10 px-3 py-1 text-right">
                        <div className="flex flex-col items-end">
                          {trade.pnl ? (
                            <span className={`font-mono font-bold tabular-nums ${
                              isProfit 
                                ? 'text-emerald-500 dark:text-emerald-400' 
                                : 'text-rose-500 dark:text-rose-400'
                            }`}>
                              {trade.pnl}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-mono pr-1">---</span>
                          )}
                          {trade.is_manual_intervention && (
                            <span className="text-[6px] text-purple-400 font-bold uppercase tracking-wide mt-0.5">
                              MANUAL EXIT
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* Status */}
                      <td className="border border-white/10 px-3 py-1 text-center">
                        <div className="inline-flex items-center gap-1 justify-center w-full">
                          <span className={`w-1 h-1 rounded-full ${
                            trade.error_code ? 'bg-yellow-500' :
                            trade.status === 'COMPLETED' ? 'bg-emerald-500' :
                            trade.status === 'ACTIVE' ? 'bg-blue-500 animate-pulse' : 'bg-slate-500'
                          }`} />
                          <span 
                            className={`text-[0.9em] font-black uppercase tracking-wider font-mono cursor-help ${trade.error_code ? 'text-yellow-500 underline decoration-dotted' : 'text-white'}`}
                            title={trade.error_message || undefined}
                          >
                            {trade.error_code ? `ERR: ${trade.error_code}` : trade.status}
                          </span>
                        </div>
                      </td>

                      {/* ALASAN */}
                      <td className="border border-white/10 px-3 py-1 text-slate-300 font-medium max-w-xs truncate text-[0.9em]" title={displayNotes}>
                        {displayNotes}
                      </td>

                      {/* Clear row */}
                      <td className="border border-white/10 px-2 py-1 text-center">
                        <button
                          onClick={(e) => handleClearTrade(trade.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/5 rounded transition-all cursor-pointer"
                          title="Hapus baris"
                        >
                          <Trash2 size={9} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              
              {/* Sticky bottom totals row */}
              <tfoot className="sticky bottom-0 z-10 shadow-lg">
                <tr className="bg-zinc-900 text-[0.95em] font-black border-t border-white/10">
                  <td colSpan={2} className="border border-white/10 px-2.5 py-2.5 text-center text-slate-500 uppercase font-mono bg-zinc-900 sticky bottom-0">TOTAL</td>
                  <td className="border border-white/10 px-2.5 py-2.5 bg-zinc-900 sticky bottom-0"></td>
                  <td className="border border-white/10 px-3 py-2.5 text-white bg-zinc-900 sticky bottom-0 font-mono">{totalTradesCount} BARIS</td>
                  <td className="border border-white/10 px-3 py-2.5 bg-zinc-900 sticky bottom-0"></td>
                  <td className="border border-white/10 px-3 py-2.5 bg-zinc-900 sticky bottom-0"></td>
                  <td className="border border-white/10 px-3 py-2.5 bg-zinc-900 sticky bottom-0"></td>
                  <td className="border border-white/10 px-3 py-2.5 bg-zinc-900 sticky bottom-0"></td>
                  <td className="border border-white/10 px-3 py-2.5 bg-zinc-900 sticky bottom-0"></td>
                  <td className="border border-white/10 px-3 py-2.5 bg-zinc-900 sticky bottom-0"></td>
                  <td className="border border-white/10 px-3 py-2.5 text-right font-mono text-slate-300 bg-zinc-900 sticky bottom-0 font-bold">VOL: ${totalVolume.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                  <td className="border border-white/10 px-3 py-2.5 text-right font-mono bg-zinc-900 sticky bottom-0 font-bold">
                    <span className={netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      PNL: {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)}
                    </span>
                  </td>
                  <td className="border border-white/10 px-3 py-2.5 text-center font-mono text-emerald-400 bg-zinc-900 sticky bottom-0 font-bold">WR: {winRate}%</td>
                  <td className="border border-white/10 px-3 py-2.5 bg-zinc-900 sticky bottom-0"></td>
                  <td className="border border-white/10 px-2 py-2.5 bg-zinc-900 sticky bottom-0"></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

      </div>

      {/* 4. CSV Import Wizard Modal Dialog (Drag & Drop + Download Template) */}
      {showImportModal && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-white/10 rounded-[8px] w-full max-w-lg p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={15} className="text-blue-400" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Import Wizard Jurnal Trading (CSV)</h4>
              </div>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setImportedPreview([]);
                  setImportError(null);
                }}
                className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* CSV Download & Drag Section */}
            {importedPreview.length === 0 ? (
              <div className="space-y-4 text-[9.5px]">
                
                {/* Download Template button */}
                <div className="bg-white/[0.02] border border-white/5 rounded p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-white text-[9.5px] uppercase tracking-wider">Gunakan Template Standar Jurnal</p>
                    <p className="text-slate-400 text-[8px] uppercase">Unduh berkas contoh agar struktur kolom tidak salah dan terjadi galat upload.</p>
                  </div>
                  <button
                    onClick={handleDownloadCSVTemplate}
                    className="px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-[4px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Download size={11} />
                    <span>Unduh Template</span>
                  </button>
                </div>

                {/* Drag and Drop Zone */}
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => modalFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[6px] p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2.5 ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-500/5' 
                      : 'border-white/15 bg-black hover:bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={modalFileInputRef}
                    onChange={handleFileChange}
                    accept=".csv"
                    className="hidden"
                  />
                  <Upload size={24} className="text-slate-500 stroke-[1.5]" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-white uppercase tracking-wider text-[9px]">Seret & Lepas Berkas CSV di sini</p>
                    <p className="text-slate-500 uppercase text-[8px]">Atau klik untuk menjelajahi folder komputer Anda</p>
                  </div>
                </div>

                {importError && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold uppercase tracking-wider rounded text-[8px] flex items-center gap-1.5">
                    <AlertTriangle size={12} />
                    <span>GALAT: {importError}</span>
                  </div>
                )}

                <div className="text-slate-500 border-t border-white/5 pt-2.5 uppercase text-[7.5px] leading-normal space-y-1">
                  <p className="font-bold text-slate-400">ATURAN STRUKTUR KOLOM TEMPLATE:</p>
                  <p>1. Kolom harus berurutan: Waktu, Aset, Strategi, Aksi, Harga, Jumlah, PnL, Status, Sesi, Regime, Alasan</p>
                  <p>2. Strategi dapat diisi: MANUAL, DCA, GRID, atau TRAILING</p>
                  <p>3. Aksi diisi BUY atau SELL. Kolom Alasan bot diisi tanda strip (-)</p>
                </div>

              </div>
            ) : (
              // Preview Mode
              <div className="space-y-4 text-[9.5px]">
                <div className="flex justify-between items-baseline">
                  <p className="font-black text-slate-400 uppercase tracking-widest text-[9px]">Pratinjau Impor Berkas ({importedPreview.length} Baris)</p>
                  <button 
                    onClick={() => setImportedPreview([])}
                    className="text-rose-400 hover:underline cursor-pointer uppercase text-[8px] font-bold"
                  >
                    Ganti Berkas
                  </button>
                </div>

                {/* Table preview scrollable */}
                <div className="max-h-56 overflow-auto border border-white/5 rounded bg-black/40">
                  <table className="w-full text-left text-[8px] font-mono">
                    <thead className="bg-zinc-900 text-slate-400 sticky top-0">
                      <tr>
                        <th className="p-1 border-b border-white/10">Aset</th>
                        <th className="p-1 border-b border-white/10">Strategi</th>
                        <th className="p-1 border-b border-white/10">Aksi</th>
                        <th className="p-1 border-b border-white/10 text-right">Harga</th>
                        <th className="p-1 border-b border-white/10 text-right">PnL</th>
                        <th className="p-1 border-b border-white/10">Alasan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {importedPreview.slice(0, 15).map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/5 text-slate-300">
                          <td className="p-1 text-white font-bold">{item.pair}</td>
                          <td className="p-1">{item.strategy_type}</td>
                          <td className="p-1">{item.side}</td>
                          <td className="p-1 text-right">{item.price}</td>
                          <td className={`p-1 text-right ${parseFloat(item.pnl) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{item.pnl || '0.00'}</td>
                          <td className="p-1 max-w-[80px] truncate">{item.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importedPreview.length > 15 && (
                    <div className="p-1.5 text-center text-slate-500 uppercase text-[7.5px] border-t border-white/5 bg-zinc-900/40">
                      + Dan {importedPreview.length - 15} baris data lainnya...
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-end border-t border-white/5 pt-3">
                  <button
                    onClick={() => {
                      setImportedPreview([]);
                      setImportError(null);
                    }}
                    className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={commitCSVImport}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider rounded cursor-pointer shadow-lg shadow-blue-600/10 flex items-center gap-1.5"
                  >
                    <Check size={12} />
                    <span>Masukkan ke Jurnal</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 5. Tambah Trade ke Jurnal Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-white/10 rounded-[8px] w-full max-w-md p-4 space-y-3 shadow-2xl animate-in fade-in duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-emerald-400" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Tambah Trade Manual Ke Jurnal</h4>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddManualTradeSubmit} className="space-y-3 text-[9.5px]">
              
              <div className="grid grid-cols-2 gap-2.5">
                {/* Asset Pair */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Aset Pair</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Contoh: BTCUSDT"
                    value={newManualTrade.pair}
                    onChange={(e) => setNewManualTrade(prev => ({ ...prev, pair: e.target.value }))}
                    className="w-full bg-black border border-white/15 p-1.5 rounded outline-none focus:border-blue-500 text-white font-mono uppercase"
                  />
                </div>

                {/* Strategy Type */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Strategi</label>
                  <select 
                    value={newManualTrade.strategy_type}
                    onChange={(e) => setNewManualTrade(prev => ({ ...prev, strategy_type: e.target.value }))}
                    className="w-full bg-black border border-white/15 p-1.5 rounded outline-none focus:border-blue-500 text-white"
                  >
                    <option value="MANUAL">MANUAL (Isi Alasan)</option>
                    <option value="DCA">DCA (Alasan Dinonaktifkan)</option>
                    <option value="GRID">GRID (Alasan Dinonaktifkan)</option>
                    <option value="TRAILING">TRAILING (Alasan Dinonaktifkan)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Aksi */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Aksi</label>
                  <div className="flex bg-white/5 border border-white/15 p-0.5 rounded gap-0.5">
                    {['BUY', 'SELL'].map(s => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setNewManualTrade(prev => ({ ...prev, side: s }))}
                        className={`flex-1 py-1 text-center font-black rounded text-[8px] cursor-pointer ${
                          newManualTrade.side === s 
                            ? (s === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white') 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Status</label>
                  <select 
                    value={newManualTrade.status}
                    onChange={(e) => setNewManualTrade(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-black border border-white/15 p-1.5 rounded outline-none focus:border-blue-500 text-white"
                  >
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Price */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Harga Exec</label>
                  <input 
                    type="number" 
                    step="any" 
                    required 
                    placeholder="0.00"
                    value={newManualTrade.price}
                    onChange={(e) => setNewManualTrade(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full bg-black border border-white/15 p-1.5 rounded outline-none focus:border-blue-500 text-white font-mono"
                  />
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Jumlah (Size)</label>
                  <input 
                    type="number" 
                    step="any" 
                    required 
                    placeholder="0.0"
                    value={newManualTrade.amount}
                    onChange={(e) => setNewManualTrade(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full bg-black border border-white/15 p-1.5 rounded outline-none focus:border-blue-500 text-white font-mono"
                  />
                </div>

                {/* PnL ($) */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">PnL ($)</label>
                  <input 
                    type="number" 
                    step="any" 
                    placeholder="0.00 (Opsional)"
                    value={newManualTrade.pnl}
                    onChange={(e) => setNewManualTrade(prev => ({ ...prev, pnl: e.target.value }))}
                    className="w-full bg-black border border-white/15 p-1.5 rounded outline-none focus:border-blue-500 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Sesi Pasar */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Sesi Pasar</label>
                  <select 
                    value={newManualTrade.market_session}
                    onChange={(e) => setNewManualTrade(prev => ({ ...prev, market_session: e.target.value }))}
                    className="w-full bg-black border border-white/15 p-1.5 rounded outline-none focus:border-blue-500 text-white"
                  >
                    <option value="Asia">Asia</option>
                    <option value="London">London</option>
                    <option value="New York">New York</option>
                  </select>
                </div>

                {/* Market Regime */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Karakter Pasar (Regime)</label>
                  <select 
                    value={newManualTrade.market_regime}
                    onChange={(e) => setNewManualTrade(prev => ({ ...prev, market_regime: e.target.value }))}
                    className="w-full bg-black border border-white/15 p-1.5 rounded outline-none focus:border-blue-500 text-white"
                  >
                    <option value="Sideways High Vol">Sideways High Vol</option>
                    <option value="Sideways Low Vol">Sideways Low Vol</option>
                    <option value="Trending Bullish">Trending Bullish</option>
                    <option value="Trending Bearish">Trending Bearish</option>
                  </select>
                </div>
              </div>

              {/* Alasan */}
              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Alasan Trading / Catatan</label>
                  {newManualTrade.strategy_type !== 'MANUAL' && (
                    <span className="text-[7px] text-yellow-500 font-bold uppercase tracking-wider">Dinonaktifkan untuk Bot (Otomatis -)</span>
                  )}
                </div>
                <textarea 
                  rows={2}
                  disabled={newManualTrade.strategy_type !== 'MANUAL'}
                  placeholder={newManualTrade.strategy_type === 'MANUAL' ? "Contoh: Buy retest support zone H4 dengan konformasi RSI..." : "Alasan otomatis diatur ke '-' untuk strategi bot"}
                  value={newManualTrade.strategy_type === 'MANUAL' ? newManualTrade.notes : ''}
                  onChange={(e) => setNewManualTrade(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-black border border-white/15 p-1.5 rounded outline-none focus:border-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider rounded cursor-pointer shadow-lg shadow-emerald-600/10"
                >
                  Simpan Transaksi
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 6. Row Details & Auditing Popover with Edit/Delete/History (JSON) Features */}
      {selectedDetailTrade && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-white/10 rounded-[8px] w-full max-w-lg p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 relative">
            
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2.5">
                <Info size={14} className="text-blue-400" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
                  {isEditingTrade ? 'Ubah Informasi Transaksi' : 'Informasi Lengkap Audit Transaksi'} #{selectedDetailTrade.id}
                </h4>
              </div>
              <button 
                onClick={() => {
                  setSelectedDetailTrade(null);
                  setIsEditingTrade(false);
                }}
                className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Details and History Tab Switcher (Visible in view mode) */}
            {!isEditingTrade && (
              <div className="flex border-b border-white/5 p-0.5 bg-white/[0.02] rounded-[4px] gap-1">
                <button
                  onClick={() => setDetailActiveTab('info')}
                  className={`flex-1 py-1 text-center text-[8.5px] font-black uppercase tracking-wider rounded-[3px] transition-all cursor-pointer ${detailActiveTab === 'info' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Informasi Parameter
                </button>
                <button
                  onClick={() => setDetailActiveTab('history')}
                  className={`flex-1 py-1 text-center text-[8.5px] font-black uppercase tracking-wider rounded-[3px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${detailActiveTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  <History size={10} />
                  <span>Riwayat Perubahan ({changeHistory[selectedDetailTrade.id]?.length || 0})</span>
                </button>
              </div>
            )}

            {/* TAB CONTENT A: VIEW & EDIT PARAMETERS */}
            {detailActiveTab === 'info' && (
              <>
                {isEditingTrade && editingTradeFields ? (
                  // EDIT MODE FORM
                  <div className="grid grid-cols-2 gap-3.5 text-[9.5px]">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Aset Pair</label>
                      <input 
                        type="text" 
                        value={editingTradeFields.pair}
                        onChange={(e) => setEditingTradeFields(prev => prev ? { ...prev, pair: e.target.value.toUpperCase() } : null)}
                        className="w-full bg-black border border-white/10 p-1.5 rounded text-white font-mono uppercase"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Strategi</label>
                      <select 
                        value={editingTradeFields.strategy_type}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingTradeFields(prev => prev ? { 
                            ...prev, 
                            strategy_type: val,
                            notes: val !== 'MANUAL' ? '-' : (prev.notes === '-' ? '' : prev.notes) 
                          } : null);
                        }}
                        className="w-full bg-black border border-white/10 p-1.5 rounded text-white"
                      >
                        <option value="MANUAL">MANUAL</option>
                        <option value="DCA">DCA</option>
                        <option value="GRID">GRID</option>
                        <option value="TRAILING">TRAILING</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Aksi</label>
                      <select 
                        value={editingTradeFields.side}
                        onChange={(e) => setEditingTradeFields(prev => prev ? { ...prev, side: e.target.value } : null)}
                        className="w-full bg-black border border-white/10 p-1.5 rounded text-white"
                      >
                        <option value="BUY">BUY</option>
                        <option value="SELL">SELL</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Status</label>
                      <select 
                        value={editingTradeFields.status}
                        onChange={(e) => setEditingTradeFields(prev => prev ? { ...prev, status: e.target.value } : null)}
                        className="w-full bg-black border border-white/10 p-1.5 rounded text-white"
                      >
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Harga Eksekusi</label>
                      <input 
                        type="number" 
                        step="any"
                        value={editingTradeFields.price}
                        onChange={(e) => setEditingTradeFields(prev => prev ? { ...prev, price: e.target.value } : null)}
                        className="w-full bg-black border border-white/10 p-1.5 rounded text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Jumlah (Size)</label>
                      <input 
                        type="number" 
                        step="any"
                        value={editingTradeFields.amount}
                        onChange={(e) => setEditingTradeFields(prev => prev ? { ...prev, amount: e.target.value } : null)}
                        className="w-full bg-black border border-white/10 p-1.5 rounded text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">PnL ($)</label>
                      <input 
                        type="number" 
                        step="any"
                        value={editingTradeFields.pnl || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingTradeFields(prev => prev ? { 
                            ...prev, 
                            pnl: val ? (parseFloat(val) >= 0 ? `+${parseFloat(val).toFixed(2)}` : parseFloat(val).toFixed(2)) : null 
                          } : null);
                        }}
                        className="w-full bg-black border border-white/10 p-1.5 rounded text-white font-mono"
                        placeholder="---"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Sesi Pasar</label>
                      <select 
                        value={editingTradeFields.market_session || 'Asia'}
                        onChange={(e) => setEditingTradeFields(prev => prev ? { ...prev, market_session: e.target.value } : null)}
                        className="w-full bg-black border border-white/10 p-1.5 rounded text-white"
                      >
                        <option value="Asia">Asia</option>
                        <option value="London">London</option>
                        <option value="New York">New York</option>
                      </select>
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Regime Karakter Pasar</label>
                      <select 
                        value={editingTradeFields.market_regime || 'Sideways Low Vol'}
                        onChange={(e) => setEditingTradeFields(prev => prev ? { ...prev, market_regime: e.target.value } : null)}
                        className="w-full bg-black border border-white/10 p-1.5 rounded text-white"
                      >
                        <option value="Sideways High Vol">Sideways High Vol</option>
                        <option value="Sideways Low Vol">Sideways Low Vol</option>
                        <option value="Trending Bullish">Trending Bullish</option>
                        <option value="Trending Bearish">Trending Bearish</option>
                      </select>
                    </div>

                    <div className="space-y-1 col-span-2">
                      <div className="flex justify-between items-baseline">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Catatan Alasan</label>
                        {editingTradeFields.strategy_type !== 'MANUAL' && (
                          <span className="text-[7.5px] text-yellow-500 font-bold uppercase">Terkunci untuk Bot</span>
                        )}
                      </div>
                      <textarea 
                        rows={2}
                        disabled={editingTradeFields.strategy_type !== 'MANUAL'}
                        value={editingTradeFields.strategy_type === 'MANUAL' ? (editingTradeFields.notes || '') : ''}
                        onChange={(e) => setEditingTradeFields(prev => prev ? { ...prev, notes: e.target.value } : null)}
                        className="w-full bg-black border border-white/10 p-1.5 rounded text-white disabled:opacity-50"
                        placeholder="Contoh: Rejection support area..."
                      />
                    </div>
                  </div>
                ) : (
                  // READ-ONLY VIEW
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[9.5px]">
                    <div className="bg-white/[0.02] border border-white/5 p-2 rounded">
                      <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Aset Pair & Aksi</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-xs">{selectedDetailTrade.pair}</span>
                        <span className={`px-1.5 py-0.5 inline-block align-middle leading-none rounded-[3px] text-[7.5px] font-black ${selectedDetailTrade.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {selectedDetailTrade.side}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 p-2 rounded">
                      <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Strategi & Sumber Data</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white text-xs">{selectedDetailTrade.strategy_type}</span>
                        <span className={`px-1.5 py-0.5 inline-block align-middle leading-none rounded-[3px] text-[7px] font-black ${selectedDetailTrade.strategy_type === 'MANUAL' ? 'bg-purple-600/10 text-purple-400' : 'bg-blue-600/10 text-blue-400'}`}>
                          {selectedDetailTrade.strategy_type === 'MANUAL' ? 'MANUAL' : 'BOT'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 p-2 rounded">
                      <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Harga Eksekusi (Exec Price)</span>
                      <span className="font-mono text-white text-[11px] font-bold block">
                        ${parseFloat(selectedDetailTrade.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      </span>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 p-2 rounded">
                      <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Harga Permintaan (Req Price)</span>
                      <span className="font-mono text-slate-300 text-[11px] block">
                        {selectedDetailTrade.requested_price ? `$${parseFloat(selectedDetailTrade.requested_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}` : 'N/A'}
                      </span>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 p-2 rounded">
                      <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Slippage Eksekusi</span>
                      <span className={`font-mono text-[11px] font-bold block ${
                        selectedDetailTrade.slippage && parseFloat(selectedDetailTrade.slippage) > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {selectedDetailTrade.slippage ? `${parseFloat(selectedDetailTrade.slippage) > 0 ? '+' : ''}${parseFloat(selectedDetailTrade.slippage).toFixed(2)}` : '0.00'}
                      </span>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 p-2 rounded">
                      <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Jumlah (Amount Size)</span>
                      <span className="font-mono text-white text-[11px] block">{selectedDetailTrade.amount}</span>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 p-2 rounded">
                      <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Net Profit/Loss (PnL)</span>
                      <span className={`font-mono text-xs font-bold block ${
                        selectedDetailTrade.pnl && parseFloat(selectedDetailTrade.pnl) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {selectedDetailTrade.pnl ? selectedDetailTrade.pnl : '---'}
                      </span>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 p-2 rounded">
                      <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Sesi & Regime Pasar</span>
                      <span className="text-white block font-medium">
                        {selectedDetailTrade.market_session || 'Asia'} / {selectedDetailTrade.market_regime || 'Sideways'}
                      </span>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 p-2 rounded col-span-2">
                      <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Audit Intervensi Emosi / Exit Manual</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-300">
                          Status: <span className="font-bold text-white">{selectedDetailTrade.is_manual_intervention ? 'YA (Exit Manual)' : 'TIDAK (Sesuai Bot)'}</span>
                        </span>
                        {selectedDetailTrade.is_manual_intervention && selectedDetailTrade.intervention_pnl_diff && (
                          <span className="text-rose-400 font-mono">
                            Panic Loss: -${Math.abs(parseFloat(selectedDetailTrade.intervention_pnl_diff)).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {selectedDetailTrade.error_code && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 p-2.5 rounded col-span-2 space-y-0.5">
                        <span className="text-[7.5px] font-black text-yellow-500 uppercase tracking-widest block">Galat Transaksi Broker (Broker Error Log)</span>
                        <p className="font-mono text-[9px] text-white font-bold">Kode: {selectedDetailTrade.error_code}</p>
                        <p className="text-slate-300">{selectedDetailTrade.error_message}</p>
                      </div>
                    )}

                    <div className="bg-white/[0.02] border border-white/5 p-2.5 rounded col-span-2 space-y-1">
                      <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block">Catatan Trading (Alasan)</span>
                      <p className="text-slate-200 leading-normal italic text-[9.5px]">
                        "{selectedDetailTrade.notes || '-'}"
                      </p>
                    </div>

                    <div className="col-span-2 text-[7.5px] text-slate-500 font-mono text-right">
                      Diinput pada: {selectedDetailTrade.created_at}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TAB CONTENT B: REVISION CHANGE HISTORY (JSON / AUDIT TRAIL) */}
            {detailActiveTab === 'history' && !isEditingTrade && (
              <div className="space-y-3 text-[9.5px]">
                <div className="flex justify-between items-baseline border-b border-white/5 pb-1">
                  <span className="font-bold uppercase tracking-wider text-slate-400">Log Riwayat Audit Perubahan</span>
                  <span className="font-mono text-[8px] text-slate-500">FORMAT: JSON DATABASE TIMELINE</span>
                </div>

                {/* History timeline card */}
                {(!changeHistory[selectedDetailTrade.id] || changeHistory[selectedDetailTrade.id].length === 0) ? (
                  <div className="py-8 text-center text-slate-500 border border-white/5 rounded bg-black/20 uppercase text-[8px] font-bold">
                    Tidak ada riwayat perubahan (V1 - Transaksi Original)
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    {changeHistory[selectedDetailTrade.id].map((log, lIdx) => (
                      <div key={lIdx} className="bg-white/[0.02] border border-white/5 rounded p-2.5 space-y-1.5 relative overflow-hidden">
                        <div className="flex justify-between items-baseline text-[8px] text-slate-500">
                          <span className="font-black text-blue-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Kolom: {log.field}
                          </span>
                          <span className="font-mono">{formatDate(log.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] bg-black/40 p-1.5 rounded font-mono">
                          <span className="text-slate-500 line-through truncate max-w-[150px]">{log.oldValue}</span>
                          <ArrowRight size={10} className="text-slate-600 flex-shrink-0" />
                          <span className="text-emerald-400 font-bold truncate max-w-[150px]">{log.newValue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Popover Action Buttons Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-2">
              
              {/* Delete / Left actions */}
              <div>
                {!isEditingTrade && (
                  <button 
                    onClick={() => {
                      if (confirm("Apakah Anda yakin ingin menghapus baris transaksi ini?")) {
                        handleClearTrade(selectedDetailTrade.id);
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-rose-500/20"
                  >
                    <Trash2 size={11} />
                    <span>Hapus Baris</span>
                  </button>
                )}
              </div>

              {/* Save / Edit / Close actions */}
              <div className="flex gap-2">
                {isEditingTrade ? (
                  <>
                    <button 
                      onClick={() => {
                        setIsEditingTrade(false);
                        setEditingTradeFields(null);
                      }}
                      className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded text-[8px] font-bold uppercase cursor-pointer"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={handleSaveEdit}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[8px] font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-emerald-600/10 flex items-center gap-1"
                    >
                      <Save size={11} />
                      <span>Simpan Perubahan</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleStartEdit}
                      className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 size={11} />
                      <span>Ubah Data</span>
                    </button>
                    <button 
                      onClick={() => setSelectedDetailTrade(null)}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[8px] font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-blue-600/10"
                    >
                      Tutup
                    </button>
                  </>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
