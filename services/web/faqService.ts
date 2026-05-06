import axiosInstance from '@/lib/axios';

export interface FaqContent {
  title: string;
  description: string;
}

export interface FaqItem {
  id: string;
  title: string;
  contents: FaqContent[];
  createdAt?: string;
}

export const getAllFaqs = async (): Promise<FaqItem[]> => {
  const res = await axiosInstance.get('/api/web/faqs');
  return res.data.data || [];
};

export const getActiveFaqs = async (): Promise<FaqItem[]> => {
  const res = await axiosInstance.get('/api/web/faqs/active');
  return res.data.data || [];
};

export const createFaq = async (payload: { title: string; contents: FaqContent[] }) => {
  const res = await axiosInstance.post('/api/web/faqs', payload);
  return res.data;
};

export const createFaqForce = async (payload: { title: string; contents: FaqContent[] }) => {
  const res = await axiosInstance.post('/api/web/faqs?force=true', payload);
  return res.data;
};

export const updateFaq = async (id: string, payload: { title?: string; contents?: FaqContent[]; sortOrder?: number }, force = false) => {
  const url = `/api/web/faqs/${id}` + (force ? '?force=true' : '');
  const res = await axiosInstance.put(url, payload);
  return res.data;
};

export const deleteFaq = async (id: string) => {
  const res = await axiosInstance.delete(`/api/web/faqs/${id}`);
  return res.data;
};
