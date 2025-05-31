const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

class User {
  static async create(userData) {
    const { username, email, password, fullName } = userData;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          username,
          email,
          password: hashedPassword,
          full_name: fullName,
          avatar: 'https://via.placeholder.com/150',
          cover_photo: 'https://via.placeholder.com/1200x400',
          bio: '',
          is_premium: false
        }
      ])
      .select();
      
    if (error) throw error;
    return data[0];
  }
  
  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
      
    if (error) throw error;
    return data;
  }
  
  static async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  }
  
  static async update(id, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    return data[0];
  }
  
  static async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }
}

module.exports = User; 