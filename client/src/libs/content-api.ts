import apiClient from "./api-client";

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  priority: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export const getActiveBanners = async (): Promise<Banner[]> => {
  try {
    const response = await apiClient.get<any, ApiResponse<Banner[]>>("/banners/active");
    if (response.code === 1000) {
      return response.result;
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch active banners:", error);
    return [];
  }
};

export const getBannersByPosition = async (position: string): Promise<Banner[]> => {
  try {
    const response = await apiClient.get<any, ApiResponse<Banner[]>>(`/banners/position/${position}`);
    if (response.code === 1000) {
      return response.result;
    }
    return [];
  } catch (error) {
    console.error(`Failed to fetch banners for position ${position}:`, error);
    return [];
  }
};

export const getHomeMainBanners = () => getBannersByPosition("HOME_MAIN");
