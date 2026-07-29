import React, { useState, useEffect } from 'react';
import { db } from './lib/db';
import {
  MapPin,
  Package,
  Users,
  LayoutDashboard,
  AlertTriangle,
  Search,
  Bell,
  UserPlus,
  Clock,
  Tent,
  Wallet,
  TrendingUp,
  TrendingDown,
  Download,
  Megaphone,
  User,
  ShieldAlert,
  LocateFixed,
  Filter,
  UserCog,
  Edit,
  Trash2,
  Shield,
  Briefcase,
  Newspaper,
  ExternalLink
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap, LayersControl, LayerGroup, Polyline } from 'react-leaflet';
import L from 'leaflet';

const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]).join(',');
  const csvContent = [
    headers,
    ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Fix for default marker icon in leaflet with React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const customIcon = new L.Icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

const getStatusIcon = (status: string) => {
  const color = status === 'Aktif' ? '#10b981' : '#f59e0b'; // Emerald for Aktif, Amber for Siaga
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg>`;
  return L.divIcon({
    className: 'custom-div-icon bg-transparent border-none',
    html: `<div style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${svgIcon}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};


export default function App() {
  const [appMode, setAppMode] = useState<'public' | 'admin'>('public');
  const [user, setUser] = useState<any>(null);

  if (appMode === 'public') {
    return (
      <PublicPortal 
        onLogin={(userData) => {
          setUser(userData);
          setAppMode('admin');
        }} 
      />
    );
  }

  return (
    <AdminDashboard 
      user={user} 
      onLogout={() => {
        setUser(null);
        setAppMode('public');
      }} 
    />
  );
}

function AdminDashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl font-extrabold tracking-tighter text-white">Pantau Posko Indonesia</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon={<LayoutDashboard />} label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Tent />} label="Pengungsi" isActive={activeTab === 'pengungsi'} onClick={() => setActiveTab('pengungsi')} />
          <NavItem icon={<Package />} label="Logistik" isActive={activeTab === 'logistik'} onClick={() => setActiveTab('logistik')} />
          <NavItem icon={<Users />} label="Relawan" isActive={activeTab === 'relawan'} onClick={() => setActiveTab('relawan')} />
          {user?.role === 'superadmin' && <NavItem icon={<UserCog />} label="Manajemen SDM" isActive={activeTab === 'sdm'} onClick={() => setActiveTab('sdm')} />}
          <NavItem icon={<Wallet />} label="Keuangan" isActive={activeTab === 'keuangan'} onClick={() => setActiveTab('keuangan')} />
          <NavItem icon={<MapPin />} label="Peta Lokasi" isActive={activeTab === 'peta'} onClick={() => setActiveTab('peta')} />
          <NavItem icon={<Megaphone />} label="Siaran Posko" isActive={activeTab === 'siaran'} onClick={() => setActiveTab('siaran')} />
          <NavItem icon={<Newspaper />} label="Berita Bencana" isActive={activeTab === 'berita'} onClick={() => setActiveTab('berita')} />
        </nav>
        <div className="p-4 border-t border-slate-800">
           <div className="px-4 py-2 text-xs text-slate-400">
             Logged in as: <strong className="text-white block truncate">{user?.full_name} ({user?.role})</strong>
           </div>
           <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors mt-2">
              Kembali ke Portal
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-800 capitalize">
            {activeTab === 'peta' ? 'Peta Lokasi' : activeTab}
          </h2>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-slate-300 rounded-full border-2 border-slate-400 flex items-center justify-center font-bold text-slate-700">
              {user?.username?.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'dashboard' && <DashboardView user={user} />}
          {activeTab === 'pengungsi' && <PengungsiView user={user} />}
          {activeTab === 'logistik' && <LogistikView user={user} />}
          {activeTab === 'peta' && <PetaView user={user} />}
          {activeTab === 'relawan' && <RelawanView user={user} />}
          {activeTab === 'sdm' && user?.role === 'superadmin' && <SdmView user={user} />}
          {activeTab === 'keuangan' && <KeuanganView user={user} />}
          {activeTab === 'siaran' && <SiaranView user={user} />}
          {activeTab === 'berita' && <BeritaView />}
        </div>
      </main>
    </div>
  );
}

// --- Sub-components ---

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactElement, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
        isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {React.cloneElement(icon, { className: 'w-5 h-5' })}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function MapZoomTo({ position, zoom = 15 }: { position: [number, number] | null, zoom?: number }) {
  const map = useMap();
  React.useEffect(() => {
    if (position) {
      map.flyTo(position, zoom, { duration: 1.5 });
    }
  }, [position, zoom, map]);
  return null;
}

