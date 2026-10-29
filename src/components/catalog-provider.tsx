"use client";
import { createContext, useContext, useMemo } from "react";
import { buildCatalog, EMPTY_CATALOG, type CatalogSnapshot } from "@/lib/catalog";
const Context=createContext<ReturnType<typeof buildCatalog>>(buildCatalog(EMPTY_CATALOG));
export function CatalogProvider({snapshot,children}:{snapshot:CatalogSnapshot;children:React.ReactNode}){const catalog=useMemo(()=>buildCatalog(snapshot),[snapshot]);return <Context.Provider value={catalog}>{children}</Context.Provider>;}
export function useCatalog(){return useContext(Context);}
