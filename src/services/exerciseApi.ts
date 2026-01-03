import { supabase } from './supabaseClient';

// Uygulamanın kullandığı arayüz.
// Supabase'den gelen veriyi bu formata dönüştüreceğiz.
export interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  gifUrl: string;
  target: string;
  instructions: string[];
}

// Supabase'den gelen veriyi (snake_case) uygulamamızın kullandığı formata (camelCase) dönüştüren yardımcı fonksiyon.
const mapSupabaseToExercise = (data: any): Exercise => {
  return {
    id: data.id,
    name: data.name,
    bodyPart: data.body_part,
    equipment: data.equipment,
    gifUrl: data.gif_url,
    target: data.target_muscle,
    instructions: data.instructions || [], // instructions null ise boş dizi ata
  };
};

const COLUMNS_TO_SELECT = 'id, name, body_part, equipment, gif_url, target_muscle, instructions';

/**
 * Supabase veritabanından TÜM egzersizleri çeker.
 */
export const getAllExercises = async (): Promise<Exercise[]> => {
  try {
    const { data, error } = await supabase
      .from('exercises_library')
      .select(COLUMNS_TO_SELECT) // DEĞİŞİKLİK: Sütunlar açıkça belirtildi
      .order('name', { ascending: true }); 

    if (error) {
      console.error('Supabase getAllExercises hatası:', error);
      return [];
    }
    
    return data.map(mapSupabaseToExercise);

  } catch (error) {
    console.error('API servis hatası:', error);
    return [];
  }
};


/**
 * Supabase veritabanından, verilen isme göre arama yapar.
 * .ilike() kullanarak büyük/küçük harf duyarsız ve 'içerir' şeklinde arama yapılır.
 */
export const searchExercisesByName = async (name: string): Promise<Exercise[]> => {
  if (!name.trim()) {
      return [];
  }

  try {
    const { data, error } = await supabase
      .from('exercises_library') 
      .select(COLUMNS_TO_SELECT) // DEĞİŞİKLİK: Sütunlar açıkça belirtildi
      .ilike('name', `%${name}%`)
      .limit(50); 

    if (error) {
      console.error('Supabase arama hatası:', error);
      return [];
    }
    
    return data.map(mapSupabaseToExercise);

  } catch (error) {
    console.error('API servis hatası:', error);
    return [];
  }
};

/**
 * Supabase veritabanından, verilen vücut bölgesine göre egzersizleri listeler.
 */
export const getExercisesByBodyPart = async (bodyPart: string): Promise<Exercise[]> => {
  if (bodyPart === 'all' || !bodyPart) {
      return [];
  }

  try {
    const { data, error } = await supabase
        .from('exercises_library')
        .select(COLUMNS_TO_SELECT) // DEĞİŞİKLİK: Sütunlar açıkça belirtildi
        .eq('body_part', bodyPart)
        .limit(200);

    if (error) {
        console.error('Supabase vücut bölgesi arama hatası:', error);
        return [];
    }
    
    return data.map(mapSupabaseToExercise);

  } catch (error) {
    console.error('API servis hatası:', error);
    return [];
  }
};

/**
 * Supabase'deki tüm benzersiz vücut bölgesi kategorilerini döndürür.
 */
export const getBodyParts = async (): Promise<string[]> => {
    try {
        const { data, error } = await supabase
            .from('exercises_library')
            .select('body_part');

        if (error) {
            console.error('Supabase getBodyParts hatası:', error);
            return [];
        }
        
        // Gelen verideki tekrar edenleri kaldırıp sıralıyoruz.
        const uniqueParts = [...new Set(data.filter(item => item.body_part).map((item: { body_part: string }) => item.body_part))];
        return uniqueParts.sort();

    } catch (error) {
        console.error('API servis hatası:', error);
        return [];
    }
};