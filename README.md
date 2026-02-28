# YieldFlow

**YieldFlow** is a high-precision investment tracking prototype designed for investors to monitor fixed-income yields and monthly cash flow. The application currently operates as a **local-only prototype**, focusing on calculation accuracy and a refined user experience before moving to a full-stack architecture.

## 🏗 Project Evolution & Roadmap

YieldFlow is a work in progress, transitioning from a client-side proof of concept to a fully synchronized investment platform.

- **Phase 1: Local Prototype (Current)**
  - Client-side architecture using `localStorage` for data persistence.
  - Development of the core financial engine and timezone-stable date logic.
  - Manual JSON backup/restore functionality for data portability.
- **Phase 2: Full-Stack Integration (Future)**
  - Implementation of a backend database for persistent account storage.
  - User authentication and cross-device synchronization.
  - Automated data backups and cloud-hosted records.

## 🚀 Core Functionality

- **Zero-Server Prototype:** No account required for testing. All data is managed locally in the browser's storage during this development phase.
- **Timezone-Stable Engine:** A custom "Local-First" date architecture solves the common 1-day drift bug found in UTC-based financial apps.
- **Yield Projections:** Real-time calculation of net yields, supporting tiered interest and tax deduction simulations.
- **Interactive Sandbox:** Includes a "Demo Mode" to explore the interface and logic with seeded data without needing to enter personal records.

## 🛠 Technical Implementation

- **Frontend:** Next.js 16+ (App Router), Tailwind CSS
- **UI Components:** Radix UI / Shadcn
- **State Management:** React Context API with a custom initialization guard to prevent layout flickering.
- **Storage:** Browser-native LocalStorage (Interim solution for prototype phase).

---

## 📥 Getting Started

1. **Clone the repository:**

   ```bash
   git clone [https://github.com/pbsabella/yieldflow.git](https://github.com/pbsabella/yieldflow.git)
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run the development server:**

   ```bash
   npm run dev
   ```
