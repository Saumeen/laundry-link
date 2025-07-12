import { useState, useEffect } from 'react';

export interface Service {
  id: number;
  name: string;
  displayName: string;
  description: string;
  pricingType: 'BY_WEIGHT' | 'BY_PIECE';
  pricingUnit: 'KG' | 'PIECE';
  price: number;
  unit: string;
  turnaround: string;
  category: string;
  features: string[];
  sortOrder: number;
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/services');
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        
        const data = await response.json();
        setServices(data as Service[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return { services, loading, error };
} 