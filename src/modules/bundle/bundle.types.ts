export interface BundleInfo {
  id: string;
  title: string;
  description: string;
  icon: string;
  channels: string[];
  order: number;
  category: string;
}

export interface CreateBundleRequest {
  id: string;
  title: string;
  description: string;
  icon: string;
  channels: string[];
  order?: number;
  category?: string;
}
