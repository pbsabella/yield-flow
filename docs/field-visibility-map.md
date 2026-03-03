### Investment Wizard Logic & Field Mapping

#### 1. Product Type Hierarchy

- **td-maturity**
  - Bank \*
  - Product type \*
  - Name
  - Principal \*
  - Start date \*
  - Interest rate \* `[Simple | Tiered]`
    - Simple: flat rate input
    - Tiered: tier builder
  - Withholding tax \*
  - Day count
  - Term \* `[Months | Days]`
  - Compounding (Tiered only — see logic below)

- **td-monthly**
  - _Identical to td-maturity_
  - Note: Payout is implicit in the product name; field removed from UI.

- **savings**
  - Bank \*
  - Product type \*
  - Name
  - Principal \*
  - Start date \*
  - Interest rate \* `[Simple | Tiered]`
  - Withholding tax \*
  - Day count
  - **Open-ended toggle**
    - `ON` → Term HIDDEN
    - `OFF` → Term \* `[Months | Days]`
  - Compounding (Tiered only — see logic below)

---

#### 2. Compounding Logic (Last Field)

- **interestMode = simple**
  - Field: `HIDDEN`
  - Logic: Engine ignores compounding for simple branch.
- **interestMode = tiered**
  - Field: `VISIBLE` (Daily | Monthly toggle)
  - **Contextual Descriptions:**
    - _td-monthly:_ "How often interest is calculated before being distributed to you."
    - _td-maturity / savings:_ "How often interest compounds back into your principal."

---

#### 3. Implicit Payout Frequency (Hook Level)

Derived from `productType` — not user-configurable in UI:

- **td-maturity** → `payoutFrequency = "maturity"` → `interestTreatment = "reinvest"`
- **td-monthly** → `payoutFrequency = "monthly"` → `interestTreatment = "payout"`
- **savings** → `payoutFrequency = "maturity"` → `interestTreatment = "reinvest"`

---

#### 4. State Transition Handling

- **Simple → Tiered:** Compounding toggle appears; `tiers` rates are seeded from current `flatRate`.
- **Tiered → Simple:** Compounding hidden; `flatRate` is restored from `tiers[0].rate`.
