'use client';

import { createContext, useContext } from 'react';
import type { Category } from '@/lib/types';

const Ctx = createContext<Category[]>([]);

/** Hands the shop categories (loaded once in SiteChrome) to client components deep in the tree, e.g. product cards. */
export function CategoriesProvider({ categories, children }: { categories: Category[]; children: React.ReactNode }) {
  return <Ctx value={categories}>{children}</Ctx>;
}

export const useCategories = () => useContext(Ctx);
