export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  calorieGoal: number;
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  profileImage?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ServingSize {
  unit: string;
  weightInGrams: number;
}

export interface Product {
  _id: string;
  name: string;
  caloriesPer100g: number;
  servingSizes: ServingSize[];
  imageUrl?: string;
  createdBy: string | null;
}

export interface LogItem {
  _id: string;
  productId?: string;
  productName: string;
  unit?: string;
  quantity?: number;
  calories: number;
}

export interface DailyLog {
  _id: string;
  userId: string;
  date: string;
  targetCalories: number;
  totalCaloriesConsumed: number;
  goalMet: boolean;
  items: LogItem[];
}
