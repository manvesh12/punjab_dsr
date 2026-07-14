# Shared

Shared contains design-system primitives and cross-feature infrastructure only. It must stay small and stable so feature teams can work independently.

## Allowed Shared Areas

```txt
components/
  Button/
  Input/
  Modal/
  Sidebar/
  Topbar/
  Loader/
  Table/
  Pagination/
  Toast/
  Charts/
  Icons/
  DatePicker/
  Search/
  Cards/
design-system/
  tokens/
  typography/
  color/
  spacing/
  shadows/
  radius/
hooks/
  useDebouncedValue.ts
  useMediaQuery.ts
  useDisclosure.ts
api/
  httpClient.ts
  apiErrors.ts
types/
  api.ts
  pagination.ts
utils/
  date.ts
  format.ts
  permissions.ts
```

## Shared Rules

- Shared components cannot import feature modules.
- Shared API utilities cannot hard-code feature endpoints.
- Shared styles define tokens and primitives, not page identity.
- Shared hooks must be generic and reusable across at least two features.
