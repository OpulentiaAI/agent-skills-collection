# PartsTree Catalog DB → Shopware DB Overview

## Purpose of the System

The PartsTree platform is built around a large equipment and replacement parts catalog. The core idea is:

- A **Catalog DB** (Mongo/DocumentDB style source system) acts as the master data source.
- Data is continuously synchronized into **Shopware**, which is the ecommerce and storefront platform.
- Shopware is used both for:
  - storefront rendering,
  - search/navigation,
  - ecommerce operations,
  - and partially as a content management layer.

The project is essentially a translation layer from a flexible, document-oriented catalog model into a structured relational ecommerce model.

The Catalog DB contains hierarchical equipment and parts data such as:

```text
Brand
 └── Brand Family
      └── Model
           └── Model Variant
                └── IPL (illustrated parts list / diagram)
                     └── Parts
```

The ingestion layer maps this hierarchy into Shopware categories, products, custom entities, properties, and custom fields.

---

# High-Level Architecture

## Source System: Catalog DB

The source catalog behaves like a flexible document database.

Characteristics:

- Mongo/DocumentDB style structure
- Nested/hierarchical entities
- Semi-structured fields
- Some fields are optional or inconsistent
- Different equipment types may have different attributes
- Data quality varies across brands/vendors

The Catalog DB is considered the "truth".

Synchronization runs continuously:

- catalog ingestion
- event-driven updates
- periodic stock syncs
- synchronization lambdas/services

The sync process translates catalog entities into Shopware-compatible structures.

---

# Core Business Concepts

## Brand

Examples:

- Echo
- Cub Cadet
- Gravely

In Shopware:

- represented primarily as top-level categories
- may also map to manufacturers
- used for storefront navigation and SEO

Characteristics:

- mostly stable
- created only through ingestion
- editable in Shopware
- not usually deleted

---

## Brand Family

Examples:

- Echo Chainsaws
- Exmark Navigator

Represents a grouping under a brand.

In Shopware:

- category below Brand
- associated with equipment type
- used heavily for SEO and navigation

Brand Family is not always a first-class object in the source DB.
Often it is inferred from model metadata.
