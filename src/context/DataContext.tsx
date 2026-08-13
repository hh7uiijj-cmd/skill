import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { subscribeAccounts } from '../lib/accounts';
import { subscribeCategories } from '../lib/categories';
import type { Account, Category } from '../types/models';

interface DataContextValue {
  accounts: Account[];
  categories: Category[];
  accountsById: Map<string, Account>;
  categoriesById: Map<string, Category>;
  totalBalanceCents: number;
  loading: boolean;
}

const DataContext = createContext<DataContextValue>({
  accounts: [],
  categories: [],
  accountsById: new Map(),
  categoriesById: new Map(),
  totalBalanceCents: 0,
  loading: true,
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setCategories([]);
      setAccountsLoaded(false);
      setCategoriesLoaded(false);
      return;
    }
    const unsubAccounts = subscribeAccounts(user.uid, (a) => {
      setAccounts(a);
      setAccountsLoaded(true);
    });
    const unsubCategories = subscribeCategories(user.uid, undefined, (c) => {
      setCategories(c);
      setCategoriesLoaded(true);
    });
    return () => {
      unsubAccounts();
      unsubCategories();
    };
  }, [user]);

  const value = useMemo<DataContextValue>(() => {
    const accountsById = new Map(accounts.map((a) => [a.id, a]));
    const categoriesById = new Map(categories.map((c) => [c.id, c]));
    const totalBalanceCents = accounts.reduce((sum, a) => sum + a.currentBalanceCents, 0);
    return {
      accounts,
      categories,
      accountsById,
      categoriesById,
      totalBalanceCents,
      loading: !accountsLoaded || !categoriesLoaded,
    };
  }, [accounts, categories, accountsLoaded, categoriesLoaded]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
