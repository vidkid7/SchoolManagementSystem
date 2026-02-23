export interface SchoolConfigData {
  schoolNameEn: string;
  schoolNameNp?: string;
  schoolCode?: string;
  logoUrl?: string;
  addressEn?: string;
  addressNp?: string;
  phone?: string;
  email?: string;
  website?: string;
  academicYearStartMonth?: number;
  academicYearDurationMonths?: number;
  termsPerYear?: number;
  defaultCalendarSystem?: 'BS' | 'AD';
  defaultLanguage?: 'nepali' | 'english';
  timezone?: string;
  currency?: string;
  dateFormat?: string;
  timeFormat?: string;
  numberFormat?: string;
}

export interface SchoolConfigResponse {
  id: string;
  schoolNameEn: string;
  schoolNameNp?: string;
  schoolCode?: string;
  logoUrl?: string;
  addressEn?: string;
  addressNp?: string;
  phone?: string;
  email?: string;
  website?: string;
  academicYearStartMonth: number;
  academicYearDurationMonths: number;
  termsPerYear: number;
  defaultCalendarSystem: 'BS' | 'AD';
  defaultLanguage: 'nepali' | 'english';
  timezone: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
