export interface Review {
  id: number;
  userName: string;
  userImage?: string;
  rating: number;
  comment: string;
  date: string;  // "2024. 11. 15."
}

export interface CreateReviewRequest {
  companyId: number;
  rating: number;
  comment: string;
}