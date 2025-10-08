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
  Sparkles,
  Wand2,
  Timer,
  Package,
  Wrench
} from 'lucide-react';

interface IconRendererProps {
  iconName: string;
  className?: string;
  size?: number;
}

// Icon map supporting both Lucide names and Material Symbols names
const iconMap = {
  // Lucide names (original)
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
  'sparkles': Sparkles,
  
  // Material Symbols name mappings (from IconPicker)
  'local_laundry_service': Shirt,
  'dry_cleaning': Shirt,
  'iron': Wand2,
  'wash': Shirt,
  'bolt': Zap,
  'king_bed': Home,
  'checkroom': Shirt,
  'schedule': Calendar,
  'delivery_truck': Truck,
  'security': Shield,
  'location_on': MapPin,
  'payment': CreditCard,
  'check_circle': CheckCircle,
  'speed': Zap,
  'favorite': Heart,
  'emoji_events': Award,
  'refresh': RefreshCw,
  'calendar_today': Calendar,
  'chat': MessageCircle,
  'auto_awesome': Sparkles,
  'cleaning_services': Wand2,
  'local_shipping': Truck,
  'access_time': Clock,
  'support_agent': MessageCircle
};

export function IconRenderer({ iconName, className = '', size }: IconRendererProps) {
  const IconComponent = iconMap[iconName as keyof typeof iconMap];
  
  if (!IconComponent) {
    // Fallback to a default icon if the icon name is not found
    return <Star className={className} size={size} />;
  }
  
  return <IconComponent className={className} size={size} />;
}
