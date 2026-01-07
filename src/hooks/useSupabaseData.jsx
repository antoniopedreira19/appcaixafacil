import { supabase } from "@/integrations/supabase/client";

// Hook helper para queries do Supabase substituindo base44.entities

export const transactionsApi = {
  list: async (orderBy = '-date') => {
    const ascending = !orderBy.startsWith('-');
    const column = orderBy.replace('-', '');
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order(column, { ascending });
    
    if (error) throw error;
    return data || [];
  },
  
  create: async (transaction) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  bulkCreate: async (transactions) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactions)
      .select();
    
    if (error) throw error;
    return data;
  },
  
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  delete: async (id) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const accountsApi = {
  list: async (orderBy = '-created_at') => {
    const ascending = !orderBy.startsWith('-');
    const column = orderBy.replace('-', '');
    
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order(column, { ascending });
    
    if (error) throw error;
    return data || [];
  },
  
  create: async (account) => {
    const { data, error } = await supabase
      .from('accounts')
      .insert(account)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  delete: async (id) => {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
