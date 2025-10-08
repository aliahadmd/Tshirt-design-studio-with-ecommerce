import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
}

interface CartItem {
  designId: string;
  designName: string;
  quantity: number;
  size: string;
  price: number;
  thumbnail?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  _hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (designId: string) => void;
  updateQuantity: (designId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

interface DesignState {
  currentDesign: {
    name: string;
    frontDesign: any;
    backDesign: any;
    tshirtColor: string;
  };
  setDesignName: (name: string) => void;
  setFrontDesign: (design: any) => void;
  setBackDesign: (design: any) => void;
  setTshirtColor: (color: string) => void;
  resetDesign: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      _hasHydrated: false,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },
      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          // Validate that design ID is not temporary
          if (item.designId.startsWith('temp-')) {
            console.error('Cannot add item with temporary ID to cart');
            return state;
          }
          
          const existingItem = state.items.find(
            (i) => i.designId === item.designId && i.size === item.size
          );
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.designId === item.designId && i.size === item.size
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (designId) =>
        set((state) => ({
          items: state.items.filter((i) => i.designId !== designId),
        })),
      updateQuantity: (designId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.designId === designId ? { ...i, quantity } : i
          ),
        })),
      clearCart: () => set({ items: [] }),
      total: () => {
        const items = get().items;
        return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Clean up any items with temporary IDs on hydration
        if (state) {
          const validItems = state.items.filter(item => !item.designId.startsWith('temp-'));
          if (validItems.length !== state.items.length) {
            console.log('Cleaned up temporary cart items');
            state.items = validItems;
          }
        }
      },
    }
  )
);

export const useDesignStore = create<DesignState>((set) => ({
  currentDesign: {
    name: 'Untitled Design',
    frontDesign: null,
    backDesign: null,
    tshirtColor: '#ffffff',
  },
  setDesignName: (name) =>
    set((state) => ({
      currentDesign: { ...state.currentDesign, name },
    })),
  setFrontDesign: (design) =>
    set((state) => ({
      currentDesign: { ...state.currentDesign, frontDesign: design },
    })),
  setBackDesign: (design) =>
    set((state) => ({
      currentDesign: { ...state.currentDesign, backDesign: design },
    })),
  setTshirtColor: (color) =>
    set((state) => ({
      currentDesign: { ...state.currentDesign, tshirtColor: color },
    })),
  resetDesign: () =>
    set({
      currentDesign: {
        name: 'Untitled Design',
        frontDesign: null,
        backDesign: null,
        tshirtColor: '#ffffff',
      },
    }),
}));