function DashboardView({ user }: { user: any }) {
  const [selectedPoskoPos, setSelectedPoskoPos] = useState<[number, number] | null>(null);
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Aktif' | 'Siaga'>('Semua');
  const [poskoData, setPoskoData] = useState<any[]>([]);

  useEffect(() => {
    db.posko.getAll().then(data => {
      let filtered = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        status: p.status,
        currentLoad: p.current_load ?? p.currentLoad ?? 0,
        maxCapacity: p.max_capacity ?? p.maxCapacity ?? 100,
        status_approval: p.status_approval
      }));

      // Only show approved poskos to relawan unless it's their own posko
      if (user?.role === 'relawan' && user?.posko_id) {
        filtered = filtered.filter(p => p.id === Number(user.posko_id));
      } else if (user?.role === 'superadmin') {
        // Superadmin shows all
      } else {
        // Only show approved
        filtered = filtered.filter(p => p.status_approval === 'approved');
      }

      setPoskoData(filtered);
    });
  }, [user]);

  const filteredPoskoData = poskoData.filter(posko => statusFilter === 'Semua' || posko.status === statusFilter);

  const getCapacityColor = (current: number, max: number) => {
    const percentage = current / max;
    if (percentage >= 0.9) return 'bg-red-50 text-red-700 border-red-200';
    if (percentage >= 0.6) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Relawan" value="124" icon={<Users className="text-blue-500" />} trend="+12 hari ini" />
        <StatCard title="Posko Aktif" value="8" icon={<MapPin className="text-red-500" />} trend="Semua beroperasi" />
        <StatCard title="Status Logistik" value="Aman" icon={<Package className="text-emerald-500" />} trend="Stok beras menipis" alert />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Peta Sebaran Posko</h3>
            <div className="flex gap-3 text-xs font-medium items-center">
              <span className="text-slate-500 mr-2">Filter:</span>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-white border border-slate-200 text-slate-700 text-xs rounded focus:ring-blue-500 focus:border-blue-500 block p-1.5 cursor-pointer"
              >
                <option value="Semua">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Siaga">Siaga</option>
              </select>
            </div>
          </div>
          <div className="flex-1 relative z-0">
            <MapContainer center={[-6.2088, 106.8456]} zoom={11} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {filteredPoskoData.map(posko => (
                <Marker key={posko.id} position={[posko.lat, posko.lng]} icon={getStatusIcon(posko.status)}>
                  <Popup>
                    <div className="font-sans">
                      <h4 className="font-semibold text-slate-800 m-0 mb-1">{posko.name}</h4>
                      <p className="text-sm text-slate-600 m-0 mb-2">Status: <strong className={posko.status === 'Aktif' ? 'text-emerald-600' : 'text-amber-600'}>{posko.status}</strong></p>
                      <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getCapacityColor(posko.currentLoad, posko.maxCapacity)}`}>
                        Kapasitas: {posko.currentLoad} / {posko.maxCapacity}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              <MapZoomTo position={selectedPoskoPos} />
            </MapContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Daftar Posko</h3>
            <span className="text-xs font-medium bg-slate-200 text-slate-600 py-1 px-2 rounded-full">{filteredPoskoData.length} posko</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-2">
              {filteredPoskoData.map(posko => (
                <button 
                  key={posko.id} 
                  onClick={() => setSelectedPoskoPos([posko.lat, posko.lng])}
                  className="w-full text-left p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors group flex items-start gap-3 justify-between"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className={`w-5 h-5 shrink-0 mt-0.5 ${posko.status === 'Aktif' ? 'text-emerald-500' : 'text-amber-500'}`} />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{posko.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">Status: {posko.status}</p>
                    </div>
                  </div>
                  <div className={`shrink-0 px-2 py-1 rounded-md text-[10px] font-bold border ${getCapacityColor(posko.currentLoad, posko.maxCapacity)}`}>
                    {posko.currentLoad}/{posko.maxCapacity}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Aktivitas Terkini</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
              <div>
                <p className="text-sm font-medium text-slate-800">Distribusi logistik ke Posko {i} selesai</p>
                <p className="text-xs text-slate-500">2 jam yang lalu</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, alert }: { title: string, value: string, icon: React.ReactNode, trend: string, alert?: boolean }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-50 rounded-lg">{icon}</div>
        {alert && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
      </div>
      <h4 className="text-slate-500 text-sm font-medium">{title}</h4>
      <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
      <p className="text-sm text-slate-500 mt-2">{trend}</p>
    </div>
  );
}

function LogistikView({ user }: { user: any }) {
  const [activeSubTab, setActiveSubTab] = useState('daftar');
  const [filterKategori, setFilterKategori] = useState('Semua');
  const [logistik, setLogistik] = useState<any[]>([]);

  useEffect(() => {
    db.logistik.getAll().then(data => {
      let filtered = data;
      if (user?.role === 'relawan' && user?.posko_id) {
        filtered = data.filter((item: any) => Number(item.posko_id) === Number(user.posko_id));
      }
      setLogistik(filtered);
    });
  }, [user]);

  const filteredLogistik = filterKategori === 'Semua' 
    ? logistik 
    : logistik.filter(item => item.kategori === filterKategori);

  const categories = ['Semua', 'Pangan', 'P3K', 'Sandang'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex border-b border-slate-200 gap-6">
        <button 
          onClick={() => setActiveSubTab('daftar')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeSubTab === 'daftar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Daftar Logistik
        </button>
        <button 
          onClick={() => setActiveSubTab('kelola')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeSubTab === 'kelola' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Kelola Barang & Kategori
        </button>
        <button 
          onClick={() => setActiveSubTab('catat')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeSubTab === 'catat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Pencatatan Masuk/Keluar
        </button>
      </div>

      {activeSubTab === 'daftar' && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Cari logistik..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterKategori(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filterKategori === cat 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => exportToCSV(filteredLogistik, 'laporan_logistik.csv')}
                className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Export Laporan
              </button>
              <button onClick={() => setActiveSubTab('catat')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                Tambah Stok
              </button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                  <th className="p-4 font-medium">Nama Barang</th>
                  <th className="p-4 font-medium">Kategori</th>
                  <th className="p-4 font-medium">Stok</th>
                  <th className="p-4 font-medium">Satuan</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogistik.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800">{item.nama}</td>
                <td className="p-4 text-slate-600">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200">
                    {item.kategori}
                  </span>
                </td>
                <td className="p-4 text-slate-600">{item.stok}</td>
                <td className="p-4 text-slate-600">{item.satuan}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    item.status === 'Aman' ? 'bg-emerald-100 text-emerald-700' :
                    item.status === 'Menipis' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        </>
      )}

      {activeSubTab === 'kelola' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Kelola Nama Barang & Kategori</h3>
          <p className="text-sm text-slate-500 mb-6">Tambahkan kategori atau jenis barang baru ke dalam sistem logistik.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700">Tambah Kategori Baru</h4>
              <div className="flex gap-2">
                <input type="text" placeholder="Nama Kategori..." className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700">Simpan</button>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700">Tambah Nama Barang</h4>
              <div className="flex flex-col gap-2">
                <input type="text" placeholder="Nama Barang..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex gap-2">
                  <select className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Pilih Kategori</option>
                    {categories.filter(c => c !== 'Semua').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Simpan</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'catat' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Pencatatan Masuk & Keluar Logistik</h3>
          <form className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Transaksi</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="masuk">Barang Masuk (Donasi/Drop)</option>
                <option value="keluar">Barang Keluar (Distribusi)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Barang</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Pilih Barang...</option>
                {logistik.map(l => <option key={l.id} value={l.id}>{l.nama} ({l.satuan})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah</label>
              <input type="number" min="1" placeholder="Masukkan jumlah..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan / Tujuan / Sumber</label>
              <textarea rows={3} placeholder="Catatan tambahan..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
            <button type="button" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Simpan Pencatatan
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function PetaView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedPos, setSearchedPos] = useState<[number, number] | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Aktif' | 'Siaga' | 'Kritis' | 'Membutuhkan Bantuan'>('Semua');

  const poskoLocations = [
    { id: 1, name: 'Posko Siaga Jakarta Pusat', lat: -6.1751, lng: 106.8272, status: 'Aktif' },
    { id: 2, name: 'Posko Bantuan Jakarta Selatan', lat: -6.2416, lng: 106.8108, status: 'Siaga' },
    { id: 3, name: 'Posko Relawan Jakarta Timur', lat: -6.2250, lng: 106.9004, status: 'Aktif' },
    { id: 4, name: 'Posko Darurat Ciliwung', lat: -6.2100, lng: 106.8600, status: 'Kritis' },
    { id: 5, name: 'Posko Medis Kampung Melayu', lat: -6.2200, lng: 106.8700, status: 'Membutuhkan Bantuan' },
  ];

  const filteredPoskoLocations = poskoLocations.filter(posko => statusFilter === 'Semua' || posko.status === statusFilter);

  const bencanaLocations = [
    { id: 1, name: 'Titik Banjir Bandang', lat: -6.2300, lng: 106.8500, radius: 2000, severity: 'Tinggi' },
    { id: 2, name: 'Tanah Longsor', lat: -6.2800, lng: 106.8000, radius: 1000, severity: 'Sedang' },
  ];

  const aksesJalan = [
    { id: 1, name: 'Jalur Evakuasi Utama', positions: [[-6.1751, 106.8272], [-6.2088, 106.8456], [-6.2250, 106.9004]] as [number, number][], color: 'blue' },
    { id: 2, name: 'Jalan Terputus', positions: [[-6.2300, 106.8500], [-6.2416, 106.8108]] as [number, number][], color: 'red', dashArray: '5, 10' }
  ];

  const searchResults = [
    ...poskoLocations.map(p => ({ id: `p-${p.id}`, name: p.name, lat: p.lat, lng: p.lng, type: 'Posko' })),
    ...bencanaLocations.map(b => ({ id: `b-${b.id}`, name: b.name, lat: b.lat, lng: b.lng, type: 'Area Bencana' }))
  ].filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
          setSearchedPos(loc);
          setUserLocation(loc);
        },
        (error) => {
          console.error("Error getting location: ", error);
          alert("Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.");
        }
      );
    } else {
      alert("Geolocation tidak didukung oleh browser ini.");
    }
  };

  return (
    <div className="h-full flex flex-col rounded-xl overflow-hidden shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500 z-0 relative">
      <div className="absolute top-4 left-4 z-[400] w-80 max-w-[calc(100vw-2rem)] flex flex-col gap-2">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Cari posko atau area bencana..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          <button 
            onClick={handleGetCurrentLocation}
            className="flex-shrink-0 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-3 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-600 group"
            title="Lokasi Saat Ini"
          >
            <LocateFixed className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
        
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-2 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 ml-2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="flex-1 bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer outline-none"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Siaga">Siaga</option>
            <option value="Kritis">Kritis</option>
            <option value="Membutuhkan Bantuan">Membutuhkan Bantuan</option>
          </select>
        </div>
        
        {searchQuery && (
          <div className="mt-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-h-60 overflow-y-auto">
            {searchResults.length > 0 ? (
              <ul className="py-2">
                {searchResults.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setSearchedPos([item.lat, item.lng]);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors flex flex-col"
                    >
                      <span className="text-sm font-semibold text-slate-800">{item.name}</span>
                      <span className="text-xs text-slate-500">{item.type}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">Tidak ditemukan</div>
            )}
          </div>
        )}
      </div>

      <MapContainer 
        center={[-6.2088, 106.8456]} // Center around Jakarta
        zoom={11} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', minHeight: '500px' }}
      >
        <MapZoomTo position={searchedPos} />
        {userLocation && (
          <Marker position={userLocation} icon={customIcon}>
            <Popup>
              <div className="font-sans font-medium text-blue-600">Lokasi Anda</div>
            </Popup>
          </Marker>
        )}
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Peta Dasar">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.Overlay checked name="Posko">
            <LayerGroup>
              {filteredPoskoLocations.map((posko) => (
                <Marker key={`posko-${posko.id}`} position={[posko.lat, posko.lng]} icon={customIcon}>
                  <Popup>
                    <div className="font-sans">
                      <h4 className="font-semibold text-slate-800 m-0 leading-none mb-1">{posko.name}</h4>
                      <p className="text-sm text-slate-600 m-0 mt-1">Status: <span className="font-medium text-blue-600">{posko.status}</span></p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Area Bencana">
            <LayerGroup>
              {bencanaLocations.map((bencana) => (
                <Circle 
                  key={`bencana-${bencana.id}`} 
                  center={[bencana.lat, bencana.lng]} 
                  radius={bencana.radius}
                  pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }}
                >
                  <Popup>
                    <div className="font-sans">
                      <h4 className="font-semibold text-red-700 m-0 leading-none mb-1">{bencana.name}</h4>
                      <p className="text-sm text-slate-600 m-0 mt-1">Tingkat Bahaya: <span className="font-bold">{bencana.severity}</span></p>
                    </div>
                  </Popup>
                </Circle>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Akses Jalan">
            <LayerGroup>
              {aksesJalan.map((jalan) => (
                <Polyline 
                  key={`jalan-${jalan.id}`} 
                  positions={jalan.positions} 
                  pathOptions={{ color: jalan.color, dashArray: jalan.dashArray, weight: 4 }}
                >
                  <Popup>
                    <div className="font-sans">
                      <h4 className="font-semibold text-slate-800 m-0 leading-none mb-1">{jalan.name}</h4>
                    </div>
                  </Popup>
                </Polyline>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>
    </div>
  );
}

function RelawanView() {
  const [selectedRelawan, setSelectedRelawan] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState('daftar');

  const [relawan, setRelawan] = useState([
    { 
      id: 1, nama: 'Budi Santoso', kontak: '081234567890', keahlian: ['Medis', 'Evakuasi'], tugas: 'Posko Utama - Tenda A', shiftMulai: '08:00', shiftSelesai: '16:00', status: 'Aktif',
      riwayatPenugasan: [
        { tanggal: '2026-06-28', tugas: 'Pencarian area longsor', status: 'Selesai' },
        { tanggal: '2026-06-29', tugas: 'Distribusi logistik', status: 'Selesai' },
        { tanggal: '2026-06-30', tugas: 'Posko Utama - Tenda A', status: 'Sedang Berjalan' },
      ],
      kehadiran: 'Hadir', bergabungSejak: '2026-06-25'
    },
    { 
      id: 2, nama: 'Siti Aminah', kontak: '081298765432', keahlian: ['Dapur Umum', 'Logistik'], tugas: 'Dapur Posko C', shiftMulai: '06:00', shiftSelesai: '14:00', status: 'Aktif',
      riwayatPenugasan: [
        { tanggal: '2026-06-28', tugas: 'Dapur Posko A', status: 'Selesai' },
        { tanggal: '2026-06-29', tugas: 'Dapur Posko B', status: 'Selesai' },
        { tanggal: '2026-06-30', tugas: 'Dapur Posko C', status: 'Sedang Berjalan' },
      ],
      kehadiran: 'Hadir', bergabungSejak: '2026-06-26'
    },
    { 
      id: 3, nama: 'Agus Pratama', kontak: '085612345678', keahlian: ['Evakuasi'], tugas: '-', shiftMulai: '-', shiftSelesai: '-', status: 'Istirahat',
      riwayatPenugasan: [
        { tanggal: '2026-06-28', tugas: 'Evakuasi warga', status: 'Selesai' },
        { tanggal: '2026-06-29', tugas: 'Evakuasi warga', status: 'Selesai' },
      ],
      kehadiran: 'Absen', bergabungSejak: '2026-06-25'
    },
    { 
      id: 4, nama: 'dr. Ratna', kontak: '081122334455', keahlian: ['Medis'], tugas: 'Klinik Darurat', shiftMulai: '14:00', shiftSelesai: '22:00', status: 'Aktif',
      riwayatPenugasan: [
        { tanggal: '2026-06-29', tugas: 'Klinik Utama', status: 'Selesai' },
        { tanggal: '2026-06-30', tugas: 'Klinik Darurat', status: 'Sedang Berjalan' },
      ],
      kehadiran: 'Hadir', bergabungSejak: '2026-06-28'
    },
  ]);

  const handleAbsenRelawanChange = (id: number, newAbsen: string) => {
    setRelawan(relawan.map(r => r.id === id ? { ...r, kehadiran: newAbsen } : r));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex border-b border-slate-200 gap-6">
        <button 
          onClick={() => setActiveSubTab('daftar')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeSubTab === 'daftar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Daftar Relawan
        </button>
        <button 
          onClick={() => setActiveSubTab('catat')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeSubTab === 'catat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Pendaftaran Relawan Baru
        </button>
      </div>

      {activeSubTab === 'daftar' && (
        <>
          <div className="flex justify-between items-center">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Cari relawan atau keahlian..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                  <th className="p-4 font-medium">Profil Relawan</th>
                  <th className="p-4 font-medium">Keahlian</th>
                  <th className="p-4 font-medium">Penugasan Saat Ini</th>
                  <th className="p-4 font-medium">Status / Shift</th>
                  <th className="p-4 font-medium">Absensi (Klik untuk ubah)</th>
                </tr>
              </thead>
              <tbody>
                {relawan.map((item) => (
                  <tr key={item.id} onClick={() => setSelectedRelawan(item)} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{item.nama}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.kontak}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {item.keahlian.map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-700">
                      {item.tugas}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={`w-fit px-2.5 py-1 text-xs font-medium rounded-full ${
                          item.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.status}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {item.shiftMulai !== '-' ? `${item.shiftMulai} - ${item.shiftSelesai}` : '-'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <select
                        value={item.kehadiran}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleAbsenRelawanChange(item.id, e.target.value);
                        }}
                        className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none border-none ${
                          item.kehadiran === 'Hadir' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        <option value="Hadir">Hadir</option>
                        <option value="Absen">Absen</option>
                        <option value="Sakit">Sakit</option>
                        <option value="Izin">Izin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeSubTab === 'catat' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Pendaftaran Relawan Baru</h3>
          <form className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
              <input type="text" placeholder="Masukkan nama..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Kontak / WA</label>
              <input type="text" placeholder="08..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Keahlian (Pisahkan dengan koma)</label>
              <input type="text" placeholder="Contoh: Medis, Dapur Umum, Evakuasi..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shift Mulai</label>
                <input type="time" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shift Selesai</label>
                <input type="time" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Penugasan Awal</label>
              <input type="text" placeholder="Lokasi tugas..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="button" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Daftarkan Relawan
            </button>
          </form>
        </div>
      )}

      {selectedRelawan && activeSubTab === 'daftar' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedRelawan(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedRelawan.nama}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {selectedRelawan.kontak}</span>
                  <span>•</span>
                  <span>Bergabung sejak: {selectedRelawan.bergabungSejak}</span>
                </p>
              </div>
              <button onClick={() => setSelectedRelawan(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Status Kehadiran</div>
                  <div className="font-semibold text-slate-800 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${selectedRelawan.kehadiran === 'Hadir' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    {selectedRelawan.kehadiran}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Penugasan Saat Ini</div>
                  <div className="font-semibold text-slate-800">{selectedRelawan.tugas}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-3 border-b border-slate-100 pb-2">Riwayat Penugasan</h4>
                <div className="space-y-3">
                  {selectedRelawan.riwayatPenugasan.map((riwayat: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                      <div>
                        <div className="font-medium text-slate-700 text-sm">{riwayat.tugas}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{riwayat.tanggal}</div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${riwayat.status === 'Selesai' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                        {riwayat.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setSelectedRelawan(null)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PengungsiView({ user }: { user: any }) {
  const [pengungsi, setPengungsi] = useState<any[]>([]);
  const [selectedPengungsi, setSelectedPengungsi] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState('daftar');

  const fetchPengungsi = () => {
    db.pengungsi.getAll().then(data => {
      let filtered = data.map((p: any) => ({
        id: p.id,
        nama: p.name,
        nik: p.nik ?? '-',
        usia: p.age ?? p.usia ?? 0,
        gender: p.gender,
        kondisi: p.status ?? p.kondisi ?? 'Sehat',
        tenda: p.tenda ?? 'Tenda Utama',
        statusAbsen: p.status_absen ?? p.statusAbsen ?? 'Hadir',
        posko_id: p.posko_id,
        riwayatKesehatan: p.riwayatKesehatan ?? []
      }));
      if (user?.role === 'relawan' && user?.posko_id) {
        filtered = filtered.filter(p => Number(p.posko_id) === Number(user.posko_id));
      }
      setPengungsi(filtered);
    });
  };

  useEffect(() => {
    fetchPengungsi();
  }, [user]);

  const [newPengungsi, setNewPengungsi] = useState({
    nama: '',
    nik: '',
    usia: '',
    gender: 'L',
    kondisi: 'Sehat',
    tenda: ''
  });
  const [formErrors, setFormErrors] = useState<any>({});

  const validateForm = () => {
    const errors: any = {};
    if (!newPengungsi.nama.trim()) errors.nama = 'Nama wajib diisi';
    
    if (newPengungsi.nik !== '-' && newPengungsi.nik.trim() !== '') {
      if (!/^\d{16}$/.test(newPengungsi.nik.trim())) {
        errors.nik = 'NIK harus 16 digit angka (atau "-" jika tidak ada)';
      }
    } else if (newPengungsi.nik.trim() === '') {
      errors.nik = 'NIK wajib diisi (gunakan "-" jika tidak ada)';
    }

    if (newPengungsi.usia === '' || parseInt(newPengungsi.usia) < 0) {
      errors.usia = 'Usia harus diisi dan tidak boleh negatif';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePengungsi = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const dataToSave = {
        name: newPengungsi.nama,
        nik: newPengungsi.nik,
        age: parseInt(newPengungsi.usia) || 0,
        gender: newPengungsi.gender,
        status: newPengungsi.kondisi,
        posko_id: user?.posko_id || 1,
        tenda: newPengungsi.tenda || 'Tenda Utama'
      };

      db.pengungsi.create(dataToSave).then(() => {
        fetchPengungsi();
        setNewPengungsi({ nama: '', nik: '', usia: '', gender: 'L', kondisi: 'Sehat', tenda: '' });
        setFormErrors({});
        setActiveSubTab('daftar');
      });
    }
  };

  const handleKondisiChange = (id: number | string, newKondisi: string) => {
    db.pengungsi.update(id, { status: newKondisi }).then(() => fetchPengungsi());
  };

  const handleAbsenChange = (id: number | string, newAbsen: string) => {
    db.pengungsi.update(id, { status_absen: newAbsen }).then(() => fetchPengungsi());
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex border-b border-slate-200 gap-6">
        <button 
          onClick={() => setActiveSubTab('daftar')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeSubTab === 'daftar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Daftar Pengungsi
        </button>
        <button 
          onClick={() => setActiveSubTab('catat')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeSubTab === 'catat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Catat Pengungsi Baru
        </button>
      </div>

      {activeSubTab === 'daftar' && (
        <>
          <div className="flex justify-between items-center">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Cari nama atau NIK pengungsi..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div className="flex gap-2">
              <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Export Data
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                  <th className="p-4 font-medium">Nama / NIK</th>
                  <th className="p-4 font-medium">Demografi</th>
                  <th className="p-4 font-medium">Kondisi Kesehatan</th>
                  <th className="p-4 font-medium">Lokasi Tenda</th>
                  <th className="p-4 font-medium">Status Absen (Klik untuk ubah)</th>
                </tr>
              </thead>
              <tbody>
                {pengungsi.map((item) => (
              <tr key={item.id} onClick={() => setSelectedPengungsi(item)} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                <td className="p-4">
                  <div className="font-medium text-slate-800">{item.nama}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{item.nik !== '-' ? `NIK: ${item.nik}` : 'Tanpa NIK'}</div>
                </td>
                <td className="p-4">
                  <div className="text-sm text-slate-700">{item.usia} Tahun</div>
                  <div className="text-xs text-slate-500 mt-0.5">{item.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                </td>
                <td className="p-4">
                  <select
                    value={item.kondisi}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleKondisiChange(item.id, e.target.value);
                    }}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 pr-6 ${
                      item.kondisi === 'Sehat' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.2rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
                  >
                    <option value="Sehat">Sehat</option>
                    <option value="Sakit Ringan">Sakit Ringan</option>
                    <option value="Sakit Berat">Sakit Berat</option>
                    <option value="Hamil">Hamil</option>
                    <option value="Lansia/Rentan">Lansia/Rentan</option>
                  </select>
                </td>
                <td className="p-4 text-sm text-slate-700">
                  {item.tenda}
                </td>
                <td className="p-4">
                  <select
                    value={item.statusAbsen}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleAbsenChange(item.id, e.target.value);
                    }}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none border-none ${
                      item.statusAbsen === 'Hadir' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Perawatan">Perawatan</option>
                    <option value="Absen">Absen</option>
                    <option value="Pindah">Pindah</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      )}

      {activeSubTab === 'catat' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Catat Pengungsi Baru</h3>
          <form className="space-y-4 max-w-lg" onSubmit={handleSavePengungsi}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
              <input type="text" value={newPengungsi.nama} onChange={e => setNewPengungsi({...newPengungsi, nama: e.target.value})} placeholder="Masukkan nama..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {formErrors.nama && <p className="text-red-500 text-xs mt-1">{formErrors.nama}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">NIK / Identitas</label>
              <input type="text" value={newPengungsi.nik} onChange={e => setNewPengungsi({...newPengungsi, nik: e.target.value})} placeholder="Masukkan NIK atau - jika tidak ada..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {formErrors.nik && <p className="text-red-500 text-xs mt-1">{formErrors.nik}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Usia</label>
                <input type="number" min="0" value={newPengungsi.usia} onChange={e => {
                  const val = parseInt(e.target.value);
                  if (val >= 0 || e.target.value === '') setNewPengungsi({...newPengungsi, usia: e.target.value});
                }} placeholder="Usia..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {formErrors.usia && <p className="text-red-500 text-xs mt-1">{formErrors.usia}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Kelamin</label>
                <select value={newPengungsi.gender} onChange={e => setNewPengungsi({...newPengungsi, gender: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kondisi Awal</label>
              <select value={newPengungsi.kondisi} onChange={e => setNewPengungsi({...newPengungsi, kondisi: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Sehat">Sehat</option>
                <option value="Sakit Ringan">Sakit Ringan</option>
                <option value="Sakit Berat">Sakit Berat</option>
                <option value="Hamil">Hamil</option>
                <option value="Lansia/Rentan">Lansia/Rentan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Penempatan Tenda</label>
              <input type="text" value={newPengungsi.tenda} onChange={e => setNewPengungsi({...newPengungsi, tenda: e.target.value})} placeholder="Tenda penempatan..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Simpan Data Pengungsi
            </button>
          </form>
        </div>
      )}

      {selectedPengungsi && activeSubTab === 'daftar' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedPengungsi(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedPengungsi.nama}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                  <span>{selectedPengungsi.usia} Tahun</span>
                  <span>•</span>
                  <span>{selectedPengungsi.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                  <span>•</span>
                  <span>Tenda: {selectedPengungsi.tenda}</span>
                </p>
              </div>
              <button onClick={() => setSelectedPengungsi(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <h4 className="font-semibold text-slate-800 mb-3 border-b border-slate-100 pb-2">Riwayat Kesehatan & Catatan Medis</h4>
                <div className="space-y-4">
                  {selectedPengungsi.riwayatKesehatan && selectedPengungsi.riwayatKesehatan.length > 0 ? (
                    selectedPengungsi.riwayatKesehatan.map((riwayat: any, idx: number) => (
                      <div key={idx} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm relative">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${
                            riwayat.status === 'Sehat' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {riwayat.status}
                          </span>
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            {riwayat.tanggal}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed mb-3">
                          {riwayat.catatan}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-3 border-t border-slate-50">
                          <User className="w-3.5 h-3.5" />
                          <span>Dicatat oleh: <strong>{riwayat.petugas}</strong></span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-6 bg-slate-50 border border-slate-100 border-dashed rounded-xl">
                      <p className="text-sm text-slate-500">Belum ada catatan riwayat kesehatan.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setSelectedPengungsi(null)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KeuanganView({ user }: { user: any }) {
  const [activeSubTab, setActiveSubTab] = useState('ringkasan');
  const [transaksi, setTransaksi] = useState<any[]>([]);

  const fetchTransaksi = () => {
    db.keuangan.getAll().then(data => {
      let filtered = data.map((t: any) => ({
        id: t.id,
        tanggal: t.tanggal ? new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
        tipe: t.tipe,
        kategori: t.kategori,
        nominal: Number(t.nominal),
        deskripsi: t.deskripsi,
        bukti: t.bukti_url ? 'Ada' : 'Tidak Ada',
        posko_id: t.posko_id
      }));
      if (user?.role === 'relawan' && user?.posko_id) {
        filtered = filtered.filter(t => Number(t.posko_id) === Number(user.posko_id));
      }
      setTransaksi(filtered);
    });
  };

  useEffect(() => {
    fetchTransaksi();
  }, [user]);

  const [newTransaksi, setNewTransaksi] = useState({
    tipe: 'Pemasukan',
    kategori: 'Donasi Tunai',
    nominal: '',
    deskripsi: ''
  });
  const [formErrors, setFormErrors] = useState<any>({});

  const validateForm = () => {
    const errors: any = {};
    if (newTransaksi.nominal === '' || parseFloat(newTransaksi.nominal) < 0) {
      errors.nominal = 'Nominal harus diisi dan tidak boleh negatif';
    }
    if (!newTransaksi.deskripsi.trim()) {
      errors.deskripsi = 'Deskripsi wajib diisi';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveTransaksi = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const dataToSave = {
        tipe: newTransaksi.tipe,
        kategori: newTransaksi.kategori,
        nominal: parseFloat(newTransaksi.nominal),
        deskripsi: newTransaksi.deskripsi,
        posko_id: user?.posko_id || 1,
        tanggal: new Date().toISOString().split('T')[0]
      };

      db.keuangan.create(dataToSave).then(() => {
        fetchTransaksi();
        setNewTransaksi({ tipe: 'Pemasukan', kategori: 'Donasi Tunai', nominal: '', deskripsi: '' });
        setFormErrors({});
        setActiveSubTab('ringkasan');
      });
    }
  };

  const totalPemasukan = transaksi
    .filter(t => t.tipe === 'Pemasukan')
    .reduce((sum, t) => sum + t.nominal, 0);

  const totalPengeluaran = transaksi
    .filter(t => t.tipe === 'Pengeluaran')
    .reduce((sum, t) => sum + t.nominal, 0);

  const saldo = totalPemasukan - totalPengeluaran;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex border-b border-slate-200 gap-6">
        <button 
          onClick={() => setActiveSubTab('ringkasan')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeSubTab === 'ringkasan' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Ringkasan & Transaksi
        </button>
        <button 
          onClick={() => setActiveSubTab('catat')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeSubTab === 'catat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Pencatatan Keuangan Baru
        </button>
      </div>

      {activeSubTab === 'ringkasan' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 rounded-lg"><Wallet className="text-blue-500 w-6 h-6" /></div>
              </div>
              <h4 className="text-slate-500 text-sm font-medium">Saldo Saat Ini</h4>
              <p className="text-3xl font-bold text-slate-900 mt-1">Rp {saldo.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-50 rounded-lg"><TrendingUp className="text-emerald-500 w-6 h-6" /></div>
              </div>
              <h4 className="text-slate-500 text-sm font-medium">Total Pemasukan</h4>
              <p className="text-3xl font-bold text-slate-900 mt-1">Rp {totalPemasukan.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-50 rounded-lg"><TrendingDown className="text-red-500 w-6 h-6" /></div>
              </div>
              <h4 className="text-slate-500 text-sm font-medium">Total Pengeluaran</h4>
              <p className="text-3xl font-bold text-slate-900 mt-1">Rp {totalPengeluaran.toLocaleString('id-ID')}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Riwayat Transaksi</h3>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => exportToCSV(transaksi, 'laporan_keuangan.csv')}
                  className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export Laporan
                </button>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
                  Lihat Semua
                </button>
              </div>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                  <th className="p-4 font-medium">Tanggal</th>
                  <th className="p-4 font-medium">Kategori</th>
                  <th className="p-4 font-medium">Deskripsi</th>
                  <th className="p-4 font-medium text-right">Nominal</th>
                  <th className="p-4 font-medium">Bukti</th>
                </tr>
              </thead>
              <tbody>
                {transaksi.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 text-sm text-slate-600">{item.tanggal}</td>
                    <td className="p-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    item.tipe === 'Pemasukan' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {item.kategori}
                  </span>
                </td>
                <td className="p-4 text-sm text-slate-700">{item.deskripsi}</td>
                <td className={`p-4 text-sm font-medium text-right ${
                  item.tipe === 'Pemasukan' ? 'text-emerald-600' : 'text-slate-700'
                }`}>
                  {item.tipe === 'Pemasukan' ? '+' : '-'} Rp {item.nominal.toLocaleString('id-ID')}
                </td>
                <td className="p-4">
                  <button className="text-blue-600 hover:underline text-sm font-medium">Lihat</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      )}

      {activeSubTab === 'catat' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Pencatatan Keuangan Baru</h3>
          <form className="space-y-4 max-w-lg" onSubmit={handleSaveTransaksi}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Transaksi</label>
                <select value={newTransaksi.tipe} onChange={e => setNewTransaksi({...newTransaksi, tipe: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Pemasukan">Pemasukan</option>
                  <option value="Pengeluaran">Pengeluaran</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                <select value={newTransaksi.kategori} onChange={e => setNewTransaksi({...newTransaksi, kategori: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Donasi Tunai">Donasi Tunai</option>
                  <option value="Dana Desa">Dana Desa</option>
                  <option value="Logistik">Logistik</option>
                  <option value="Operasional">Operasional</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
              <input type="number" min="0" value={newTransaksi.nominal} onChange={e => {
                const val = parseFloat(e.target.value);
                if (val >= 0 || e.target.value === '') setNewTransaksi({...newTransaksi, nominal: e.target.value});
              }} placeholder="0" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {formErrors.nominal && <p className="text-red-500 text-xs mt-1">{formErrors.nominal}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi / Keterangan</label>
              <textarea rows={3} value={newTransaksi.deskripsi} onChange={e => setNewTransaksi({...newTransaksi, deskripsi: e.target.value})} placeholder="Penjelasan singkat..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              {formErrors.deskripsi && <p className="text-red-500 text-xs mt-1">{formErrors.deskripsi}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Upload Bukti (Opsional)</label>
              <input type="file" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Simpan Transaksi
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function SiaranView({ user }: { user: any }) {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');
  const [prioritas, setPrioritas] = useState('Normal');
  const [posko, setPosko] = useState('Semua Posko');
  const [activeTab, setActiveTab] = useState('Aktif');

  const fetchSiaran = () => {
    db.siaran.getAll().then(data => {
      let filtered = data.map((bc: any) => ({
        id: bc.id,
        waktu: bc.waktu ? new Date(bc.waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Baru saja',
        judul: bc.judul,
        isi: bc.isi,
        prioritas: bc.prioritas,
        posko: bc.posko_id ? `Posko ID: ${bc.posko_id}` : 'Semua Posko',
        posko_id: bc.posko_id,
        status: bc.status
      }));
      if (user?.role === 'relawan' && user?.posko_id) {
        filtered = filtered.filter(bc => !bc.posko_id || Number(bc.posko_id) === Number(user.posko_id));
      }
      setBroadcasts(filtered);
    });
  };

  useEffect(() => {
    fetchSiaran();
  }, [user]);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul || !isi) return;
    const newBroadcast = {
      judul,
      isi,
      prioritas,
      posko_id: posko === 'Semua Posko' ? null : (user?.posko_id || 1),
      status: 'Aktif'
    };
    db.siaran.create(newBroadcast).then(() => {
      fetchSiaran();
      setJudul('');
      setIsi('');
      setPrioritas('Normal');
      setPosko('Semua Posko');
    });
  };

  const toggleStatus = (id: number | string) => {
    const current = broadcasts.find(bc => bc.id === id);
    if (!current) return;
    const newStatus = current.status === 'Aktif' ? 'Diarsipkan' : 'Aktif';
    db.siaran.update(id, { status: newStatus }).then(() => fetchSiaran());
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Buat Siaran */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <Megaphone className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800">Buat Siaran Baru</h3>
            </div>
            
            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Judul Informasi</label>
                <input required type="text" value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Contoh: Info Pembagian Makanan" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Isi Pesan</label>
                <textarea required value={isi} onChange={(e) => setIsi(e.target.value)} rows={4} placeholder="Tuliskan detail informasi di sini..." className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Posko</label>
                  <select value={posko} onChange={(e) => setPosko(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white">
                    <option>Semua Posko</option>
                    <option>Posko Siaga Jakarta Pusat</option>
                    <option>Posko Bantuan Jakarta Selatan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prioritas</label>
                  <select value={prioritas} onChange={(e) => setPrioritas(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white">
                    <option>Normal</option>
                    <option>Tinggi</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 mt-2">
                <Megaphone className="w-4 h-4" />
                Kirim Siaran
              </button>
            </form>
          </div>
        </div>

        {/* Riwayat Siaran */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-slate-800">Riwayat Siaran</h3>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setActiveTab('Aktif')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${activeTab === 'Aktif' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Aktif</button>
              <button onClick={() => setActiveTab('Diarsipkan')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${activeTab === 'Diarsipkan' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Diarsipkan</button>
            </div>
          </div>
          {broadcasts.filter(bc => bc.status === activeTab).map(bc => (
            <div key={bc.id} className={`p-5 rounded-xl border ${bc.prioritas === 'Tinggi' ? 'bg-red-50/50 border-red-100' : 'bg-white border-slate-200'} shadow-sm relative group transition-opacity ${bc.status === 'Diarsipkan' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => toggleStatus(bc.id)} className="text-xs font-medium text-slate-500 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded shadow-sm">
                  {bc.status === 'Aktif' ? 'Arsipkan' : 'Aktifkan'}
                </button>
              </div>
              <div className="flex justify-between items-start mb-3 pr-24">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${bc.prioritas === 'Tinggi' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                    {bc.prioritas}
                  </span>
                  <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {bc.posko}
                  </span>
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {bc.waktu}
                </span>
              </div>
              <h4 className="font-bold text-slate-800 text-lg mb-1">{bc.judul}</h4>
              <p className="text-slate-600 text-sm leading-relaxed">{bc.isi}</p>
            </div>
          ))}
          {broadcasts.filter(bc => bc.status === activeTab).length === 0 && (
             <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                <p className="text-slate-500">Belum ada siaran {activeTab.toLowerCase()}.</p>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}

function LocationPicker({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={customIcon}>
      <Popup>Lokasi Posko Anda</Popup>
    </Marker>
  );
}

function SdmView() {
  const [activeRole, setActiveRole] = useState('Semua');
  const [editingUser, setEditingUser] = useState<any>(null);

  const [sdmData, setSdmData] = useState([
    { id: 1, nama: 'Dr. Andi Pratama', role: 'Admin Developer', email: 'andi@pantauposkoindonesia.id', kontak: '081122334455', status: 'Aktif', bergabungSejak: '2026-01-10', lokasi: '' },
    { id: 2, nama: 'Budi Santoso', role: 'Admin Posko', lokasi: 'Posko Siaga Jakarta Pusat', email: 'budi.s@posko.id', kontak: '081234567890', status: 'Aktif', bergabungSejak: '2026-06-25' },
    { id: 3, nama: 'Siti Aminah', role: 'Admin Posko', lokasi: 'Dapur Posko C', email: 'siti.a@posko.id', kontak: '081298765432', status: 'Aktif', bergabungSejak: '2026-06-25' },
    { id: 4, nama: 'Reza Rahadian', role: 'Koordinator Lapangan', lokasi: 'Jakarta Selatan', email: 'reza@pantauposkoindonesia.id', kontak: '081987654321', status: 'Aktif', bergabungSejak: '2026-03-15' },
    { id: 5, nama: 'Dewi Lestari', role: 'Staff Logistik', lokasi: 'Gudang Utama', email: 'dewi.l@posko.id', kontak: '085566778899', status: 'Cuti', bergabungSejak: '2026-05-01' },
  ]);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      setSdmData(sdmData.map(u => u.id === editingUser.id ? editingUser : u));
      setEditingUser(null);
    }
  };

  const filteredData = sdmData.filter(user => activeRole === 'Semua' || user.role === activeRole);

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'Admin Developer': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Admin Posko': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Koordinator Lapangan': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen SDM</h2>
          <p className="text-slate-500">Kelola akses, peran, dan data personalia sistem.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <UserPlus className="w-5 h-5" />
          Tambah Personil
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Filter Peran
            </h3>
            <div className="space-y-2">
              {['Semua', 'Admin Developer', 'Admin Posko', 'Koordinator Lapangan', 'Staff Logistik'].map(role => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeRole === role ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 shadow-sm p-5 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold">Total Personil Aktif</h3>
            </div>
            <p className="text-3xl font-bold mt-2">{sdmData.filter(d => d.status === 'Aktif').length}</p>
            <p className="text-sm text-slate-400 mt-1">Tersebar di berbagai posko</p>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800">Daftar SDM & Pengguna</h3>
              <div className="relative">
                <input type="text" placeholder="Cari nama atau email..." className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Nama & Kontak</th>
                    <th className="px-6 py-4">Peran (Role)</th>
                    <th className="px-6 py-4">Lokasi / Penempatan</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{user.nama}</div>
                        <div className="text-slate-500 text-xs mt-1">{user.email}</div>
                        <div className="text-slate-500 text-xs">{user.kontak}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {user.lokasi || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 ${user.status === 'Aktif' ? 'text-emerald-600' : 'text-slate-500'}`}>
                          <span className={`w-2 h-2 rounded-full ${user.status === 'Aktif' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditingUser({ ...user })} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Edit Personil</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama</label>
                  <input type="text" value={editingUser.nama} disabled className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status Keaktifan</label>
                  <select 
                    value={editingUser.status} 
                    onChange={e => setEditingUser({ ...editingUser, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Cuti">Cuti</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Peran (Role)</label>
                  <select 
                    value={editingUser.role} 
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Admin Developer">Admin Developer</option>
                    <option value="Admin Posko">Admin Posko</option>
                    <option value="Koordinator Lapangan">Koordinator Lapangan</option>
                    <option value="Staff Logistik">Staff Logistik</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi Penugasan</label>
                  <input 
                    type="text" 
                    value={editingUser.lokasi || ''} 
                    onChange={e => setEditingUser({ ...editingUser, lokasi: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    placeholder="Contoh: Posko Utama Sudirman"
                  />
                </div>
                
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    Batal
                  </button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BeritaView() {
  const [berita, setBerita] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBerita = async () => {
      try {
        setLoading(true);
        // Menggunakan CORS proxy gratis allorigins untuk mengambil RSS Google News
        const response = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://news.google.com/rss/search?q=bencana+alam+indonesia&hl=id&gl=ID&ceid=ID:id'));
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data.contents, 'text/xml');
        const items = Array.from(xmlDoc.querySelectorAll('item'));
        const parsedBerita = items.map(item => ({
          title: item.querySelector('title')?.textContent || 'Tanpa Judul',
          link: item.querySelector('link')?.textContent || '#',
          pubDate: item.querySelector('pubDate')?.textContent || '',
          source: item.querySelector('source')?.textContent || 'Google News'
        })).slice(0, 12);
        setBerita(parsedBerita);
      } catch (err) {
        setError('Gagal memuat berita terkini.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBerita();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Berita Bencana Terkini</h2>
          <p className="text-slate-500 mt-1">Agregasi berita terkait bencana alam di Indonesia dari Google News.</p>
        </div>
        <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
          <Newspaper className="w-5 h-5" />
          Update Otomatis
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 h-40 animate-pulse flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-5 bg-slate-200 rounded w-full"></div>
                <div className="h-5 bg-slate-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-xl text-center">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {berita.map((item, index) => (
            <a 
              key={index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer" 
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">{item.source}</span>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <h3 className="font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors line-clamp-3">
                  {item.title}
                </h3>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs text-slate-500 font-medium">
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                {new Date(item.pubDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function PublicPortal({ onLogin }: { onLogin: (user: any) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedPos, setSearchedPos] = useState<[number, number] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDonasiModalOpen, setIsDonasiModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    namaPosko: '',
    lokasi: '',
    estimasiPengungsi: '',
    kontak: ''
  });
  const [selectedLocation, setSelectedLocation] = useState<L.LatLng | null>(null);
  const [donasiData, setDonasiData] = useState({
    namaDonatur: '',
    jenisBantuan: 'Uang',
    jumlah: ''
  });
  const [isBencanaModalOpen, setIsBencanaModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [bencanaFormData, setBencanaFormData] = useState({
    jenisBencana: '',
    lokasi: '',
    dampak: ''
  });
  const [selectedBencanaLocation, setSelectedBencanaLocation] = useState<L.LatLng | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    db.auth.signIn(loginUsername, loginPassword)
      .then(userData => {
        onLogin(userData);
        setIsLoginModalOpen(false);
      })
      .catch(err => {
        setLoginError(err.message || 'Login gagal.');
      });
  };

  const poskoAktif = [
    { id: 1, name: 'Posko Siaga Jakarta Pusat', lokasi: 'Monas, Jakarta', pengungsi: 450, relawan: 45, status: 'Kritis', lat: -6.1751, lng: 106.8272, statusLabel: 'Aktif' },
    { id: 2, name: 'Posko Bantuan Jakarta Selatan', lokasi: 'Kemang, Jakarta', pengungsi: 210, relawan: 30, status: 'Siaga', lat: -6.2416, lng: 106.8108, statusLabel: 'Siaga' },
    { id: 3, name: 'Posko Relawan Jakarta Timur', lokasi: 'Cawang, Jakarta', pengungsi: 180, relawan: 25, status: 'Aman', lat: -6.2250, lng: 106.9004, statusLabel: 'Aktif' },
  ];

  const bencanaLocations = [
    { id: 1, name: 'Titik Banjir Bandang', lat: -6.2300, lng: 106.8500, radius: 2000, severity: 'Tinggi' },
    { id: 2, name: 'Tanah Longsor', lat: -6.2800, lng: 106.8000, radius: 1000, severity: 'Sedang' },
  ];

  const searchResults = [
    ...poskoAktif.map(p => ({ id: `p-${p.id}`, name: p.name, lat: p.lat, lng: p.lng, type: 'Posko' })),
    ...bencanaLocations.map(b => ({ id: `b-${b.id}`, name: b.name, lat: b.lat, lng: b.lng, type: 'Area Bencana' }))
  ].filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBencanaInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBencanaFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDonasiInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDonasiData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Data Pengajuan:', formData, 'Lokasi Peta:', selectedLocation);
    setIsModalOpen(false);
    setFormData({ namaPosko: '', lokasi: '', estimasiPengungsi: '', kontak: '' });
    setSelectedLocation(null);
  };

  const handleBencanaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Laporan Bencana:', bencanaFormData, 'Lokasi:', selectedBencanaLocation);
    setIsBencanaModalOpen(false);
    setBencanaFormData({ jenisBencana: '', lokasi: '', dampak: '' });
    setSelectedBencanaLocation(null);
  };

  const handleDonasiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Data Donasi:', donasiData);
    setIsDonasiModalOpen(false);
    setDonasiData({ namaDonatur: '', jenisBantuan: 'Uang', jumlah: '' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl font-extrabold tracking-tighter text-white">Pantau Posko Indonesia</span>
          </div>
          <button 
            onClick={() => setIsLoginModalOpen(true)}
            className="text-sm font-medium bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors"
          >
            Masuk Admin
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-12 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-3xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-4xl lg:text-6xl font-extrabold tracking-tighter text-red-600">
            Pantau Posko Indonesia
          </h2>
          <p className="text-xl text-slate-700 font-medium mt-2">
            Pantau Cepat, Bantu Tepat.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed mt-4">
            Sistem informasi terpadu posko bencana. Pantau dan kelola distribusi logistik, relawan, dan pengungsi di berbagai posko bencana secara transparan dan real-time.
          </p>
          <div className="flex justify-center gap-4 pt-4 flex-wrap">
             <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition-colors text-lg">
                Pengajuan Posko Baru
             </button>
             <button onClick={() => setIsBencanaModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition-colors text-lg">
                Lapor Bencana
             </button>
             <button onClick={() => setIsDonasiModalOpen(true)} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-semibold shadow-sm transition-colors text-lg">
                Donasi Publik
             </button>
          </div>
        </section>

        {/* Peta Bencana dan Posko */}
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
          <div className="flex justify-between items-end border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-800">Peta Sebaran Bencana & Posko</h3>
              <p className="text-slate-500 mt-1">Pemantauan titik bencana dan lokasi posko bantuan secara langsung.</p>
            </div>
            <div className="flex gap-4 text-sm font-medium bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span>Posko Aktif</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span>Posko Siaga</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500/50 border border-red-500"></span>Area Bencana</span>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[500px] z-0 relative">
             <div className="absolute top-4 left-4 z-[400] w-80 max-w-[calc(100vw-2rem)]">
               <div className="relative">
                 <input 
                   type="text" 
                   placeholder="Cari posko atau area bencana..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full pl-10 pr-4 py-3 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                 />
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               </div>
               {searchQuery && (
                 <div className="mt-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-h-60 overflow-y-auto">
                   {searchResults.length > 0 ? (
                     <ul className="py-2">
                       {searchResults.map((item) => (
                         <li key={item.id}>
                           <button
                             onClick={() => {
                               setSearchedPos([item.lat, item.lng]);
                               setSearchQuery('');
                             }}
                             className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors flex flex-col"
                           >
                             <span className="text-sm font-semibold text-slate-800">{item.name}</span>
                             <span className="text-xs text-slate-500">{item.type}</span>
                           </button>
                         </li>
                       ))}
                     </ul>
                   ) : (
                     <div className="p-4 text-center text-sm text-slate-500">Tidak ditemukan</div>
                   )}
                 </div>
               )}
             </div>

             <MapContainer center={[-6.2088, 106.8456]} zoom={11} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
               <MapZoomTo position={searchedPos} />
               <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
               {poskoAktif.map(posko => (
                 <Marker key={posko.id} position={[posko.lat, posko.lng]} icon={getStatusIcon(posko.statusLabel)}>
                    <Popup>
                       <div className="font-sans">
                         <h4 className="font-semibold text-slate-800 m-0 mb-1">{posko.name}</h4>
                         <p className="text-sm text-slate-600 m-0">Status: <strong className={posko.statusLabel === 'Aktif' ? 'text-emerald-600' : 'text-amber-600'}>{posko.statusLabel}</strong></p>
                       </div>
                    </Popup>
                 </Marker>
               ))}
               {bencanaLocations.map((bencana) => (
                  <Circle 
                    key={`bencana-public-${bencana.id}`} 
                    center={[bencana.lat, bencana.lng]} 
                    radius={bencana.radius}
                    pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }}
                  >
                    <Popup>
                      <div className="font-sans">
                        <h4 className="font-semibold text-red-700 m-0 leading-none mb-1">{bencana.name}</h4>
                        <p className="text-sm text-slate-600 m-0 mt-1">Tingkat Bahaya: <span className="font-bold">{bencana.severity}</span></p>
                      </div>
                    </Popup>
                  </Circle>
                ))}
             </MapContainer>
          </div>
        </section>

        {/* Siaran & Info Terkini */}
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="bg-red-100 p-2 rounded-xl text-red-600">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800">Info & Kebutuhan Mendesak</h3>
              <p className="text-slate-500 mt-1">Siaran langsung dari posko-posko di lapangan.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border-l-4 border-red-500 rounded-r-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold uppercase tracking-wider">Tinggi</span>
                <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded">Hari ini, 14:00</span>
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-1">Kebutuhan Mendesak: Selimut & Air Bersih</h4>
              <p className="text-slate-600 text-sm mb-3">Posko Siaga Jakarta Pusat saat ini sangat membutuhkan tambahan selimut dan air bersih untuk 50 pengungsi baru.</p>
              <div className="flex items-center text-xs font-medium text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">
                <MapPin className="w-3.5 h-3.5 mr-1" /> Posko Siaga Jakarta Pusat
              </div>
            </div>

            <div className="bg-white border-l-4 border-blue-500 rounded-r-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase tracking-wider">Normal</span>
                <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded">Kemarin, 09:30</span>
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-1">Jadwal Pemeriksaan Kesehatan</h4>
              <p className="text-slate-600 text-sm mb-3">Tim medis akan melakukan pemeriksaan kesehatan rutin di Tenda B mulai pukul 10:00. Mohon kumpul di area utama.</p>
              <div className="flex items-center text-xs font-medium text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">
                <MapPin className="w-3.5 h-3.5 mr-1" /> Semua Posko
              </div>
            </div>
          </div>
        </section>

        {/* Daftar Posko Aktif */}
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <div className="flex justify-between items-end border-b border-slate-200 pb-4">
            <div>
               <h3 className="text-2xl font-bold text-slate-800">Daftar Posko Aktif</h3>
               <p className="text-slate-500 mt-1">Pemantauan real-time kondisi posko di lapangan.</p>
            </div>
            <div className="hidden sm:block relative w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input type="text" placeholder="Cari posko..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {poskoAktif.map((posko) => (
              <div key={posko.id} onClick={onLogin} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                    <Tent className="w-6 h-6" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    posko.status === 'Kritis' ? 'bg-red-100 text-red-700' :
                    posko.status === 'Siaga' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {posko.status}
                  </span>
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">{posko.name}</h4>
                <div className="flex items-center text-slate-500 mb-6 text-sm">
                   <MapPin className="w-4 h-4 mr-1" />
                   {posko.lokasi}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Pengungsi</p>
                    <p className="text-xl font-bold text-slate-800">{posko.pengungsi}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Relawan</p>
                    <p className="text-xl font-bold text-slate-800">{posko.relawan}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      
      <footer className="bg-[#1E2129] text-slate-300 py-16 mt-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-12">
            <span className="text-4xl font-extrabold tracking-tighter text-white">Pantau Posko Indonesia</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
            <div className="space-y-8">
              <div>
                <h4 className="text-white text-lg font-semibold mb-4">Komunitas</h4>
                <ul className="space-y-3 text-sm">
                  <li><a href="#" className="hover:text-white transition-colors">Bantu Pengembangan</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Lapor Bug</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Gabung Komunitas</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white text-lg font-semibold mb-4">Open Source</h4>
                <ul className="space-y-3 text-sm">
                  <li><a href="#" className="hover:text-white transition-colors">Download</a></li>
                  <li><a href="https://github.com/gnextdev/pantauposko" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Github</a></li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="text-white text-lg font-semibold mb-4">Layanan</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => setIsModalOpen(true)} className="hover:text-white transition-colors text-left">Daftarkan Posko</button></li>
                <li><button onClick={() => setIsBencanaModalOpen(true)} className="hover:text-white transition-colors text-left">Lapor Bencana</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Menjadi Partner</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Menjadi Relawan</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Donasi Developer</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-lg font-semibold mb-4">Tentang Kami</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Developer</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Aset Merk</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Hubungi Kami</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Syarat dan Ketentuan</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privasi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Keamanan</a></li>
              </ul>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-700 pb-4">
                <span className="text-xl">🇮🇩</span>
                <span className="text-sm font-medium hover:text-white cursor-pointer transition-colors">Bahasa Indonesia ▾</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                Pantau Posko Indonesia adalah platform informasi terpadu untuk pemetaan titik bencana, manajemen posko relawan, dan distribusi logistik. Aplikasi ini dibuat untuk membantu koordinasi tanggap darurat secara real-time dan transparan.
              </p>
              <p className="text-sm leading-relaxed text-slate-400">
                Akurasi data dan kecepatan penanganan adalah prioritas kami.
              </p>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
             &copy; 2026 Pantau Posko Indonesia. Dibuat untuk tanggap darurat bencana.
          </div>
        </div>
      </footer>

      {/* Modal Pengajuan Posko Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Pengajuan Posko Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="namaPosko" className="block text-sm font-medium text-slate-700 mb-1">Nama Posko</label>
                <input required type="text" id="namaPosko" name="namaPosko" value={formData.namaPosko} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Misal: Posko Siaga Warga" />
              </div>
              <div>
                <label htmlFor="lokasi" className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
                <input required type="text" id="lokasi" name="lokasi" value={formData.lokasi} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Alamat lengkap posko" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titik Lokasi Peta</label>
                <div className="h-48 rounded-lg overflow-hidden border border-slate-200">
                  <MapContainer 
                    center={[-6.2088, 106.8456]} 
                    zoom={11} 
                    scrollWheelZoom={true} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationPicker position={selectedLocation} setPosition={setSelectedLocation} />
                  </MapContainer>
                </div>
                {selectedLocation ? (
                  <p className="text-xs text-emerald-600 mt-1 font-medium">Titik lokasi terpilih.</p>
                ) : (
                  <p className="text-xs text-red-500 mt-1 font-medium">* Error: Titik koordinat peta wajib dipilih.</p>
                )}
              </div>
              <div>
                <label htmlFor="estimasiPengungsi" className="block text-sm font-medium text-slate-700 mb-1">Estimasi Pengungsi</label>
                <input required type="number" id="estimasiPengungsi" name="estimasiPengungsi" value={formData.estimasiPengungsi} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Jumlah perkiraan pengungsi" />
              </div>
              <div>
                <label htmlFor="kontak" className="block text-sm font-medium text-slate-700 mb-1">Kontak Penanggung Jawab</label>
                <input required type="text" id="kontak" name="kontak" value={formData.kontak} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nomor telepon yang bisa dihubungi" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={!selectedLocation} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${selectedLocation ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-400 cursor-not-allowed'}`}>
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lapor Bencana */}
      {isBencanaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-xl font-bold text-slate-800">Lapor Titik Bencana</h3>
              <button onClick={() => setIsBencanaModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <form id="bencanaForm" onSubmit={handleBencanaSubmit} className="space-y-5">
                <div>
                  <label htmlFor="jenisBencana" className="block text-sm font-medium text-slate-700 mb-1">Jenis Bencana</label>
                  <input required type="text" id="jenisBencana" name="jenisBencana" value={bencanaFormData.jenisBencana} onChange={handleBencanaInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Misal: Banjir Bandang, Tanah Longsor" />
                </div>
                <div>
                  <label htmlFor="lokasiBencana" className="block text-sm font-medium text-slate-700 mb-1">Alamat / Detail Lokasi</label>
                  <input required type="text" id="lokasiBencana" name="lokasi" value={bencanaFormData.lokasi} onChange={handleBencanaInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nama daerah atau patokan lokasi" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Titik Lokasi Peta</label>
                  <div className="h-48 rounded-lg overflow-hidden border border-slate-200">
                    <MapContainer 
                      center={[-6.2088, 106.8456]} 
                      zoom={11} 
                      scrollWheelZoom={true} 
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <LocationPicker position={selectedBencanaLocation} setPosition={setSelectedBencanaLocation} />
                    </MapContainer>
                  </div>
                  {selectedBencanaLocation ? (
                    <p className="text-xs text-emerald-600 mt-1 font-medium">Titik lokasi bencana terpilih.</p>
                  ) : (
                    <p className="text-xs text-red-500 mt-1 font-medium">* Error: Titik koordinat peta wajib dipilih.</p>
                  )}
                </div>
                <div>
                  <label htmlFor="dampak" className="block text-sm font-medium text-slate-700 mb-1">Deskripsi & Dampak</label>
                  <textarea required id="dampak" name="dampak" rows={3} value={bencanaFormData.dampak} onChange={handleBencanaInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Jelaskan kondisi saat ini dan dampak bencana"></textarea>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsBencanaModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Batal
              </button>
              <button type="submit" form="bencanaForm" disabled={!selectedBencanaLocation} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${selectedBencanaLocation ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-400 cursor-not-allowed'}`}>
                Kirim Laporan Bencana
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Masuk Portal Admin</h3>
              <button onClick={() => setIsLoginModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
              {loginError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 animate-shake">
                  {loginError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username / Email</label>
                <input required type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" placeholder="Masukkan username atau email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input required type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" placeholder="••••••••" />
              </div>
              <div className="pt-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                <p className="font-semibold text-slate-700">Akun Uji Coba Offline:</p>
                <p>• Superadmin: <strong className="text-slate-800">admin</strong> / password: <strong className="text-slate-800">admin123</strong></p>
                <p>• Relawan: <strong className="text-slate-800">relawan</strong> / password: <strong className="text-slate-800">relawan123</strong></p>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsLoginModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                  Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
