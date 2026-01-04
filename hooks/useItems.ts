"use client";


import axios, { AxiosError } from "axios";
import { useEffect, useState, useCallback } from "react";


interface ItemResponse {
  id: string; 
  name: string;
  url?: string; 
  type: string[]; 
  tags: string[]; 
  username_ct?: string; 
  password_ct?: string;
  totp_seed_ct?: string;
  note_ct?: string;
  item_key_wrapped: string;
  updated_at: string;
}


interface ItemsApiResponse {
  items: ItemResponse[];
  count: number;
  vault_id: string;
  filters_applied?: {
    search?: string;
    type?: string;
    tag?: string;
  };
}


interface UseItemsReturn {
  items: ItemResponse[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}


export function useItems(
  vaultId: string,
  searchQuery?: string,
  typeFilter?: string,
  tagFilter?: string
): UseItemsReturn {
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);


  const fetchItems = useCallback(async () => {
    if (!vaultId) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }


    setLoading(true);
    setError(null);


    try {
      const params: Record<string, string> = {
        vault_id: vaultId,
      };


      if (searchQuery?.trim()) {
        params.q = searchQuery.trim();
      }
      
      if (typeFilter?.trim()) {
        params.type = typeFilter.trim();
      }
      
      if (tagFilter?.trim()) {
        params.tag = tagFilter.trim();
      }


      const response = await axios.get<ItemsApiResponse>(`/api/items`, {
        params,
      });


      const data = response.data;


      if (!data || !data.items || !Array.isArray(data.items)) {
        setItems([]);
        setError("Invalid response format from server");
        return;
      }


      setItems(data.items);
      console.log(`Fetched ${data.count} items from vault ${data.vault_id}`);


    } catch (error) {
      console.error("Failed to fetch items:", error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{
          message?: string;
          error?: string;
        }>;
        
        const status = axiosError.response?.status;
        const errorMsg = 
          axiosError.response?.data?.message || 
          axiosError.response?.data?.error || 
          axiosError.message ||
          "Failed to fetch items";


        if (status === 401) {
          setError("Unauthorized - please log in");
        } else if (status === 403) {
          setError("Access denied - insufficient permissions");
        } else if (status === 404) {
          setError("Vault not found");
        } else {
          setError(`Error (${status || 'Unknown'}): ${errorMsg}`);
        }
      } else {
        const err = error as Error;
        setError(`Network error: ${err.message}`);
      }
      
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [vaultId, searchQuery, typeFilter, tagFilter]);


  useEffect(() => {
    fetchItems();
  }, [fetchItems]);


  return {
    items,
    loading,
    error,
    refetch: fetchItems
  };
}
