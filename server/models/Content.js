const supabase = require('../config/supabase');

class Content {
  static async create(contentData) {
    const { data, error } = await supabase
      .from('content')
      .insert([contentData])
      .select();
      
    if (error) throw error;
    return data[0];
  }
  
  static async findById(id) {
    const { data, error } = await supabase
      .from('content')
      .select('*, users(*)')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  }
  
  static async findAll(options = {}) {
    let query = supabase
      .from('content')
      .select('*, users(*)')
      .order('created_at', { ascending: false });
      
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.range(options.offset, options.offset + options.limit - 1);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }
  
  static async update(id, updates) {
    const { data, error } = await supabase
      .from('content')
      .update(updates)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    return data[0];
  }
  
  static async delete(id) {
    const { error } = await supabase
      .from('content')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  }
  
  static async like(contentId, userId) {
    const { data, error } = await supabase
      .from('likes')
      .insert([{ content_id: contentId, user_id: userId }])
      .select();
      
    if (error) throw error;
    return data[0];
  }
  
  static async unlike(contentId, userId) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('content_id', contentId)
      .eq('user_id', userId);
      
    if (error) throw error;
  }
  
  static async addComment(contentId, userId, comment) {
    const { data, error } = await supabase
      .from('comments')
      .insert([{
        content_id: contentId,
        user_id: userId,
        comment
      }])
      .select();
      
    if (error) throw error;
    return data[0];
  }
}

module.exports = Content; 