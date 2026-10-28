/**
 * Formes des réponses JSON de l'API (Decimal sérialisés en string, dates en ISO 8601).
 */
import type {
  BookingStatus,
  DiscountType,
  PackageCategory,
  PackageStatus,
  PaymentStatus,
  PaymentType,
  PostStatus,
  Role,
} from './enums';

export type ISODate = string;
export type DecimalString = string;

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}
export interface TiptapDoc extends TiptapNode {
  type: 'doc';
}

export interface PublicUser {
  id: string;
  email: string;
  role: Role;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface AuthResponse {
  accessToken: string;
  user: PublicUser;
}

export interface DestinationSummary {
  id: string;
  name_fr: string;
  name_ar: string;
  name_en: string;
  country: string;
  region: string | null;
}

export interface Destination extends DestinationSummary {
  cover_url: string | null;
  description: string | null;
  package_count?: number;
  price_from?: DecimalString | null;
}

export interface RatingSummary {
  average: number | null;
  count: number;
}

export interface ItineraryDay {
  day: number;
  title_fr: string;
  title_ar?: string;
  title_en?: string;
  content_fr?: TiptapDoc;
  content_ar?: TiptapDoc;
  content_en?: TiptapDoc;
  meals?: string[];
  accommodation?: string;
}

export interface PackageSummary {
  id: string;
  slug: string;
  title_fr: string;
  title_ar: string;
  title_en: string;
  description_fr: string;
  destination_id: string;
  destination: DestinationSummary;
  category: PackageCategory;
  duration_days: number;
  base_price: DecimalString;
  max_capacity: number;
  gallery_urls: string[];
  included: string[];
  excluded: string[];
  status: PackageStatus;
  featured: boolean;
  created_at: ISODate;
  updated_at: ISODate;
  rating: RatingSummary;
}

export interface PackageDetail extends Omit<PackageSummary, 'destination'> {
  description_ar: string;
  description_en: string;
  itinerary: ItineraryDay[];
  destination: Destination;
}

export interface PackageFacets {
  price: { min: number; max: number };
  duration: { min: number; max: number };
  categories: { category: PackageCategory; count: number }[];
}

export interface Participant {
  nom: string;
  prenom: string;
  passport: string;
  dob: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  stripe_payment_intent_id: string;
  amount: DecimalString;
  currency: string;
  amount_tnd: DecimalString;
  status: PaymentStatus;
  payment_type: PaymentType;
  paid_at: ISODate | null;
  created_at: ISODate;
}

export interface Person {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: Role;
}

export interface BookingPackage {
  id: string;
  slug: string;
  title_fr: string;
  title_ar: string;
  title_en: string;
  category: PackageCategory;
  duration_days: number;
  gallery_urls: string[];
  base_price: DecimalString;
  destination: Pick<DestinationSummary, 'id' | 'name_fr' | 'name_ar' | 'name_en' | 'country'>;
}

export interface Booking {
  id: string;
  reference: string;
  user_id: string;
  package_id: string;
  departure_date: ISODate;
  return_date: ISODate;
  participants: Participant[];
  total_price: DecimalString;
  paid_amount: DecimalString;
  discount_amount: DecimalString;
  promo_code_id: string | null;
  status: BookingStatus;
  assigned_agent_id: string | null;
  notes_internal?: string | null;
  created_at: ISODate;
  updated_at: ISODate;
  package: BookingPackage;
}

export interface BookingDetail extends Booking {
  user: Person;
  assigned_agent: Person | null;
  payments: Payment[];
  reviews: Review[];
  promo_code: { code: string; discount_type: DiscountType; value: DecimalString } | null;
}

export interface ClientBooking extends Booking {
  assigned_agent: Pick<Person, 'id' | 'first_name' | 'last_name' | 'avatar_url'> | null;
  _count: { messages: number };
}

export interface AdminBooking extends Omit<Booking, 'package'> {
  package: Pick<BookingPackage, 'id' | 'slug' | 'title_fr' | 'category'>;
  user: Person;
  assigned_agent: Pick<Person, 'id' | 'first_name' | 'last_name'> | null;
}

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: ISODate;
  sender: Pick<Person, 'id' | 'first_name' | 'last_name' | 'role' | 'avatar_url'>;
}

export interface Review {
  id: string;
  booking_id: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: ISODate;
}

export interface PublicReview extends Review {
  author: { name: string; avatar_url: string | null };
}

export interface FeaturedReview extends PublicReview {
  package: { slug: string; title_fr: string; title_ar: string; title_en: string };
}

export interface ReviewSummary {
  average: number | null;
  count: number;
  distribution: Record<number, number>;
}

export interface BlogPostSummary {
  id: string;
  slug: string;
  title_fr: string;
  title_ar: string;
  title_en: string;
  excerpt_fr: string | null;
  excerpt_ar: string | null;
  excerpt_en: string | null;
  cover_url: string | null;
  tags: string[];
  status: PostStatus;
  published_at: ISODate | null;
  created_at: ISODate;
  updated_at: ISODate;
  author: { id: string; first_name: string; last_name: string; avatar_url: string | null };
  reading_minutes: number;
}

export interface BlogPost extends BlogPostSummary {
  body: TiptapDoc;
  related: Pick<BlogPostSummary, 'slug' | 'title_fr' | 'title_ar' | 'title_en' | 'cover_url' | 'published_at'>[];
}

export interface PromoValidation {
  code: string;
  discount_type: DiscountType;
  value: DecimalString;
  subtotal: DecimalString;
  discount: DecimalString;
  total: DecimalString;
}

export interface PaymentIntentResponse {
  payment_id: string;
  client_secret: string;
  payment_type: PaymentType;
  amount_tnd: DecimalString;
  amount_charged: string;
  currency: string;
  deposit_percent: number;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: ISODate;
}
