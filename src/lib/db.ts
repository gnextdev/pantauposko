import { supabase, isSupabaseConfigured } from './supabase';

// Helper to manage localStorage for Desktop/Local fallback
const localDb = {
  get: <T>(key: string, fallback: T): T => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  },
  set: (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

// Initial Mock Data
const mockPosko = [
  { id: 1, name: 'Posko Siaga Jakarta Pusat', lat: -6.1751, lng: 106.8272, status: 'Aktif', current_load: 120, max_capacity: 150, status_approval: 'approved' },
  { id: 2, name: 'Posko Bantuan Jakarta Selatan', lat: -6.2416, lng: 106.8108, status: 'Siaga', current_load: 45, max_capacity: 100, status_approval: 'approved' },
  { id: 3, name: 'Posko Relawan Jakarta Timur', lat: -6.2250, lng: 106.9004, status: 'Aktif', current_load: 190, max_capacity: 200, status_approval: 'approved' },
];

const mockPengungsi = [
  { id: 1, posko_id: 1, name: 'Ahmad Dahlan', age: 45, gender: 'L', status: 'Sehat' },
  { id: 2, posko_id: 2, name: 'Siti Rohmah', age: 40, gender: 'P', status: 'Hamil' },
  { id: 3, posko_id: 1, name: 'Budi Kecil', age: 8, gender: 'L', status: 'Sakit Ringan' },
  { id: 4, posko_id: 3, name: 'Mbah Surip', age: 72, gender: 'L', status: 'Sakit Berat' },
];

const mockLogistik = [
  { id: 1, posko_id: 1, nama: 'Beras', kategori: 'Pangan', stok: 500, satuan: 'kg', status: 'Aman' },
  { id: 2, posko_id: 1, nama: 'Mie Instan', kategori: 'Pangan', stok: 120, satuan: 'dus', status: 'Menipis' },
  { id: 3, posko_id: 2, nama: 'Air Mineral', kategori: 'Pangan', stok: 300, satuan: 'dus', status: 'Aman' },
  { id: 4, posko_id: 3, nama: 'Selimut', kategori: 'Sandang', stok: 45, satuan: 'pcs', status: 'Kritis' },
];

const mockKeuangan = [
  { id: 1, posko_id: 1, tipe: 'Pemasukan', kategori: 'Donasi Tunai', nominal: 15000000, deskripsi: 'Donasi harian warga', tanggal: new Date().toISOString().split('T')[0] },
  { id: 2, posko_id: 1, tipe: 'Pengeluaran', kategori: 'Operasional', nominal: 1800000, deskripsi: 'Pembelian gas & perlengkapan dapur umum', tanggal: new Date().toISOString().split('T')[0] },
];

const mockSiaran = [
  { id: 1, posko_id: 1, judul: 'Kebutuhan Mendesak: Selimut & Air Bersih', isi: 'Posko Siaga Jakarta Pusat saat ini sangat membutuhkan tambahan selimut dan air bersih untuk 50 pengungsi baru.', prioritas: 'Tinggi', waktu: new Date().toISOString(), status: 'Aktif' },
  { id: 2, posko_id: null, judul: 'Jadwal Pemeriksaan Kesehatan', isi: 'Tim medis akan melakukan pemeriksaan kesehatan rutin di Tenda B mulai pukul 10:00. Mohon kumpul di area utama.', prioritas: 'Normal', waktu: new Date().toISOString(), status: 'Aktif' }
];

export const db = {
  auth: {
    signIn: async (usernameOrEmail: string, password: string) => {
      if (isSupabaseConfigured) {
        // format as email if only username is provided
        const email = usernameOrEmail.includes('@') ? usernameOrEmail : `${usernameOrEmail}@pantauposkoindonesia.id`;
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        if (data.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*, posko(*)')
            .eq('id', data.user.id)
            .single();
            
          if (profileError) throw profileError;
          return profile;
        }
      }
      
      // Fallback offline users
      if (usernameOrEmail === 'admin' && password === 'admin123') {
        return { id: 'admin-id', username: 'admin', full_name: 'Super Admin Utama', role: 'superadmin', posko_id: null };
      } else if (usernameOrEmail === 'relawan' && password === 'relawan123') {
        return { id: 'relawan-id', username: 'relawan', full_name: 'Relawan Posko Pusat', role: 'relawan', posko_id: 1 };
      }
      
      throw new Error('Username atau password salah.');
    }
  },

  posko: {
    getAll: async () => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('posko').select('*').order('created_at', { ascending: false });
        if (!error) return data;
      }
      return localDb.get('posko', mockPosko);
    },
    create: async (item: any) => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('posko').insert([item]).select();
        if (!error && data) return data[0];
      }
      const local = localDb.get<any[]>('posko', mockPosko);
      const newItem = { ...item, id: Date.now(), status_approval: 'pending' };
      local.push(newItem);
      localDb.set('posko', local);
      return newItem;
    },
    update: async (id: number | string, item: any) => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('posko').update(item).eq('id', id).select();
        if (!error && data) return data[0];
      }
      const local = localDb.get<any[]>('posko', mockPosko);
      const index = local.findIndex(x => x.id === Number(id));
      if (index !== -1) {
        local[index] = { ...local[index], ...item };
        localDb.set('posko', local);
        return local[index];
      }
      return null;
    },
    delete: async (id: number | string) => {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('posko').delete().eq('id', id);
        if (!error) return true;
      }
      const local = localDb.get<any[]>('posko', mockPosko);
      const filtered = local.filter(x => x.id !== Number(id));
      localDb.set('posko', filtered);
      return true;
    }
  },

  pengungsi: {
    getAll: async () => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('pengungsi').select('*').order('created_at', { ascending: false });
        if (!error) return data;
      }
      return localDb.get('pengungsi', mockPengungsi);
    },
    create: async (item: any) => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('pengungsi').insert([item]).select();
        if (!error && data) return data[0];
      }
      const local = localDb.get<any[]>('pengungsi', mockPengungsi);
      const newItem = { ...item, id: Date.now() };
      local.push(newItem);
      localDb.set('pengungsi', local);
      return newItem;
    },
    update: async (id: number | string, item: any) => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('pengungsi').update(item).eq('id', id).select();
        if (!error && data) return data[0];
      }
      const local = localDb.get<any[]>('pengungsi', mockPengungsi);
      const index = local.findIndex(x => x.id === Number(id));
      if (index !== -1) {
        local[index] = { ...local[index], ...item };
        localDb.set('pengungsi', local);
        return local[index];
      }
      return null;
    }
  },

  logistik: {
    getAll: async () => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('logistik').select('*').order('created_at', { ascending: false });
        if (!error) return data;
      }
      return localDb.get('logistik', mockLogistik);
    },
    create: async (item: any) => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('logistik').insert([item]).select();
        if (!error && data) return data[0];
      }
      const local = localDb.get<any[]>('logistik', mockLogistik);
      const newItem = { ...item, id: Date.now() };
      local.push(newItem);
      localDb.set('logistik', local);
      return newItem;
    },
    update: async (id: number | string, item: any) => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('logistik').update(item).eq('id', id).select();
        if (!error && data) return data[0];
      }
      const local = localDb.get<any[]>('logistik', mockLogistik);
      const index = local.findIndex(x => x.id === Number(id));
      if (index !== -1) {
        local[index] = { ...local[index], ...item };
        localDb.set('logistik', local);
        return local[index];
      }
      return null;
    }
  },

  keuangan: {
    getAll: async () => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('keuangan').select('*').order('created_at', { ascending: false });
        if (!error) return data;
      }
      return localDb.get('keuangan', mockKeuangan);
    },
    create: async (item: any) => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('keuangan').insert([item]).select();
        if (!error && data) return data[0];
      }
      const local = localDb.get<any[]>('keuangan', mockKeuangan);
      const newItem = { ...item, id: Date.now() };
      local.push(newItem);
      localDb.set('keuangan', local);
      return newItem;
    }
  },

  siaran: {
    getAll: async () => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('siaran').select('*').order('waktu', { ascending: false });
        if (!error) return data;
      }
      return localDb.get('siaran', mockSiaran);
    },
    create: async (item: any) => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('siaran').insert([item]).select();
        if (!error && data) return data[0];
      }
      const local = localDb.get<any[]>('siaran', mockSiaran);
      const newItem = { ...item, id: Date.now(), waktu: new Date().toISOString() };
      local.push(newItem);
      localDb.set('siaran', local);
      return newItem;
    },
    update: async (id: number | string, item: any) => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('siaran').update(item).eq('id', id).select();
        if (!error && data) return data[0];
      }
      const local = localDb.get<any[]>('siaran', mockSiaran);
      const index = local.findIndex(x => x.id === Number(id));
      if (index !== -1) {
        local[index] = { ...local[index], ...item };
        localDb.set('siaran', local);
        return local[index];
      }
      return null;
    }
  }
};
