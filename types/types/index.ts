// Shared types — add files (e.g. Lead.ts, ApiResponse.ts) and re-export below.
export type JsonPrimitive = string | number | boolean | null;
export type { Area } from "./Area";
export type {
  Apartment,
  PropertyType,
  UtilitiesIncluded,
} from "./Apartment";
export type { EstateCompany } from "./EstateCompany";
export type { ApartmentType } from "./ApartmentType";
export type { Feature } from "./Feature";
export type { User, UserRole } from "./User";
export type { PartnerInvite, PartnerInviteStatus } from "./PartnerInvite";
export type { CoworkingSpace } from "./CoworkingSpace";
export type { Activity } from "./Activity";
export type {
  PriceCurrency,
  ConvertedPrice,
  ListingPriceFields,
} from "../lib/price";
export {
  DEFAULT_USD_VND_RATE,
  resolveUsdVndRate,
  convertPrice,
  formatUsd,
  formatVnd,
  formatPriceBoth,
  listingPriceLabel,
} from "../lib/price";
export {
  formatMonthsOfRent,
  propertyTypeLabel,
  parsePropertyType,
  parseUtilitiesIncluded,
  parseMonthsOfRent,
  inferPropertyType,
  inferUtilitiesIncluded,
  inferDepositMonths,
  inferAgencyFeeMonths,
  resolveListingTerms,
  DEFAULT_PROPERTY_TYPE,
  DEFAULT_UTILITIES_INCLUDED,
  DEFAULT_DEPOSIT_MONTHS,
  DEFAULT_AGENCY_FEE_MONTHS,
  utilitiesIncludedLabel,
  agencyFeeLabel,
} from "../lib/listing-terms";
export type { ResolvedListingTerms } from "../lib/listing-terms";
export { sanitizeListingDescription } from "../lib/sanitize-listing-description";

