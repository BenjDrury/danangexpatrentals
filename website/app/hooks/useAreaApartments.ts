"use client";

import { useMemo } from "react";
import type { Apartment } from "types";
import type {
  AreaListFilters,
  UnitFilter,
} from "../components/area/FilterBar";

function bedroomToUnitFilter(bedrooms: number): UnitFilter {
  if (bedrooms === 0) return "studio";
  if (bedrooms === 1) return "1br";
  if (bedrooms === 2) return "2br";
  return "3br";
}

function matchesUnitFilter(apt: Apartment, filter: UnitFilter): boolean {
  if (filter === "all") return true;
  const aptUnit = bedroomToUnitFilter(apt.bedrooms);
  return aptUnit === filter;
}

function isFurnished(apt: Apartment): boolean {
  return apt.features.some(
    (f) => f.toLowerCase().includes("furnished") || f.toLowerCase() === "furnished"
  );
}

export function useAreaApartments(
  apartments: Apartment[],
  filters: AreaListFilters
): Apartment[] {
  return useMemo(() => {
    let list = apartments.filter((apt) => {
      if (!matchesUnitFilter(apt, filters.unitType)) return false;
      if (
        filters.propertyType !== "all" &&
        apt.property_type !== filters.propertyType
      ) {
        return false;
      }
      if (filters.minPrice != null && apt.price < filters.minPrice) return false;
      if (filters.maxPrice != null && apt.price > filters.maxPrice) return false;
      if (filters.furnishedOnly && !isFurnished(apt)) return false;
      if (filters.maxLeaseMonths != null) {
        // Keep flexible (null) or required min lease within what the renter will accept.
        if (
          apt.min_lease_months != null &&
          apt.min_lease_months > filters.maxLeaseMonths
        ) {
          return false;
        }
      }
      if (filters.maxDepositMonths != null) {
        if (
          apt.deposit_months != null &&
          apt.deposit_months > filters.maxDepositMonths
        ) {
          return false;
        }
      }
      if (filters.noAgencyFeeOnly) {
        if (apt.agency_fee_months == null || apt.agency_fee_months > 0) {
          return false;
        }
      }
      if (filters.utilities !== "all") {
        if (filters.utilities === "included_or_partial") {
          if (
            apt.utilities_included !== "included" &&
            apt.utilities_included !== "partial"
          ) {
            return false;
          }
        } else if (apt.utilities_included !== filters.utilities) {
          return false;
        }
      }
      return true;
    });

    const sort = filters.sort;
    if (sort === "recommended") {
      list = [...list].sort((a, b) => {
        const aFurn = isFurnished(a) ? 1 : 0;
        const bFurn = isFurnished(b) ? 1 : 0;
        if (bFurn !== aFurn) return bFurn - aFurn;
        return a.sort_order - b.sort_order || a.price - b.price;
      });
    } else if (sort === "price_asc") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sort === "newest") {
      list = [...list].sort((a, b) => {
        const da = a.updated_at || a.created_at || "";
        const db = b.updated_at || b.created_at || "";
        return db.localeCompare(da);
      });
    }

    return list;
  }, [apartments, filters]);
}
