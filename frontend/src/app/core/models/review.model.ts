export interface Review {
  id: number;
  author: string;
  authorImage: string;
  title: string;
  content: string;
  rating: number;
  companyId: number;
  createdAt: string;
}

export interface CreateReviewRequest {
  companyId: number;
  title: string;
  content: string;
  rating: number;
}