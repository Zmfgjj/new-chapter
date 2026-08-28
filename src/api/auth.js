import axios from 'axios'
import { Capacitor } from '@capacitor/core'
import { globalAlert } from '../context/AlertContext'

const isNative = Capacitor.isNativePlatform();
const API_URL = isNative
  ? 'https://NewChapter.cloud/api' // Android APK langsung ke domain
  : '/api'; // Web app menggunakan relative path (Nginx reverse proxy)

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true,
})

// Mock API responses for local showcase
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  // INTERCEPT REQUESTS FOR SHOWCASE
  if (config.url.startsWith('/menu')) {
    // If it's a GET request
    if (config.method === 'get') {
      if (config.url === '/menu') {
        const menus = JSON.parse(localStorage.getItem('showcase_menus') || '[]');
        return Promise.reject({ config, isMock: true, data: menus, status: 200 });
      }
      if (config.url === '/menu/kategori') {
        const kats = JSON.parse(localStorage.getItem('showcase_kategori') || '[]');
        return Promise.reject({ config, isMock: true, data: kats, status: 200 });
      }
      if (config.url === '/menu/promo/campaign') {
        return Promise.reject({ config, isMock: true, data: [], status: 200 });
      }
    }
    
    const parseData = (data) => {
      let bodyData = {};
      if (data instanceof FormData) {
        for (let [key, value] of data.entries()) {
          if (value instanceof File) {
            bodyData[key] = URL.createObjectURL(value); // Mock file upload
          } else {
            bodyData[key] = value;
          }
        }
      } else {
        try { bodyData = typeof data === 'string' ? JSON.parse(data) : data; } catch(e) {}
      }
      return bodyData;
    };

    // POST /menu (Add Menu)
    if (config.method === 'post' && config.url === '/menu') {
      const menus = JSON.parse(localStorage.getItem('showcase_menus') || '[]');
      const newMenu = { id: Date.now(), ...parseData(config.data), terjual: 0 };
      menus.push(newMenu);
      localStorage.setItem('showcase_menus', JSON.stringify(menus));
      return Promise.reject({ config, isMock: true, data: newMenu, status: 201 });
    }
    
    // POST /menu/kategori (Add Kategori)
    if (config.method === 'post' && config.url === '/menu/kategori') {
      const kats = JSON.parse(localStorage.getItem('showcase_kategori') || '[]');
      const newKat = { id: Date.now(), ...parseData(config.data) };
      kats.push(newKat);
      localStorage.setItem('showcase_kategori', JSON.stringify(kats));
      return Promise.reject({ config, isMock: true, data: newKat, status: 201 });
    }

    // PUT /menu/:id (Edit Menu)
    if (config.method === 'put' && config.url.match(/^\/menu\/\d+$/)) {
      const id = parseInt(config.url.split('/').pop());
      let menus = JSON.parse(localStorage.getItem('showcase_menus') || '[]');
      const index = menus.findIndex(m => m.id === id);
      if (index !== -1) {
        menus[index] = { ...menus[index], ...parseData(config.data) };
        localStorage.setItem('showcase_menus', JSON.stringify(menus));
      }
      return Promise.reject({ config, isMock: true, data: { message: 'Updated' }, status: 200 });
    }

    // PUT /menu/kategori/:id (Edit Kategori)
    if (config.method === 'put' && config.url.match(/^\/menu\/kategori\/\d+$/)) {
      const id = parseInt(config.url.split('/').pop());
      let kats = JSON.parse(localStorage.getItem('showcase_kategori') || '[]');
      const index = kats.findIndex(k => k.id === id);
      if (index !== -1) {
        kats[index] = { ...kats[index], ...parseData(config.data) };
        localStorage.setItem('showcase_kategori', JSON.stringify(kats));
      }
      return Promise.reject({ config, isMock: true, data: { message: 'Updated' }, status: 200 });
    }

    // DELETE /menu/:id and /menu/kategori/:id
    if (config.method === 'delete' && config.url.startsWith('/menu/')) {
      const id = parseInt(config.url.split('/').pop());
      if (config.url.includes('/kategori/')) {
         let kats = JSON.parse(localStorage.getItem('showcase_kategori') || '[]');
         kats = kats.filter(k => k.id !== id);
         localStorage.setItem('showcase_kategori', JSON.stringify(kats));
      } else {
         let menus = JSON.parse(localStorage.getItem('showcase_menus') || '[]');
         menus = menus.filter(m => m.id !== id);
         localStorage.setItem('showcase_menus', JSON.stringify(menus));
      }
      return Promise.reject({ config, isMock: true, data: { message: 'Deleted' }, status: 200 });
    }
  }

    // Mock Meja
    if (config.url === '/meja' && config.method === 'get') {
      const mejaList = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        nomor_meja: String(i + 1),
        nomor: String(i + 1),
        status: 'kosong'
      }));
      return Promise.reject({ config, isMock: true, data: mejaList, status: 200 });
    }

    // Mock Members & Pelanggan
    if (config.url === '/members' && config.method === 'get') {
      const dummyMembers = [
        { id: 1, nama: 'Budi Santoso', nama_panggilan: 'Budi', no_hp: '081234567890', point: 120, created_at: new Date().toISOString() },
        { id: 2, nama: 'Siti Aminah', nama_panggilan: 'Siti', no_hp: '081987654321', point: 50, created_at: new Date().toISOString() }
      ];
      return Promise.reject({ config, isMock: true, data: dummyMembers, status: 200 });
    }

    if (config.url.startsWith('/members/') && config.method === 'get' && !config.url.includes('/history')) {
      const nomorHp = config.url.split('/').pop();
      const dummyMembers = [
        { id: 1, nama: 'Budi Santoso', nama_panggilan: 'Budi', no_hp: '081234567890', point: 120, created_at: new Date().toISOString() },
        { id: 2, nama: 'Siti Aminah', nama_panggilan: 'Siti', no_hp: '081987654321', point: 50, created_at: new Date().toISOString() }
      ];
      const member = dummyMembers.find(m => m.no_hp === nomorHp);
      if (member) {
        return Promise.reject({ config, isMock: true, data: member, status: 200 });
      } else {
        return Promise.reject({ config, isMock: true, data: { message: 'Member not found' }, status: 404 });
      }
    }

    if (config.url === '/crm/pelanggan' && config.method === 'get') {
      const dummyPelanggan = [
        { nama_pelanggan: 'Budi Santoso', no_telepon: '081234567890', no_telepon_wa: '081234567890', total_kunjungan: 12, kunjungan_bulan_ini: 2, belanja_bulan_ini: 150000, total_belanja: 500000, kunjungan_terakhir: new Date().toISOString() },
        { nama_pelanggan: 'Siti Aminah', no_telepon: '081987654321', no_telepon_wa: '081987654321', total_kunjungan: 3, kunjungan_bulan_ini: 1, belanja_bulan_ini: 50000, total_belanja: 150000, kunjungan_terakhir: new Date().toISOString() }
      ];
      return Promise.reject({ config, isMock: true, data: dummyPelanggan, status: 200 });
    }

    // Mock /auth/me to upgrade user to owner locally
    if (config.url === '/auth/me' && config.method === 'get') {
      const mockUser = {
        id: 1,
        username: 'admin',
        role: 'owner',
        name: 'Admin Showcase'
      };
      return Promise.reject({ config, isMock: true, data: { user: mockUser }, status: 200 });
    }

    // MOCK USER MANAGE
    if (config.url.startsWith('/user')) {
      let users = JSON.parse(localStorage.getItem('showcase_users') || 'null');
      if (!users) {
        users = [
          { id: 1, nama: 'Admin Showcase', username: 'admin', role: 'owner', aktif: 1, is_logged_in: true },
          { id: 2, nama: 'Kasir Satu', username: 'kasir1', role: 'kasir', aktif: 1, is_logged_in: false }
        ];
        localStorage.setItem('showcase_users', JSON.stringify(users));
      }

      if (config.method === 'get') {
        return Promise.reject({ config, isMock: true, data: users, status: 200 });
      }

      const parseData = (data) => {
        try { return typeof data === 'string' ? JSON.parse(data) : data; } catch(e) { return data; }
      };

      if (config.method === 'post' && config.url === '/user') {
        const payload = parseData(config.data);
        const newUser = { id: Date.now(), ...payload, aktif: 1, is_logged_in: false };
        users.push(newUser);
        localStorage.setItem('showcase_users', JSON.stringify(users));
        return Promise.reject({ config, isMock: true, data: newUser, status: 201 });
      }

      if (config.method === 'put' && config.url.match(/^\/user\/\d+$/)) {
        const id = parseInt(config.url.split('/').pop());
        const payload = parseData(config.data);
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
          users[index] = { ...users[index], ...payload };
          localStorage.setItem('showcase_users', JSON.stringify(users));
        }
        return Promise.reject({ config, isMock: true, data: { message: 'Updated' }, status: 200 });
      }

      if (config.method === 'delete' && config.url.match(/^\/user\/\d+$/)) {
        const id = parseInt(config.url.split('/').pop());
        users = users.filter(u => u.id !== id);
        localStorage.setItem('showcase_users', JSON.stringify(users));
        return Promise.reject({ config, isMock: true, data: { message: 'Deleted' }, status: 200 });
      }

      if (config.method === 'post' && config.url.match(/^\/user\/\d+\/reset-session$/)) {
        const id = parseInt(config.url.split('/')[2]);
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
          users[index].is_logged_in = false;
          localStorage.setItem('showcase_users', JSON.stringify(users));
        }
        return Promise.reject({ config, isMock: true, data: { message: 'Session reset' }, status: 200 });
      }
    }

    // MOCK ROLE MANAGE
    if (config.url.startsWith('/roles')) {
      let roles = JSON.parse(localStorage.getItem('showcase_roles') || 'null');
      if (!roles) {
        roles = [
          { id: 1, name: 'owner', is_system: 1, permissions: { 'kasir_pos': { view: true, edit: true }, 'kds': { view: true, edit: true }, 'dashboard': { view: true, edit: true }, 'laporan': { view: true, edit: true }, 'menu_manage': { view: true, edit: true }, 'meja_manage': { view: true, edit: true }, 'promo_manage': { view: true, edit: true }, 'crm_pelanggan': { view: true, edit: true }, 'user_manage': { view: true, edit: true }, 'role_manage': { view: true, edit: true } } },
          { id: 2, name: 'manager', is_system: 1, permissions: { 'kasir_pos': { view: true, edit: true }, 'laporan': { view: true, edit: false } } },
          { id: 3, name: 'kasir', is_system: 1, permissions: { 'kasir_pos': { view: true, edit: true } } },
          { id: 4, name: 'dapur', is_system: 1, permissions: { 'kds': { view: true, edit: true } } }
        ];
        localStorage.setItem('showcase_roles', JSON.stringify(roles));
      }

      const parseData = (data) => {
        try { return typeof data === 'string' ? JSON.parse(data) : data; } catch(e) { return data; }
      };

      if (config.method === 'get') {
        const modules = ['kasir_pos', 'kds', 'dashboard', 'laporan', 'menu_manage', 'meja_manage', 'promo_manage', 'crm_pelanggan', 'user_manage', 'role_manage', 'monitoring', 'import'];
        return Promise.reject({ config, isMock: true, data: { roles, modules }, status: 200 });
      }

      if (config.method === 'post' && config.url === '/roles') {
        const payload = parseData(config.data);
        const newRole = { id: Date.now(), name: payload.name, is_system: 0, permissions: {} };
        roles.push(newRole);
        localStorage.setItem('showcase_roles', JSON.stringify(roles));
        return Promise.reject({ config, isMock: true, data: newRole, status: 201 });
      }

      if (config.method === 'put' && config.url.match(/^\/roles\/\d+$/)) {
        const id = parseInt(config.url.split('/').pop());
        const payload = parseData(config.data);
        const index = roles.findIndex(r => r.id === id);
        if (index !== -1) {
          roles[index] = { ...roles[index], ...payload };
          localStorage.setItem('showcase_roles', JSON.stringify(roles));
        }
        return Promise.reject({ config, isMock: true, data: { message: 'Updated' }, status: 200 });
      }

      if (config.method === 'delete' && config.url.match(/^\/roles\/\d+$/)) {
        const id = parseInt(config.url.split('/').pop());
        roles = roles.filter(r => r.id !== id);
        localStorage.setItem('showcase_roles', JSON.stringify(roles));
        return Promise.reject({ config, isMock: true, data: { message: 'Deleted' }, status: 200 });
      }
    }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Resolve mock responses
    if (error.isMock) {
      return Promise.resolve({ data: error.data, status: error.status, config: error.config });
    }

    if (error.response && error.response.status === 401) {
      const originalRequest = error.config;
      if (originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/me') {
        globalAlert('Sesi habis, silakan login ulang', 'Perhatian', 'error');
        localStorage.removeItem('auth_token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    }
    return Promise.reject(error);
  }
)

export const login = async (username, password, force = false) => {
  const res = await api.post('/auth/login', { username, password, force })
  return res.data
}

export const logout = async () => {
  const res = await api.post('/auth/logout')
  return res.data
}

export const getMe = async () => {
  const res = await api.get('/auth/me')
  return res.data
}

export default api
