'use client';

import { 
  Shirt, 
  Truck, 
  Clock, 
  Shield, 
  Star, 
  Users, 
  Phone, 
  MapPin, 
  CreditCard, 
  CheckCircle, 
  Zap, 
  Heart, 
  Award, 
  RefreshCw, 
  Home, 
  Calendar, 
  MessageCircle, 
  Settings, 
  Lock, 
  Sparkles 
} from 'lucide-react';

interface IconRendererProps {
  iconName: string;
  className?: string;
  size?: number;
}

const iconMap = {
  'shirt': Shirt,
  'truck': Truck,
  'clock': Clock,
  'shield': Shield,
  'star': Star,
  'users': Users,
  'phone': Phone,
  'map-pin': MapPin,
  'credit-card': CreditCard,
  'check-circle': CheckCircle,
  'zap': Zap,
  'heart': Heart,
  'award': Award,
  'refresh-cw': RefreshCw,
  'home': Home,
  'calendar': Calendar,
  'message-circle': MessageCircle,
  'settings': Settings,
  'lock': Lock,
  'sparkles': Sparkles
};

export function IconRenderer({ iconName, className = '', size }: IconRendererProps) {
  const IconComponent = iconMap[iconName as keyof typeof iconMap];
  
  if (!IconComponent) {
    // Fallback to a default icon if the icon name is not found
    return <Star className={className} size={size} />;
  }
  
  return <IconComponent className={className} size={size} />;
}
