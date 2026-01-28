export interface OwnerRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  authSecret?: string;
}

export interface CompanyData {
  name: string;
  description: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  businessCategoryId?: number;
}

export interface OpeningHoursDay {
  openTime: string | null;   // HH:mm vagy null
  closeTime: string | null;   // HH:mm vagy null
  isClosed: boolean;
}

export interface OpeningHoursData {
  monday: OpeningHoursDay;
  tuesday: OpeningHoursDay;
  wednesday: OpeningHoursDay;
  thursday: OpeningHoursDay;
  friday: OpeningHoursDay;
  saturday: OpeningHoursDay;
  sunday: OpeningHoursDay;
}

export interface CompanyRegistrationRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  authSecret?: string;
  companyName: string;
  companyDescription: string;
  companyAddress: string;
  companyCity: string;
  companyPostalCode: string;
  companyCountry: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite?: string;
  businessCategoryId?: number;
  openingHours?: OpeningHoursData;
}